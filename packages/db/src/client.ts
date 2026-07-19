import fs from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { schema } from "./schema";

let libsqlClient: Client | null = null;
let singleton: ReturnType<typeof drizzle<typeof schema>> | null = null;

function createLibsqlClient(): Client {
  const url = process.env.DATABASE_URL ?? "file:./data/inkday.db";
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  if (url.startsWith("libsql://") || url.startsWith("https://")) {
    return createClient({
      url,
      authToken: authToken || undefined,
    });
  }

  const filePath = url.startsWith("file:") ? url.slice("file:".length) : url;
  const resolved = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  return createClient({ url: `file:${resolved}` });
}

export function getLibsqlClient(): Client {
  if (!libsqlClient) libsqlClient = createLibsqlClient();
  return libsqlClient;
}

export function getDb() {
  if (singleton) return singleton;
  singleton = drizzle(getLibsqlClient(), { schema });
  return singleton;
}

/**
 * Additive user columns that better-auth SELECTs on every session/login.
 * Build-time migrate is best-effort — ensure at runtime so auth never breaks
 * when a new column ships before the remote DB is altered.
 */
let userColumnsReady: Promise<void> | null = null;

async function addUserColumnIfMissing(columnSql: string) {
  const client = getLibsqlClient();
  try {
    await client.execute(`ALTER TABLE user ADD COLUMN ${columnSql}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // SQLite / libsql: duplicate column name
    if (!/duplicate column|already exists/i.test(msg)) {
      console.warn(`[db] ALTER user ${columnSql} failed:`, msg);
    }
  }
}

export async function ensureUserColumns() {
  if (!userColumnsReady) {
    userColumnsReady = (async () => {
      await addUserColumnIfMissing("equipped_avatar_id TEXT");
      await addUserColumnIfMissing("equipped_accessory_id TEXT");
      await addUserColumnIfMissing("display_name TEXT");
    })();
  }
  await userColumnsReady;
}

export type Db = ReturnType<typeof getDb>;
