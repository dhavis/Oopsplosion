export class CupAudio {
  private ctx: AudioContext | null = null;
  private lastPourSound = 0;
  private lastClatterSound = 0;

  private getContext(): AudioContext | null {
    if (!this.ctx && typeof AudioContext !== "undefined") {
      this.ctx = new AudioContext();
    }
    if (this.ctx?.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  resume() {
    this.getContext();
  }

  playPour(flowRate: number) {
    const now = performance.now();
    if (now - this.lastPourSound < 90) return;
    this.lastPourSound = now;

    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sine";
    osc.frequency.setValueAtTime(320 + Math.random() * 80, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180 + Math.random() * 40, ctx.currentTime + 0.08);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(700, ctx.currentTime);

    const volume = Math.min(0.28, (flowRate / 240) * 0.28);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  }

  playClatter(speed: number) {
    const now = performance.now();
    if (now - this.lastClatterSound < 100) return;
    this.lastClatterSound = now;

    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(440 + Math.random() * 120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.06);

    const vol = Math.min(0.4, speed * 0.15);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  }

  playShatter(speed: number) {
    const ctx = this.getContext();
    if (!ctx) return;

    // High crash noise burst + resonant ceramic ring
    const bufferSize = ctx.sampleRate * 0.35;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.06));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(1800, ctx.currentTime);

    const noiseGain = ctx.createGain();
    const vol = Math.min(0.7, 0.3 + speed * 0.08);
    noiseGain.gain.setValueAtTime(vol, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.start();

    // Resonant ceramic shard ping
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1250, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.25);

    oscGain.gain.setValueAtTime(vol * 0.6, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.26);
  }
}
