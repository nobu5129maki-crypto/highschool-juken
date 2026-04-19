import { useId } from 'react';
import type { HensachiLevel, PlayerGender } from '../types';

function useSafeSvgIds(prefix: string): string {
  const id = useId();
  return `${prefix}_${id.replace(/:/g, '')}`;
}

type Size = 'battle' | 'thumb';

const sizePx = { battle: 132, thumb: 56 } as const;

function wrapClass(size: Size, className?: string) {
  return ['sprite-svg', size === 'battle' ? 'sprite-svg--battle' : 'sprite-svg--thumb', className]
    .filter(Boolean)
    .join(' ');
}

const VB_H = 130;

/** 男子：クールな制服・短髪・参考書を構える受験戦士 */
function PlayerHeroMale({ size = 'battle', className }: { size?: Size; className?: string }) {
  const id = useSafeSvgIds('heroM');
  const h = sizePx[size];
  return (
    <svg
      className={wrapClass(size, className)}
      width={Math.round((h * 100) / VB_H)}
      height={h}
      viewBox={`0 0 100 ${VB_H}`}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${id}-blazer`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id={`${id}-book`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#172554" />
        </linearGradient>
        <linearGradient id={`${id}-tie`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#4338ca" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="122" rx="26" ry="5" fill="#1e293b" opacity="0.35" />
      {/* 脚・靴 */}
      <path d="M38 96 L36 118 L44 120 L46 100Z" fill="#1e293b" stroke="#0f172a" strokeWidth="0.6" />
      <path d="M54 100 L52 118 L60 120 L62 100Z" fill="#1e293b" stroke="#0f172a" strokeWidth="0.6" />
      <ellipse cx="40" cy="119" rx="5" ry="2" fill="#0f172a" />
      <ellipse cx="56" cy="119" rx="5" ry="2" fill="#0f172a" />
      {/* スラックス */}
      <path d="M40 88 L38 98 L46 100 L48 90Z" fill="#1e293b" />
      <path d="M52 90 L54 100 L62 98 L60 88Z" fill="#1e293b" />
      {/* ブレザー胴体 */}
      <path
        d="M32 52 L28 92 Q30 98 38 96 L44 90 L50 88 L56 90 L62 96 Q70 98 72 92 L68 52 Q50 44 32 52Z"
        fill={`url(#${id}-blazer)`}
        stroke="#020617"
        strokeWidth="1.2"
      />
      {/* ラペル */}
      <path d="M38 54 L42 78 L50 82 L58 78 L62 54" fill="none" stroke="#475569" strokeWidth="1" />
      <path d="M50 54 L50 86" stroke="#64748b" strokeWidth="0.8" />
      {/* シャツ */}
      <path d="M44 54 L50 62 L56 54" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.6" />
      {/* ネクタイ */}
      <path d="M48 62 L50 84 L52 62 L50 58Z" fill={`url(#${id}-tie)`} stroke="#312e81" strokeWidth="0.5" />
      {/* 金ボタン */}
      <circle cx="50" cy="72" r="1.8" fill="#fbbf24" stroke="#b45308" strokeWidth="0.4" />
      <circle cx="50" cy="80" r="1.8" fill="#fbbf24" stroke="#b45308" strokeWidth="0.4" />
      {/* 首・顔 */}
      <path d="M42 38 L42 52 L58 52 L58 38Z" fill="#fdba8c" stroke="#c2410c" strokeWidth="0.8" />
      <ellipse cx="50" cy="32" rx="14" ry="16" fill="#fdba8c" stroke="#c2410c" strokeWidth="1" />
      {/* 髪（短め・ワイルド） */}
      <path
        d="M36 28 L34 18 L40 22 L42 14 L48 20 L50 12 L56 20 L58 14 L64 22 L66 18 L64 28 Q50 24 36 28Z"
        fill="#0f172a"
        stroke="#020617"
        strokeWidth="0.8"
      />
      {/* 目・眉 */}
      <path d="M40 30 L46 32" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M54 32 L60 30" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" />
      <ellipse cx="43" cy="36" rx="3" ry="3.5" fill="#1e293b" />
      <ellipse cx="57" cy="36" rx="3" ry="3.5" fill="#1e293b" />
      <ellipse cx="44" cy="35" rx="1" ry="1.2" fill="#fff" opacity="0.85" />
      <ellipse cx="58" cy="35" rx="1" ry="1.2" fill="#fff" opacity="0.85" />
      <path d="M46 44 Q50 42 54 44" fill="none" stroke="#9a3412" strokeWidth="0.9" strokeLinecap="round" />
      {/* 参考書（前に構える） */}
      <g transform="rotate(-8 62 64)">
        <rect x="58" y="48" width="26" height="34" rx="2" fill={`url(#${id}-book)`} stroke="#1e40af" strokeWidth="1" />
        <rect x="61" y="52" width="20" height="2.5" rx="0.5" fill="#93c5fd" opacity="0.5" />
        <rect x="61" y="56" width="18" height="2" rx="0.5" fill="#93c5fd" opacity="0.35" />
        <rect x="61" y="60" width="16" height="2" rx="0.5" fill="#93c5fd" opacity="0.35" />
        <rect x="63" y="68" width="14" height="8" rx="1" fill="#1e40af" opacity="0.45" />
        <path d="M65 71 H77 M65 74 H75 M65 77 H76" stroke="#bfdbfe" strokeWidth="0.8" strokeLinecap="round" />
      </g>
      {/* ペン（もう片手） */}
      <path d="M26 70 L22 88 L24 90 L30 72Z" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.6" />
      <path d="M24 84 L20 96" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
      {/* 肩ライン */}
      <path d="M28 50 Q50 46 72 50" fill="none" stroke="#475569" strokeWidth="0.6" opacity="0.6" />
    </svg>
  );
}

/** 女子：クールな制服・ポニー・ノートを掲げる受験戦士 */
function PlayerHeroFemale({ size = 'battle', className }: { size?: Size; className?: string }) {
  const id = useSafeSvgIds('heroF');
  const h = sizePx[size];
  return (
    <svg
      className={wrapClass(size, className)}
      width={Math.round((h * 100) / VB_H)}
      height={h}
      viewBox={`0 0 100 ${VB_H}`}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${id}-blazer`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3f3f46" />
          <stop offset="100%" stopColor="#18181b" />
        </linearGradient>
        <linearGradient id={`${id}-skirt`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#27272a" />
          <stop offset="100%" stopColor="#09090b" />
        </linearGradient>
        <linearGradient id={`${id}-ribbon`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#6b21a8" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="122" rx="26" ry="5" fill="#27272a" opacity="0.35" />
      {/* 脚 */}
      <path d="M42 96 L40 118 L46 120 L48 100Z" fill="#fce7f3" stroke="#fbcfe8" strokeWidth="0.5" />
      <path d="M52 100 L50 118 L56 120 L58 100Z" fill="#fce7f3" stroke="#fbcfe8" strokeWidth="0.5" />
      <rect x="39" y="116" width="8" height="4" rx="1" fill="#fafafa" stroke="#d4d4d8" />
      <rect x="51" y="116" width="8" height="4" rx="1" fill="#fafafa" stroke="#d4d4d8" />
      {/* プリーツスカート */}
      <path
        d="M34 88 L30 102 L50 108 L70 102 L66 88 Q50 84 34 88Z"
        fill={`url(#${id}-skirt)`}
        stroke="#18181b"
        strokeWidth="0.8"
      />
      <path d="M38 90 L50 104 L62 90" fill="none" stroke="#3f3f46" strokeWidth="0.5" opacity="0.7" />
      {/* ブレザー */}
      <path
        d="M30 52 L26 90 Q28 96 36 94 L42 88 L50 86 L58 88 L64 94 Q72 96 74 90 L70 52 Q50 44 30 52Z"
        fill={`url(#${id}-blazer)`}
        stroke="#09090b"
        strokeWidth="1.2"
      />
      <path d="M36 54 L42 80 L50 84 L58 80 L64 54" fill="none" stroke="#52525b" strokeWidth="0.9" />
      <path d="M50 54 L50 88" stroke="#71717a" strokeWidth="0.7" />
      {/* ブラウス＆リボン */}
      <path d="M44 56 L50 64 L56 56" fill="#fafafa" stroke="#e4e4e7" strokeWidth="0.5" />
      <path
        d="M46 64 L50 72 L54 64 L52 62 L48 62Z"
        fill={`url(#${id}-ribbon)`}
        stroke="#581c87"
        strokeWidth="0.4"
      />
      <circle cx="50" cy="74" r="1.6" fill="#fbbf24" stroke="#b45308" strokeWidth="0.35" />
      <circle cx="50" cy="82" r="1.6" fill="#fbbf24" stroke="#b45308" strokeWidth="0.35" />
      {/* 首・顔 */}
      <path d="M42 40 L42 52 L58 52 L58 40Z" fill="#fcd9bd" stroke="#c2410c" strokeWidth="0.7" />
      <ellipse cx="50" cy="34" rx="15" ry="17" fill="#fcd9bd" stroke="#c2410c" strokeWidth="1" />
      {/* 髪（ポニテ） */}
      <path
        d="M34 32 Q30 22 38 16 L42 24 L50 14 L58 24 L62 16 Q70 22 66 32 Q50 28 34 32Z"
        fill="#27272a"
        stroke="#18181b"
        strokeWidth="0.8"
      />
      <path
        d="M62 28 Q78 40 74 72 L68 70 Q70 48 62 36Z"
        fill="#3f3f46"
        stroke="#27272a"
        strokeWidth="0.7"
      />
      <ellipse cx="72" cy="56" rx="5" ry="8" fill="#52525b" />
      {/* 顔パーツ */}
      <path d="M40 30 L46 31" stroke="#27272a" strokeWidth="1" strokeLinecap="round" />
      <path d="M54 31 L60 30" stroke="#27272a" strokeWidth="1" strokeLinecap="round" />
      <ellipse cx="44" cy="38" rx="3.2" ry="4" fill="#1c1917" />
      <ellipse cx="56" cy="38" rx="3.2" ry="4" fill="#1c1917" />
      <ellipse cx="45" cy="37" rx="1.1" ry="1.3" fill="#fff" opacity="0.9" />
      <ellipse cx="57" cy="37" rx="1.1" ry="1.3" fill="#fff" opacity="0.9" />
      <path d="M45 46 Q50 44 55 46" fill="none" stroke="#be123c" strokeWidth="0.85" strokeLinecap="round" />
      {/* ノートを掲げる */}
      <g transform="rotate(12 24 58)">
        <rect x="8" y="48" width="22" height="30" rx="2" fill="#fefce8" stroke="#eab308" strokeWidth="1" />
        <line x1="12" y1="56" x2="26" y2="56" stroke="#ca8a04" strokeWidth="0.8" />
        <line x1="12" y1="60" x2="24" y2="60" stroke="#ca8a04" strokeWidth="0.5" opacity="0.7" />
        <line x1="12" y1="64" x2="25" y2="64" stroke="#ca8a04" strokeWidth="0.5" opacity="0.7" />
        <path d="M14 72 L26 74" stroke="#a16207" strokeWidth="1.2" strokeLinecap="round" />
      </g>
      {/* 右腕シルエット */}
      <path d="M70 58 L78 68 L74 72 L66 62Z" fill="#fcd9bd" opacity="0.9" />
    </svg>
  );
}

/** 主人公：男子・女子でシルエットが変わる「受験戦士」 */
export function PlayerHero({
  gender,
  size = 'battle',
  className,
}: {
  gender: PlayerGender;
  size?: Size;
  className?: string;
}) {
  return gender === 'female' ? (
    <PlayerHeroFemale size={size} className={className} />
  ) : (
    <PlayerHeroMale size={size} className={className} />
  );
}

/** 偏差値40：ネオンスライム — 核が発光する知性の塊 */
function MonsterSlime({ size = 'battle', className }: { size?: Size; className?: string }) {
  const id = useSafeSvgIds('slime');
  const h = sizePx[size];
  return (
    <svg
      className={wrapClass(size, className)}
      width={Math.round((h * 100) / 130)}
      height={h}
      viewBox="0 0 100 130"
      aria-hidden
    >
      <defs>
        <radialGradient id={`${id}-core`} cx="40%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="45%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#164e63" />
        </radialGradient>
        <linearGradient id={`${id}-gel`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e3a5f" />
          <stop offset="100%" stopColor="#0c4a6e" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="118" rx="32" ry="7" fill="#0891b2" opacity="0.35" />
      <path
        d="M50 28 C28 28 18 48 18 72 C18 96 32 108 50 108 C68 108 82 96 82 72 C82 48 72 28 50 28Z"
        fill={`url(#${id}-gel)`}
        stroke="#155e75"
        strokeWidth="1.5"
      />
      <ellipse cx="50" cy="62" rx="28" ry="36" fill={`url(#${id}-core)`} opacity="0.85" />
      {/* 鋭い単眼 */}
      <ellipse cx="50" cy="58" rx="10" ry="12" fill="#0f172a" />
      <ellipse cx="52" cy="54" rx="3" ry="4" fill="#22d3ee" />
      <ellipse cx="53" cy="53" rx="1.2" ry="1.5" fill="#fff" opacity="0.9" />
      {/* 滴 */}
      <circle cx="30" cy="88" r="4" fill="#06b6d4" opacity="0.7" />
      <circle cx="72" cy="92" r="3" fill="#22d3ee" opacity="0.6" />
      <path d="M50 108 L50 118" stroke="#67e8f9" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

/** 偏差値50：グリモワール・ゴブリン — 壊れた羽ペンを棍棒に */
function MonsterGoblin({ size = 'battle', className }: { size?: Size; className?: string }) {
  const id = useSafeSvgIds('goblin');
  const h = sizePx[size];
  return (
    <svg
      className={wrapClass(size, className)}
      width={Math.round((h * 100) / 130)}
      height={h}
      viewBox="0 0 100 130"
      aria-hidden
    >
      <defs>
        <linearGradient id={`${id}-skin`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="100%" stopColor="#166534" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="118" rx="28" ry="6" fill="#14532d" opacity="0.4" />
      {/* フード */}
      <path
        d="M50 22 L22 38 L18 72 L82 72 L78 38Z"
        fill="#1e293b"
        stroke="#0f172a"
        strokeWidth="1.2"
      />
      <path d="M50 22 L50 72" stroke="#334155" strokeWidth="0.8" opacity="0.5" />
      {/* 顔 */}
      <ellipse cx="50" cy="52" rx="22" ry="20" fill={`url(#${id}-skin)`} stroke="#14532d" strokeWidth="1" />
      <path
        d="M38 48 L42 52 M58 48 L62 52"
        stroke="#0f172a"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M44 62 Q50 58 56 62" fill="none" stroke="#14532d" strokeWidth="1.5" strokeLinecap="round" />
      {/* 耳 */}
      <path d="M26 48 L18 38 L22 52Z" fill="#166534" />
      <path d="M74 48 L82 38 L78 52Z" fill="#166534" />
      {/* 羽ペン棍棒 */}
      <path d="M72 55 L88 100 L84 102 L68 58Z" fill="#78350f" stroke="#451a03" strokeWidth="0.8" />
      <path d="M84 95 L92 108 L88 110 L80 98Z" fill="#cbd5e1" stroke="#64748b" />
      {/* 体 */}
      <path d="M38 78 L32 108 L68 108 L62 78Z" fill="#334155" stroke="#1e293b" strokeWidth="1" />
    </svg>
  );
}

/** 偏差値60：断罪のナイト — ひび割れた盾と紫炎の目 */
function MonsterKnight({ size = 'battle', className }: { size?: Size; className?: string }) {
  const id = useSafeSvgIds('knight');
  const h = sizePx[size];
  return (
    <svg
      className={wrapClass(size, className)}
      width={Math.round((h * 100) / 130)}
      height={h}
      viewBox="0 0 100 130"
      aria-hidden
    >
      <defs>
        <linearGradient id={`${id}-armor`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="122" rx="30" ry="5" fill="#1e1b4b" opacity="0.5" />
      {/* 翼のシルエット */}
      <path d="M12 70 Q8 50 18 35 L28 45 Q20 60 22 78Z" fill="#1e1b4b" opacity="0.85" />
      <path d="M88 70 Q92 50 82 35 L72 45 Q80 60 78 78Z" fill="#1e1b4b" opacity="0.85" />
      {/* 胴 */}
      <path
        d="M32 55 L28 108 L72 108 L68 55 Q50 48 32 55Z"
        fill={`url(#${id}-armor)`}
        stroke="#0f172a"
        strokeWidth="1.2"
      />
      {/* 兜 */}
      <path
        d="M50 18 C32 18 22 32 22 48 C22 58 28 62 38 62 L62 62 C72 62 78 58 78 48 C78 32 68 18 50 18Z"
        fill="#334155"
        stroke="#020617"
        strokeWidth="1.5"
      />
      <path d="M38 42 L62 42" stroke="#020617" strokeWidth="2" strokeLinecap="round" />
      {/* 目スリット（紫の残光） */}
      <path d="M36 48 L44 52" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M56 52 L64 48" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" />
      {/* 盾 */}
      <path
        d="M12 58 L12 92 Q22 100 32 92 L32 58 Q22 52 12 58Z"
        fill="#1e293b"
        stroke="#64748b"
        strokeWidth="1"
      />
      <path d="M18 65 L26 75 M22 78 L28 88" stroke="#64748b" strokeWidth="0.8" opacity="0.6" />
      {/* 剣 */}
      <path d="M78 60 L92 108 L88 110 L74 64Z" fill="#94a3b8" stroke="#475569" />
      <path d="M88 100 L96 118" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** 偏差値70：古龍レクシア — 翼と角、胸に宿るマナの核 */
function MonsterDragon({ size = 'battle', className }: { size?: Size; className?: string }) {
  const id = useSafeSvgIds('dragon');
  const h = sizePx[size];
  return (
    <svg
      className={wrapClass(size, className)}
      width={Math.round((h * 100) / 130)}
      height={h}
      viewBox="0 0 100 130"
      aria-hidden
    >
      <defs>
        <linearGradient id={`${id}-scale`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="50%" stopColor="#312e81" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <radialGradient id={`${id}-core`} cx="45%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="70%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="122" rx="36" ry="6" fill="#7f1d1d" opacity="0.45" />
      {/* 翼 */}
      <path
        d="M8 75 Q2 55 12 38 L28 48 Q18 65 20 85Z"
        fill={`url(#${id}-scale)`}
        stroke="#1e1b4b"
        strokeWidth="1"
      />
      <path
        d="M92 75 Q98 55 88 38 L72 48 Q82 65 80 85Z"
        fill={`url(#${id}-scale)`}
        stroke="#1e1b4b"
        strokeWidth="1"
      />
      {/* 胴体 */}
      <path
        d="M50 35 Q28 45 24 72 Q22 95 40 108 L60 108 Q78 95 76 72 Q72 45 50 35Z"
        fill={`url(#${id}-scale)`}
        stroke="#0f172a"
        strokeWidth="1.2"
      />
      {/* 鱗のライン */}
      <path
        d="M32 60 Q50 55 68 60 M30 72 Q50 68 70 72 M34 84 Q50 80 66 84"
        fill="none"
        stroke="#4338ca"
        strokeWidth="0.6"
        opacity="0.5"
      />
      {/* 胸の核 */}
      <circle cx="50" cy="78" r="12" fill={`url(#${id}-core)`} opacity="0.95" />
      <circle cx="50" cy="78" r="6" fill="#fef08a" opacity="0.7" />
      {/* 首・頭 */}
      <ellipse cx="50" cy="38" rx="18" ry="14" fill="#1e3a8a" stroke="#172554" strokeWidth="1" />
      {/* 角 */}
      <path d="M36 28 L30 8 L38 24Z" fill="#cbd5e1" stroke="#475569" />
      <path d="M64 28 L70 8 L62 24Z" fill="#cbd5e1" stroke="#475569" />
      {/* 目 */}
      <ellipse cx="44" cy="38" rx="4" ry="3" fill="#fbbf24" />
      <ellipse cx="56" cy="38" rx="4" ry="3" fill="#fbbf24" />
      <ellipse cx="44.5" cy="38" rx="1.5" ry="1.5" fill="#1c1917" />
      <ellipse cx="56.5" cy="38" rx="1.5" ry="1.5" fill="#1c1917" />
      {/* 鼻口 */}
      <path d="M46 44 L50 50 L54 44" fill="none" stroke="#172554" strokeWidth="1" />
    </svg>
  );
}

export function EnemySpriteByLevel({
  level,
  size = 'battle',
  className,
}: {
  level: HensachiLevel;
  size?: Size;
  className?: string;
}) {
  switch (level) {
    case 40:
      return <MonsterSlime size={size} className={className} />;
    case 50:
      return <MonsterGoblin size={size} className={className} />;
    case 60:
      return <MonsterKnight size={size} className={className} />;
    case 70:
      return <MonsterDragon size={size} className={className} />;
    default:
      return <MonsterSlime size={size} className={className} />;
  }
}
