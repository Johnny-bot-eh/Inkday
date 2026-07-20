/**
 * Canonical public site URL (custom domain or production host).
 * Prefer this over window.location / VERCEL_URL so invite links and auth
 * don’t stick to ephemeral preview hosts like
 * `inkday-xxxxx-inkday.vercel.app`.
 */
export function getPublicAppUrl(): string {
  const brokenCustom = new Set([
    "https://inkday.app",
    "https://www.inkday.app",
  ]);

  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL?.trim(),
    process.env.BETTER_AUTH_URL?.trim(),
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
    "https://inkday-web.vercel.app",
  ];

  // First pass: skip known-broken custom domains (expired SSL / not linked).
  for (const fromEnv of candidates) {
    if (!fromEnv) continue;
    try {
      const origin = new URL(fromEnv).origin;
      if (brokenCustom.has(origin)) continue;
      return origin;
    } catch {
      // fall through
    }
  }

  // Second pass: allow custom domain once reattached in Vercel.
  for (const fromEnv of candidates) {
    if (!fromEnv) continue;
    try {
      return new URL(fromEnv).origin;
    } catch {
      // fall through
    }
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "https://inkday-web.vercel.app";
}

/** Absolute URL for a site path, using the canonical host when set. */
export function absoluteAppUrl(path: string): string {
  const base = getPublicAppUrl().replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
