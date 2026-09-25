(function (H) {
  let ctx = null;
  function ac() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type, vol, slide, delay) {
    const s = H.Save.data.settings;
    if (!s.sfx) return;
    const c = ac(); if (!c) return;
    const t = c.currentTime + (delay || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
    const v = (vol || 0.2) * s.volume;
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, delay) {
    const s = H.Save.data.settings;
    if (!s.sfx) return;
    const c = ac(); if (!c) return;
    const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = c.createBufferSource(), g = c.createGain();
    src.buffer = buf; g.gain.value = (vol || 0.2) * s.volume;
    src.connect(g); g.connect(c.destination);
    src.start(c.currentTime + (delay || 0));
  }
  H.Sound = {
    unlock() { ac(); },
    context() { return ac(); },
    click() { tone(660, 0.06, 'square', 0.15); },
    energy() { tone(880, 0.08, 'triangle', 0.25); tone(1320, 0.12, 'triangle', 0.22, null, 0.07); },
    buy() { tone(440, 0.08, 'square', 0.18); tone(660, 0.08, 'square', 0.18, null, 0.07); tone(880, 0.1, 'square', 0.18, null, 0.14); },
    place() { tone(180, 0.12, 'square', 0.25, 90); noise(0.06, 0.1); },
    laser() { tone(1400, 0.12, 'sawtooth', 0.12, 300); },
    plasma() { tone(300, 0.25, 'sine', 0.25, 90); tone(600, 0.2, 'triangle', 0.1, 200); },
    pistol() { tone(900, 0.07, 'square', 0.1, 400); },
    hit() { noise(0.05, 0.12); tone(200, 0.05, 'square', 0.08, 100); },
    kill() { tone(400, 0.18, 'square', 0.14, 60); noise(0.12, 0.12); },
    explode() { noise(0.35, 0.3); tone(120, 0.3, 'sawtooth', 0.2, 30); },
    wave() { tone(330, 0.15, 'square', 0.15); tone(440, 0.15, 'square', 0.15, null, 0.15); tone(550, 0.2, 'square', 0.15, null, 0.3); },
    boss() { for (let i = 0; i < 6; i++) tone(i % 2 ? 220 : 165, 0.22, 'sawtooth', 0.22, null, i * 0.24); },
    heal() { tone(600, 0.1, 'sine', 0.15); tone(900, 0.15, 'sine', 0.15, null, 0.08); },
    zap() { tone(1200, 0.15, 'sawtooth', 0.15, 200); noise(0.1, 0.1); },
    victory() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'square', 0.2, null, i * 0.16)); },
    defeat() { [400, 330, 262, 196].forEach((f, i) => tone(f, 0.3, 'sawtooth', 0.2, null, i * 0.2)); },
    deny() { tone(150, 0.12, 'square', 0.15); }
  };
})(window.HVA);
