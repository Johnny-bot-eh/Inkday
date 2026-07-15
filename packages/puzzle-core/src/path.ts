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
      "...#.",
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
      "##..#.",
      "...##.",
      ".#....",
      "...#.E",
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
      "..#.#.#",
      "##....#",
      "...##..",
      ".#.#.#.",
      "...#...",
      "#.#.#.E",
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
      ".#####.",
      ".#1..#.",
      ".##.#.#",
      ".#..2#.",
      ".#3##..",
      "....#.E",
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
      "..#.#.",
      "##1...",
      "...##.",
      ".#..2.",
      "..##.#",
      "......",
      ".#.#.E",
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

const BY_DIFFICULTY: Record<Difficulty, (t: PathTemplate) => boolean> = {
  easy: (t) => t.rows <= 5 && t.waypoints.length <= 1,
  medium: (t) => t.rows >= 5 && t.rows <= 7 && t.waypoints.length <= 2,
  hard: (t) => t.rows >= 6,
};

export function getPathPuzzle(
  dateKey: string,
  difficulty: Difficulty,
): PathPuzzle {
  const pool = TEMPLATES.filter(BY_DIFFICULTY[difficulty]);
  const seed = hashSeed("path", dateKey, difficulty, dayIndex(dateKey));
  const template = pool[pickIndex(seed, pool.length)]!;
  const grid = parseMap(template.map);

  return {
    id: `${template.slug}-${dateKey}-${difficulty}`,
    title: template.title,
    briefing: template.briefing,
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
