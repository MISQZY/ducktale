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
   * Called whenever a new page/search/sort combination is needed.
   * Must return a Promise<PagedResponse<T>> with the standardised shape.
   */
  fetcher: (page: number, query: string, sort?: string, order?: "asc" | "desc") => Promise<PagedResponse<T>>;
  /** Debounce delay in ms for search input changes. Default: 300. */
  debounceMs?: number;
  /** TTL in ms for each cached entry. Default: 60_000 (1 min). */
  cacheTtlMs?: number;
}

export interface UsePagedTableResult<T> {
  state:      TableFetchState<T>;
  query:      string;
  page:       number;
  sortColumn: string | undefined;
  sortDirection: "asc" | "desc" | undefined;
  data:       PagedResponse<T> | null;
  isLoading:  boolean;
  isRefreshing: boolean;
  pageStart:  number;
  totalPages: number;
  pageNumbers: () => (number | "…")[];
  setQuery:   (value: string) => void;
  /** defaultDirection is what the first click on this column should mean ("desc" if omitted) — e.g. "asc" for rank/name columns, "desc" for playtime/size. */
  setSort:    (column: string, defaultDirection?: "asc" | "desc") => void;
  goTo:       (page: number) => void;
  refresh:    () => void;
}

interface CacheEntry<T> {
  data:      PagedResponse<T>;
  expiresAt: number;
}

// ─── URL helpers ────────────────────────────────────────────────────────────────
// We read/write the query string directly via the History API instead of the
// Next.js router: router.push()/replace() treats a search-param-only change as
// a real navigation, which makes the App Router re-fetch the page's RSC payload
// from the server on top of the fetch this hook already does. That turned every
// keystroke/page/sort click into two network round-trips. history.replaceState
// just updates the address bar for shareable links — no navigation, no refetch.

function readParam(key: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(key);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePagedTable<T>({
  fetcher,
  debounceMs  = 300,
  cacheTtlMs  = 60_000,
}: UsePagedTableOptions<T>): UsePagedTableResult<T> {
  const [state, setState] = useState<TableFetchState<T>>({ status: "loading" });
  const [query, setQueryState] = useState(() => readParam("search") ?? "");
  const [page,  setPage]  = useState(() => parseInt(readParam("page") ?? "1", 10) || 1);
  const [sortColumn, setSortColumn] = useState<string | undefined>(() => readParam("sort") ?? undefined);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | undefined>(
    () => (readParam("order") as "asc" | "desc" | null) ?? undefined,
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cacheRef    = useRef<Map<string, CacheEntry<T>>>(new Map());
  const inFlightRef = useRef<Map<string, Promise<PagedResponse<T>>>>(new Map());
  const mountedRef  = useRef(true);

  const syncUrl = useCallback((p: number, q: string, sc?: string, sd?: "asc" | "desc") => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (p > 1) params.set("page", p.toString());
    else params.delete("page");
    if (q) params.set("search", q);
    else params.delete("search");
    if (sc) params.set("sort", sc);
    else params.delete("sort");
    if (sd) params.set("order", sd);
    else params.delete("order");

    const qs  = params.toString();
    const url = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    window.history.replaceState(window.history.state, "", url);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // ── Core fetch ──────────────────────────────────────────────────────────────

  const fetchPage = useCallback((p: number, q: string, sc?: string, sd?: "asc" | "desc") => {
    const key   = `${q}:${p}:${sc || ""}:${sd || ""}`;
    const now   = Date.now();
    const entry = cacheRef.current.get(key);

    if (entry && entry.expiresAt > now) {
      if (mountedRef.current) setState({ status: "ok", data: entry.data });
      return;
    }

    if (mountedRef.current) {
      setState((prev) =>
        prev.status === "ok" || prev.status === "refreshing"
          ? { status: "refreshing", data: prev.data }
          : { status: "loading" },
      );
    }

    let promise = inFlightRef.current.get(key);
    if (!promise) {
      promise = fetcher(p, q, sc, sd);
      inFlightRef.current.set(key, promise);
      promise.finally(() => {
        if (mountedRef.current) inFlightRef.current.delete(key);
      });
    }

    promise
      .then((data) => {
        if (!mountedRef.current) return;
        cacheRef.current.set(key, { data, expiresAt: now + cacheTtlMs });
        setState({ status: "ok", data });
      })
      .catch((err: unknown) => {
        if (!mountedRef.current) return;
        setState({
          status:  "error",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      });
  }, [fetcher, cacheTtlMs]);

  // Initial fetch, respecting whatever page/search/sort came in via the URL.
  // Intentionally mount-only — page/query/sort below are only the initial values.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchPage(page, query, sortColumn, sortDirection); }, [fetchPage]);

  // ── Search with debounce ────────────────────────────────────────────────────

  const setQuery = useCallback((value: string) => {
    setQueryState(value);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (mountedRef.current) {
        fetchPage(1, value, sortColumn, sortDirection);
        syncUrl(1, value, sortColumn, sortDirection);
      }
    }, debounceMs);
  }, [fetchPage, syncUrl, debounceMs, sortColumn, sortDirection]);

  // ── Sort ────────────────────────────────────────────────────────────────────

  // First click always went to "desc", regardless of column — fine for a
  // numeric "most X first" column (playtime, size), backwards for a "rank"
  // column (1st place is the smallest number, not the largest) and for
  // alphabetical text columns (A→Z is the expected first click, not Z→A).
  // Callers now say what "first click" should mean for that column; the
  // cycle is defaultDirection -> the other direction -> cleared.
  const setSort = useCallback((column: string, defaultDirection: "asc" | "desc" = "desc") => {
    let newDir: "asc" | "desc" | undefined = defaultDirection;
    if (sortColumn === column) {
      if (sortDirection === defaultDirection) newDir = defaultDirection === "desc" ? "asc" : "desc";
      else newDir = undefined;
    }

    const newCol = newDir ? column : undefined;
    setSortColumn(newCol);
    setSortDirection(newDir);
    setPage(1);
    fetchPage(1, query, newCol, newDir);
    syncUrl(1, query, newCol, newDir);
  }, [sortColumn, sortDirection, fetchPage, syncUrl, query]);

  // ── Pagination ──────────────────────────────────────────────────────────────

  const goTo = useCallback((p: number) => {
    setPage(p);
    fetchPage(p, query, sortColumn, sortDirection);
    syncUrl(p, query, sortColumn, sortDirection);
  }, [fetchPage, syncUrl, query, sortColumn, sortDirection]);

  const refresh = useCallback(() => {
    cacheRef.current.clear();
    fetchPage(page, query, sortColumn, sortDirection);
  }, [fetchPage, page, query, sortColumn, sortDirection]);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const data         = (state.status === "ok" || state.status === "refreshing") ? state.data : null;
  const isLoading    = state.status === "loading";
  const isRefreshing = state.status === "refreshing";
  const totalPages   = data?.totalPages ?? 1;
  const pageStart    = data ? (data.page - 1) * data.pageSize : 0;

  const pageNumbers = useCallback((): (number | "…")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "…")[] = [1];
    const left  = Math.max(2, page - 1);
    const right = Math.min(totalPages - 1, page + 1);
    if (left > 2)               pages.push("…");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("…");
    pages.push(totalPages);
    return pages;
  }, [page, totalPages]);

  return {
    state, query, page, sortColumn, sortDirection, data,
    isLoading, isRefreshing,
    pageStart, totalPages, pageNumbers,
    setQuery, setSort, goTo, refresh,
  };
}
