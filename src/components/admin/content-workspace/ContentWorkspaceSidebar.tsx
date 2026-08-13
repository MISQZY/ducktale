"use client";

import { useEffect, useTransition } from "react";
import { useTranslations } from "next-intl";
import { SERVERS } from "@/config/servers";
import { isSafeSlug, isMetaSlug, type ServerContentTree } from "@/lib/content-tree";
import { loadContentFile } from "@/lib/actions/admin-content";
import { ContentTree } from "@/components/admin/ContentTree";
import { FormButton } from "@/components/common/FormButton";
import { useContentWorkspaceStore } from "./store";

const NEW_FILE_TEMPLATE = "---\ntitle: \ndescription: \n---\n\n";
const NEW_META_TEMPLATE = "{\n  \"pages\": []\n}\n";

interface ContentWorkspaceSidebarProps {
  trees: ServerContentTree[];
}

export function ContentWorkspaceSidebar({ trees }: ContentWorkspaceSidebarProps) {
  const t = useTranslations("AdminContent");
  const [, startLoadTransition] = useTransition();

  const {
    newServer, newSlug, setNewServer, setNewSlug,
    selected, setSelected,
    locale,
    setContent, setFileExists, setMessage,
  } = useContentWorkspaceStore();

  useEffect(() => {
    if (!newServer && SERVERS.length > 0) {
      setNewServer(SERVERS[0].id);
    }
  }, [newServer, setNewServer]);

  function loadFor(server: string, targetLocale: string, slug: string) {
    setContent("");
    startLoadTransition(async () => {
      // @ts-expect-error - targetLocale is ContentLocale
      const result = await loadContentFile({ server, locale: targetLocale, slug });
      const exists = result.content !== null;
      setContent(result.content ?? (isMetaSlug(slug) ? NEW_META_TEMPLATE : ""));
      setFileExists(exists);
    });
  }

  function selectTreeFile(server: string, slug: string) {
    setSelected({ server, slug });
    setMessage(`Update ${server}/${locale}/${slug}`);
    loadFor(server, locale, slug);
  }

  function handleCreateFile() {
    const slug = newSlug.trim();
    if (!isSafeSlug(slug)) {
      alert(t("newFileInvalidSlug"));
      return;
    }

    setSelected({ server: newServer, slug });
    setContent(NEW_FILE_TEMPLATE);
    setFileExists(false);
    setMessage(`Add ${newServer}/${locale}/${slug}`);
    setNewSlug("");
  }

  return (
    <aside className="w-64 shrink-0">
      <div className="rounded-2xl border border-primary/20 bg-card/50 p-3 mb-4">
        <h3 className="text-xs uppercase tracking-widest text-foreground/50 mb-2">{t("newFileTitle")}</h3>
        <select
          value={newServer}
          onChange={(e) => setNewServer(e.target.value)}
          className="w-full mb-2 rounded-lg border border-primary/20 bg-card/50 px-2 py-1.5 text-sm text-foreground/90 focus:outline-none focus:border-primary/50"
        >
          {SERVERS.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <input
          value={newSlug}
          onChange={(e) => setNewSlug(e.target.value)}
          placeholder={t("newFileSlugPlaceholder")}
          className="w-full mb-2 rounded-lg border border-primary/20 bg-card/50 px-2 py-1.5 text-sm text-foreground/90 font-mono focus:outline-none focus:border-primary/50"
        />
        <FormButton variant="outline" className="w-full px-3 py-1.5 text-xs" onClick={handleCreateFile}>
          {t("newFileCreate")}
        </FormButton>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-card/50 p-3 max-h-[60vh] overflow-y-auto">
        <ContentTree trees={trees} selected={selected} onSelect={selectTreeFile} />
      </div>
    </aside>
  );
}
