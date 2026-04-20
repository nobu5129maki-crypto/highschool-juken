import type { HensachiLevel, Question, QuestionCategoryId } from '../types';
import { vocabMazeByHensachi } from './vocabMazeQuestions';
import { kanjiByHensachi } from './kanjiQuestions';
import { grammarByHensachi } from './grammarQuestions';
import { readingByHensachi } from './readingQuestions';
import { classicsByHensachi } from './classicsQuestions';
import { EXTRA_QUESTIONS } from './extraQuestionBank';
import { bulkExamByHensachi } from './bulkExamQuestions';

function mergeLevelPools(
  base: Record<HensachiLevel, Question[]>,
  extra: Record<HensachiLevel, Question[]>,
): Record<HensachiLevel, Question[]> {
  return {
    40: [...base[40], ...extra[40]],
    50: [...base[50], ...extra[50]],
    60: [...base[60], ...extra[60]],
    70: [...base[70], ...extra[70]],
  };
}

export const QUESTION_BANK: Record<
  QuestionCategoryId,
  Record<HensachiLevel, Question[]>
> = {
  vocab_maze: mergeLevelPools(
    mergeLevelPools(vocabMazeByHensachi, EXTRA_QUESTIONS.vocab_maze),
    bulkExamByHensachi.vocab_maze,
  ),
  kanji: mergeLevelPools(mergeLevelPools(kanjiByHensachi, EXTRA_QUESTIONS.kanji), bulkExamByHensachi.kanji),
  grammar: mergeLevelPools(
    mergeLevelPools(grammarByHensachi, EXTRA_QUESTIONS.grammar),
    bulkExamByHensachi.grammar,
  ),
  reading: mergeLevelPools(
    mergeLevelPools(readingByHensachi, EXTRA_QUESTIONS.reading),
    bulkExamByHensachi.reading,
  ),
  classics: mergeLevelPools(
    mergeLevelPools(classicsByHensachi, EXTRA_QUESTIONS.classics),
    bulkExamByHensachi.classics,
  ),
};

/** 1 ステージで出題する問数（プールからランダム抽出。最大でもこの数まで） */
export const BATTLE_QUESTION_COUNT = 14;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickRandomBattleQuestions(
  category: QuestionCategoryId,
  level: HensachiLevel,
  count: number = BATTLE_QUESTION_COUNT,
): Question[] {
  const pool = QUESTION_BANK[category][level];
  const shuffled = shuffle([...pool]);
  const n = Math.min(count, shuffled.length);
  return shuffled.slice(0, n);
}

export const CATEGORY_LIST: {
  id: QuestionCategoryId;
  title: string;
  description: string;
  emoji: string;
}[] = [
  {
    id: 'vocab_maze',
    title: '語彙の迷宮',
    description: '語彙・読解・文法がミックス。いままで通りの総合モードです。',
    emoji: '🌀',
  },
  {
    id: 'kanji',
    title: '漢字・読み書き',
    description: '音訓・四字熟語・画数・表記など、漢字でよく出る型です。',
    emoji: '✏️',
  },
  {
    id: 'grammar',
    title: '文法・表現',
    description: '助詞・敬語・文の正误・接続。文のしくみを問う問題です。',
    emoji: '📐',
  },
  {
    id: 'reading',
    title: '読解・要旨',
    description: '説明文・会話・論説の要旨や、筆者の意図を読み取る問題です。',
    emoji: '📖',
  },
  {
    id: 'classics',
    title: '古文・漢文',
    description: '助動詞・語句・仮名遣い・漢文の基礎。入試で頻出の型です。',
    emoji: '📜',
  },
];

export function getQuestions(
  category: QuestionCategoryId,
  level: HensachiLevel,
): Question[] {
  return QUESTION_BANK[category][level];
}
