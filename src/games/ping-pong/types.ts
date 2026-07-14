export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Paddle extends Rect {
  dy: number;
  prevY: number;
}

export interface Ball extends Rect {
  dx: number;
  dy: number;
}

export type Screen = 'menu' | 'playing' | 'ended';

export interface EndInfo {
  title: string;
  message: string;
}
