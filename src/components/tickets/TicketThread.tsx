"use client";

import { useCallback, useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";
import { sendTicketMessage, setTicketStatus, deleteTicket } from "@/lib/actions/tickets";
import { TICKET_MESSAGE_MAX } from "@/lib/tickets";
import { FormButton } from "@/components/common/FormButton";
import { FormTextarea } from "@/components/common/FormTextarea";
import { TicketStatusBadge } from "./TicketStatusBadge";
import type { TicketStatus } from ".prisma/site-client";

interface TicketMessageData {
  id: string;
  body: string;
  isAdminReply: boolean;
  createdAt: string;
  authorNickname: string;
  attachments?: { id: string; filename: string; size: number; mimeType: string }[];
}

interface TicketThreadProps {
  lang: string;
  ticketId: string;
  subject: string;
  initialStatus: TicketStatus;
  initialMessages: TicketMessageData[];
  /** Whether the current viewer is an admin — controls both the close/reopen
   * controls and which side of the thread their own messages render on. */
  isAdmin: boolean;
  /** Where to send the admin after deleting the ticket, since it no longer exists to render. */
  backHref: string;
}

const POLL_INTERVAL_MS = 8000;

export function TicketThread({ lang, ticketId, subject, initialStatus, initialMessages, isAdmin, backHref }: TicketThreadProps) {
  const t = useTranslations("Tickets");
  const router = useRouter();
  const [status, setStatus] = useState<TicketStatus>(initialStatus);
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    function tick() {
      if (document.visibilityState === "visible") poll();
    }
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [poll]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  function handleSend(e: FormEvent) {
    e.preventDefault();
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

  function handleDelete() {
    if (!window.confirm(t("confirmDeleteTicket", { subject }))) return;
    startTransition(async () => {
      try {
        await deleteTicket(lang, ticketId);
        router.push(backHref);
      } catch {
        setError(t("errors.generic"));
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <TicketStatusBadge status={status} label={t(`status.${status}`)} />
        {isAdmin && (
          <div className="flex items-center gap-2">
            <FormButton
              variant="outline"
              className="px-3 py-1 text-[0.65rem]"
              disabled={isPending}
              onClick={() => handleStatusChange(status === "CLOSED" ? "OPEN" : "CLOSED")}
            >
              {status === "CLOSED" ? t("reopenTicket") : t("closeTicket")}
            </FormButton>
            <FormButton
              variant="destructive"
              className="px-3 py-1 text-[0.65rem]"
              disabled={isPending}
              onClick={handleDelete}
            >
              {t("deleteTicket")}
            </FormButton>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 max-h-[55vh] overflow-y-auto rounded-2xl border border-primary/15 bg-card/30 p-4">
        {messages.length === 0 ? (
          <p className="text-center text-foreground/40 text-sm py-6">{t("noMessages")}</p>
        ) : (
          messages.map((m) => {
            // Two-sided thread: "staff" (any admin reply) on one side, the
            // ticket owner on the other. From an admin's own perspective
            // that's "my/other staff replies" vs "the customer"; from the
            // owner's perspective it's "support" vs "me" — same split,
            // mirrored depending on who's looking.
            const alignRight = isAdmin ? m.isAdminReply : !m.isAdminReply;
            return (
              <div
                key={m.id}
                className={cn("flex flex-col max-w-[80%]", alignRight ? "self-end items-end" : "self-start items-start")}
              >
                <span className="text-[0.65rem] text-foreground/40 mb-1 px-1">
                  {m.isAdminReply && !isAdmin ? t("adminName") : m.authorNickname}
                  {m.isAdminReply && isAdmin && ` · ${t("staffLabel")}`}
                </span>
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words border",
                    m.isAdminReply
                      ? "bg-primary/10 border-primary/25 text-foreground/90"
                      : "bg-card/70 border-primary/10 text-foreground/80"
                  )}
                >
                  {m.body}
                </div>
                {m.attachments && m.attachments.length > 0 && (
                  <div className="flex flex-col gap-1 mt-1.5 px-1">
                    {m.attachments.map(att => (
                      <a 
                        key={att.id} 
                        href={`/api/tickets/attachments/${att.id}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[0.7rem] text-primary hover:underline flex items-center gap-1"
                      >
                        📎 {att.filename} ({(att.size / 1024 / 1024).toFixed(2)} MB)
                      </a>
                    ))}
                  </div>
                )}
                <span className="text-[0.6rem] text-foreground/30 mt-1 px-1">
                  {new Date(m.createdAt).toLocaleString(lang === "ru" ? "ru-RU" : "en-US")}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex flex-col gap-2">
        {status === "CLOSED" && <p className="text-xs text-foreground/40">{t("closedHint")}</p>}
        <FormTextarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={TICKET_MESSAGE_MAX}
          rows={3}
          placeholder={t("replyPlaceholder")}
        />
        
        <div className="flex items-center gap-2 mt-1">
          <input 
            type="file" 
            multiple 
            onChange={(e) => {
              if (e.target.files) setFiles(Array.from(e.target.files));
            }}
            className="text-xs text-foreground/70 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
          />
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}
        <FormButton type="submit" disabled={isPending || (!body.trim() && files.length === 0)} className="self-end px-6 py-2 text-xs">
          {isPending ? t("sending") : t("send")}
        </FormButton>
      </form>
    </div>
  );
}
