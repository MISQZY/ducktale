"use client";

import { useEffect, useTransition } from "react";
import { useTranslations } from "next-intl";
import { SERVERS } from "@/config/servers";
import { isSafeSlug, isMetaSlug, type ServerContentTree } from "@/lib/content-tree";
import { loadContentFile } from "@/lib/actions/admin-content";
import { ContentTree } from "@/components/admin/ContentTree";
import { FormButton } from "@/components/common/FormButton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    <aside className="w-full h-full flex flex-col min-w-0 overflow-hidden rounded-2xl border border-primary/20 bg-card/50 p-4">
      <div className="mb-4 shrink-0">
        <h3 className="text-xs uppercase tracking-widest text-foreground/50 mb-2">{t("newFileTitle")}</h3>
        <Select value={newServer} onValueChange={setNewServer}>
          <SelectTrigger className="w-full mb-2 h-auto px-2 py-1.5 bg-card/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SERVERS.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={newSlug}
          onChange={(e) => setNewSlug(e.target.value)}
          placeholder={t("newFileSlugPlaceholder")}
          className="w-full mb-2 h-auto px-2 py-1.5 font-mono bg-card/50"
        />
        <FormButton variant="outline" className="w-full px-3 py-1.5 text-xs" onClick={handleCreateFile}>
          {t("newFileCreate")}
        </FormButton>
      </div>

      <div className="h-px bg-primary/10 shrink-0 -mx-4 mb-4" />

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2">
        <ContentTree trees={trees} selected={selected} onSelect={selectTreeFile} />
      </div>
    </aside>
  );
}
