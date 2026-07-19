#!/usr/bin/env node
/**
 * Best-effort migrate before `next build`.
 * Remote DB / reshape failures must not fail the frontend compile.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const migratePath = path.resolve(here, "../../packages/db/src/migrate.mjs");

const result = spawnSync(process.execPath, [migratePath], {
  stdio: "inherit",
  env: process.env,
});

if (result.status !== 0) {
  console.warn(
    `[migrate] exited ${result.status ?? "null"} — continuing with next build`,
  );
  console.warn(
    "[migrate] Runtime ensureUserColumns() will add missing auth columns on first request.",
  );
}

process.exit(0);
