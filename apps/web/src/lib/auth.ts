import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb, schema } from "@daily-puzzle/db";

/**
 * Prefer the working Vercel production alias while inkday.app SSL /
 * DEPLOYMENT_NOT_FOUND is unresolved. Dynamic baseURL objects have been
 * unstable for RSC getSession on every page load.
 */
function resolveBaseUrl(): string {
  const broken = new Set(["https://inkday.app", "https://www.inkday.app"]);
  for (const value of [
    "https://inkday-web.vercel.app",
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.BETTER_AUTH_URL,
  ]) {
    if (!value) continue;
    try {
      const origin = new URL(value).origin;
      if (broken.has(origin)) continue;
      return origin;
    } catch {
      // ignore
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

  try {
    origins.add(resolveBaseUrl());
  } catch {
    // ignore
  }

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
  baseURL: resolveBaseUrl(),
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

