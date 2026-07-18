import Link from "next/link";
import { getMonthlyCollection } from "@daily-puzzle/puzzle-core";

type Props = {
  collectionId: string;
  className?: string;
};

/** Accent-filled Case File control — matches the home menu Case File CTA. */
export function CaseFileBackLink({ collectionId, className = "" }: Props) {
  const accent = getMonthlyCollection(collectionId).accent;
  return (
    <Link
      href="/monthly"
      className={[
        "inline-flex items-center rounded-lg px-3.5 py-2 text-sm font-semibold text-on-ember transition hover:opacity-90",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ background: accent }}
    >
      ← Case File
    </Link>
  );
}
