import { useCallback, useEffect, useReducer, useRef } from 'react';
import { battleshipReducer, createInitialState, SHIP_LABELS } from './battleshipReducer';
import { SHIP_LENGTHS } from './constants';
import { isAlreadyShot } from './gameLogic';
import { bsSound, setSoundEnabled, unlockAudio } from './sound';
import type { BattleshipAction, Coordinate } from './types';

const AI_PAUSE_MS = 550;
const AI_SHOT_ANIM_MS = 280;
const PLAYER_SHOT_ANIM_MS = 280;

export function useBattleshipGame() {
  const [state, dispatch] = useReducer(battleshipReducer, undefined, createInitialState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const lockRef = useRef(false);

  useEffect(() => {
    setSoundEnabled(state.soundEnabled);
  }, [state.soundEnabled]);

  const play = useCallback((fn: () => void) => {
    if (stateRef.current.soundEnabled) fn();
  }, []);

  const safeDispatch = useCallback((action: BattleshipAction) => {
    if (
      lockRef.current &&
      (action.type === 'FIRE_SHOT' || action.type === 'CONFIRM_PLACEMENT')
    ) {
      return;
    }
    dispatch(action);
  }, []);

  useEffect(() => {
    if (state.phase === 'playerSelectingTargets' || state.phase === 'playerResolvingShots') {
      dispatch({ type: 'SET_ACTIVE_BOARD', board: 'enemy' });
    } else if (
      state.phase === 'aiThinking' ||
      state.phase === 'aiResolvingShots'
    ) {
      dispatch({ type: 'SET_ACTIVE_BOARD', board: 'own' });
    }
  }, [state.phase]);

  useEffect(() => {
    if (state.phase !== 'playerResolvingShots') return;
    let cancelled = false;
    lockRef.current = true;
    play(bsSound.fire);
    const t = setTimeout(() => {
      if (cancelled) return;
      dispatch({ type: 'RESOLVE_PLAYER_SHOT' });
      dispatch({ type: 'CLEAR_ANIMATIONS' });
      const s = stateRef.current;
      if (s.phase === 'victory') play(bsSound.victory);
      else if (s.message.text.includes('VERSENKT')) play(bsSound.sunk);
      else if (s.message.text.includes('TREFFER')) play(bsSound.hit);
      else play(bsSound.water);
      lockRef.current = false;
    }, PLAYER_SHOT_ANIM_MS);
    return () => {
      cancelled = true;
      clearTimeout(t);
      lockRef.current = false;
    };
  }, [state.phase, state.pendingShot, play]);

  useEffect(() => {
    if (state.phase !== 'aiThinking') return;
    let cancelled = false;
    lockRef.current = true;
    const t = setTimeout(() => {
      if (cancelled) return;
      dispatch({ type: 'PREPARE_AI_SHOT' });
    }, AI_PAUSE_MS);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [state.phase, state.aiShotsRemaining]);

  useEffect(() => {
    if (state.phase !== 'aiResolvingShots') return;
    let cancelled = false;
    lockRef.current = true;
    play(bsSound.fire);
    const t = setTimeout(() => {
      if (cancelled) return;
      dispatch({ type: 'RESOLVE_AI_SHOT' });
      dispatch({ type: 'CLEAR_ANIMATIONS' });
      const s = stateRef.current;
      if (s.phase === 'defeat') play(bsSound.defeat);
      else if (s.message.text.includes('VERSENKT')) play(bsSound.sunk);
      else if (s.message.text.includes('TREFFER')) play(bsSound.hit);
      else play(bsSound.water);
      if (s.phase !== 'aiThinking' && s.phase !== 'aiResolvingShots') {
        lockRef.current = false;
      }
    }, AI_SHOT_ANIM_MS);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [state.phase, state.pendingShot, play]);

  useEffect(() => {
    if (state.phase === 'playerSelectingTargets' || state.phase === 'victory' || state.phase === 'defeat') {
      lockRef.current = false;
    }
  }, [state.phase]);

  const fireAt = useCallback(
    (coord: Coordinate) => {
      const s = stateRef.current;
      if (s.phase !== 'playerSelectingTargets' || lockRef.current) return;
      if (isAlreadyShot(s.radar, coord)) return;
      play(bsSound.tick);
      dispatch({ type: 'FIRE_SHOT', coord });
    },
    [play],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      unlockAudio();
      const s = stateRef.current;
      if (s.phase === 'victory' || s.phase === 'defeat') {
        if (e.key === 'Enter' || e.key === ' ') dispatch({ type: 'RESET' });
        return;
      }

      const move = { dr: 0, dc: 0 };
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') move.dr = -1;
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') move.dr = 1;
      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') move.dc = -1;
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') move.dc = 1;

      if (move.dr || move.dc) {
        e.preventDefault();
        play(bsSound.tick);
        if (s.phase === 'placement') dispatch({ type: 'MOVE_PREVIEW', delta: move });
        else if (s.phase === 'playerSelectingTargets') dispatch({ type: 'MOVE_CURSOR', delta: move });
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        if (s.phase === 'placement') {
          e.preventDefault();
          play(bsSound.rotate);
          dispatch({ type: 'ROTATE_PREVIEW' });
        }
        return;
      }

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (s.phase === 'placement') {
          play(bsSound.place);
          dispatch({ type: 'CONFIRM_PLACEMENT' });
        } else if (s.phase === 'playerSelectingTargets') {
          fireAt(s.cursor);
        }
      }

      if (e.key === 'Escape' && s.phase === 'placement') {
        dispatch({ type: 'RESET' });
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fireAt, play]);

  const onCellPointer = useCallback(
    (coord: Coordinate, board: 'own' | 'enemy') => {
      unlockAudio();
      const s = stateRef.current;
      if (lockRef.current) return;

      if (s.phase === 'placement' && board === 'own') {
        dispatch({ type: 'SET_PREVIEW_ORIGIN', origin: coord });
        return;
      }

      if (s.phase === 'playerSelectingTargets' && board === 'enemy') {
        fireAt(coord);
      }
    },
    [fireAt],
  );

  const currentShipLabel =
    state.phase === 'placement' && state.preview
      ? `${SHIP_LABELS[state.preview.type]} (${SHIP_LENGTHS[state.preview.type]})`
      : '';

  return {
    state,
    dispatch: safeDispatch,
    onCellPointer,
    currentShipLabel,
    isPlacement: state.phase === 'placement',
    isBattle: !['placement', 'victory', 'defeat', 'aiPlacement'].includes(state.phase),
    gameOver: state.phase === 'victory' || state.phase === 'defeat',
  };
}
