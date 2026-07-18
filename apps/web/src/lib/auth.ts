import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb, schema } from "@daily-puzzle/db";

function canonicalBaseUrl(): string | undefined {
  for (const value of [
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
  ]) {
    if (!value) continue;
    try {
      return new URL(value).origin;
    } catch {
      // ignore invalid
    }
  }
  return undefined;
}

function trustedOrigins() {
  const origins = new Set<string>();
  const base = canonicalBaseUrl();
  if (base) origins.add(base);
  // Allow the current deployment host too (preview PRs, local).
  for (const value of [
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    "http://localhost:3000",
  ]) {
    if (!value) continue;
    try {
      origins.add(new URL(value).origin);
    } catch {
      // ignore
    }
  }
  return [...origins];
}

export const auth = betterAuth({
  secret:
    process.env.BETTER_AUTH_SECRET ??
    // Build/collect can import auth without secrets; runtime should set env.
    "inkday-dev-secret-change-me",
  // Prefer production / custom domain — never pin auth to a hash preview URL.
  ...(canonicalBaseUrl() ? { baseURL: canonicalBaseUrl() } : {}),
  database: drizzleAdapter(getDb(), {
    provider: "sqlite",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      displayName: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },
  trustedOrigins: trustedOrigins(),
});

export type Session = typeof auth.$Infer.Session;
