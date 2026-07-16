import type { Difficulty } from "./types";
import { dayIndex, hashSeed, pickIndex } from "./types";

export type PathCell = "." | "#" | "S" | "E" | "1" | "2" | "3";
export type PathCoord = { r: number; c: number };

export type PathPuzzle = {
  id: string;
  title: string;
  briefing: string;
  rows: number;
  cols: number;
  grid: PathCell[][];
  /** Required visit order after start (e.g. ["1","2"]) */
  waypoints: string[];
};

type PathTemplate = Omit<PathPuzzle, "id" | "grid"> & {
  slug: string;
  /** Row strings using . # S E 1 2 3 */
  map: string[];
};

const TEMPLATES: PathTemplate[] = [
  {
    slug: "alley-run",
    title: "Alley Run",
    briefing: "Trace a path from S to E. Move only to adjacent cells (no diagonals). Avoid walls.",
    rows: 5,
    cols: 5,
    waypoints: [],
    map: [
      "S..#.",
      ".#...",
      "...#.",
      ".#...",
      "...E.",
    ],
  },
  {
    slug: "courtyard",
    title: "Courtyard Circuit",
    briefing: "Reach E from S. Visit checkpoint 1 before the exit.",
    rows: 5,
    cols: 5,
    waypoints: ["1"],
    map: [
      "S.#..",
      ".....",
      ".#1#.",
      "...#.",
      "..#.E",
    ],
  },
  {
    slug: "warehouse-aisle",
    title: "Warehouse Aisle",
    briefing: "Snake through the stacks from S to E without crossing walls.",
    rows: 6,
    cols: 6,
    waypoints: [],
    map: [
      "S.#...",
      "..#.#.",
      "#...#.",
      ".##...",
      "...##.",
      "..#..E",
    ],
  },
  {
    slug: "museum-wing",
    title: "Museum Wing",
    briefing: "Hit checkpoints 1 then 2 on your way to E.",
    rows: 6,
    cols: 6,
    waypoints: ["1", "2"],
    map: [
      "S....#",
      ".##.#.",
      "..1...",
      ".#.#.#",
      "..2...",
      "#....E",
    ],
  },
  {
    slug: "harbor-maze",
    title: "Harbor Maze",
    briefing: "Tight corridors — path from S to E, no revisiting cells.",
    rows: 7,
    cols: 7,
    waypoints: [],
    map: [
      "S.#.#..",
      "..###.#",
      "#.....#",
      ".###...",
      "...###.",
      ".#.....",
      "...#.#E",
    ],
  },
  {
    slug: "cipher-crawl",
    title: "Cipher Crawl",
    briefing: "Visit 1 → 2 → 3 in order, then exit at E.",
    rows: 7,
    cols: 7,
    waypoints: ["1", "2", "3"],
    map: [
      "S......",
      ".#.#.#.",
      "..1....",
      ".#.#.#.",
      "..2....",
      ".#.#3#.",
      "......E",
    ],
  },
  {
    slug: "garden-hedge",
    title: "Garden Hedge",
    briefing: "Short hedges only. Path S → E adjacent steps only.",
    rows: 5,
    cols: 6,
    waypoints: [],
    map: [
      "S.#...",
      "..#.#.",
      "......",
      ".#.#.#",
      "...#.E",
    ],
  },
  {
    slug: "subway-fork",
    title: "Subway Fork",
    briefing: "Pass marker 1 before reaching the platform exit.",
    rows: 6,
    cols: 7,
    waypoints: ["1"],
    map: [
      "S.#....",
      "..#.##.",
      "....#1.",
      ".##.#.#",
      "......#",
      "#.#...E",
    ],
  },
  {
    slug: "tower-stairs",
    title: "Tower Stairs",
    briefing: "Climb checkpoints 1 and 2, then the exit.",
    rows: 8,
    cols: 6,
    waypoints: ["1", "2"],
    map: [
      "S.#...",
      "......",
      ".#1#..",
      "......",
      ".#2#..",
      "......",
      ".#.#.#",
      "....E.",
    ],
  },
  {
    slug: "archive-switchback",
    title: "Archive Switchback",
    briefing:
      "A larger logic path. Visit 1 → 2 → 3 in order, then find the concealed exit.",
    rows: 9,
    cols: 9,
    waypoints: ["1", "2", "3"],
    map: [
      "S..#.....",
      ".#.#.###.",
      ".#...1#..",
      ".###.#.#.",
      "...#.#.#.",
      "##.#...#.",
      "...###2#.",
      ".#.....#3",
      ".####...E",
    ],
  },
  {
    slug: "catacomb-loop",
    title: "Catacomb Loop",
    briefing:
      "Long corridors, false branches, no revisits. Visit 1 → 2 → 3 before the exit.",
    rows: 10,
    cols: 10,
    waypoints: ["1", "2", "3"],
    map: [
      "S....#....",
      "####.#.##.",
      "...#.#..1.",
      ".#.#.###.#",
      ".#...#...#",
      ".###.#.#.#",
      "...#...#2#",
      "#.#####..#",
      "#....3...#",
      "######...E",
    ],
  },
  {
    slug: "observatory-night",
    title: "Observatory Night",
    briefing:
      "A large night board with three hidden instruments to pass before the final dome.",
    rows: 9,
    cols: 10,
    waypoints: ["1", "2", "3"],
    map: [
      "S..#......",
      ".#.#.####.",
      ".#...#..1.",
      ".###.#.##.",
      "...#.#....",
      "##.#.####.",
      "...#...2#.",
      ".#####.#3.",
      ".......#.E",
    ],
  },
];

function parseMap(map: string[]): PathCell[][] {
  return map.map((row) => row.split("") as PathCell[]);
}

function findCell(grid: PathCell[][], target: PathCell | string): PathCoord | null {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r]!.length; c++) {
      if (grid[r]![c] === target) return { r, c };
    }
  }
  return null;
}

/** True if there exists a simple (no-revisit) path S → waypoints → E. */
export function pathHasSolution(
  grid: PathCell[][],
  waypoints: string[],
): boolean {
  const start = findCell(grid, "S");
  if (!start) return false;

  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  const dfs = (r: number, c: number, wp: number, seen: Set<string>): boolean => {
    const key = `${r},${c}`;
    if (seen.has(key)) return false;
    const tile = grid[r]?.[c];
    if (!tile || tile === "#") return false;

    let nextWp = wp;
    if (nextWp < waypoints.length && tile === waypoints[nextWp]) {
      nextWp += 1;
    }

    const nextSeen = new Set(seen);
    nextSeen.add(key);

    if (tile === "E" && nextWp === waypoints.length) return true;

    for (const [dr, dc] of [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ] as const) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
      if (dfs(nr, nc, nextWp, nextSeen)) return true;
    }
    return false;
  };

  return dfs(start.r, start.c, 0, new Set());
}

function assertTemplatesSolvable() {
  for (const template of TEMPLATES) {
    const grid = parseMap(template.map);
    if (
      template.rows !== grid.length ||
      template.cols !== (grid[0]?.length ?? 0)
    ) {
      throw new Error(`Path template ${template.slug} has mismatched size`);
    }
    if (!pathHasSolution(grid, template.waypoints)) {
      throw new Error(`Path template ${template.slug} has no solution`);
    }
    const start = findCell(grid, "S");
    if (!start) throw new Error(`Path template ${template.slug} missing S`);
    const openExits = (
      [
        [0, 1],
        [1, 0],
        [0, -1],
        [-1, 0],
      ] as const
    ).filter(([dr, dc]) => {
      const r = start.r + dr;
      const c = start.c + dc;
      const tile = grid[r]?.[c];
      return Boolean(tile && tile !== "#");
    }).length;
    if (openExits === 0) {
      throw new Error(`Path template ${template.slug} traps S`);
    }
  }
}

assertTemplatesSolvable();

const BY_DIFFICULTY: Record<Difficulty, (t: PathTemplate) => boolean> = {
  easy: (t) => t.rows <= 5 && t.waypoints.length <= 1,
  medium: (t) => t.rows >= 5 && t.rows <= 7 && t.waypoints.length <= 2,
  hard: (t) => t.rows >= 8 && t.waypoints.length >= 2,
  obscure: (t) => t.rows >= 8 && t.waypoints.length >= 2,
  impossible: (t) => t.rows >= 9 && t.waypoints.length >= 3,
};

export function getPathPuzzle(
  dateKey: string,
  difficulty: Difficulty,
  seasonId: string | null = null,
): PathPuzzle {
  const pool = TEMPLATES.filter(BY_DIFFICULTY[difficulty]);
  const seed = hashSeed(
    "path",
    seasonId ?? "",
    dateKey,
    difficulty,
    dayIndex(dateKey),
  );
  const template = pool[pickIndex(seed, pool.length)]!;
  const grid = parseMap(template.map);

  return {
    id: `${template.slug}-${seasonId ?? "std"}-${dateKey}-${difficulty}`,
    title: seasonId ? `Seasonal: ${template.title}` : template.title,
    briefing: seasonId
      ? `Limited-time event. ${template.briefing}`
      : template.briefing,
    rows: template.rows,
    cols: template.cols,
    grid,
    waypoints: template.waypoints,
  };
}

export function coordKey(coord: PathCoord): string {
  return `${coord.r},${coord.c}`;
}

export function areAdjacent(a: PathCoord, b: PathCoord): boolean {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
}

export function isWalkable(cell: PathCell): boolean {
  return cell !== "#";
}

export function checkPath(
  puzzle: PathPuzzle,
  path: PathCoord[],
): { ok: true } | { ok: false; reason: string } {
  if (path.length < 2) {
    return { ok: false, reason: "Path is too short." };
  }

  const start = findCell(puzzle.grid, "S");
  const end = findCell(puzzle.grid, "E");
  if (!start || !end) {
    return { ok: false, reason: "Puzzle is malformed." };
  }

  const first = path[0]!;
  const last = path[path.length - 1]!;
  if (first.r !== start.r || first.c !== start.c) {
    return { ok: false, reason: "Path must start at S." };
  }
  if (last.r !== end.r || last.c !== end.c) {
    return { ok: false, reason: "Path must end at E." };
  }

  const seen = new Set<string>();
  for (let i = 0; i < path.length; i++) {
    const cell = path[i]!;
    if (
      cell.r < 0 ||
      cell.c < 0 ||
      cell.r >= puzzle.rows ||
      cell.c >= puzzle.cols
    ) {
      return { ok: false, reason: "Path leaves the board." };
    }
    const tile = puzzle.grid[cell.r]![cell.c]!;
    if (!isWalkable(tile)) {
      return { ok: false, reason: "Path hits a wall." };
    }
    const key = coordKey(cell);
    if (seen.has(key)) {
      return { ok: false, reason: "Path revisits a cell." };
    }
    seen.add(key);
    if (i > 0 && !areAdjacent(path[i - 1]!, cell)) {
      return { ok: false, reason: "Steps must be adjacent." };
    }
  }

  // Waypoints must appear in order along the path
  let wpIndex = 0;
  for (const cell of path) {
    const tile = puzzle.grid[cell.r]![cell.c]!;
    if (wpIndex < puzzle.waypoints.length && tile === puzzle.waypoints[wpIndex]) {
      wpIndex += 1;
    }
  }
  if (wpIndex < puzzle.waypoints.length) {
    return {
      ok: false,
      reason: `Visit checkpoint ${puzzle.waypoints[wpIndex]} before the exit.`,
    };
  }

  return { ok: true };
}

export function findStart(puzzle: PathPuzzle): PathCoord {
  return findCell(puzzle.grid, "S")!;
}
