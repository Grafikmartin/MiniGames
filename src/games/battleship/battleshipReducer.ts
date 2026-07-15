import { createInitialHuntState, pickAiShots, processAiShots } from './battleshipAI';
import {
  PLACEMENT_ORDER,
  SHIP_LABELS,
  SHIP_LENGTHS,
  SHOTS_PER_TURN,
} from './constants';
import {
  allShipsSunk,
  applyShot,
  buildPreview,
  createEmptyBoard,
  createEmptyRadar,
  createShip,
  defaultPreviewOrigin,
  fleetStrength,
  markSunkOnRadar,
  placeShipOnBoard,
  randomPlacement,
  shotsPerTurnForFleet,
  toggleOrientation,
  isAlreadyShot,
} from './gameLogic';
import type {
  BattleshipAction,
  BattleshipState,
  Coordinate,
  GameMessage,
  RadarBoard,
  ShotResult,
} from './types';
import { BOARD_SIZE } from './constants';

let messageCounter = 0;

function msg(text: string): GameMessage {
  messageCounter += 1;
  return { text, key: messageCounter };
}

export function createInitialState(): BattleshipState {
  return {
    phase: 'modeSelect',
    gameMode: 'classic',
    playerBoard: createEmptyBoard(),
    playerShips: [],
    enemyBoard: createEmptyBoard(),
    enemyShips: [],
    radar: createEmptyRadar(),
    placementQueue: [...PLACEMENT_ORDER],
    placementIndex: 0,
    preview: null,
    pendingShot: null,
    selectedTargets: [],
    cursor: { row: 0, col: 0 },
    shotsRemaining: SHOTS_PER_TURN,
    playerShotsPerTurn: SHOTS_PER_TURN,
    aiShotsPerTurn: SHOTS_PER_TURN,
    activeBoard: 'own',
    message: msg('Wähle einen Spielmodus.'),
    animatingCells: [],
    soundEnabled: true,
    aiHunt: createInitialHuntState(),
    aiMemory: createEmptyRadar(),
    aiShotsRemaining: 0,
  };
}

function turnShotsForSide(state: BattleshipState, side: 'player' | 'ai'): number {
  const ships = side === 'player' ? state.playerShips : state.enemyShips;
  return shotsPerTurnForFleet(fleetStrength(ships), state.gameMode);
}

function startPlacement(state: BattleshipState): BattleshipState {
  const type = PLACEMENT_ORDER[0];
  const origin = defaultPreviewOrigin(0);
  return {
    ...state,
    phase: 'placement',
    preview: buildPreview(type, origin, 'horizontal', state.playerBoard),
    message: msg('Platziere deine Flotte.'),
  };
}

function clampCursor(c: Coordinate): Coordinate {
  return {
    row: Math.max(0, Math.min(BOARD_SIZE - 1, c.row)),
    col: Math.max(0, Math.min(BOARD_SIZE - 1, c.col)),
  };
}

function finishPlacement(state: BattleshipState): BattleshipState {
  const enemy = randomPlacement();
  const playerShots = turnShotsForSide(state, 'player');
  return {
    ...state,
    phase: 'playerSelectingTargets',
    enemyBoard: enemy.board,
    enemyShips: enemy.ships,
    preview: null,
    activeBoard: 'enemy',
    message: msg('Wähle ein Ziel und feuere.'),
    shotsRemaining: playerShots,
    playerShotsPerTurn: playerShots,
    aiShotsPerTurn: turnShotsForSide({ ...state, enemyShips: enemy.ships }, 'ai'),
    aiHunt: createInitialHuntState(),
    aiMemory: createEmptyRadar(),
  };
}

function updateAiMemory(memory: RadarBoard, results: ShotResult[], ships: BattleshipState['playerShips']): RadarBoard {
  let next = memory.map((row) => row.map((c) => ({ ...c })));
  for (const result of results) {
    const { coord, hit, sunk } = result;
    next[coord.row][coord.col].shot = sunk ? 'sunk' : hit ? 'hit' : 'miss';
    if (sunk && result.shipId) {
      const sunkShip = ships.find((s) => s.id === result.shipId);
      if (sunkShip) next = markSunkOnRadar(next, sunkShip);
    }
  }
  return next;
}

function resolvePlayerSingleShot(state: BattleshipState): BattleshipState {
  const coord = state.pendingShot;
  if (!coord) return state;

  let board = state.enemyBoard;
  let ships = state.enemyShips.map((s) => ({ ...s }));
  let radar = state.radar.map((row) => row.map((c) => ({ ...c })));

  const applied = applyShot(board, ships, coord);
  board = applied.board;
  ships = applied.ships;
  const { result } = applied;

  if (result.sunk && result.shipId) {
    const sunkShip = ships.find((s) => s.id === result.shipId);
    if (sunkShip) radar = markSunkOnRadar(radar, sunkShip);
  } else {
    radar[coord.row][coord.col].shot = result.hit ? 'hit' : 'miss';
  }

  let messageText = 'WASSER.';
  if (result.sunk) messageText = 'SCHIFF VERSENKT!';
  else if (result.hit) messageText = 'TREFFER!';

  if (allShipsSunk(ships)) {
    return {
      ...state,
      enemyBoard: board,
      enemyShips: ships,
      radar,
      phase: 'victory',
      pendingShot: null,
      selectedTargets: [],
      activeBoard: 'enemy',
      message: msg('SIEG!'),
    };
  }

  const shotsRemaining = state.shotsRemaining - 1;

  if (shotsRemaining > 0) {
    return {
      ...state,
      enemyBoard: board,
      enemyShips: ships,
      radar,
      phase: 'playerSelectingTargets',
      pendingShot: null,
      selectedTargets: [],
      shotsRemaining,
      message: msg(`${messageText} Noch ${shotsRemaining} Schuss${shotsRemaining === 1 ? '' : 'e'}.`),
    };
  }

  return {
    ...state,
    enemyBoard: board,
    enemyShips: ships,
    radar,
    phase: 'aiThinking',
    pendingShot: null,
    selectedTargets: [],
    activeBoard: 'own',
    aiShotsPerTurn: turnShotsForSide({ ...state, enemyShips: ships }, 'ai'),
    aiShotsRemaining: turnShotsForSide({ ...state, enemyShips: ships }, 'ai'),
    message: msg(messageText),
  };
}

function updateAiMemorySingle(
  memory: RadarBoard,
  result: ShotResult,
  ships: BattleshipState['playerShips'],
): RadarBoard {
  return updateAiMemory(memory, [result], ships);
}

function prepareAiShot(state: BattleshipState): BattleshipState {
  const { shots } = pickAiShots(state.aiMemory, state.aiHunt, 1);
  const coord = shots[0];
  const aiTurnTotal = state.aiShotsPerTurn;
  const aiShotIndex = aiTurnTotal - state.aiShotsRemaining + 1;
  if (!coord) {
    const playerShots = turnShotsForSide(state, 'player');
    return {
      ...state,
      phase: 'playerSelectingTargets',
      activeBoard: 'enemy',
      shotsRemaining: playerShots,
      playerShotsPerTurn: playerShots,
      aiShotsRemaining: 0,
      message: msg('Gegner hat keine Ziele mehr.'),
    };
  }

  return {
    ...state,
    phase: 'aiResolvingShots',
    pendingShot: coord,
    animatingCells: [coord],
    message: msg(`Gegner feuert… (${aiShotIndex}/${aiTurnTotal})`),
  };
}

function resolveAiSingleShot(state: BattleshipState): BattleshipState {
  const coord = state.pendingShot;
  if (!coord) return state;

  let board = state.playerBoard;
  let ships = state.playerShips.map((s) => ({ ...s }));

  const applied = applyShot(board, ships, coord);
  board = applied.board;
  ships = applied.ships;
  const { result } = applied;

  const aiMemory = updateAiMemorySingle(state.aiMemory, result, ships);
  const aiHunt = processAiShots(aiMemory, state.aiHunt, [result]);

  let messageText = 'GEGNER: WASSER.';
  if (result.sunk) messageText = 'GEGNER VERSENKT DEIN SCHIFF!';
  else if (result.hit) messageText = 'GEGNER: TREFFER!';

  if (allShipsSunk(ships)) {
    return {
      ...state,
      playerBoard: board,
      playerShips: ships,
      aiMemory,
      aiHunt,
      phase: 'defeat',
      pendingShot: null,
      aiShotsRemaining: 0,
      activeBoard: 'own',
      message: msg('GAME OVER'),
    };
  }

  const aiShotsRemaining = state.aiShotsRemaining - 1;

  if (aiShotsRemaining > 0) {
    return {
      ...state,
      playerBoard: board,
      playerShips: ships,
      aiMemory,
      aiHunt,
      phase: 'aiThinking',
      pendingShot: null,
      aiShotsRemaining,
      activeBoard: 'own',
      message: msg(messageText),
    };
  }

  const playerShots = turnShotsForSide({ ...state, playerShips: ships }, 'player');

  return {
    ...state,
    playerBoard: board,
    playerShips: ships,
    aiMemory,
    aiHunt,
    phase: 'playerSelectingTargets',
    pendingShot: null,
    activeBoard: 'enemy',
    aiShotsRemaining: 0,
    shotsRemaining: playerShots,
    playerShotsPerTurn: playerShots,
    message: msg(messageText),
  };
}

export function battleshipReducer(state: BattleshipState, action: BattleshipAction): BattleshipState {
  switch (action.type) {
    case 'RESET':
      return createInitialState();

    case 'SELECT_GAME_MODE':
      return startPlacement({ ...state, gameMode: action.mode });

    case 'TOGGLE_SOUND':
      return { ...state, soundEnabled: !state.soundEnabled };

    case 'SET_ACTIVE_BOARD':
      return { ...state, activeBoard: action.board };

    case 'CLEAR_ANIMATIONS':
      return { ...state, animatingCells: [] };

    case 'RANDOM_PLACE': {
      const placed = randomPlacement();
      return finishPlacement({
        ...state,
        playerBoard: placed.board,
        playerShips: placed.ships,
        placementIndex: PLACEMENT_ORDER.length,
        preview: null,
        message: msg('Flotte zufällig platziert.'),
      });
    }

    case 'MOVE_PREVIEW': {
      if (state.phase !== 'placement' || !state.preview) return state;
      const origin = clampCursor({
        row: state.preview.origin.row + action.delta.dr,
        col: state.preview.origin.col + action.delta.dc,
      });
      return {
        ...state,
        preview: buildPreview(state.preview.type, origin, state.preview.orientation, state.playerBoard),
        cursor: origin,
      };
    }

    case 'ROTATE_PREVIEW': {
      if (state.phase !== 'placement' || !state.preview) return state;
      const orientation = toggleOrientation(state.preview.orientation);
      return {
        ...state,
        preview: buildPreview(state.preview.type, state.preview.origin, orientation, state.playerBoard),
      };
    }

    case 'SET_PREVIEW_ORIGIN': {
      if (state.phase !== 'placement' || !state.preview) return state;
      const origin = clampCursor(action.origin);
      return {
        ...state,
        preview: buildPreview(state.preview.type, origin, state.preview.orientation, state.playerBoard),
        cursor: origin,
      };
    }

    case 'CONFIRM_PLACEMENT': {
      if (state.phase !== 'placement' || !state.preview || !state.preview.valid) return state;
      const ship = createShip(
        state.preview.type,
        state.preview.origin,
        state.preview.orientation,
        `${state.preview.type}-${state.placementIndex}`,
      );
      const playerBoard = placeShipOnBoard(state.playerBoard, ship);
      const playerShips = [...state.playerShips, ship];
      const nextIndex = state.placementIndex + 1;

      if (nextIndex >= PLACEMENT_ORDER.length) {
        return finishPlacement({
          ...state,
          playerBoard,
          playerShips,
          placementIndex: nextIndex,
          preview: null,
          message: msg('Kampf beginnt!'),
        });
      }

      const nextType = PLACEMENT_ORDER[nextIndex];
      const origin = defaultPreviewOrigin(nextIndex);
      return {
        ...state,
        playerBoard,
        playerShips,
        placementIndex: nextIndex,
        preview: buildPreview(nextType, origin, 'horizontal', playerBoard),
        message: msg(`Platziere: ${SHIP_LABELS[nextType]} (${SHIP_LENGTHS[nextType]})`),
      };
    }

    case 'MOVE_CURSOR': {
      if (state.phase !== 'placement' && state.phase !== 'playerSelectingTargets') return state;
      const cursor = clampCursor({
        row: state.cursor.row + action.delta.dr,
        col: state.cursor.col + action.delta.dc,
      });
      if (state.phase === 'placement' && state.preview) {
        return {
          ...state,
          cursor,
          preview: buildPreview(state.preview.type, cursor, state.preview.orientation, state.playerBoard),
        };
      }
      return { ...state, cursor };
    }

    case 'FIRE_SHOT': {
      if (state.phase !== 'playerSelectingTargets') return state;
      if (state.shotsRemaining <= 0) return state;
      if (isAlreadyShot(state.radar, action.coord)) return state;
      return {
        ...state,
        phase: 'playerResolvingShots',
        pendingShot: action.coord,
        cursor: action.coord,
        animatingCells: [action.coord],
      };
    }

    case 'RESOLVE_PLAYER_SHOT':
      return resolvePlayerSingleShot(state);

    case 'PREPARE_AI_SHOT':
      if (state.phase !== 'aiThinking') return state;
      return prepareAiShot(state);

    case 'RESOLVE_AI_SHOT':
      return resolveAiSingleShot(state);

    default:
      return state;
  }
}

export { SHIP_LABELS, SHOTS_PER_TURN };
