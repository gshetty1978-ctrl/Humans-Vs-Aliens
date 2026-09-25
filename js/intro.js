(function (H) {
  const W = 640, HH = 360, GROUND = 292;
  const T = { s2: 7, s3: 13, s4: 21, s5: 27, s6: 34, end: 40 };
  const FONT = "'Press Start 2P', monospace";
  const lerp = (a, b, k) => a + (b - a) * k;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  function rng(seed) { let s = seed >>> 0; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; }
  function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function mix(c1, c2, k) { const a = hex(c1), b = hex(c2); return 'rgb(' + a.map((v, i) => Math.round(lerp(v, b[i], k))).join(',') + ')'; }

  let cv, cx, buf, g, raf, startT, finishing, doneCb, skipBtn, fired, layers, birds, shake, flash, running;

  function px(x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  function ell(x, y, rx, ry, c) {
    g.fillStyle = c;
    for (let j = -ry; j <= ry; j++) { const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j * j) / (ry * ry)))); g.fillRect(Math.round(x - half), Math.round(y + j), half * 2, 1); }
  }
  function txt(s, x, y, size, col, align, shadow) {
    g.font = size + 'px ' + FONT; g.textAlign = align || 'left'; g.textBaseline = 'alphabetic';
    if (shadow) { g.fillStyle = shadow; g.fillText(s, Math.round(x + Math.max(1, size / 8)), Math.round(y + Math.max(1, size / 8))); }
    g.fillStyle = col; g.fillText(s, Math.round(x), Math.round(y));
  }
  function skyGrad(top, bot, y0, y1) { for (let y = y0; y < y1; y += 4) px(0, y, W, 4, mix(top, bot, clamp((y - y0) / (y1 - y0), 0, 1))); }

  function human(id, x, fy, o) {
    o = o || {};
    const F = H.Sprites.frames[id]; if (!F) return;
    const arr = F[o.anim || 'idle'] || F.idle, fr = arr[Math.floor((o.t || 0) * (o.fps || 4)) % arr.length];
    const sc = o.sc || 0.42, w = F.w * sc, h = F.h * sc;
    if (o.flip) { g.save(); g.translate(Math.round(x), 0); g.scale(-1, 1); g.drawImage(fr, Math.round(-w / 2), Math.round(fy - h), Math.round(w), Math.round(h)); g.restore(); }
    else g.drawImage(fr, Math.round(x - w / 2), Math.round(fy - h), Math.round(w), Math.round(h));
  }
  const CIV = [];
  function loadCivs() { for (let i = 0; i < 8; i++) { const im = new Image(); im.src = H.asset('assets/civ_' + i + '.png'); CIV[i] = im; } }
  function civ(i, x, fy, o) {
    o = o || {};
    const im = CIV[i]; if (!im || !im.complete || !im.naturalWidth) return;
    const sc = o.sc || 0.5, w = Math.round(im.naturalWidth * sc), h = Math.round(im.naturalHeight * sc);
    const bob = o.walk ? Math.round(Math.abs(Math.sin((o.t || 0) * 8)) * 2) : 0, jump = o.jump ? Math.round(Math.abs(Math.sin((o.t || 0) * 7)) * 6) : 0;
    g.save(); g.imageSmoothingEnabled = false;
    if (o.flip) { g.translate(Math.round(x), 0); g.scale(-1, 1); g.drawImage(im, Math.round(-w / 2), fy - h - bob - jump, w, h); }
    else g.drawImage(im, Math.round(x - w / 2), fy - h - bob - jump, w, h);
    g.restore();
  }
  function alien(type, x, fy, sc, f, o) {
    o = o || {};
    const spr = H.Sprites.alien(type, f ? 1 : 0), w = Math.round(spr.width * sc), h = Math.round(spr.height * sc);
    g.save(); if (o.alpha != null) g.globalAlpha = o.alpha;
    g.drawImage(o.sil ? H.Sprites.sil(spr, o.sil) : spr, Math.round(x - w / 2), Math.round(fy - h * (o.grow == null ? 1 : o.grow) + (o.dy || 0)), w, Math.round(h * (o.grow == null ? 1 : o.grow)));
    g.restore();
  }
  function saucer(x, y, w, o) {
    o = o || {};
    const h = w * 0.3, glow = o.glow, dark = o.dark || 0;
    const c1 = mix('#5a3aa0', '#1a0f30', dark), c2 = mix('#7b52c9', '#2a1a58', dark), c3 = mix('#3a2470', '#100820', dark);
    ell(x, y + h * 0.35, w / 2, h * 0.32, c3);
    ell(x, y + h * 0.2, w / 2, h * 0.3, c1);
    ell(x, y, w * 0.24, h * 0.42, mix('#5cf7ff', '#183a48', dark)); ell(x, y - h * 0.08, w * 0.17, h * 0.28, mix('#a8fbff', '#284a58', dark));
    px(x - w * 0.48, y + h * 0.12, w * 0.96, Math.max(1, h * 0.08), c2);
    for (let i = -3; i <= 3; i++) px(x + i * w * 0.13 - 1, y + h * 0.3, Math.max(2, w * 0.03), Math.max(2, w * 0.03), (Math.floor(o.t * 4 + i) % 2) ? '#ff5ad8' : '#ffe14a');
    if (glow) { g.globalAlpha = 0.25; ell(x, y + h * 0.5, w * 0.6, h * 0.5, '#ff3b6b'); g.globalAlpha = 1; }
  }

  function makeLayers() {
    const r = rng(11), mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const gg = c.getContext('2d'); gg.imageSmoothingEnabled = false; return [c, gg]; };
    const [far, f] = mk(1400, 190), [near, n] = mk(1400, 190);
    for (let x = 0; x < 1400; x += 4) { const h = 60 + Math.sin(x / 110) * 26 + Math.sin(x / 37) * 6; f.fillStyle = '#5a6aa8'; f.fillRect(x, 190 - h - 10, 4, h + 10); if (Math.sin(x / 110) > 0.6) { f.fillStyle = '#e8f0ff'; f.fillRect(x, 190 - h - 10, 4, 4); } }
    let x = 520;
    while (x < 1380) {
      const w = 22 + Math.floor(r() * 30), h = 50 + Math.floor(r() * 90);
      f.fillStyle = '#3a4488'; f.fillRect(x, 190 - h, w, h);
      f.fillStyle = '#4a56a0'; f.fillRect(x, 190 - h, w, 3);
      x += w + 3 + Math.floor(r() * 8);
    }
    x = 380;
    while (x < 1400) {
      const w = 26 + Math.floor(r() * 30), h = 60 + Math.floor(r() * 110), col = ['#232a5e', '#2a3270', '#1f2654'][Math.floor(r() * 3)];
      n.fillStyle = col; n.fillRect(x, 190 - h, w, h);
      n.fillStyle = '#4a56b0'; n.fillRect(x, 190 - h, w, 3);
      if (r() > 0.6) { n.fillStyle = col; n.fillRect(x + w / 2 - 1, 190 - h - 12, 2, 12); }
      for (let wy = 190 - h + 8; wy < 184; wy += 8) for (let wx = x + 4; wx < x + w - 4; wx += 8) if (r() > 0.4) { n.fillStyle = '#ffe38a'; n.fillRect(wx, wy, 4, 4); }
      x += w + 2 + Math.floor(r() * 6);
    }
    n.fillStyle = '#b8342a'; n.fillRect(40, 190 - 44, 78, 44); n.fillStyle = '#8a241c'; n.fillRect(40, 190 - 44, 78, 4);
    for (let i = 0; i < 6; i++) { n.fillStyle = '#8a241c'; n.fillRect(40 + 9 + (i % 3) * 22, 190 - 44 + 10 + Math.floor(i / 3) * 0, 3, 34); }
    n.fillStyle = '#e8d8c0'; n.fillRect(66, 190 - 26, 26, 26); n.fillStyle = '#8a241c'; n.fillRect(76, 190 - 26, 6, 26);
    n.fillStyle = '#b8342a'; for (let i = 0; i < 22; i++) n.fillRect(40 + i * 3 + 6, 190 - 44 - Math.round(Math.sin(i / 22 * Math.PI) * 10), 3, 3);
    n.fillStyle = '#cfd4e8'; n.fillRect(126, 190 - 60, 18, 60); n.fillStyle = '#8a90b0'; n.fillRect(126, 190 - 60, 18, 4); n.fillRect(138, 190 - 60, 6, 60);
    n.fillStyle = '#6a4a2a'; n.fillRect(230, 190 - 84, 4, 84); n.fillStyle = '#8a6a4a'; n.fillRect(226, 190 - 40, 12, 40);
    for (let i = 0; i < 6; i++) { n.fillStyle = '#4a7a3a'; n.fillRect(300 + i * 14, 190 - 30, 12, 8 + (i % 2) * 6); n.fillStyle = '#3a6a2a'; n.fillRect(302 + i * 14, 190 - 22, 8, 22); }
    return { far, near };
  }

  function birdsInit() { const r = rng(5); birds = []; for (let i = 0; i < 9; i++) birds.push({ x: r() * 640, y: 40 + r() * 90, vx: 14 + r() * 14, p: r() * 6, s: 0.7 + r() * 0.5 }); }
  function drawBird(b, t, dark) {
    const up = Math.sin(t * 9 + b.p) > 0; g.fillStyle = dark || '#1a1a3a';
    const x = Math.round(b.x), y = Math.round(b.y), s = Math.round(2 * b.s);
    if (up) { g.fillRect(x - 3 * s, y - s, 2 * s, s); g.fillRect(x - s, y, 2 * s, s); g.fillRect(x + s, y - s, 2 * s, s); }
    else { g.fillRect(x - 3 * s, y + s, 2 * s, s); g.fillRect(x - s, y, 2 * s, s); g.fillRect(x + s, y + s, 2 * s, s); }
  }
  function clouds(t, col, alpha, par, yBase, n) {
    const r = rng(23); g.globalAlpha = alpha;
    for (let i = 0; i < n; i++) {
      const w = 60 + r() * 80, x = ((r() * 900 - t * par * 6) % 900 + 900) % 900 - 130, y = yBase + r() * 70;
      ell(x, y, w / 2, 9, col); ell(x - w * 0.15, y - 7, w * 0.28, 8, col); ell(x + w * 0.2, y - 5, w * 0.24, 7, col);
    }
    g.globalAlpha = 1;
  }

  const WALKERS = [[0, 60, 9], [1, 170, -7], [2, 280, 11], [3, 390, -10], [4, 500, 8], [5, 610, -8], [6, 720, 10], [7, 830, -9]];
  const CARS = [['#e8464a', 100, 34], ['#4a9ae8', 500, -28], ['#ffd23f', 800, 22], ['#5ad06a', 1100, -36]];
  function car(x, y, col, dir) {
    px(x, y - 8, 28, 8, col); px(x + 6, y - 14, 15, 7, col); px(x + 8, y - 13, 5, 5, '#bfe8ff'); px(x + 14, y - 13, 5, 5, '#bfe8ff');
    px(x + 2, y, 6, 3, '#111'); px(x + 20, y, 6, 3, '#111'); px(dir > 0 ? x + 26 : x - 1, y - 6, 3, 3, '#fff6a0');
  }
  function ground(camX, alpha) {
    px(0, GROUND, W, HH - GROUND, '#2c3a2a'); px(0, GROUND, W, 5, '#4a8a3a');
    px(0, GROUND + 5, W, 27, '#5a5a6a'); px(0, GROUND + 5, W, 2, '#8a8a9a');
    px(0, GROUND + 32, W, 30, '#2a2a34'); for (let x = -((camX * 1) % 40); x < W; x += 40) px(x, GROUND + 46, 22, 3, '#e8d85a');
    px(0, GROUND + 62, W, HH, '#1c2233');
  }

  function scene1(t) {
    const camX = t * 22;
    skyGrad('#27408a', '#ffc08a', 0, GROUND);
    ell(470, 180, 22, 22, '#fff2c0'); g.globalAlpha = 0.25; ell(470, 180, 40, 40, '#ffe0a0'); g.globalAlpha = 1;
    clouds(t, '#ffe8e0', 0.9, 0.3, 30, 7);
    g.drawImage(layers.far, Math.round(-camX * 0.35), GROUND - 186);
    g.drawImage(layers.near, Math.round(-camX * 0.8), GROUND - 186);
    ground(camX);
    const wx = camX * 0.8 + 262, wa = ((t * 40) % 360);
    px(Math.round(230 - camX * 0.8) - 1, GROUND - 100, 2, 2, '#fff');
    g.save(); g.translate(Math.round(232 - camX * 0.8), GROUND - 100);
    g.fillStyle = '#e8e0d0'; for (let i = 0; i < 4; i++) { const a = wa * Math.PI / 180 + i * Math.PI / 2; for (let k = 3; k < 22; k += 3) g.fillRect(Math.round(Math.cos(a) * k) - 1, Math.round(Math.sin(a) * k) - 1, 3, 3); }
    g.restore();
    birds.forEach(b => { b.x += b.vx * 0.016; if (b.x > W + 10) b.x = -10; drawBird(b, t); });
    CARS.forEach(([col, base, v]) => { const x = ((base + v * t) % 1500 + 1500) % 1500 - camX * 0.6 - 60; car(x, GROUND + 26, col, v); });
    WALKERS.forEach(([id, base, v], i) => { const x = ((base + v * t) % 1000 + 1000) % 1000 - camX * 0.9; civ(id, x, GROUND + 16 + (i % 2) * 4, { t: t + i, flip: v < 0, walk: true }); });
    const a = seg(t, 1, 2.2) * (1 - seg(t, 5.6, 6.6));
    if (a > 0) { g.globalAlpha = a; txt('Earth. 2047.', W / 2, 62, 14, '#ffffff', 'center', '#1a2a5a'); g.globalAlpha = 1; }
  }

  function scene2(lt) {
    const cy = ease(lt / 5.5) * 78, dark = clamp(lt / 6, 0, 1);
    g.save(); g.translate(0, -78 + cy);
    skyGrad(mix('#27408a', '#12061e', dark), mix('#ffc08a', '#7a1a3a', dark), -80, GROUND);
    g.restore();
    const ufoY = lerp(30, 118, ease(lt / 5.5)) + cy * 0.3;
    saucer(W / 2, ufoY, lerp(260, 520, ease(lt / 5.5)), { t: lt, dark: 0.55, glow: lt > 2 });
    g.save(); g.translate(0, cy);
    clouds(lt + 7, '#c9a0b8', 0.95 - dark * 0.5, 0.3, 30, 7);
    g.drawImage(layers.far, Math.round(-154 * 0.35), GROUND - 186);
    g.drawImage(layers.near, Math.round(-154 * 0.8), GROUND - 186);
    ground(154);
    birds.forEach(b => { if (lt > 0.4) { b.x += 190 * 0.016; b.y -= 70 * 0.016; } drawBird(b, lt * 3 + 40); });
    CARS.forEach(([col, base, v], i) => { car(((base + v * 7) % 1500 + 1500) % 1500 - 92, GROUND + 26, col, v); });
    WALKERS.forEach(([id, base, v], i) => civ(id, ((base + v * 7) % 1000 + 1000) % 1000 - 139, GROUND + 16 + (i % 2) * 4, { t: lt, flip: v < 0 }));
    g.restore();
    g.fillStyle = 'rgba(30,0,20,' + (dark * 0.45) + ')'; g.fillRect(0, 0, W, HH);
    const a = seg(lt, 0.3, 0.9) * (1 - seg(lt, 3.6, 5));
    if (a > 0) { const j = Math.round(Math.sin(lt * 40) * 2); g.globalAlpha = a; txt('BOOOOOM…', W / 2 + j, 200 + j, 30, '#ff5a5a', 'center', '#2a0010'); g.globalAlpha = 1; }
  }

  const SHIPS = [[110, 0], [230, 0.7], [350, 1.4], [470, 0.4], [570, 1.1]];
  function scene3(lt) {
    const dark = 0.7;
    skyGrad('#12061e', '#7a1a3a', 0, GROUND);
    clouds(lt + 20, '#5a2a48', 0.7, 0.2, 20, 6);
    g.drawImage(layers.far, Math.round(-160 * 0.35), GROUND - 186);
    g.drawImage(layers.near, Math.round(-160 * 0.8), GROUND - 186);
    ground(160);
    const ships = SHIPS.map(([x, d], i) => { const k = ease((lt - d) / 2.8), y = lerp(-50, GROUND - 22 - (i % 2) * 6, k); return { x, y, k, landed: k >= 1, i }; });
    ships.forEach(s => {
      if (s.k > 0 && s.k < 1) {
        const sweep = Math.sin(lt * 3 + s.i) * 40;
        g.fillStyle = 'rgba(255,40,70,0.30)'; g.beginPath(); g.moveTo(s.x - 8, s.y + 10); g.lineTo(s.x + 8, s.y + 10); g.lineTo(s.x + 40 + sweep, GROUND + 30); g.lineTo(s.x - 40 + sweep, GROUND + 30); g.closePath(); g.fill();
        g.fillStyle = 'rgba(255,120,140,0.5)'; g.fillRect(Math.round(s.x - 30 + sweep), GROUND + 28, 60, 2);
      }
    });
    WALKERS.forEach(([id, base, v], i) => {
      const panic = lt > 1.2, x = 50 + i * 76 + (panic ? Math.sin(lt * 9 + i * 2) * 22 : 0);
      civ(id, x, GROUND + 16 + (i % 2) * 4, { t: lt * 2 + i, flip: Math.sin(lt * 9 + i * 2) < 0, jump: panic });
      if (panic && Math.floor(lt * 3 + i) % 3 === 0) txt('!', x, GROUND - 38, 12, '#ffe14a', 'center', '#000');
    });
    ships.forEach(s => {
      saucer(s.x, s.y, 74, { t: lt + s.i, glow: s.landed });
      if (s.landed && lt > 4) { const dx = Math.min(70, (lt - 4 - s.i * 0.2) * 14); if (dx > 0) alien(['grunt', 'slime', 'brute', 'grunt', 'slime'][s.i], s.x + 30 + dx * 0.6, GROUND + 26 + (s.i % 2) * 4, 0.7, Math.floor(lt * 5) % 2, { alpha: clamp(dx / 12, 0, 1) }); }
    });
    g.fillStyle = 'rgba(30,0,20,0.25)'; g.fillRect(0, 0, W, HH);
    const bar = ease(seg(lt, 4, 4.8)) * 30; px(0, 0, W, bar, '#000'); px(0, HH - bar, W, bar, '#000');
    if (lt > 4.2) {
      const k = ease((lt - 4.2) / 1.6), f = Math.floor(lt * 3) % 2;
      alien('commander', 500, lerp(HH + 240, HH - 8, k), 3.6, f, {});
      g.globalAlpha = 0.25; ell(500, HH - 90, 130, 150, '#ff3b6b'); g.globalAlpha = 1;
    }
    if (lt > 5.2 && lt < 8) {
      const full = 'This planet is now ours.', n = Math.min(full.length, Math.floor((lt - 5.2) * 14));
      px(30, HH - 76, 580, 54, '#0a0a1a'); px(30, HH - 76, 580, 3, '#ff5a8a'); px(30, HH - 25, 580, 3, '#ff5a8a');
      txt('ALIEN COMMANDER', 44, HH - 56, 8, '#ff8ab0'); txt(full.slice(0, n), 44, HH - 36, 12, '#ffffff');
    }
  }

  function scene4(lt) {
    skyGrad('#0c1226', '#1a2444', 0, HH);
    for (let x = 0; x < W; x += 64) { px(x, 0, 60, 210, '#1c2646'); px(x + 2, 4, 56, 4, '#2a3866'); px(x + 4, 20, 52, 2, '#141c38'); }
    px(0, 300, W, 60, '#1a2036'); px(0, 300, W, 3, '#3a4a80'); for (let x = 0; x < W; x += 32) px(x, 320, 20, 2, '#3a4a80');
    const pulse = 0.5 + 0.5 * Math.sin(lt * 6);
    g.fillStyle = 'rgba(255,40,60,' + (0.1 + 0.12 * pulse) + ')'; g.fillRect(0, 0, W, 300);
    px(0, 0, W, 10, '#101528'); px(20, 2, 30, 5, pulse > 0.5 ? '#ff3b3b' : '#5a1a1a'); px(590, 2, 30, 5, pulse > 0.5 ? '#ff3b3b' : '#5a1a1a');
    px(180, 30, 250, 150, '#2a3260'); px(186, 36, 238, 138, '#05070f');
    skyGrad('#12061e', '#7a1a3a', 0, 0); for (let y = 36; y < 174; y += 4) px(186, y, 238, 4, mix('#1a0a2a', '#8a1a3a', (y - 36) / 138));
    for (let i = 0; i < 5; i++) { const sx = 200 + ((i * 55 + lt * 22) % 210), sy = 60 + (i * 17) % 60 + Math.sin(lt * 2 + i) * 4; g.save(); g.beginPath(); g.rect(186, 36, 238, 138); g.clip(); saucer(sx, sy, 34, { t: lt + i }); g.restore(); }
    for (let x = 186; x < 424; x += 12) px(x, 150, 8, 24, '#0a0e1e');
    for (let y = 36; y < 174; y += 3) px(186, y, 238, 1, 'rgba(0,0,0,0.25)');
    if (pulse > 0.4) txt('⚠ ALERT', 196, 56, 10, '#ff5a5a', 'left', '#000');
    px(200, 178, 210, 8, '#3a4a80'); px(210, 186, 190, 14, '#232c50');
    human('max', 130, 300, { t: lt, sc: 0.8, fps: 2 });
    const grab = lt > 1.5;
    [['ryan', 470], ['tom', 512], ['sam', 554]].forEach(([id, x], i) => human(id, x, 300, { t: lt * 1.3 + i, sc: 0.72, anim: grab ? 'special' : 'idle', fps: 3 }));
    const on = lt > 2.6;
    const m = H.Sprites.reactor && H.Sprites.reactor[Math.floor(lt * 4) % 2];
    if (m) { const mw = m.width * 3, mh = m.height * 3; g.drawImage(m, Math.round(600 - mw / 2), Math.round(300 - mh), mw, mh); if (on) { g.globalAlpha = 0.25 + 0.15 * pulse; ell(600, 300 - mh / 2, 44, 60, '#8dff7a'); g.globalAlpha = 1; } }
    human('eli', 566, 316, { t: lt, sc: 0.6, anim: on ? 'special' : 'idle', fps: 4, flip: false });
    human('maya', 636, 316, { t: lt + 1, sc: 0.6, anim: on ? 'special' : 'idle', fps: 4, flip: true });
    if (on) { for (let i = 0; i < 4; i++) { g.strokeStyle = '#eaffd0'; g.lineWidth = 2; g.beginPath(); let x = 600, y = 250; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (Math.random() - 0.5) * 30; y -= 12 + Math.random() * 6; g.lineTo(x, y); } g.stroke(); } }
    if (lt > 3.6) { const full = "Then we'll defend it.", n = Math.min(full.length, Math.floor((lt - 3.6) * 14)); px(30, HH - 76, 580, 54, '#0a0a1a'); px(30, HH - 76, 580, 3, '#54c7ff'); px(30, HH - 25, 580, 3, '#54c7ff'); txt('COMMANDER MAX', 44, HH - 56, 8, '#7ffcff'); txt(full.slice(0, n), 44, HH - 36, 12, '#ffffff'); }
    if (lt > 3.2 && lt < 3.35) flash = 0.5;
  }

  const HUM = [['max', 0, 0], ['lucy', 0, 2], ['maya', 1, 0], ['eli', 1, 2], ['ryan', 2, 1], ['tom', 3, 3], ['priya', 3, 1], ['sam', 4, 2]];
  const ALN = [['slime', 0, 7], ['grunt', 1, 8], ['brute', 2, 7], ['scorpion', 3, 8], ['shield', 4, 7], ['trooper', 2, 8], ['cactus', 4, 8], ['jet', 0, 8]];
  const G = H.G, cellCX = c => G.GX + c * G.CW + G.CW / 2, footY = r => G.GY + r * G.RH + G.RH - 8;

  function battlefield(t, lt5) {
    const boom = 5.6, lt6 = t - T.s6;
    let z, cxw, cyw;
    if (t < T.s6) { const k = ease(lt5 / 7); z = lerp(1.45, 1.12, k); cxw = lerp(260, 520, k); cyw = 300; }
    else { const k = ease(lt6 / 4.5); z = lerp(1.12, 1.0, k); cxw = lerp(520, 482, k); cyw = lerp(300, 300, k); }
    const k0 = W / 964, k = k0 * z;
    g.save();
    g.translate(Math.round(W / 2 - cxw * k), Math.round(HH / 2 - cyw * k)); g.scale(k, k);
    g.drawImage(layers.bg, 0, 0);
    g.fillStyle = 'rgba(20,10,40,0.18)'; g.fillRect(0, 0, 964, 584);
    const items = [];
    HUM.forEach(([id, r, c], i) => { const at = 1 + i * 0.5; if (lt5 >= at || t >= T.s6) items.push({ y: footY(r), draw: () => { const pop = t < T.s6 ? clamp(1 - (lt5 - at) * 3, 0, 1) : 0; if (pop > 0) { g.globalAlpha = 0.6 * pop; ell(cellCX(c), footY(r) - 40, 34 * pop + 10, 50, '#7ffcff'); g.globalAlpha = 1; } human(id, cellCX(c), footY(r) + 4, { t: t + i, sc: 0.9, fps: 4 }); } }); });
    ALN.forEach(([type, r, c], i) => { const at = 2.4 + i * 0.5; if (lt5 >= at || t >= T.s6) items.push({ y: footY(r), draw: () => { const a = t < T.s6 ? clamp((lt5 - at) / 0.6, 0, 1) : 1; alien(type, cellCX(c), footY(r) + 4, 1.5, Math.floor(t * 4 + i) % 2, { grow: 0.4 + 0.6 * a, alpha: 0.3 + 0.7 * a }); if (a < 1) { g.globalAlpha = 1 - a; alien(type, cellCX(c), footY(r) + 4, 1.5, 0, { sil: '#ff3b6b', grow: 0.4 + 0.6 * a }); g.globalAlpha = 1; } } }); });
    items.sort((a, b) => a.y - b.y).forEach(it => it.draw());
    if (t >= T.s5 + boom - 1 && t < T.s5 + boom + 0.05) {
      const p = (t - (T.s5 + boom - 1)) / 1, px0 = lerp(-80, 480, p), py0 = lerp(-120, footY(2) - 10, p * p);
      for (let i = 0; i < 9; i++) { const q = Math.max(0, p - i * 0.02); ell(lerp(-80, 480, q), lerp(-120, footY(2) - 10, q * q), 9 - i * 0.7, 9 - i * 0.7, i ? (i % 2 ? '#ff9a3d' : '#ffe14a') : '#ffffff'); }
    }
    if (t >= T.s5 + boom) {
      const e = t - (T.s5 + boom), x = 480, y = footY(2) - 10;
      for (let i = 0; i < 3; i++) { const r = e * 260 - i * 30; if (r > 0 && e < 1.3) { g.strokeStyle = ['#ffffff', '#ffe14a', '#ff7a1a'][i]; g.globalAlpha = clamp(1 - e / 1.3, 0, 1); g.lineWidth = 8 - i * 2; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke(); g.globalAlpha = 1; } }
      const rr = rng(3); for (let i = 0; i < 26; i++) { const a = rr() * 6.28, s = 60 + rr() * 200, d = e * s; if (e < 1.4) { g.globalAlpha = clamp(1 - e / 1.4, 0, 1); px(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7 + e * e * 120, 6, 6, ['#ffe14a', '#ff9a3d', '#ffffff', '#7a5a3a'][i % 4]); g.globalAlpha = 1; } }
      if (e < 0.5) { g.globalAlpha = 1 - e / 0.5; ell(x, y, 60 * (1 + e * 3), 40 * (1 + e * 3), '#fff2c0'); g.globalAlpha = 1; }
    }
    g.restore();
  }

  function title(lt6) {
    const a = seg(lt6, 5.2, 5.9);
    const drop = (s, y0) => y0 - (1 - ease(seg(lt6, s, s + 0.5))) * 40;
    if (lt6 > 1.2) { g.globalAlpha = seg(lt6, 1.2, 1.7); txt('HUMANS', W / 2, drop(1.2, 118), 40, '#ffd23f', 'center', '#5a2a00'); }
    if (lt6 > 1.9) { g.globalAlpha = seg(lt6, 1.9, 2.4); txt('VS', W / 2, drop(1.9, 160), 22, '#ff5ad8', 'center', '#3a0a3a'); }
    if (lt6 > 2.6) { g.globalAlpha = seg(lt6, 2.6, 3.1); txt('ALIENS', W / 2, drop(2.6, 210), 40, '#7dffa0', 'center', '#0a3a1a'); }
    g.globalAlpha = 1;
    if (lt6 > 3.9) { const b = Math.floor(lt6 * 3) % 2; g.globalAlpha = seg(lt6, 3.9, 4.4); txt('DEFEND EARTH.', W / 2, 256, 14, b ? '#ffffff' : '#7ffcff', 'center', '#0a1a3a'); g.globalAlpha = 1; }
    if (a > 0) { g.fillStyle = 'rgba(0,0,0,' + a + ')'; g.fillRect(0, 0, W, HH); }
  }

  function rumble(d) {
    try {
      const s = H.Save.data.settings; if (!s.sfx) return;
      const c = H.Sound.context && H.Sound.context(); if (!c) return;
      const t = c.currentTime, o = c.createOscillator(), o2 = c.createOscillator(), f = c.createBiquadFilter(), gn = c.createGain();
      o.type = 'sawtooth'; o2.type = 'square'; o.frequency.setValueAtTime(42, t); o.frequency.linearRampToValueAtTime(24, t + d); o2.frequency.setValueAtTime(21, t); o2.frequency.linearRampToValueAtTime(15, t + d);
      f.type = 'lowpass'; f.frequency.value = 150;
      gn.gain.setValueAtTime(0.0001, t); gn.gain.linearRampToValueAtTime(0.55 * s.volume, t + d * 0.35); gn.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(f); o2.connect(f); f.connect(gn); gn.connect(c.destination); o.start(t); o2.start(t); o.stop(t + d + 0.05); o2.stop(t + d + 0.05);
    } catch (e) {}
  }
  const once = (k, fn) => { if (!fired[k]) { fired[k] = 1; fn(); } };

  function events(t) {
    once('m1', () => H.Music.play('w5'));
    if (t >= T.s2) once('cut', () => { H.Music.stop(); rumble(3.4); H.Sound.boss(); });
    if (t >= T.s2 + 1.4) once('m2', () => H.Music.play('w4'));
    if (t >= T.s2 + 1.2) once('fl', () => { flash = 0.6; });
    if (t >= T.s3 + 1) once('s3a', () => H.Sound.wave());
    if (t >= T.s3 + 5.2) once('s3b', () => { H.Sound.boss(); shake = 6; });
    if (t >= T.s4) once('m3', () => H.Music.play('w1'));
    if (t >= T.s4 + 2.6) once('s4a', () => { H.Sound.zap(); H.Sound.heal(); });
    if (t >= T.s5 + 4.6) once('s5a', () => H.Sound.plasma());
    if (t >= T.s5 + 5.6) once('boom', () => { H.Sound.explode(); flash = 1; shake = 14; setTimeout(() => H.Sound.explode(), 160); });
    if (t >= T.s6) once('m4', () => H.Music.play('menu'));
  }

  function frame(ts) {
    if (!running) return;
    if (!startT) startT = ts;
    let t = (ts - startT) / 1000;
    if (finishing) { const k = (ts - finishing) / 400; if (k >= 1) return finish(); }
    if (t >= T.end) return finish();
    events(t);
    g.globalAlpha = 1;
    if (t < T.s2) scene1(t);
    else if (t < T.s3) scene2(t - T.s2);
    else if (t < T.s4) scene3(t - T.s3);
    else if (t < T.s5) scene4(t - T.s4);
    else { battlefield(t, t - T.s5); if (t >= T.s6) title(t - T.s6); }
    if (t < 0.9) { g.fillStyle = 'rgba(0,0,0,' + (1 - t / 0.9) + ')'; g.fillRect(0, 0, W, HH); }
    [[T.s2, 0.25], [T.s3, 0.35], [T.s4, 0.35], [T.s5, 0.35]].forEach(([a, d]) => { const k = t - a; if (k >= 0 && k < d) { g.fillStyle = 'rgba(0,0,0,' + (1 - k / d) + ')'; g.fillRect(0, 0, W, HH); } });
    if (flash > 0) { g.fillStyle = 'rgba(255,255,255,' + Math.min(1, flash) + ')'; g.fillRect(0, 0, W, HH); flash = Math.max(0, flash - 0.03); }
    let sx = 0, sy = 0;
    if (t >= T.s2 && t < T.s3) { const a = 0.4 + (t - T.s2) * 0.6; sx = (Math.random() - 0.5) * a * 2; sy = (Math.random() - 0.5) * a * 2; }
    if (shake > 0) { sx += (Math.random() - 0.5) * shake; sy += (Math.random() - 0.5) * shake; shake = Math.max(0, shake - 0.25); }
    const cw = cv.width = window.innerWidth, ch = cv.height = window.innerHeight;
    cx.fillStyle = '#000'; cx.fillRect(0, 0, cw, ch); cx.imageSmoothingEnabled = false;
    const s = Math.min(cw / W, ch / HH), dw = W * s, dh = HH * s;
    if (finishing) cx.globalAlpha = clamp(1 - (ts - finishing) / 400, 0, 1);
    cx.drawImage(buf, Math.round((cw - dw) / 2 + sx * s), Math.round((ch - dh) / 2 + sy * s), Math.round(dw), Math.round(dh));
    cx.globalAlpha = 1;
    if (ch > cw) { cx.font = Math.max(9, Math.round(cw / 28)) + 'px ' + FONT; cx.textAlign = 'center'; cx.fillStyle = '#ffe14a'; cx.fillText('ROTATE YOUR PHONE', cw / 2, (ch + dh) / 2 + Math.max(30, cw / 8)); }
    raf = requestAnimationFrame(frame);
  }

  function skip() { if (!finishing && running) finishing = performance.now(); }
  function onKey(e) { if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); skip(); } }
  function finish() {
    if (!running) return;
    running = false; cancelAnimationFrame(raf);
    window.removeEventListener('keydown', onKey, true);
    if (cv) cv.remove(); if (skipBtn) skipBtn.remove();
    cv = null; skipBtn = null;
    const cb = doneCb; doneCb = null; cb && cb();
  }

  H.Intro = {
    jump(sec) { startT -= sec * 1000; },
    play(cb) {
      doneCb = cb; fired = {}; flash = 0; shake = 0; finishing = 0; startT = 0; running = true;
      [buf, g] = (() => { const c = document.createElement('canvas'); c.width = W; c.height = HH; const gg = c.getContext('2d'); gg.imageSmoothingEnabled = false; return [c, gg]; })();
      layers = makeLayers(); loadCivs();
      const bgC = H.G.buildBackground('city', 3); layers.bg = bgC;
      birdsInit();
      cv = document.createElement('canvas');
      cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:5000;background:#000;cursor:pointer';
      document.body.appendChild(cv); cx = cv.getContext('2d');
      skipBtn = document.createElement('button');
      skipBtn.textContent = 'SKIP ▶';
      skipBtn.style.cssText = "position:fixed;right:14px;bottom:14px;z-index:5001;font-family:" + FONT + ";font-size:10px;color:#fff;background:rgba(20,20,60,.75);border:2px solid #8a8fd8;padding:10px 12px;letter-spacing:1px";
      document.body.appendChild(skipBtn);
      skipBtn.addEventListener('click', skip); cv.addEventListener('click', skip);
      window.addEventListener('keydown', onKey, true);
      raf = requestAnimationFrame(frame);
    }
  };
})(window.HVA);
