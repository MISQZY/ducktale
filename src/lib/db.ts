import { PrismaClient} from "@prisma/client";
import {
  PrismaClientKnownRequestError,
  PrismaClientInitializationError,
} from "@prisma/client/runtime/library";

export type DbKey = string;

const DEFAULT_DB: DbKey = "default";

/**
 * Maps a logical db key to its connection-string env var:
 *   "default"  -> DATABASE_URL
 *   "duckburg" -> DATABASE_URL_DUCKBURG
 *   "duckhood" -> DATABASE_URL_DUCKHOOD
 * This is the only place that needs to change to add a new naming scheme.
 */
function envVarFor(key: DbKey): string {
  return key === DEFAULT_DB ? "DATABASE_URL" : `DATABASE_URL_${key.toUpperCase()}`;
}

function resolveUrl(key: DbKey): string {
  const envVar = envVarFor(key);
  const url = process.env[envVar];
  if (!url) {
    throw new Error(
      `[db] Missing connection string for database "${key}": set ${envVar} in the environment`
    );
  }
  return url;
}

// Registry of live clients, keyed by db name. Stored on globalThis so hot-reload
// in dev doesn't spawn a fresh pool of connections for every module reload.
const globalForPrisma = globalThis as unknown as {
  prismaClients?: Map<DbKey, PrismaClient>;
};

const registry: Map<DbKey, PrismaClient> = globalForPrisma.prismaClients ?? new Map();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaClients = registry;
}

function createClient(key: DbKey): PrismaClient {
  const client = new PrismaClient({
    // Same generated schema/client, pointed at a different connection string per key.
    // "db" matches the datasource name declared in prisma/schema.prisma.
    datasources: { db: { url: resolveUrl(key) } },
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });
  // Eagerly connect so cold-start errors surface immediately rather than on first request
  client.$connect().catch((err: unknown) => {
    console.error(`[db:${key}] Initial connection failed:`, err);
  });
  return client;
}

function getClient(key: DbKey): PrismaClient {
  let client = registry.get(key);
  if (!client) {
    client = createClient(key);
    registry.set(key, client);
  }
  return client;
}

function isConnectionError(err: unknown): boolean {
  if (
    err instanceof PrismaClientKnownRequestError &&
    err.code === "P1017"
  ) return true;

  if (
    err instanceof PrismaClientInitializationError &&
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

const reconnectingPromises = new Map<DbKey, Promise<PrismaClient>>();

async function reconnect(key: DbKey): Promise<PrismaClient> {
  const existing = reconnectingPromises.get(key);
  if (existing) return existing;

  const promise = (async () => {
    console.warn(`[db:${key}] Connection lost — reconnecting...`);
    const old = registry.get(key);
    
    // Disconnect with a timeout to prevent hanging if the server dropped the TCP connection
    if (old) {
      await Promise.race([
        old.$disconnect().catch(() => {}),
        new Promise((resolve) => setTimeout(resolve, 2000))
      ]);
    }
    
    const client = createClient(key);
    registry.set(key, client);
    return client;
  })().finally(() => {
    reconnectingPromises.delete(key);
  });

  reconnectingPromises.set(key, promise);
  return promise;
}

/**
 * Run a query against the default database.
 *   await withDb((db) => db.fp_player.findMany());
 */
export async function withDb<T>(fn: (client: PrismaClient) => Promise<T>): Promise<T>;
export async function withDb<T>(key: DbKey, fn: (client: PrismaClient) => Promise<T>): Promise<T>;
export async function withDb<T>(
  keyOrFn: DbKey | ((client: PrismaClient) => Promise<T>),
  maybeFn?: (client: PrismaClient) => Promise<T>
): Promise<T> {
  const key = typeof keyOrFn === "string" ? keyOrFn : DEFAULT_DB;
  const fn = typeof keyOrFn === "string" ? maybeFn! : keyOrFn;

  const client = getClient(key);
  try {
    return await fn(client);
  } catch (err) {
    if (isConnectionError(err)) {
      const fresh = await reconnect(key);
      return await fn(fresh);
    }
    throw err;
  }
}

// Kept for backwards compatibility with any direct imports, but prefer withDb.
// Always points at the default database.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getClient(DEFAULT_DB) as unknown as Record<string | symbol, unknown>)[prop];
  },
});
