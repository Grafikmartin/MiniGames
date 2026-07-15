import { SHOTS_PER_TURN } from './constants';
import {
  coordKey,
  createInitialHuntState,
  getCheckerboardCandidates,
  getOrthogonalNeighbors,
  getUnshotCells,
  isAlreadyShot,
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

export function updateHuntState(
  state: HuntState,
  results: ShotResult[],
  radar: RadarBoard,
): HuntState {
  let next: HuntState = {
    mode: state.mode,
    unsunkHits: [...state.unsunkHits],
    direction: state.direction,
    anchor: state.anchor,
  };

  for (const result of results) {
    if (result.sunk) {
      next = createInitialHuntState();
      continue;
    }
    if (result.hit) {
      next.mode = 'hunt';
      const key = coordKey(result.coord);
      if (!next.unsunkHits.some((h) => coordKey(h) === key)) {
        next.unsunkHits.push(result.coord);
      }
      if (!next.anchor) next.anchor = result.coord;

      if (next.unsunkHits.length >= 2 && !next.direction) {
        const [a, b] = next.unsunkHits;
        if (a.row === b.row) next.direction = { dr: 0, dc: a.col < b.col ? 1 : -1 };
        else if (a.col === b.col) next.direction = { dr: a.row < b.row ? 1 : -1, dc: 0 };
      }
    }
  }

  next.unsunkHits = next.unsunkHits.filter((h) => radar[h.row][h.col].shot === 'hit');
  if (next.unsunkHits.length === 0) {
    return createInitialHuntState();
  }

  return next;
}

function huntTargets(state: HuntState, radar: RadarBoard): Coordinate[] {
  const candidates: Coordinate[] = [];

  if (state.direction && state.anchor) {
    const { dr, dc } = state.direction;
    let steps = 1;
    while (steps < 10) {
      const forward = {
        row: state.anchor.row + dr * steps,
        col: state.anchor.col + dc * steps,
      };
      if (isAlreadyShot(radar, forward)) {
        if (radar[forward.row]?.[forward.col]?.shot === 'hit') {
          steps++;
          continue;
        }
        break;
      }
      candidates.push(forward);
      steps++;
    }
    steps = 1;
    while (steps < 10) {
      const backward = {
        row: state.anchor.row - dr * steps,
        col: state.anchor.col - dc * steps,
      };
      if (isAlreadyShot(radar, backward)) {
        if (radar[backward.row]?.[backward.col]?.shot === 'hit') {
          steps++;
          continue;
        }
        break;
      }
      candidates.push(backward);
      steps++;
    }
  }

  if (candidates.length === 0 && state.unsunkHits.length > 0) {
    for (const hit of state.unsunkHits) {
      for (const n of getOrthogonalNeighbors(hit)) {
        if (!isAlreadyShot(radar, n)) candidates.push(n);
      }
    }
  }

  const unique = new Map<string, Coordinate>();
  for (const c of candidates) {
    if (!isAlreadyShot(radar, c)) unique.set(coordKey(c), c);
  }
  return [...unique.values()];
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
    let candidates = huntTargets(currentHunt, radar);

    if (candidates.length === 0) {
      const pool = getCheckerboardCandidates(radar).filter((c) => !used.has(coordKey(c)));
      if (pool.length === 0) {
        const fallback = getUnshotCells(radar).filter((c) => !used.has(coordKey(c)));
        if (fallback.length === 0) break;
        candidates = fallback;
      } else {
        candidates = pool;
      }
    }

    candidates = candidates.filter((c) => !used.has(coordKey(c)));
    if (candidates.length === 0) break;

    const ordered = shuffle(candidates, rng);
    const pick = ordered[0];
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
