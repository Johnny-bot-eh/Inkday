import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb, schema } from "@daily-puzzle/db";

/** Hosts that may serve the app (custom domain + Vercel aliases + previews). */
const ALLOWED_HOSTS = [
  "inkday.app",
  "www.inkday.app",
  "inkday-web.vercel.app",
  "*.vercel.app",
  "localhost",
  "127.0.0.1",
] as const;

function fallbackBaseUrl(): string {
  for (const value of [
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
    "https://inkday-web.vercel.app",
  ]) {
    if (!value) continue;
    try {
      return new URL(value).origin;
    } catch {
      // ignore invalid
    }
  }
  return "https://inkday-web.vercel.app";
}

function trustedOrigins(): string[] {
  const origins = new Set<string>([
    "https://inkday-web.vercel.app",
    "https://inkday.app",
    "https://www.inkday.app",
    "https://*.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]);

  for (const value of [
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.VERCEL_BRANCH_URL
      ? `https://${process.env.VERCEL_BRANCH_URL}`
      : undefined,
  ]) {
    if (!value) continue;
    try {
      origins.add(new URL(value).origin);
    } catch {
      // ignore
    }
  }

  // Optional comma-separated extras from env.
  const extra = process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",") ?? [];
  for (const raw of extra) {
    const value = raw.trim();
    if (!value) continue;
    try {
      origins.add(new URL(value).origin);
    } catch {
      origins.add(value);
    }
  }

  return [...origins];
}

export const auth = betterAuth({
  secret:
    process.env.BETTER_AUTH_SECRET ??
    // Build/collect can import auth without secrets; runtime should set env.
    "inkday-dev-secret-change-me",
  // Resolve baseURL from the request host so login works on
  // inkday-web.vercel.app while the custom domain is down / renewing.
  baseURL: {
    allowedHosts: [...ALLOWED_HOSTS],
    fallback: fallbackBaseUrl(),
    protocol: "auto",
  },
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
