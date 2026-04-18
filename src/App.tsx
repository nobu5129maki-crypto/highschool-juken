import { useCallback, useMemo, useRef, useState } from 'react';
import type { HensachiLevel, Question, QuestionCategoryId, PlayerGender } from './types';
import { CATEGORY_LIST, pickRandomBattleQuestions } from './data/questionBank';
import { useGameAudio } from './audio/useGameAudio';
import { EnemySpriteByLevel, PlayerHero } from './components/CharacterSprites';
import { loadPlayerGender, savePlayerGender } from './playerPrefs';
import './App.css';

type Phase = 'title' | 'category' | 'stage' | 'battle' | 'result';
type ResultKind = 'win' | 'lose' | 'draw';

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

  const { bgmMuted, ensureBgm, toggleBgm, playAnswerFeedback } = useGameAudio();

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

  const startStage = useCallback((cat: QuestionCategoryId, lv: HensachiLevel) => {
    const qs = pickRandomBattleQuestions(cat, lv);
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
    setPhase('battle');
  }, []);

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
  }, []);

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

    if (wasCorrect) {
      let heal = 0;
      if (comebackHealEligibleRef.current) {
        heal = Math.min(HEAL_COMEBACK, MAX_HP - playerHp);
        comebackHealEligibleRef.current = false;
        if (heal > 0) {
          setRecoveryHint(`リカバリー！ HP +${heal}`);
        }
      }
      const nextEnemy = Math.max(0, enemyHp - DAMAGE_TO_ENEMY);
      const nextPlayer = Math.min(MAX_HP, playerHp + heal);
      const nextIndex = index + 1;
      advanceBattle(nextEnemy, nextPlayer, nextIndex, queue.length);
    } else {
      comebackHealEligibleRef.current = true;
      const nextEnemy = enemyHp;
      const nextPlayer = Math.max(0, playerHp - DAMAGE_TO_PLAYER);
      const nextIndex = index + 1;
      advanceBattle(nextEnemy, nextPlayer, nextIndex, queue.length);
    }
    setLocked(false);
  }, [current, feedback, enemyHp, playerHp, index, queue.length, advanceBattle]);

  return (
    <div className="app">
      <div className="audio-dock">
        <button
          type="button"
          className="audio-btn"
          onClick={() => void toggleBgm()}
          aria-pressed={!bgmMuted}
          title={bgmMuted ? 'BGMをオン' : 'BGMをオフ'}
        >
          <span className="audio-btn-icon" aria-hidden>
            {bgmMuted ? '🔇' : '🎵'}
          </span>
          <span className="audio-btn-label">{bgmMuted ? 'BGMオフ' : 'BGMオン'}</span>
        </button>
      </div>

      <header className="hero">
        <p className="eyebrow">高校受験 国語</p>
        <h1>高校受験 国語 RPG</h1>
        <p className="lede">
          まず出題の種類（語彙の迷宮・漢字・文法など）を選び、つづいて偏差値ステージに挑戦します。問題は入試の「大問の型」に合わせたオリジナルです（過去問本文の転載ではありません）。
        </p>
      </header>

      {phase === 'title' && (
        <section className="panel title-panel">
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
              void ensureBgm();
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
                ? `せいかい！ モンスターに ${DAMAGE_TO_ENEMY} のダメージ！`
                : `ざんねん… あなたは ${DAMAGE_TO_PLAYER} のダメージを受けた`}
            </p>
          )}

          {awaitExplainAck && current && feedback && (
            <div
              className={`lesson-panel ${feedback === 'correct' ? 'lesson-panel--correct' : 'lesson-panel--wrong'}`}
              role="region"
              aria-label="正解と解説"
            >
              <p className="lesson-panel-kicker">
                {feedback === 'correct' ? 'せいかい！' : '正解はこちら'}
              </p>
              <p className="lesson-answer-line">
                <span className="lesson-answer-key">
                  {String.fromCharCode(65 + current.correctIndex)}.
                </span>{' '}
                {current.choices[current.correctIndex]}
              </p>
              <p className="lesson-lead">やさしい解説</p>
              <p className="lesson-explain">{current.explanation}</p>
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
