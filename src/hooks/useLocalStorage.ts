/* eslint-disable */
"use client";

import { useState, useCallback, useEffect, useRef } from "react";

/**
 * Read a value from localStorage, returning `fallback` when the key is
 * missing or the stored JSON is unparseable.  Pure helper — no React state.
 */
function readLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * A lightweight `useState` wrapper that mirrors its value to localStorage
 * under a namespaced key.  The key is prefixed with `ducktale:` so it won't
 * collide with anything else in the same origin.
 *
 * - Reads from storage once on mount (SSR-safe — falls back to `initialValue`
 *   during SSR and on the first client render, then syncs from storage in an
 *   effect so there's no hydration mismatch).
 * - Writes to storage on every `setValue` call (debounced writes aren't worth
 *   the complexity here — column-resize events fire maybe a dozen times per
 *   drag and localStorage.setItem is synchronous / sub-ms).
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (v: T | ((prev: T) => T)) => void] {
  const storageKey = `ducktale:${key}`;
  const [value, setValueRaw] = useState<T>(initialValue);
  const mounted = useRef(false);

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      const stored = readLS<T>(storageKey, initialValue);
      // Only update if stored value differs from initial
      if (JSON.stringify(stored) !== JSON.stringify(initialValue)) {
        setValueRaw(stored);
      }
    }
  }, [storageKey, initialValue]);

  const setValue = useCallback(
    (update: T | ((prev: T) => T)) => {
      setValueRaw((prev) => {
        const next = typeof update === "function" ? (update as (prev: T) => T)(prev) : update;
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // quota exceeded — silently ignore
        }
        return next;
      });
    },
    [storageKey],
  );

  return [value, setValue];
}
