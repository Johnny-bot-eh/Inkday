"use client";

import { useEffect, useState } from "react";

/** Calendar date on the visitor’s machine (not the UTC puzzle board day). */
export function localDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

type Props = {
  className?: string;
  /** Shown until client hydration so SSR/client markup stay aligned. */
  fallback?: string;
};

/**
 * Renders today’s date in the user’s local timezone.
 * Puzzle seeds and resets still use UTC via `todayKey()`.
 */
export function LocalTodayLabel({ className, fallback = "····-··-··" }: Props) {
  const [label, setLabel] = useState(fallback);

  useEffect(() => {
    setLabel(localDateKey());
  }, []);

  return <span className={className}>{label}</span>;
}
