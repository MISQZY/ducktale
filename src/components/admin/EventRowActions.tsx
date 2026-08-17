"use client";

import { useTranslations } from "next-intl";
import { Edit } from "lucide-react";
import { EventFormDialog, type EventServerOption } from "@/components/admin/EventFormDialog";
import { buttonVariants } from "@/components/ui/button";
import { deleteServerEvent } from "@/lib/actions/admin-events";
import { cn } from "@/lib/utils";
import { AdminRowActions } from "./AdminRowActions";
import { localizedName, type LocalizedName } from "@/lib/i18n-name";
import type { EventCategory } from "@/config/events";

interface EventRowActionsProps {
  lang: string;
  event: {
    id: string;
    serverId: string | null;
    icon: string;
    category: EventCategory;
    name: LocalizedName;
    description: LocalizedName;
    startAt: number;
    endAt: number;
    href: string | null;
  };
  servers: EventServerOption[];
  /** events-edit (or isAdmin) — gates the edit dialog. Independent of canDelete (see RESOURCE_ROLE_ACTIONS's doc comment). */
  canEdit: boolean;
  /** events-delete (or isAdmin) — gates the delete button specifically. */
  canDelete: boolean;
}

export function EventRowActions({ lang, event, servers, canEdit, canDelete }: EventRowActionsProps) {
  const t = useTranslations("Admin.events");

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
      itemName={localizedName(event.name, lang)}
      onDelete={() => deleteServerEvent(lang, event.id)}
      translationsNamespace="Admin.events"
      canDelete={canDelete}
      editDialog={canEdit ? <EventFormDialog lang={lang} event={event} servers={servers} trigger={editButton} /> : null}
    />
  );
}
