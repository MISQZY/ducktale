"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { LocalizedNameInput } from "@/components/common/LocalizedNameInput";
import { LocalizedTextareaInput } from "@/components/common/LocalizedTextareaInput";
import { FormInput } from "@/components/common/FormInput";
import { AdminFormDialog, type AdminFormDialogTrigger } from "./AdminFormDialog";
import { IconPickerField } from "./IconPickerField";
import { createNewsPost, updateNewsPost } from "@/lib/actions/admin-news";
import { formInputClasses, formInputStyle } from "@/components/common/form-styles";
import { NEWS_CATEGORIES } from "@/config/news";
import type { NewsCategory } from "@/config/news";
import type { LocalizedName } from "@/lib/i18n-name";

interface NewsFormValues {
  id: string;
  scope: "site" | "server";
  serverId: string | null;
  icon: string;
  category: NewsCategory;
  title: LocalizedName;
  content: LocalizedName;
  /** Unix seconds, same as NewsPostEntry. */
  publishedAt: number;
  href: string | null;
}

export interface NewsServerOption {
  id: string;
  name: string;
  emoji: string;
}

interface NewsFormDialogProps {
  lang: string;
  /** Omitted = create mode. */
  news?: NewsFormValues;
  servers: NewsServerOption[];
  trigger: AdminFormDialogTrigger;
}

const DEFAULT_ICON = "megaphone";
type Scope = "site" | "server";
// Empty string, not null — <select> option values are always strings; the
// server action (readNewsFields, src/lib/actions/admin-news.ts) treats this
// exact sentinel as a general "applies to all servers" post and stores it as
// a null serverId, same convention EventFormDialog's NETWORK_WIDE uses.
const GENERAL_SERVER = "";

/** Unix seconds -> local "YYYY-MM-DDTHH:mm" string, the format <input type="datetime-local"> needs — a plain toISOString() would shift by the viewer's UTC offset instead of showing the wall-clock time the admin originally picked. */
function toDateTimeLocal(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function NewsFormDialog({ lang, news, servers, trigger }: NewsFormDialogProps) {
  const t = useTranslations("Admin.news");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState<LocalizedName>(news?.title ?? { ru: "", en: "" });
  const [content, setContent] = useState<LocalizedName>(news?.content ?? { ru: "", en: "" });
  const [activeLocale, setActiveLocale] = useState<"ru" | "en">("ru");
  const [category, setCategory] = useState<NewsCategory>(news?.category ?? NEWS_CATEGORIES[0]);
  const [scope, setScope] = useState<Scope>(news?.scope ?? "site");
  const [serverId, setServerId] = useState(news?.serverId ?? GENERAL_SERVER);
  const [icon, setIcon] = useState(news?.icon ?? DEFAULT_ICON);
  const [iconQuery, setIconQuery] = useState("");
  const [href, setHref] = useState(news?.href ?? "");

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSubmitting(true);
    try {
      if (news) {
        await updateNewsPost(lang, news.id, formData);
      } else {
        await createNewsPost(lang, formData);
      }
      setOpen(false);
    } catch (err) {
      setError((err instanceof Error && err.message) || t("saveFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminFormDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setError(null);
          setTitle(news?.title ?? { ru: "", en: "" });
          setContent(news?.content ?? { ru: "", en: "" });
          setActiveLocale("ru");
          setCategory(news?.category ?? NEWS_CATEGORIES[0]);
          setScope(news?.scope ?? "site");
          setServerId(news?.serverId ?? GENERAL_SERVER);
          setIcon(news?.icon ?? DEFAULT_ICON);
          setIconQuery("");
          setHref(news?.href ?? "");
        }
      }}
      trigger={trigger}
      title={news ? t("editTitle") : t("createTitle")}
      error={error}
      submitting={submitting}
      submitLabel={news ? t("save") : t("create")}
      submittingLabel={t("saving")}
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="news-scope" className="text-xs uppercase tracking-widest text-foreground/50 leading-none">
          {t("scopeLabel")}
        </label>
        <select
          id="news-scope"
          name="scope"
          value={scope}
          onChange={(e) => setScope(e.target.value as Scope)}
          className={formInputClasses(false)}
          style={formInputStyle}
        >
          <option value="site">{t("scopeSite")}</option>
          <option value="server">{t("scopeServer")}</option>
        </select>
      </div>

      {scope === "server" && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="news-server" className="text-xs uppercase tracking-widest text-foreground/50 leading-none">
            {t("serverLabel")}
          </label>
          <select
            id="news-server"
            name="serverId"
            value={serverId}
            onChange={(e) => setServerId(e.target.value)}
            className={formInputClasses(false)}
            style={formInputStyle}
          >
            <option value={GENERAL_SERVER}>{t("serverGeneral")}</option>
            {servers.map((s) => (
              <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="news-category" className="text-xs uppercase tracking-widest text-foreground/50 leading-none">
          {t("categoryLabel")}
        </label>
        <select
          id="news-category"
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as NewsCategory)}
          className={formInputClasses(false)}
          style={formInputStyle}
        >
          {NEWS_CATEGORIES.map((c) => (
            <option key={c} value={c}>{t(`categories.${c}`)}</option>
          ))}
        </select>
      </div>

      <LocalizedNameInput
        id="news-title"
        label={t("titleLabel")}
        ruName="titleRu"
        enName="titleEn"
        value={title}
        onChange={setTitle}
        active={activeLocale}
        onActiveChange={setActiveLocale}
        maxLength={100}
      />

      <LocalizedTextareaInput
        id="news-content"
        label={t("contentLabel")}
        ruName="contentRu"
        enName="contentEn"
        value={content}
        onChange={setContent}
        active={activeLocale}
        onActiveChange={setActiveLocale}
        maxLength={1000}
        rows={5}
      />

      <IconPickerField
        icon={icon}
        setIcon={setIcon}
        iconQuery={iconQuery}
        setIconQuery={setIconQuery}
        label={t("iconLabel")}
        searchPlaceholder={t("iconSearchPlaceholder")}
        emptyMessage={t("iconSearchEmpty")}
      />

      <FormInput
        id="news-published"
        name="publishedAt"
        type="datetime-local"
        label={t("publishedAtLabel")}
        defaultValue={news ? toDateTimeLocal(news.publishedAt) : undefined}
      />

      <FormInput
        id="news-href"
        name="href"
        label={t("hrefLabel")}
        value={href}
        onChange={(e) => setHref(e.target.value)}
        placeholder="https://discord.gg/..."
      />
    </AdminFormDialog>
  );
}
