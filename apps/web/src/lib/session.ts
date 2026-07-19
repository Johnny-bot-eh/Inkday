import { headers } from "next/headers";
import { ensureUserColumns } from "@daily-puzzle/db";
import { auth } from "./auth";

export async function getSession() {
  // Cosmetics columns must exist before better-auth SELECTs the user row.
  await ensureUserColumns();
  try {
    return await auth.api.getSession({
      headers: await headers(),
    });
  } catch (err) {
    console.error("getSession failed", err);
    return null;
  }
}
