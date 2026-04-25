/**
 * 正誤フィードバック用の短い効果音（Web Audio API）
 */
const SFX_BASE = 0.11;

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
  master.gain.value = SFX_BASE;
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
