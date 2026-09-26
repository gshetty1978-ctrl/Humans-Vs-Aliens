(function (H) {
  const G = H.G;
  const px = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

  Object.assign(G.THEMES, {
    jungle: { sky: ['#06200f', '#8ad06a'], far: '#1e5a2a', near: '#123a1a', win: '#c8ff6a', tileA: '#3a6a3a', tileB: '#346034', line: '#1e3e1e', mark: '#6aa04a', base: '#c8ff6a', gravity: 1 },
    storm: { sky: ['#06061a', '#5a6a9a'], far: '#3a4470', near: '#252c52', win: '#ffe14a', tileA: '#4a5478', tileB: '#434c70', line: '#2a3050', mark: '#8a9ac8', base: '#7ab8ff', gravity: 1 },
    ruins: { sky: ['#4a1a0a', '#ffd070'], far: '#b8843a', near: '#8a5a22', win: '#ffe38a', tileA: '#d8b878', tileB: '#cfae6c', line: '#a08040', mark: '#f0d698', base: '#2a7aaa', gravity: 1 },
    tech: { sky: ['#01060f', '#0a4a6a'], far: '#0e2a3e', near: '#081a2a', win: '#3aff8a', tileA: '#1e3a4e', tileB: '#1a3446', line: '#0e2030', mark: '#3aa0c8', base: '#3aff8a', gravity: 1 }
  });

  G.extraBg.jungle = (g, th, r) => {
    for (let x = 0; x < G.W; x += 4) { const h = 24 + Math.sin(x / 70) * 12 + Math.sin(x / 23) * 5; px(g, x, G.GY - h, 4, h + 10, th.far); }
    for (let i = 0; i < 7; i++) {
      const x = 30 + i * 140 + Math.floor(r() * 40), h = 48 + Math.floor(r() * 20);
      px(g, x, G.GY - h, 8, h + 6, '#2a1a0a'); px(g, x - 20, G.GY - h - 8, 48, 14, '#1e6a2a'); px(g, x - 12, G.GY - h - 18, 32, 12, '#2a8a34'); px(g, x - 26, G.GY - h - 2, 20, 8, '#1e6a2a');
      for (let v = 0; v < 3; v++) px(g, x - 14 + v * 14, G.GY - h + 4, 2, 14 + (v * 7) % 12, '#3aaa3a');
    }
    for (let x = 0; x < G.W; x += 4) px(g, x, G.GY - 5 + Math.floor(Math.sin(x / 11) * 1.5), 4, 6, '#2a7a4a');
    for (let i = 0; i < 24; i++) px(g, Math.floor(r() * G.W), G.GY - 12 - Math.floor(r() * 60), 2, 2, '#c8ff6a');
  };
  G.extraBg.storm = (g, th, r) => {
    for (let i = 0; i < 5; i++) { const y = 4 + i * 8; px(g, 0, y, G.W, 10, 'rgba(20,20,50,0.35)'); }
    for (let i = 0; i < 4; i++) px(g, Math.floor(r() * 800), 0, 120 + Math.floor(r() * 100), 26, 'rgba(30,34,70,0.7)');
    for (let i = 0; i < 6; i++) {
      const x = -20 + i * 190, h = 48 + Math.floor(r() * 30);
      for (let y = 0; y < h; y++) { const w = Math.max(4, 150 - Math.floor(y * 3)); px(g, x + (150 - w) / 2, G.GY - y + 6, w, 1, y % 6 < 3 ? th.far : th.near); }
      px(g, x + 66, G.GY - h + 4, 18, 6, '#ffffff');
    }
    px(g, 300, 0, 3, 20, '#ffe14a'); px(g, 296, 20, 3, 14, '#ffe14a'); px(g, 300, 34, 3, 20, '#ffe14a'); px(g, 296, 44, 12, 3, '#ffe14a');
    px(g, 760, 0, 3, 16, '#ffffff'); px(g, 756, 16, 3, 14, '#ffffff'); px(g, 760, 30, 3, 20, '#ffffff');
  };
  G.extraBg.ruins = (g, th, r) => {
    px(g, 700, 14, 44, 44, '#fff2b0'); px(g, 694, 20, 56, 32, '#fff2b0'); px(g, 706, 8, 32, 56, '#fff2b0');
    for (let x = 0; x < G.W; x += 4) { const h = 16 + Math.sin(x / 100) * 8; px(g, x, G.GY - h, 4, h + 10, th.far); }
    [[120, 80], [560, 64], [820, 44]].forEach(([x, h]) => { for (let y = 0; y < h; y++) px(g, x - Math.round((h - y) * 0.9), G.GY - y + 6, Math.round((h - y) * 1.8), 1, y % 5 < 3 ? '#c8983a' : '#a87a2a'); px(g, x - 2, G.GY - h - 2, 4, 4, '#ffcf3a'); });
    for (let i = 0; i < 6; i++) { const x = 30 + i * 155, h = 44 + (i % 2) * 14; px(g, x, G.GY - h, 12, h + 6, '#e8c878'); px(g, x - 3, G.GY - h - 4, 18, 6, '#f0d698'); px(g, x - 3, G.GY, 18, 4, '#c8983a'); px(g, x + 2, G.GY - h + 10, 8, 2, '#2a7aaa'); }
  };
  G.extraBg.tech = (g, th, r) => {
    for (let i = 0; i < 90; i++) px(g, Math.floor(r() * G.W), Math.floor(r() * (G.GY - 4)), 2, 2, '#1a4a6a');
    for (let i = 0; i < 9; i++) {
      const x = 10 + i * 108 + Math.floor(r() * 20), h = 36 + Math.floor(r() * 44);
      px(g, x, G.GY - h, 50, h + 6, th.far); px(g, x, G.GY - h, 50, 3, '#3aa0c8');
      for (let y = G.GY - h + 8; y < G.GY - 4; y += 8) for (let xx = x + 4; xx < x + 46; xx += 8) if (r() > 0.4) px(g, xx, y, 4, 4, r() > 0.5 ? '#3aff8a' : '#3aa0c8');
    }
    for (let x = 0; x < G.W; x += 24) px(g, x, G.GY - 6, 16, 2, '#3aa0c8');
    px(g, 0, G.GY - 12, G.W, 2, '#0e4a6a');
  };

  G.extraDeco.jungle = (g, th, r, x, y) => { px(g, x, y, 4, 8, '#2a8a34'); px(g, x - 4, y + 2, 12, 3, '#3aaa3a'); px(g, x + 6, y - 2, 3, 3, '#c8ff6a'); };
  G.extraDeco.storm = (g, th, r, x, y) => { px(g, x, y, 10, 2, th.mark); px(g, x + 3, y - 2, 3, 2, '#7ab8ff'); };
  G.extraDeco.ruins = (g, th, r, x, y) => { px(g, x, y, 12, 2, th.line); px(g, x + 3, y + 3, 6, 2, '#2a7aaa'); px(g, x + 8, y - 2, 3, 3, '#ffcf3a'); };
  G.extraDeco.tech = (g, th, r, x, y) => { px(g, x, y, 14, 2, '#3aa0c8'); px(g, x + 12, y - 4, 2, 6, '#3aa0c8'); px(g, x + 10, y - 6, 6, 2, '#3aff8a'); };

  const rnd = r => (r || Math.random)();
  const gen = o => Object.assign({ kind: 'gen', p: Math.random() * 6, a: 0.6, tw: false, s: 2, f: 1, wob: 0, vx: 0, vy: 0, c: '#fff' }, o);
  G.extraFx.jungle = {
    n: 34,
    spawn(r) { return gen({ x: rnd(r) * G.W, y: G.GY + rnd(r) * G.RH * 5, vx: 0, vy: -(5 + rnd(r) * 12), wob: 14, f: 1.5, c: rnd(r) > 0.3 ? '#c8ff6a' : '#8aff9a', a: 0.9, tw: true, s: 3 }); },
    respawn(it) { it.y = G.GY + G.RH * 5; it.x = Math.random() * G.W; }
  };
  G.extraFx.storm = {
    n: 50,
    spawn(r) { return gen({ x: rnd(r) * G.W, y: G.GY + rnd(r) * G.RH * 5, vx: -40 - rnd(r) * 30, vy: 200 + rnd(r) * 120, c: '#a8c8ff', a: 0.55, s: 2 }); },
    respawn(it) { it.y = G.GY - 6; it.x = Math.random() * (G.W + 100); }
  };
  G.extraFx.ruins = {
    n: 30,
    spawn(r) { return gen({ x: rnd(r) * G.W, y: G.GY + rnd(r) * G.RH * 5, vx: -(14 + rnd(r) * 26), vy: -(1 + rnd(r) * 5), wob: 4, f: 1, c: rnd(r) > 0.5 ? '#ffe9a8' : '#ffcf3a', a: 0.75, tw: true, s: 2 }); },
    respawn(it) { it.x = G.W + 6; it.y = G.GY + Math.random() * G.RH * 5; }
  };
  G.extraFx.tech = {
    n: 34,
    spawn(r) { return gen({ x: rnd(r) * G.W, y: G.GY + rnd(r) * G.RH * 5, vx: 0, vy: -(18 + rnd(r) * 40), c: rnd(r) > 0.5 ? '#3aff8a' : '#7ffcff', a: 0.8, tw: true, s: rnd(r) > 0.6 ? 3 : 2 }); },
    respawn(it) { it.y = G.GY + G.RH * 5; it.x = Math.random() * G.W; }
  };
})(window.HVA);
