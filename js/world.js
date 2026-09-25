(function (H) {
  const G = { W: 964, H: 584, COLS: 9, ROWS: 5, CW: 92, RH: 96, GX: 76, GY: 64 };
  H.G = G;

  function rng(seed) {
    let s = seed >>> 0;
    return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function mix(c1, c2, t) {
    const a = hex(c1), b = hex(c2);
    return 'rgb(' + a.map((v, i) => Math.round(lerp(v, b[i], t))).join(',') + ')';
  }
  function px(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }
  function newCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; }

  const THEMES = {
    city: {
      sky: ['#1a1f4d', '#c9527a'], far: '#2a2f6a', near: '#151a3f', win: '#ffe38a',
      tileA: '#3a4258', tileB: '#333a4f', line: '#232838', mark: '#5b6482', base: '#4a90c9', gravity: 1
    },
    desert: {
      sky: ['#3a2a6a', '#ffb066'], far: '#b0663a', near: '#8f4d2a', win: '#ffe38a',
      tileA: '#d8a869', tileB: '#cf9c5c', line: '#a8773c', mark: '#e6bf85', base: '#e0a040', gravity: 1
    },
    moon: {
      sky: ['#04030d', '#0d1030'], far: '#4b4f66', near: '#2d3044', win: '#7ffcff',
      tileA: '#8a8fa3', tileB: '#80859a', line: '#5a5e73', mark: '#a9aec2', base: '#7ffcff', gravity: 0.35
    },
    alien: {
      sky: ['#2a0a4a', '#b03a9a'], far: '#5a1f7a', near: '#3a1257', win: '#ff8af0',
      tileA: '#5b2f7d', tileB: '#54276f', line: '#3a1655', mark: '#7c4aa3', base: '#ff5ad8', gravity: 0.8
    }
  };
  G.THEMES = THEMES;

  function skyBand(g, th, w, h) {
    for (let y = 0; y < h; y += 4) px(g, 0, y, w, 4, mix(th.sky[0], th.sky[1], y / h));
  }

  function drawCity(g, th, r) {
    for (let layer = 0; layer < 2; layer++) {
      const col = layer ? th.near : th.far;
      let x = -10;
      while (x < G.W) {
        const w = 18 + Math.floor(r() * 26), h = (layer ? 30 : 46) + Math.floor(r() * (layer ? 26 : 34));
        const y = G.GY - h + 10;
        px(g, x, y, w, h + 10, col);
        px(g, x, y, w, 3, layer ? '#242b62' : '#3a4190');
        if (r() > 0.6) px(g, x + w / 2 - 1, y - 12, 2, 12, col);
        for (let wy = y + 8; wy < G.GY - 4; wy += 8) for (let wx = x + 4; wx < x + w - 4; wx += 8) if (r() > 0.55) px(g, wx, wy, 4, 4, th.win);
        x += w + 2 + Math.floor(r() * 6);
      }
    }
  }
  function drawDesert(g, th, r) {
    for (let x = 0; x < G.W; x += 4) {
      const h1 = 20 + Math.sin(x / 90) * 12 + Math.sin(x / 33) * 4;
      px(g, x, G.GY - h1, 4, h1 + 10, th.far);
      const h2 = 10 + Math.sin(x / 60 + 2) * 8;
      px(g, x, G.GY - h2, 4, h2 + 10, th.near);
    }
    for (let i = 0; i < 4; i++) {
      const x = 90 + i * 240 + Math.floor(r() * 40);
      px(g, x, G.GY - 40, 46, 30, '#6d7386'); px(g, x, G.GY - 40, 46, 4, '#9aa0b8'); px(g, x + 6, G.GY - 26, 12, 16, '#2c3040');
      px(g, x + 30, G.GY - 56, 3, 18, '#9aa0b8'); px(g, x + 24, G.GY - 60, 15, 4, '#c9cee4'); px(g, x + 32, G.GY - 62, 2, 2, '#ff5a3a');
    }
    px(g, 760, 8, 26, 26, '#ffe6a8'); px(g, 764, 4, 18, 34, '#ffe6a8'); px(g, 756, 12, 34, 18, '#ffe6a8');
  }
  function drawMoon(g, th, r) {
    for (let i = 0; i < 90; i++) px(g, Math.floor(r() * G.W), Math.floor(r() * (G.GY + 20)), 2, 2, '#ffffff');
    const ex = 800, ey = 30;
    for (let y = -22; y <= 22; y++) { const hw = Math.floor(Math.sqrt(22 * 22 - y * y)); px(g, ex - hw, ey + y, hw * 2, 1, y < 0 ? '#3d7bd9' : '#2a5ab0'); }
    px(g, ex - 12, ey - 10, 10, 6, '#3fae5b'); px(g, ex + 2, ey + 2, 12, 8, '#3fae5b'); px(g, ex - 6, ey - 14, 14, 3, '#ffffff'); px(g, ex - 2, ey + 12, 10, 3, '#ffffff');
    for (let x = 0; x < G.W; x += 4) {
      const h1 = 14 + Math.sin(x / 70) * 8;
      px(g, x, G.GY - h1, 4, h1 + 10, th.far);
    }
    for (let i = 0; i < 5; i++) {
      const x = 60 + i * 190 + Math.floor(r() * 50), w = 50 + Math.floor(r() * 24);
      for (let y = -26; y <= 0; y++) { const hw = Math.floor(Math.sqrt(Math.max(0, 1 - (y / 26) * (y / 26))) * w / 2); px(g, x + w / 2 - hw, G.GY - 4 + y, hw * 2, 1, y < -20 ? '#9aa0bf' : '#5a5f7d'); }
      px(g, x + 10, G.GY - 22, 8, 6, '#7ffcff'); px(g, x + w - 20, G.GY - 22, 8, 6, '#7ffcff');
      px(g, x, G.GY - 4, w, 8, '#3a3e58');
    }
  }
  function drawAlien(g, th, r) {
    for (let i = 0; i < 40; i++) px(g, Math.floor(r() * G.W), Math.floor(r() * 40), 2, 2, '#ffd0f8');
    for (let y = -26; y <= 26; y++) { const hw = Math.floor(Math.sqrt(26 * 26 - y * y)); px(g, 130 - hw, 26 + y, hw * 2, 1, y < 0 ? '#f0a0e0' : '#c060b0'); }
    for (let y = -14; y <= 14; y++) { const hw = Math.floor(Math.sqrt(14 * 14 - y * y)); px(g, 640 - hw, 24 + y, hw * 2, 1, '#8ad0ff'); }
    for (let x = 0; x < G.W; x += 4) px(g, x, G.GY - (14 + Math.sin(x / 55) * 8), 4, 40, th.far);
    for (let i = 0; i < 13; i++) {
      const x = 20 + i * 76 + Math.floor(r() * 30), h = 24 + Math.floor(r() * 30), w = 8 + Math.floor(r() * 10);
      const col = r() > 0.5 ? '#a05ad0' : '#5ad0e0';
      for (let y = 0; y < h; y++) px(g, x + Math.floor(y * 0.15), G.GY + 6 - y, Math.max(2, w - Math.floor(y * w / h)), 1, y % 6 < 3 ? col : mix('#ffffff', col, 0.4));
    }
    for (let i = 0; i < 3; i++) {
      const x = 150 + i * 280;
      px(g, x, G.GY - 42, 10, 46, '#3a1257'); px(g, x - 8, G.GY - 50, 26, 10, '#6a2a9a'); px(g, x - 4, G.GY - 56, 18, 8, '#8a3ab8'); px(g, x + 2, G.GY - 46, 6, 4, '#ff8af0');
    }
  }

  function buildBase(g, th) {
    px(g, 0, G.GY, G.GX, G.RH * G.ROWS, '#1c2233');
    for (let r = 0; r < G.ROWS; r++) {
      const y = G.GY + r * G.RH;
      px(g, 0, y, G.GX - 8, G.RH, '#2a3350'); px(g, 0, y + 2, G.GX - 8, 4, '#3d4a73'); px(g, 0, y + G.RH - 6, G.GX - 8, 4, '#171c2e');
      for (let i = 0; i < 4; i++) px(g, 6 + i * 14, y + 12, 8, 6, i % 2 ? '#1d2440' : '#54c7ff');
      px(g, 8, y + 30, G.GX - 30, 30, '#1f2640'); px(g, 10, y + 32, G.GX - 34, 26, '#141a2e');
      px(g, 14, y + 40, 26, 8, th.base); px(g, 14, y + 40, 26, 2, '#ffffff');
      px(g, G.GX - 24, y + 36, 14, 16, '#3d4a73'); px(g, G.GX - 12, y + 40, 8, 8, '#54c7ff');
      px(g, 0, y + G.RH - 1, G.GX, 1, '#0b0f1c');
    }
    px(g, G.GX - 8, G.GY, 8, G.RH * G.ROWS, '#ffcf40');
    for (let y = G.GY; y < G.GY + G.RH * G.ROWS; y += 16) px(g, G.GX - 8, y, 8, 8, '#1a1a1a');
  }

  function buildSpawn(g, th) {
    const x0 = G.GX + G.COLS * G.CW;
    px(g, x0, G.GY, G.W - x0, G.RH * G.ROWS, mix('#000000', th.tileA, 0.45));
    for (let r = 0; r < G.ROWS; r++) {
      const y = G.GY + r * G.RH;
      px(g, x0 + 6, y + 10, 14, G.RH - 20, '#ff3b6b');
      px(g, x0 + 8, y + 12, 10, G.RH - 24, '#7a0f2a');
      px(g, x0 + 24, y + 4, 6, G.RH - 8, '#ffcf40');
    }
  }

  G.extraBg = {}; G.extraDeco = {}; G.extraFx = {};
  G.buildBackground = function (themeName, seed) {
    const th = THEMES[themeName], r = rng(seed || 7);
    const [c, g] = newCanvas(G.W, G.H);
    px(g, 0, 0, G.W, G.H, '#0b0d1a');
    skyBand(g, th, G.W, G.GY + 20);
    if (themeName === 'city') drawCity(g, th, r);
    if (themeName === 'desert') drawDesert(g, th, r);
    if (themeName === 'moon') drawMoon(g, th, r);
    if (themeName === 'alien') drawAlien(g, th, r);
    if (G.extraBg[themeName]) G.extraBg[themeName](g, th, r);
    px(g, 0, G.GY - 4, G.W, 4, th.line);
    for (let row = 0; row < G.ROWS; row++) for (let col = 0; col < G.COLS; col++) {
      const x = G.GX + col * G.CW, y = G.GY + row * G.RH;
      px(g, x, y, G.CW, G.RH, (row + col) % 2 ? th.tileA : th.tileB);
      px(g, x, y, G.CW, 3, mix(th.tileA, '#ffffff', 0.12));
      px(g, x, y + G.RH - 3, G.CW, 3, mix(th.tileA, '#000000', 0.28));
      px(g, x + G.CW - 2, y, 2, G.RH, mix(th.tileA, '#000000', 0.12));
    }
    for (let row = 0; row <= G.ROWS; row++) px(g, G.GX, G.GY + row * G.RH - 2, G.COLS * G.CW, 3, th.line);
    for (let col = 0; col <= G.COLS; col++) for (let y = G.GY; y < G.GY + G.RH * G.ROWS; y += 8) px(g, G.GX + col * G.CW - 1, y, 2, 4, mix(th.line, th.mark, 0.5));
    for (let row = 0; row < G.ROWS; row++) for (let i = 0; i < 6; i++) {
      const x = G.GX + Math.floor(r() * (G.COLS * G.CW - 12)), y = G.GY + row * G.RH + 10 + Math.floor(r() * (G.RH - 22));
      if (themeName === 'moon') { px(g, x, y, 10, 2, th.line); px(g, x + 2, y + 2, 6, 2, th.line); }
      else if (themeName === 'alien') { px(g, x, y, 4, 4, r() > 0.5 ? '#7ffcff' : '#ff8af0'); px(g, x + 1, y - 3, 2, 3, '#a05ad0'); }
      else if (themeName === 'desert') { px(g, x, y, 8, 2, th.line); px(g, x + 3, y - 2, 3, 2, th.mark); }
      else if (G.extraDeco[themeName]) G.extraDeco[themeName](g, th, r, x, y);
      else { px(g, x, y, 12, 2, th.mark); }
    }
    buildBase(g, th);
    buildSpawn(g, th);
    px(g, 0, G.GY + G.RH * G.ROWS, G.W, G.H - (G.GY + G.RH * G.ROWS), '#0b0d1a');
    px(g, 0, G.GY + G.RH * G.ROWS, G.W, 4, th.line);
    return c;
  };

  G.Fx = {
    theme: 'city', items: [], t: 0, stars: [],
    init(theme) {
      this.theme = theme; this.items = []; this.t = 0;
      const r = rng(99);
      this.stars = [];
      for (let i = 0; i < 26; i++) this.stars.push({ x: Math.floor(r() * G.W), y: Math.floor(r() * 46), p: r() * 6 });
      const n = G.extraFx[theme] ? G.extraFx[theme].n : theme === 'city' ? 3 : theme === 'desert' ? 22 : theme === 'moon' ? 30 : 26;
      for (let i = 0; i < n; i++) this.items.push(this.spawn(true, r));
    },
    spawn(initial, r) {
      r = r || Math.random;
      const th = this.theme;
      if (G.extraFx[th]) return G.extraFx[th].spawn(r);
      if (th === 'city') return { x: initial ? r() * G.W : -30, y: 8 + r() * 30, v: 20 + r() * 25, kind: 'ship' };
      if (th === 'desert') return { x: r() * G.W, y: G.GY + r() * G.RH * 5, v: 60 + r() * 60, len: 8 + Math.floor(r() * 14), kind: 'dust' };
      if (th === 'moon') return { x: r() * G.W, y: G.GY + r() * G.RH * 5, vx: 4 + r() * 6, vy: -(3 + r() * 6), kind: 'moondust', p: r() * 6 };
      return { x: r() * G.W, y: G.GY + r() * G.RH * 5, vy: -(8 + r() * 14), p: r() * 6, kind: 'spore', c: r() > 0.5 ? '#ff8af0' : '#7ffcff' };
    },
    update(dt) {
      this.t += dt;
      const th = this.theme;
      for (let i = 0; i < this.items.length; i++) {
        const it = this.items[i];
        if (it.kind === 'gen') { it.x += (it.vx + Math.sin(this.t * (it.f || 1) + it.p) * (it.wob || 0)) * dt; it.y += it.vy * dt; if (it.y < G.GY - 8 || it.y > G.GY + G.RH * 5 + 4 || it.x < -10 || it.x > G.W + 10) G.extraFx[th].respawn(it); }
        else if (it.kind === 'ship') { it.x += it.v * dt; if (it.x > G.W + 30) this.items[i] = this.spawn(false); }
        else if (it.kind === 'dust') { it.x -= it.v * dt; if (it.x < -20) { it.x = G.W + 10; it.y = G.GY + Math.random() * G.RH * 5; } }
        else if (it.kind === 'moondust') { it.x += it.vx * dt; it.y += it.vy * dt; if (it.y < G.GY - 4 || it.x > G.W) { it.x = Math.random() * G.W; it.y = G.GY + G.RH * 5; } }
        else { it.y += it.vy * dt; it.x += Math.sin(this.t + it.p) * 8 * dt; if (it.y < G.GY - 6) { it.y = G.GY + G.RH * 5; it.x = Math.random() * G.W; } }
      }
    },
    draw(g) {
      const t = this.t, th = this.theme;
      if (th === 'moon' || th === 'alien' || th === 'void') {
        this.stars.forEach(s => { if (Math.sin(t * 2 + s.p) > -0.2) { g.fillStyle = '#fff'; g.globalAlpha = th === 'alien' ? 0.5 : 0.9; g.fillRect(s.x, s.y, 2, 2); } });
        g.globalAlpha = 1;
      }
      this.items.forEach(it => {
        if (it.kind === 'gen') {
          g.globalAlpha = it.a * (it.tw ? 0.6 + 0.4 * Math.sin(t * 3 + it.p) : 1); g.fillStyle = it.c; g.fillRect(Math.round(it.x), Math.round(it.y), it.s, it.s); g.globalAlpha = 1;
        } else if (it.kind === 'ship') {
          g.fillStyle = '#2a1f4a'; g.fillRect(it.x, it.y, 22, 5); g.fillRect(it.x + 6, it.y - 4, 10, 4);
          g.fillStyle = '#5cf7ff'; g.fillRect(it.x + 8, it.y - 3, 6, 2);
          g.fillStyle = Math.floor(t * 4) % 2 ? '#ff5ad8' : '#ffe14a'; g.fillRect(it.x + 3, it.y + 2, 2, 2); g.fillRect(it.x + 17, it.y + 2, 2, 2);
        } else if (it.kind === 'dust') {
          g.globalAlpha = 0.35; g.fillStyle = '#fff2cf'; g.fillRect(it.x, it.y, it.len, 2); g.globalAlpha = 1;
        } else if (it.kind === 'moondust') {
          g.globalAlpha = 0.5 + 0.3 * Math.sin(t * 2 + it.p); g.fillStyle = '#d8dcf0'; g.fillRect(it.x, it.y, 2, 2); g.globalAlpha = 1;
        } else {
          g.globalAlpha = 0.5 + 0.4 * Math.sin(t * 3 + it.p); g.fillStyle = it.c; g.fillRect(Math.round(it.x), Math.round(it.y), 3, 3); g.globalAlpha = 1;
        }
      });
    }
  };

  H.MenuScene = {
    t: 0, stars: [], ships: [], bolts: [], bg: null,
    init() {
      const r = rng(5);
      this.stars = []; for (let i = 0; i < 70; i++) this.stars.push({ x: r() * 320, y: r() * 90, p: r() * 6 });
      this.ships = []; for (let i = 0; i < 4; i++) this.ships.push({ x: r() * 320, y: 12 + r() * 40, v: 4 + r() * 6, s: 0.8 + r() * 0.6 });
      const [c, g] = newCanvas(320, 180);
      for (let y = 0; y < 180; y += 2) px(g, 0, y, 320, 2, mix('#0a0a2a', '#ff6a9a', Math.pow(y / 130, 1.6)));
      for (let layer = 0; layer < 3; layer++) {
        const cols = ['#3a2a6a', '#241a4d', '#140f33'], base = 120 + layer * 6;
        let x = -4;
        while (x < 320) {
          const w = 8 + Math.floor(r() * 14), h = 20 + layer * 6 + Math.floor(r() * (36 - layer * 6));
          px(g, x, base - h, w, h + 60, cols[layer]);
          if (r() > 0.7) px(g, x + w / 2, base - h - 8, 1, 8, cols[layer]);
          for (let wy = base - h + 3; wy < base - 2; wy += 4) for (let wx = x + 2; wx < x + w - 2; wx += 4) if (r() > 0.55) px(g, wx, wy, 2, 2, layer === 0 ? '#8a7ad0' : '#ffe38a');
          x += w + Math.floor(r() * 3);
        }
      }
      px(g, 0, 148, 320, 40, '#0d0a24'); px(g, 0, 148, 320, 2, '#54c7ff');
      for (let x = 0; x < 320; x += 16) px(g, x, 156, 8, 1, '#3a3a7a');
      this.bg = c;
    },
    update(dt) {
      this.t += dt;
      this.ships.forEach(s => { s.x += s.v * dt; if (s.x > 340) { s.x = -20; s.y = 12 + Math.random() * 40; } });
      if (Math.random() < dt * 1.2) this.bolts.push({ x: 60 + Math.random() * 200, y: 146, vy: -60, vx: (Math.random() - 0.5) * 30, life: 1.2 });
      this.bolts.forEach(b => { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; });
      this.bolts = this.bolts.filter(b => b.life > 0);
    },
    draw(ctx, W, Hh) {
      const [c, g] = this._buf || (this._buf = newCanvas(320, 180));
      g.drawImage(this.bg, 0, 0);
      const t = this.t;
      this.stars.forEach(s => { if (Math.sin(t * 2 + s.p) > -0.3) px(g, Math.floor(s.x), Math.floor(s.y), 1, 1, '#fff'); });
      this.ships.forEach(s => {
        const x = Math.floor(s.x), y = Math.floor(s.y + Math.sin(t + s.x) * 1.5);
        px(g, x, y, 14, 3, '#3a2470'); px(g, x + 3, y - 2, 8, 2, '#5cf7ff'); px(g, x + 1, y + 1, 12, 1, '#7b52c9');
        px(g, x + 2, y + 1, 1, 1, Math.floor(t * 3) % 2 ? '#ff5ad8' : '#ffe14a'); px(g, x + 11, y + 1, 1, 1, Math.floor(t * 3) % 2 ? '#ffe14a' : '#ff5ad8');
        if (Math.floor(t * 0.5 + s.y) % 5 === 0) { px(g, x + 6, y + 3, 2, 30, 'rgba(255,90,216,0.25)'); }
      });
      this.bolts.forEach(b => { px(g, Math.floor(b.x), Math.floor(b.y), 1, 4, '#54c7ff'); px(g, Math.floor(b.x), Math.floor(b.y) + 1, 1, 2, '#fff'); });
      ctx.imageSmoothingEnabled = false;
      const s = Math.max(W / 320, Hh / 180), dw = 320 * s, dh = 180 * s;
      ctx.drawImage(c, (W - dw) / 2, (Hh - dh) / 2, dw, dh);
    }
  };
})(window.HVA);
