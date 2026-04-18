import { useCallback, useEffect, useState } from 'react';
import { getBattleMusic, playCorrectSfx, playWrongSfx } from './rpgMusic';

const MUTE_KEY = 'highschool-juken-bgm-muted';

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeMuted(m: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, m ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export function useGameAudio() {
  const [bgmMuted, setBgmMuted] = useState(readMuted);

  useEffect(() => {
    setBgmMuted(readMuted());
  }, []);

  /** ユーザー操作直後に呼ぶ（はじめる・カテゴリ選択など） */
  const ensureBgm = useCallback(async () => {
    const m = getBattleMusic();
    if (!m.isRunning()) {
      await m.start();
      m.setMuted(readMuted());
    }
  }, []);

  const toggleBgm = useCallback(async () => {
    const m = getBattleMusic();
    const nextMuted = !bgmMuted;
    setBgmMuted(nextMuted);
    writeMuted(nextMuted);

    if (nextMuted) {
      if (m.isRunning()) m.setMuted(true);
    } else {
      if (!m.isRunning()) await m.start();
      m.setMuted(false);
    }
  }, [bgmMuted]);

  const playAnswerFeedback = useCallback((correct: boolean) => {
    if (readMuted()) return;
    if (correct) playCorrectSfx();
    else playWrongSfx();
  }, []);

  return { bgmMuted, ensureBgm, toggleBgm, playAnswerFeedback };
}
