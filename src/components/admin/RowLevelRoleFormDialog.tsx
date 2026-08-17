"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { LocalizedNameInput } from "@/components/common/LocalizedNameInput";
import { formInputClasses, formInputStyle } from "@/components/common/form-styles";
import { AdminFormDialog, type AdminFormDialogTrigger } from "./AdminFormDialog";
import { SearchInput } from "@/components/ui/search-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";
import { createRowLevelRole, updateRowLevelRole } from "@/lib/actions/admin-row-level-roles";
import { RESOURCE_ROLE_ACTIONS, type Resource, type ResourceRole } from "@/config/resource-roles";
import { ResourceRoleAccessGrid } from "@/components/admin/ResourceRoleAccessGrid";
import type { ResourceLabelMap } from "@/lib/resource-role-labels";
import { localizedName, type LocalizedName } from "@/lib/i18n-name";

const ALL_RESOURCES = Object.keys(RESOURCE_ROLE_ACTIONS) as Resource[];

interface RowLevelRoleFormValues {
  id: string;
  name: LocalizedName;
  resourceRoles: ResourceRole[];
}

interface RowLevelRoleFormDialogProps {
  lang: string;
  /** Omitted = create mode. */
  rowLevelRole?: RowLevelRoleFormValues;
  /** Effective (override-or-default) display names per resource, from getResourceLabels() — used for the resource-role picker's labels. */
  resourceLabels: ResourceLabelMap;
  trigger: AdminFormDialogTrigger;
}

/** Same resource-role picker as RoleFormDialog's, minus the "include roles" picker — a RowLevelRole is a flat bundle of resource-roles, see RowLevelRole's doc comment in the schema. */
export function RowLevelRoleFormDialog({ lang, rowLevelRole, resourceLabels, trigger }: RowLevelRoleFormDialogProps) {
  const t = useTranslations("Admin.rowLevelRoles");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState<LocalizedName>(rowLevelRole?.name ?? { ru: "", en: "" });
  const [activeLocale, setActiveLocale] = useState<"ru" | "en">("ru");
  const [query, setQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selected, setSelected] = useState<ResourceRole[]>(rowLevelRole?.resourceRoles ?? []);

  function toggleResourceRole(resourceRole: ResourceRole, checked: boolean) {
    setSelected((prev) => (checked ? [...prev, resourceRole] : prev.filter((x) => x !== resourceRole)));
  }

  const visibleResources = ALL_RESOURCES.filter((r) => localizedName(resourceLabels[r], lang).toLowerCase().includes(query.toLowerCase()));

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSubmitting(true);
    try {
      if (rowLevelRole) {
        await updateRowLevelRole(lang, rowLevelRole.id, formData);
      } else {
        await createRowLevelRole(lang, formData);
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
          setName(rowLevelRole?.name ?? { ru: "", en: "" });
          setActiveLocale("ru");
          setQuery("");
          setSelected(rowLevelRole?.resourceRoles ?? []);
        }
      }}
      trigger={trigger}
      title={rowLevelRole ? t("editTitle") : t("createTitle")}
      error={error}
      submitting={submitting}
      submitLabel={rowLevelRole ? t("save") : t("create")}
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

      <div className="flex flex-col gap-1.5">
        <label className="text-xs uppercase tracking-widest text-foreground/50 leading-none">
          {t("resourceRolesLabel")}
        </label>
        <p className="text-xs text-foreground/40">{t("resourceRolesHint")}</p>

        {selected.map((r) => (
          <input key={r} type="hidden" name="resourceRoles" value={r} />
        ))}
        <Popover open={pickerOpen} onOpenChange={setPickerOpen} modal={true}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={formInputClasses(false, "flex w-full items-center justify-between cursor-pointer")}
              style={formInputStyle}
            >
              <span className="truncate">
                {selected.length > 0
                  ? (lang === "ru" ? `Выбрано: ${selected.length}` : `Selected: ${selected.length}`)
                  : (lang === "ru" ? "Выбрать права..." : "Select permissions...")}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-max max-w-sm p-2 rounded-xl liquid-card border-primary/20" align="start">
            <SearchInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={lang === "ru" ? "Найти" : "Search"}
              className="text-xs"
              wrapperClassName="mb-2"
            />
            <div className="rounded-lg border border-primary/10 px-2 pt-1 pb-0.5">
              <ResourceRoleAccessGrid
                lang={lang}
                resources={visibleResources}
                resourceLabels={resourceLabels}
                isGranted={(r) => selected.includes(r)}
                onToggle={toggleResourceRole}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </AdminFormDialog>
  );
}
