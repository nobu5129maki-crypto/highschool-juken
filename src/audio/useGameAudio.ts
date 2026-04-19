import { useCallback, useEffect, useState } from 'react';
import { BGM_TRACK_LABELS, type BgmTrackId } from './bgmTracks';
import { getGameBgm } from './gameBgm';
import {
  readBgmMuted,
  readBgmVolume,
  writeBgmMuted,
  writeBgmVolume,
} from './audioPrefs';
import { playCorrectSfx, playWrongSfx } from './rpgMusic';

export type AudioPhase = 'title' | 'category' | 'stage' | 'battle' | 'result';

export function resolveBgmTrack(
  phase: AudioPhase,
  resultKind: 'win' | 'lose' | 'draw' | null,
): BgmTrackId {
  if (phase === 'title') return 'study';
  if (phase === 'category' || phase === 'stage') return 'field';
  if (phase === 'battle') return 'battle';
  if (phase === 'result') return resultKind === 'win' ? 'triumph' : 'study';
  return 'study';
}

export function useGameAudio(phase: AudioPhase, resultKind: 'win' | 'lose' | 'draw' | null) {
  const [bgmMuted, setBgmMuted] = useState(readBgmMuted);
  const [bgmVolume, setBgmVolumeState] = useState(readBgmVolume);
  const [playingTrackId, setPlayingTrackId] = useState<BgmTrackId | null>(null);

  useEffect(() => {
    setBgmMuted(readBgmMuted());
    setBgmVolumeState(readBgmVolume());
  }, []);

  useEffect(() => {
    const g = getGameBgm();
    g.setVolume(bgmVolume);
    g.setMuted(bgmMuted);
  }, [bgmVolume, bgmMuted]);

  const syncTrack = useCallback(async () => {
    const g = getGameBgm();
    if (g.getTrackId() === null) return;
    const next = resolveBgmTrack(phase, resultKind);
    await g.switchTrack(next);
    setPlayingTrackId(next);
  }, [phase, resultKind]);

  useEffect(() => {
    void syncTrack();
  }, [syncTrack]);

  const setBgmVolume = useCallback((v: number) => {
    const clamped = Math.min(1, Math.max(0, v));
    setBgmVolumeState(clamped);
    writeBgmVolume(clamped);
    getGameBgm().setVolume(clamped);
  }, []);

  /** ユーザー操作直後。override でクリック直後のフェーズズレを補正 */
  const ensureBgm = useCallback(
    async (overrideTrack?: BgmTrackId) => {
      const track = overrideTrack ?? resolveBgmTrack(phase, resultKind);
      const g = getGameBgm();
      await g.start(track);
      g.setVolume(bgmVolume);
      g.setMuted(bgmMuted);
      setPlayingTrackId(track);
    },
    [phase, resultKind, bgmVolume, bgmMuted],
  );

  const toggleBgm = useCallback(async () => {
    const g = getGameBgm();
    const nextMuted = !bgmMuted;
    setBgmMuted(nextMuted);
    writeBgmMuted(nextMuted);
    g.setMuted(nextMuted);

    if (!nextMuted) {
      if (g.getTrackId() === null) {
        const track = resolveBgmTrack(phase, resultKind);
        await g.start(track);
        g.setVolume(bgmVolume);
        setPlayingTrackId(track);
      }
    }
  }, [bgmMuted, phase, resultKind, bgmVolume]);

  const playAnswerFeedback = useCallback((correct: boolean) => {
    if (correct) playCorrectSfx();
    else playWrongSfx();
  }, []);

  const playingLabel =
    playingTrackId && !bgmMuted ? BGM_TRACK_LABELS[playingTrackId] : null;

  return {
    bgmMuted,
    bgmVolume,
    setBgmVolume,
    playingLabel,
    ensureBgm,
    toggleBgm,
    playAnswerFeedback,
  };
}
