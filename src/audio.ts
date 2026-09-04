export class Foley {
  private ctx: AudioContext | null = null;

  constructor() {
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) this.resume();
    });
    window.addEventListener("focus", () => this.resume());
  }

  resume() {
    this.audio();
  }

  private audio(): AudioContext | null {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!this.ctx) this.ctx = new AC();
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private blip(freq: number, dur: number, type: OscillatorType, gain: number) {
    const ctx = this.audio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }

  tick() {
    this.blip(420, 0.06, "square", 0.04);
  }

  thud(mass = 1) {
    this.blip(90 / Math.max(0.5, mass), 0.14, "sine", 0.07 * Math.min(2, mass));
  }

  slosh() {
    this.blip(180, 0.12, "triangle", 0.05);
    this.blip(90, 0.18, "sine", 0.03);
  }

  zap() {
    this.blip(1400, 0.04, "square", 0.08);
    this.blip(220, 0.12, "sawtooth", 0.05);
  }

  surgeRise(dur = 1.2) {
    const ctx = this.audio();
    if (!ctx) return;

    // 1. Rising mains hum (60Hz -> 240Hz) with over-voltage growl
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(60, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + dur);

    // Filter to warm up the buzz
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(300, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + dur);

    g.gain.setValueAtTime(0.04, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.12, ctx.currentTime + dur * 0.8);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);

    osc.connect(filter);
    filter.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);

    // 2. High-frequency electrical jitter / arcing sizzle
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 35; // 35Hz stutter
    lfoGain.gain.value = 40;
    lfo.connect(osc.frequency);
    lfo.start();
    lfo.stop(ctx.currentTime + dur);
  }

  bulbBurst() {
    const ctx = this.audio();
    if (!ctx) return;

    // 1. Loud explosive glass POP transient
    this.blip(3200, 0.015, "square", 0.18);
    this.blip(950, 0.03, "triangle", 0.15);
    this.blip(180, 0.06, "sine", 0.12);

    // 2. High-frequency glass shatter noise
    const bufferSize = Math.floor(ctx.sampleRate * 0.25);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.035));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.setValueAtTime(2800, ctx.currentTime);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.16, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

    noise.connect(highpass);
    highpass.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start();

    // 3. Filament fizzle spark
    this.blip(4500, 0.08, "sawtooth", 0.06);
  }

  shatter(speed = 1.0) {
    const ctx = this.audio();
    if (!ctx) return;

    // High crash noise burst + resonant ceramic ring
    const bufferSize = Math.floor(ctx.sampleRate * 0.35);
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

  breakerPop() {
    const ctx = this.audio();
    if (!ctx) return;

    // 1. Loud mechanical snap / pop
    this.blip(2400, 0.02, "square", 0.15);
    this.blip(450, 0.04, "triangle", 0.12);
    this.blip(80, 0.09, "sine", 0.14);

    // 2. Electrical arc sizzle
    const bufferSize = Math.floor(ctx.sampleRate * 0.2);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.04));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1600, ctx.currentTime);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start();

    // 3. Power-down spin-down hum drop
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(120, ctx.currentTime + 0.03);
    osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.45);
    g.gain.setValueAtTime(0.08, ctx.currentTime + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(ctx.currentTime + 0.03);
    osc.stop(ctx.currentTime + 0.46);
  }

  clink() {
    this.blip(720, 0.08, "triangle", 0.045);
  }

  grind() {
    this.blip(70, 0.35, "sawtooth", 0.035);
  }

  paper() {
    this.blip(900, 0.05, "triangle", 0.02);
  }

  scream() {
    this.blip(140, 0.5, "sawtooth", 0.06);
    this.blip(55, 0.7, "square", 0.04);
  }

  plant() {
    this.blip(220, 0.1, "triangle", 0.04);
  }
}
