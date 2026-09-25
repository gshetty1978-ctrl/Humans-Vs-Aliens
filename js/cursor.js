(function () {
  const OPEN = [
    '.....oo.........',
    '....oyyo........',
    '....oywo........',
    '....oyyo........',
    '....oyyo.oo.....',
    '....oyyooyyoo...',
    '....oyyoyyyyoo..',
    '.oo.oyyoyyyyyyo.',
    'oyyooyyyyyyyyyo.',
    'oyyyoyyyyyyyyyo.',
    '.oyyyyyyyyyyyyo.',
    '..oyyyyyyyyyyo..',
    '..oyyyyyyyyyyo..',
    '...oyyyyyyyyo...',
    '...oyyyyyyyyo...',
    '....oyyyyyyo....',
    '....oooooooo....'
  ];
  const FIST = [
    '................',
    '....oo.oo.oo....',
    '...oywoyyoyyo...',
    '...oyyyyyyyyyo..',
    '..ooyyyyyyyyyyo.',
    '.oyyoyyyyyyyyyo.',
    '.oyyyyyyyyyyyyo.',
    '.oyyyyyyyyyyyo..',
    '..oyyyyyyyyyyo..',
    '...oyyyyyyyyo...',
    '....oooooooo....'
  ];
  const COL = { o: '#7a8ab8', y: '#ffffff', w: '#dfe8ff' };
  const SC = 2, PAD = 9;

  function make(rows) {
    const c = document.createElement('canvas');
    c.width = 16 * SC + PAD * 2; c.height = 17 * SC + PAD * 2;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.shadowColor = '#ffffff'; g.shadowBlur = 9;
    for (let pass = 0; pass < 2; pass++) {
      rows.forEach((row, y) => [...row].forEach((ch, x) => {
        if (ch === '.') return;
        g.fillStyle = COL[ch];
        g.fillRect(PAD + x * SC, PAD + y * SC, SC, SC);
      }));
      if (!pass) g.shadowBlur = 0;
    }
    g.fillStyle = '#ffffff';
    g.fillRect(PAD + 5 * SC, PAD + 2 * SC, SC, SC);
    return c.toDataURL();
  }

  const open = make(OPEN), fist = make(FIST);
  const st = document.createElement('style');
  st.textContent =
    'html, body, body * { cursor: url(' + open + ') ' + (PAD + 5 * SC + 1) + ' ' + (PAD + 1) + ', pointer !important; }\n' +
    'body *:active { cursor: url(' + fist + ') ' + (PAD + 8 * SC) + ' ' + (PAD + 3 * SC) + ', grabbing !important; }\n' +
    '#dragGhost, #dragGhost * { cursor: url(' + fist + ') ' + (PAD + 8 * SC) + ' ' + (PAD + 3 * SC) + ', grabbing !important; }';
  document.head.appendChild(st);

  const cv = document.createElement('canvas');
  cv.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483000';
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = 0, Hh = 0;
  function size() { W = cv.width = window.innerWidth; Hh = cv.height = window.innerHeight; }
  size(); window.addEventListener('resize', size);

  const parts = [];
  let mx = -99, my = -99, inside = false, running = false, lastMove = 0;
  const COLS = ['#ffffff', '#ffffff', '#e8f0ff', '#cfe0ff', '#fff8e0'];

  function spawn(n, spread) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * spread;
      parts.push({
        x: mx + 4 + Math.cos(a) * r, y: my + 6 + Math.sin(a) * r * 0.9,
        vx: (Math.random() - 0.5) * 26, vy: -8 - Math.random() * 26,
        life: 0.5 + Math.random() * 0.7, t: 0, s: 2 + Math.floor(Math.random() * 2),
        c: COLS[Math.floor(Math.random() * COLS.length)], ph: Math.random() * 6
      });
    }
    if (parts.length > 30) parts.splice(0, parts.length - 160);
    kick();
  }

  window.addEventListener('pointermove', e => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    mx = e.clientX; my = e.clientY; inside = true; lastMove = performance.now();
    if (Math.random() < 0.12) spawn(1, 5);
  }, true);
  window.addEventListener('pointerdown', e => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    mx = e.clientX; my = e.clientY; spawn(3, 6);
  }, true);
  document.addEventListener('mouseleave', () => { inside = false; });

  function star(x, y, s, c, a) {
    ctx.globalAlpha = a; ctx.fillStyle = c;
    ctx.fillRect(x - s / 2, y - s / 2, s, s);
    if (s >= 3) { ctx.fillRect(x - s * 1.5, y - 0.5, s * 3, 1); ctx.fillRect(x - 0.5, y - s * 1.5, 1, s * 3); }
  }
  let last = 0;
  function frame(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
    ctx.clearRect(0, 0, W, Hh);
    for (const p of parts) {
      p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 14 * dt;
      const k = p.t / p.life, tw = 0.6 + 0.4 * Math.sin(p.t * 24 + p.ph);
      if (k < 1) star(Math.round(p.x), Math.round(p.y), p.s, p.c, (1 - k) * tw);
    }
    ctx.globalAlpha = 1;
    for (let i = parts.length - 1; i >= 0; i--) if (parts[i].t >= parts[i].life) parts.splice(i, 1);
    if (parts.length) requestAnimationFrame(frame); else running = false;
  }
  function kick() { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } }
})();
