import Link from "next/link";
import { getSession } from "@/lib/session";
import { ensureUserStats } from "@/lib/game-service";
import { getCoinBalance, getEquippedAvatar } from "@/lib/coin-service";
import { ThemeToggle } from "@/components/theme-toggle";
import { CoinBalanceChip } from "@/components/coin-balance-chip";
import { AvatarMark } from "@/components/avatar-mark";

const links = [
  { href: "/", label: "Today" },
  { href: "/monthly", label: "Monthly Case File" },
  { href: "/shop", label: "Shop" },
  { href: "/leaderboard", label: "Ranks" },
  { href: "/friends", label: "Friends" },
  { href: "/profile", label: "Profile" },
];

export async function SiteHeader() {
  const session = await getSession();
  const stats = session?.user
    ? await ensureUserStats(session.user.id)
    : null;
  let coins: number | null = null;
  let avatarId: string | null = null;
  if (session?.user) {
    try {
      coins = await getCoinBalance(session.user.id);
    } catch {
      coins = null;
    }
    try {
      avatarId = await getEquippedAvatar(session.user.id);
    } catch {
      avatarId = "avatar_default";
    }
  }

  return (
    <header className="relative z-20 border-b border-[var(--line)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-paper transition group-hover:text-ember sm:text-3xl">
            Inkday
          </span>
          <span className="hidden text-xs uppercase tracking-[0.22em] text-fog sm:inline">
            daily puzzles
          </span>
        </Link>

        <nav className="flex flex-wrap items-center justify-end gap-1 text-sm sm:gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-2.5 py-1.5 text-fog transition hover:bg-white/5 hover:text-paper"
            >
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
          {session?.user ? (
            <>
              {coins != null && <CoinBalanceChip initial={coins} />}
              <Link
                href="/profile"
                className="ml-1 hidden items-center gap-1.5 rounded-md border border-ember/35 bg-ember/10 px-2.5 py-1.5 text-xs font-semibold text-ember sm:inline-flex"
                title="Current daily streak"
              >
                Streak {stats?.currentStreak ?? 0}
              </Link>
              <Link
                href="/profile"
                className="ml-1 hidden items-center gap-2 rounded-md border border-[var(--line)] px-2 py-1 text-xs text-mint md:inline-flex"
              >
                <AvatarMark avatarId={avatarId} size={22} />
                {session.user.name.split(" ")[0]}
              </Link>
            </>
          ) : (
            <Link
              href="/auth"
              className="ml-1 rounded-md bg-ember px-3 py-1.5 text-sm font-semibold text-on-ember transition hover:bg-ember-deep"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
