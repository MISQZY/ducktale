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
