"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface PagedResponse<T> {
  items:      T[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

export type TableFetchState<T> =
  | { status: "loading" }
  | { status: "refreshing"; data: PagedResponse<T> }
  | { status: "error"; message: string }
  | { status: "ok"; data: PagedResponse<T> };

export interface UsePagedTableOptions<T> {
  /**
   * Called whenever a new page/search combination is needed.
   * Must return a Promise<PagedResponse<T>> with the standardised shape.
   */
  fetcher: (page: number, query: string) => Promise<PagedResponse<T>>;
  /** Debounce delay in ms for search input changes. Default: 300. */
  debounceMs?: number;
  /** TTL in ms for each cached entry. Default: 60_000 (1 min). */
  cacheTtlMs?: number;
}

export interface UsePagedTableResult<T> {
  state:      TableFetchState<T>;
  query:      string;
  page:       number;
  data:       PagedResponse<T> | null;
  isLoading:  boolean;
  isRefreshing: boolean;
  pageStart:  number;
  totalPages: number;
  pageNumbers: () => (number | "…")[];
  setQuery:   (value: string) => void;
  goTo:       (page: number) => void;
  refresh:    () => void;
}

interface CacheEntry<T> {
  data:      PagedResponse<T>;
  expiresAt: number;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePagedTable<T>({
  fetcher,
  debounceMs  = 300,
  cacheTtlMs  = 60_000,
}: UsePagedTableOptions<T>): UsePagedTableResult<T> {
  const [state, setState] = useState<TableFetchState<T>>({ status: "loading" });
  const [query, setQueryState] = useState("");
  const [page,  setPage]  = useState(1);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cacheRef    = useRef<Map<string, CacheEntry<T>>>(new Map());

  // ── Core fetch ──────────────────────────────────────────────────────────────

  const fetchPage = useCallback((p: number, q: string) => {
    const key   = `${q}:${p}`;
    const now   = Date.now();
    const entry = cacheRef.current.get(key);

    if (entry && entry.expiresAt > now) {
      setState({ status: "ok", data: entry.data });
      return;
    }

    setState((prev) =>
      prev.status === "ok" || prev.status === "refreshing"
        ? { status: "refreshing", data: prev.data }
        : { status: "loading" },
    );

    fetcher(p, q)
      .then((data) => {
        cacheRef.current.set(key, { data, expiresAt: now + cacheTtlMs });
        setState({ status: "ok", data });
      })
      .catch((err: unknown) =>
        setState({
          status:  "error",
          message: err instanceof Error ? err.message : "Unknown error",
        })
      );
  }, [fetcher, cacheTtlMs]);

  useEffect(() => { fetchPage(1, ""); }, [fetchPage]);

  // ── Search with debounce ────────────────────────────────────────────────────

  const setQuery = useCallback((value: string) => {
    setQueryState(value);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPage(1, value), debounceMs);
  }, [fetchPage, debounceMs]);

  // ── Pagination ──────────────────────────────────────────────────────────────

  const goTo = useCallback((p: number) => {
    setPage(p);
    fetchPage(p, query);
  }, [fetchPage, query]);

  const refresh = useCallback(() => {
    cacheRef.current.clear();
    fetchPage(page, query);
  }, [fetchPage, page, query]);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const data         = (state.status === "ok" || state.status === "refreshing") ? state.data : null;
  const isLoading    = state.status === "loading";
  const isRefreshing = state.status === "refreshing";
  const totalPages   = data?.totalPages ?? 1;
  const pageStart    = data ? (data.page - 1) * data.pageSize : 0;

  function pageNumbers(): (number | "…")[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "…")[] = [1];
    const left  = Math.max(2, page - 1);
    const right = Math.min(totalPages - 1, page + 1);
    if (left > 2)               pages.push("…");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("…");
    pages.push(totalPages);
    return pages;
  }

  return {
    state, query, page, data,
    isLoading, isRefreshing,
    pageStart, totalPages, pageNumbers,
    setQuery, goTo, refresh,
  };
}