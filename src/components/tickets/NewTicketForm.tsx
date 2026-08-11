"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { FormInput } from "@/components/common/FormInput";
import { FormTextarea } from "@/components/common/FormTextarea";
import { FormButton } from "@/components/common/FormButton";
import { createTicket } from "@/lib/actions/tickets";
import { TICKET_SUBJECT_MAX, TICKET_MESSAGE_MAX } from "@/lib/tickets";

export function NewTicketForm({ lang }: { lang: string }) {
  const t = useTranslations("Tickets");
  const router = useRouter();

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

      <div className="flex flex-col gap-1">
        <label className="text-sm text-foreground/80 font-medium">{t("attachmentsLabel")}</label>
        <input 
          type="file" 
          multiple 
          onChange={(e) => {
            if (e.target.files) setFiles(Array.from(e.target.files));
          }}
          className="text-sm text-foreground/70 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
        />
      </div>

      {error && <p className="text-sm text-destructive text-center">{error}</p>}

      <FormButton type="submit" disabled={submitting} className="mt-2 w-full">
        {submitting ? t("submitting") : t("submit")}
      </FormButton>
    </form>
  );
}
