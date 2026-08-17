"use client";

import { useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlayerNicknameInput } from "@/components/common/PlayerNicknameInput";
import { FormTextarea } from "@/components/common/FormTextarea";
import { FormButton } from "@/components/common/FormButton";
import { formInputClasses, formInputStyle } from "@/components/common/form-styles";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createReport } from "@/lib/actions/reports";
import { REPORT_DESCRIPTION_MAX, REPORTED_NAME_MAX } from "@/lib/reports";
import { REPORT_CATEGORIES } from "@/config/reports";
import type { ReportCategory } from "@/config/reports";

export function NewReportForm({ lang }: { lang: string }) {
  const t = useTranslations("Reports");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [reportedName, setReportedName] = useState("");
  const [category, setCategory] = useState<ReportCategory>(REPORT_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!reportedName.trim() || !description.trim()) {
      setError(t("errors.required"));
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("lang", lang);
      formData.append("reportedName", reportedName);
      formData.append("category", category);
      formData.append("description", description);
      files.forEach((f) => formData.append("files", f));

      const { id } = await createReport(formData);
      router.push(`/reports/${id}`);
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
      <PlayerNicknameInput
        id="report-reported-name"
        name="reportedName"
        label={t("reportedNameLabel")}
        placeholder={t("reportedNamePlaceholder")}
        noMatchesLabel={t("reportedNameNoMatches")}
        maxLength={REPORTED_NAME_MAX}
        value={reportedName}
        onChange={setReportedName}
        required
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="report-category" className="text-xs uppercase tracking-widest text-foreground/50 leading-none">
          {t("categoryLabel")}
        </label>
        <select
          id="report-category"
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as ReportCategory)}
          className={formInputClasses(false)}
          style={formInputStyle}
        >
          {REPORT_CATEGORIES.map((c) => (
            <option key={c} value={c}>{t(`category.${c}`)}</option>
          ))}
        </select>
      </div>

      <FormTextarea
        id="report-description"
        label={t("descriptionLabel")}
        placeholder={t("descriptionPlaceholder")}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={REPORT_DESCRIPTION_MAX}
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
