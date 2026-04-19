/** 偏差値レベル（ステージ難易度） */
export type HensachiLevel = 40 | 50 | 60 | 70;

/** 主人公の見た目（男子・女子） */
export type PlayerGender = 'male' | 'female';

/** 出題カテゴリ（受験でよく出る大問の型） */
export type QuestionCategoryId =
  | 'vocab_maze'
  | 'kanji'
  | 'grammar'
  | 'reading'
  | 'classics';

export type Question = {
  id: string;
  /** 読解・資料がある場合 */
  passage?: string;
  prompt: string;
  choices: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  /** どのような過去問形式か（教材・自治体名は「形式の参考」であり本文はオリジナル） */
  pastExamStyle: string;
  /** 正解・不正解のあとに表示する、やさしい解説（答えの理由・ポイント） */
  explanation: string;
};
