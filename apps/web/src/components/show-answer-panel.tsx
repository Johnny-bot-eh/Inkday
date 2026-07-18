"use client";

import { useState } from "react";

type Props = {
  /** Only show for boards the player already finished today. */
  available: boolean;
  answer: string;
  detail?: string | null;
  items?: Array<{ label: string; answer: string }> | null;
};

/** Reveal control for already-played daily puzzles. */
export function ShowAnswerPanel({
  available,
  answer,
  detail = null,
  items = null,
}: Props) {
  const [open, setOpen] = useState(false);
  if (!available) return null;

  return (
    <div className="rounded-xl border border-[var(--line)] bg-panel/60 px-4 py-3">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm text-fog hover:text-paper"
        >
          Show answer
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-ember">
            Answer
          </p>
          <p className="font-[family-name:var(--font-display)] text-xl font-bold">
            {answer}
          </p>
          {detail ? <p className="text-sm text-fog">{detail}</p> : null}
          {items && items.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm text-paper/95">
              {items.map((item) => (
                <li key={`${item.label}-${item.answer}`}>
                  <span className="text-fog">{item.label}: </span>
                  <span className="font-semibold uppercase tracking-wide">
                    {item.answer}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
}
