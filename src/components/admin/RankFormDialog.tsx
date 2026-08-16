"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { LocalizedNameInput } from "@/components/common/LocalizedNameInput";
import { FormField } from "@/components/common/FormField";
import { formInputClasses, formInputStyle } from "@/components/common/form-styles";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminFormDialog } from "./AdminFormDialog";
import { IconPickerField } from "./IconPickerField";
import { ColorPickerField } from "./ColorPickerField";
import { createRank, updateRank } from "@/lib/actions/admin-ranks";
import type { LocalizedName } from "@/lib/i18n-name";

interface RankFormValues {
  id:    string;
  group: string;
  name:  LocalizedName;
  icon:  string;
  color: string | null;
}

interface RankFormDialogProps {
  lang: string;
  /** Omitted = create mode. */
  rank?: RankFormValues;
  /** Existing group names, offered as datalist suggestions — LuckPerms group names are known ahead of time via lp_tracks, this just saves retyping one exactly. */
  groupSuggestions: string[];
  trigger: ReactNode;
}

const DEFAULT_COLOR = "#d4a017";
const DEFAULT_ICON = "shield";

export function RankFormDialog({ lang, rank, groupSuggestions, trigger }: RankFormDialogProps) {
  const t = useTranslations("Admin.ranks");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<string>(rank?.group ?? "");
  const [name, setName] = useState<LocalizedName>(rank?.name ?? { ru: "", en: "" });
  const [activeLocale, setActiveLocale] = useState<"ru" | "en">("ru");
  const [icon, setIcon] = useState<string>(rank?.icon ?? DEFAULT_ICON);
  const [color, setColor] = useState<string>(rank?.color ?? DEFAULT_COLOR);
  const [iconQuery, setIconQuery] = useState("");



  async function handleSubmit(formData: FormData) {
    setError(null);
    setSubmitting(true);
    try {
      if (rank) {
        await updateRank(lang, rank.id, formData);
      } else {
        await createRank(lang, formData);
      }
      setOpen(false);
    } catch (err) {
      setError((err instanceof Error && err.message) || t("errors.generic"));
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
          setGroup(rank?.group ?? "");
          setName(rank?.name ?? { ru: "", en: "" });
          setActiveLocale("ru");
          setIcon(rank?.icon ?? DEFAULT_ICON);
          setColor(rank?.color ?? DEFAULT_COLOR);
          setIconQuery("");
        }
      }}
      trigger={trigger}
      title={rank ? t("editTitle") : t("createTitle")}
      error={error}
      submitting={submitting}
      submitLabel={rank ? t("save") : t("create")}
      submittingLabel={t("saving")}
      onSubmit={handleSubmit}
      className="sm:max-w-lg"
    >
      <FormField id="group" label={t("groupLabel")} hint={t("groupHint")} requiredEmpty={!group}>
        <Select name="group" value={group} onValueChange={setGroup} required>
          <SelectTrigger
            id="group"
            className={formInputClasses(!group, "w-full")}
            style={formInputStyle}
          >
            <SelectValue placeholder={lang === "ru" ? "Выберите группу..." : "Select a group..."} />
          </SelectTrigger>
          <SelectContent className="liquid-card border-primary/20 rounded-xl">
            {groupSuggestions.map((group) => (
              <SelectItem key={group} value={group} className="cursor-pointer">
                {group}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <LocalizedNameInput
        id="name"
        label={t("nameLabel")}
        ruName="nameRu"
        enName="nameEn"
        value={name}
        onChange={setName}
        active={activeLocale}
        onActiveChange={setActiveLocale}
        maxLength={64}
      />

      <div className="grid grid-cols-2 gap-4">
        <IconPickerField
          icon={icon}
          setIcon={setIcon}
          iconQuery={iconQuery}
          setIconQuery={setIconQuery}
          label={t("iconLabel")}
          searchPlaceholder={t("iconSearchPlaceholder")}
          emptyMessage={t("iconSearchEmpty")}
        />

        <ColorPickerField
          color={color}
          setColor={setColor}
          label={t("colorLabel")}
        />
      </div>
    </AdminFormDialog>
  );
}
