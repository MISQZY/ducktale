"use client";

import { useCallback, useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Trash2, Paperclip, FileText, Download, X, Image as ImageIcon, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";
import { sendReportMessage, setany, deleteReport } from "@/lib/actions/reports";
import { REPORT_MESSAGE_MAX, MAX_FILES_PER_MESSAGE } from "@/lib/reports";
import { isAllowedAttachmentExtension, ATTACHMENT_ACCEPT } from "@/config/attachments";
import { FormButton } from "@/components/common/FormButton";
import { FormTextarea } from "@/components/common/FormTextarea";
import { formInputClasses, formInputStyle } from "@/components/common/form-styles";
import { buttonVariants } from "@/components/ui/button";
import { useConfirm } from "@/components/common/ConfirmDialogProvider";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlayerAvatar } from "@/components/common/PlayerAvatar";
import { MessageBubble } from "@/components/common/MessageBubble";
import { handleComposerKeyDown } from "@/lib/compose-keydown";
import { usePolling } from "@/hooks/usePolling";
import { ReportStatusBadge } from "./ReportStatusBadge";


interface AttachmentData {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
}

interface ReportMessageData {
  id: string;
  body: string;
  isAdminReply: boolean;
  createdAt: string;
  authorId: string;
  authorNickname: string;
  authorSkinUrl: string | null;
  attachments?: AttachmentData[];
}

interface ReportThreadProps {
  lang: string;
  reportId: string;
  reportedName: string;
  initialStatus: any;
  initialMessages: ReportMessageData[];
  /** The current viewer's own User.id — which side of the thread a message renders on compares against this directly (m.authorId === viewerId), not staff-vs-reporter grouping, so it stays correct even with multiple staff replying to the same report. */
  viewerId: string;
  /** Whether the current viewer is report staff (isAdmin, or holds reports-view) — controls only the anonymization of *other* staff members' replies, not which side a message renders on. */
  isStaff: boolean;
  /** Narrower than isStaff — reports-edit specifically. Controls the status controls. */
  canEdit: boolean;
  /** reports-delete (or isAdmin) — independent of canEdit. */
  canDelete: boolean;
  /** Where to send the admin after deleting the report, since it no longer exists to render. */
  backHref: string;
}

const POLL_INTERVAL_MS = 8000;
const TERMINAL_STATUSES: any[] = ["RESOLVED", "REJECTED"];

function isImageMime(mime: string): boolean {
  return mime.startsWith("image/");
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/* ---------- Attachment renderers (mirrors TicketThread's own set) ---------- */

function AttachmentImageError({ att }: { att: AttachmentData }) {
  const t = useTranslations("Reports");
  const url = `/api/reports/attachments/${att.id}`;

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
  const url = `/api/reports/attachments/${att.id}`;

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
  const url = `/api/reports/attachments/${att.id}`;

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

/* ---------- Main component ---------- */

export function ReportThread({ lang, reportId, reportedName, initialStatus, initialMessages, viewerId, isStaff, canEdit, canDelete, backHref }: ReportThreadProps) {
  const t = useTranslations("Reports");
  const confirm = useConfirm();
  const router = useRouter();
  const [status, setStatus] = useState<any>(initialStatus);
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const latestCreatedAtRef = useRef<string | undefined>(initialMessages.at(-1)?.createdAt);

  const isTerminal = TERMINAL_STATUSES.includes(status);

  const poll = useCallback(async () => {
    try {
      const since = latestCreatedAtRef.current;
      const url = since
        ? `/api/reports/${reportId}?since=${encodeURIComponent(since)}`
        : `/api/reports/${reportId}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      setStatus(data.status);
      setMessages((prev) => {
        const newOnes = (data.messages as ReportMessageData[]).filter(
          (m) => !prev.some((existing) => existing.id === m.id)
        );
        if (newOnes.length === 0) return prev;
        latestCreatedAtRef.current = newOnes[newOnes.length - 1].createdAt;
        return [...prev, ...newOnes];
      });
    } catch {
      // Silent — a missed poll just tries again next interval.
    }
  }, [reportId]);

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
        formData.append("reportId", reportId);
        formData.append("body", trimmed);
        files.forEach((f) => formData.append("files", f));

        await sendReportMessage(formData);
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

  function handleStatusChange(next: any) {
    startTransition(async () => {
      try {
        await setany(lang, reportId, next);
        setStatus(next);
      } catch {
        setError(t("errors.generic"));
      }
    });
  }

  async function handleDelete() {
    if (!(await confirm({ description: t("confirmDeleteReport", { name: reportedName }), variant: "destructive" }))) return;
    startTransition(async () => {
      try {
        await deleteReport(lang, reportId);
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
        <ReportStatusBadge status={status} label={t(`status.${status}`)} />

        {canEdit && (
          <div className="flex items-center gap-2 text-xs text-foreground/50">
            <span>{t("setStatus")}</span>
            <select
              value={status}
              disabled={isPending}
              onChange={(e) => handleStatusChange(e.target.value as any)}
              className={formInputClasses(false, "h-8 py-0 text-xs w-auto")}
              style={formInputStyle}
            >
              <option value="OPEN">{t("status.OPEN")}</option>
              <option value="IN_REVIEW">{t("markInReview")}</option>
              <option value="RESOLVED">{t("markResolved")}</option>
              <option value="REJECTED">{t("markRejected")}</option>
            </select>
          </div>
        )}
      </div>

      {/* Messages area — fills remaining height */}
      <ScrollArea className="flex-1 min-h-0 rounded-2xl border border-primary/15 bg-card/30">
        <div className="flex flex-col gap-3 p-4">
          {messages.length === 0 ? (
            <p className="text-center text-foreground/40 text-sm py-6">{t("noMessages")}</p>
          ) : (
            messages.map((m) => {
              // Which side of the thread this message renders on — the
              // viewer's own messages, specifically, not "staff" as a group.
              // With more than one staff member replying to the same report,
              // grouping by role would put a colleague's reply on "your"
              // side even though you didn't write it.
              const alignRight = m.authorId === viewerId;
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
        {isTerminal && <p className="text-xs text-foreground/40">{t("closedHint")}</p>}
        <FormTextarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => handleComposerKeyDown(e, submitMessage)}
          maxLength={REPORT_MESSAGE_MAX}
          rows={3}
          disabled={isTerminal}
          placeholder={t("replyPlaceholder")}
        />

        {files.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {files.map((f, i) => (
              <SelectedFileChip key={`${f.name}-${i}`} file={f} onRemove={() => removeFile(i)} />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {canDelete && (
              <button
                type="button"
                disabled={isPending}
                onClick={handleDelete}
                aria-label={t("deleteReport")}
                title={t("deleteReport")}
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
                browser behavior, not a JS-simulated click. A <label> has no
                `disabled` of its own, but a click on it targeting a disabled
                input is a no-op per spec (browsers don't open the dialog) —
                pointer-events-none/opacity backs that up visually. */}
            <label
              htmlFor="report-thread-files"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-1.5 text-[0.7rem] bg-card/50 hover:bg-card/80",
                isTerminal ? "opacity-50 pointer-events-none" : "cursor-pointer"
              )}
            >
              <Paperclip size={13} />
              {t("attachmentsLabel")}
            </label>
            <input
              id="report-thread-files"
              type="file"
              multiple
              accept={ATTACHMENT_ACCEPT}
              disabled={isTerminal}
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

          <FormButton type="submit" disabled={isPending || isTerminal || (!body.trim() && files.length === 0)} className="px-6 py-2 text-xs">
            {isPending ? t("sending") : t("send")}
          </FormButton>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}
      </form>
    </div>
  );
}
