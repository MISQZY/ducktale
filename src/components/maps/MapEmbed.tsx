"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, RefreshCw } from "lucide-react";
import { FormButton } from "@/components/common/FormButton";
import { checkMapStatus } from "@/lib/actions/map-status";

interface MapEmbedProps {
  mapId: string;
  url: string;
  title: string;
}

const LOAD_TIMEOUT_MS = 10_000;

/**
 * Wraps the map iframe with a loading spinner and a best-effort
 * load-failure state, retried via a manual button.
 *
 * A server-side status check (checkMapStatus) runs first and fires
 * immediately on a real 4xx/5xx — an <iframe>'s own onLoad can't see the
 * response status for cross-origin content at all (a normal HTTP error
 * still fires `load` just like a success), so without this, a broken link
 * would only ever surface several seconds later via the load-timeout
 * fallback below, and only for a fully dead host, never for a server
 * that's up but answering with an error page.
 *
 * Once that check passes, the iframe's own `onError` (network-level
 * failures — DNS, connection refused) and a timeout if `load` never fires
 * at all are the remaining fallback signals. What NOTHING here can detect:
 * an X-Frame-Options/CSP `frame-ancestors` block — the HTTP request still
 * succeeds (status check passes) and the browser still fires `load`, it
 * just discards the response body and renders a blank frame, with no
 * signal script can observe (same-origin policy blocks reading the frame's
 * actual content). So "loaded" here means "reachable and didn't time out",
 * not "definitely visible" — the manual retry button is the practical
 * recourse for that gap, not something this component can close on its own.
 */
export function MapEmbed({ mapId, url, title }: MapEmbedProps) {
  const t = useTranslations("Maps");
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"checking" | "loading" | "loaded" | "error">("checking");
  const [httpStatus, setHttpStatus] = useState<number | null>(null);

  // Resets whenever the map itself changes or a retry is requested —
  // adjusted during render (React's own recommended pattern for "reset
  // state when a value changes") rather than inside an Effect.
  const resetKey = `${mapId}:${attempt}`;
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setStatus("checking");
    setHttpStatus(null);
  }

  useEffect(() => {
    let cancelled = false;
    checkMapStatus(mapId).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setHttpStatus(result.status);
        setStatus("error");
      } else {
        setStatus("loading");
      }
    });
    return () => { cancelled = true; };
  }, [mapId, resetKey]);

  useEffect(() => {
    if (status !== "loading") return;
    const timeout = setTimeout(() => {
      setStatus((s) => (s === "loading" ? "error" : s));
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [status, resetKey]);

  function handleLoad() {
    setStatus("loaded");
  }

  function handleError() {
    setStatus("error");
  }

  if (status === "checking") {
    return (
      <div className="w-full h-full flex items-center justify-center rounded-2xl border border-primary/15 bg-card/40">
        <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" aria-hidden="true" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 text-center px-6">
        <AlertCircle size={28} className="text-destructive/70" />
        <p className="text-sm text-destructive/80">
          {httpStatus ? t("loadErrorStatus", { status: httpStatus }) : t("loadError")}
        </p>
        <FormButton
          onClick={() => setAttempt((n) => n + 1)}
          icon={<RefreshCw size={14} />}
          variant="outline"
          className="px-4 py-1.5 text-xs"
        >
          {t("retry")}
        </FormButton>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <iframe
        key={attempt}
        src={url}
        title={title}
        onLoad={handleLoad}
        onError={handleError}
        className="w-full h-full rounded-2xl border border-primary/15"
        loading="lazy"
        allow="fullscreen"
      />

      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl border border-primary/15 bg-card/40 pointer-events-none">
          <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
