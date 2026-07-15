# Inkday

Daily puzzle platform — Word Daily (Wordle-style) and Case File (detective) puzzles with easy / medium / hard difficulties, accounts, streaks, and friend leaderboards.

## Stack

| Layer | Choice |
| --- | --- |
| Web app | Next.js (App Router) + TypeScript + Tailwind |
| Auth | Better Auth (email/password) |
| Database | SQLite via Drizzle ORM + LibSQL |
| Shared logic | `@daily-puzzle/puzzle-core` (pure TS, reusable by a future React Native / Expo app) |
| Monorepo | pnpm workspaces |

Mobile path later: keep scoring + engines in `packages/puzzle-core`, add `apps/mobile` (Expo), and point it at the same API/auth.

## Project layout

```
apps/web                 Next.js app
packages/puzzle-core     Puzzle engines + scoring
packages/db              Drizzle schema + SQLite client
```

## Setup

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Defaults in `apps/web/.env.local` work for local SQLite.

## Scripts

- `pnpm dev` — start the web app
- `pnpm db:migrate` — apply SQLite schema
- `pnpm build` — build workspace packages / app

## Product notes

## Product notes

- **Word Daily** is always today’s medium wordle. **Word Extra** adds easy and hard boards.
- **Escape Room** puzzles combine scattered clues into a code (safe / keypad style).
- **Logic Grid** mysteries use clue lists + fillable grids to identify the culprit.
- **Path Puzzle** mazes: draw a path from S to E (optional numbered checkpoints).
- Light/dark theme toggle in the header (saved in localStorage).
- Each puzzle × difficulty can be played once per calendar day (UTC date key).
- Scores and streaks update on successful authenticated submits.
- Live **timer** on every puzzle; faster clears earn up to +50 time bonus.
- **Daily streak** in the header: win at least one puzzle per day to keep it going.
- Friend invites use account email; Friends leaderboard scopes to accepted friends + you.

# Inkday
# Inkday
