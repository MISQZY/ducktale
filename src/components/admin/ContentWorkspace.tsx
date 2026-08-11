"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { SERVERS } from "@/config/servers";
import {
  CONTENT_LOCALES, findTreeFileNode, isSafeSlug, isMetaSlug, listFolderEntryNames, buildRelPath,
  type ContentLocale, type ServerContentTree,
} from "@/lib/content-tree";
import {
  loadContentFile, previewContent, saveContentFile, deleteContentFile, revertContentFile, createContentPullRequest,
} from "@/lib/actions/admin-content";
import { ContentTree } from "@/components/admin/ContentTree";
import { MetaOrderEditor } from "@/components/admin/MetaOrderEditor";
import { PreviewErrorBoundary } from "@/components/admin/PreviewErrorBoundary";
import { FormButton } from "@/components/common/FormButton";
import { cn } from "@/lib/utils";

interface ContentWorkspaceProps {
  lang: string;
  trees: ServerContentTree[];
}

interface Selected {
  server: string;
  slug: string;
}

interface ChangedFileEntry {
  server: string;
  locale: ContentLocale;
  slug: string;
  relPath: string;
}

const PREVIEW_DEBOUNCE_MS = 700;
const NEW_FILE_TEMPLATE = "---\ntitle: \ndescription: \n---\n\n";
const NEW_META_TEMPLATE = "{\n  \"pages\": []\n}\n";

export function ContentWorkspace({ lang, trees }: ContentWorkspaceProps) {
  const t = useTranslations("AdminContent");

  const [selected, setSelected] = useState<Selected | null>(null);
  const [locale, setLocale] = useState<ContentLocale>("ru");
  const [content, setContent] = useState("");
  const [fileExists, setFileExists] = useState(false);
  const [isLoadingFile, startLoadTransition] = useTransition();

  const [previewNode, setPreviewNode] = useState<ReactNode>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewPending, startPreviewTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [message, setMessage] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isSaving, startSaveTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  // Session-wide, not tied to whichever file is currently open — this is
  // what lets several files' edits land in one PR: every save/delete
  // across the whole session reuses this same branch, and the PR only
  // gets opened once, on demand, via handleCreatePR.
  const [sessionBranch, setSessionBranch] = useState<string | undefined>();
  const [sessionPrUrl, setSessionPrUrl] = useState<string | undefined>();
  const [changedFiles, setChangedFiles] = useState<ChangedFileEntry[]>([]);
  const [prTitle, setPrTitle] = useState("");
  const [prError, setPrError] = useState<string | null>(null);
  const [isCreatingPr, startCreatePrTransition] = useTransition();
  const [revertingPath, setRevertingPath] = useState<string | null>(null);
  const [revertError, setRevertError] = useState<string | null>(null);
  const [isReverting, startRevertTransition] = useTransition();

  const [newServer, setNewServer] = useState(SERVERS[0]?.id ?? "");
  const [newSlug, setNewSlug] = useState("");
  const [newFileError, setNewFileError] = useState<string | null>(null);

  function resetFileView() {
    setSaveError(null);
    setDeleteError(null);
    setPreviewNode(null);
    setPreviewError(null);
  }

  function trackChangedFile(server: string, targetLocale: ContentLocale, slug: string) {
    const relPath = buildRelPath(server, targetLocale, slug);
    setChangedFiles((prev) =>
      prev.some((f) => f.relPath === relPath) ? prev : [...prev, { server, locale: targetLocale, slug, relPath }]
    );
  }

  function loadFor(server: string, targetLocale: ContentLocale, slug: string) {
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
    resetFileView();
    setMessage(`Update ${server}/${locale}/${slug}`);
    loadFor(server, locale, slug);
  }

  function handleLocaleChange(nextLocale: ContentLocale) {
    setLocale(nextLocale);
    if (!selected) return;
    resetFileView();
    setMessage(`Update ${selected.server}/${nextLocale}/${selected.slug}`);
    loadFor(selected.server, nextLocale, selected.slug);
  }

  function handleCreateFile() {
    const slug = newSlug.trim();
    if (!isSafeSlug(slug)) {
      setNewFileError(t("newFileInvalidSlug"));
      return;
    }
    setNewFileError(null);

    setSelected({ server: newServer, slug });
    resetFileView();
    setContent(NEW_FILE_TEMPLATE);
    setFileExists(false);
    setMessage(`Add ${newServer}/${locale}/${slug}`);
    setNewSlug("");
  }

  const isMeta = selected ? isMetaSlug(selected.slug) : false;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // meta.json isn't MDX — it gets its own reorder UI (MetaOrderEditor)
    // driven directly off `content`, no compile step needed.
    if (isMeta) return;

    debounceRef.current = setTimeout(() => {
      startPreviewTransition(async () => {
        const result = await previewContent(content);
        if ("node" in result) {
          setPreviewNode(result.node);
          setPreviewError(null);
        } else {
          setPreviewError(result.error);
        }
      });
    }, PREVIEW_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [content, isMeta]);

  function handleSave() {
    if (!selected) return;
    setSaveError(null);
    startSaveTransition(async () => {
      try {
        const result = await saveContentFile({
          lang, server: selected.server, locale, slug: selected.slug, content, message, branch: sessionBranch,
        });
        setSessionBranch(result.branch);
        setFileExists(true);
        trackChangedFile(selected.server, locale, selected.slug);
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : t("saveFailed"));
      }
    });
  }

  function handleDelete() {
    if (!selected) return;
    if (!window.confirm(t("confirmDelete", { slug: selected.slug }))) return;
    setDeleteError(null);
    startDeleteTransition(async () => {
      try {
        const result = await deleteContentFile({
          lang, server: selected.server, locale, slug: selected.slug, message, branch: sessionBranch,
        });
        setSessionBranch(result.branch);
        trackChangedFile(selected.server, locale, selected.slug);
        setSelected(null);
        setContent("");
        setFileExists(false);
      } catch (e) {
        setDeleteError(e instanceof Error ? e.message : t("saveFailed"));
      }
    });
  }

  function handleRevertFile(entry: ChangedFileEntry) {
    if (!sessionBranch) return;
    if (!window.confirm(t("confirmRevertFile", { slug: entry.relPath }))) return;
    setRevertError(null);
    setRevertingPath(entry.relPath);
    startRevertTransition(async () => {
      try {
        await revertContentFile({
          lang, server: entry.server, locale: entry.locale, slug: entry.slug, branch: sessionBranch,
        });
        setChangedFiles((prev) => prev.filter((f) => f.relPath !== entry.relPath));
        // If the reverted file is the one currently open, reload it —
        // otherwise the editor would keep showing the now-reverted edit,
        // and a stray Save click would just re-apply the very change we
        // just undid.
        if (selected && selected.server === entry.server && selected.slug === entry.slug && locale === entry.locale) {
          loadFor(entry.server, entry.locale, entry.slug);
        }
      } catch (e) {
        setRevertError(e instanceof Error ? e.message : t("saveFailed"));
      } finally {
        setRevertingPath(null);
      }
    });
  }

  function handleCreatePR() {
    if (!sessionBranch) return;
    setPrError(null);
    startCreatePrTransition(async () => {
      try {
        const result = await createContentPullRequest({
          lang, branch: sessionBranch, title: prTitle, files: changedFiles.map((f) => f.relPath),
        });
        setSessionPrUrl(result.prUrl);
      } catch (e) {
        setPrError(e instanceof Error ? e.message : t("saveFailed"));
      }
    });
  }

  const availableLocales = selected ? findTreeFileNode(trees, selected.server, selected.slug)?.locales ?? [] : [];

  const metaFolderPath = selected && isMeta ? selected.slug.replace(/(^|\/)meta\.json$/, "") : "";
  const metaAvailableEntries = selected && isMeta
    ? listFolderEntryNames(trees, selected.server, metaFolderPath)
    : [];

  return (
    <div className="flex flex-row gap-6 items-start">
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
          {newFileError && <p className="text-destructive text-xs mt-2">{newFileError}</p>}
        </div>

        <div className="rounded-2xl border border-primary/20 bg-card/50 p-3 max-h-[60vh] overflow-y-auto">
          <ContentTree trees={trees} selected={selected} onSelect={selectTreeFile} />
        </div>
      </aside>

      <div className="flex-1 min-w-0 w-full">
        {sessionBranch && (
          <div className="rounded-2xl border border-primary/20 bg-card/50 p-4 mb-4">
            <div className="flex items-center justify-between gap-3 mb-2">
              <h3 className="text-xs uppercase tracking-widest text-foreground/50">{t("prSectionTitle")}</h3>
              <span className="text-foreground/30 text-xs font-mono truncate">{sessionBranch}</span>
            </div>

            {changedFiles.length > 0 && (
              <ul className="flex flex-wrap gap-1.5 mb-3">
                {changedFiles.map((f) => (
                  <li
                    key={f.relPath}
                    className={cn(
                      "flex items-center gap-1.5 text-[11px] font-mono pl-2 pr-1 py-0.5 rounded-full bg-primary/10 text-primary/80 transition-opacity",
                      revertingPath === f.relPath && "opacity-50"
                    )}
                  >
                    {f.relPath.replace("src/content/", "")}
                    <button
                      type="button"
                      onClick={() => handleRevertFile(f)}
                      disabled={isReverting}
                      className="p-0.5 rounded-full hover:bg-primary/20 text-primary/60 hover:text-primary disabled:opacity-40 disabled:pointer-events-none"
                      aria-label={t("revertFile", { slug: f.relPath })}
                      title={t("revertFile", { slug: f.relPath })}
                    >
                      <X size={10} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {revertError && <p className="text-destructive text-xs mb-3">{revertError}</p>}

            {sessionPrUrl ? (
              <a
                href={sessionPrUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary/80 hover:text-primary text-sm underline underline-offset-4"
              >
                {t("viewPr")}
              </a>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <input
                  value={prTitle}
                  onChange={(e) => setPrTitle(e.target.value)}
                  placeholder={t("prTitlePlaceholder")}
                  className="flex-1 min-w-40 rounded-xl border border-primary/20 bg-card/50 px-4 py-2 text-sm text-foreground/90 focus:outline-none focus:border-primary/50"
                />
                <FormButton variant="primary" disabled={isCreatingPr} onClick={handleCreatePR}>
                  {isCreatingPr ? t("creatingPr") : t("createPr")}
                </FormButton>
              </div>
            )}
            {prError && <p className="text-destructive text-sm mt-2">{prError}</p>}
          </div>
        )}

        {!selected ? (
          <div className="rounded-2xl border border-primary/20 bg-card/30 p-10 text-center text-foreground/40 text-sm">
            {t("selectFilePrompt")}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <FormButton variant="primary" disabled={isSaving || isLoadingFile} onClick={handleSave}>
                {isSaving ? t("saving") : t("save")}
              </FormButton>

              {fileExists && (
                <FormButton variant="destructive" disabled={isDeleting} onClick={handleDelete}>
                  {isDeleting ? t("deleting") : t("delete")}
                </FormButton>
              )}

              <div className="flex items-center rounded-full border border-primary/20 overflow-hidden shrink-0">
                {CONTENT_LOCALES.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => handleLocaleChange(loc)}
                    className={cn(
                      "px-3 py-1.5 text-xs uppercase tracking-wide transition-colors",
                      locale === loc ? "bg-primary/15 text-primary/90" : "text-foreground/45 hover:text-foreground/70",
                      !availableLocales.includes(loc) && locale !== loc && "opacity-50"
                    )}
                  >
                    {loc}
                  </button>
                ))}
              </div>

              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("commitMessagePlaceholder")}
                className="flex-1 min-w-40 rounded-xl border border-primary/20 bg-card/50 px-4 py-2 text-sm text-foreground/90 focus:outline-none focus:border-primary/50"
              />
            </div>

            {!fileExists && !isLoadingFile && (
              <p className="text-foreground/40 text-xs mb-3">{t("notCreatedYet", { locale: locale.toUpperCase() })}</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-foreground/50 mb-2">
                  {isMeta ? t("editorLabelJson") : t("editorLabel")}
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  spellCheck={false}
                  disabled={isLoadingFile}
                  className="w-full h-[60vh] rounded-xl border border-primary/20 bg-card/50 p-4 font-mono text-sm text-foreground/90 focus:outline-none focus:border-primary/50 resize-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-foreground/50 mb-2">
                  {isMeta ? t("metaOrderLabel") : t("previewLabel")}
                  {!isMeta && isPreviewPending && (
                    <span className="text-foreground/30 normal-case tracking-normal"> · {t("compiling")}</span>
                  )}
                </label>
                <div className="w-full h-[60vh] rounded-xl border border-primary/20 bg-card/30 p-4 overflow-auto prose dark:prose-invert prose-sm max-w-none">
                  {isMeta ? (
                    <MetaOrderEditor content={content} onChange={setContent} availableEntries={metaAvailableEntries} />
                  ) : previewError ? (
                    <p className="text-destructive text-sm whitespace-pre-wrap font-mono not-prose">{previewError}</p>
                  ) : (
                    <PreviewErrorBoundary
                      fallback={<p className="text-destructive text-sm not-prose">{t("previewRenderFailed")}</p>}
                    >
                      {previewNode ?? <p className="text-foreground/30 text-sm not-prose">{t("compiling")}</p>}
                    </PreviewErrorBoundary>
                  )}
                </div>
              </div>
            </div>

            {saveError && <p className="text-destructive text-sm mt-3">{saveError}</p>}
            {deleteError && <p className="text-destructive text-sm mt-3">{deleteError}</p>}
          </>
        )}
      </div>
    </div>
  );
}
