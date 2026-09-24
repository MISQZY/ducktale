"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { FormInput } from "@/components/common/FormInput";
import { FormTextarea } from "@/components/common/FormTextarea";
import { FormButton } from "@/components/common/FormButton";
import { FormField } from "@/components/common/FormField";
import { formInputClasses, formInputStyle } from "@/components/common/form-styles";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createThread } from "@/lib/actions/threads";
import { THREAD_TITLE_MAX, THREAD_DESCRIPTION_MAX, THREAD_MESSAGE_MAX } from "@/lib/threads";

const UNSECTIONED = "__none__";

export function NewThreadForm({ lang, sections = [] }: { lang: string; sections?: { id: string; name: string }[] }) {
  const t = useTranslations("Threads");
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [sectionId, setSectionId] = useState(UNSECTIONED);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !message.trim()) {
      setError(t("errors.required"));
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("lang", lang);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("message", message);
      if (sectionId !== UNSECTIONED) formData.append("sectionId", sectionId);

      const { id } = await createThread(formData);
      router.push(`/threads/${id}`);
    } catch (err) {
      setError((err instanceof Error && err.message) || t("errors.generic"));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormInput
        id="thread-title"
        label={t("titleLabel")}
        placeholder={t("titlePlaceholder")}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={THREAD_TITLE_MAX}
        required
      />
      <FormInput
        id="thread-description"
        label={t("descriptionLabel")}
        hint={t("descriptionHint")}
        placeholder={t("descriptionPlaceholder")}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={THREAD_DESCRIPTION_MAX}
      />
      {sections.length > 0 && (
        <FormField id="thread-section" label={t("sectionFieldLabel")}>
          <Select value={sectionId} onValueChange={setSectionId}>
            <SelectTrigger id="thread-section" className={formInputClasses(false, "w-full")} style={formInputStyle}>
              <SelectValue placeholder={t("noSectionOption")} />
            </SelectTrigger>
            <SelectContent className="liquid-card border-primary/20 rounded-xl">
              <SelectItem value={UNSECTIONED} className="cursor-pointer">{t("noSectionOption")}</SelectItem>
              {sections.map((s) => (
                <SelectItem key={s.id} value={s.id} className="cursor-pointer">{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      )}
      <FormTextarea
        id="thread-message"
        label={t("messageLabel")}
        placeholder={t("messagePlaceholder")}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={THREAD_MESSAGE_MAX}
        rows={6}
        required
      />

      {error && <p className="text-sm text-destructive text-center">{error}</p>}

      <FormButton type="submit" disabled={submitting} className="mt-2 w-full">
        {submitting ? t("submitting") : t("submit")}
      </FormButton>
    </form>
  );
}
