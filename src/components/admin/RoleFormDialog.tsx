"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { LocalizedNameInput } from "@/components/common/LocalizedNameInput";
import { formInputClasses, formInputStyle } from "@/components/common/form-styles";
import { AdminFormDialog, type AdminFormDialogTrigger } from "./AdminFormDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchInput } from "@/components/ui/search-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";
import { createRole, updateRole } from "@/lib/actions/admin-roles";
import { RESOURCE_ROLE_ACTIONS, type Resource, type ResourceRole } from "@/config/resource-roles";
import { ResourceRoleAccessGrid } from "@/components/admin/ResourceRoleAccessGrid";
import type { ResourceLabelMap } from "@/lib/resource-role-labels";
import { localizedName, type LocalizedName } from "@/lib/i18n-name";

const ALL_RESOURCES = Object.keys(RESOURCE_ROLE_ACTIONS) as Resource[];

export interface RoleOption {
  id: string;
  name: LocalizedName;
}

export interface RowLevelRoleOption {
  id: string;
  name: LocalizedName;
}

interface RoleFormValues {
  id: string;
  name: LocalizedName;
  resourceRoles: ResourceRole[];
  includedRoleIds: string[];
  rowLevelRoleIds: string[];
  /** A locked built-in Role (none of BUILTIN_ROLE_DEFINITIONS today, src/config/roles.ts) — renaming is still allowed, but the grants/inclusions fields below aren't shown at all. */
  isLocked: boolean;
}

interface RoleFormDialogProps {
  lang: string;
  /** Omitted = create mode. */
  role?: RoleFormValues;
  /** Every other Role, for the "include roles" picker — the page already excludes `role` itself when building this list. */
  roleOptions: RoleOption[];
  /** Every RowLevelRole (/admin/row-level-roles), for the "pull in row-level roles" picker. */
  rowLevelRoleOptions: RowLevelRoleOption[];
  /** Effective (override-or-default) display names per resource, from getResourceLabels() — used for the resource-role picker's labels. */
  resourceLabels: ResourceLabelMap;
  trigger: AdminFormDialogTrigger;
}

export function RoleFormDialog({ lang, role, roleOptions, rowLevelRoleOptions, resourceLabels, trigger }: RoleFormDialogProps) {
  const t = useTranslations("Admin.roles");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState<LocalizedName>(role?.name ?? { ru: "", en: "" });
  const [activeLocale, setActiveLocale] = useState<"ru" | "en">("ru");
  const [query, setQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selected, setSelected] = useState<ResourceRole[]>(role?.resourceRoles ?? []);
  const [includeQuery, setIncludeQuery] = useState("");
  const [includePickerOpen, setIncludePickerOpen] = useState(false);
  const [includedRoleIds, setIncludedRoleIds] = useState<string[]>(role?.includedRoleIds ?? []);
  const [rowLevelQuery, setRowLevelQuery] = useState("");
  const [rowLevelPickerOpen, setRowLevelPickerOpen] = useState(false);
  const [rowLevelRoleIds, setRowLevelRoleIds] = useState<string[]>(role?.rowLevelRoleIds ?? []);

  function roleLabel(option: RoleOption | RowLevelRoleOption): string {
    return localizedName(option.name, lang);
  }

  function toggleResourceRole(resourceRole: ResourceRole, checked: boolean) {
    setSelected((prev) => (checked ? [...prev, resourceRole] : prev.filter((x) => x !== resourceRole)));
  }

  const visibleResources = ALL_RESOURCES.filter((r) => localizedName(resourceLabels[r], lang).toLowerCase().includes(query.toLowerCase()));
  const visibleRoles = roleOptions.filter((r) => roleLabel(r).toLowerCase().includes(includeQuery.toLowerCase()));
  const visibleRowLevelRoles = rowLevelRoleOptions.filter((r) => roleLabel(r).toLowerCase().includes(rowLevelQuery.toLowerCase()));

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
          setName(role?.name ?? { ru: "", en: "" });
          setActiveLocale("ru");
          setQuery("");
          setSelected(role?.resourceRoles ?? []);
          setIncludeQuery("");
          setIncludedRoleIds(role?.includedRoleIds ?? []);
          setRowLevelQuery("");
          setRowLevelRoleIds(role?.rowLevelRoleIds ?? []);
        }
      }}
      trigger={trigger}
      title={role ? t("editTitle") : t("createTitle")}
      error={error}
      submitting={submitting}
      submitLabel={role ? t("save") : t("create")}
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

      {role?.isLocked ? (
        <p className="text-xs text-foreground/40">{t("isLockedFormHint")}</p>
      ) : (
        <>
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

          {roleOptions.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-widest text-foreground/50 leading-none">
                {t("includedRolesLabel")}
              </label>
              <p className="text-xs text-foreground/40">{t("includedRolesHint")}</p>

              {includedRoleIds.map((id) => (
                <input key={id} type="hidden" name="includedRoleIds" value={id} />
              ))}
              <Popover open={includePickerOpen} onOpenChange={setIncludePickerOpen} modal={true}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={formInputClasses(false, "flex w-full items-center justify-between cursor-pointer")}
                    style={formInputStyle}
                  >
                    <span className="truncate">
                      {includedRoleIds.length > 0
                        ? (lang === "ru" ? `Выбрано: ${includedRoleIds.length}` : `Selected: ${includedRoleIds.length}`)
                        : (lang === "ru" ? "Выбрать роли..." : "Select roles...")}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-75 p-2 rounded-xl liquid-card border-primary/20" align="start">
                  <SearchInput
                    value={includeQuery}
                    onChange={(e) => setIncludeQuery(e.target.value)}
                    placeholder={lang === "ru" ? "Найти" : "Search"}
                    className="text-xs"
                    wrapperClassName="mb-2"
                  />
                  <div className="flex flex-col gap-1 max-h-55 overflow-y-auto rounded-lg border border-primary/10 p-2">
                    {visibleRoles.map((r) => (
                      <label key={r.id} className="flex items-center gap-2.5 text-sm text-foreground/80 py-1 cursor-pointer hover:bg-primary/5 px-1 rounded transition-colors">
                        <Checkbox
                          checked={includedRoleIds.includes(r.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setIncludedRoleIds((prev) => [...prev, r.id]);
                            } else {
                              setIncludedRoleIds((prev) => prev.filter((x) => x !== r.id));
                            }
                          }}
                        />
                        <span className="truncate">{roleLabel(r)}</span>
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
            </div>
          )}

          {rowLevelRoleOptions.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-widest text-foreground/50 leading-none">
                {t("rowLevelRolesLabel")}
              </label>
              <p className="text-xs text-foreground/40">{t("rowLevelRolesHint")}</p>

              {rowLevelRoleIds.map((id) => (
                <input key={id} type="hidden" name="rowLevelRoleIds" value={id} />
              ))}
              <Popover open={rowLevelPickerOpen} onOpenChange={setRowLevelPickerOpen} modal={true}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={formInputClasses(false, "flex w-full items-center justify-between cursor-pointer")}
                    style={formInputStyle}
                  >
                    <span className="truncate">
                      {rowLevelRoleIds.length > 0
                        ? (lang === "ru" ? `Выбрано: ${rowLevelRoleIds.length}` : `Selected: ${rowLevelRoleIds.length}`)
                        : (lang === "ru" ? "Выбрать роли уровня строк..." : "Select row-level roles...")}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-75 p-2 rounded-xl liquid-card border-primary/20" align="start">
                  <SearchInput
                    value={rowLevelQuery}
                    onChange={(e) => setRowLevelQuery(e.target.value)}
                    placeholder={lang === "ru" ? "Найти" : "Search"}
                    className="text-xs"
                    wrapperClassName="mb-2"
                  />
                  <div className="flex flex-col gap-1 max-h-55 overflow-y-auto rounded-lg border border-primary/10 p-2">
                    {visibleRowLevelRoles.map((r) => (
                      <label key={r.id} className="flex items-center gap-2.5 text-sm text-foreground/80 py-1 cursor-pointer hover:bg-primary/5 px-1 rounded transition-colors">
                        <Checkbox
                          checked={rowLevelRoleIds.includes(r.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setRowLevelRoleIds((prev) => [...prev, r.id]);
                            } else {
                              setRowLevelRoleIds((prev) => prev.filter((x) => x !== r.id));
                            }
                          }}
                        />
                        <span className="truncate">{roleLabel(r)}</span>
                      </label>
                    ))}
                    {visibleRowLevelRoles.length === 0 && (
                      <p className="text-xs text-foreground/35 py-2 text-center">
                        {lang === "ru" ? "Не найдено" : "No results"}
                      </p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </>
      )}
    </AdminFormDialog>
  );
}
