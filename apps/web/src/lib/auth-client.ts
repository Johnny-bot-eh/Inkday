import { createAuthClient } from "better-auth/react";

/** Same-origin by default — avoids CORS "Failed to fetch" on preview/custom hosts. */
export const authClient = createAuthClient();
