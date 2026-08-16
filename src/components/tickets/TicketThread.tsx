"use client";

import { useCallback, useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Trash2, Lock, LockOpen, Paperclip, FileText, Download, X, Image as ImageIcon, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";
import { sendTicketMessage, setTicketStatus, deleteTicket } from "@/lib/actions/tickets";
import { TICKET_MESSAGE_MAX } from "@/lib/tickets";
import { FormButton } from "@/components/common/FormButton";
import { FormTextarea } from "@/components/common/FormTextarea";
import { buttonVariants } from "@/components/ui/button";
import { useConfirm } from "@/components/common/ConfirmDialogProvider";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlayerAvatar } from "@/components/common/PlayerAvatar";
import { MessageBubble } from "@/components/common/MessageBubble";
import { ConversationEventMarker } from "@/components/common/ConversationEventMarker";
import { handleComposerKeyDown } from "@/lib/compose-keydown";
import { usePolling } from "@/hooks/usePolling";
import { TicketStatusBadge } from "./TicketStatusBadge";
import type { TicketStatus } from ".prisma/site-client";

interface AttachmentData {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
}

interface TicketMessageData {
  id: string;
  type: "MESSAGE" | "CLOSED" | "REOPENED";
  body: string;
  isAdminReply: boolean;
  createdAt: string;
  authorNickname: string;
  authorSkinUrl: string | null;
  attachments?: AttachmentData[];
}

interface TicketThreadProps {
  lang: string;
  ticketId: string;
  subject: string;
  initialStatus: TicketStatus;
  initialMessages: TicketMessageData[];
  /** Whether the current viewer is ticket staff (isAdmin, or holds tickets-view/tickets-edit) — controls which side of the thread their own messages render on and whether replies show as anonymized "staff". */
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
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block group/img rounded-xl overflow-hidden border border-primary/15 bg-card/40 hover:border-primary/30 transition-colors"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={att.filename}
        onError={() => setFailed(true)}
        className="max-w-full max-h-[280px] object-contain rounded-xl"
        loading="lazy"
      />
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-[0.65rem] text-foreground/45">
        <ImageIcon size={11} className="shrink-0" />
        <span className="truncate">{att.filename}</span>
        <span className="shrink-0 ml-auto">{formatFileSize(att.size)}</span>
      </div>
    </a>
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

export function TicketThread({ lang, ticketId, subject, initialStatus, initialMessages, isStaff, canEdit, canDelete, backHref }: TicketThreadProps) {
  const t = useTranslations("Tickets");
  const confirm = useConfirm();
  const router = useRouter();
  const [status, setStatus] = useState<TicketStatus>(initialStatus);
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`);
      if (!res.ok) return;
      const data = await res.json();
      setStatus(data.status);
      setMessages(data.messages);
    } catch {
      // Silent — a missed poll just tries again next interval.
    }
  }, [ticketId]);

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


  function handleStatusChange(next: "OPEN" | "CLOSED") {
    startTransition(async () => {
      try {
        await setTicketStatus(lang, ticketId, next);
        setStatus(next);
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

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4 shrink-0">
        <TicketStatusBadge status={status} label={t(`status.${status}`)} />
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
              // Two-sided thread: "staff" (any admin reply) on one side, the
              // ticket owner on the other.
              const alignRight = isStaff ? m.isAdminReply : !m.isAdminReply;
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
        {status === "CLOSED" && <p className="text-xs text-foreground/40">{t("closedHint")}</p>}
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
            {canEdit && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleStatusChange(status === "CLOSED" ? "OPEN" : "CLOSED")}
                aria-label={status === "CLOSED" ? t("reopenTicket") : t("closeTicket")}
                title={status === "CLOSED" ? t("reopenTicket") : t("closeTicket")}
                className={cn(
                  buttonVariants({ variant: "outline", size: "icon-sm" }),
                  "bg-card/50 hover:bg-card/80"
                )}
              >
                {status === "CLOSED" ? <LockOpen size={14} /> : <Lock size={14} />}
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
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                  e.target.value = "";
                }
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-1.5 text-[0.7rem] bg-card/50 hover:bg-card/80"
              )}
            >
              <Paperclip size={13} />
              {t("attachmentsLabel")}
            </button>
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
