import { create } from "zustand";
import { type ContentLocale } from "@/lib/content-tree";
import { buildRelPath } from "@/lib/content-tree";

export interface SelectedNode {
  server: string;
  slug: string;
}

export interface ChangedFileEntry {
  server: string;
  locale: ContentLocale;
  slug: string;
  relPath: string;
}

interface ContentWorkspaceState {
  selected: SelectedNode | null;
  locale: ContentLocale;
  content: string;
  fileExists: boolean;
  message: string;
  
  sessionBranch: string | undefined;
  sessionPrUrl: string | undefined;
  changedFiles: ChangedFileEntry[];
  prTitle: string;
  
  newServer: string;
  newSlug: string;

  setSelected: (selected: SelectedNode | null) => void;
  setLocale: (locale: ContentLocale) => void;
  setContent: (content: string) => void;
  setFileExists: (exists: boolean) => void;
  setMessage: (message: string) => void;
  
  setSessionBranch: (branch: string | undefined) => void;
  setSessionPrUrl: (url: string | undefined) => void;
  setChangedFiles: (files: ChangedFileEntry[] | ((prev: ChangedFileEntry[]) => ChangedFileEntry[])) => void;
  setPrTitle: (title: string) => void;
  
  setNewServer: (server: string) => void;
  setNewSlug: (slug: string) => void;

  trackChangedFile: (server: string, locale: ContentLocale, slug: string) => void;
}

export const useContentWorkspaceStore = create<ContentWorkspaceState>((set, get) => ({
  selected: null,
  locale: "ru",
  content: "",
  fileExists: false,
  message: "",
  
  sessionBranch: undefined,
  sessionPrUrl: undefined,
  changedFiles: [],
  prTitle: "",
  
  newServer: "", // To be initialized
  newSlug: "",

  setSelected: (selected) => set({ selected }),
  setLocale: (locale) => set({ locale }),
  setContent: (content) => set({ content }),
  setFileExists: (fileExists) => set({ fileExists }),
  setMessage: (message) => set({ message }),
  
  setSessionBranch: (sessionBranch) => set({ sessionBranch }),
  setSessionPrUrl: (sessionPrUrl) => set({ sessionPrUrl }),
  setChangedFiles: (update) => set((state) => ({
    changedFiles: typeof update === 'function' ? update(state.changedFiles) : update
  })),
  setPrTitle: (prTitle) => set({ prTitle }),
  
  setNewServer: (newServer) => set({ newServer }),
  setNewSlug: (newSlug) => set({ newSlug }),

  trackChangedFile: (server, locale, slug) => {
    const relPath = buildRelPath(server, locale, slug);
    const { changedFiles } = get();
    if (!changedFiles.some((f) => f.relPath === relPath)) {
      set({ changedFiles: [...changedFiles, { server, locale, slug, relPath }] });
    }
  },
}));
