"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { moveThreadToSection } from "@/lib/actions/threads";
import { localizedName, type LocalizedName } from "@/lib/i18n-name";

const UNSECTIONED = "__none__";

/** Moderator-only control on the thread detail page — moves a thread between ThreadSection buckets. Not shown to the author or regular viewers, see isThreadModerator() in src/lib/threads.ts. */
export function ThreadSectionSelect({
  lang,
  threadId,
  sections,
  currentSectionId,
}: {
  lang: string;
  threadId: string;
  sections: { id: string; name: LocalizedName }[];
  currentSectionId: string | null;
}) {
  const t = useTranslations("Threads");
  const [value, setValue] = useState(currentSectionId ?? UNSECTIONED);
  const [isPending, startTransition] = useTransition();

  function handleChange(next: string) {
    const previous = value;
    setValue(next);
    startTransition(async () => {
      try {
        await moveThreadToSection(lang, threadId, next === UNSECTIONED ? null : next);
      } catch {
        setValue(previous);
      }
    });
  }

  return (
    <Select value={value} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="h-7 text-xs w-auto min-w-[9rem] bg-card/50">
        <SelectValue placeholder={t("noSectionOption")} />
      </SelectTrigger>
      <SelectContent className="liquid-card border-primary/20 rounded-xl">
        <SelectItem value={UNSECTIONED} className="cursor-pointer">{t("noSectionOption")}</SelectItem>
        {sections.map((s) => (
          <SelectItem key={s.id} value={s.id} className="cursor-pointer">
            {localizedName(s.name, lang)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
