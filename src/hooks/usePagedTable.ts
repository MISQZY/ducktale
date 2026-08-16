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
  /**
   * Server-fetched default-page result (page 1, no search/sort/order) to
   * paint immediately instead of a loading skeleton — the fetcher's own
   * server-side counterpart already did this exact query, so redoing it
   * client-side on mount would just be a second, purely visual-latency
   * round trip for the page every visitor sees first. Only short-circuits
   * the mount fetch when the actual URL matches those defaults (see the
   * mount effect below) — a deep link with ?page=/?search=/?sort= still
   * fetches fresh, same as before this option existed.
   */
  initialData?: PagedResponse<T>;
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
  initialData,
}: UsePagedTableOptions<T>): UsePagedTableResult<T> {
  const [state, setState] = useState<TableFetchState<T>>(
    initialData ? { status: "ok", data: initialData } : { status: "loading" }
  );
  // Fixed, SSR-safe defaults — NOT read from the URL here. readParam() sees
  // `typeof window === "undefined"` during the server render (always "no
  // params") but the real query string once the client hydrates, so a lazy
  // initializer that reads the URL renders two different trees and React
  // flags a hydration mismatch (most visibly the sort-column header icon).
  // The real URL is applied once, client-only, in the mount effect below —
  // same pattern as RankingsTabs' initial-tab correction.
  const [query, setQueryState] = useState("");
  const [page,  setPage]  = useState(1);
  const [sortColumn, setSortColumn] = useState<string | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | undefined>(undefined);

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

  // Client-only: read whatever page/search/sort actually came in via the URL
  // (unavailable during SSR — see the state initializers above) and correct
  // state to match before doing the initial fetch. Intentionally mount-only.
  useEffect(() => {
    const urlQuery         = readParam("search") ?? "";
    const urlPage          = parseInt(readParam("page") ?? "1", 10) || 1;
    const urlSortColumn    = readParam("sort") ?? undefined;
    const urlSortDirection = (readParam("order") as "asc" | "desc" | null) ?? undefined;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time correction from the URL, unavailable at SSR time (see state initializers above)
    setQueryState(urlQuery);
    setPage(urlPage);
    setSortColumn(urlSortColumn);
    setSortDirection(urlSortDirection);

    const matchesInitialData =
      initialData && urlPage === 1 && urlQuery === "" && !urlSortColumn && !urlSortDirection;
    if (matchesInitialData) {
      // Seed the same cache entry fetchPage would have written, so an
      // immediate goTo(1)/refresh reads it back instead of re-fetching.
      const key = `:1::`;
      cacheRef.current.set(key, { data: initialData, expiresAt: Date.now() + cacheTtlMs });
      return;
    }

    fetchPage(urlPage, urlQuery, urlSortColumn, urlSortDirection);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialData/cacheTtlMs are stable per mount (server-provided prop / options), not meant to re-run this mount-only effect
  }, [fetchPage]);

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
