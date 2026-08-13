"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { FormInput } from "@/components/common/FormInput";
import { FormTextarea } from "@/components/common/FormTextarea";
import { AdminFormDialog } from "./AdminFormDialog";
import { IconPickerField } from "./IconPickerField";
import { ColorPickerField } from "./ColorPickerField";
import { createBadge, updateBadge } from "@/lib/actions/admin-badges";

interface BadgeFormValues {
  id: string;
  name: string;
  description: string | null;
  earnCondition: string | null;
  icon: string;
  color: string | null;
  /** IDs of currently-linked auto-grant roles — holding ANY of them qualifies. */
  autoRoleIds: string[];
}

export interface RoleOption {
  id: string;
  group: string;
  name: string;
}

interface BadgeFormDialogProps {
  lang: string;
  /** Omitted = create mode. */
  badge?: BadgeFormValues;
  /** Full LuckPermsRole catalog to pick auto-grant roles from — the same role can be linked to more than one badge, so this isn't filtered down. */
  roleOptions: RoleOption[];
  trigger: ReactNode;
}

const DEFAULT_COLOR = "#d4a017";
const DEFAULT_ICON = "trophy";

export function BadgeFormDialog({ lang, badge, roleOptions, trigger }: BadgeFormDialogProps) {
  const t = useTranslations("Admin.badges");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [icon, setIcon] = useState<string>(badge?.icon ?? DEFAULT_ICON);
  const [color, setColor] = useState<string>(badge?.color ?? DEFAULT_COLOR);
  const [iconQuery, setIconQuery] = useState("");



  async function handleSubmit(formData: FormData) {
    setError(null);
    setSubmitting(true);
    try {
      if (badge) {
        await updateBadge(lang, badge.id, formData);
      } else {
        await createBadge(lang, formData);
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
          setIcon(badge?.icon ?? DEFAULT_ICON);
          setColor(badge?.color ?? DEFAULT_COLOR);
          setIconQuery("");
        }
      }}
      trigger={trigger}
      title={badge ? t("editTitle") : t("createTitle")}
      error={error}
      submitting={submitting}
      submitLabel={badge ? t("save") : t("create")}
      submittingLabel={t("saving")}
      onSubmit={handleSubmit}
    >
      <FormInput
        id="name"
        name="name"
        label={t("nameLabel")}
        defaultValue={badge?.name}
        required
        maxLength={64}
      />
      <FormTextarea
        id="description"
        name="description"
        label={t("descriptionLabel")}
        hint={t("descriptionHint")}
        defaultValue={badge?.description ?? ""}
        rows={2}
        maxLength={255}
      />
      <FormTextarea
        id="earnCondition"
        name="earnCondition"
        label={t("earnConditionLabel")}
        hint={t("earnConditionHint")}
        defaultValue={badge?.earnCondition ?? ""}
        rows={2}
        maxLength={255}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs uppercase tracking-widest text-foreground/50">
          {t("autoConditionLabel")}
        </label>
        {roleOptions.length === 0 ? (
          <p className="text-xs text-foreground/30">{t("autoConditionEmpty")}</p>
        ) : (
          <div className="flex flex-col gap-1 max-h-[136px] overflow-y-auto rounded-lg border border-primary/10 p-2">
            {roleOptions.map((role) => (
              <label key={role.id} className="flex items-center gap-2 text-sm text-foreground/80 py-0.5 cursor-pointer">
                <input
                  type="checkbox"
                  name="autoRoleIds"
                  value={role.id}
                  defaultChecked={badge?.autoRoleIds.includes(role.id) ?? false}
                  className="accent-primary"
                />
                {role.name} <span className="text-foreground/40 font-mono text-xs">({role.group})</span>
              </label>
            ))}
          </div>
        )}
        <p className="text-xs text-foreground/30">{t("autoConditionHint")}</p>
      </div>

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
    </AdminFormDialog>
  );
}
