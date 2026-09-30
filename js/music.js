(function (H) {
  const M = { ctx: null, sess: null, name: null, intensity: 0.6, duck: 1, timer: null, ready: false, fileAudio: null, filePath: null };
  H.Music = M;

  const LEVEL_FILE = 'assets/music_level.mp3';
  const BOSS_FILE = 'assets/music_boss.mp3';
  const fileEls = {};

  function fileFor(name) {
    if (/^w\d+$/.test(name)) return LEVEL_FILE;
    if (['boss', 'boss2', 'boss3', 'mothership'].includes(name)) return BOSS_FILE;
    return null;
  }

  function getFileAudio(path) {
    if (!fileEls[path]) {
      const a = new Audio(H.asset(path));
      a.loop = true; a.preload = 'auto'; a.volume = 0;
      fileEls[path] = a;
    }
    return fileEls[path];
  }

  function fileVol() {
    const s = H.Save.data.settings;
    return (s.music === false ? 0 : (s.musicVol == null ? 0.6 : s.musicVol)) * M.duck;
  }

  function fadeFileTo(a, target, dur) {
    if (a._fadeT) clearInterval(a._fadeT);
    const start = a.volume, t0 = performance.now();
    a._fadeT = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / (dur * 1000));
      a.volume = start + (target - start) * k;
      if (k >= 1) { clearInterval(a._fadeT); a._fadeT = null; if (target === 0) a.pause(); }
    }, 40);
  }

  function stopFileAudio() {
    if (!M.fileAudio) return;
    const a = M.fileAudio;
    fadeFileTo(a, 0, 0.6);
    M.fileAudio = null; M.filePath = null;
  }

  function playFile(path) {
    if (M.filePath === path && M.fileAudio && !M.fileAudio.paused) return;
    const prev = M.fileAudio;
    if (prev && prev !== fileEls[path]) fadeFileTo(prev, 0, 0.6);
    const a = getFileAudio(path);
    if (a.paused) { a.currentTime = a.currentTime || 0; a.play().catch(() => { M.pending = M.name; }); }
    fadeFileTo(a, fileVol(), 0.8);
    M.fileAudio = a; M.filePath = path;
  }

  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function rngFn(seed) { let s = seed >>> 0; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; }

  const SCALES = {
    minor: [0, 2, 3, 5, 7, 8, 10], harm: [0, 2, 3, 5, 7, 8, 11], phryDom: [0, 1, 4, 5, 7, 8, 10],
    phryg: [0, 1, 3, 5, 7, 8, 10], locrian: [0, 1, 3, 5, 6, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10]
  };
  const CH = {
    maj: [0, 4, 7], min: [0, 3, 7], dom7: [0, 4, 7, 10], min7: [0, 3, 7, 10], maj7: [0, 4, 7, 11],
    dim: [0, 3, 6], sus2: [0, 2, 7], min9: [0, 3, 7, 10, 14]
  };
  const degNote = (root, scale, deg) => root + 12 * Math.floor(deg / 7) + scale[((deg % 7) + 7) % 7];

  const RHY = [
    [[0, 3], [3, 3], [6, 2], [8, 4], [12, 2], [14, 2]],
    [[0, 2], [2, 2], [4, 4], [8, 2], [10, 2], [12, 4]],
    [[0, 4], [4, 2], [6, 2], [8, 3], [11, 1], [12, 4]],
    [[0, 1], [2, 2], [4, 2], [6, 2], [8, 4], [12, 2], [14, 2]],
    [[0, 6], [6, 2], [8, 2], [10, 2], [12, 4]],
    [[0, 3], [3, 1], [4, 4], [8, 3], [11, 3], [14, 2]]
  ];
  const RHY_SPARSE = [
    [[0, 6], [8, 4], [12, 4]], [[0, 8], [10, 6]], [[2, 4], [8, 8]], [[0, 4], [6, 4], [12, 4]]
  ];

  function genPhrase(seed, degs, shift, end, sparse) {
    const r = rngFn(seed), out = new Array(64).fill(null), pool = sparse ? RHY_SPARSE : RHY;
    const t0 = pool[Math.floor(r() * pool.length)], t1 = pool[Math.floor(r() * pool.length)], t2 = pool[Math.floor(r() * pool.length)];
    const tpl = [t0, t1, t0, t2];
    const lo = 2 + shift, hi = 11 + shift;
    let cur = degs[0] + 7 + shift;
    for (let b = 0; b < 4; b++) {
      tpl[b].forEach(([st, len], idx) => {
        let d;
        if (st % 4 === 0) {
          let bestD = cur, bestS = 1e9;
          [-7, 0, 7].forEach(k => [0, 2, 4].forEach(t => {
            const c = degs[b] + t + k;
            if (c < lo || c > hi) return;
            const sc = Math.abs(c - cur) + r() * 1.6;
            if (sc < bestS) { bestS = sc; bestD = c; }
          }));
          d = bestD;
        } else {
          const stepv = [-1, 1, 1, 2, -2, 1, -1][Math.floor(r() * 7)];
          d = cur + stepv;
        }
        d = clamp(d, lo, hi);
        if (b === 3 && idx === tpl[b].length - 1) {
          let target = end === 'open' ? degs[3] + 4 : degs[3];
          while (target < lo) target += 7; while (target > hi) target -= 7;
          d = target;
        }
        cur = d;
        out[b * 16 + st] = { d, len };
      });
    }
    return out;
  }

  const DR = {
    off: {},
    half: { k: [0, 10], s: [8], h: [0, 2, 4, 6, 8, 10, 12, 14], hv: 0.35 },
    four: { k: [0, 4, 8, 12], s: [4, 12], h: [1, 3, 5, 7, 9, 11, 13, 15], oh: [2, 6, 10, 14], hv: 0.3 },
    anthem: { k: [0, 8, 10], s: [4, 12], clap: [4, 12], h: [0, 2, 4, 6, 8, 10, 12, 14], oh: [14], hv: 0.4 },
    brk: { k: [0, 3, 6, 10, 11], s: [4, 12], sg: [7, 15], h: [0, 2, 4, 6, 8, 10, 12, 14], hv: 0.4 },
    desert: { k: [0, 7, 10], t: [[4, 150], [12, 150], [14, 205], [3, 260], [8, 205]], h: [0, 2, 4, 6, 8, 10, 12, 14], hv: 0.22 },
    moon: { k: [0, 8], rim: [4, 12], h: [6, 14], hv: 0.2 },
    glitch: { k: [0, 3, 7, 10, 13], s: [4, 12], sg: [15], h: [0, 1, 2, 4, 5, 6, 8, 9, 10, 12, 14], hv: 0.3, rnd: true },
    boss: { k: [0, 2, 4, 6, 8, 10, 12, 13, 14], s: [4, 12], h: [0, 2, 4, 6, 8, 10, 12, 14], oh: [15], hv: 0.42, crash: [0] }
  };

  const BASS = {
    half: [0, null, null, null, 0, null, null, null, 0, null, null, 0, null, null, 7, null],
    drive: [0, null, 0, null, 12, null, 0, null, 0, null, 0, null, 12, null, 7, null],
    gallop: [0, 0, 12, 0, 0, 0, 12, 0, 0, 0, 12, 0, 0, 7, 5, 3],
    walk: [0, null, null, 12, null, null, 7, null, 0, null, null, 10, null, 7, null, 5],
    sub: [0, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    wobble: [0, null, 0, 0, null, 0, null, 0, 0, null, 12, null, 0, 0, null, 7]
  };

  const ARP = {
    up16: i => i % 4,
    updown: i => [0, 1, 2, 3, 2, 1, 2, 1][i % 8],
    skip: i => [0, 2, 1, 3, 2, 0, 3, 1][i % 8],
    gate8: i => (i % 2 ? null : [0, 2, 1, 3][(i >> 1) % 4]),
    pulse: i => (i % 2 ? 4 : 0),
    glitch: i => [0, 3, 1, null, 2, 3, null, 1][i % 8]
  };

  function buildTrack(cfg) {
    const t = Object.assign({}, cfg);
    t.scale = SCALES[cfg.scale];
    t.sections.forEach((sec, si) => {
      const bars = sec.bars || 8;
      const seq = [];
      for (let b = 0; b < bars; b++) seq.push(sec.prog[b % sec.prog.length]);
      sec.seq = seq; sec.bars = bars;
      if (!sec.noLead) {
        const degsOf = (s0) => [0, 1, 2, 3].map(k => (seq[s0 + k] || seq[k])[0]);
        const shift = sec.shift || 0;
        const phrases = [];
        for (let p = 0; p * 4 < bars; p++) phrases.push(genPhrase(sec.seed || 7, degsOf(p * 4), shift, p % 2 ? 'close' : 'open', t.sparse));
        sec.lead = phrases.reduce((a, b) => a.concat(b), []);
      }
    });
    t.totalBars = t.sections.reduce((s, x) => s + x.bars, 0);
    return t;
  }

  const P = (deg, type) => [deg, type];
  const rep = (arr, n) => { let o = []; for (let i = 0; i < n; i++) o = o.concat(arr); return o; };
  const each2 = arr => arr.reduce((a, c) => a.concat([c, c]), []);

  const TRACKS = {
    menu: {
      bpm: 96, root: 45, scale: 'minor', fixed: 0.9, swing: 0.05, padI: 'choir', leadI: 'super', arpI: 'bell', bassI: 'round',
      sections: [
        { prog: rep([P(0, 'min7'), P(5, 'maj7'), P(2, 'maj'), P(6, 'maj')], 2), drums: 'half', bass: 'half', arp: 'pluck', seed: 11 },
        { prog: rep([P(3, 'min'), P(5, 'maj'), P(0, 'min'), P(4, 'dom7')], 2), drums: 'anthem', bass: 'drive', arp: 'skip', seed: 23, shift: 2 },
        { prog: rep([P(0, 'min7'), P(3, 'maj7'), P(5, 'maj7'), P(6, 'maj')], 2), drums: 'anthem', bass: 'drive', arp: 'up16', seed: 41, shift: 4 },
        { prog: [P(0, 'min7'), P(5, 'maj7'), P(3, 'min7'), P(4, 'dom7')], bars: 4, drums: 'half', bass: 'half', arp: 'up16', seed: 31, breakdown: true }
      ]
    },
    w1: {
      bpm: 128, root: 40, scale: 'minor', swing: 0, padI: 'warm', leadI: 'super', arpI: 'pluck', bassI: 'round',
      sections: [
        { prog: rep([P(0, 'min'), P(5, 'maj'), P(2, 'maj'), P(6, 'maj')], 2), drums: 'four', bass: 'drive', arp: 'up16', seed: 5 },
        { prog: rep([P(0, 'min'), P(5, 'maj'), P(2, 'maj'), P(6, 'maj')], 2), drums: 'four', bass: 'drive', arp: 'skip', seed: 17, shift: 2 },
        { prog: rep([P(3, 'min'), P(0, 'min'), P(5, 'maj'), P(6, 'maj')], 2), drums: 'brk', bass: 'drive', arp: 'up16', seed: 9, shift: 3 },
        { prog: [P(0, 'min7'), P(5, 'maj7'), P(3, 'min7'), P(4, 'dom7')], bars: 4, drums: 'off', bass: 'sub', arp: 'updown', seed: 40, breakdown: true }
      ]
    },
    w2: {
      bpm: 108, root: 38, scale: 'phryDom', swing: 0.06, padI: 'drone', leadI: 'reed', arpI: 'oud', bassI: 'round',
      sections: [
        { prog: rep([P(0, 'maj'), P(1, 'maj'), P(0, 'maj'), P(3, 'min')], 2), drums: 'desert', bass: 'walk', arp: 'gate8', seed: 3 },
        { prog: rep([P(3, 'min'), P(0, 'maj'), P(1, 'maj'), P(0, 'maj')], 2), drums: 'desert', bass: 'walk', arp: 'skip', seed: 14, shift: 2 },
        { prog: rep([P(3, 'min'), P(4, 'dom7'), P(0, 'maj'), P(0, 'maj')], 2), drums: 'desert', bass: 'walk', arp: 'gate8', seed: 27, shift: 3 },
        { prog: [P(0, 'maj'), P(1, 'maj'), P(0, 'maj'), P(1, 'maj')], bars: 4, drums: 'off', bass: 'sub', arp: 'gate8', seed: 41, breakdown: true }
      ]
    },
    w3: {
      bpm: 84, root: 36, scale: 'minor', swing: 0, padI: 'glass', leadI: 'bell', arpI: 'bell', bassI: 'sub', sparse: true,
      sections: [
        { prog: each2([P(0, 'min9'), P(5, 'maj7'), P(2, 'maj7'), P(6, 'dom7')]), drums: 'moon', bass: 'sub', arp: 'gate8', seed: 8 },
        { prog: each2([P(3, 'min7'), P(0, 'min9'), P(5, 'maj7'), P(4, 'min7')]), drums: 'moon', bass: 'sub', arp: 'updown', seed: 19, shift: 3 },
        { prog: each2([P(0, 'min9'), P(6, 'dom7')]), bars: 4, drums: 'off', bass: 'sub', arp: 'gate8', seed: 33, breakdown: true }
      ]
    },
    w4: {
      bpm: 118, root: 42, scale: 'locrian', swing: 0.03, padI: 'glass', leadI: 'ring', arpI: 'glitch', bassI: 'wobble',
      sections: [
        { prog: rep([P(0, 'dim'), P(1, 'maj'), P(3, 'min'), P(0, 'dim')], 2), drums: 'glitch', bass: 'wobble', arp: 'glitch', seed: 6, fxSweep: true },
        { prog: rep([P(5, 'maj'), P(1, 'maj'), P(0, 'dim'), P(6, 'min7')], 2), drums: 'glitch', bass: 'wobble', arp: 'up16', seed: 12, shift: 2, fxSweep: true },
        { prog: [P(0, 'dim'), P(1, 'maj'), P(0, 'dim'), P(4, 'sus2')], bars: 4, drums: 'off', bass: 'sub', arp: 'glitch', seed: 44, breakdown: true }
      ]
    },
    w5: {
      bpm: 92, root: 40, scale: 'dorian', swing: 0, padI: 'glass', leadI: 'bell', arpI: 'bell', bassI: 'sub', sparse: true,
      sections: [
        { prog: each2([P(0, 'min9'), P(3, 'maj7'), P(5, 'maj7'), P(4, 'min7')]), drums: 'moon', bass: 'sub', arp: 'updown', seed: 51 },
        { prog: each2([P(3, 'maj7'), P(0, 'min9'), P(6, 'maj'), P(4, 'min7')]), drums: 'half', bass: 'half', arp: 'gate8', seed: 62, shift: 2 },
        { prog: each2([P(0, 'min9'), P(4, 'min7')]), bars: 4, drums: 'off', bass: 'sub', arp: 'updown', seed: 73, breakdown: true }
      ]
    },
    w6: {
      bpm: 124, root: 35, scale: 'phryg', swing: 0, padI: 'dark', leadI: 'reed', arpI: 'stab', bassI: 'dist',
      sections: [
        { prog: rep([P(0, 'min'), P(1, 'maj'), P(0, 'min'), P(6, 'maj')], 2), drums: 'brk', bass: 'gallop', arp: 'pulse', seed: 81 },
        { prog: rep([P(0, 'min'), P(5, 'maj'), P(1, 'maj'), P(0, 'min')], 2), drums: 'four', bass: 'drive', arp: 'skip', seed: 92, shift: 2 },
        { prog: [P(0, 'min'), P(1, 'maj'), P(0, 'min'), P(1, 'maj')], bars: 4, drums: 'off', bass: 'sub', arp: 'pulse', seed: 97, breakdown: true }
      ]
    },
    w7: {
      bpm: 76, root: 38, scale: 'dorian', swing: 0.05, padI: 'choir', leadI: 'bell', arpI: 'pluck', bassI: 'sub', sparse: true,
      sections: [
        { prog: each2([P(0, 'min9'), P(6, 'maj7'), P(3, 'maj7'), P(4, 'min7')]), drums: 'moon', bass: 'sub', arp: 'skip', seed: 101 },
        { prog: each2([P(5, 'maj7'), P(3, 'min9'), P(0, 'min9'), P(4, 'dom7')]), drums: 'half', bass: 'half', arp: 'updown', seed: 112, shift: 3 },
        { prog: each2([P(0, 'min9'), P(6, 'dom7')]), bars: 4, drums: 'off', bass: 'sub', arp: 'skip', seed: 123, breakdown: true }
      ]
    },
    w8: {
      bpm: 132, root: 33, scale: 'locrian', swing: 0, padI: 'choir', leadI: 'ring', arpI: 'glitch', bassI: 'wobble',
      sections: [
        { prog: rep([P(0, 'dim'), P(1, 'maj'), P(0, 'dim'), P(4, 'sus2')], 2), drums: 'glitch', bass: 'wobble', arp: 'glitch', seed: 131, fxSweep: true },
        { prog: rep([P(5, 'maj'), P(0, 'dim'), P(1, 'maj'), P(3, 'min')], 2), drums: 'boss', bass: 'gallop', arp: 'pulse', seed: 142, shift: 2 },
        { prog: [P(0, 'dim'), P(1, 'maj'), P(0, 'dim'), P(4, 'sus2')], bars: 4, drums: 'off', bass: 'sub', arp: 'glitch', seed: 153, breakdown: true }
      ]
    },
    w9: {
      bpm: 100, root: 38, scale: 'dorian', swing: 0.05, padI: 'drone', leadI: 'reed', arpI: 'pluck', bassI: 'round',
      sections: [
        { prog: rep([P(0, 'min7'), P(3, 'maj'), P(0, 'min7'), P(4, 'min7')], 2), drums: 'desert', bass: 'walk', arp: 'skip', seed: 201 },
        { prog: rep([P(3, 'maj'), P(0, 'min7'), P(5, 'maj7'), P(4, 'min7')], 2), drums: 'half', bass: 'walk', arp: 'gate8', seed: 212, shift: 2 },
        { prog: [P(0, 'min7'), P(4, 'min7'), P(0, 'min7'), P(3, 'maj')], bars: 4, drums: 'off', bass: 'sub', arp: 'skip', seed: 223, breakdown: true }
      ]
    },
    w10: {
      bpm: 138, root: 40, scale: 'harm', swing: 0, padI: 'dark', leadI: 'super', arpI: 'stab', bassI: 'dist',
      sections: [
        { prog: rep([P(0, 'min'), P(5, 'maj'), P(3, 'min'), P(4, 'maj')], 2), drums: 'four', bass: 'drive', arp: 'up16', seed: 231 },
        { prog: rep([P(0, 'min'), P(6, 'dim'), P(5, 'maj'), P(4, 'maj')], 2), drums: 'brk', bass: 'gallop', arp: 'pulse', seed: 242, shift: 2 },
        { prog: [P(0, 'min'), P(5, 'maj'), P(3, 'min'), P(4, 'maj')], bars: 4, drums: 'off', bass: 'sub', arp: 'updown', seed: 253, breakdown: true }
      ]
    },
    w11: {
      bpm: 112, root: 37, scale: 'phryDom', swing: 0.04, padI: 'choir', leadI: 'reed', arpI: 'oud', bassI: 'round',
      sections: [
        { prog: rep([P(0, 'maj'), P(1, 'maj'), P(0, 'maj'), P(3, 'min')], 2), drums: 'desert', bass: 'walk', arp: 'gate8', seed: 261 },
        { prog: rep([P(3, 'min'), P(4, 'dom7'), P(0, 'maj'), P(1, 'maj')], 2), drums: 'desert', bass: 'walk', arp: 'skip', seed: 272, shift: 3 },
        { prog: [P(0, 'maj'), P(1, 'maj'), P(0, 'maj'), P(1, 'maj')], bars: 4, drums: 'off', bass: 'sub', arp: 'gate8', seed: 283, breakdown: true }
      ]
    },
    w12: {
      bpm: 146, root: 34, scale: 'minor', swing: 0, padI: 'glass', leadI: 'ring', arpI: 'glitch', bassI: 'wobble',
      sections: [
        { prog: rep([P(0, 'min'), P(5, 'maj'), P(6, 'maj'), P(4, 'min7')], 2), drums: 'glitch', bass: 'wobble', arp: 'up16', seed: 291, fxSweep: true },
        { prog: rep([P(3, 'min'), P(0, 'min'), P(5, 'maj'), P(6, 'maj')], 2), drums: 'four', bass: 'drive', arp: 'glitch', seed: 302, shift: 2, fxSweep: true },
        { prog: [P(0, 'min7'), P(5, 'maj7'), P(3, 'min7'), P(4, 'dom7')], bars: 4, drums: 'off', bass: 'sub', arp: 'glitch', seed: 313, breakdown: true }
      ]
    },
    boss: {
      bpm: 152, root: 36, scale: 'harm', fixed: 1, swing: 0, padI: 'dark', leadI: 'dist', arpI: 'stab', bassI: 'dist', boss: true,
      sections: [
        { prog: rep([P(0, 'min'), P(5, 'maj'), P(3, 'min'), P(4, 'maj')], 2), drums: 'boss', bass: 'gallop', arp: 'stab', seed: 2 },
        { prog: rep([P(0, 'min'), P(0, 'min'), P(5, 'maj'), P(6, 'dim')], 2), drums: 'boss', bass: 'gallop', arp: 'pulse', seed: 15, shift: 3 },
        { prog: rep([P(3, 'min'), P(4, 'maj'), P(0, 'min'), P(4, 'maj')], 2), drums: 'boss', bass: 'gallop', arp: 'stab', seed: 26, shift: 2 }
      ]
    },
    boss2: {
      bpm: 160, root: 33, scale: 'phryg', fixed: 1, swing: 0, padI: 'dark', leadI: 'dist', arpI: 'stab', bassI: 'dist', boss: true,
      sections: [
        { prog: rep([P(0, 'min'), P(1, 'maj'), P(0, 'min'), P(6, 'maj')], 2), drums: 'boss', bass: 'gallop', arp: 'pulse', seed: 401 },
        { prog: rep([P(0, 'min'), P(5, 'maj'), P(1, 'maj'), P(0, 'dim')], 2), drums: 'boss', bass: 'gallop', arp: 'stab', seed: 412, shift: 3 },
        { prog: rep([P(3, 'min'), P(1, 'maj'), P(0, 'min'), P(4, 'dim')], 2), drums: 'glitch', bass: 'wobble', arp: 'pulse', seed: 423, shift: 2 }
      ]
    },
    boss3: {
      bpm: 168, root: 38, scale: 'harm', fixed: 1, swing: 0, padI: 'choir', leadI: 'dist', arpI: 'glitch', bassI: 'dist', boss: true,
      sections: [
        { prog: rep([P(0, 'min'), P(3, 'min'), P(5, 'maj'), P(4, 'maj')], 2), drums: 'boss', bass: 'gallop', arp: 'up16', seed: 431 },
        { prog: rep([P(0, 'min'), P(6, 'dim'), P(5, 'maj'), P(4, 'dom7')], 2), drums: 'boss', bass: 'gallop', arp: 'stab', seed: 442, shift: 2 },
        { prog: rep([P(5, 'maj'), P(4, 'maj'), P(0, 'min'), P(0, 'min')], 2), drums: 'glitch', bass: 'gallop', arp: 'pulse', seed: 453, shift: 3 }
      ]
    },
    mothership: {
      bpm: 140, root: 47, scale: 'phryg', fixed: 1, swing: 0, padI: 'choir', leadI: 'dist', arpI: 'glitch', bassI: 'dist', boss: true, siren: true,
      sections: [
        { prog: rep([P(0, 'min'), P(1, 'maj'), P(0, 'min'), P(6, 'maj')], 2), drums: 'boss', bass: 'gallop', arp: 'pulse', seed: 21 },
        { prog: rep([P(0, 'dim'), P(1, 'maj'), P(3, 'min'), P(4, 'dim')], 2), drums: 'glitch', bass: 'wobble', arp: 'glitch', seed: 34, shift: 3 },
        { prog: rep([P(0, 'min'), P(1, 'maj'), P(5, 'maj'), P(6, 'maj')], 2), drums: 'boss', bass: 'gallop', arp: 'pulse', seed: 47, shift: 2 }
      ]
    }
  };
  Object.keys(TRACKS).forEach(k => { TRACKS[k] = buildTrack(TRACKS[k]); });

  let noiseBuf = null, revIn = null, master = null, analyser = null;

  function makeIR(c, secs, decay) {
    const n = Math.floor(c.sampleRate * secs), b = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); }
    return b;
  }
  function curve(k) {
    const n = 1024, a = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; a[i] = (1 + k) * x / (1 + k * Math.abs(x)); }
    return a;
  }

  function init() {
    if (M.ready) return true;
    const c = H.Sound.context();
    if (!c) return false;
    M.ctx = c;
    master = c.createGain();
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.2;
    analyser = c.createAnalyser(); analyser.fftSize = 512;
    master.connect(comp); comp.connect(c.destination); comp.connect(analyser);
    M.analyser = analyser;
    const nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    noiseBuf = nb;
    const conv = c.createConvolver(); conv.buffer = makeIR(c, 2.6, 2.4);
    revIn = c.createGain(); const revOut = c.createGain(); revOut.gain.value = 0.5;
    revIn.connect(conv); conv.connect(revOut); revOut.connect(master);
    M.ready = true;
    M.applySettings();
    return true;
  }

  M.applySettings = function () {
    if (M.fileAudio) fadeFileTo(M.fileAudio, fileVol(), 0.3);
    if (!M.ready) return;
    const s = H.Save.data.settings;
    const v = s.music === false ? 0 : (s.musicVol == null ? 0.6 : s.musicVol);
    master.gain.setTargetAtTime(v * 0.75 * M.duck, M.ctx.currentTime, 0.08);
  };

  const LAYERS = {
    pad: { rv: 0.55, dl: 0, thr: 0, base: 0.9 }, bass: { rv: 0, dl: 0, thr: 0, base: 1 }, drums: { rv: 0.12, dl: 0, thr: 0.14, base: 1 },
    arp: { rv: 0.28, dl: 0.55, thr: 0.3, base: 0.8 }, perc: { rv: 0.15, dl: 0.1, thr: 0.45, base: 0.8 },
    lead: { rv: 0.38, dl: 0.5, thr: 0.58, base: 0.9 }, fx: { rv: 0.6, dl: 0.2, thr: 0.4, base: 0.9 }
  };

  function makeSession(track) {
    const c = M.ctx;
    const s = { track, out: c.createGain(), bus: {}, target: {}, step: 0, next: c.currentTime + 0.12, dead: false, name: null };
    s.out.gain.value = 0.0001; s.out.connect(master);
    s.out.gain.setTargetAtTime(1, c.currentTime, 0.25);
    s.delay = c.createDelay(1.5); s.delay.delayTime.value = 60 / track.bpm * 0.75;
    const fb = c.createGain(); fb.gain.value = 0.38; const dlp = c.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 2600;
    const dOut = c.createGain(); dOut.gain.value = 0.55;
    s.delay.connect(dlp); dlp.connect(fb); fb.connect(s.delay); dlp.connect(dOut); dOut.connect(s.out);
    s.nodes = [s.delay, fb, dlp, dOut];
    Object.keys(LAYERS).forEach(k => {
      const L = LAYERS[k], lv = c.createGain(), duck = c.createGain(), rv = c.createGain(), dl = c.createGain();
      lv.gain.value = 0.0001; rv.gain.value = L.rv; dl.gain.value = L.dl;
      lv.connect(duck); duck.connect(s.out); duck.connect(rv); rv.connect(revIn); duck.connect(dl); dl.connect(s.delay);
      s.bus[k] = { in: lv, duck };
      s.target[k] = 0;
      s.nodes.push(lv, duck, rv, dl);
    });
    return s;
  }

  function updateLayers(s, snap) {
    const c = M.ctx, tr = s.track;
    const i = tr.fixed != null ? tr.fixed : M.intensity;
    Object.keys(LAYERS).forEach(k => {
      const L = LAYERS[k];
      let tgt = clamp((i - L.thr) / 0.12, 0, 1) * L.base;
      if (k === 'lead' && tr.fixed != null) tgt = L.base;
      if (s.breakdown && (k === 'drums' || k === 'perc' || k === 'lead') && !tr.fixed) tgt *= 0.0;
      s.target[k] = tgt;
      s.bus[k].in.gain.setTargetAtTime(Math.max(0.0001, tgt), c.currentTime, snap ? 0.02 : 0.3);
    });
  }

  function noiseSrc(s, t, dur, dest, filt) {
    const c = M.ctx, n = c.createBufferSource(); n.buffer = noiseBuf; n.loop = true;
    let node = n;
    if (filt) { const f = c.createBiquadFilter(); f.type = filt.type; f.frequency.value = filt.f; f.Q.value = filt.q || 0.7; n.connect(f); node = f; if (filt.sweep) { f.frequency.setValueAtTime(filt.f, t); f.frequency.exponentialRampToValueAtTime(filt.sweep, t + dur); } }
    node.connect(dest);
    n.start(t, Math.random() * 1.5); n.stop(t + dur + 0.05);
    return node;
  }
  function envGain(c, t, peak, a, dur, dest) {
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dur);
    g.connect(dest);
    return g;
  }
  function duckAt(s, t, layers, amt, rel) {
    layers.forEach(k => {
      const p = s.bus[k].duck.gain;
      p.cancelScheduledValues(t); p.setValueAtTime(amt, t); p.linearRampToValueAtTime(1, t + rel);
    });
  }

  function kick(s, t, v) {
    const c = M.ctx, o = c.createOscillator(), g = envGain(c, t, 0.95 * v, 0.002, 0.3, s.bus.drums.in);
    o.type = 'sine'; o.frequency.setValueAtTime(165, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    o.connect(g); o.start(t); o.stop(t + 0.35);
    const g2 = envGain(c, t, 0.35 * v, 0.001, 0.02, s.bus.drums.in); noiseSrc(s, t, 0.03, g2, { type: 'highpass', f: 2500 });
    duckAt(s, t, ['pad', 'arp', 'lead'], 0.45, 0.2);
  }
  function snare(s, t, v) {
    const c = M.ctx, g = envGain(c, t, 0.5 * v, 0.001, 0.17, s.bus.drums.in);
    noiseSrc(s, t, 0.2, g, { type: 'bandpass', f: 1900, q: 0.6 });
    const o = c.createOscillator(), g2 = envGain(c, t, 0.35 * v, 0.001, 0.1, s.bus.drums.in);
    o.type = 'triangle'; o.frequency.setValueAtTime(230, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.09); o.connect(g2); o.start(t); o.stop(t + 0.15);
  }
  function clap(s, t, v) {
    const c = M.ctx;
    [0, 0.011, 0.024].forEach(d => { const g = envGain(c, t + d, 0.32 * v, 0.001, d === 0.024 ? 0.16 : 0.03, s.bus.drums.in); noiseSrc(s, t + d, 0.2, g, { type: 'bandpass', f: 1500, q: 1.2 }); });
  }
  function hat(s, t, open, v) {
    const c = M.ctx, g = envGain(c, t, 0.16 * v, 0.001, open ? 0.2 : 0.035, s.bus.drums.in);
    noiseSrc(s, t, open ? 0.25 : 0.06, g, { type: 'highpass', f: 7500 });
  }
  function tom(s, t, f, v) {
    const c = M.ctx, o = c.createOscillator(), g = envGain(c, t, 0.5 * v, 0.002, 0.22, s.bus.perc.in);
    o.type = 'sine'; o.frequency.setValueAtTime(f * 1.5, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.08); o.connect(g); o.start(t); o.stop(t + 0.3);
    const g2 = envGain(c, t, 0.18 * v, 0.001, 0.03, s.bus.perc.in); noiseSrc(s, t, 0.05, g2, { type: 'bandpass', f: 3000, q: 1 });
  }
  function rim(s, t, v) {
    const c = M.ctx, o = c.createOscillator(), g = envGain(c, t, 0.22 * v, 0.001, 0.03, s.bus.perc.in);
    o.type = 'square'; o.frequency.value = 1750; o.connect(g); o.start(t); o.stop(t + 0.05);
  }
  function crash(s, t, v) {
    const c = M.ctx, g = envGain(c, t, 0.3 * v, 0.002, 1.6, s.bus.fx.in);
    noiseSrc(s, t, 1.8, g, { type: 'highpass', f: 4500 });
  }
  function riser(s, t, dur) {
    const c = M.ctx, g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.28, t + dur); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.03);
    g.connect(s.bus.fx.in);
    noiseSrc(s, t, dur + 0.05, g, { type: 'bandpass', f: 400, q: 2, sweep: 9000 });
  }
  function impact(s, t) {
    const c = M.ctx, o = c.createOscillator(), g = envGain(c, t, 0.8, 0.003, 1.4, s.bus.fx.in);
    o.type = 'sine'; o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(28, t + 1.2); o.connect(g); o.start(t); o.stop(t + 1.5);
    const g2 = envGain(c, t, 0.35, 0.002, 1.1, s.bus.fx.in); noiseSrc(s, t, 1.2, g2, { type: 'lowpass', f: 1200 });
  }
  function sweepFx(s, t, up) {
    const c = M.ctx, o = c.createOscillator(), g = envGain(c, t, 0.14, 0.05, 0.7, s.bus.fx.in);
    o.type = 'sawtooth'; o.frequency.setValueAtTime(up ? 200 : 2400, t); o.frequency.exponentialRampToValueAtTime(up ? 2400 : 160, t + 0.7);
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 6; f.frequency.setValueAtTime(up ? 400 : 3000, t); f.frequency.exponentialRampToValueAtTime(up ? 3000 : 300, t + 0.7);
    o.connect(f); f.connect(g); o.start(t); o.stop(t + 0.85);
  }
  function siren(s, t, dur) {
    const c = M.ctx, o = c.createOscillator(), g = c.createGain(), l = c.createOscillator(), lg = c.createGain();
    o.type = 'sawtooth'; o.frequency.value = 520; l.frequency.value = 0.9; lg.gain.value = 190; l.connect(lg); lg.connect(o.frequency);
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.09, t + 0.4); g.gain.setValueAtTime(0.09, t + dur - 0.4); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(g); g.connect(s.bus.fx.in); o.start(t); l.start(t); o.stop(t + dur); l.stop(t + dur);
  }

  function voice(s, layer, o, t, dur) {
    const c = M.ctx, out = c.createGain(), f = c.createBiquadFilter();
    f.type = o.ftype || 'lowpass'; f.Q.value = o.q || 1;
    const cut = o.cut || [2000, 4000, 1200], fa = o.fa || 0.02;
    f.frequency.setValueAtTime(cut[0], t); f.frequency.linearRampToValueAtTime(cut[1], t + fa);
    f.frequency.exponentialRampToValueAtTime(Math.max(80, cut[2]), t + Math.max(dur, fa + 0.05));
    const a = o.a || 0.005, d = o.d || 0.12, sus = o.s == null ? 0.6 : o.s, r = o.r || 0.12, v = o.vol || 0.15;
    out.gain.setValueAtTime(0.0001, t); out.gain.linearRampToValueAtTime(v, t + a);
    out.gain.exponentialRampToValueAtTime(Math.max(0.0002, v * sus), t + a + d);
    out.gain.setValueAtTime(Math.max(0.0002, v * sus), t + Math.max(a + d, dur));
    out.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(a + d, dur) + r);
    const end = t + Math.max(a + d, dur) + r + 0.05;
    let vib = null;
    if (o.vib) {
      const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = o.vib[0]; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(o.vib[1], t + 0.25);
      l.connect(lg); l.start(t); l.stop(end); vib = lg;
    }
    const dets = o.det || [0], per = 1 / Math.sqrt(dets.length);
    dets.forEach(dt => {
      const os = c.createOscillator(), g = c.createGain(); g.gain.value = per;
      os.type = o.type || 'sawtooth'; os.frequency.setValueAtTime(o.glide ? o.freq * Math.pow(2, o.glide / 12) : o.freq, t);
      if (o.glide) os.frequency.exponentialRampToValueAtTime(o.freq, t + 0.06);
      os.detune.value = dt; if (vib) vib.connect(os.detune);
      os.connect(g); g.connect(f); os.start(t); os.stop(end);
    });
    if (o.sub) {
      const so = c.createOscillator(), sg = c.createGain(); so.type = 'sine'; so.frequency.value = o.freq / 2; sg.gain.value = o.sub;
      so.connect(sg); sg.connect(f); so.start(t); so.stop(end);
    }
    if (o.fm) {
      const mod = c.createOscillator(), mg = c.createGain(), car = c.createOscillator(), cg = c.createGain();
      mod.frequency.value = o.freq * o.fm[0]; mg.gain.setValueAtTime(o.freq * o.fm[1], t); mg.gain.exponentialRampToValueAtTime(o.freq * 0.05, t + Math.max(0.3, dur));
      car.frequency.value = o.freq; cg.gain.value = 1; mod.connect(mg); mg.connect(car.frequency); car.connect(cg); cg.connect(f);
      mod.start(t); car.start(t); mod.stop(end); car.stop(end);
    }
    if (o.shape) { const ws = c.createWaveShaper(); ws.curve = curve(o.shape); ws.oversample = '2x'; f.connect(ws); ws.connect(out); }
    else f.connect(out);
    out.connect(s.bus[layer].in);
  }

  function padVoice(s, kind, notes, t, dur) {
    notes.forEach((m, i) => {
      const f = mtof(m);
      const base = { freq: f, det: [-9, 8], cut: [500, 900, 700], fa: dur * 0.6, a: 0.5, d: 0.5, s: 0.85, r: 0.7, vol: 0.075, q: 0.8 };
      if (kind === 'warm') Object.assign(base, { det: [-10, 0, 9], vol: 0.06 });
      if (kind === 'drone') Object.assign(base, { type: 'sawtooth', cut: [400, 1100, 600], vol: 0.06, vib: [0.4, 6] });
      if (kind === 'glass') Object.assign(base, { type: 'triangle', det: [-6, 6], cut: [900, 2400, 1200], vol: 0.11, a: 0.9, r: 1.2, vib: [0.25, 8] });
      if (kind === 'dark') Object.assign(base, { det: [-14, 0, 14], cut: [300, 700, 400], vol: 0.07 });
      if (kind === 'choir') Object.assign(base, { det: [-12, 0, 12], ftype: 'bandpass', q: 3, cut: [700, 1100, 800], vol: 0.13, vib: [5, 14], a: 0.7 });
      voice(s, 'pad', base, t, dur);
    });
  }

  function bassVoice(s, kind, m, t, dur) {
    const f = mtof(m);
    const o = { freq: f, det: [0], cut: [180, 900, 260], fa: 0.01, a: 0.004, d: 0.15, s: 0.7, r: 0.06, vol: 0.34, sub: 0.7, q: 2.5 };
    if (kind === 'sub') Object.assign(o, { type: 'sine', cut: [400, 400, 400], sub: 0, vol: 0.5, a: 0.03, s: 0.9, r: 0.4, d: 0.4 });
    else if (kind === 'dist') Object.assign(o, { cut: [300, 1500, 400], shape: 14, vol: 0.28, q: 4 });
    else if (kind === 'wobble') Object.assign(o, { type: 'square', cut: [200, 1800, 300], q: 6, vol: 0.26, fa: 0.05, d: 0.2 });
    else o.type = 'sawtooth';
    voice(s, 'bass', o, t, dur);
  }

  function leadVoice(s, kind, m, t, dur) {
    const f = mtof(m);
    const o = { freq: f, det: [-14, -6, 0, 6, 14], cut: [1600, 5000, 1500], fa: 0.03, a: 0.01, d: 0.2, s: 0.65, r: 0.25, vol: 0.13 };
    if (kind === 'reed') Object.assign(o, { type: 'square', det: [-5, 5], cut: [900, 2800, 1300], vib: [5.5, 18], vol: 0.11, ftype: 'lowpass', glide: 2 });
    else if (kind === 'bell') Object.assign(o, { type: 'sine', det: [], fm: [3.5, 2.4], cut: [6000, 6000, 6000], vol: 0.22, a: 0.002, d: 1.4, s: 0.02, r: 1.2 });
    else if (kind === 'ring') Object.assign(o, { type: 'square', det: [0, 700], cut: [1500, 3800, 1300], vol: 0.1, vib: [6, 25], glide: -3 });
    else if (kind === 'dist') Object.assign(o, { type: 'sawtooth', det: [-8, 8], cut: [1200, 3500, 1400], shape: 12, vol: 0.1, vib: [6, 12], glide: -2 });
    voice(s, 'lead', o, t, dur);
  }

  function arpVoice(s, kind, m, t, dur) {
    const f = mtof(m);
    const o = { freq: f, type: 'square', det: [-4, 4], cut: [3800, 5200, 900], fa: 0.005, a: 0.002, d: 0.13, s: 0.05, r: 0.08, vol: 0.09 };
    if (kind === 'bell') Object.assign(o, { type: 'sine', det: [], fm: [2, 1.6], cut: [6000, 6000, 6000], d: 0.9, vol: 0.14, s: 0.02, r: 0.5 });
    else if (kind === 'oud') Object.assign(o, { type: 'sawtooth', cut: [3200, 3200, 500], d: 0.28, vol: 0.12, det: [0, 3] });
    else if (kind === 'glitch') Object.assign(o, { type: 'square', det: [0, 1200], cut: [4500, 6000, 1500], d: 0.07, vol: 0.075 });
    else if (kind === 'stab') Object.assign(o, { type: 'sawtooth', det: [-12, 0, 12], cut: [800, 4200, 900], d: 0.16, s: 0.3, vol: 0.13, shape: 6 });
    voice(s, 'arp', o, t, dur);
  }

  function scheduleStep(s, step, t) {
    const tr = s.track, c = M.ctx;
    const bar = Math.floor(step / 16) % tr.totalBars, st = step % 16;
    let acc = 0, sec = null, sb = 0, si = 0;
    for (let i = 0; i < tr.sections.length; i++) { if (bar < acc + tr.sections[i].bars) { sec = tr.sections[i]; sb = bar - acc; si = i; break; } acc += tr.sections[i].bars; }
    const stepDur = 60 / tr.bpm / 4;
    const sw = (st % 2) ? tr.swing * stepDur : 0;
    const tt = t + sw;
    const chord = sec.seq[sb], root = degNote(tr.root, tr.scale, chord[0]), tones = CH[chord[1]];
    const inLast = sb === sec.bars - 1;
    if (st === 0) {
      s.breakdown = !!sec.breakdown;
      updateLayers(s, false);
      if (sb === 0) { crash(s, t, 0.9); if (tr.boss || si === 0) impact(s, t); }
      const barDur = stepDur * 16;
      padVoice(s, tr.padI, tones.slice(0, 4).map(i => root + 12 + i), t, barDur + 0.15);
      if (tr.siren && sb % 4 === 0) siren(s, t, barDur * 2);
      if (inLast && !sec.breakdown && s.target.fx > 0) riser(s, t, barDur * 0.98);
      if (sec.fxSweep && sb % 2 === 1 && s.target.fx > 0) sweepFx(s, t + stepDur * 8, sb % 4 === 1);
    }
    const bp = BASS[sec.bass];
    if (bp && bp[st] != null && s.target.bass > 0.02) {
      let len = 1;
      if (sec.bass === 'sub') len = 8; else { for (let k = st + 1; k < 16 && bp[k] == null && len < 4; k++) len++; if (sec.bass === 'gallop') len = 1; }
      bassVoice(s, tr.bassI, root + bp[st], tt, stepDur * len * 0.92);
    }
    const ap = ARP[sec.arp];
    if (ap && s.target.arp > 0.02) {
      const idx = ap(st + (sb % 2) * 0);
      if (idx != null) {
        const oct = 24 + (((st >> 3) + sb) % 2 ? 12 : 0);
        if (sec.arp === 'stab') { if ([0, 3, 6, 10, 12].includes(st)) tones.slice(0, 3).forEach(i => arpVoice(s, 'stab', root + 24 + i, tt, stepDur * 1.6)); }
        else arpVoice(s, tr.arpI, root + oct + tones[idx % tones.length] + (idx >= tones.length ? 12 : 0), tt, stepDur * 1.5);
      }
    }
    if (sec.lead && s.target.lead > 0.02) {
      const note = sec.lead[sb * 16 + st];
      if (note) leadVoice(s, tr.leadI, degNote(tr.root + 12, tr.scale, note.d), tt, Math.max(stepDur * note.len * 0.9, 0.1));
    }
    const dp = DR[sec.drums] || {};
    if (s.target.drums > 0.02) {
      const has = (arr) => arr && arr.includes(st);
      if (has(dp.k)) kick(s, t, 1);
      if (has(dp.s)) snare(s, t, 1);
      if (has(dp.sg)) snare(s, t, 0.35);
      if (has(dp.clap)) clap(s, t, 1);
      if (dp.h && dp.h.includes(st) && !(dp.rnd && Math.random() < 0.3)) hat(s, tt, false, (dp.hv || 0.3) * (st % 4 === 0 ? 1.3 : 0.8));
      if (has(dp.oh)) hat(s, tt, true, 0.6);
      if (has(dp.crash) && sb % 4 === 0) crash(s, t, 0.5);
      if (inLast && st >= 8 && (st % 2 === 0) && !sec.breakdown && dp.k) snare(s, t, 0.3 + (st - 8) * 0.08);
    }
    if (s.target.perc > 0.02) {
      if (dp.t) dp.t.forEach(([p, f]) => { if (p === st) tom(s, tt, f, 0.7); });
      if (dp.rim && dp.rim.includes(st)) rim(s, t, 0.8);
      if (tr.boss && st % 4 === 2 && sec.drums === 'boss') tom(s, tt, 95, 0.55);
      if (!dp.t && !tr.boss && st % 2 === 1 && sec.drums !== 'off') rim(s, tt, 0.3);
    }
  }

  function tick() {
    const s = M.sess;
    if (!s || s.dead || !M.ready) return;
    const c = M.ctx, dur = 60 / s.track.bpm / 4;
    while (s.next < c.currentTime + 0.14) {
      scheduleStep(s, s.step, s.next);
      s.next += dur; s.step++;
    }
  }

  function retire(s) {
    if (!s) return;
    s.dead = true;
    const c = M.ctx;
    s.out.gain.cancelScheduledValues(c.currentTime);
    s.out.gain.setTargetAtTime(0.0001, c.currentTime, 0.18);
    setTimeout(() => { try { s.out.disconnect(); s.nodes.forEach(n => { try { n.disconnect(); } catch (e) {} }); } catch (e) {} }, 3500);
  }

  M.ensure = function () {
    if (!init()) return false;
    if (M.ctx.state === 'suspended') M.ctx.resume();
    return true;
  };

  M.play = function (name) {
    if (!M.ensure()) { M.pending = name; return; }
    if (M.ctx.state === 'suspended' && navigator.userActivation && !navigator.userActivation.hasBeenActive) { M.pending = name; return; }
    M.pending = null;
    if (M.name === name && ((M.sess && !M.sess.dead) || M.fileAudio)) return;
    const fp = fileFor(name);
    if (fp) {
      retire(M.sess); M.sess = null;
      M.name = name;
      playFile(fp);
      return;
    }
    stopFileAudio();
    retire(M.sess);
    M.name = name;
    const s = makeSession(TRACKS[name]);
    s.name = name;
    M.sess = s;
    updateLayers(s, true);
    if (!M.timer) M.timer = setInterval(tick, 25);
    tick();
  };

  M.stop = function () {
    if (M.sess) retire(M.sess);
    stopFileAudio();
    M.sess = null; M.name = null; M.pending = null;
  };

  M.setIntensity = function (v) {
    M.intensity = clamp(v, 0, 1);
    const s = M.sess;
    if (s && !s.dead && Math.abs((s.lastI || -1) - M.intensity) > 0.03) { s.lastI = M.intensity; updateLayers(s, false); }
  };

  M.setDuck = function (d) {
    M.duck = d;
    M.applySettings();
  };

  function fanfare(kind) {
    if (!M.ensure()) return;
    M.stop();
    const c = M.ctx;
    const track = kind === 'victory'
      ? { bpm: 132, root: 48, scale: 'minor', swing: 0, totalBars: 4, sections: [], padI: 'warm', leadI: 'super', arpI: 'pluck', bassI: 'round' }
      : { bpm: 66, root: 45, scale: 'minor', swing: 0, totalBars: 4, sections: [], padI: 'dark', leadI: 'bell', arpI: 'bell', bassI: 'sub' };
    const s = makeSession(track); s.name = kind; M.sess = s; M.name = kind;
    Object.keys(LAYERS).forEach(k => { s.target[k] = 1; s.bus[k].in.gain.value = LAYERS[k].base; });
    const t0 = c.currentTime + 0.1, beat = 60 / track.bpm;
    if (kind === 'victory') {
      const chords = [[48, [0, 4, 7]], [53, [0, 4, 7]], [55, [0, 4, 7, 10]], [48, [0, 4, 7, 11]]];
      chords.forEach(([r, iv], i) => { padVoice(s, 'warm', iv.map(x => r + 12 + x), t0 + i * beat * 2, beat * 2.1); bassVoice(s, 'round', r, t0 + i * beat * 2, beat * 1.9); kick(s, t0 + i * beat * 2, 1); });
      const mel = [[0, 67, 0.5], [0.5, 72, 0.5], [1, 76, 0.5], [1.5, 79, 1.5], [3, 76, 0.5], [3.5, 79, 0.5], [4, 77, 1], [5, 81, 1], [6, 79, 0.5], [6.5, 83, 0.5], [7, 84, 3]];
      mel.forEach(([b, m, l]) => { leadVoice(s, 'super', m, t0 + b * beat, l * beat * 0.95); if (b >= 4) arpVoice(s, 'pluck', m - 12, t0 + b * beat, l * beat); });
      for (let i = 0; i < 16; i++) { hat(s, t0 + i * beat * 0.5, i % 4 === 2, 0.5); if (i % 4 === 0) snare(s, t0 + (i + 2) * beat * 0.5, 0.7); }
      crash(s, t0, 1); crash(s, t0 + beat * 7, 1); impact(s, t0 + beat * 7);
    } else {
      const notes = [[0, 64, 1.5], [1.5, 62, 1], [2.5, 60, 1.5], [4, 57, 4]];
      notes.forEach(([b, m, l]) => leadVoice(s, 'bell', m, t0 + b * beat, l * beat));
      padVoice(s, 'dark', [45, 52, 57, 60], t0, beat * 4); padVoice(s, 'dark', [43, 50, 55, 59], t0 + beat * 4, beat * 4);
      bassVoice(s, 'sub', 33, t0, beat * 4); bassVoice(s, 'sub', 31, t0 + beat * 4, beat * 4);
      impact(s, t0); tom(s, t0 + beat * 4, 70, 1);
    }
    if (!M.timer) M.timer = setInterval(tick, 25);
    s.step = 0; s.next = 1e12;
  }
  M.victory = function () { fanfare('victory'); };
  M.defeat = function () { fanfare('defeat'); };

  M.trackFor = function (level) { return 'w' + level.world; };

  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => document.addEventListener(ev, () => { if (M.pending) M.play(M.pending); }, true));

  document.addEventListener('visibilitychange', () => {
    if (M.fileAudio) { if (document.hidden) M.fileAudio.pause(); else M.fileAudio.play().catch(() => {}); }
    if (!M.ready) return;
    if (document.hidden) M.ctx.suspend(); else M.ctx.resume();
  });
})(window.HVA);
