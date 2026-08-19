"use client";

import { useCallback, useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Trash2, Lock, LockOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";
import { sendThreadMessage, deleteThread, setThreadClosed } from "@/lib/actions/threads";
import { THREAD_MESSAGE_MAX } from "@/lib/threads";
import { FormButton } from "@/components/common/FormButton";
import { FormTextarea } from "@/components/common/FormTextarea";
import { buttonVariants } from "@/components/ui/button";
import { useConfirm } from "@/components/common/ConfirmDialogProvider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlayerAvatar } from "@/components/common/PlayerAvatar";
import { MessageBubble } from "@/components/common/MessageBubble";
import { ConversationEventMarker } from "@/components/common/ConversationEventMarker";
import { handleComposerKeyDown } from "@/lib/compose-keydown";
import { usePolling } from "@/hooks/usePolling";

type ThreadMessageType = "MESSAGE" | "CLOSED" | "REOPENED" | "STATUS_CHANGED";

interface ThreadMessageData {
  id: string;
  type: ThreadMessageType;
  body: string;
  createdAt: string;
  authorId: string;
  authorNickname: string;
  authorSkinUrl: string | null;
}

interface ThreadViewProps {
  lang: string;
  threadId: string;
  title: string;
  initialClosed: boolean;
  initialMessages: ThreadMessageData[];
  /** The signed-in viewer's own user id — own messages align right, everyone else's align left (an open forum has more than 2 possible participants, unlike a ticket's fixed staff/owner split). */
  viewerId: string;
  /** Author (or a moderator) can close/reopen; only a threads-delete holder can delete outright. */
  isAuthor: boolean;
  /** isAdmin, or holds threads-edit — see isThreadModerator() in src/lib/threads.ts. */
  isModerator: boolean;
  /** isAdmin, or holds threads-delete — independent of isModerator (see RESOURCE_ROLE_ACTIONS's doc comment), see isThreadDeleter() in src/lib/threads.ts. */
  isDeleter: boolean;
  /** Where to send the viewer after deleting the thread, since it no longer exists to render. */
  backHref: string;
}

const POLL_INTERVAL_MS = 8000;

/** Close/reopen event row — ThreadView's translation/label for the shared ConversationEventMarker. */
function ThreadEventMarker({ event, t, lang }: { event: ThreadMessageData; t: ReturnType<typeof useTranslations>; lang: string }) {
  const label = t(event.type === "CLOSED" ? "threadClosedEvent" : "threadReopenedEvent", { nickname: event.authorNickname });
  return <ConversationEventMarker type={event.type as "CLOSED" | "REOPENED"} label={label} createdAt={event.createdAt} lang={lang} />;
}

export function ThreadView({
  lang, threadId, title, initialClosed, initialMessages, viewerId, isAuthor, isModerator, isDeleter, backHref,
}: ThreadViewProps) {
  const t = useTranslations("Threads");
  const confirm = useConfirm();
  const router = useRouter();
  const [closed, setClosed] = useState(initialClosed);
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  // A ref (not derived from `messages` state) so `poll`'s own identity stays
  // stable across polls — see TicketThread.tsx's matching comment.
  const latestCreatedAtRef = useRef<string | undefined>(initialMessages.at(-1)?.createdAt);

  const canModerate = isAuthor || isModerator;

  const poll = useCallback(async () => {
    try {
      const since = latestCreatedAtRef.current;
      const url = since
        ? `/api/threads/${threadId}?since=${encodeURIComponent(since)}`
        : `/api/threads/${threadId}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      // Server-side `since` already narrows to what's actually new — this
      // just appends it (messages only ever get appended here, never
      // edited/removed), skipping a re-render entirely when there's nothing
      // new instead of unconditionally replacing the array every 8s cycle.
      if (data.messages.length > 0) {
        setMessages((prev) => {
          const newOnes = (data.messages as ThreadMessageData[]).filter(
            (m) => !prev.some((existing) => existing.id === m.id)
          );
          if (newOnes.length === 0) return prev;
          latestCreatedAtRef.current = newOnes[newOnes.length - 1].createdAt;
          return [...prev, ...newOnes];
        });
      }
      setClosed(data.closed);
    } catch {
      // Silent — a missed poll just tries again next interval.
    }
  }, [threadId]);

  // A closed thread can't receive new messages (see sendThreadMessage), so
  // there's nothing left for polling to ever pick up — `enabled: !closed`
  // stops the interval entirely rather than just discarding its result.
  usePolling(poll, POLL_INTERVAL_MS, !closed);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  function submitMessage() {
    const trimmed = body.trim();
    if (!trimmed) return;
    setError(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("lang", lang);
        formData.append("threadId", threadId);
        formData.append("body", trimmed);

        await sendThreadMessage(formData);
        setBody("");
        await poll();
      } catch (err) {
        setError((err instanceof Error && err.message) || t("errors.generic"));
      }
    });
  }

  function handleSend(e: FormEvent) {
    e.preventDefault();
    submitMessage();
  }

  function handleToggleClosed() {
    const next = !closed;
    startTransition(async () => {
      try {
        await setThreadClosed(lang, threadId, next);
        setClosed(next);
        await poll();
      } catch {
        setError(t("errors.generic"));
      }
    });
  }

  async function handleDelete() {
    if (!(await confirm({ description: t("confirmDeleteThread", { title }), variant: "destructive" }))) return;
    startTransition(async () => {
      try {
        await deleteThread(lang, threadId);
        router.push(backHref);
      } catch {
        setError(t("errors.generic"));
      }
    });
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Messages area — fills remaining height */}
      <ScrollArea className="flex-1 min-h-0 rounded-2xl border border-primary/15 bg-card">
        <div className="flex flex-col gap-3 p-4">
          {messages.length === 0 ? (
            <p className="text-center text-foreground/40 text-sm py-6">{t("noMessages")}</p>
          ) : (
            messages.map((m) => {
              if (m.type !== "MESSAGE") {
                return <ThreadEventMarker key={m.id} event={m} t={t} lang={lang} />;
              }
              const alignRight = m.authorId === viewerId;
              return (
                <MessageBubble
                  key={m.id}
                  alignRight={alignRight}
                  lang={lang}
                  createdAt={m.createdAt}
                  body={m.body}
                  header={
                    <PlayerAvatar
                      name={m.authorNickname}
                      skinUrl={m.authorSkinUrl}
                      hasSiteProfile
                      growName={false}
                      avatarSize={18}
                      avatarClassName="rounded-sm border-none"
                      className="px-1 gap-1.5"
                      nameNode={
                        <span className="text-[0.65rem] text-foreground/50 hover:text-foreground/80 transition-colors">
                          {m.authorNickname}
                        </span>
                      }
                    />
                  }
                />
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Reply form — disabled while the thread is closed, but still visible (nothing else changes) */}
      <form onSubmit={handleSend} className="flex flex-col gap-2 mt-4 shrink-0">
        {closed && <p className="text-xs text-foreground/40">{t("closedHint")}</p>}
        <FormTextarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => handleComposerKeyDown(e, submitMessage)}
          maxLength={THREAD_MESSAGE_MAX}
          rows={3}
          placeholder={t("replyPlaceholder")}
          disabled={closed}
        />

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {canModerate && (
              <button
                type="button"
                disabled={isPending}
                onClick={handleToggleClosed}
                aria-label={closed ? t("reopenThread") : t("closeThread")}
                title={closed ? t("reopenThread") : t("closeThread")}
                className={cn(
                  buttonVariants({ variant: "outline", size: "icon-sm" }),
                  "bg-card/50 hover:bg-card/80"
                )}
              >
                {closed ? <LockOpen size={14} /> : <Lock size={14} />}
              </button>
            )}
            {isDeleter && (
              <button
                type="button"
                disabled={isPending}
                onClick={handleDelete}
                aria-label={t("deleteThread")}
                title={t("deleteThread")}
                className={cn(
                  buttonVariants({ variant: "outline", size: "icon-sm" }),
                  "bg-card/70 hover:text-destructive hover:border-destructive/40"
                )}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          <FormButton type="submit" disabled={closed || isPending || !body.trim()} className="px-6 py-2 text-xs">
            {isPending ? t("sending") : t("send")}
          </FormButton>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}
      </form>
    </div>
  );
}
