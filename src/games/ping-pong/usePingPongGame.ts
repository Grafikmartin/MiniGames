import { useCallback, useEffect, useRef, useState } from 'react';
import pingSound from '../../assets/ping.mp3';
import {
  BALL_SIZE,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  COLORS,
  DEFAULT_SETTINGS,
  DIFFICULTY_SPEEDS,
  PADDLE_HEIGHT,
  PADDLE_WIDTH,
  STORAGE_SETTINGS,
  STORAGE_STANDARD_HI,
  STORAGE_SURVIVAL_HI,
  type GameMode,
  type GameSettings,
} from './constants';
import type { Ball, EndInfo, Paddle, Screen } from './types';

function createPaddle(x: number): Paddle {
  const y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
  return { x, y, width: PADDLE_WIDTH, height: PADDLE_HEIGHT, dy: 0, prevY: y };
}

function createBall(speed: number, multiplier = 1): Ball {
  const s = speed * multiplier;
  return {
    x: CANVAS_WIDTH / 2 - BALL_SIZE / 2,
    y: CANVAS_HEIGHT / 2 - BALL_SIZE / 2,
    width: BALL_SIZE,
    height: BALL_SIZE,
    dx: (Math.random() < 0.5 ? 1 : -1) * s,
    dy: (Math.random() < 0.5 ? 1 : -1) * s,
  };
}

function collides(b: Ball, p: Paddle) {
  return b.x < p.x + p.width && b.x + b.width > p.x && b.y < p.y + p.height && b.y + b.height > p.y;
}

function addSpin(ball: Ball, paddle: Paddle) {
  const paddleCenter = paddle.y + paddle.height / 2;
  const ballCenter = ball.y + ball.height / 2;
  ball.dy += (ballCenter - paddleCenter) * 0.1;
}

function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function usePingPongGame(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const settingsRef = useRef<GameSettings>(loadSettings());
  const screenRef = useRef<Screen>('menu');
  const pausedRef = useRef(false);
  const runningRef = useRef(false);
  const rafRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const userPaddleRef = useRef<Paddle>(createPaddle(0));
  const aiPaddleRef = useRef<Paddle>(createPaddle(CANVAS_WIDTH - PADDLE_WIDTH));
  const ballRef = useRef<Ball>(createBall(5));
  const userScoreRef = useRef(0);
  const aiScoreRef = useRef(0);
  const livesRef = useRef(3);
  const speedMultiplierRef = useRef(1);
  const paddleSpeedRef = useRef(7);
  const ballSpeedRef = useRef(5);
  const gameStartRef = useRef(0);
  const lastSpeedIncRef = useRef(0);
  const flashRef = useRef({ x: null as number | null, y: null as number | null, timer: 0 });
  const pingRef = useRef<HTMLAudioElement | null>(null);

  const [screen, setScreen] = useState<Screen>('menu');
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const [paused, setPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userScore, setUserScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [survivalTime, setSurvivalTime] = useState('00:00');
  const [speedLabel, setSpeedLabel] = useState('1.0x');
  const [standardHi, setStandardHi] = useState(0);
  const [survivalHi, setSurvivalHi] = useState(0);
  const [endInfo, setEndInfo] = useState<EndInfo>({ title: '', message: '' });

  const syncUI = useCallback(() => {
    setUserScore(userScoreRef.current);
    setAiScore(aiScoreRef.current);
    setLives(livesRef.current);
    setPaused(pausedRef.current);
    setScreen(screenRef.current);
  }, []);

  const saveSettings = useCallback((next: GameSettings) => {
    settingsRef.current = next;
    setSettings(next);
    localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(next));
  }, []);

  const updateHighscores = useCallback(() => {
    setStandardHi(parseInt(localStorage.getItem(STORAGE_STANDARD_HI) || '0', 10));
    setSurvivalHi(parseInt(localStorage.getItem(STORAGE_SURVIVAL_HI) || '0', 10));
  }, []);

  const playPing = useCallback(() => {
    if (!settingsRef.current.soundOn || !pingRef.current) return;
    const s = pingRef.current;
    s.currentTime = 0;
    s.play().catch(() => {});
  }, []);

  const getCtx = useCallback(() => canvasRef.current?.getContext('2d') ?? null, [canvasRef]);

  const assignPaddles = useCallback(() => {
    const left = createPaddle(0);
    const right = createPaddle(CANVAS_WIDTH - PADDLE_WIDTH);
    if (settingsRef.current.userSide === 'left') {
      userPaddleRef.current = left;
      aiPaddleRef.current = right;
    } else {
      userPaddleRef.current = right;
      aiPaddleRef.current = left;
    }
  }, []);

  const resetBall = useCallback((keepSpeed = false) => {
    const mult = keepSpeed ? speedMultiplierRef.current : 1;
    ballRef.current = createBall(ballSpeedRef.current, settingsRef.current.gameMode === 'survival' && keepSpeed ? mult : 1);
  }, []);

  const endGame = useCallback((info: EndInfo) => {
    runningRef.current = false;
    screenRef.current = 'ended';
    pausedRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
    cancelAnimationFrame(rafRef.current);
    setEndInfo(info);
    syncUI();
    updateHighscores();
  }, [syncUI, updateHighscores]);

  const draw = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = COLORS.fg;
    ctx.fillRect(userPaddleRef.current.x, userPaddleRef.current.y, userPaddleRef.current.width, userPaddleRef.current.height);
    ctx.fillRect(aiPaddleRef.current.x, aiPaddleRef.current.y, aiPaddleRef.current.width, aiPaddleRef.current.height);

    const ball = ballRef.current;
    ctx.beginPath();
    ctx.arc(ball.x + ball.width / 2, ball.y + ball.height / 2, ball.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    const flash = flashRef.current;
    if (flash.timer > 0 && flash.x !== null && flash.y !== null) {
      const thickness = 40;
      const lineWidth = 12;
      const drawX = flash.x === 0 ? 0 : CANVAS_WIDTH - lineWidth;
      let drawY = flash.y - thickness / 2;
      drawY = Math.max(0, Math.min(CANVAS_HEIGHT - thickness, drawY));
      ctx.fillStyle = COLORS.flash;
      ctx.fillRect(drawX, drawY, lineWidth, thickness);
      flash.timer--;
      if (flash.timer <= 0) { flash.x = null; flash.y = null; }
    }
  }, [getCtx]);

  const update = useCallback((timestamp: number) => {
    const s = settingsRef.current;
    const userPaddle = userPaddleRef.current;
    const aiPaddle = aiPaddleRef.current;
    const ball = ballRef.current;

    if (s.gameMode === 'standard') {
      const elapsed = (timestamp - lastSpeedIncRef.current) / 1000;
      if (elapsed >= 60) {
        ball.dx *= 1.2;
        ball.dy *= 1.2;
        lastSpeedIncRef.current = timestamp;
      }
    }

    userPaddle.y += userPaddle.dy;
    userPaddle.y = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, userPaddle.y));

    let computerSpeed = paddleSpeedRef.current;
    let errorFactor = 0.7;
    if (s.gameMode === 'survival') {
      computerSpeed = paddleSpeedRef.current + 2;
      errorFactor = 0.9;
    } else if (s.difficulty === 'easy') {
      computerSpeed = paddleSpeedRef.current - 3;
      errorFactor = 0.3;
    } else if (s.difficulty === 'medium') {
      computerSpeed = paddleSpeedRef.current - 2;
      errorFactor = 0.5;
    }

    const aiTarget = ball.y + ball.height / 2 - aiPaddle.height / 2;
    let reactionDelay = 0;
    if (s.gameMode === 'standard') {
      if (s.difficulty === 'easy') reactionDelay = 10;
      else if (s.difficulty === 'medium') reactionDelay = 5;
      else reactionDelay = 2;
    }
    if (Math.abs(aiTarget - aiPaddle.y) > reactionDelay) {
      aiPaddle.y += (aiTarget - aiPaddle.y) * errorFactor;
    }
    const maxMove = computerSpeed;
    if (Math.abs(aiPaddle.y - aiPaddle.prevY) > maxMove) {
      aiPaddle.y = aiPaddle.prevY + Math.sign(aiPaddle.y - aiPaddle.prevY) * maxMove;
    }
    aiPaddle.prevY = aiPaddle.y;
    aiPaddle.y = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, aiPaddle.y));

    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.y < 0 || ball.y + ball.height > CANVAS_HEIGHT) {
      ball.dy *= -1;
      playPing();
    }

    if (collides(ball, userPaddle)) {
      ball.dx = s.userSide === 'left' ? Math.abs(ball.dx) : -Math.abs(ball.dx);
      addSpin(ball, userPaddle);
      playPing();
    }
    if (collides(ball, aiPaddle)) {
      ball.dx = s.userSide === 'left' ? -Math.abs(ball.dx) : Math.abs(ball.dx);
      addSpin(ball, aiPaddle);
      playPing();
    }

    const markFlash = (side: 'left' | 'right') => {
      flashRef.current = {
        x: side === 'left' ? 0 : CANVAS_WIDTH,
        y: ball.y + ball.height / 2,
        timer: 20,
      };
    };

    if (ball.x < 0) {
      if (s.gameMode === 'survival' && s.userSide === 'left') {
        livesRef.current--;
        markFlash('left');
        if (livesRef.current <= 0) {
          const survived = Math.floor((performance.now() - gameStartRef.current) / 1000);
          const prev = parseInt(localStorage.getItem(STORAGE_SURVIVAL_HI) || '0', 10);
          if (survived > prev) localStorage.setItem(STORAGE_SURVIVAL_HI, String(survived));
          endGame({ title: 'Spielende!', message: `Überlebt: ${formatTime(survived)}` });
          return;
        }
        resetBall(true);
        syncUI();
      } else if (s.userSide === 'left') {
        aiScoreRef.current++;
        markFlash('left');
        resetBall(false);
        syncUI();
      } else {
        userScoreRef.current++;
        markFlash('left');
        resetBall(false);
        syncUI();
      }
    }

    if (ball.x + ball.width > CANVAS_WIDTH) {
      if (s.gameMode === 'survival' && s.userSide === 'right') {
        livesRef.current--;
        markFlash('right');
        if (livesRef.current <= 0) {
          const survived = Math.floor((performance.now() - gameStartRef.current) / 1000);
          const prev = parseInt(localStorage.getItem(STORAGE_SURVIVAL_HI) || '0', 10);
          if (survived > prev) localStorage.setItem(STORAGE_SURVIVAL_HI, String(survived));
          endGame({ title: 'Spielende!', message: `Überlebt: ${formatTime(survived)}` });
          return;
        }
        resetBall(true);
        syncUI();
      } else if (s.userSide === 'right') {
        aiScoreRef.current++;
        markFlash('right');
        resetBall(false);
        syncUI();
      } else {
        userScoreRef.current++;
        markFlash('right');
        resetBall(false);
        syncUI();
      }
    }

    if (s.gameMode === 'standard' && s.maxPoints > 0) {
      if (userScoreRef.current >= s.maxPoints) {
        const prev = parseInt(localStorage.getItem(STORAGE_STANDARD_HI) || '0', 10);
        if (userScoreRef.current > prev) localStorage.setItem(STORAGE_STANDARD_HI, String(userScoreRef.current));
        endGame({ title: 'Gewonnen!', message: `Du hast ${userScoreRef.current}:${aiScoreRef.current} gewonnen.` });
      } else if (aiScoreRef.current >= s.maxPoints) {
        endGame({ title: 'Verloren!', message: `Computer ${aiScoreRef.current}:${userScoreRef.current} gewonnen.` });
      }
    }
  }, [endGame, playPing, resetBall, syncUI]);

  const loop = useCallback((timestamp: number) => {
    if (!runningRef.current) return;
    if (!pausedRef.current) {
      update(timestamp);
      draw();
    }
    rafRef.current = requestAnimationFrame(loop);
  }, [draw, update]);

  const startGame = useCallback(() => {
    const s = settingsRef.current;
    const speeds = DIFFICULTY_SPEEDS[s.difficulty];
    paddleSpeedRef.current = speeds.paddle;
    ballSpeedRef.current = speeds.ball;
    userScoreRef.current = 0;
    aiScoreRef.current = 0;
    livesRef.current = 3;
    speedMultiplierRef.current = 1;
    flashRef.current = { x: null, y: null, timer: 0 };
    pausedRef.current = false;
    screenRef.current = 'playing';
    runningRef.current = true;
    gameStartRef.current = performance.now();
    lastSpeedIncRef.current = gameStartRef.current;

    assignPaddles();
    ballRef.current = createBall(ballSpeedRef.current);
    syncUI();
    setSpeedLabel('1.0x');
    setSurvivalTime('00:00');

    if (timerRef.current) clearInterval(timerRef.current);
    if (s.gameMode === 'survival') {
      timerRef.current = setInterval(() => {
        if (!runningRef.current || pausedRef.current) return;
        const elapsed = Math.floor((performance.now() - gameStartRef.current) / 1000);
        setSurvivalTime(formatTime(elapsed));
        const now = performance.now();
        if (now - lastSpeedIncRef.current >= 10000) {
          speedMultiplierRef.current += 0.1;
          lastSpeedIncRef.current = now;
          setSpeedLabel(`${speedMultiplierRef.current.toFixed(1)}x`);
          const ball = ballRef.current;
          ball.dx = Math.sign(ball.dx) * ballSpeedRef.current * speedMultiplierRef.current;
          ball.dy = Math.sign(ball.dy) * ballSpeedRef.current * speedMultiplierRef.current;
        }
      }, 100);
    }

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);
  }, [assignPaddles, loop, syncUI]);

  const togglePause = useCallback(() => {
    if (screenRef.current !== 'playing') return;
    pausedRef.current = !pausedRef.current;
    syncUI();
  }, [syncUI]);

  const abortGame = useCallback(() => {
    if (!runningRef.current) return;
    if (!window.confirm('Spiel wirklich abbrechen?')) return;
    endGame({ title: 'Abgebrochen', message: 'Spiel abgebrochen.' });
  }, [endGame]);

  const backToMenu = useCallback(() => {
    runningRef.current = false;
    pausedRef.current = false;
    screenRef.current = 'menu';
    if (timerRef.current) clearInterval(timerRef.current);
    cancelAnimationFrame(rafRef.current);
    syncUI();
    updateHighscores();
  }, [syncUI, updateHighscores]);

  const setGameMode = useCallback((mode: GameMode) => {
    saveSettings({ ...settingsRef.current, gameMode: mode });
  }, [saveSettings]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!runningRef.current || pausedRef.current || e.touches.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleY = CANVAS_HEIGHT / rect.height;
    const touchY = (e.touches[0].clientY - rect.top) * scaleY;
    userPaddleRef.current.y = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, touchY - PADDLE_HEIGHT / 2));
  }, [canvasRef]);

  useEffect(() => {
    pingRef.current = new Audio(pingSound);
    updateHighscores();

    const onKeyDown = (e: KeyboardEvent) => {
      if (screenRef.current !== 'playing' || pausedRef.current) return;
      if (e.key === 'ArrowUp') userPaddleRef.current.dy = -paddleSpeedRef.current;
      if (e.key === 'ArrowDown') userPaddleRef.current.dy = paddleSpeedRef.current;
      if (e.key === ' ' || e.key === 'p' || e.key === 'P') { e.preventDefault(); togglePause(); }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') userPaddleRef.current.dy = 0;
    };
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    document.addEventListener('fullscreenchange', onFs);

    return () => {
      runningRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('fullscreenchange', onFs);
    };
  }, [togglePause, updateHighscores]);

  const enterFullscreen = useCallback(() => {
    document.documentElement.requestFullscreen().catch(() => {});
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen();
  }, []);

  const highscoreLabel = settings.gameMode === 'standard'
    ? String(standardHi)
    : formatTime(survivalHi);

  return {
    screen,
    settings,
    paused,
    isFullscreen,
    userScore,
    aiScore,
    lives,
    survivalTime,
    speedLabel,
    highscoreLabel,
    endInfo,
    saveSettings,
    setGameMode,
    startGame,
    togglePause,
    abortGame,
    backToMenu,
    handleTouchMove,
    enterFullscreen,
    exitFullscreen,
  };
}
