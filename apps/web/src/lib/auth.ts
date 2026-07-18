import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb, schema } from "@daily-puzzle/db";

function trustedOrigins() {
  const origins = new Set<string>();
  for (const value of [
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ]) {
    if (!value) continue;
    try {
      origins.add(new URL(value).origin);
    } catch {
      // ignore invalid env values
    }
  }
  if (origins.size === 0) {
    origins.add("http://localhost:3000");
  }
  return [...origins];
}

export const auth = betterAuth({
  secret:
    process.env.BETTER_AUTH_SECRET ??
    // Build/collect can import auth without secrets; runtime should set env.
    "inkday-dev-secret-change-me",
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
