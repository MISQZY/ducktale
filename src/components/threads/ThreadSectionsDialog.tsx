"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { LocalizedNameInput } from "@/components/common/LocalizedNameInput";
import { useConfirm } from "@/components/common/ConfirmDialogProvider";
import { createThreadSection, renameThreadSection, deleteThreadSection } from "@/lib/actions/threads";
import { THREAD_SECTION_NAME_MAX } from "@/lib/threads";
import { localizedName, type LocalizedName } from "@/lib/i18n-name";
import { Layers, Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ThreadSectionItem {
  id: string;
  name: LocalizedName;
}

/**
 * Moderator-only "manage sections" dialog rendered in the /threads sidebar
 * header (see threads/layout.tsx) — create/rename/delete ThreadSection rows.
 * Renders straight off the `sections` prop rather than keeping its own copy,
 * so a router.refresh() after each mutation (same pattern as
 * WorkflowsManager) is enough to pick up the new state.
 */
export function ThreadSectionsDialog({ lang, sections }: { lang: string; sections: ThreadSectionItem[] }) {
  const t = useTranslations("Threads");
  const router = useRouter();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const defaultLocale = lang === "ru" ? "ru" : "en";
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<LocalizedName>({ ru: "", en: "" });
  const [editActiveLocale, setEditActiveLocale] = useState<"ru" | "en">(defaultLocale);

  const [newName, setNewName] = useState<LocalizedName>({ ru: "", en: "" });
  const [newActiveLocale, setNewActiveLocale] = useState<"ru" | "en">(defaultLocale);

  function startEdit(section: ThreadSectionItem) {
    setError(null);
    setEditingId(section.id);
    setEditName(section.name);
    setEditActiveLocale(defaultLocale);
  }

  function handleSaveEdit() {
    if (!editingId) return;
    setError(null);
    startTransition(async () => {
      try {
        await renameThreadSection(lang, editingId, editName);
        setEditingId(null);
        router.refresh();
      } catch (err) {
        setError((err instanceof Error && err.message) || t("errors.generic"));
      }
    });
  }

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      try {
        await createThreadSection(lang, newName);
        setNewName({ ru: "", en: "" });
        router.refresh();
      } catch (err) {
        setError((err instanceof Error && err.message) || t("errors.generic"));
      }
    });
  }

  async function handleDelete(section: ThreadSectionItem) {
    if (!(await confirm({ description: t("confirmDeleteSection", { name: localizedName(section.name, lang) }), variant: "destructive" }))) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteThreadSection(lang, section.id);
        router.refresh();
      } catch (err) {
        setError((err instanceof Error && err.message) || t("errors.generic"));
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setError(null);
          setEditingId(null);
          setNewName({ ru: "", en: "" });
        }
      }}
    >
      <DialogTrigger
        type="button"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full gap-1.5 shrink-0 bg-card/50 hover:bg-card/80")}
      >
        <Layers size={14} />
        {t("manageSections")}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary/90 text-center leading-tight mb-2" style={{ fontFamily: "var(--font-body)" }}>
            {t("sectionsDialogTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
          {sections.length === 0 && (
            <p className="text-xs text-foreground/40 text-center py-4">{t("noSectionsYet")}</p>
          )}
          {sections.map((section) =>
            editingId === section.id ? (
              <div key={section.id} className="flex flex-col gap-2 p-2 rounded-lg border border-primary/15 bg-card/50">
                <LocalizedNameInput
                  id={`section-edit-${section.id}`}
                  label={t("sectionNameLabel")}
                  ruName="editSectionNameRu"
                  enName="editSectionNameEn"
                  value={editName}
                  onChange={setEditName}
                  active={editActiveLocale}
                  onActiveChange={setEditActiveLocale}
                  maxLength={THREAD_SECTION_NAME_MAX}
                />
                <div className="flex items-center justify-end gap-2">
                  <button type="button" disabled={isPending} onClick={() => setEditingId(null)} className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }), "bg-card/60")}>
                    <X size={13} />
                  </button>
                  <button type="button" disabled={isPending || !editName.ru.trim() || !editName.en.trim()} onClick={handleSaveEdit} className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }), "bg-card/60")}>
                    <Check size={13} />
                  </button>
                </div>
              </div>
            ) : (
              <div key={section.id} className="flex items-center gap-2 p-2 rounded-lg border border-primary/10 bg-card/50">
                <span className="flex-1 text-sm truncate">{localizedName(section.name, lang)}</span>
                <button type="button" disabled={isPending} onClick={() => startEdit(section)} className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }), "bg-card/60")}>
                  <Pencil size={13} />
                </button>
                <button type="button" disabled={isPending} onClick={() => handleDelete(section)} className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }), "bg-card/60 hover:text-destructive hover:border-destructive/40")}>
                  <Trash2 size={13} />
                </button>
              </div>
            )
          )}
        </div>

        <div className="pt-3 border-t border-primary/10 flex flex-col gap-3">
          <LocalizedNameInput
            id="new-section-name"
            label={t("addSectionLabel")}
            ruName="newSectionNameRu"
            enName="newSectionNameEn"
            value={newName}
            onChange={setNewName}
            active={newActiveLocale}
            onActiveChange={setNewActiveLocale}
            maxLength={THREAD_SECTION_NAME_MAX}
          />
          <Button type="button" disabled={isPending || !newName.ru.trim() || !newName.en.trim()} onClick={handleCreate} className="w-full">
            <Plus size={14} className="mr-1.5" />
            {t("addSectionButton")}
          </Button>
        </div>

        {error && <p className="text-xs text-destructive text-center">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}
