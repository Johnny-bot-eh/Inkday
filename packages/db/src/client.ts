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

export type Db = ReturnType<typeof getDb>;
