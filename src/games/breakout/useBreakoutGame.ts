import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CANVAS_WIDTH,
  DEFAULT_SETTINGS,
  PADDLE_SPEED,
  STORAGE_CLASSIC_HI,
  STORAGE_ENDLESS_HI,
  STORAGE_SETTINGS,
  type GameMode,
  type GameSettings,
} from './constants';
import { getLevel, endlessLevelIndex } from './breakoutLevels';
import { drawScene, setupCanvasDpr } from './breakoutDraw';
import {
  applyComboScore,
  clampDeltaMs,
  createBallOnPaddle,
  createPaddle,
  createParticles,
  isLevelComplete,
  launchBall,
  levelClearBonus,
  loadLevelBricks,
  movePaddle,
  parseHighscore,
  resetGameState,
  shrinkPaddleForLevel,
  speedForLevel,
  stepBall,
  updateHighscore,
  updateParticles,
} from './breakoutLogic';
import {
  playBrickDestroy,
  playBrickHit,
  playGameOver,
  playHighscore,
  playLaunch,
  playLevelComplete,
  playLifeLost,
  playPaddleHit,
  playStrongDamage,
  playWallHit,
  setRetroSoundEnabled,
  unlockAudio,
} from './sound';
import type { GamePhase, Paddle } from './types';

function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    return {
      mode: parsed.mode === 'endless' ? 'endless' : 'classic',
      soundOn: parsed.soundOn !== false,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function loadHighscore(mode: GameMode): number {
  const key = mode === 'classic' ? STORAGE_CLASSIC_HI : STORAGE_ENDLESS_HI;
  return parseHighscore(localStorage.getItem(key));
}

function saveHighscore(mode: GameMode, score: number) {
  const key = mode === 'classic' ? STORAGE_CLASSIC_HI : STORAGE_ENDLESS_HI;
  localStorage.setItem(key, String(score));
}

export function useBreakoutGame(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const settingsRef = useRef<GameSettings>(loadSettings());
  const phaseRef = useRef<GamePhase>('menu');
  const runningRef = useRef(false);
  const rafRef = useRef(0);
  const lastTimeRef = useRef(0);
  const pausedByVisibilityRef = useRef(false);

  const paddleRef = useRef<Paddle>(createPaddle());
  const ballRef = useRef(createBallOnPaddle(paddleRef.current));
  const bricksRef = useRef(loadLevelBricks(0));
  const particlesRef = useRef<ReturnType<typeof createParticles>>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const levelIndexRef = useRef(0);
  const endlessWaveRef = useRef(0);
  const comboRef = useRef(0);
  const lastHitTimeRef = useRef(0);
  const ballSpeedRef = useRef(speedForLevel(ballRef.current.speed, 0));
  const paddleFlashUntilRef = useRef(0);
  const highscoreRef = useRef(loadHighscore(settingsRef.current.mode));
  const keysRef = useRef({ left: false, right: false });
  const pointerXRef = useRef<number | null>(null);
  const pointerActiveRef = useRef(false);
  const mouseControlRef = useRef(false);
  const touchButtonsRef = useRef({ left: false, right: false });
  const lifeLostTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const levelCompleteTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [phase, setPhase] = useState<GamePhase>('menu');
  const [settings, setSettings] = useState<GameSettings>(settingsRef.current);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [levelIndex, setLevelIndex] = useState(0);
  const [highscore, setHighscore] = useState(highscoreRef.current);
  const [showHelp, setShowHelp] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [reducedMotion, setReducedMotion] = useState(false);

  const syncUI = useCallback(() => {
    setScore(scoreRef.current);
    setLives(livesRef.current);
    setLevelIndex(levelIndexRef.current);
    setHighscore(highscoreRef.current);
    setPhase(phaseRef.current);
  }, []);

  const play = useCallback((fn: () => void) => {
    if (!settingsRef.current.soundOn) return;
    unlockAudio();
    fn();
  }, []);

  const saveSettings = useCallback((next: GameSettings) => {
    settingsRef.current = next;
    setSettings(next);
    setRetroSoundEnabled(next.soundOn);
    localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(next));
    highscoreRef.current = loadHighscore(next.mode);
    setHighscore(highscoreRef.current);
  }, []);

  const setPhaseState = useCallback((next: GamePhase, message = '') => {
    phaseRef.current = next;
    setPhase(next);
    setStatusMessage(message);
  }, []);

  const startGame = useCallback(() => {
    unlockAudio();
    const mode = settingsRef.current.mode;
    highscoreRef.current = loadHighscore(mode);
    const state = resetGameState(0);
    paddleRef.current = state.paddle;
    ballRef.current = state.ball;
    bricksRef.current = state.bricks;
    scoreRef.current = 0;
    livesRef.current = state.lives;
    levelIndexRef.current = 0;
    endlessWaveRef.current = 0;
    ballSpeedRef.current = state.ballSpeed;
    comboRef.current = 0;
    particlesRef.current = [];
    syncUI();
    setShowHelp(false);
    setPhaseState('ready', 'Leertaste oder Tippen – Ball starten');
  }, [setPhaseState, syncUI]);

  const launch = useCallback(() => {
    if (phaseRef.current !== 'ready') return;
    launchBall(ballRef.current, paddleRef.current);
    play(playLaunch);
    setPhaseState('playing');
  }, [play, setPhaseState]);

  const nextLevel = useCallback(() => {
    const mode = settingsRef.current.mode;
    if (mode === 'classic') {
      const next = levelIndexRef.current + 1;
      if (next >= 5) {
        const prevHi = highscoreRef.current;
        highscoreRef.current = updateHighscore(prevHi, scoreRef.current);
        if (highscoreRef.current > prevHi) saveHighscore(mode, highscoreRef.current);
        setPhaseState('gameOver', 'Alle Level geschafft!');
        play(playLevelComplete);
        syncUI();
        return;
      }
      levelIndexRef.current = next;
    } else {
      endlessWaveRef.current += 1;
      levelIndexRef.current = endlessLevelIndex(endlessWaveRef.current);
      ballSpeedRef.current = Math.min(520, ballSpeedRef.current + 20);
    }
    const paddle = createPaddle();
    shrinkPaddleForLevel(paddle, levelIndexRef.current);
    paddleRef.current = paddle;
    ballRef.current = createBallOnPaddle(paddle, ballSpeedRef.current);
    bricksRef.current = loadLevelBricks(levelIndexRef.current);
    syncUI();
    setPhaseState('ready', `Level ${levelIndexRef.current + 1} – Ball starten`);
  }, [play, setPhaseState, syncUI]);

  const handleBallLost = useCallback(() => {
    play(playLifeLost);
    livesRef.current -= 1;
    syncUI();
    if (livesRef.current <= 0) {
      const mode = settingsRef.current.mode;
      const prevHi = highscoreRef.current;
      highscoreRef.current = updateHighscore(prevHi, scoreRef.current);
      if (highscoreRef.current > prevHi) {
        saveHighscore(mode, highscoreRef.current);
        play(playHighscore);
      }
      setPhaseState('gameOver', 'Keine Leben mehr');
      play(playGameOver);
      return;
    }
    ballRef.current = createBallOnPaddle(paddleRef.current, ballSpeedRef.current);
    ballRef.current.launched = false;
    setPhaseState('lifeLost', 'Leben verloren');
    lifeLostTimerRef.current = setTimeout(() => {
      if (phaseRef.current === 'lifeLost') {
        setPhaseState('ready', 'Ball erneut starten');
      }
    }, 800);
  }, [play, setPhaseState, syncUI]);

  const handleLevelComplete = useCallback(() => {
    const bonus = levelClearBonus(levelIndexRef.current);
    scoreRef.current += bonus;
    play(playLevelComplete);
    syncUI();
    setPhaseState('levelComplete', `Level-Bonus: +${bonus}`);
    levelCompleteTimerRef.current = setTimeout(() => {
      if (phaseRef.current === 'levelComplete') nextLevel();
    }, 1400);
  }, [nextLevel, play, setPhaseState, syncUI]);

  const updatePaddleInput = useCallback(
    (dt: number) => {
      const paddle = paddleRef.current;
      let dx = 0;
      if (keysRef.current.left || touchButtonsRef.current.left) dx -= PADDLE_SPEED * dt;
      if (keysRef.current.right || touchButtonsRef.current.right) dx += PADDLE_SPEED * dt;

      const useMouse =
        mouseControlRef.current &&
        pointerXRef.current !== null &&
        !touchButtonsRef.current.left &&
        !touchButtonsRef.current.right;

      if (useMouse) {
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const relative = (pointerXRef.current - rect.left) / rect.width;
          const logicalCenter = relative * CANVAS_WIDTH;
          movePaddle(paddle, logicalCenter - paddle.width / 2);
          return;
        }
      }

      if (dx !== 0) movePaddle(paddle, paddle.x + dx);
    },
    [canvasRef],
  );

  const tick = useCallback(
    (timestamp: number) => {
      if (!runningRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (lastTimeRef.current === 0) lastTimeRef.current = timestamp;
      const dt = clampDeltaMs(timestamp - lastTimeRef.current);
      lastTimeRef.current = timestamp;

      const currentPhase = phaseRef.current;
      if (currentPhase === 'playing') {
        updatePaddleInput(dt);
        const result = stepBall(ballRef.current, paddleRef.current, bricksRef.current, dt);

        if (result.wallHit && result.wallHit.type !== 'bottom') play(playWallHit);
        if (result.paddleHit) {
          play(playPaddleHit);
          paddleFlashUntilRef.current = performance.now() + 100;
        }
        if (result.brickHit) {
          const now = performance.now();
          if (result.brickHit.destroyed) {
            play(playBrickDestroy);
            const cx = result.brickHit.brick.x + result.brickHit.brick.width / 2;
            const cy = result.brickHit.brick.y + result.brickHit.brick.height / 2;
            particlesRef.current.push(...createParticles(cx, cy));
          } else if (result.brickHit.brick.type === 2) {
            play(playStrongDamage);
          } else {
            play(playBrickHit);
          }
          const comboResult = applyComboScore(
            result.brickHit.score,
            comboRef.current,
            lastHitTimeRef.current,
            now,
          );
          comboRef.current = comboResult.combo;
          lastHitTimeRef.current = now;
          scoreRef.current += comboResult.score;
          syncUI();
        }
        if (result.ballLost) handleBallLost();
        else if (isLevelComplete(bricksRef.current)) handleLevelComplete();
      } else if (currentPhase === 'ready' || currentPhase === 'lifeLost') {
        updatePaddleInput(dt);
        ballRef.current.x =
          paddleRef.current.x + paddleRef.current.width / 2 - ballRef.current.size / 2;
        ballRef.current.y = paddleRef.current.y - ballRef.current.size - 2;
      }

      particlesRef.current = updateParticles(particlesRef.current, dt);
      drawScene(
        ctx,
        paddleRef.current,
        ballRef.current,
        bricksRef.current,
        particlesRef.current,
        performance.now(),
        paddleFlashUntilRef.current,
        reducedMotion,
      );

      rafRef.current = requestAnimationFrame(tick);
    },
    [
      canvasRef,
      handleBallLost,
      handleLevelComplete,
      play,
      reducedMotion,
      syncUI,
      updatePaddleInput,
    ],
  );

  const startLoop = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    lastTimeRef.current = 0;
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const stopLoop = useCallback(() => {
    runningRef.current = false;
    cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    if (phase === 'menu') {
      stopLoop();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setupCanvasDpr(canvas, ctx);
    startLoop();

    return stopLoop;
  }, [phase, canvasRef, startLoop, stopLoop]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    setRetroSoundEnabled(settingsRef.current.soundOn);
    return () => {
      clearTimeout(lifeLostTimerRef.current);
      clearTimeout(levelCompleteTimerRef.current);
    };
  }, []);

  const togglePause = useCallback(() => {
    if (phaseRef.current === 'playing') setPhaseState('paused');
    else if (phaseRef.current === 'paused') {
      lastTimeRef.current = 0;
      setPhaseState('playing');
    }
  }, [setPhaseState]);

  const backToMenu = useCallback(() => {
    clearTimeout(lifeLostTimerRef.current);
    clearTimeout(levelCompleteTimerRef.current);
    setPhaseState('menu');
    setShowHelp(false);
  }, [setPhaseState]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const p = phaseRef.current;
      if (p === 'gameOver' && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        startGame();
        return;
      }
      if (p === 'menu') return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        keysRef.current.left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        keysRef.current.right = true;
      }
      if (e.key === ' ' || e.key === 'Enter') {
        if (p === 'ready') {
          e.preventDefault();
          launch();
        }
      }
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        e.preventDefault();
        togglePause();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = false;
    };

    const onVisibility = () => {
      if (document.hidden && phaseRef.current === 'playing') {
        pausedByVisibilityRef.current = true;
        setPhaseState('paused');
      } else if (
        !document.hidden &&
        pausedByVisibilityRef.current &&
        phaseRef.current === 'paused'
      ) {
        pausedByVisibilityRef.current = false;
        lastTimeRef.current = 0;
        setPhaseState('playing');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [launch, setPhaseState, startGame, togglePause]);

  useEffect(() => {
    if (phase === 'menu') {
      mouseControlRef.current = false;
      pointerXRef.current = null;
      return;
    }

    const onMouseMove = (e: MouseEvent) => {
      mouseControlRef.current = true;
      pointerXRef.current = e.clientX;
    };

    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, [phase]);

  const handlePointerMove = useCallback((clientX: number) => {
    mouseControlRef.current = true;
    pointerXRef.current = clientX;
  }, []);

  const handlePointerDown = useCallback(
    (clientX: number) => {
      unlockAudio();
      pointerActiveRef.current = true;
      pointerXRef.current = clientX;
      if (phaseRef.current === 'ready') launch();
    },
    [launch],
  );

  const handlePointerUp = useCallback(() => {
    pointerActiveRef.current = false;
  }, []);

  const handlePointerLeave = useCallback(() => {
    /* Mausposition bleibt über window.mousemove aktiv – auch außerhalb des Canvas. */
  }, []);

  const setTouchButton = useCallback((side: 'left' | 'right', pressed: boolean) => {
    touchButtonsRef.current[side] = pressed;
  }, []);

  return {
    phase,
    settings,
    score,
    lives,
    levelIndex,
    highscore,
    showHelp,
    statusMessage,
    levelName: getLevel(levelIndex).name,
    saveSettings,
    startGame,
    launch,
    togglePause,
    backToMenu,
    setShowHelp,
    handlePointerMove,
    handlePointerDown,
    handlePointerUp,
    handlePointerLeave,
    setTouchButton,
  };
}
