/**
 * In-memory fixed-window rate limiter, keyed by client IP + route. Safe here
 * for the same reason as query-cache.ts: this app runs as a persistent
 * `output: standalone` Node process (see Dockerfile), not serverless/edge —
 * module scope survives across requests instead of resetting per-invocation.
 */

interface Window {
  count: number;
  resetAt: number;
}

// Cap so a flood of distinct/spoofed IPs can't grow this map forever.
const MAX_ENTRIES = 5000;

const windows = new Map<string, Window>();

/**
 * Caddy (see Caddyfile) sits as the single reverse-proxy hop in front of this
 * app and appends the real client IP to X-Forwarded-For rather than replacing
 * it — it does not set trusted_proxies/strip incoming values. So the FIRST
 * entry is attacker-controlled (a client can send its own X-Forwarded-For
 * with any value) while the LAST entry is always the one Caddy appended.
 */
function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const ips = forwardedFor.split(",").map((ip) => ip.trim()).filter(Boolean);
    if (ips.length > 0) return ips[ips.length - 1];
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** Returns true if this request should be rejected with 429. */
export function isRateLimited(
  req: Request,
  routeKey: string,
  limit: number,
  windowMs: number
): boolean {
  const key = `${routeKey}:${getClientIp(req)}`;
  const now = Date.now();

  const w = windows.get(key);
  if (!w || now > w.resetAt) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    if (windows.size > MAX_ENTRIES) {
      const oldestKey = windows.keys().next().value;
      if (oldestKey !== undefined) windows.delete(oldestKey);
    }
    return false;
  }

  w.count++;
  return w.count > limit;
}

/**
 * isRateLimited() only reads req.headers.get(...), so the incoming-request
 * Headers from next/headers() (the only thing Server Actions get — there's
 * no raw Request object there, unlike a Route Handler) satisfies it through
 * this narrow shim without pulling in a second rate-limit implementation.
 * Shared by every "use server" action file that needs rate limiting
 * (tickets, threads, ...) instead of each redeclaring this shim locally.
 *
 * next/headers is imported dynamically, inside the function, rather than at
 * module scope — this file is reachable from client components too (e.g.
 * ThreadView.tsx → threads.ts → site-viewer.ts → auth.ts → here), and a
 * top-level `import { headers } from "next/headers"` gets flagged as using
 * a Server-Component-only API outside one, even though isRateLimited()
 * itself (the export those client chains actually need) never touches it.
 */
export async function isRateLimitedByHeaders(routeKey: string, limit: number, windowMs: number): Promise<boolean> {
  const { headers } = await import("next/headers");
  const hdrs = await headers();
  return isRateLimited({ headers: hdrs } as unknown as Request, routeKey, limit, windowMs);
}
