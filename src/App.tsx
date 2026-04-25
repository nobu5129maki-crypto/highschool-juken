import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HensachiLevel, Question, QuestionCategoryId, PlayerGender } from './types';
import { CATEGORY_LIST, pickRandomBattleQuestions } from './data/questionBank';
import { useAnswerFeedback } from './audio/useAnswerFeedback';
import { EnemySpriteByLevel, PlayerHero } from './components/CharacterSprites';
import { loadPlayerGender, savePlayerGender } from './playerPrefs';
import {
  ACHIEVEMENT_LIST,
  getClearedCount,
  getDailyPick,
  getStudyRankLabel,
  isStageCleared,
  loadProgress,
  recordBattleEnd,
  type AchievementDef,
} from './gameProgress';
import { wrongExplainFallback } from './wrongExplainFallback';
import './App.css';

type Phase = 'title' | 'category' | 'stage' | 'battle' | 'result';
type ResultKind = 'win' | 'lose' | 'draw';

function ExplainParagraphs({ text, className }: { text: string; className: string }) {
  const parts = text.trim().split(/\n\n+/);
  if (parts.length === 0) {
    return null;
  }
  if (parts.length === 1) {
    return <p className={className}>{parts[0]}</p>;
  }
  return (
    <div className="lesson-explain-paragraphs">
      {parts.map((para, i) => (
        <p key={i} className={className}>
          {para}
        </p>
      ))}
    </div>
  );
}

const LEVELS: { value: HensachiLevel; label: string; enemy: string; blurb: string }[] = [
  {
    value: 40,
    label: '偏差値 40',
    enemy: 'スライム（基礎）',
    blurb: '語彙・短文読解。まずは土台を固めるゾーン。',
  },
  {
    value: 50,
    label: '偏差値 50',
    enemy: 'ゴブリン（標準）',
    blurb: '公立高校の「よくある型」。説明文・会話文まで。',
  },
  {
    value: 60,
    label: '偏差値 60',
    enemy: 'ナイト（応用）',
    blurb: '論説・指示語。難関公立・中堅私立イメージ。',
  },
  {
    value: 70,
    label: '偏差値 70',
    enemy: 'ドラゴン（最難関）',
    blurb: '抽象度の高い論評・論理。上位校レベル。',
  },
];

const MAX_HP = 100;
const DAMAGE_TO_ENEMY = 28;
const DAMAGE_TO_PLAYER = 24;
/** 1回でも不正解のあと、次に正解したときのHP回復量 */
const HEAL_COMEBACK = 12;
/** 連続正解に応じた追加ダメージ（小さめの上限でバランス維持） */
function bonusDamageForStreak(streakAfterThisHit: number): number {
  if (streakAfterThisHit < 2) return 0;
  return Math.min(8, Math.max(0, streakAfterThisHit - 1) * 2);
}

function App() {
  const [phase, setPhase] = useState<Phase>('title');
  const [categoryId, setCategoryId] = useState<QuestionCategoryId | null>(null);
  const [level, setLevel] = useState<HensachiLevel | null>(null);
  const [queue, setQueue] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [playerHp, setPlayerHp] = useState(MAX_HP);
  const [enemyHp, setEnemyHp] = useState(MAX_HP);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  /** 正解・不正解のあと、解説を読むまで次に進まない */
  const [awaitExplainAck, setAwaitExplainAck] = useState(false);
  const [locked, setLocked] = useState(false);
  const [resultKind, setResultKind] = useState<ResultKind | null>(null);
  const [playerGender, setPlayerGender] = useState<PlayerGender>(loadPlayerGender);
  const comebackHealEligibleRef = useRef(false);
  const [recoveryHint, setRecoveryHint] = useState<string | null>(null);
  /** 現在のステージでの連続正解数（直前の問題まで） */
  const [streakCorrect, setStreakCorrect] = useState(0);
  /** 直前に選んだ肢（不正解時の学び用） */
  const [lastChoiceIndex, setLastChoiceIndex] = useState<number | null>(null);
  const maxComboThisBattleRef = useRef(0);
  const battleSessionIdRef = useRef(0);
  const recordedBattleIdsRef = useRef(new Set<number>());
  const [progressVersion, setProgressVersion] = useState(0);
  const progress = useMemo(() => loadProgress(), [progressVersion]);
  const [dailyPick] = useState(() => getDailyPick());
  const [freshAchievements, setFreshAchievements] = useState<AchievementDef[]>([]);

  const playAnswerFeedback = useAnswerFeedback();

  const selectGender = useCallback((g: PlayerGender) => {
    setPlayerGender(g);
    savePlayerGender(g);
  }, []);

  const current = queue[index];
  const meta = useMemo(() => LEVELS.find((l) => l.value === level), [level]);
  const categoryMeta = useMemo(
    () => CATEGORY_LIST.find((c) => c.id === categoryId),
    [categoryId],
  );

  const startStage = useCallback(
    (cat: QuestionCategoryId, lv: HensachiLevel) => {
      const qs = pickRandomBattleQuestions(cat, lv);
      battleSessionIdRef.current += 1;
      setCategoryId(cat);
      setLevel(lv);
      setQueue(qs);
      setIndex(0);
      setPlayerHp(MAX_HP);
      setEnemyHp(MAX_HP);
      setFeedback(null);
      setAwaitExplainAck(false);
      setLocked(false);
      setResultKind(null);
      comebackHealEligibleRef.current = false;
      setRecoveryHint(null);
      setStreakCorrect(0);
      setLastChoiceIndex(null);
      maxComboThisBattleRef.current = 0;
      setFreshAchievements([]);
      setPhase('battle');
    },
    [],
  );

  const goTitle = useCallback(() => {
    setPhase('title');
    setCategoryId(null);
    setLevel(null);
    setQueue([]);
    setFeedback(null);
    setAwaitExplainAck(false);
    setLocked(false);
    setResultKind(null);
    comebackHealEligibleRef.current = false;
    setRecoveryHint(null);
    setStreakCorrect(0);
    setLastChoiceIndex(null);
    setFreshAchievements([]);
  }, []);

  useEffect(() => {
    if (phase !== 'result' || resultKind === null || !categoryId || !level) return;
    const sid = battleSessionIdRef.current;
    if (recordedBattleIdsRef.current.has(sid)) return;
    recordedBattleIdsRef.current.add(sid);
    const { newAchievements } = recordBattleEnd(
      resultKind,
      categoryId,
      level,
      maxComboThisBattleRef.current,
    );
    if (newAchievements.length) {
      setFreshAchievements(newAchievements);
    }
    setProgressVersion((v) => v + 1);
  }, [phase, resultKind, categoryId, level]);

  const advanceBattle = useCallback(
    (nextEnemy: number, nextPlayer: number, nextIndex: number, totalQuestions: number) => {
      setEnemyHp(nextEnemy);
      setPlayerHp(nextPlayer);

      if (nextEnemy <= 0) {
        setResultKind('win');
        setPhase('result');
      } else if (nextPlayer <= 0) {
        setResultKind('lose');
        setPhase('result');
      } else if (nextIndex >= totalQuestions) {
        setResultKind('draw');
        setPhase('result');
      } else {
        setIndex(nextIndex);
      }
    },
    [],
  );

  const onChoose = useCallback(
    (choice: number) => {
      if (!current || locked) return;
      setRecoveryHint(null);
      setLocked(true);
      setLastChoiceIndex(choice);
      const ok = choice === current.correctIndex;
      setFeedback(ok ? 'correct' : 'wrong');
      setAwaitExplainAck(true);
      playAnswerFeedback(ok);
    },
    [current, locked, playAnswerFeedback],
  );

  const continueAfterExplain = useCallback(() => {
    if (!current) return;
    const wasCorrect = feedback === 'correct';
    setFeedback(null);
    setAwaitExplainAck(false);
    setLastChoiceIndex(null);

    if (wasCorrect) {
      const newStreak = streakCorrect + 1;
      maxComboThisBattleRef.current = Math.max(maxComboThisBattleRef.current, newStreak);
      setStreakCorrect(newStreak);
      const bonus = bonusDamageForStreak(newStreak);
      const dmg = DAMAGE_TO_ENEMY + bonus;
      let heal = 0;
      if (comebackHealEligibleRef.current) {
        heal = Math.min(HEAL_COMEBACK, MAX_HP - playerHp);
        comebackHealEligibleRef.current = false;
        if (heal > 0) {
          setRecoveryHint(`リカバリー！ HP +${heal}`);
        }
      }
      const nextEnemy = Math.max(0, enemyHp - dmg);
      const nextPlayer = Math.min(MAX_HP, playerHp + heal);
      const nextIndex = index + 1;
      advanceBattle(nextEnemy, nextPlayer, nextIndex, queue.length);
    } else {
      comebackHealEligibleRef.current = true;
      setStreakCorrect(0);
      const nextEnemy = enemyHp;
      const nextPlayer = Math.max(0, playerHp - DAMAGE_TO_PLAYER);
      const nextIndex = index + 1;
      advanceBattle(nextEnemy, nextPlayer, nextIndex, queue.length);
    }
    setLocked(false);
  }, [
    current,
    feedback,
    enemyHp,
    playerHp,
    index,
    queue.length,
    advanceBattle,
    streakCorrect,
  ]);

  return (
    <div className="app">
      <header className="hero">
        <p className="eyebrow">高校受験 国語</p>
        <h1>高校受験 国語 RPG</h1>
        <p className="lede">
          まず出題の種類（語彙の迷宮・漢字・文法など）を選び、つづいて偏差値ステージに挑戦します。問題は入試の「大問の型」に合わせたオリジナルです（過去問本文の転載ではありません）。
        </p>
      </header>

      {phase === 'title' && (
        <section className="panel title-panel">
          <div className="meta-strip" aria-label="冒険の記録">
            <div className="meta-strip-row">
              <span className="meta-rank">{getStudyRankLabel(progress)}</span>
            </div>
            <p className="meta-strip-stats">
              累計勝利 <strong>{progress.totalWins}</strong> 　ステージ制覇{' '}
              <strong>{getClearedCount(progress)}</strong> / 20
            </p>
            {progress.unlockedAchievements.length > 0 && (
              <ul className="achievement-chips" aria-label="獲得した勲章">
                {progress.unlockedAchievements.map((id) => {
                  const d = ACHIEVEMENT_LIST.find((a) => a.id === id);
                  return d ? (
                    <li key={id} className="achievement-chip" title={d.description}>
                      {d.title}
                    </li>
                  ) : null;
                })}
              </ul>
            )}
          </div>
          <div className="daily-pick">
            <p className="daily-pick-label">今日の一手</p>
            <p className="daily-pick-text">{dailyPick.label}</p>
            <button
              type="button"
              className="btn"
              onClick={() => {
                startStage(dailyPick.categoryId, dailyPick.level);
              }}
            >
              このステージですぐ挑戦
            </button>
          </div>
          <fieldset className="gender-pick">
            <legend className="gender-pick-legend">主人公の見た目</legend>
            <p className="gender-pick-hint">男子・女子から選べます（あとからタイトルで変更可）</p>
            <div className="gender-pick-row">
              <button
                type="button"
                className={`gender-opt ${playerGender === 'male' ? 'is-selected' : ''}`}
                onClick={() => selectGender('male')}
                aria-pressed={playerGender === 'male'}
              >
                <span className="gender-opt-preview">
                  <PlayerHero gender="male" size="thumb" />
                </span>
                <span className="gender-opt-label">男子</span>
              </button>
              <button
                type="button"
                className={`gender-opt ${playerGender === 'female' ? 'is-selected' : ''}`}
                onClick={() => selectGender('female')}
                aria-pressed={playerGender === 'female'}
              >
                <span className="gender-opt-preview">
                  <PlayerHero gender="female" size="thumb" />
                </span>
                <span className="gender-opt-label">女子</span>
              </button>
            </div>
          </fieldset>
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              setPhase('category');
            }}
          >
            はじめる
          </button>
        </section>
      )}

      {phase === 'category' && (
        <section className="panel category-grid">
          <h2 className="category-heading">出題の種類を選ぶ</h2>
          <div className="cards category-cards">
            {CATEGORY_LIST.map((c) => (
              <button
                key={c.id}
                type="button"
                className="stage-card category-card"
                onClick={() => {
                  setCategoryId(c.id);
                  setPhase('stage');
                }}
              >
                <span className="category-emoji" aria-hidden>
                  {c.emoji}
                </span>
                <span className="stage-label">{c.title}</span>
                <span className="stage-blurb">{c.description}</span>
              </button>
            ))}
          </div>
          <button type="button" className="btn ghost" onClick={() => setPhase('title')}>
            もどる
          </button>
        </section>
      )}

      {phase === 'stage' && categoryId && (
        <section className="panel stage-grid">
          <h2 className="category-heading">
            偏差値ステージ · {categoryMeta?.title ?? ''}
          </h2>
          <div className="cards">
            {LEVELS.map((s) => (
              <button
                key={s.value}
                type="button"
                className="stage-card stage-card--with-sprite"
                onClick={() => startStage(categoryId, s.value)}
              >
                <span className="stage-sprite-wrap" aria-hidden>
                  <EnemySpriteByLevel level={s.value} size="thumb" />
                </span>
                <span className="stage-label">{s.label}</span>
                <span className="stage-enemy">{s.enemy}</span>
                <span className="stage-blurb">{s.blurb}</span>
                {isStageCleared(categoryId, s.value, progress) && (
                  <span className="stage-cleared-badge" title="すでに一度クリアしたステージ">
                    制覇済
                  </span>
                )}
              </button>
            ))}
          </div>
          <button type="button" className="btn ghost" onClick={() => setPhase('category')}>
            種類選択へもどる
          </button>
        </section>
      )}

      {phase === 'battle' && current && meta && categoryMeta && (
        <section className="panel battle">
          <div className="arena">
            <div
              className={`actor player ${feedback === 'wrong' ? 'actor--player-hurt' : ''}`}
            >
              <div className="sprite sprite--player" aria-hidden>
                <PlayerHero gender={playerGender} />
              </div>
              {feedback === 'wrong' && (
                <span className="float-dmg float-dmg--hurt" aria-hidden>
                  −{DAMAGE_TO_PLAYER}
                </span>
              )}
              <p>
                受験戦士（{playerGender === 'female' ? '女子' : '男子'}）
              </p>
              <HpBar value={playerHp} max={MAX_HP} variant="player" />
              {recoveryHint && (
                <p className="recovery-hint" role="status">
                  {recoveryHint}
                </p>
              )}
            </div>
            <div className="vs" aria-hidden>
              VS
            </div>
            <div
              className={`actor enemy ${feedback === 'correct' ? 'actor--enemy-hit' : ''}`}
            >
              <div className="sprite sprite--enemy" aria-hidden>
                {level != null && <EnemySpriteByLevel level={level} />}
              </div>
              {feedback === 'correct' && (
                <span className="float-dmg float-dmg--strike" aria-hidden>
                  −{DAMAGE_TO_ENEMY}
                </span>
              )}
              <p>{meta.enemy}</p>
              <HpBar value={enemyHp} max={MAX_HP} variant="enemy" />
            </div>
          </div>

          <p className="stage-pill">
            {categoryMeta.emoji} {categoryMeta.title} · {meta.label} · {current.pastExamStyle}
          </p>

          {streakCorrect >= 2 && (
            <p className="combo-pill" role="status">
              連続正解 ×{streakCorrect} · つぎの正解でコンボボーナス！
            </p>
          )}

          <article className="question-card">
            {current.passage && (
              <blockquote className="passage">{current.passage}</blockquote>
            )}
            <p className="prompt">{current.prompt}</p>
            <ul className="choices">
              {current.choices.map((c, i) => (
                <li key={i}>
                  <button
                    type="button"
                    className="choice"
                    disabled={locked}
                    onClick={() => onChoose(i)}
                  >
                    {String.fromCharCode(65 + i)}. {c}
                  </button>
                </li>
              ))}
            </ul>
          </article>

          {feedback && (
            <p className={`feedback ${feedback}`} role="status">
              {feedback === 'correct'
                ? (() => {
                    const s = streakCorrect + 1;
                    const b = bonusDamageForStreak(s);
                    const total = DAMAGE_TO_ENEMY + b;
                    return b > 0
                      ? `せいかい！ 連続${s}コンボ！ 合計 ${total} のダメージ（うち追加 +${b}）！`
                      : `せいかい！ モンスターに ${total} のダメージ！`;
                  })()
                : `ざんねん… ${DAMAGE_TO_PLAYER} のダメージを受けました（連続はリセット）。下の解説をじっくり読めば、次の一歩につながります。`}
            </p>
          )}

          {awaitExplainAck && current && feedback && (
            <div
              className={`lesson-panel ${feedback === 'correct' ? 'lesson-panel--correct' : 'lesson-panel--wrong'}`}
              role="region"
              aria-label={feedback === 'correct' ? '正解と解説' : '正解と解説（復習）'}
            >
              {feedback === 'wrong' && (
                <>
                  <p className="lesson-wrong-preamble">
                    合わなくても大丈夫です。下は「正解の理由」→「つぎに試すコツ」の順で読めるようにしてあります。上から、ゆっくりで構いません。
                  </p>
                  {lastChoiceIndex !== null &&
                    lastChoiceIndex >= 0 &&
                    lastChoiceIndex < 4 &&
                    lastChoiceIndex !== current.correctIndex && (
                      <p className="lesson-your-choice">
                        今回選んだ答えは{' '}
                        <span className="lesson-your-choice-key">
                          {String.fromCharCode(65 + lastChoiceIndex)}. {current.choices[lastChoiceIndex]}
                        </span>
                        です。正解と比べながら、下を読んでみてください。
                      </p>
                    )}
                </>
              )}
              <p className="lesson-panel-kicker">
                {feedback === 'correct' ? 'せいかい！' : 'こたえあわせ'}
              </p>
              <p className="lesson-answer-line">
                <span className="lesson-answer-key">
                  {String.fromCharCode(65 + current.correctIndex)}.
                </span>{' '}
                {current.choices[current.correctIndex]}
              </p>
              <p className="lesson-lead">
                {feedback === 'correct' ? 'やさしい解説' : 'なぜこの答えになるか'}
              </p>
              {feedback === 'wrong' ? (
                <ExplainParagraphs text={current.explanation} className="lesson-explain" />
              ) : (
                <p className="lesson-explain">{current.explanation}</p>
              )}
              {feedback === 'wrong' && (
                <>
                  <p className="lesson-lead lesson-lead--extra">つぎに試すコツ</p>
                  <ExplainParagraphs
                    text={current.explanationOnWrong ?? wrongExplainFallback(categoryId)}
                    className="lesson-explain lesson-explain--supplement"
                  />
                </>
              )}
              <button type="button" className="btn primary lesson-next" onClick={continueAfterExplain}>
                つぎの問題へ
              </button>
            </div>
          )}

          <button
            type="button"
            className="btn ghost"
            onClick={goTitle}
            disabled={locked && !awaitExplainAck}
          >
            タイトルへ（中断）
          </button>
        </section>
      )}

      {phase === 'result' && meta && resultKind && categoryMeta && (
        <section
          className={`panel result ${resultKind === 'win' ? 'result--victory' : ''}`}
        >
          {resultKind === 'win' && (
            <div className="victory-fx" aria-hidden>
              <span className="victory-ray" />
              <span className="victory-burst" />
              <span className="victory-star victory-star--1">★</span>
              <span className="victory-star victory-star--2">✦</span>
              <span className="victory-star victory-star--3">★</span>
              <span className="victory-star victory-star--4">✦</span>
            </div>
          )}
          <h2 className={resultKind === 'win' ? 'result-title--win' : undefined}>
            {resultKind === 'win' && 'ステージクリア！'}
            {resultKind === 'lose' && 'リタイア…'}
            {resultKind === 'draw' && 'もう少し！'}
          </h2>
          {freshAchievements.length > 0 && (
            <div className="result-achievements" role="status">
              <p className="result-achievements-title">勲章を獲得！</p>
              <ul className="result-achievement-list">
                {freshAchievements.map((a) => (
                  <li key={a.id}>
                    <strong>{a.title}</strong>
                    <span className="result-achievement-desc">{a.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {resultKind === 'win' && (
            <p className="result-cheer" role="status">
              すばらしい！　見事な国語力だ！
            </p>
          )}
          <p className="result-msg">
            {resultKind === 'win' &&
              `${categoryMeta.title}（${meta.label}）のモンスターを倒した！`}
            {resultKind === 'lose' && '体力がなくなった。ステージ選択から再挑戦しよう。'}
            {resultKind === 'draw' &&
              '問題を出し切ったが、モンスターを倒しきれなかった。同じステージでもう一度挑戦しよう。'}
          </p>
          <div className="result-actions">
            <button
              type="button"
              className="btn primary"
              onClick={() => categoryId && level && startStage(categoryId, level)}
            >
              同じ設定でもう一度
            </button>
            <button type="button" className="btn" onClick={() => setPhase('stage')}>
              偏差値ステージへ
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setCategoryId(null);
                setPhase('category');
              }}
            >
              出題の種類へ
            </button>
            <button type="button" className="btn ghost" onClick={goTitle}>
              タイトルへ
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function HpBar({
  value,
  max,
  variant,
}: {
  value: number;
  max: number;
  variant: 'player' | 'enemy';
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <div
      className={`hpbar ${variant}`}
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div className="hpbar-fill" style={{ width: `${pct}%` }} />
      <span className="hpbar-text">
        HP {value}/{max}
      </span>
    </div>
  );
}

export default App;
