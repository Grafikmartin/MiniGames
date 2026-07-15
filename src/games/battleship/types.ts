export type Orientation = 'horizontal' | 'vertical';

export type ShipType = 'battleship' | 'cruiser' | 'frigate' | 'submarine';

export type GamePhase =
  | 'placement'
  | 'aiPlacement'
  | 'playerSelectingTargets'
  | 'playerResolvingShots'
  | 'aiThinking'
  | 'aiResolvingShots'
  | 'victory'
  | 'defeat';

export interface Coordinate {
  row: number;
  col: number;
}

export interface Ship {
  id: string;
  type: ShipType;
  length: number;
  orientation: Orientation;
  origin: Coordinate;
  hits: number;
  sunk: boolean;
}

export interface BoardCell {
  shipId: string | null;
  shot: 'none' | 'miss' | 'hit';
}

export type Board = BoardCell[][];

export interface RadarCell {
  shot: 'none' | 'miss' | 'hit' | 'sunk';
}

export type RadarBoard = RadarCell[][];

export interface ShotResult {
  coord: Coordinate;
  hit: boolean;
  sunk: boolean;
  shipId: string | null;
}

export interface HuntState {
  mode: 'search' | 'hunt';
  unsunkHits: Coordinate[];
  direction: { dr: number; dc: number } | null;
  anchor: Coordinate | null;
}

export interface GameMessage {
  text: string;
  key: number;
}

export interface PlacementPreview {
  type: ShipType;
  length: number;
  orientation: Orientation;
  origin: Coordinate;
  valid: boolean;
}

export interface BattleshipState {
  phase: GamePhase;
  playerBoard: Board;
  playerShips: Ship[];
  enemyBoard: Board;
  enemyShips: Ship[];
  radar: RadarBoard;
  placementQueue: ShipType[];
  placementIndex: number;
  preview: PlacementPreview | null;
  pendingShot: Coordinate | null;
  selectedTargets: Coordinate[];
  cursor: Coordinate;
  shotsRemaining: number;
  activeBoard: 'own' | 'enemy';
  message: GameMessage;
  animatingCells: Coordinate[];
  soundEnabled: boolean;
  aiHunt: HuntState;
  aiMemory: RadarBoard;
  aiShotsRemaining: number;
}

export type BattleshipAction =
  | { type: 'RESET' }
  | { type: 'RANDOM_PLACE' }
  | { type: 'MOVE_PREVIEW'; delta: { dr: number; dc: number } }
  | { type: 'ROTATE_PREVIEW' }
  | { type: 'SET_PREVIEW_ORIGIN'; origin: Coordinate }
  | { type: 'CONFIRM_PLACEMENT' }
  | { type: 'START_BATTLE' }
  | { type: 'MOVE_CURSOR'; delta: { dr: number; dc: number } }
  | { type: 'FIRE_SHOT'; coord: Coordinate }
  | { type: 'RESOLVE_PLAYER_SHOT' }
  | { type: 'PREPARE_AI_SHOT' }
  | { type: 'RESOLVE_AI_SHOT' }
  | { type: 'CLEAR_ANIMATIONS' }
  | { type: 'SET_ACTIVE_BOARD'; board: 'own' | 'enemy' }
  | { type: 'TOGGLE_SOUND' };
