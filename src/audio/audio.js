// Tout le son est synthétisé à la volée (Web Audio) : aucun fichier audio, donc aucun droit à gérer.

const SCALE = [0, 2, 3, 5, 7, 9, 10, 12, 14, 15]; // mode de ré (dorien), celui des estampies
const THEME = [
  [7, 7, 9, 10, 9, 7, 5, 3], [5, 7, 3, 5, 2, 3, 0, 0], [7, 9, 10, 12, 10, 9, 7, 5], [3, 5, 7, 5, 3, 2, 0, 0],
];

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = { sfx: false, music: false };
    this.musicOn = false;
    this.next = 0;
    this.step = 0;
    this.tempo = 96;
    this.last = new Map();
    this.timer = null;
  }

  unlock() {
    if (!this.ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createDynamicsCompressor();
      this.master.connect(this.ctx.destination);
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = this.muted.sfx ? 0 : 0.8;
      this.sfxBus.connect(this.master);
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = this.muted.music ? 0 : 0.34;
      this.musicBus.connect(this.master);
      const len = this.ctx.sampleRate;
      this.noise = this.ctx.createBuffer(1, len, len);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (this.musicOn && !this.timer) this.startScheduler();
  }

  setMuted(kind, value) {
    this.muted[kind] = value;
    if (!this.ctx) return;
    if (kind === 'sfx') this.sfxBus.gain.value = value ? 0 : 0.8;
    if (kind === 'music') this.musicBus.gain.value = value ? 0 : 0.34;
  }

  tone({ freq, to, dur = 0.2, type = 'sine', gain = 0.3, attack = 0.005, at = 0, bus }) {
    const c = this.ctx;
    const t = c.currentTime + at;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(bus || this.sfxBus);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  burstNoise({ dur = 0.15, gain = 0.3, filter = 'bandpass', freq = 1500, to, q = 1, at = 0 }) {
    const c = this.ctx;
    const t = c.currentTime + at;
    const s = c.createBufferSource();
    s.buffer = this.noise;
    s.loop = true;
    s.loopStart = Math.random() * 0.5;
    const f = c.createBiquadFilter();
    f.type = filter;
    f.frequency.setValueAtTime(freq, t);
    if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
    f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(this.sfxBus);
    s.start(t);
    s.stop(t + dur + 0.05);
  }

  // Un son identique répété dans le même instant se fond : on le limite pour éviter la saturation.
  play(name) {
    if (!this.ctx || this.muted.sfx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const gap = { hit: 0.06, arrow: 0.07, poof: 0.05, pop: 0.06, fire: 0.08 }[name] || 0.02;
    if (now - (this.last.get(name) || -1) < gap) return;
    this.last.set(name, now);
    const fn = SFX[name];
    if (fn) fn(this);
  }

  // --- Musique : bourdon de quinte et mélodie de psaltérion, ordonnancées à l'avance ---

  startMusic(tempo = 96) {
    this.tempo = tempo;
    this.musicOn = true;
    this.step = 0;
    if (this.ctx && !this.timer) this.startScheduler();
  }

  setTempo(tempo) {
    this.tempo = tempo;
  }

  stopMusic() {
    this.musicOn = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  startScheduler() {
    this.next = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.schedule(), 100);
  }

  schedule() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    if (this.next < this.ctx.currentTime) this.next = this.ctx.currentTime + 0.05;
    while (this.next < this.ctx.currentTime + 0.3) {
      this.note(this.step, this.next - this.ctx.currentTime);
      this.next += 60 / this.tempo / 2;
      this.step = (this.step + 1) % 64;
    }
  }

  note(step, at) {
    const base = 146.83; // ré
    const midi = (semi) => base * 2 ** (semi / 12);
    const bus = this.musicBus;
    if (step % 16 === 0) {
      this.tone({ freq: base / 2, dur: 3.6, type: 'triangle', gain: 0.16, attack: 0.4, at, bus });
      this.tone({ freq: midi(7) / 2, dur: 3.6, type: 'triangle', gain: 0.1, attack: 0.5, at, bus });
    }
    const phrase = THEME[Math.floor(step / 16) % THEME.length];
    if (step % 2 === 0) {
      const semi = phrase[(step / 2) % 8];
      this.tone({ freq: midi(semi) * 2, dur: 0.5, type: 'triangle', gain: 0.17, at, bus });
      this.tone({ freq: midi(semi) * 4, dur: 0.25, type: 'sine', gain: 0.05, at, bus });
    } else if (step % 8 === 7) {
      const semi = SCALE[(step * 3) % SCALE.length];
      this.tone({ freq: midi(semi) * 2, dur: 0.22, type: 'triangle', gain: 0.1, at, bus });
    }
    if (step % 4 === 0) this.tone({ freq: 110, to: 60, dur: 0.14, type: 'sine', gain: step % 8 === 0 ? 0.24 : 0.12, at, bus });
    if (step % 4 === 2) this.tone({ freq: 2400, to: 1800, dur: 0.05, type: 'square', gain: 0.012, at, bus });
  }
}

const SFX = {
  deploy: (a) => {
    a.burstNoise({ dur: 0.1, gain: 0.16, freq: 3800, to: 1800, q: 2 });
    a.tone({ freq: 587, dur: 0.22, type: 'triangle', gain: 0.2 });
    a.tone({ freq: 880, dur: 0.2, type: 'triangle', gain: 0.12, at: 0.05 });
  },
  hit: (a) => {
    a.burstNoise({ dur: 0.06, gain: 0.2, freq: 2600, q: 3 });
    a.tone({ freq: 240, to: 120, dur: 0.07, type: 'square', gain: 0.05 });
  },
  heavy: (a) => {
    a.tone({ freq: 150, to: 45, dur: 0.24, type: 'sawtooth', gain: 0.3 });
    a.burstNoise({ dur: 0.18, gain: 0.3, filter: 'lowpass', freq: 1500 });
  },
  arrow: (a) => a.burstNoise({ dur: 0.1, gain: 0.08, freq: 3000, to: 900, q: 4 }),
  fire: (a) => a.burstNoise({ dur: 0.22, gain: 0.14, filter: 'lowpass', freq: 900, to: 300 }),
  pop: (a) => {
    a.tone({ freq: 620, to: 180, dur: 0.12, type: 'sine', gain: 0.2 });
    a.burstNoise({ dur: 0.1, gain: 0.12, filter: 'lowpass', freq: 1800 });
  },
  poof: (a) => a.burstNoise({ dur: 0.16, gain: 0.1, filter: 'lowpass', freq: 800, to: 200 }),
  boom: (a) => {
    a.tone({ freq: 120, to: 30, dur: 0.5, type: 'sine', gain: 0.55 });
    a.burstNoise({ dur: 0.45, gain: 0.42, filter: 'lowpass', freq: 1600, to: 180 });
  },
  volley: (a) => {
    for (let i = 0; i < 4; i++) a.burstNoise({ dur: 0.12, gain: 0.1, freq: 2400 + i * 300, to: 800, q: 3, at: i * 0.03 });
  },
  thunder: (a) => {
    a.burstNoise({ dur: 0.1, gain: 0.45, filter: 'highpass', freq: 2200 });
    a.tone({ freq: 90, to: 30, dur: 0.7, type: 'sawtooth', gain: 0.32 });
    a.burstNoise({ dur: 0.7, gain: 0.24, filter: 'lowpass', freq: 500, to: 100, at: 0.04 });
  },
  splat: (a) => {
    a.tone({ freq: 320, to: 70, dur: 0.24, type: 'sine', gain: 0.32 });
    a.burstNoise({ dur: 0.2, gain: 0.14, filter: 'lowpass', freq: 700 });
  },
  bell: (a) => {
    for (const [m, g, d] of [[1, 0.26, 1.4], [2.01, 0.12, 1], [2.76, 0.08, 0.8], [4.1, 0.04, 0.5]]) {
      a.tone({ freq: 392 * m, dur: d, type: 'sine', gain: g });
    }
  },
  grave: (a) => {
    a.tone({ freq: 196, dur: 0.9, type: 'sawtooth', gain: 0.1, attack: 0.1 });
    a.tone({ freq: 233, dur: 0.9, type: 'sawtooth', gain: 0.08, attack: 0.1 });
    a.burstNoise({ dur: 0.5, gain: 0.12, filter: 'lowpass', freq: 400 });
  },
  cast: (a) => a.burstNoise({ dur: 0.25, gain: 0.12, freq: 600, to: 2400, q: 2 }),
  charge: (a) => {
    a.tone({ freq: 392, to: 523, dur: 0.14, type: 'sawtooth', gain: 0.08 });
    a.tone({ freq: 523, to: 784, dur: 0.18, type: 'sawtooth', gain: 0.08, at: 0.12 });
  },
  crumble: (a) => a.burstNoise({ dur: 0.4, gain: 0.26, filter: 'lowpass', freq: 700, to: 150 }),
  towerfall: (a) => {
    a.tone({ freq: 80, to: 22, dur: 1, type: 'sine', gain: 0.65 });
    a.burstNoise({ dur: 1, gain: 0.48, filter: 'lowpass', freq: 1200, to: 100 });
    for (const [m, g] of [[1, 0.2], [1.5, 0.12], [2.01, 0.08]]) a.tone({ freq: 196 * m, dur: 1.8, gain: g, at: 0.12 });
  },
  tick: (a) => a.tone({ freq: 1320, dur: 0.05, type: 'square', gain: 0.05 }),
  refuse: (a) => {
    a.tone({ freq: 196, dur: 0.12, type: 'square', gain: 0.07 });
    a.tone({ freq: 165, dur: 0.14, type: 'square', gain: 0.07, at: 0.08 });
  },
  pick: (a) => a.tone({ freq: 784, dur: 0.07, type: 'triangle', gain: 0.14 }),
  click: (a) => a.tone({ freq: 523, dur: 0.06, type: 'triangle', gain: 0.14 }),
  double: (a) => [587, 698, 880, 1175].forEach((f, i) => a.tone({ freq: f, dur: 0.28, type: 'triangle', gain: 0.17, at: i * 0.1 })),
  win: (a) => [[587, 0], [740, 0.16], [880, 0.32], [1175, 0.5], [880, 0.72], [1175, 0.88]].forEach(([f, at]) => {
    a.tone({ freq: f, dur: 0.5, type: 'sawtooth', gain: 0.1, at });
    a.tone({ freq: f / 2, dur: 0.5, type: 'triangle', gain: 0.18, at });
  }),
  lose: (a) => [[440, 0], [392, 0.3], [349, 0.6], [294, 0.95]].forEach(([f, at]) => {
    a.tone({ freq: f, dur: 0.7, type: 'triangle', gain: 0.18, at });
  }),
  crown: (a) => [880, 1175, 1760].forEach((f, i) => a.tone({ freq: f, dur: 0.5, type: 'sine', gain: 0.16, at: i * 0.08 })),
};
