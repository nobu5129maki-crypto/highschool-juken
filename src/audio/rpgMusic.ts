/**
 * RPGバトル向け BGM（Web Audio API で合成・外部ファイル不要）
 * マイナー寄りの緊張感＋ドライブするベース・キック・シンセアルペジオ
 */

const BPM = 112;
const MASTER = 0.11;

export class RpgBattleMusic {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private running = false;
  private oscillators: OscillatorNode[] = [];
  private arpInterval: ReturnType<typeof setInterval> | null = null;
  private kickInterval: ReturnType<typeof setInterval> | null = null;
  private arpOsc: OscillatorNode | null = null;

  /** ブラウザの自動再生制限を越えるには、ユーザー操作のコールバック内で呼ぶ */
  async start(): Promise<void> {
    if (this.running) return;

    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;

    this.ctx = new Ctx();
    await this.ctx.resume();

    this.master = this.ctx.createGain();
    this.master.gain.value = MASTER;
    this.master.connect(this.ctx.destination);

    const t = this.ctx.currentTime;

    // サブベース
    const sub = this.ctx.createOscillator();
    sub.type = 'triangle';
    sub.frequency.setValueAtTime(55, t);
    const subG = this.ctx.createGain();
    subG.gain.value = 0.4;
    sub.connect(subG);
    subG.connect(this.master);
    sub.start(t);
    this.oscillators.push(sub);

    // ベース（矩形→ローパスで角を取る）
    const bass = this.ctx.createOscillator();
    bass.type = 'square';
    bass.frequency.setValueAtTime(110, t);
    const bassFilter = this.ctx.createBiquadFilter();
    bassFilter.type = 'lowpass';
    bassFilter.frequency.value = 400;
    const bassG = this.ctx.createGain();
    bassG.gain.value = 0.055;
    bass.connect(bassFilter);
    bassFilter.connect(bassG);
    bassG.connect(this.master);
    bass.start(t);
    this.oscillators.push(bass);

    // パッド（Am系）
    const padFreqs = [110, 164.81, 220, 277.18];
    padFreqs.forEach((freq, i) => {
      const o = this.ctx!.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, t);
      const g = this.ctx!.createGain();
      g.gain.value = 0.042 + i * 0.007;
      o.connect(g);
      g.connect(this.master!);
      o.start(t);
      this.oscillators.push(o);
    });

    // アルペジオ
    const arp = this.ctx.createOscillator();
    arp.type = 'triangle';
    this.arpOsc = arp;
    const arpFilter = this.ctx.createBiquadFilter();
    arpFilter.type = 'lowpass';
    arpFilter.frequency.value = 2600;
    const arpG = this.ctx.createGain();
    arpG.gain.value = 0.065;
    arp.connect(arpFilter);
    arpFilter.connect(arpG);
    arpG.connect(this.master);
    arp.frequency.setValueAtTime(220, t);
    arp.start(t);
    this.oscillators.push(arp);

    const eighth = (60 / BPM / 2) * 1000;
    const pattern = [220, 246.94, 261.63, 293.66, 329.63, 293.66, 261.63, 246.94];
    let step = 0;
    this.arpInterval = setInterval(() => {
      if (!this.ctx || !this.arpOsc) return;
      const f = pattern[step % pattern.length];
      const ct = this.ctx.currentTime;
      this.arpOsc.frequency.exponentialRampToValueAtTime(Math.max(80, f), ct + 0.035);
      step++;
    }, eighth);

    // キック風パルス
    this.kickInterval = setInterval(() => {
      if (!this.ctx || !this.master) return;
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      const g = this.ctx.createGain();
      const now = this.ctx.currentTime;
      o.frequency.setValueAtTime(145, now);
      o.frequency.exponentialRampToValueAtTime(42, now + 0.09);
      g.gain.setValueAtTime(0.32, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      o.connect(g);
      g.connect(this.master);
      o.start(now);
      o.stop(now + 0.14);
    }, (60 / BPM) * 1000);

    this.running = true;
  }

  stop(): void {
    if (this.arpInterval) {
      clearInterval(this.arpInterval);
      this.arpInterval = null;
    }
    if (this.kickInterval) {
      clearInterval(this.kickInterval);
      this.kickInterval = null;
    }

    for (const o of this.oscillators) {
      try {
        o.stop();
      } catch {
        /* already stopped */
      }
    }
    this.oscillators = [];
    this.arpOsc = null;
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
    this.master = null;
    this.running = false;
  }

  setMuted(muted: boolean): void {
    if (!this.master || !this.ctx) return;
    const g = muted ? 0 : MASTER;
    this.master.gain.setTargetAtTime(g, this.ctx.currentTime, 0.05);
  }

  isRunning(): boolean {
    return this.running;
  }
}

let singleton: RpgBattleMusic | null = null;

export function getBattleMusic(): RpgBattleMusic {
  if (!singleton) singleton = new RpgBattleMusic();
  return singleton;
}

const SFX_MASTER = 0.11;

export function playCorrectSfx(): void {
  playChime([523.25, 659.25, 783.99], 0.055);
}

export function playWrongSfx(): void {
  playChime([392, 311.13], 0.09);
}

function playChime(freqs: number[], stepSec: number): void {
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  void ctx.resume();
  const master = ctx.createGain();
  master.gain.value = SFX_MASTER;
  master.connect(ctx.destination);

  let t = ctx.currentTime;
  for (const f of freqs) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.42, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + stepSec * 2.2);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + stepSec * 2.5);
    t += stepSec;
  }
  const dur = (t - ctx.currentTime + 0.35) * 1000;
  setTimeout(() => void ctx.close(), Math.max(200, dur));
}
