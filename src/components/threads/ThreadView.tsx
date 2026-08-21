/* eslint-disable */
"use client";

import { useCallback, useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Trash2, Lock, LockOpen, Paperclip, FileText, Download, Image as ImageIcon, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";
import { sendThreadMessage, deleteThread, setThreadClosed } from "@/lib/actions/threads";
import { deleteMessage } from "@/lib/actions/messages";
import { THREAD_MESSAGE_MAX, MAX_FILES_PER_MESSAGE } from "@/lib/threads";
import { isAllowedAttachmentExtension, ATTACHMENT_ACCEPT } from "@/config/attachments";
import { FormButton } from "@/components/common/FormButton";
import { FormTextarea } from "@/components/common/FormTextarea";
import { buttonVariants } from "@/components/ui/button";
import { useConfirm } from "@/components/common/ConfirmDialogProvider";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlayerAvatar } from "@/components/common/PlayerAvatar";
import { MessageBubble } from "@/components/common/MessageBubble";
import { EmbedImage } from "@/components/common/EmbedImage";
import { ConversationEventMarker } from "@/components/common/ConversationEventMarker";
import { SelectedFilePreview } from "@/components/common/SelectedFilePreview";
import {
  VideoPlayer,
  VideoPlayerContent,
  VideoPlayerControlBar,
  VideoPlayerMuteButton,
  VideoPlayerPlayButton,
  VideoPlayerSeekBackwardButton,
  VideoPlayerSeekForwardButton,
  VideoPlayerTimeDisplay,
  VideoPlayerTimeRange,
} from "@/components/kibo-ui/video-player";
import { handleComposerKeyDown } from "@/lib/compose-keydown";
import { usePolling } from "@/hooks/usePolling";

type ThreadMessageType = "MESSAGE" | "CLOSED" | "REOPENED" | "STATUS_CHANGED";

interface AttachmentData {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
}

interface ThreadMessageData {
  attachments: AttachmentData[];
  id: string;
  type: ThreadMessageType;
  body: string;
  isDeleted: boolean;
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
  const handleDeleteMessage = useCallback(async (messageId: string) => {
    try {
      await deleteMessage(lang, messageId, window.location.pathname);
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, isDeleted: true } : m));
    } catch (e: unknown) {
      console.error("Failed to delete message:", e);
    }
  }, [lang]);
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
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
    if (!trimmed && files.length === 0) return;
    setError(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("lang", lang);
        formData.append("threadId", threadId);
        formData.append("body", trimmed);
        for (const file of files) formData.append("files", file);

        await sendThreadMessage(formData);
        setBody("");
        setFiles([]);
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
                  isDeleted={m.isDeleted}
                  onDelete={isDeleter || m.authorId === viewerId ? () => handleDeleteMessage(m.id) : undefined}
                  body={m.body}
                  children={
                    m.attachments && m.attachments.length > 0 ? (
                      <div className={cn("flex flex-wrap gap-2 mt-2", alignRight && "justify-end")}>
                        {m.attachments.map((a) => {
                          const isImg = a.mimeType.startsWith("image/");
                          const isVideo = a.mimeType.startsWith("video/");
                          const url = `/api/threads/attachments/${a.id}`;
                          if (isImg) {
                            return (
                              <EmbedImage
                                key={a.id}
                                url={url}
                                filename={a.filename}
                                className="block rounded-md overflow-hidden border border-border bg-black/20 hover:opacity-90 transition-opacity h-20 w-32 sm:h-24 sm:w-40"
                              />
                            );
                          }
                          if (isVideo) {
                            return (
                              <VideoPlayer key={a.id} className="w-full max-w-xs sm:max-w-sm aspect-video overflow-hidden rounded-md border border-border bg-black">
                                <VideoPlayerContent src={url} preload="metadata" className="w-full h-full object-contain" />
                                <VideoPlayerControlBar>
                                  <VideoPlayerPlayButton />
                                  <VideoPlayerSeekBackwardButton />
                                  <VideoPlayerSeekForwardButton />
                                  <VideoPlayerTimeRange />
                                  <VideoPlayerTimeDisplay />
                                  <VideoPlayerMuteButton />
                                </VideoPlayerControlBar>
                              </VideoPlayer>
                            );
                          }
                          return (
                            <a key={a.id} href={url} download>
                              <Badge variant="outline" className="flex items-center gap-2 py-1 px-2.5 bg-card/50 hover:bg-card hover:border-primary/30 transition-all text-xs font-normal">
                                <FileText size={12} className="opacity-60" />
                                <span className="truncate max-w-[150px]">{a.filename}</span>
                                <Download size={10} className="opacity-40" />
                              </Badge>
                            </a>
                          );
                        })}
                      </div>
                    ) : undefined
                  }
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
        {files.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-1 mb-1">
            {files.map((f, i) => (
              <SelectedFilePreview key={i} file={f} onRemove={() => setFiles((p) => p.filter((_, idx) => idx !== i))} />
            ))}
          </div>
        )}
        
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

          <div className="flex items-center gap-2">
            <label
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-2 font-normal cursor-pointer text-xs h-8 bg-card/50 hover:bg-card",
                (closed || isPending || files.length >= MAX_FILES_PER_MESSAGE) && "opacity-50 pointer-events-none"
              )}
            >
              <Paperclip size={13} />
              {t("attachmentsLabel")}
              <input
                id="thread-files"
                type="file"
                multiple
                accept={ATTACHMENT_ACCEPT}
                onChange={(e) => {
                  if (e.target.files) {
                    const picked = Array.from(e.target.files);
                    const invalid = picked.filter((f) => !isAllowedAttachmentExtension(f.name));
                    if (invalid.length > 0) {
                      setError(t("errors.invalidFileType", { name: invalid.map((f) => f.name).join(", ") }));
                    }
                    const valid = picked.filter((f) => isAllowedAttachmentExtension(f.name));
                    if (files.length + valid.length > MAX_FILES_PER_MESSAGE) {
                      setError(t("errors.tooManyFiles", { max: MAX_FILES_PER_MESSAGE }));
                    } else if (valid.length > 0) {
                      setFiles((prev) => [...prev, ...valid]);
                    }
                    e.target.value = "";
                  }
                }}
                className="hidden"
                disabled={closed || isPending}
              />
            </label>

            <FormButton type="submit" disabled={closed || isPending || (!body.trim() && files.length === 0)} className="px-6 py-2 text-xs">
            {isPending ? t("sending") : t("send")}
          </FormButton>
          </div>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}
      </form>
    </div>
  );
}
