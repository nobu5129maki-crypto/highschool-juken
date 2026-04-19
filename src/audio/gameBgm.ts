import {
  BGM_TRACK_LEVEL,
  type ActiveBgm,
  type BgmTrackId,
  createBgmEngine,
  createFreshAudioContext,
} from './bgmTracks';

/**
 * 単一 AudioContext で BGM を切り替え、音量・ミュートを集中管理する
 */
export class GameBgmController {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private active: ActiveBgm | null = null;
  private trackId: BgmTrackId | null = null;
  private volume = 0.55;
  private muted = false;
  private started = false;

  isRunning(): boolean {
    return this.started && this.ctx != null && this.ctx.state === 'running';
  }

  getTrackId(): BgmTrackId | null {
    return this.trackId;
  }

  getVolume(): number {
    return this.volume;
  }

  setVolume(v: number): void {
    this.volume = Math.min(1, Math.max(0, v));
    this.applyMasterGain();
  }

  setMuted(m: boolean): void {
    this.muted = m;
    this.applyMasterGain();
  }

  getMuted(): boolean {
    return this.muted;
  }

  private applyMasterGain(): void {
    if (!this.master || !this.ctx || !this.trackId) return;
    const level = BGM_TRACK_LEVEL[this.trackId];
    const g = this.muted ? 0 : level * this.volume;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(g, t, 0.04);
  }

  /** ユーザー操作後に呼ぶ。指定トラックで再生開始 */
  async start(trackId: BgmTrackId): Promise<void> {
    if (!this.ctx) {
      const ctx = createFreshAudioContext();
      if (!ctx) return;
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(ctx.destination);
    }

    await this.ctx.resume();

    if (this.active) {
      this.active.stop();
      this.active = null;
    }

    if (!this.master) return;

    this.trackId = trackId;
    this.active = createBgmEngine(trackId, this.ctx, this.master);
    this.started = true;
    this.applyMasterGain();
  }

  /** 再生中ならトラックだけ差し替え（AudioContext は維持） */
  async switchTrack(trackId: BgmTrackId): Promise<void> {
    if (!this.ctx || !this.master) {
      await this.start(trackId);
      return;
    }
    if (this.trackId === trackId && this.active) {
      this.applyMasterGain();
      return;
    }
    await this.ctx.resume();
    if (this.active) {
      this.active.stop();
      this.active = null;
    }
    this.trackId = trackId;
    this.active = createBgmEngine(trackId, this.ctx, this.master);
    this.applyMasterGain();
  }

  stop(): void {
    if (this.active) {
      this.active.stop();
      this.active = null;
    }
    this.trackId = null;
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
    this.master = null;
    this.started = false;
  }
}

let singleton: GameBgmController | null = null;

export function getGameBgm(): GameBgmController {
  if (!singleton) singleton = new GameBgmController();
  return singleton;
}
