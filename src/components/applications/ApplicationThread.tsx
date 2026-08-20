/* eslint-disable */
"use client";

import { useCallback, useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Trash2, Paperclip, FileText, Download, X, Image as ImageIcon, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";
import { sendApplicationMessage, setApplicationStatus, deleteApplication } from "@/lib/actions/applications";
import { deleteMessage } from "@/lib/actions/messages";
import { APPLICATION_MESSAGE_MAX, MAX_FILES_PER_MESSAGE } from "@/lib/applications";
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
import { ConversationEventMarker } from "@/components/common/ConversationEventMarker";
import { EmbedImage } from "@/components/common/EmbedImage";
import { handleComposerKeyDown } from "@/lib/compose-keydown";
import { usePolling } from "@/hooks/usePolling";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { localizedName } from "@/lib/i18n-name";


interface AttachmentData {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
}

interface ApplicationMessageData {
  id: string;
  body: string;
  isDeleted: boolean;
  isAdminReply: boolean;
  createdAt: string;
  authorId: string;
  authorNickname: string;
  authorSkinUrl: string | null;
  type: string;
  newStatusName?: string;
attachments?: AttachmentData[];
}

interface ApplicationThreadProps {
  lang: string;
  applicationId: string;
  applicantName: string;
  initialStatus: any;
  initialMessages: ApplicationMessageData[];
  /** The current viewer's own User.id — which side of the thread a message renders on compares against this directly (m.authorId === viewerId), not staff-vs-applicant grouping, so it stays correct even with multiple staff replying to the same application. */
  viewerId: string;
  /** Whether the current viewer is application staff (isAdmin, or holds applications-view) — controls only the anonymization of *other* staff members' replies, not which side a message renders on. */
  isStaff: boolean;
  /** Narrower than isStaff — applications-edit specifically. Controls the status controls. */
  canEdit: boolean;
  /** applications-delete (or isAdmin) — independent of canEdit. */
  canDelete: boolean;
  /** Where to send the admin after deleting the application, since it no longer exists to render. */
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

/* ---------- Attachment renderers (mirrors ReportThread's own set) ---------- */

function AttachmentImageError({ att }: { att: AttachmentData }) {
  const t = useTranslations("Applications");
  const url = `/api/applications/attachments/${att.id}`;

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
  const url = `/api/applications/attachments/${att.id}`;

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
  const url = `/api/applications/attachments/${att.id}`;

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

export function ApplicationThread({ lang, applicationId, applicantName, initialStatus, initialMessages, viewerId, isStaff, canEdit, canDelete, backHref }: ApplicationThreadProps) {
  const t = useTranslations("Applications");
  const confirm = useConfirm();
  const router = useRouter();
  const [status, setStatus] = useState<any>(initialStatus);
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
  const latestCreatedAtRef = useRef<string | undefined>(initialMessages.at(-1)?.createdAt);

  const isTerminal = status?.isClosed;
  const [transitions, setTransitions] = useState<any[]>([]);

  const poll = useCallback(async () => {
    try {
      const since = latestCreatedAtRef.current;
      const url = since
        ? `/api/applications/${applicationId}?since=${encodeURIComponent(since)}`
        : `/api/applications/${applicationId}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      setStatus(data.status);
      if (data.transitions) setTransitions(data.transitions);
      setMessages((prev) => {
        const newOnes = (data.messages as ApplicationMessageData[]).filter(
          (m) => !prev.some((existing) => existing.id === m.id)
        );
        if (newOnes.length === 0) return prev;
        latestCreatedAtRef.current = newOnes[newOnes.length - 1].createdAt;
        return [...prev, ...newOnes];
      });
    } catch {
      // Silent
    }
  }, [applicationId]);

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
        formData.append("applicationId", applicationId);
        formData.append("body", trimmed);
        files.forEach((f) => formData.append("files", f));

        await sendApplicationMessage(formData);
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

  function handleStatusChange(next: string) {
    startTransition(async () => {
      try {
        await setApplicationStatus(lang, applicationId, next);
        await poll();
      } catch {
        setError(t("errors.generic"));
      }
    });
  }

  async function handleDelete() {
    if (!(await confirm({ description: t("confirmDeleteApplication", { name: applicantName }), variant: "destructive" }))) return;
    startTransition(async () => {
      try {
        await deleteApplication(lang, applicationId);
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
        <ApplicationStatusBadge status={status} />

        {canEdit && transitions.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-foreground/50">
            <span>{t("setStatus")}</span>
            <Select disabled={isPending} value={status?.id || ""} onValueChange={handleStatusChange}>
              <SelectTrigger size="sm" className="w-auto border-none shadow-none h-8 px-2 bg-card/50 hover:bg-card/80">
                <SelectValue placeholder={t("changeStatus") || "Change status"} />
              </SelectTrigger>
              <SelectContent>
                {status && (
                  <SelectItem value={status.id} disabled>
                    <div className="flex items-center gap-2 text-foreground/50">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color || "#000" }} />
                      {localizedName(status.name, lang)}
                    </div>
                  </SelectItem>
                )}
                {transitions.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color || "#000" }} />
                      {localizedName(t.name, lang)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              if (m.type && m.type !== "MESSAGE") {
                const nickname = m.isAdminReply && !isStaff ? t("adminName") : m.authorNickname;
                let label = "";
                if (m.type === "STATUS_CHANGED") {
                  const statusName = (m as any).newStatusName?.[lang] || (m as any).newStatusName?.en || "Unknown";
                  label = t("applicationStatusChangedEvent", { nickname, status: statusName });
                } else {
                  label = t(m.type === "CLOSED" ? "applicationClosedEvent" : "applicationReopenedEvent", { nickname });
                }
                return <ConversationEventMarker key={m.id} type={m.type as any} label={label} createdAt={m.createdAt} lang={lang} />;
              }

              // Which side of the thread this message renders on — the
              // viewer's own messages, specifically, not "staff" as a group.
              // With more than one staff member replying to the same
              // application, grouping by role would put a colleague's reply
              // on "your" side even though you didn't write it.
              const alignRight = m.authorId === viewerId;
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
        {isTerminal && <p className="text-xs text-foreground/40">{t("closedHint")}</p>}
        <FormTextarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => handleComposerKeyDown(e, submitMessage)}
          maxLength={APPLICATION_MESSAGE_MAX}
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
                aria-label={t("deleteApplication")}
                title={t("deleteApplication")}
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
              htmlFor="application-thread-files"
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
              id="application-thread-files"
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
