/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useCallback, useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Trash2, Lock, LockOpen, Paperclip, FileText, Download, X, Image as ImageIcon, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";
import { sendTicketMessage, setTicketStatus, deleteTicket } from "@/lib/actions/tickets";
import { deleteMessage } from "@/lib/actions/messages";
import { TICKET_MESSAGE_MAX, MAX_FILES_PER_MESSAGE } from "@/lib/tickets";
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
import { handleComposerKeyDown } from "@/lib/compose-keydown";
import { usePolling } from "@/hooks/usePolling";
import { TicketStatusBadge } from "./TicketStatusBadge";


interface AttachmentData {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
}

interface TicketMessageData {
  id: string;
  type: "MESSAGE" | "CLOSED" | "REOPENED" | "STATUS_CHANGED";
  body: string;
  isDeleted: boolean;
  isAdminReply: boolean;
  createdAt: string;
  authorId: string;
  authorNickname: string;
  authorSkinUrl: string | null;
  
  newStatusName?: string;
attachments?: AttachmentData[];
}

interface TicketThreadProps {
  lang: string;
  ticketId: string;
  subject: string;
  initialStatus: any;
  initialMessages: TicketMessageData[];
  /** The current viewer's own User.id — which side of the thread a message renders on compares against this directly (m.authorId === viewerId), not staff-vs-owner grouping, so it stays correct even with multiple staff replying to the same ticket. */
  viewerId: string;
  /** Whether the current viewer is ticket staff (isAdmin, or holds tickets-view/tickets-edit) — controls only the anonymization of *other* staff members' replies and the "staff" label suffix, not which side a message renders on. */
  isStaff: boolean;
  /** Narrower than isStaff — tickets-edit (or isAdmin) only. Controls the close/reopen control. */
  canEdit: boolean;
  /** tickets-delete (or isAdmin) — independent of canEdit (see RESOURCE_ROLE_ACTIONS's doc comment), controls the delete control specifically. */
  canDelete: boolean;
  /** Where to send the admin after deleting the ticket, since it no longer exists to render. */
  backHref: string;
}

const POLL_INTERVAL_MS = 8000;

function isImageMime(mime: string): boolean {
  return mime.startsWith("image/");
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/* ---------- Attachment renderers ---------- */

function AttachmentImageError({ att }: { att: AttachmentData }) {
  const t = useTranslations("Tickets");
  const url = `/api/tickets/attachments/${att.id}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-destructive/25 bg-destructive/5 hover:border-destructive/40 hover:bg-destructive/10 transition-colors group/file"
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-destructive/10 shrink-0">
        <ImageOff size={16} className="text-destructive/70" />
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-xs text-foreground/80 truncate">{att.filename}</span>
        <span className="text-[0.6rem] text-destructive/60">{t("imageLoadError")}</span>
      </div>
    </a>
  );
}

function AttachmentImage({ att }: { att: AttachmentData }) {
  const [failed, setFailed] = useState(false);
  const url = `/api/tickets/attachments/${att.id}`;

  if (failed) return <AttachmentImageError att={att} />;

  return (
    <EmbedImage
      url={url}
      filename={att.filename}
      className="block group/img rounded-xl overflow-hidden border border-primary/15 bg-card/40 hover:border-primary/30 transition-colors w-max"
      imgClassName="max-w-full max-h-[280px] object-contain rounded-xl"
      onError={() => setFailed(true)}
    />
  );
}

function AttachmentFile({ att }: { att: AttachmentData }) {
  const url = `/api/tickets/attachments/${att.id}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-primary/15 bg-card/40 hover:border-primary/30 hover:bg-card/60 transition-colors group/file"
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 shrink-0">
        <FileText size={16} className="text-primary/60" />
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-xs text-foreground/80 truncate">{att.filename}</span>
        <span className="text-[0.6rem] text-foreground/35">{formatFileSize(att.size)}</span>
      </div>
      <Download size={14} className="text-foreground/30 group-hover/file:text-primary/60 transition-colors shrink-0" />
    </a>
  );
}

function MessageAttachments({ attachments }: { attachments: AttachmentData[] }) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 mt-2">
      {attachments.map((att) =>
        isImageMime(att.mimeType) ? (
          <AttachmentImage key={att.id} att={att} />
        ) : (
          <AttachmentFile key={att.id} att={att} />
        )
      )}
    </div>
  );
}

/* ---------- Selected files preview ---------- */

function SelectedFileChip({ file, onRemove }: { file: File; onRemove: () => void }) {
  return (
    <Badge
      variant="secondary"
      className="h-auto gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border-primary/20 text-foreground/70 text-[0.65rem]"
    >
      <Paperclip size={10} className="shrink-0 opacity-50" />
      <span className="truncate max-w-[120px]">{file.name}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 hover:text-destructive transition-colors"
        aria-label={`Remove ${file.name}`}
      >
        <X size={10} />
      </button>
    </Badge>
  );
}

/* ---------- Event marker ---------- */

/**
 * Close/reopen event row — TicketThread's translation/label for the shared
 * ConversationEventMarker. Anonymizes the acting staff member the same way
 * a staff reply's PlayerAvatar is hidden below (isAdminReply && !isStaff):
 * a non-staff viewer sees "closed by Administrator", never the specific
 * staff nickname.
 */
function TicketEventMarker({ event, t, lang, isStaff }: { event: TicketMessageData; t: ReturnType<typeof useTranslations>; lang: string; isStaff: boolean }) {
  const nickname = event.isAdminReply && !isStaff ? t("adminName") : event.authorNickname;
  const label = t(event.type === "CLOSED" ? "ticketClosedEvent" : "ticketReopenedEvent", { nickname });
  return <ConversationEventMarker type={event.type as "CLOSED" | "REOPENED"} label={label} createdAt={event.createdAt} lang={lang} />;
}

/* ---------- Main component ---------- */

export function TicketThread({ lang, ticketId, subject, initialStatus, initialMessages, viewerId, isStaff, canEdit, canDelete, backHref }: TicketThreadProps) {
  const t = useTranslations("Tickets");
  const confirm = useConfirm();
  const router = useRouter();
  const [status, setStatus] = useState<any>(initialStatus);
  const [transitions, setTransitions] = useState<any[]>([]);
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
  // stable across polls — depending on `messages` directly would give
  // usePolling a new callback (and so a torn-down/recreated interval) every
  // time a poll actually finds something new.
  const latestCreatedAtRef = useRef<string | undefined>(initialMessages.at(-1)?.createdAt);

  const poll = useCallback(async () => {
    try {
      const since = latestCreatedAtRef.current;
      const url = since
        ? `/api/tickets/${ticketId}?since=${encodeURIComponent(since)}`
        : `/api/tickets/${ticketId}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      setStatus(data.status);
      if (data.transitions) setTransitions(data.transitions);
      // Server-side `since` already excludes anything the client has seen —
      // this id-based filter is just a safety net against the same message
      // arriving twice (e.g. a retried request), not the primary dedup.
      setMessages((prev) => {
        const newOnes = (data.messages as TicketMessageData[]).filter(
          (m) => !prev.some((existing) => existing.id === m.id)
        );
        if (newOnes.length === 0) return prev;
        latestCreatedAtRef.current = newOnes[newOnes.length - 1].createdAt;
        return [...prev, ...newOnes];
      });
    } catch {
      // Silent — a missed poll just tries again next interval.
    }
  }, [ticketId]);

  // transitions (needed to resolve a real close/reopen status id below) only
  // comes from the poll endpoint, not the server-rendered initial props — so
  // canEdit viewers need one poll right away rather than waiting out the
  // first interval, same as ApplicationThread's equivalent effect.
  useEffect(() => {
    if (canEdit) poll();
  }, [canEdit, poll]);

  usePolling(poll, POLL_INTERVAL_MS);

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
        formData.append("ticketId", ticketId);
        formData.append("body", trimmed);
        files.forEach(f => formData.append("files", f));

        await sendTicketMessage(formData);
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


  function handleStatusChange(targetStatusId: string) {
    startTransition(async () => {
      try {
        await setTicketStatus(lang, ticketId, targetStatusId);
        await poll();
      } catch {
        setError(t("errors.generic"));
      }
    });
  }

  async function handleDelete() {
    if (!(await confirm({ description: t("confirmDeleteTicket", { subject }), variant: "destructive" }))) return;
    startTransition(async () => {
      try {
        await deleteTicket(lang, ticketId);
        router.push(backHref);
      } catch {
        setError(t("errors.generic"));
      }
    });
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  // `status` is the full WorkflowStatus object (see initialStatus's doc
  // comment on the props interface), not an "OPEN"/"CLOSED" string — the
  // close/reopen button resolves the actual target status id from the
  // available transitions rather than guessing a literal.
  const isClosed = status?.isClosed === true;
  const closeReopenTarget = transitions.find((tr) => tr.isClosed !== isClosed);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4 shrink-0">
        <TicketStatusBadge status={status} />
      </div>

      {/* Messages area — fills remaining height */}
      <ScrollArea className="flex-1 min-h-0 rounded-2xl border border-primary/15 bg-card/30">
        <div className="flex flex-col gap-3 p-4">
          {messages.length === 0 ? (
            <p className="text-center text-foreground/40 text-sm py-6">{t("noMessages")}</p>
          ) : (
            messages.map((m) => {
              if (m.type !== "MESSAGE") {
                return <TicketEventMarker key={m.id} event={m} t={t} lang={lang} isStaff={isStaff} />;
              }
              // Which side of the thread this message renders on — the
              // viewer's own messages, specifically, not "staff" as a group.
              // With more than one staff member replying to the same ticket,
              // grouping by role would put a colleague's reply on "your"
              // side even though you didn't write it.
              const alignRight = m.authorId === viewerId;
              // A non-staff viewer sees which staff member replied only as
              // "Administrator" (t("adminName")) — no name, no head, no
              // profile link, unlike every other message — so that case
              // skips PlayerAvatar entirely rather than just hiding it
              // visually.
              const anonymized = m.isAdminReply && !isStaff;
              return (
                <MessageBubble
                  key={m.id}
                  alignRight={alignRight}
                  lang={lang}
                  createdAt={m.createdAt}
                  isDeleted={m.isDeleted}
                  onDelete={canDelete || m.authorId === viewerId ? () => handleDeleteMessage(m.id) : undefined}
                  body={m.body}
                  header={
                    anonymized ? (
                      <span className="text-[0.65rem] text-foreground/40 px-1">{t("adminName")}</span>
                    ) : (
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
                            {m.isAdminReply && isStaff && ` · ${t("staffLabel")}`}
                          </span>
                        }
                      />
                    )
                  }
                >
                  {m.attachments && m.attachments.length > 0 && (
                    <MessageAttachments attachments={m.attachments} />
                  )}
                </MessageBubble>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Reply form */}
      <form onSubmit={handleSend} className="flex flex-col gap-2 mt-4 shrink-0">
        {isClosed && <p className="text-xs text-foreground/40">{t("closedHint")}</p>}
        <FormTextarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => handleComposerKeyDown(e, submitMessage)}
          maxLength={TICKET_MESSAGE_MAX}
          rows={3}
          placeholder={t("replyPlaceholder")}
        />
        
        {/* Selected files preview */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {files.map((f, i) => (
              <SelectedFileChip key={`${f.name}-${i}`} file={f} onRemove={() => removeFile(i)} />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {canEdit && closeReopenTarget && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleStatusChange(closeReopenTarget.id)}
                aria-label={isClosed ? t("reopenTicket") : t("closeTicket")}
                title={isClosed ? t("reopenTicket") : t("closeTicket")}
                className={cn(
                  buttonVariants({ variant: "outline", size: "icon-sm" }),
                  "bg-card/50 hover:bg-card/80"
                )}
              >
                {isClosed ? <LockOpen size={14} /> : <Lock size={14} />}
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                disabled={isPending}
                onClick={handleDelete}
                aria-label={t("deleteTicket")}
                title={t("deleteTicket")}
                className={cn(
                  buttonVariants({ variant: "outline", size: "icon-sm" }),
                  "bg-card/70 hover:text-destructive hover:border-destructive/40"
                )}
              >
                <Trash2 size={14} />
              </button>
            )}
            {/* <label htmlFor> instead of a hidden input triggered via
                ref.click() — opens the native file dialog through plain
                browser behavior, not a JS-simulated click. */}
            <label
              htmlFor="ticket-thread-files"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-1.5 text-[0.7rem] bg-card/50 hover:bg-card/80 cursor-pointer"
              )}
            >
              <Paperclip size={13} />
              {t("attachmentsLabel")}
            </label>
            <input
              id="ticket-thread-files"
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
            />
          </div>

          <FormButton type="submit" disabled={isPending || (!body.trim() && files.length === 0)} className="px-6 py-2 text-xs">
            {isPending ? t("sending") : t("send")}
          </FormButton>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}
      </form>
    </div>
  );
}
