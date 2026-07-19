import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "./auth";
import { ensureUserColumns } from "@daily-puzzle/db";

/**
 * Deduped per RSC request so layout + page always agree on auth.
 * Companion used to render “Sign in” while the header already showed the name
 * when those two trees each called getSession and/or hit a stale payload.
 */
export const getSession = cache(async () => {
  await ensureUserColumns();
  return auth.api.getSession({
    headers: await headers(),
  });
});
