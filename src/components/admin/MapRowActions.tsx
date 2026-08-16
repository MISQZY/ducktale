"use client";

import { useTranslations } from "next-intl";
import { Edit } from "lucide-react";
import { MapFormDialog, type MapServerOption } from "@/components/admin/MapFormDialog";
import { buttonVariants } from "@/components/ui/button";
import { deleteServerMap } from "@/lib/actions/admin-maps";
import { cn } from "@/lib/utils";
import { AdminRowActions } from "./AdminRowActions";
import { localizedName, type LocalizedName } from "@/lib/i18n-name";

interface MapRowActionsProps {
  lang: string;
  map: { id: string; serverId: string; name: LocalizedName; url: string };
  servers: MapServerOption[];
  /** maps-edit (or isAdmin) — gates the edit dialog. Independent of canDelete (see RESOURCE_ROLE_ACTIONS's doc comment). */
  canEdit: boolean;
  /** maps-delete (or isAdmin) — gates the delete button specifically. */
  canDelete: boolean;
}

export function MapRowActions({ lang, map, servers, canEdit, canDelete }: MapRowActionsProps) {
  const t = useTranslations("Admin.maps");

  if (!canEdit && !canDelete) return null;

  const editButton = (
    <button
      type="button"
      aria-label={t("edit")}
      title={t("edit")}
      className={cn(
        buttonVariants({ variant: "outline", size: "icon-sm" }),
        "bg-card/70 hover:text-primary hover:border-primary/40"
      )}
    >
      <Edit size={14} />
    </button>
  );

  return (
    <AdminRowActions
      itemName={localizedName(map.name, lang)}
      onDelete={() => deleteServerMap(lang, map.id)}
      translationsNamespace="Admin.maps"
      canDelete={canDelete}
      editDialog={canEdit ? <MapFormDialog lang={lang} map={map} servers={servers} trigger={editButton} /> : null}
    />
  );
}
