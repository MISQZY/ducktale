import { PrismaClient, Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });
  // Eagerly connect so cold-start errors surface immediately rather than on first request
  client.$connect().catch((err: unknown) => {
    console.error("[db] Initial connection failed:", err);
  });
  return client;
}

// Use a container object so all callers always read through the same reference.
// Previously `export let prisma` was re-assigned on reconnect, but any module
// that had already imported the binding would keep the stale client.
const db = {
  client: globalForPrisma.prisma ?? createClient(),
};

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db.client;
}

function isConnectionError(err: unknown): boolean {
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P1017"
  ) return true;

  if (
    err instanceof Prisma.PrismaClientInitializationError &&
    (err.errorCode === "P1017" || err.message.includes("Server has closed the connection"))
  ) return true;

  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (
      msg.includes("server has closed the connection") ||
      msg.includes("connection reset") ||
      msg.includes("econnreset") ||
      msg.includes("econnrefused") ||
      msg.includes("connection refused") ||
      msg.includes("connection lost") ||
      msg.includes("broken pipe")
    ) return true;
  }

  return false;
}

async function reconnect(): Promise<void> {
  console.warn("[db] Connection lost — reconnecting...");
  await db.client.$disconnect().catch(() => {});
  db.client = createClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = db.client;
  }
}

export async function withDb<T>(fn: (client: PrismaClient) => Promise<T>): Promise<T> {
  try {
    return await fn(db.client);
  } catch (err) {
    if (isConnectionError(err)) {
      await reconnect();
      return await fn(db.client);
    }
    throw err;
  }
}

// Kept for backwards compatibility with any direct imports, but prefer withDb.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (db.client as unknown as Record<string | symbol, unknown>)[prop];
  },
});