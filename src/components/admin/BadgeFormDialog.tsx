"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { LocalizedNameInput } from "@/components/common/LocalizedNameInput";
import { FormTextarea } from "@/components/common/FormTextarea";
import { AdminFormDialog, type AdminFormDialogTrigger } from "./AdminFormDialog";
import { IconPickerField } from "./IconPickerField";
import { ColorPickerField } from "./ColorPickerField";
import { createBadge, updateBadge } from "@/lib/actions/admin-badges";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchInput } from "@/components/ui/search-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronDown, HelpCircle } from "lucide-react";
import { formInputClasses, formInputStyle } from "@/components/common/form-styles";
import { localizedName, type LocalizedName } from "@/lib/i18n-name";

interface BadgeFormValues {
  id: string;
  name: LocalizedName;
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
  name: LocalizedName;
}

interface BadgeFormDialogProps {
  lang: string;
  /** Omitted = create mode. */
  badge?: BadgeFormValues;
  /** Full LuckPermsRole catalog to pick auto-grant roles from — the same role can be linked to more than one badge, so this isn't filtered down. */
  roleOptions: RoleOption[];
  trigger: AdminFormDialogTrigger;
}

const DEFAULT_COLOR = "#d4a017";
const DEFAULT_ICON = "trophy";

export function BadgeFormDialog({ lang, badge, roleOptions, trigger }: BadgeFormDialogProps) {
  const t = useTranslations("Admin.badges");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState<LocalizedName>(badge?.name ?? { ru: "", en: "" });
  const [activeLocale, setActiveLocale] = useState<"ru" | "en">("ru");
  const [icon, setIcon] = useState<string>(badge?.icon ?? DEFAULT_ICON);
  const [color, setColor] = useState<string>(badge?.color ?? DEFAULT_COLOR);
  const [iconQuery, setIconQuery] = useState("");
  const [roleQuery, setRoleQuery] = useState("");
  const [rolesOpen, setRolesOpen] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(badge?.autoRoleIds ?? []);

  const visibleRoles = roleOptions.filter((r) => localizedName(r.name, lang).toLowerCase().includes(roleQuery.toLowerCase()) || r.group.toLowerCase().includes(roleQuery.toLowerCase()));

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
          setName(badge?.name ?? { ru: "", en: "" });
          setActiveLocale("ru");
          setIcon(badge?.icon ?? DEFAULT_ICON);
          setColor(badge?.color ?? DEFAULT_COLOR);
          setIconQuery("");
          setRoleQuery("");
          setSelectedRoleIds(badge?.autoRoleIds ?? []);
        }
      }}
      trigger={trigger}
      title={badge ? t("editTitle") : t("createTitle")}
      error={error}
      submitting={submitting}
      submitLabel={badge ? t("save") : t("create")}
      submittingLabel={t("saving")}
      onSubmit={handleSubmit}
      className="sm:max-w-lg"
    >
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
        <div className="flex items-center gap-1.5">
          <label className="text-xs uppercase tracking-widest text-foreground/50 leading-none">
            {t("autoConditionLabel")}
          </label>
          <TooltipProvider>
            <Tooltip delayDuration={200}>
              <TooltipTrigger type="button" tabIndex={-1} className="text-foreground/40 hover:text-foreground/70 transition-colors">
                <HelpCircle className="h-3.5 w-3.5" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs liquid-card border-primary/20 p-2 leading-tight">
                <p>{t("autoConditionHint")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {roleOptions.length === 0 ? (
          <p className="text-xs text-foreground/30">{t("autoConditionEmpty")}</p>
        ) : (
          <>
            {selectedRoleIds.map((id) => (
              <input key={id} type="hidden" name="autoRoleIds" value={id} />
            ))}
            <Popover open={rolesOpen} onOpenChange={setRolesOpen} modal={true}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={formInputClasses(false, "flex w-full items-center justify-between cursor-pointer")}
                  style={formInputStyle}
                >
                  <span className="truncate">
                    {selectedRoleIds.length > 0
                      ? (lang === "ru" ? `Выбрано: ${selectedRoleIds.length}` : `Selected: ${selectedRoleIds.length}`)
                      : (lang === "ru" ? "Выбрать роли..." : "Select roles...")}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-75 p-2 rounded-xl liquid-card border-primary/20" align="start">
                <SearchInput
                  value={roleQuery}
                  onChange={(e) => setRoleQuery(e.target.value)}
                  placeholder={lang === "ru" ? "Найти" : "Search"}
                  className="text-xs"
                  wrapperClassName="mb-2"
                />
                <div className="flex flex-col gap-1 max-h-55 overflow-y-auto rounded-lg border border-primary/10 p-2">
                  {visibleRoles.map((role) => (
                    <label key={role.id} className="flex items-center gap-2.5 text-sm text-foreground/80 py-1 cursor-pointer hover:bg-primary/5 px-1 rounded transition-colors">
                      <Checkbox
                        checked={selectedRoleIds.includes(role.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedRoleIds((prev) => [...prev, role.id]);
                          } else {
                            setSelectedRoleIds((prev) => prev.filter((id) => id !== role.id));
                          }
                        }}
                      />
                      <span className="truncate">
                        {localizedName(role.name, lang)} <span className="text-foreground/40 font-mono text-xs ml-1">({role.group})</span>
                      </span>
                    </label>
                  ))}
                  {visibleRoles.length === 0 && (
                    <p className="text-xs text-foreground/35 py-2 text-center">
                      {lang === "ru" ? "Не найдено" : "No results"}
                    </p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </>
        )}
      </div>

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
