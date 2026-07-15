import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CANVAS_MAX_HEIGHT,
  COLORS,
  GRID_SIZE,
  MIN_SWIPE_DISTANCE,
  STORAGE_KEY,
} from './constants';
import { snakeSound, unlockAudio } from './sound';
import type { GamePhase, Point, Velocity } from './types';

function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

function buildStartSnake(tileCountX: number, tileCountY: number): Point[] {
  const startSnake: Point[] = [];
  const centerX = Math.floor(tileCountX / 2);
  const centerY = Math.floor(tileCountY / 2);

  for (let i = 0; i < 40; i++) {
    let x: number;
    let y: number;
    if (i < 12) {
      x = centerX - 6 + i;
      y = centerY - 5;
    } else if (i < 22) {
      x = centerX + 5;
      y = centerY - 5 + (i - 11);
    } else if (i < 32) {
      x = centerX + 5 - (i - 21);
      y = centerY + 5;
    } else if (i < 38) {
      x = centerX - 5;
      y = centerY + 5 - (i - 31);
    } else {
      x = centerX - 5 + (i - 37);
      y = centerY - 1;
    }
    if (x >= 0 && x < tileCountX && y >= 0 && y < tileCountY) {
      startSnake.push({ x, y });
    }
  }
  return startSnake;
}

export function useSnakeGame(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  consoleRef: React.RefObject<HTMLDivElement | null>,
) {
  const snakeRef = useRef<Point[]>([]);
  const foodRef = useRef<Point>({ x: 0, y: 0 });
  const velocityRef = useRef<Velocity>({ x: 0, y: 0 });
  const scoreRef = useRef(0);
  const highscoreRef = useRef(0);
  const tileCountRef = useRef({ x: 20, y: 20 });
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const phaseRef = useRef<GamePhase>('start');
  const audioEnabledRef = useRef(false);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const gameSpeedRef = useRef(isTouchDevice() ? 300 : 200);
  const readyRef = useRef(false);

  const [score, setScore] = useState(0);
  const [highscore, setHighscore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const syncScore = useCallback(() => {
    setScore(scoreRef.current);
    setHighscore(highscoreRef.current);
    setPaused(phaseRef.current === 'paused');
  }, []);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  }, [canvasRef]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = consoleRef.current;
    if (!canvas || !container) return false;

    const containerWidth = Math.max(container.clientWidth - 16, GRID_SIZE * 10);
    const containerHeight = Math.max(
      Math.min(CANVAS_MAX_HEIGHT, window.innerHeight * 0.5),
      GRID_SIZE * 10,
    );

    const tileCountX = Math.max(Math.floor(containerWidth / GRID_SIZE), 10);
    const tileCountY = Math.max(Math.floor(containerHeight / GRID_SIZE), 10);

    tileCountRef.current = { x: tileCountX, y: tileCountY };
    canvas.width = tileCountX * GRID_SIZE;
    canvas.height = tileCountY * GRID_SIZE;
    return true;
  }, [canvasRef, consoleRef]);

  const drawStartScreen = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;

    const { x: tileCountX, y: tileCountY } = tileCountRef.current;
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const startSnake = buildStartSnake(tileCountX, tileCountY);
    ctx.fillStyle = COLORS.snake;
    startSnake.forEach((segment) => {
      ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE - 1, GRID_SIZE - 1);
    });

    if (startSnake.length > 0) {
      const head = startSnake[0];
      const foodX = head.x + 6;
      const foodY = head.y + 4;
      if (foodX >= 0 && foodX < tileCountX && foodY >= 0 && foodY < tileCountY) {
        ctx.fillStyle = COLORS.food;
        ctx.fillRect(foodX * GRID_SIZE, foodY * GRID_SIZE, GRID_SIZE - 1, GRID_SIZE - 1);
      }
    }

    const titleSize = Math.min(canvas.width / 10, 28);
    ctx.font = `${titleSize}px "Press Start 2P", monospace`;
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'center';
    ctx.fillText('SNAKE', canvas.width / 2, canvas.height / 3 + GRID_SIZE);

    const subSize = Math.min(canvas.width / 28, 8);
    ctx.font = `${subSize}px "Press Start 2P", monospace`;
    if (isTouchDevice()) {
      ctx.fillText('WISCHEN ODER', canvas.width / 2, canvas.height - canvas.height / 4 - GRID_SIZE * 4);
      ctx.fillText('TASTEN STARTEN', canvas.width / 2, canvas.height - canvas.height / 4 - GRID_SIZE * 2);
    } else {
      ctx.fillText('CURSOR-TASTEN', canvas.width / 2, canvas.height - canvas.height / 4 - GRID_SIZE * 4);
      ctx.fillText('ZUM STARTEN', canvas.width / 2, canvas.height - canvas.height / 4 - GRID_SIZE * 2);
    }
  }, [canvasRef, getCtx]);

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = COLORS.snake;
    snakeRef.current.forEach((segment) => {
      ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE - 1, GRID_SIZE - 1);
    });

    ctx.fillStyle = COLORS.food;
    const food = foodRef.current;
    ctx.fillRect(food.x * GRID_SIZE, food.y * GRID_SIZE, GRID_SIZE - 1, GRID_SIZE - 1);
  }, [canvasRef, getCtx]);

  const drawGameOver = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;

    ctx.fillStyle = COLORS.overlayBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = '16px "Press Start 2P", monospace';
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 24);
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillText(`SCORE: ${scoreRef.current}`, canvas.width / 2, canvas.height / 2 + 8);
    const restartHint = isTouchDevice() ? 'TIPPEN' : 'PFEILTASTE';
    ctx.fillText(`NEUSTART: ${restartHint}`, canvas.width / 2, canvas.height / 2 + 36);
  }, [canvasRef, getCtx]);

  const drawPauseOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;

    ctx.fillStyle = COLORS.pauseBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '16px "Press Start 2P", monospace';
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'center';
    ctx.fillText('PAUSIERT', canvas.width / 2, canvas.height / 2);
  }, [canvasRef, getCtx]);

  const enableAudio = useCallback(() => {
    if (audioEnabledRef.current) return;
    unlockAudio();
    audioEnabledRef.current = true;
  }, []);

  const playEatSound = useCallback(() => {
    if (!audioEnabledRef.current) return;
    snakeSound.eat();
  }, []);

  const playEndSound = useCallback(() => {
    if (!audioEnabledRef.current) return;
    snakeSound.gameOver();
  }, []);

  const placeFood = useCallback(() => {
    const { x: tileCountX, y: tileCountY } = tileCountRef.current;
    if (tileCountX < 1 || tileCountY < 1) return;

    for (let attempt = 0; attempt < 500; attempt++) {
      const x = Math.floor(Math.random() * tileCountX);
      const y = Math.floor(Math.random() * tileCountY);
      if (!snakeRef.current.some((s) => s.x === x && s.y === y)) {
        foodRef.current = { x, y };
        return;
      }
    }
    foodRef.current = { x: 0, y: 0 };
  }, []);

  const stopLoop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  const triggerGameOver = useCallback(() => {
    phaseRef.current = 'gameOver';
    stopLoop();
    playEndSound();
    drawGameOver();
    syncScore();
  }, [drawGameOver, playEndSound, stopLoop, syncScore]);

  const startGameLoop = useCallback(() => {
    if (intervalRef.current || phaseRef.current === 'gameOver') return;
    intervalRef.current = setInterval(() => {
      if (phaseRef.current === 'paused' || phaseRef.current === 'gameOver') return;
      if (velocityRef.current.x === 0 && velocityRef.current.y === 0) return;

      const { x: tileCountX, y: tileCountY } = tileCountRef.current;
      const head = {
        x: snakeRef.current[0].x + velocityRef.current.x,
        y: snakeRef.current[0].y + velocityRef.current.y,
      };

      if (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY) {
        triggerGameOver();
        return;
      }

      for (let i = 1; i < snakeRef.current.length; i++) {
        if (head.x === snakeRef.current[i].x && head.y === snakeRef.current[i].y) {
          triggerGameOver();
          return;
        }
      }

      snakeRef.current.unshift(head);

      if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
        playEatSound();
        scoreRef.current++;
        if (scoreRef.current > highscoreRef.current) {
          highscoreRef.current = scoreRef.current;
          localStorage.setItem(STORAGE_KEY, String(highscoreRef.current));
        }
        placeFood();
        syncScore();
      } else {
        snakeRef.current.pop();
      }

      drawGame();
    }, gameSpeedRef.current);
  }, [drawGame, placeFood, playEatSound, syncScore, triggerGameOver]);

  const initGame = useCallback(() => {
    if (!readyRef.current) return;
    const { x: tileCountX, y: tileCountY } = tileCountRef.current;
    snakeRef.current = [{ x: Math.floor(tileCountX / 2), y: Math.floor(tileCountY / 2) }];
    velocityRef.current = { x: 0, y: 0 };
    scoreRef.current = 0;
    phaseRef.current = 'start';
    stopLoop();
    placeFood();
    syncScore();
    drawStartScreen();
  }, [drawStartScreen, placeFood, stopLoop, syncScore]);

  const beginPlaying = useCallback(() => {
    if (phaseRef.current === 'gameOver') return;
    phaseRef.current = 'playing';
    syncScore();
    drawGame();
    startGameLoop();
  }, [drawGame, startGameLoop, syncScore]);

  const attemptTurn = useCallback((dx: number, dy: number, axis: 'x' | 'y') => {
    enableAudio();
    const v = velocityRef.current;
    if ((axis === 'x' && v.x === 0) || (axis === 'y' && v.y === 0)) {
      velocityRef.current = { x: dx, y: dy };
      if (!intervalRef.current) beginPlaying();
    }
  }, [beginPlaying, enableAudio]);

  const togglePause = useCallback(() => {
    if (phaseRef.current === 'gameOver') return;
    const v = velocityRef.current;
    if (phaseRef.current === 'paused') {
      phaseRef.current = 'playing';
      setPaused(false);
      startGameLoop();
      drawGame();
    } else if (v.x !== 0 || v.y !== 0) {
      phaseRef.current = 'paused';
      stopLoop();
      setPaused(true);
      drawGame();
      drawPauseOverlay();
    }
  }, [drawGame, drawPauseOverlay, startGameLoop, stopLoop]);

  const restart = useCallback(() => {
    stopLoop();
    initGame();
  }, [initGame, stopLoop]);

  const handleCanvasClick = useCallback(() => {
    enableAudio();
    if (phaseRef.current === 'gameOver') initGame();
  }, [enableAudio, initGame]);

  const enterFullscreen = useCallback(() => {
    consoleRef.current?.requestFullscreen().catch(() => {});
  }, [consoleRef]);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen();
  }, []);

  const handleResize = useCallback(() => {
    const wasPaused = phaseRef.current === 'paused';
    const wasGameOver = phaseRef.current === 'gameOver';
    stopLoop();
    if (!resizeCanvas()) return;

    if (wasGameOver) drawGameOver();
    else if (phaseRef.current === 'start') drawStartScreen();
    else if (wasPaused) { drawGame(); drawPauseOverlay(); }
    else if (velocityRef.current.x !== 0 || velocityRef.current.y !== 0) {
      phaseRef.current = 'playing';
      drawGame();
      startGameLoop();
    }
  }, [drawGame, drawGameOver, drawPauseOverlay, drawStartScreen, resizeCanvas, startGameLoop, stopLoop]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    enableAudio();
    if (phaseRef.current === 'gameOver') return;

    let turned = false;
    switch (e.key) {
      case 'ArrowUp':
        if (velocityRef.current.y === 0) { velocityRef.current = { x: 0, y: -1 }; turned = true; }
        break;
      case 'ArrowDown':
        if (velocityRef.current.y === 0) { velocityRef.current = { x: 0, y: 1 }; turned = true; }
        break;
      case 'ArrowLeft':
        if (velocityRef.current.x === 0) { velocityRef.current = { x: -1, y: 0 }; turned = true; }
        break;
      case 'ArrowRight':
        if (velocityRef.current.x === 0) { velocityRef.current = { x: 1, y: 0 }; turned = true; }
        break;
      case ' ':
      case 'p':
      case 'P':
        togglePause();
        return;
    }
    if (turned && !intervalRef.current) beginPlaying();
  }, [beginPlaying, enableAudio, togglePause]);

  const handleResizeRef = useRef(handleResize);
  const handleKeyDownRef = useRef(handleKeyDown);
  const initGameRef = useRef(initGame);

  handleResizeRef.current = handleResize;
  handleKeyDownRef.current = handleKeyDown;
  initGameRef.current = initGame;

  useEffect(() => {
    highscoreRef.current = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    setHighscore(highscoreRef.current);

    const setup = () => {
      if (!resizeCanvas()) {
        requestAnimationFrame(setup);
        return;
      }
      readyRef.current = true;
      initGameRef.current();
    };

    requestAnimationFrame(setup);

    const onResize = () => handleResizeRef.current();
    const onKeyDown = (e: KeyboardEvent) => handleKeyDownRef.current(e);
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      handleResizeRef.current();
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('fullscreenchange', onFsChange);

    return () => {
      readyRef.current = false;
      stopLoop();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('fullscreenchange', onFsChange);
    };
  }, [resizeCanvas, stopLoop]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (phaseRef.current === 'gameOver') return;
    touchStartRef.current = {
      x: e.changedTouches[0].screenX,
      y: e.changedTouches[0].screenY,
    };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    enableAudio();
    if (phaseRef.current === 'gameOver') {
      initGame();
      return;
    }
    const deltaX = e.changedTouches[0].screenX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].screenY - touchStartRef.current.y;
    const v = velocityRef.current;
    let turned = false;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > MIN_SWIPE_DISTANCE) {
        if (deltaX > 0 && v.x === 0) { velocityRef.current = { x: 1, y: 0 }; turned = true; }
        else if (deltaX < 0 && v.x === 0) { velocityRef.current = { x: -1, y: 0 }; turned = true; }
      }
    } else if (Math.abs(deltaY) > MIN_SWIPE_DISTANCE) {
      if (deltaY > 0 && v.y === 0) { velocityRef.current = { x: 0, y: 1 }; turned = true; }
      else if (deltaY < 0 && v.y === 0) { velocityRef.current = { x: 0, y: -1 }; turned = true; }
    }

    if (turned && !intervalRef.current) beginPlaying();
  }, [beginPlaying, enableAudio, initGame]);

  return {
    score,
    highscore,
    paused,
    isFullscreen,
    attemptTurn,
    togglePause,
    restart,
    handleCanvasClick,
    handleTouchStart,
    handleTouchEnd,
    enterFullscreen,
    exitFullscreen,
  };
}
