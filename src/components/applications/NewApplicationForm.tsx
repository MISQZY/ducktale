"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlayerNicknameInput } from "@/components/common/PlayerNicknameInput";
import { FormField } from "@/components/common/FormField";
import { FormTextarea } from "@/components/common/FormTextarea";
import { FormButton } from "@/components/common/FormButton";
import { formInputClasses, formInputStyle } from "@/components/common/form-styles";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createApplication } from "@/lib/actions/applications";
import { APPLICATION_DESCRIPTION_MAX, APPLICANT_NAME_MAX, MAX_FILES_PER_MESSAGE } from "@/lib/applications";
import { isAllowedAttachmentExtension, ATTACHMENT_ACCEPT } from "@/config/attachments";

interface ApplicationServerOption {
  id: string;
  name: string;
}

export function NewApplicationForm({ lang, servers }: { lang: string; servers: ApplicationServerOption[] }) {
  const t = useTranslations("Applications");
  const router = useRouter();

  const [applicantName, setApplicantName] = useState("");
  const [serverId, setServerId] = useState(servers[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // Description and attachments are both optional — a bare nickname+server
    // pair is a complete submission (see the Application model's doc comment).
    if (!applicantName.trim()) {
      setError(t("errors.required"));
      return;
    }
    if (!serverId) {
      setError(t("errors.noServersAvailable"));
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("lang", lang);
      formData.append("applicantName", applicantName);
      formData.append("serverId", serverId);
      formData.append("description", description);
      files.forEach((f) => formData.append("files", f));

      const { id } = await createApplication(formData);
      router.push(`/account/applications/${id}`);
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
        id="application-applicant-name"
        name="applicantName"
        label={t("applicantNameLabel")}
        placeholder={t("applicantNamePlaceholder")}
        noMatchesLabel={t("applicantNameNoMatches")}
        maxLength={APPLICANT_NAME_MAX}
        value={applicantName}
        onChange={setApplicantName}
        required
      />

      <FormField
        id="application-server"
        label={t("serverLabel")}
        requiredEmpty={servers.length === 0}
        error={servers.length === 0 ? t("errors.noServersAvailable") : undefined}
      >
        {servers.length > 0 && (
          <select
            id="application-server"
            name="serverId"
            value={serverId}
            onChange={(e) => setServerId(e.target.value)}
            className={formInputClasses(false)}
            style={formInputStyle}
            required
          >
            {servers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
      </FormField>

      <FormTextarea
        id="application-description"
        label={t("descriptionLabel")}
        placeholder={t("descriptionPlaceholder")}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={APPLICATION_DESCRIPTION_MAX}
        rows={6}
      />

      <div className="flex flex-col gap-2">
        {/* <label htmlFor> instead of a hidden input triggered via ref.click()
            — opens the native file dialog through plain browser behavior,
            not a JS-simulated click, so it can't be affected by a ref not
            being attached yet or any other timing quirk. */}
        <label
          htmlFor="new-application-files"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "gap-1.5 text-xs bg-card/50 hover:bg-card/80 self-start cursor-pointer"
          )}
        >
          <Paperclip size={13} />
          {t("attachmentsLabel")}
        </label>
        <input
          id="new-application-files"
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

      <FormButton type="submit" disabled={submitting || servers.length === 0} className="mt-2 w-full">
        {submitting ? t("submitting") : t("submit")}
      </FormButton>
    </form>
  );
}
