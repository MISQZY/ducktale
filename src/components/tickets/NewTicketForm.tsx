"use client";

import { useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormInput } from "@/components/common/FormInput";
import { FormTextarea } from "@/components/common/FormTextarea";
import { FormButton } from "@/components/common/FormButton";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createTicket } from "@/lib/actions/tickets";
import { TICKET_SUBJECT_MAX, TICKET_MESSAGE_MAX } from "@/lib/tickets";

export function NewTicketForm({ lang }: { lang: string }) {
  const t = useTranslations("Tickets");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!subject.trim() || !message.trim()) {
      setError(t("errors.required"));
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("lang", lang);
      formData.append("subject", subject);
      formData.append("message", message);
      files.forEach(f => formData.append("files", f));

      const { id } = await createTicket(formData);
      router.push(`/tickets/${id}`);
    } catch (err) {
      setError((err instanceof Error && err.message) || t("errors.generic"));
      setSubmitting(false);
    }
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormInput
        id="ticket-subject"
        label={t("subjectLabel")}
        placeholder={t("subjectPlaceholder")}
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        maxLength={TICKET_SUBJECT_MAX}
        required
      />
      <FormTextarea
        id="ticket-message"
        label={t("messageLabel")}
        placeholder={t("messagePlaceholder")}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={TICKET_MESSAGE_MAX}
        rows={6}
        required
      />

      <div className="flex flex-col gap-2">
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
            "gap-1.5 text-xs bg-card/50 hover:bg-card/80 self-start"
          )}
        >
          <Paperclip size={13} />
          {t("attachmentsLabel")}
        </button>

        {files.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {files.map((f, i) => (
              <Badge
                key={`${f.name}-${i}`}
                variant="secondary"
                className="h-auto gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border-primary/20 text-foreground/70 text-[0.65rem]"
              >
                <Paperclip size={10} className="shrink-0 opacity-50" />
                <span className="truncate max-w-[140px]">{f.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="ml-0.5 hover:text-destructive transition-colors"
                  aria-label={`Remove ${f.name}`}
                >
                  <X size={10} />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive text-center">{error}</p>}

      <FormButton type="submit" disabled={submitting} className="mt-2 w-full">
        {submitting ? t("submitting") : t("submit")}
      </FormButton>
    </form>
  );
}
