(function (H) {
  const G = H.G;
  const px = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

  Object.assign(G.THEMES, {
    ice: { sky: ['#0d1f4a', '#9fd8f0'], far: '#7aa8d8', near: '#b8d8f0', win: '#e8fbff', tileA: '#a8c8e8', tileB: '#9cbfe0', line: '#6a8ab8', mark: '#d8ecfb', base: '#5cf7ff', gravity: 1 },
    lava: { sky: ['#1a0a0a', '#c23a1a'], far: '#4a1a14', near: '#2a0e0c', win: '#ff8a2a', tileA: '#4a3a3a', tileB: '#413232', line: '#2a1c1c', mark: '#ff5a1a', base: '#ff8a2a', gravity: 1 },
    ocean: { sky: ['#021a3a', '#1a7a9a'], far: '#0e4a70', near: '#0a2f52', win: '#7ffcff', tileA: '#2a6a8a', tileB: '#256280', line: '#153f5a', mark: '#5ab8d8', base: '#7ffcff', gravity: 0.7 },
    void: { sky: ['#02000a', '#2a0a5a'], far: '#1a0a3a', near: '#0e0620', win: '#ff5ad8', tileA: '#2a1a4a', tileB: '#251544', line: '#140a2a', mark: '#7a3ab8', base: '#a04aff', gravity: 0.5 }
  });

  G.extraBg.ice = (g, th, r) => {
    for (let i = 0; i < 70; i++) px(g, Math.floor(r() * G.W), Math.floor(r() * 30), 2, 2, '#ffffff');
    for (let x = 0; x < G.W; x += 4) {
      const h1 = 26 + Math.sin(x / 70) * 14 + Math.sin(x / 25) * 4;
      px(g, x, G.GY - h1, 4, h1 + 10, th.far); px(g, x, G.GY - h1, 4, 3, '#ffffff');
    }
    for (let i = 0; i < 6; i++) {
      const x = 40 + i * 160 + Math.floor(r() * 40), h = 26 + Math.floor(r() * 24);
      for (let y = 0; y < h; y++) px(g, x + Math.floor(y * 0.3), G.GY - y + 6, Math.max(2, 14 - Math.floor(y * 14 / h)), 1, y % 5 < 2 ? '#e8fbff' : '#8ac8f0');
    }
    for (let i = 0; i < 5; i++) { const x = 60 + i * 190; px(g, x, G.GY - 30, 4, 34, '#5a3a1a'); px(g, x - 8, G.GY - 26, 20, 6, '#2a5a3a'); px(g, x - 5, G.GY - 34, 14, 6, '#2a5a3a'); px(g, x - 8, G.GY - 27, 20, 2, '#ffffff'); }
  };
  G.extraBg.lava = (g, th, r) => {
    for (let x = 0; x < G.W; x += 4) {
      const h1 = 30 + Math.sin(x / 80) * 18 + Math.sin(x / 27) * 5;
      px(g, x, G.GY - h1, 4, h1 + 10, th.far);
    }
    for (let i = 0; i < 4; i++) {
      const x = 90 + i * 230, h = 46 + Math.floor(r() * 20);
      for (let y = 0; y < h; y++) { const w = Math.max(4, 70 - Math.floor(y * 1.15)); px(g, x + (70 - w) / 2, G.GY - y + 6, w, 1, y % 7 < 3 ? '#2a0e0c' : '#3a1612'); }
      px(g, x + 26, G.GY - h + 4, 18, 4, '#ff5a1a'); px(g, x + 30, G.GY - h - 2, 10, 6, '#ffb02a');
    }
    for (let x = 0; x < G.W; x += 4) px(g, x, G.GY - 6 + Math.floor(Math.sin(x / 9) * 2), 4, 6, '#ff5a1a');
  };
  G.extraBg.ocean = (g, th, r) => {
    for (let y = 0; y < 60; y += 6) px(g, 0, y, G.W, 2, 'rgba(255,255,255,0.05)');
    for (let i = 0; i < 4; i++) { const x = 70 + i * 240; px(g, x, 0, 24, G.GY, 'rgba(160,240,255,0.06)'); }
    for (let x = 0; x < G.W; x += 4) { const h1 = 22 + Math.sin(x / 60) * 12 + Math.sin(x / 19) * 4; px(g, x, G.GY - h1, 4, h1 + 10, th.far); }
    for (let i = 0; i < 9; i++) {
      const x = 20 + i * 108 + Math.floor(r() * 30), h = 16 + Math.floor(r() * 24), c = ['#ff5a8a', '#ffb02a', '#a04aff'][i % 3];
      for (let k = 0; k < 3; k++) { px(g, x + k * 6, G.GY - h + k * 4, 3, h - k * 4 + 6, c); px(g, x + k * 6 - 2, G.GY - h + k * 4, 7, 3, c); }
    }
    for (let i = 0; i < 26; i++) px(g, Math.floor(r() * G.W), Math.floor(r() * (G.GY - 10)), 3, 3, 'rgba(200,250,255,0.35)');
  };
  G.extraBg.void = (g, th, r) => {
    for (let i = 0; i < 120; i++) px(g, Math.floor(r() * G.W), Math.floor(r() * (G.GY + 10)), 2, 2, ['#ffffff', '#a08aff', '#ff8af0'][i % 3]);
    for (let i = 0; i < 40; i++) { const x = Math.floor(r() * G.W), y = Math.floor(r() * G.GY); px(g, x, y, 60 + Math.floor(r() * 80), 14, 'rgba(120,40,200,0.06)'); }
    px(g, 700, 6, 50, 50, '#12082a'); px(g, 694, 12, 62, 38, '#12082a'); px(g, 706, 0, 38, 62, '#12082a');
    px(g, 690, 24, 70, 4, '#ff5ad8'); px(g, 694, 20, 62, 2, '#a04aff');
    for (let i = 0; i < 5; i++) { const x = 60 + i * 190; px(g, x, G.GY - 26, 3, 30, '#3a1a6a'); px(g, x - 5, G.GY - 30, 13, 8, '#7a3ab8'); px(g, x - 2, G.GY - 28, 7, 3, '#ff5ad8'); }
    for (let x = 0; x < G.W; x += 4) { const h1 = 10 + Math.sin(x / 70) * 6; px(g, x, G.GY - h1, 4, h1 + 10, th.near); }
  };

  G.extraDeco.ice = (g, th, r, x, y) => { px(g, x, y, 10, 2, th.mark); px(g, x + 2, y - 2, 5, 2, '#ffffff'); };
  G.extraDeco.lava = (g, th, r, x, y) => { px(g, x, y, 12, 2, '#ff5a1a'); px(g, x + 3, y + 2, 5, 1, '#ffb02a'); };
  G.extraDeco.ocean = (g, th, r, x, y) => { px(g, x, y, 4, 4, 'rgba(200,250,255,0.5)'); px(g, x + 1, y + 1, 1, 1, '#ffffff'); px(g, x + 8, y + 4, 8, 2, th.mark); };
  G.extraDeco.void = (g, th, r, x, y) => { px(g, x, y, 3, 3, r() > 0.5 ? '#ff5ad8' : '#a04aff'); px(g, x + 1, y - 3, 1, 3, '#ffffff'); };

  const rnd = r => (r || Math.random)();
  const gen = (o) => Object.assign({ kind: 'gen', p: Math.random() * 6, a: 0.6, tw: false, s: 2, f: 1, wob: 0, vx: 0, vy: 0, c: '#fff' }, o);
  G.extraFx.ice = {
    n: 46,
    spawn(r) { return gen({ x: rnd(r) * G.W, y: G.GY + rnd(r) * G.RH * 5, vx: -6 - rnd(r) * 8, vy: 14 + rnd(r) * 22, wob: 10, f: 1.5, c: '#ffffff', a: 0.85, s: rnd(r) > 0.7 ? 3 : 2 }); },
    respawn(it) { it.y = G.GY - 6; it.x = Math.random() * G.W; }
  };
  G.extraFx.lava = {
    n: 30,
    spawn(r) { return gen({ x: rnd(r) * G.W, y: G.GY + rnd(r) * G.RH * 5, vx: 0, vy: -(14 + rnd(r) * 30), wob: 12, f: 2, c: rnd(r) > 0.5 ? '#ff8a2a' : '#ffe14a', a: 0.85, tw: true, s: 3 }); },
    respawn(it) { it.y = G.GY + G.RH * 5; it.x = Math.random() * G.W; }
  };
  G.extraFx.ocean = {
    n: 32,
    spawn(r) { return gen({ x: rnd(r) * G.W, y: G.GY + rnd(r) * G.RH * 5, vx: 0, vy: -(10 + rnd(r) * 22), wob: 8, f: 2, c: '#c8faff', a: 0.55, tw: true, s: rnd(r) > 0.6 ? 4 : 2 }); },
    respawn(it) { it.y = G.GY + G.RH * 5; it.x = Math.random() * G.W; }
  };
  G.extraFx.void = {
    n: 28,
    spawn(r) { return gen({ x: rnd(r) * G.W, y: G.GY + rnd(r) * G.RH * 5, vx: -(4 + rnd(r) * 10), vy: -(2 + rnd(r) * 6), wob: 4, f: 1, c: rnd(r) > 0.5 ? '#ff8af0' : '#a08aff', a: 0.7, tw: true, s: 2 }); },
    respawn(it) { it.x = G.W + 6; it.y = G.GY + Math.random() * G.RH * 5; }
  };
})(window.HVA);
