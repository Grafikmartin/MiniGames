import { SHOTS_PER_TURN } from './constants';
import {
  coordKey,
  createInitialHuntState,
  getCheckerboardCandidates,
  getOrthogonalNeighbors,
  getUnshotCells,
  isAlreadyShot,
  isInBounds,
  parseCoordKey,
} from './gameLogic';
import type { Coordinate, HuntState, RadarBoard, ShotResult } from './types';

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function dedupeCoords(coords: Coordinate[]): Coordinate[] {
  const unique = new Map<string, Coordinate>();
  for (const c of coords) unique.set(coordKey(c), c);
  return [...unique.values()];
}

function hitsFromRadar(radar: RadarBoard): Coordinate[] {
  const hits: Coordinate[] = [];
  for (let row = 0; row < radar.length; row++) {
    for (let col = 0; col < radar[row].length; col++) {
      if (radar[row][col].shot === 'hit') hits.push({ row, col });
    }
  }
  return hits;
}

function syncHuntMeta(hits: Coordinate[]): Pick<HuntState, 'anchor' | 'direction'> {
  if (hits.length === 0) return { anchor: null, direction: null };
  if (hits.length === 1) return { anchor: hits[0], direction: null };

  const rows = new Set(hits.map((h) => h.row));
  const cols = new Set(hits.map((h) => h.col));

  if (rows.size === 1) {
    const row = hits[0].row;
    const minCol = Math.min(...hits.map((h) => h.col));
    return { anchor: { row, col: minCol }, direction: { dr: 0, dc: 1 } };
  }
  if (cols.size === 1) {
    const col = hits[0].col;
    const minRow = Math.min(...hits.map((h) => h.row));
    return { anchor: { row: minRow, col }, direction: { dr: 1, dc: 0 } };
  }

  return { anchor: hits[0], direction: null };
}

function prioritizeHuntTargets(hits: Coordinate[], candidates: Coordinate[]): Coordinate[] {
  if (hits.length < 2 || candidates.length <= 1) return candidates;

  const rows = new Set(hits.map((h) => h.row));
  const cols = new Set(hits.map((h) => h.col));

  if (rows.size === 1) {
    const row = hits[0].row;
    const minCol = Math.min(...hits.map((h) => h.col));
    const maxCol = Math.max(...hits.map((h) => h.col));
    const gaps = candidates.filter((c) => c.row === row && c.col > minCol && c.col < maxCol);
    const ends = candidates.filter((c) => c.row === row && (c.col === minCol - 1 || c.col === maxCol + 1));
    const rest = candidates.filter(
      (c) => !gaps.some((g) => coordKey(g) === coordKey(c)) && !ends.some((e) => coordKey(e) === coordKey(c)),
    );
    return [...gaps, ...ends, ...rest];
  }

  if (cols.size === 1) {
    const col = hits[0].col;
    const minRow = Math.min(...hits.map((h) => h.row));
    const maxRow = Math.max(...hits.map((h) => h.row));
    const gaps = candidates.filter((c) => c.col === col && c.row > minRow && c.row < maxRow);
    const ends = candidates.filter((c) => c.col === col && (c.row === minRow - 1 || c.row === maxRow + 1));
    const rest = candidates.filter(
      (c) => !gaps.some((g) => coordKey(g) === coordKey(c)) && !ends.some((e) => coordKey(e) === coordKey(c)),
    );
    return [...gaps, ...ends, ...rest];
  }

  return candidates;
}

/** Ziele rund um bekannte Treffer: Lücken füllen, Enden der Linie verlängern. */
export function huntTargets(state: HuntState, radar: RadarBoard): Coordinate[] {
  const hits = state.unsunkHits;
  if (hits.length === 0) return [];

  const candidates: Coordinate[] = [];
  const rows = new Set(hits.map((h) => h.row));
  const cols = new Set(hits.map((h) => h.col));

  if (rows.size === 1) {
    const row = hits[0].row;
    const minCol = Math.min(...hits.map((h) => h.col));
    const maxCol = Math.max(...hits.map((h) => h.col));
    for (let col = minCol; col <= maxCol; col++) {
      const c = { row, col };
      if (!isAlreadyShot(radar, c)) candidates.push(c);
    }
    const left = { row, col: minCol - 1 };
    const right = { row, col: maxCol + 1 };
    if (isInBounds(left) && !isAlreadyShot(radar, left)) candidates.push(left);
    if (isInBounds(right) && !isAlreadyShot(radar, right)) candidates.push(right);
  } else if (cols.size === 1) {
    const col = hits[0].col;
    const minRow = Math.min(...hits.map((h) => h.row));
    const maxRow = Math.max(...hits.map((h) => h.row));
    for (let row = minRow; row <= maxRow; row++) {
      const c = { row, col };
      if (!isAlreadyShot(radar, c)) candidates.push(c);
    }
    const up = { row: minRow - 1, col };
    const down = { row: maxRow + 1, col };
    if (isInBounds(up) && !isAlreadyShot(radar, up)) candidates.push(up);
    if (isInBounds(down) && !isAlreadyShot(radar, down)) candidates.push(down);
  } else {
    for (const hit of hits) {
      for (const n of getOrthogonalNeighbors(hit)) {
        if (!isAlreadyShot(radar, n)) candidates.push(n);
      }
    }
  }

  return prioritizeHuntTargets(hits, dedupeCoords(candidates));
}

export function updateHuntState(
  state: HuntState,
  results: ShotResult[],
  radar: RadarBoard,
): HuntState {
  let unsunkHits = [...state.unsunkHits];

  for (const result of results) {
    if (result.hit && !result.sunk) {
      const key = coordKey(result.coord);
      if (!unsunkHits.some((h) => coordKey(h) === key)) {
        unsunkHits.push(result.coord);
      }
    }
  }

  unsunkHits = dedupeCoords([...unsunkHits, ...hitsFromRadar(radar)]).filter(
    (h) => radar[h.row][h.col].shot === 'hit',
  );

  if (unsunkHits.length === 0) {
    return createInitialHuntState();
  }

  const meta = syncHuntMeta(unsunkHits);
  return {
    mode: 'hunt',
    unsunkHits,
    anchor: meta.anchor,
    direction: meta.direction,
  };
}

function searchTargets(radar: RadarBoard, used: Set<string>): Coordinate[] {
  const pool = getCheckerboardCandidates(radar).filter((c) => !used.has(coordKey(c)));
  if (pool.length > 0) return pool;
  return getUnshotCells(radar).filter((c) => !used.has(coordKey(c)));
}

export function pickAiShots(
  radar: RadarBoard,
  hunt: HuntState,
  count = SHOTS_PER_TURN,
  rng: () => number = Math.random,
): { shots: Coordinate[]; hunt: HuntState } {
  const shots: Coordinate[] = [];
  let currentHunt = hunt;
  const used = new Set<string>();

  for (let i = 0; i < count; i++) {
    const inHunt = currentHunt.mode === 'hunt' && currentHunt.unsunkHits.length > 0;
    let candidates = inHunt ? huntTargets(currentHunt, radar) : [];

    if (candidates.length === 0 && !inHunt) {
      candidates = searchTargets(radar, used);
    }

    if (candidates.length === 0 && inHunt) {
      currentHunt = createInitialHuntState();
      candidates = searchTargets(radar, used);
    }

    candidates = candidates.filter((c) => !used.has(coordKey(c)));
    if (candidates.length === 0) break;

    const pick =
      inHunt && currentHunt.unsunkHits.length >= 2
        ? candidates[0]
        : shuffle(candidates, rng)[0];
    shots.push(pick);
    used.add(coordKey(pick));
  }

  return { shots, hunt: currentHunt };
}

export function processAiShots(
  radar: RadarBoard,
  hunt: HuntState,
  results: ShotResult[],
): HuntState {
  return updateHuntState(hunt, results, radar);
}

export { createInitialHuntState, parseCoordKey };
