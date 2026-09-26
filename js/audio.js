(function (H) {
  let ctx = null, bus = null, rev = null, nbuf = null;
  const last = {};
  const r = (a, b) => a + Math.random() * (b - a);

  function ac() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function setup(c) {
    if (bus) return;
    bus = c.createGain();
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 6; comp.attack.value = 0.002; comp.release.value = 0.12;
    bus.connect(comp); comp.connect(c.destination);
    const len = Math.floor(c.sampleRate * 1.5), ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    const conv = c.createConvolver(); conv.buffer = ir;
    rev = c.createGain(); rev.gain.value = 1;
    const rg = c.createGain(); rg.gain.value = 0.4;
    rev.connect(conv); conv.connect(rg); rg.connect(bus);
    nbuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const nd = nbuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  }
  const on = () => { const s = H.Save.data.settings; return s.sfx ? s : null; };
  function gate(name, ms) { const n = performance.now(); if (last[name] && n - last[name] < ms) return false; last[name] = n; return true; }

  function out(c, node, vol, pan, wet) {
    const g = c.createGain(); g.gain.value = vol * H.Save.data.settings.volume;
    node.connect(g);
    let end = g;
    if (pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; g.connect(p); end = p; }
    end.connect(bus);
    if (wet) { const w = c.createGain(); w.gain.value = wet; end.connect(w); w.connect(rev); }
  }
  function filt(c, t, d, fl, node) {
    const f = c.createBiquadFilter();
    f.type = fl.type; f.frequency.setValueAtTime(fl.f, t); if (fl.to) f.frequency.exponentialRampToValueAtTime(Math.max(30, fl.to), t + d);
    f.Q.value = fl.q || 1; node.connect(f); return f;
  }
  function voice(o) {
    if (!on()) return;
    const c = ac(); if (!c) return; setup(c);
    const t = c.currentTime + (o.dl || 0), a = o.a || 0.004, d = o.d;
    const osc = c.createOscillator();
    osc.type = o.t || 'square';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + d);
    if (o.det) osc.detune.value = o.det;
    if (o.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = o.vib.r; lg.gain.value = o.vib.d; l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + d + 0.05); }
    const env = c.createGain();
    env.gain.setValueAtTime(0.0001, t); env.gain.exponentialRampToValueAtTime(1, t + a); env.gain.exponentialRampToValueAtTime(0.0001, t + d);
    osc.connect(env);
    let node = env;
    if (o.fl) node = filt(c, t, d, o.fl, node);
    out(c, node, o.v || 0.2, o.pan, o.wet);
    osc.start(t); osc.stop(t + d + 0.05);
  }
  function nz(o) {
    if (!on()) return;
    const c = ac(); if (!c) return; setup(c);
    const t = c.currentTime + (o.dl || 0), a = o.a || 0.002, d = o.d;
    const src = c.createBufferSource(); src.buffer = nbuf; src.loop = true;
    const env = c.createGain();
    env.gain.setValueAtTime(0.0001, t); env.gain.exponentialRampToValueAtTime(1, t + a); env.gain.exponentialRampToValueAtTime(0.0001, t + d);
    src.connect(env);
    let node = env;
    if (o.fl) node = filt(c, t, d, o.fl, node);
    out(c, node, o.v || 0.2, o.pan, o.wet);
    src.start(t, Math.random() * 0.5); src.stop(t + d + 0.05);
  }

  const PENTA = [880, 988, 1175, 1319, 1568, 1760];

  H.Sound = {
    unlock() { ac(); },
    context() { return ac(); },
    click() { nz({ d: 0.02, v: 0.1, fl: { type: 'highpass', f: 3000 } }); voice({ t: 'sine', f: 1300, to: 800, d: 0.05, v: 0.1 }); },
    energy() {
      const f = PENTA[Math.floor(Math.random() * 3)];
      voice({ t: 'triangle', f, d: 0.18, v: 0.16, wet: 0.5 });
      voice({ t: 'sine', f: f * 1.5, d: 0.22, v: 0.1, dl: 0.06, wet: 0.5 });
      voice({ t: 'sine', f: f * 2, d: 0.28, v: 0.08, dl: 0.12, wet: 0.6 });
      nz({ d: 0.12, v: 0.03, dl: 0.02, fl: { type: 'highpass', f: 6000 } });
    },
    buy() {
      voice({ t: 'square', f: 988, d: 0.06, v: 0.09 });
      voice({ t: 'square', f: 1319, d: 0.4, v: 0.11, dl: 0.06, wet: 0.4 });
      voice({ t: 'sine', f: 2637, d: 0.45, v: 0.06, dl: 0.06, wet: 0.5 });
    },
    place() {
      voice({ t: 'sine', f: 160, to: 45, d: 0.18, v: 0.4 });
      nz({ d: 0.09, v: 0.16, fl: { type: 'lowpass', f: 900 } });
      voice({ t: 'triangle', f: 420, to: 300, d: 0.12, v: 0.06, dl: 0.01, wet: 0.3 });
    },
    laser() {
      if (!gate('laser', 30)) return;
      voice({ t: 'sawtooth', f: r(1900, 2300), to: 350, d: 0.13, v: 0.09, fl: { type: 'bandpass', f: 2500, to: 600, q: 4 }, pan: r(-0.2, 0.2) });
      voice({ t: 'sine', f: 3200, to: 900, d: 0.08, v: 0.05 });
    },
    plasma() {
      voice({ t: 'sine', f: 260, to: 55, d: 0.34, v: 0.3, wet: 0.3 });
      voice({ t: 'sawtooth', f: 190, to: 70, d: 0.28, v: 0.09, det: r(-12, 12), fl: { type: 'lowpass', f: 800 } });
      nz({ d: 0.3, v: 0.1, fl: { type: 'bandpass', f: 900, to: 200, q: 1.5 }, wet: 0.3 });
    },
    pistol() {
      if (!gate('pistol', 25)) return;
      nz({ d: 0.035, v: 0.17, fl: { type: 'highpass', f: 1800 }, pan: r(-0.15, 0.15) });
      voice({ t: 'square', f: r(700, 900), to: 200, d: 0.06, v: 0.07 });
    },
    hit() {
      if (!gate('hit', 25)) return;
      nz({ d: 0.05, v: 0.12, fl: { type: 'bandpass', f: r(700, 1400), q: 2 }, pan: r(-0.3, 0.3) });
      voice({ t: 'sine', f: r(150, 220), to: 80, d: 0.06, v: 0.1 });
    },
    kill() {
      if (!gate('kill', 40)) return;
      voice({ t: 'square', f: 520, to: 70, d: 0.28, v: 0.11, vib: { r: 30, d: 40 } });
      nz({ d: 0.18, v: 0.15, fl: { type: 'lowpass', f: 3000, to: 300 } });
      voice({ t: 'sine', f: 120, to: 40, d: 0.22, v: 0.2, wet: 0.25 });
    },
    explode() {
      if (!gate('explode', 60)) return;
      nz({ d: 0.7, v: 0.5, fl: { type: 'lowpass', f: 2400, to: 60, q: 0.7 }, wet: 0.5 });
      voice({ t: 'sine', f: 100, to: 28, d: 0.6, v: 0.55 });
      nz({ d: 0.3, v: 0.16, dl: 0.05, fl: { type: 'bandpass', f: 5000, to: 800 } });
    },
    wave() {
      [[196, 0], [293, 0.18], [392, 0.36]].forEach(([f, dl]) => {
        voice({ t: 'sawtooth', f, d: dl === 0.36 ? 0.8 : 0.5, dl, a: 0.03, v: 0.12, fl: { type: 'lowpass', f: 1300 }, wet: 0.35 });
        voice({ t: 'sawtooth', f: f * 1.005, d: dl === 0.36 ? 0.8 : 0.5, dl, a: 0.03, v: 0.08, fl: { type: 'lowpass', f: 1300 } });
      });
    },
    boss() {
      voice({ t: 'sawtooth', f: 55, d: 1.9, a: 0.3, v: 0.32, fl: { type: 'lowpass', f: 320, to: 150 }, wet: 0.3 });
      voice({ t: 'sawtooth', f: 82.4, d: 1.9, a: 0.3, v: 0.2, det: 8, fl: { type: 'lowpass', f: 320, to: 150 } });
      nz({ d: 1.7, v: 0.18, a: 0.4, fl: { type: 'lowpass', f: 220 } });
      [0.2, 0.75, 1.3].forEach((dl, i) => voice({ t: 'sawtooth', f: i === 2 ? 130.8 : 110, d: 0.5, dl, a: 0.02, v: 0.16, fl: { type: 'lowpass', f: 700 }, wet: 0.5 }));
    },
    heal() { [523, 659, 784, 1046].forEach((f, i) => voice({ t: 'triangle', f, d: 0.35, dl: i * 0.07, v: 0.12, wet: 0.5 })); },
    zap() {
      if (!gate('zap', 60)) return;
      voice({ t: 'sawtooth', f: 1800, to: 260, d: 0.22, v: 0.12, fl: { type: 'bandpass', f: 2000, to: 400, q: 6 }, vib: { r: 60, d: 300 } });
      nz({ d: 0.18, v: 0.12, fl: { type: 'highpass', f: 2500 } });
    },
    victory() {
      [523, 659, 784, 1046, 1318].forEach((f, i) => {
        voice({ t: 'sawtooth', f, d: 0.32, dl: i * 0.13, v: 0.11, fl: { type: 'lowpass', f: 3000 }, wet: 0.4 });
        voice({ t: 'square', f: f / 2, d: 0.32, dl: i * 0.13, v: 0.06 });
      });
      [523, 659, 784, 1046].forEach(f => voice({ t: 'sawtooth', f, d: 1.1, dl: 0.7, v: 0.07, a: 0.02, fl: { type: 'lowpass', f: 2500 }, wet: 0.6 }));
    },
    defeat() {
      [392, 349, 311, 262].forEach((f, i) => voice({ t: 'sawtooth', f, d: 0.5, dl: i * 0.28, v: 0.15, fl: { type: 'lowpass', f: 900 }, wet: 0.5 }));
      voice({ t: 'sine', f: 65, d: 1.6, dl: 0.2, v: 0.3 });
    },
    deny() {
      voice({ t: 'square', f: 130, d: 0.1, v: 0.12, fl: { type: 'lowpass', f: 500 } });
      voice({ t: 'square', f: 98, d: 0.14, dl: 0.09, v: 0.12, fl: { type: 'lowpass', f: 500 } });
    }
  };
})(window.HVA);
