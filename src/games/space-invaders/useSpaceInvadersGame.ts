import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BULLET_HEIGHT,
  BULLET_SPEED,
  BULLET_WIDTH,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  ENEMY_BULLET_SPEED,
  ENEMY_COLS_BASE,
  ENEMY_HEIGHT,
  ENEMY_H_SPACING,
  ENEMY_ROWS_BASE,
  ENEMY_SHOOT_CHANCE_BASE,
  ENEMY_SPEED_X_BASE,
  ENEMY_SPRITE,
  ENEMY_START_Y,
  ENEMY_STEP_DOWN,
  ENEMY_V_SPACING,
  ENEMY_WIDTH,
  PIXEL,
  PLAYER_HEIGHT,
  PLAYER_SPEED,
  PLAYER_SPRITE,
  PLAYER_WIDTH,
  STORAGE_KEY,
} from './constants';
import type { EnemyGroup, GameState, OverlayState } from './types';

const rectIntersect = (
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: string[],
  x: number,
  y: number,
) {
  ctx.fillStyle = '#33ff33';
  sprite.forEach((row, ry) =>
    [...row].forEach((bit, cx) => {
      if (bit === '1') ctx.fillRect(x + cx * PIXEL, y + ry * PIXEL, PIXEL, PIXEL);
    }),
  );
}

function createInitialState(highscore: number): GameState {
  return {
    level: 1,
    player: { x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2, y: CANVAS_HEIGHT - PLAYER_HEIGHT - 10 },
    bullets: [],
    enemyBullets: [],
    enemies: [],
    keys: {},
    score: 0,
    lives: 3,
    gameOver: false,
    hitFlash: 0,
    invincible: false,
    paused: false,
    highscore,
    musicPlaying: false,
    enemyCanFire: false,
    soundEnabled: true,
  };
}

export function useSpaceInvadersGame(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const stateRef = useRef<GameState>(createInitialState(0));
  const rafRef = useRef<number>(0);
  const enemyFireTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const waveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  const [overlay, setOverlay] = useState<OverlayState>('start');
  const [waveMsg, setWaveMsg] = useState('WAVE 1');
  const [showWaveOverlay, setShowWaveOverlay] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [highscore, setHighscore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const syncUI = useCallback((s: GameState) => {
    setScore(s.score);
    setLives(s.lives);
    setLevel(s.level);
    setHighscore(s.highscore);
    setPaused(s.paused);
    setSoundEnabled(s.soundEnabled);
    setMusicPlaying(s.musicPlaying);
  }, []);

  const loadHighscore = useCallback(() => {
    const stored = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    stateRef.current.highscore = stored;
    setHighscore(stored);
  }, []);

  const saveHighscore = useCallback(() => {
    const s = stateRef.current;
    if (s.score > s.highscore) {
      s.highscore = s.score;
      localStorage.setItem(STORAGE_KEY, String(s.highscore));
      setHighscore(s.highscore);
    }
  }, []);

  const spawnWave = useCallback(() => {
    const s = stateRef.current;
    const rows = ENEMY_ROWS_BASE + Math.floor(s.level / 3);
    const speed = ENEMY_SPEED_X_BASE + (s.level - 1) * 0.3;
    const shoot = ENEMY_SHOOT_CHANCE_BASE * (1 + (s.level - 1) * 0.4);

    const enemies: EnemyGroup = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < ENEMY_COLS_BASE; c++) {
        enemies.push({
          x: 40 + c * (ENEMY_WIDTH + ENEMY_H_SPACING),
          y: ENEMY_START_Y + r * (ENEMY_HEIGHT + ENEMY_V_SPACING),
          alive: true,
        });
      }
    }
    enemies.speedX = speed;
    enemies.shootChance = shoot;
    s.enemies = enemies;

    s.enemyCanFire = false;
    clearTimeout(enemyFireTimeoutRef.current);
    enemyFireTimeoutRef.current = setTimeout(() => {
      stateRef.current.enemyCanFire = true;
    }, 2000);

    setWaveMsg(`WAVE ${s.level}`);
    setShowWaveOverlay(true);
    clearTimeout(waveTimeoutRef.current);
    waveTimeoutRef.current = setTimeout(() => setShowWaveOverlay(false), 1200);
  }, []);

  const playLaserPlayer = useCallback(() => {
    if (stateRef.current.soundEnabled) {
      new Audio('/assets/laser.mp3').play();
    }
  }, []);

  const playLaserAlien = useCallback(() => {
    if (stateRef.current.soundEnabled) {
      new Audio('/assets/laser-alien.mp3').play();
    }
  }, []);

  const fireBullet = useCallback(() => {
    const s = stateRef.current;
    s.bullets.push({
      x: s.player.x + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2,
      y: s.player.y - BULLET_HEIGHT,
    });
    playLaserPlayer();
  }, [playLaserPlayer]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const s = stateRef.current;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (!s.paused && overlay === 'playing') {
      if (s.keys['ArrowLeft']) s.player.x -= PLAYER_SPEED;
      if (s.keys['ArrowRight']) s.player.x += PLAYER_SPEED;
      s.player.x = Math.max(0, Math.min(CANVAS_WIDTH - PLAYER_WIDTH, s.player.x));

      s.bullets.forEach((b) => { b.y -= BULLET_SPEED; });
      s.bullets = s.bullets.filter((b) => b.y + BULLET_HEIGHT > 0);

      s.enemyBullets.forEach((b) => { b.y += ENEMY_BULLET_SPEED; });
      s.enemyBullets = s.enemyBullets.filter((b) => b.y < CANVAS_HEIGHT);

      let edge = false;
      s.enemies.forEach((e) => {
        if (!e.alive) return;
        e.x += s.enemies.speedX ?? 1;
        if (e.x <= 0 || e.x + ENEMY_WIDTH >= CANVAS_WIDTH) edge = true;
      });
      if (edge) {
        s.enemies.speedX = (s.enemies.speedX ?? 1) * -1;
        s.enemies.forEach((e) => {
          e.y += ENEMY_STEP_DOWN;
          if (e.alive && e.y + ENEMY_HEIGHT >= s.player.y) s.gameOver = true;
        });
      }

      s.enemies.forEach((e) => {
        if (!e.alive) return;
        if (s.enemyCanFire && Math.random() < (s.enemies.shootChance ?? 0)) {
          s.enemyBullets.push({
            x: e.x + ENEMY_WIDTH / 2 - BULLET_WIDTH / 2,
            y: e.y + ENEMY_HEIGHT,
          });
          playLaserAlien();
        }
      });

      s.bullets.forEach((b) =>
        s.enemies.forEach((e) => {
          if (e.alive && rectIntersect(b.x, b.y, BULLET_WIDTH, BULLET_HEIGHT, e.x, e.y, ENEMY_WIDTH, ENEMY_HEIGHT)) {
            e.alive = false;
            b.hit = true;
            s.score += 100;
          }
        }),
      );
      s.bullets = s.bullets.filter((b) => !b.hit);

      if (!s.invincible) {
        s.enemyBullets.forEach((b) => {
          if (rectIntersect(b.x, b.y, BULLET_WIDTH, BULLET_HEIGHT, s.player.x, s.player.y, PLAYER_WIDTH, PLAYER_HEIGHT)) {
            b.hit = true;
            s.lives--;
            s.invincible = true;
            s.hitFlash = 60;
            if (s.lives <= 0) s.gameOver = true;
          }
        });
      }
      s.enemyBullets = s.enemyBullets.filter((b) => !b.hit);

      if (s.invincible && --s.hitFlash <= 0) s.invincible = false;

      if (s.enemies.every((e) => !e.alive)) {
        if (s.level >= 26) {
          s.gameOver = true;
          saveHighscore();
          setOverlay('win');
          return;
        }
        s.level++;
        spawnWave();
      }

      syncUI(s);

      if (s.gameOver) {
        saveHighscore();
        setOverlay('gameOver');
        return;
      }
    }

    if (!s.invincible || Math.floor(s.hitFlash / 4) % 2) {
      drawSprite(ctx, PLAYER_SPRITE, s.player.x, s.player.y);
    }
    s.enemies.forEach((e) => e.alive && drawSprite(ctx, ENEMY_SPRITE, e.x, e.y));

    ctx.fillStyle = '#33ff33';
    s.bullets.forEach((b) => ctx.fillRect(b.x, b.y, BULLET_WIDTH, BULLET_HEIGHT));
    s.enemyBullets.forEach((b) => ctx.fillRect(b.x, b.y, BULLET_WIDTH, BULLET_HEIGHT));

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [canvasRef, overlay, playLaserAlien, saveHighscore, spawnWave, syncUI]);

  const initGame = useCallback(() => {
    loadHighscore();
    const hs = stateRef.current.highscore;
    stateRef.current = createInitialState(hs);
    if (musicPlaying && bgMusicRef.current) {
      bgMusicRef.current.play().catch(() => {});
    }
    spawnWave();
    syncUI(stateRef.current);
  }, [loadHighscore, musicPlaying, spawnWave, syncUI]);

  const startGame = useCallback(() => {
    setOverlay('playing');
    initGame();
  }, [initGame]);

  const restartGame = useCallback(() => {
    setOverlay('playing');
    initGame();
  }, [initGame]);

  const togglePause = useCallback(() => {
    const s = stateRef.current;
    s.paused = !s.paused;
    setPaused(s.paused);
  }, []);

  const toggleSound = useCallback(() => {
    const s = stateRef.current;
    s.soundEnabled = !s.soundEnabled;
    setSoundEnabled(s.soundEnabled);
  }, []);

  const toggleMusic = useCallback(() => {
    const music = bgMusicRef.current;
    if (!music) return;
    const s = stateRef.current;
    s.musicPlaying = !s.musicPlaying;
    setMusicPlaying(s.musicPlaying);
    if (s.musicPlaying) {
      music.play().catch(() => {});
    } else {
      music.pause();
    }
  }, []);

  const enterFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }, []);

  const bindKey = useCallback((key: string, pressed: boolean) => {
    stateRef.current.keys[key] = pressed;
    if (pressed && key === ' ') fireBullet();
  }, [fireBullet]);

  useEffect(() => {
    bgMusicRef.current = new Audio('/assets/8-bit.mp3');
    bgMusicRef.current.loop = true;
    bgMusicRef.current.volume = 0.4;
    loadHighscore();

    return () => {
      bgMusicRef.current?.pause();
      cancelAnimationFrame(rafRef.current);
      clearTimeout(enemyFireTimeoutRef.current);
      clearTimeout(waveTimeoutRef.current);
    };
  }, [loadHighscore]);

  useEffect(() => {
    if (overlay === 'playing') {
      rafRef.current = requestAnimationFrame(gameLoop);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [overlay, gameLoop]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') { togglePause(); return; }
      if (e.key === 'm' || e.key === 'M') { toggleSound(); return; }
      if (overlay !== 'playing') return;
      stateRef.current.keys[e.key] = true;
      if (e.key === ' ') { e.preventDefault(); fireBullet(); }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key] = false;
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, [overlay, togglePause, toggleSound, fireBullet]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  return {
    overlay,
    waveMsg,
    showWaveOverlay,
    score,
    lives,
    level,
    highscore,
    paused,
    soundEnabled,
    musicPlaying,
    isFullscreen,
    startGame,
    restartGame,
    togglePause,
    toggleSound,
    toggleMusic,
    enterFullscreen,
    exitFullscreen,
    bindKey,
  };
}
