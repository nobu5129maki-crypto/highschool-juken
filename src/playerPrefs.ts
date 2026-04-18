import type { PlayerGender } from './types';

const GENDER_KEY = 'highschool-juken-player-gender';

export function loadPlayerGender(): PlayerGender {
  try {
    const v = localStorage.getItem(GENDER_KEY);
    if (v === 'female' || v === 'male') return v;
  } catch {
    /* ignore */
  }
  return 'male';
}

export function savePlayerGender(g: PlayerGender): void {
  try {
    localStorage.setItem(GENDER_KEY, g);
  } catch {
    /* ignore */
  }
}
