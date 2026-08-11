"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { FormInput } from "@/components/common/FormInput";
import { FormTextarea } from "@/components/common/FormTextarea";
import { FormButton } from "@/components/common/FormButton";
import { BadgeIcon } from "@/components/badges/BadgeIcon";
import { BADGE_ICON_NAMES, DEFAULT_BADGE_ICONS } from "@/config/badges";
import { createBadge, updateBadge } from "@/lib/actions/admin-badges";
import { cn } from "@/lib/utils";

// A real search narrows the ~2000-icon catalog down to a handful of
// matches in practice; this only guards against a very short/common query
// (e.g. a single letter) still matching hundreds of icons at once — each
// one code-split behind its own dynamic import (see BadgeIcon), so that's
// hundreds of requests firing together rather than a rendering problem.
const MAX_ICON_RESULTS = 200;

interface BadgeFormValues {
  id: string;
  name: string;
  description: string | null;
  earnCondition: string | null;
  icon: string;
  color: string | null;
}

interface BadgeFormDialogProps {
  lang: string;
  /** Omitted = create mode. */
  badge?: BadgeFormValues;
  trigger: ReactNode;
}

const DEFAULT_COLOR = "#d4a017";
const DEFAULT_ICON = "trophy";

export function BadgeFormDialog({ lang, badge, trigger }: BadgeFormDialogProps) {
  const t = useTranslations("Admin.badges");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [icon, setIcon] = useState<string>(badge?.icon ?? DEFAULT_ICON);
  const [color, setColor] = useState<string>(badge?.color ?? DEFAULT_COLOR);
  const [iconQuery, setIconQuery] = useState("");

  const visibleIcons = useMemo(() => {
    const query = iconQuery.trim().toLowerCase();
    if (!query) return DEFAULT_BADGE_ICONS;
    return BADGE_ICON_NAMES.filter((name) => name.includes(query)).slice(0, MAX_ICON_RESULTS);
  }, [iconQuery]);

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
    <Dialog
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
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{badge ? t("editTitle") : t("createTitle")}</DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="flex flex-col gap-4">
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
            <label className="text-xs uppercase tracking-widest text-foreground/50">{t("iconLabel")}</label>
            <input type="hidden" name="icon" value={icon} />
            <input
              type="text"
              value={iconQuery}
              onChange={(e) => setIconQuery(e.target.value)}
              placeholder={t("iconSearchPlaceholder")}
              className="rounded-lg border border-[var(--color-input-border)] px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary/55 focus:ring-1 focus:ring-primary/25"
              style={{ backgroundColor: "var(--color-input-bg)" }}
            />
            <div className="grid grid-cols-8 content-start gap-1.5 max-h-[136px] overflow-y-auto rounded-lg border border-primary/10 p-1.5">
              {visibleIcons.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setIcon(name)}
                  aria-label={name}
                  aria-pressed={icon === name}
                  title={name}
                  className={cn(
                    "flex items-center justify-center rounded-lg border p-2 transition-colors",
                    icon === name
                      ? "border-primary/60 bg-primary/10 text-primary"
                      : "border-primary/15 text-foreground/50 hover:border-primary/30 hover:text-foreground/80"
                  )}
                >
                  <BadgeIcon name={name} size={18} />
                </button>
              ))}
              {visibleIcons.length === 0 && (
                <p className="col-span-8 text-xs text-foreground/35 py-2 text-center">{t("iconSearchEmpty")}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="color" className="text-xs uppercase tracking-widest text-foreground/50">
              {t("colorLabel")}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="color"
                name="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-12 rounded-md border border-[var(--color-input-border)] bg-transparent cursor-pointer p-0.5"
              />
              <span className="text-xs text-foreground/50 font-mono">{color}</span>
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <DialogFooter>
            <FormButton type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting ? t("saving") : badge ? t("save") : t("create")}
            </FormButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
