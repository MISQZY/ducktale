"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { UserCog } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchInput } from "@/components/ui/search-input";
import type { RoleOption } from "@/components/admin/RoleFormDialog";
import { localizedName } from "@/lib/i18n-name";

interface UserRolesButtonProps {
  lang: string;
  roleOptions: RoleOption[];
  selectedRoleIds: string[];
  onChange: (roleIds: string[]) => void;
  iconButtonClasses: string;
}

/**
 * Icon button + popover checklist for staging which Roles a single user
 * holds — the users-table equivalent of RoleUsersDialog's per-role holder
 * list, just flipped to per-user. Controlled (`selectedRoleIds`/`onChange`),
 * not self-persisting: AdminUserEditDialog owns the actual save, alongside
 * the nickname field, via its single Save button (setUserRoles, src/lib/
 * actions/admin-roles.ts) — unlike UserBadgesCell/RoleUsersDialog, which do
 * commit each toggle immediately, this one needs to be revertible by simply
 * closing the dialog without saving. A user can hold any number of Roles at
 * once; their effective resource-roles are the union of all of them (see
 * auth.ts's session() callback). An empty selection is allowed here — the
 * "at least one Role" rule is enforced server-side, in setUserRoles.
 */
export function UserRolesButton({ lang, roleOptions, selectedRoleIds, onChange, iconButtonClasses }: UserRolesButtonProps) {
  const t = useTranslations("Admin.roles");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const roleName = (r: RoleOption): string => localizedName(r.name, lang);
  const visible = roleOptions.filter((r) => roleName(r).toLowerCase().includes(query.toLowerCase()));

  function toggle(roleId: string, checked: boolean) {
    onChange(checked ? [...selectedRoleIds, roleId] : selectedRoleIds.filter((id) => id !== roleId));
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
      modal={true}
    >
      <PopoverTrigger asChild>
        <button type="button" aria-label={t("manageRoles")} title={t("manageRoles")} className={iconButtonClasses}>
          <UserCog size={14} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2 rounded-xl liquid-card border-primary/20" align="start">
        <SearchInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="text-xs"
          wrapperClassName="mb-2"
        />
        <div className="flex flex-col gap-1 max-h-55 overflow-y-auto rounded-lg border border-primary/10 p-2">
          {visible.map((r) => (
            <label key={r.id} className="flex items-center gap-2.5 text-sm text-foreground/80 py-1 cursor-pointer hover:bg-primary/5 px-1 rounded transition-colors">
              <Checkbox
                checked={selectedRoleIds.includes(r.id)}
                onCheckedChange={(checked) => toggle(r.id, !!checked)}
              />
              <span className="truncate">{roleName(r)}</span>
            </label>
          ))}
          {visible.length === 0 && (
            <p className="text-xs text-foreground/35 py-2 text-center">
              {lang === "ru" ? "Не найдено" : "No results"}
            </p>
          )}
          {roleOptions.length === 0 && (
            <p className="text-xs text-foreground/35 py-2 text-center">{t("noResults")}</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
