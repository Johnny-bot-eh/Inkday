import Link from "next/link";

export function LockedPuzzle({
  title,
  reason,
}: {
  title: string;
  reason: string;
}) {
  return (
    <div className="mx-auto max-w-lg animate-rise space-y-4 rounded-2xl border border-[var(--line)] bg-panel/70 p-8 text-center">
      <p className="text-xs uppercase tracking-[0.22em] text-ember">Locked</p>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
        {title}
      </h1>
      <p className="text-fog">{reason}</p>
      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <Link
          href="/"
          className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm hover:border-ember/40"
        >
          ← Today
        </Link>
        <Link
          href="/profile"
          className="rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-on-ember"
        >
          View progress
        </Link>
      </div>
    </div>
  );
}
