import type { HensachiLevel, QuestionCategoryId } from './types';
import { CATEGORY_LIST } from './data/questionBank';

const STORAGE_KEY = 'highschool-juken-progress-v2';

export type AchievementId =
  | 'first_clear'
  | 'wins_10'
  | 'combo_5'
  | 'streak_3days'
  | 'five_stages'
  | 'all_levels_one_cat';

export type AchievementDef = {
  id: AchievementId;
  title: string;
  description: string;
};

export const ACHIEVEMENT_LIST: AchievementDef[] = [
  { id: 'first_clear', title: '初クリア', description: 'ステージを1回勝利で終えた' },
  { id: 'wins_10', title: '十戦十学', description: '累計勝利が10に達した' },
  { id: 'combo_5', title: '連撃のコツ', description: '1ステージ内で連続正解を5以上出した' },
  { id: 'streak_3days', title: '三日煮詰め', description: '別々の日に3日連続でプレイした' },
  { id: 'five_stages', title: '地図の開拓者', description: '異なるステージを5つクリア済みにした' },
  { id: 'all_levels_one_cat', title: '柱一本', description: 'どれか1科目で偏差値40〜70をすべてクリアした' },
];

type ProgressState = {
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  /** 1 ステージ単位で記録した連続正解の最高 */
  bestComboEver: number;
  /** 'categoryId::level' */
  clearedStages: string[];
  unlockedAchievements: AchievementId[];
  /** YYYY-MM-DD（ローカル日付）ごとにプレイしたか */
  playDates: string[];
};

const defaultState = (): ProgressState => ({
  totalWins: 0,
  totalLosses: 0,
  totalDraws: 0,
  bestComboEver: 0,
  clearedStages: [],
  unlockedAchievements: [],
  playDates: [],
});

function loadRaw(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const p = JSON.parse(raw) as Partial<ProgressState>;
    return {
      ...defaultState(),
      ...p,
      clearedStages: Array.isArray(p.clearedStages) ? p.clearedStages : [],
      unlockedAchievements: Array.isArray(p.unlockedAchievements)
        ? (p.unlockedAchievements.filter((a) =>
            ACHIEVEMENT_LIST.some((d) => d.id === a),
          ) as AchievementId[])
        : [],
      playDates: Array.isArray(p.playDates) ? p.playDates : [],
    };
  } catch {
    return defaultState();
  }
}

function saveRaw(s: ProgressState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function stageKey(categoryId: QuestionCategoryId, level: HensachiLevel): string {
  return `${categoryId}::${level}`;
}

export function loadProgress(): ProgressState {
  return loadRaw();
}

export function getClearedCount(state: ProgressState = loadRaw()): number {
  return new Set(state.clearedStages).size;
}

export function isStageCleared(
  categoryId: QuestionCategoryId,
  level: HensachiLevel,
  state: ProgressState = loadRaw(),
): boolean {
  return state.clearedStages.includes(stageKey(categoryId, level));
}

/** ランク名（見た目用） */
export function getStudyRankLabel(state: ProgressState = loadRaw()): string {
  const score =
    state.totalWins * 3 +
    new Set(state.clearedStages).size * 2 +
    state.unlockedAchievements.length * 4;
  if (score >= 120) return '伝説の一試験（ランクS）';
  if (score >= 75) return '秀才モード（ランクA）';
  if (score >= 40) return '国語エース（ランクB）';
  if (score >= 15) return '期待の新入生（ランクC）';
  return '凡人受験生（ランクD）';
}

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 今日の日付でプレイ履歴を更新し、連続日数を返す */
function touchPlayStreak(state: ProgressState): { next: ProgressState; streakDays: number } {
  const t = todayStr();
  const dates = new Set(state.playDates);
  if (!dates.has(t)) {
    dates.add(t);
  }
  // 連続日数：今日から過去にさかのぼって連続している日数
  let streak = 0;
  let check = new Date();
  for (let i = 0; i < 14; i++) {
    const y = check.getFullYear();
    const m = String(check.getMonth() + 1).padStart(2, '0');
    const day = String(check.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${day}`;
    if (dates.has(key)) {
      streak++;
      check.setDate(check.getDate() - 1);
    } else {
      break;
    }
  }
  return {
    next: { ...state, playDates: [...dates] },
    streakDays: streak,
  };
}

function hasFullCategoryClear(state: ProgressState, categoryId: QuestionCategoryId): boolean {
  const levels: HensachiLevel[] = [40, 50, 60, 70];
  return levels.every((lv) => state.clearedStages.includes(stageKey(categoryId, lv)));
}

export type BattleOutcome = 'win' | 'lose' | 'draw';

export function recordBattleEnd(
  outcome: BattleOutcome,
  categoryId: QuestionCategoryId,
  level: HensachiLevel,
  maxComboThisBattle: number,
): { newAchievements: AchievementDef[] } {
  let s = loadRaw();
  const newOnes: AchievementDef[] = [];

  if (outcome === 'win') {
    s.totalWins += 1;
    const key = stageKey(categoryId, level);
    if (!s.clearedStages.includes(key)) {
      s.clearedStages = [...s.clearedStages, key];
    }
  } else if (outcome === 'lose') {
    s.totalLosses += 1;
  } else {
    s.totalDraws += 1;
  }

  s.bestComboEver = Math.max(s.bestComboEver, maxComboThisBattle);

  const streaked = touchPlayStreak(s);
  s = streaked.next;

  const tryUnlock = (id: AchievementId) => {
    if (s.unlockedAchievements.includes(id)) return;
    if (checkAchievement(id, s, categoryId, maxComboThisBattle, streaked.streakDays)) {
      s.unlockedAchievements = [...s.unlockedAchievements, id];
      const def = ACHIEVEMENT_LIST.find((a) => a.id === id);
      if (def) newOnes.push(def);
    }
  };

  tryUnlock('first_clear');
  tryUnlock('wins_10');
  tryUnlock('combo_5');
  tryUnlock('streak_3days');
  tryUnlock('five_stages');
  tryUnlock('all_levels_one_cat');

  saveRaw(s);
  return { newAchievements: newOnes };
}

function checkAchievement(
  id: AchievementId,
  s: ProgressState,
  lastCategory: QuestionCategoryId,
  maxComboThisBattle: number,
  playStreakDays: number,
): boolean {
  switch (id) {
    case 'first_clear':
      return s.totalWins >= 1;
    case 'wins_10':
      return s.totalWins >= 10;
    case 'combo_5':
      return maxComboThisBattle >= 5 || s.bestComboEver >= 5;
    case 'streak_3days':
      return playStreakDays >= 3;
    case 'five_stages':
      return new Set(s.clearedStages).size >= 5;
    case 'all_levels_one_cat':
      return (
        hasFullCategoryClear(s, lastCategory) ||
        CATEGORY_IDS.some((cid) => hasFullCategoryClear(s, cid))
      );
    default:
      return false;
  }
}

const CATEGORY_IDS: QuestionCategoryId[] = [
  'vocab_maze',
  'kanji',
  'grammar',
  'reading',
  'classics',
];

/** 日付で決まるおすすめ（毎日同じ端末では同じ提案） */
export function getDailyPick(seedDate = new Date()): {
  categoryId: QuestionCategoryId;
  level: HensachiLevel;
  label: string;
} {
  const y = seedDate.getFullYear();
  const m = seedDate.getMonth() + 1;
  const d = seedDate.getDate();
  const hash = (y * 10000 + m * 100 + d) % 997;
  const cat = CATEGORY_IDS[hash % CATEGORY_IDS.length];
  const lv: HensachiLevel[] = [40, 50, 60, 70];
  const level = lv[Math.floor((hash / 7) % 4)];
  const title = CATEGORY_LIST.find((c) => c.id === cat)?.title ?? '';
  return {
    categoryId: cat,
    level,
    label: `${title} · 偏差値 ${level}`,
  };
}
