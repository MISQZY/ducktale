"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { FormInput } from "@/components/common/FormInput";
import { AdminFormDialog } from "./AdminFormDialog";
import { IconPickerField } from "./IconPickerField";
import { ColorPickerField } from "./ColorPickerField";
import { createRole, updateRole } from "@/lib/actions/admin-roles";

interface RoleFormValues {
  id:    string;
  group: string;
  name:  string;
  icon:  string;
  color: string | null;
}

interface RoleFormDialogProps {
  lang: string;
  /** Omitted = create mode. */
  role?: RoleFormValues;
  /** Existing group names, offered as datalist suggestions — LuckPerms group names are known ahead of time via lp_tracks, this just saves retyping one exactly. */
  groupSuggestions: string[];
  trigger: ReactNode;
}

const DEFAULT_COLOR = "#d4a017";
const DEFAULT_ICON = "shield";

export function RoleFormDialog({ lang, role, groupSuggestions, trigger }: RoleFormDialogProps) {
  const t = useTranslations("Admin.roles");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [icon, setIcon] = useState<string>(role?.icon ?? DEFAULT_ICON);
  const [color, setColor] = useState<string>(role?.color ?? DEFAULT_COLOR);
  const [iconQuery, setIconQuery] = useState("");



  async function handleSubmit(formData: FormData) {
    setError(null);
    setSubmitting(true);
    try {
      if (role) {
        await updateRole(lang, role.id, formData);
      } else {
        await createRole(lang, formData);
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
          setIcon(role?.icon ?? DEFAULT_ICON);
          setColor(role?.color ?? DEFAULT_COLOR);
          setIconQuery("");
        }
      }}
      trigger={trigger}
      title={role ? t("editTitle") : t("createTitle")}
      error={error}
      submitting={submitting}
      submitLabel={role ? t("save") : t("create")}
      submittingLabel={t("saving")}
      onSubmit={handleSubmit}
    >
      <FormInput
        id="group"
        name="group"
        label={t("groupLabel")}
        hint={t("groupHint")}
        defaultValue={role?.group}
        required
        maxLength={64}
        list="group-suggestions"
      />
      <datalist id="group-suggestions">
        {groupSuggestions.map((group) => <option key={group} value={group} />)}
      </datalist>

      <FormInput
        id="name"
        name="name"
        label={t("nameLabel")}
        defaultValue={role?.name}
        required
        maxLength={64}
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

      <ColorPickerField
        color={color}
        setColor={setColor}
        label={t("colorLabel")}
      />
    </AdminFormDialog>
  );
}
