export type GameStatus = 'available' | 'coming-soon';

export interface GameInfo {
  id: string;
  title: string;
  description: string;
  path: string;
  status: GameStatus;
  icon: string;
}

export const games: GameInfo[] = [
  {
    id: 'space-invaders',
    title: 'Space Invaders',
    description: 'Verteidige die Erde gegen endlose Alien-Wellen.',
    path: '/space-invaders',
    status: 'available',
    icon: '👾',
  },
  {
    id: 'vier-gewinnt',
    title: 'Vier gewinnt',
    description: 'Verbinde vier Steine in einer Reihe und gewinne.',
    path: '/vier-gewinnt',
    status: 'coming-soon',
    icon: '🔴',
  },
  {
    id: 'ping-pong',
    title: 'Ping Pong',
    description: 'Klassisches Paddle-Duell gegen den Computer.',
    path: '/ping-pong',
    status: 'coming-soon',
    icon: '🏓',
  },
  {
    id: 'snake',
    title: 'Snake',
    description: 'Wachse mit jedem Apfel – aber pass auf die Wände auf.',
    path: '/snake',
    status: 'coming-soon',
    icon: '🐍',
  },
];
