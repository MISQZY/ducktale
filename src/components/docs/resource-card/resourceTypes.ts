import { Package, Palette, Sparkles, Boxes, Database } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Matches Modrinth's own `project_type` values, so a `modrinthId` card can
 * auto-detect its type; manual/static cards can pass `type` explicitly.
 * Add a new resource kind here (icon + label) and every ResourceCard using
 * it picks it up automatically — nothing else in the component needs to
 * change.
 */
export type ResourceType = "mod" | "resourcepack" | "shader" | "modpack" | "datapack";

export interface ResourceTypeMeta {
  icon: LucideIcon;
  label: string;
}

export const RESOURCE_TYPE_META: Record<ResourceType, ResourceTypeMeta> = {
  mod: { icon: Package, label: "Мод" },
  resourcepack: { icon: Palette, label: "Ресурс-пак" },
  shader: { icon: Sparkles, label: "Шейдер" },
  modpack: { icon: Boxes, label: "Модпак" },
  datapack: { icon: Database, label: "Датапак" },
};

export const DEFAULT_RESOURCE_TYPE: ResourceType = "mod";
