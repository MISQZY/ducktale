import { PrismaClient } from ".prisma/site-client";

// Same hot-reload-safe singleton pattern as src/lib/db.ts's registry, but
// simpler: this is always the one site database, no per-call key to switch.
const globalForPrisma = globalThis as unknown as {
  sitePrisma?: PrismaClient;
};

export const siteDb: PrismaClient =
  globalForPrisma.sitePrisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.sitePrisma = siteDb;
}

// See the matching hook in src/lib/db.ts for why this exists and why it's
// guarded on globalThis rather than module scope.
const globalForShutdown = globalThis as unknown as { siteDbShutdownHookRegistered?: boolean };
if (!globalForShutdown.siteDbShutdownHookRegistered) {
  globalForShutdown.siteDbShutdownHookRegistered = true;
  const disconnect = () =>
    Promise.race([
      siteDb.$disconnect().catch(() => {}),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => {
      void disconnect().finally(() => process.exit(0));
    });
  }
}
