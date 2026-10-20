/* 用 Web Audio 现场合成的小音效，无需音频文件。iPhone 静音键打开时不会出声。 */
(function () {
  let ctx = null;
  const on = () => window.Store && Store.state.settings.sound;
  function ac() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function noiseBuf(c, secs) {
    const b = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * secs)), c.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function burst(c, t, dur, freq, q, gain, type) {
    const src = c.createBufferSource();
    src.buffer = noiseBuf(c, dur);
    const f = c.createBiquadFilter();
    f.type = type || 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.01, dur / 4));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(c.destination);
    src.start(t); src.stop(t + dur + 0.02);
  }
  function tone(c, t, f0, f1, dur, gain, type) {
    const o = c.createOscillator(); o.type = type || 'sine';
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
  }

  const Sound = {
    unlock() { if (on()) ac(); },
    rip(len) {
      if (!on()) return; const c = ac(); if (!c) return;
      const t = c.currentTime; const n = Math.floor((len || 0.45) * 60);
      for (let i = 0; i < n; i++) burst(c, t + i * 0.008 + Math.random() * 0.006, 0.03, 1800 + Math.random() * 2400, 1.2, 0.18 + Math.random() * 0.12);
    },
    crumple() {
      if (!on()) return; const c = ac(); if (!c) return;
      const t = c.currentTime;
      for (let i = 0; i < 26; i++) burst(c, t + i * 0.035 + Math.random() * 0.03, 0.05 + Math.random() * 0.05, 900 + Math.random() * 3000, 0.8, 0.12 + Math.random() * 0.15);
    },
    thud() {
      if (!on()) return; const c = ac(); if (!c) return;
      const t = c.currentTime; tone(c, t, 180, 60, 0.25, 0.4, 'sine'); burst(c, t, 0.12, 400, 0.7, 0.2, 'lowpass');
    },
    whoosh(dur) {
      if (!on()) return; const c = ac(); if (!c) return;
      const t = c.currentTime; dur = dur || 1.2;
      const src = c.createBufferSource(); src.buffer = noiseBuf(c, dur);
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2;
      f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(2200, t + dur * 0.5); f.frequency.exponentialRampToValueAtTime(600, t + dur);
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + dur * 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f); f.connect(g); g.connect(c.destination); src.start(t); src.stop(t + dur);
    },
    fire(dur) {
      if (!on()) return; const c = ac(); if (!c) return;
      const t = c.currentTime; dur = dur || 3;
      const src = c.createBufferSource(); src.buffer = noiseBuf(c, dur);
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700;
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.5); g.gain.setValueAtTime(0.22, t + dur - 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f); f.connect(g); g.connect(c.destination); src.start(t); src.stop(t + dur);
      for (let i = 0; i < dur * 14; i++) burst(c, t + Math.random() * dur, 0.015, 2500 + Math.random() * 3000, 2, 0.1 + Math.random() * 0.25, 'highpass');
    },
    pop() {
      if (!on()) return; const c = ac(); if (!c) return;
      tone(c, c.currentTime, 520, 880, 0.12, 0.2, 'triangle');
    },
    crunch() {
      if (!on()) return; const c = ac(); if (!c) return;
      const t = c.currentTime;
      for (let i = 0; i < 6; i++) burst(c, t + i * 0.32 + Math.random() * 0.05, 0.08, 1200 + Math.random() * 1500, 1, 0.22);
    },
    bark() {
      if (!on()) return; const c = ac(); if (!c) return;
      const t = c.currentTime;
      [0, 0.22].forEach((d) => { tone(c, t + d, 420, 260, 0.13, 0.28, 'sawtooth'); burst(c, t + d, 0.1, 900, 1.5, 0.12); });
    },
    splash() {
      if (!on()) return; const c = ac(); if (!c) return;
      const t = c.currentTime;
      for (let i = 0; i < 8; i++) tone(c, t + i * 0.05, 600 + Math.random() * 600, 1400 + Math.random() * 800, 0.08, 0.06, 'sine');
    }
  };
  window.Sound = Sound;
})();
