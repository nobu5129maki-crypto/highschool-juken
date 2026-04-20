/**
 * アプリ向け BGM（Web Audio API で合成）
 * 高校受験・国語学習 RPG の雰囲気に合わせた複数トラック
 */

function getAudioContextCtor(): (typeof AudioContext) | null {
  const w = window as unknown as { webkitAudioContext?: typeof AudioContext };
  return window.AudioContext ?? w.webkitAudioContext ?? null;
}

export type BgmTrackId = 'study' | 'field' | 'battle' | 'triumph';

export const BGM_TRACK_LABELS: Record<BgmTrackId, string> = {
  study: '静寂の図書館',
  field: '冒険の朝',
  battle: '試練の戦い',
  triumph: '勝利の光',
};

/** 各トラックのベースレベル（マスター gain に掛ける前の目安） */
export const BGM_TRACK_LEVEL: Record<BgmTrackId, number> = {
  study: 0.24,
  field: 0.2,
  battle: 0.18,
  triumph: 0.22,
};

export interface ActiveBgm {
  stop(): void;
}

type ConnectMaster = GainNode;

/** ─── 静寂の図書館：タイトル・落ち着いた学習向け（ゆるいパッド、拍子は曖昧） */
function startStudyPad(ctx: AudioContext, master: ConnectMaster): ActiveBgm {
  const oscillators: OscillatorNode[] = [];
  const t = ctx.currentTime;
  // Gm7 風（低めの和音）
  const freqs = [98, 146.83, 174.61, 207.65, 233.08];
  freqs.forEach((f, i) => {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, t);
    const g = ctx.createGain();
    g.gain.value = 0.05 + i * 0.012;
    o.connect(g);
    g.connect(master);
    o.start(t);
    oscillators.push(o);
  });
  // ごく弱いデチューン上層
  const air = ctx.createOscillator();
  air.type = 'triangle';
  air.frequency.setValueAtTime(392, t);
  const airF = ctx.createBiquadFilter();
  airF.type = 'lowpass';
  airF.frequency.value = 900;
  const airG = ctx.createGain();
  airG.gain.value = 0.018;
  air.connect(airF);
  airF.connect(airG);
  airG.connect(master);
  air.start(t);
  oscillators.push(air);
  // ゆっくりLFOでフィルタ揺らす
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.07;
  const lfoG = ctx.createGain();
  lfoG.gain.value = 350;
  lfo.connect(lfoG);
  lfoG.connect(airF.frequency);
  lfo.start(t);
  oscillators.push(lfo);

  return {
    stop() {
      for (const o of oscillators) {
        try {
          o.stop();
        } catch {
          /* noop */
        }
      }
    },
  };
}

/** ─── 冒険の朝：カテゴリ・ステージ選択（軽いリズムと歩くベース） */
function startFieldMarch(ctx: AudioContext, master: ConnectMaster): ActiveBgm {
  const BPM = 96;
  const oscillators: OscillatorNode[] = [];
  const t = ctx.currentTime;

  const sub = ctx.createOscillator();
  sub.type = 'triangle';
  sub.frequency.setValueAtTime(73.42, t);
  const subG = ctx.createGain();
  subG.gain.value = 0.35;
  sub.connect(subG);
  subG.connect(master);
  sub.start(t);
  oscillators.push(sub);

  const pad = [146.83, 174.61, 220];
  pad.forEach((f, i) => {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, t);
    const g = ctx.createGain();
    g.gain.value = 0.038 + i * 0.01;
    o.connect(g);
    g.connect(master);
    o.start(t);
    oscillators.push(o);
  });

  const arp = ctx.createOscillator();
  arp.type = 'triangle';
  const arpF = ctx.createBiquadFilter();
  arpF.type = 'lowpass';
  arpF.frequency.value = 2200;
  const arpG = ctx.createGain();
  arpG.gain.value = 0.055;
  arp.connect(arpF);
  arpF.connect(arpG);
  arpG.connect(master);
  arp.frequency.setValueAtTime(196, t);
  arp.start(t);
  oscillators.push(arp);

  const eighth = (60 / BPM / 2) * 1000;
  const pent = [196, 220, 246.94, 293.66, 329.63, 293.66, 246.94, 220];
  let step = 0;
  const arpInterval = setInterval(() => {
    const f = pent[step % pent.length];
    const ct = ctx.currentTime;
    arp.frequency.exponentialRampToValueAtTime(Math.max(90, f), ct + 0.04);
    step++;
  }, eighth);

  const kickInterval = setInterval(() => {
    const o = ctx.createOscillator();
    o.type = 'sine';
    const g = ctx.createGain();
    const now = ctx.currentTime;
    o.frequency.setValueAtTime(120, now);
    o.frequency.exponentialRampToValueAtTime(48, now + 0.08);
    g.gain.setValueAtTime(0.22, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    o.connect(g);
    g.connect(master);
    o.start(now);
    o.stop(now + 0.12);
  }, (60 / BPM) * 1000);

  return {
    stop() {
      clearInterval(arpInterval);
      clearInterval(kickInterval);
      for (const o of oscillators) {
        try {
          o.stop();
        } catch {
          /* noop */
        }
      }
    },
  };
}

/** ─── 試練の戦い：バトル（既存のドライブ感） */
function startBattleLoop(ctx: AudioContext, master: ConnectMaster): ActiveBgm {
  const BPM = 112;
  const oscillators: OscillatorNode[] = [];
  const t = ctx.currentTime;

  const sub = ctx.createOscillator();
  sub.type = 'triangle';
  sub.frequency.setValueAtTime(55, t);
  const subG = ctx.createGain();
  subG.gain.value = 0.4;
  sub.connect(subG);
  subG.connect(master);
  sub.start(t);
  oscillators.push(sub);

  const bass = ctx.createOscillator();
  bass.type = 'square';
  bass.frequency.setValueAtTime(110, t);
  const bassFilter = ctx.createBiquadFilter();
  bassFilter.type = 'lowpass';
  bassFilter.frequency.value = 400;
  const bassG = ctx.createGain();
  bassG.gain.value = 0.055;
  bass.connect(bassFilter);
  bassFilter.connect(bassG);
  bassG.connect(master);
  bass.start(t);
  oscillators.push(bass);

  const padFreqs = [110, 164.81, 220, 277.18];
  padFreqs.forEach((freq, i) => {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, t);
    const g = ctx.createGain();
    g.gain.value = 0.042 + i * 0.007;
    o.connect(g);
    g.connect(master);
    o.start(t);
    oscillators.push(o);
  });

  const arp = ctx.createOscillator();
  arp.type = 'triangle';
  const arpFilter = ctx.createBiquadFilter();
  arpFilter.type = 'lowpass';
  arpFilter.frequency.value = 2600;
  const arpG = ctx.createGain();
  arpG.gain.value = 0.065;
  arp.connect(arpFilter);
  arpFilter.connect(arpG);
  arpG.connect(master);
  arp.frequency.setValueAtTime(220, t);
  arp.start(t);
  oscillators.push(arp);

  const eighth = (60 / BPM / 2) * 1000;
  const pattern = [220, 246.94, 261.63, 293.66, 329.63, 293.66, 261.63, 246.94];
  let step = 0;
  const arpInterval = setInterval(() => {
    const f = pattern[step % pattern.length];
    const ct = ctx.currentTime;
    arp.frequency.exponentialRampToValueAtTime(Math.max(80, f), ct + 0.035);
    step++;
  }, eighth);

  const kickInterval = setInterval(() => {
    const o = ctx.createOscillator();
    o.type = 'sine';
    const g = ctx.createGain();
    const now = ctx.currentTime;
    o.frequency.setValueAtTime(145, now);
    o.frequency.exponentialRampToValueAtTime(42, now + 0.09);
    g.gain.setValueAtTime(0.32, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    o.connect(g);
    g.connect(master);
    o.start(now);
    o.stop(now + 0.14);
  }, (60 / BPM) * 1000);

  return {
    stop() {
      clearInterval(arpInterval);
      clearInterval(kickInterval);
      for (const o of oscillators) {
        try {
          o.stop();
        } catch {
          /* noop */
        }
      }
    },
  };
}

/** ─── 勝利の光：結果画面（明るい長音＋きらめきアルペジオ） */
function startTriumph(ctx: AudioContext, master: ConnectMaster): ActiveBgm {
  const BPM = 88;
  const oscillators: OscillatorNode[] = [];
  const t = ctx.currentTime;

  const chord = [130.81, 164.81, 196, 246.94, 293.66];
  chord.forEach((f, i) => {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, t);
    const g = ctx.createGain();
    g.gain.value = 0.045 + i * 0.008;
    o.connect(g);
    g.connect(master);
    o.start(t);
    oscillators.push(o);
  });

  const bell = ctx.createOscillator();
  bell.type = 'triangle';
  const bellF = ctx.createBiquadFilter();
  bellF.type = 'lowpass';
  bellF.frequency.value = 3200;
  const bellG = ctx.createGain();
  bellG.gain.value = 0.048;
  bell.connect(bellF);
  bellF.connect(bellG);
  bellG.connect(master);
  bell.frequency.setValueAtTime(523.25, t);
  bell.start(t);
  oscillators.push(bell);

  const sixteenth = (60 / BPM / 4) * 1000;
  const sparkle = [523.25, 659.25, 783.99, 659.25, 587.33, 659.25, 783.99, 880];
  let step = 0;
  const arpInterval = setInterval(() => {
    const f = sparkle[step % sparkle.length];
    const ct = ctx.currentTime;
    bell.frequency.exponentialRampToValueAtTime(Math.max(200, f), ct + 0.025);
    step++;
  }, sixteenth);

  const softPulse = setInterval(() => {
    const o = ctx.createOscillator();
    o.type = 'sine';
    const g = ctx.createGain();
    const now = ctx.currentTime;
    o.frequency.setValueAtTime(90, now);
    o.frequency.exponentialRampToValueAtTime(50, now + 0.12);
    g.gain.setValueAtTime(0.14, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    o.connect(g);
    g.connect(master);
    o.start(now);
    o.stop(now + 0.16);
  }, (60 / BPM) * 1000 * 2);

  return {
    stop() {
      clearInterval(arpInterval);
      clearInterval(softPulse);
      for (const o of oscillators) {
        try {
          o.stop();
        } catch {
          /* noop */
        }
      }
    },
  };
}

const starters: Record<BgmTrackId, (ctx: AudioContext, m: GainNode) => ActiveBgm> = {
  study: startStudyPad,
  field: startFieldMarch,
  battle: startBattleLoop,
  triumph: startTriumph,
};

export function createBgmEngine(id: BgmTrackId, ctx: AudioContext, master: GainNode): ActiveBgm {
  return starters[id](ctx, master);
}

export function createFreshAudioContext(): AudioContext | null {
  const Ctor = getAudioContextCtor();
  if (!Ctor) return null;
  return new Ctor();
}
