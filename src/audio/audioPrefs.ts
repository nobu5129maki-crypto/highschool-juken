const MUTE_KEY = 'highschool-juken-bgm-muted';
const VOLUME_KEY = 'highschool-juken-bgm-volume';

const DEFAULT_VOLUME = 0.72;

export function readBgmMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeBgmMuted(m: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, m ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export function readBgmVolume(): number {
  try {
    const s = localStorage.getItem(VOLUME_KEY);
    if (s == null) return DEFAULT_VOLUME;
    const n = Number.parseFloat(s);
    if (!Number.isFinite(n)) return DEFAULT_VOLUME;
    return Math.min(1, Math.max(0, n));
  } catch {
    return DEFAULT_VOLUME;
  }
}

export function writeBgmVolume(v: number): void {
  try {
    localStorage.setItem(VOLUME_KEY, String(Math.min(1, Math.max(0, v))));
  } catch {
    /* ignore */
  }
}

/** 効果音用：ミュート時は 0、それ以外は BGM 音量に追従 */
export function getSfxGainMultiplier(): number {
  if (readBgmMuted()) return 0;
  return readBgmVolume();
}
