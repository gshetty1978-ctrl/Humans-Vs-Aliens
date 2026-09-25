(function (H) {
  const S = { human: {}, aliens: {}, cache: {}, ready: false };
  H.Sprites = S;

  function mk(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    return [c, g];
  }
  const R = (g, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  function E(g, cx, cy, rx, ry, col) {
    g.fillStyle = col;
    for (let y = -ry; y <= ry; y++) {
      const half = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))) + 0.5);
      g.fillRect(cx - half, cy + y, half * 2, 1);
    }
  }
  function atop(g, fn) { g.save(); g.globalCompositeOperation = 'source-atop'; fn(); g.restore(); }

  function outline(c, col) {
    const g = c.getContext('2d');
    const w = c.width, h = c.height;
    const d = g.getImageData(0, 0, w, h).data;
    const a = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : d[(y * w + x) * 4 + 3];
    g.fillStyle = col;
    for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++) {
      if (a(x, y) > 40) continue;
      if (a(x - 1, y) > 40 || a(x + 1, y) > 40 || a(x, y - 1) > 40 || a(x, y + 1) > 40) {
        if (x >= 0 && y >= 0 && x < w && y < h) g.fillRect(x, y, 1, 1);
      }
    }
  }
  function build(w, h, fn, pad) {
    pad = pad || 1;
    const [c, g] = mk(w + pad * 2, h + pad * 2);
    g.translate(pad, pad);
    fn(g);
    g.setTransform(1, 0, 0, 1, 0, 0);
    outline(c, '#120a20');
    return c;
  }

  const DRAW = {
    slime(f) {
      return build(32, 32, g => {
        const lo = f ? 1 : 0;
        R(g, 9, 26 + lo, 5, 5 - lo, '#1f8d43'); R(g, 19, 27 - lo, 5, 4 + lo, '#1f8d43');
        E(g, 16, 17, 14, 11, '#34c95f');
        atop(g, () => { R(g, 0, 22, 32, 10, '#25a04a'); R(g, 0, 26, 32, 6, '#1d7f3b'); });
        E(g, 11, 11, 6, 3, '#7dffa0');
        R(g, 21, 3, 2, 7, '#25a04a'); E(g, 22, 3, 2, 2, '#ff5ad8');
        E(g, 11, 15, 7, 7, '#ffffff');
        R(g, 7, 15, 5, 6, '#22103a'); R(g, 8, 16, 2, 2, '#ffffff');
        R(g, 4, 6, 10, 2, '#1d7f3b'); R(g, 3, 8, 4, 2, '#1d7f3b');
        R(g, 12, 25, 12, 1, '#0f4a22'); R(g, 14, 26, 2, 1, '#ffffff'); R(g, 19, 26, 2, 1, '#ffffff');
      });
    },
    grunt(f) {
      return build(40, 50, g => {
        const lo = f ? 1 : 0;
        R(g, 13, 37 + lo, 6, 12 - lo, '#5b2f9e'); R(g, 23, 38 - lo, 6, 11 + lo, '#5b2f9e');
        R(g, 11, 47, 9, 3, '#3b3a50'); R(g, 22, 47, 9, 3, '#3b3a50');
        R(g, 27, 22, 6, 13, '#7b3fc7');
        R(g, 11, 20, 20, 19, '#8a4fd6');
        R(g, 13, 22, 16, 9, '#8d93a8'); R(g, 13, 22, 16, 2, '#b7bdd2'); R(g, 20, 25, 3, 3, '#5cf7ff');
        R(g, 11, 32, 20, 3, '#5b2f9e'); R(g, 19, 32, 4, 3, '#ffd23f');
        E(g, 20, 12, 10, 9, '#a56cf0');
        atop(g, () => R(g, 0, 15, 40, 8, '#8a4fd6'));
        R(g, 11, 9, 5, 5, '#ffe14a'); R(g, 12, 10, 2, 3, '#22103a'); R(g, 20, 9, 5, 5, '#ffe14a'); R(g, 21, 10, 2, 3, '#22103a');
        R(g, 14, 17, 9, 1, '#3a1a66');
        R(g, 15, 2, 2, 4, '#b7bdd2'); R(g, 24, 2, 2, 4, '#b7bdd2');
        R(g, 3, 25, 9, 5, '#8a4fd6'); R(g, 0, 23, 8, 5, '#4a4f66'); R(g, 0, 24, 3, 3, '#5cf7ff');
      });
    },
    brute(f) {
      return build(64, 64, g => {
        const lo = f ? 2 : 0;
        R(g, 18, 46 + lo, 12, 17 - lo, '#6a4128'); R(g, 34, 47 - lo, 12, 16 + lo, '#6a4128');
        R(g, 15, 60, 16, 4, '#3d3f4f'); R(g, 33, 60, 16, 4, '#3d3f4f');
        R(g, 6, 18, 12, 8, '#8f5d3a'); E(g, 5, 22, 5, 5, '#a97347');
        R(g, 46, 18, 12, 8, '#8f5d3a'); E(g, 59, 22, 5, 5, '#a97347');
        R(g, 3, 32, 14, 8, '#8f5d3a'); E(g, 3, 36, 5, 5, '#a97347');
        R(g, 47, 32, 14, 8, '#8f5d3a'); E(g, 60, 36, 5, 5, '#a97347');
        R(g, 15, 18, 34, 32, '#a97347');
        atop(g, () => { R(g, 0, 40, 64, 24, '#8f5d3a'); });
        R(g, 12, 15, 40, 9, '#5d6178'); R(g, 12, 15, 40, 2, '#8d93a8'); R(g, 16, 18, 3, 3, '#ff9a3d'); R(g, 45, 18, 3, 3, '#ff9a3d');
        R(g, 20, 27, 24, 14, '#6b6f80'); R(g, 20, 27, 24, 2, '#9aa0b8'); R(g, 30, 31, 4, 6, '#ff7a1a'); R(g, 31, 32, 2, 4, '#ffd23f');
        R(g, 17, 43, 30, 5, '#4a4d5f'); R(g, 29, 43, 6, 5, '#ffd23f');
        E(g, 32, 11, 9, 8, '#b98354'); R(g, 24, 8, 6, 3, '#ff3b3b'); R(g, 34, 8, 6, 3, '#ff3b3b');
        R(g, 25, 9, 4, 1, '#ffb0b0'); R(g, 35, 9, 4, 1, '#ffb0b0'); R(g, 26, 15, 12, 2, '#3a1a10');
        R(g, 27, 15, 2, 2, '#ffffff'); R(g, 35, 15, 2, 2, '#ffffff');
        R(g, 22, 3, 4, 5, '#5d6178'); R(g, 38, 3, 4, 5, '#5d6178');
      });
    },
    zapper(f) {
      return build(44, 52, g => {
        const lo = f ? 1 : 0;
        R(g, 14, 40 + lo, 6, 11 - lo, '#6a3aa8'); R(g, 24, 41 - lo, 6, 10 + lo, '#6a3aa8');
        R(g, 12, 49, 9, 3, '#2a2a3d'); R(g, 23, 49, 9, 3, '#2a2a3d');
        R(g, 27, 12, 14, 24, '#2c3050'); R(g, 28, 13, 12, 3, '#4a507a');
        const zz = f ? [[30, 18], [34, 21], [31, 25], [36, 28]] : [[35, 18], [31, 21], [36, 25], [31, 28]];
        zz.forEach(p => R(g, p[0], p[1], 4, 2, '#7ffcff')); R(g, 33, 8, 2, 5, '#ffe14a'); E(g, 34, 7, 2, 2, '#ffe14a');
        R(g, 12, 22, 19, 19, '#9b5de5'); R(g, 14, 24, 15, 7, '#3b3a50'); R(g, 20, 26, 3, 3, '#7ffcff');
        R(g, 12, 34, 19, 3, '#5b2f9e'); R(g, 20, 34, 4, 3, '#7ffcff');
        E(g, 21, 14, 10, 9, '#b47ef5');
        atop(g, () => R(g, 0, 17, 44, 8, '#9b5de5'));
        R(g, 12, 11, 6, 5, '#7ffcff'); R(g, 14, 12, 2, 3, '#0b1a30'); R(g, 22, 11, 6, 5, '#7ffcff'); R(g, 24, 12, 2, 3, '#0b1a30');
        R(g, 19, 1, 3, 5, '#ffe14a'); R(g, 21, 3, 3, 3, '#ffe14a');
        R(g, 4, 26, 9, 5, '#9b5de5'); R(g, 0, 25, 6, 3, '#c8c8ff'); R(g, 0, 28, 6, 3, '#c8c8ff'); R(g, 3, 24, 2, 1, '#ffe14a'); R(g, 3, 31, 2, 1, '#ffe14a');
      });
    },
    jet(f) {
      return build(40, 44, g => {
        const sw = f ? 2 : 0;
        R(g, 30, 22, 7, 15, '#8a8fa8'); R(g, 31, 22, 5, 3, '#c9cee4'); R(g, 30, 35, 7, 3, '#4a4f66');
        R(g, 31, 38, 5, 4 + sw, '#ff6b1a'); R(g, 32, 38, 3, 3 + sw, '#ffd23f'); if (f) R(g, 33, 44, 1, 0, '#fff');
        R(g, 15 + sw, 33, 5, 8, '#c94a2e'); R(g, 23 - sw, 33, 5, 9, '#c94a2e');
        R(g, 12, 20, 20, 15, '#ff7a59');
        atop(g, () => R(g, 0, 29, 40, 8, '#d9573a'));
        R(g, 14, 22, 16, 5, '#ffb199');
        E(g, 21, 12, 10, 9, '#ff8f70');
        R(g, 9, 8, 8, 7, '#5cf7ff'); R(g, 10, 9, 3, 2, '#ffffff'); R(g, 9, 8, 8, 1, '#22103a');
        R(g, 19, 8, 8, 7, '#5cf7ff'); R(g, 20, 9, 3, 2, '#ffffff');
        R(g, 14, 17, 8, 1, '#7a2413');
        R(g, 5, 23, 9, 4, '#ff7a59'); R(g, 3, 22, 4, 6, '#c94a2e');
      });
    },
    shield(f) {
      return build(48, 64, g => {
        const lo = f ? 1 : 0;
        R(g, 17, 47 + lo, 7, 16 - lo, '#254f9a'); R(g, 26, 48 - lo, 7, 15 + lo, '#254f9a');
        R(g, 15, 61, 10, 3, '#2a2a3d'); R(g, 25, 61, 10, 3, '#2a2a3d');
        R(g, 15, 22, 21, 27, '#3a7bd5'); R(g, 15, 22, 21, 3, '#6fa8ff');
        R(g, 17, 26, 17, 10, '#2c3e70'); R(g, 24, 29, 4, 4, '#5cf7ff');
        R(g, 15, 40, 21, 4, '#254f9a'); R(g, 23, 40, 5, 4, '#ffd23f');
        R(g, 34, 26, 7, 16, '#3a7bd5'); R(g, 4, 28, 14, 6, '#3a7bd5'); R(g, 2, 26, 5, 9, '#254f9a');
        E(g, 25, 13, 9, 10, '#5b95ec');
        atop(g, () => R(g, 0, 18, 48, 8, '#3a7bd5'));
        R(g, 17, 10, 5, 5, '#ff5ad8'); R(g, 18, 11, 2, 3, '#22103a'); R(g, 26, 10, 5, 5, '#ff5ad8'); R(g, 27, 11, 2, 3, '#22103a');
        R(g, 23, 1, 3, 4, '#6fa8ff'); R(g, 20, 2, 9, 2, '#6fa8ff');
      });
    },
    commander(f, prime) {
      const body = prime ? '#3a2f8f' : '#c2185b', dark = prime ? '#231c5e' : '#8e1244', light = prime ? '#6b5cd6' : '#e8467f';
      const gold = prime ? '#5cf7ff' : '#ffd23f';
      return build(56, 70, g => {
        const lo = f ? 1 : 0;
        R(g, 32, 24, 20, 34, dark); R(g, 30, 56, 24, 4, dark);
        R(g, 17, 50 + lo, 8, 19 - lo, dark); R(g, 29, 51 - lo, 8, 18 + lo, dark);
        R(g, 15, 67, 12, 3, '#2a2a3d'); R(g, 27, 67, 12, 3, '#2a2a3d');
        R(g, 16, 24, 26, 28, body); R(g, 16, 24, 26, 4, light);
        R(g, 18, 29, 22, 12, '#2c2c48'); R(g, 26, 32, 6, 6, gold); R(g, 27, 33, 4, 4, '#ffffff');
        R(g, 16, 43, 26, 4, gold); R(g, 26, 43, 6, 4, '#ffffff');
        R(g, 8, 24, 10, 8, gold); R(g, 40, 24, 10, 8, gold);
        R(g, 6, 32, 12, 6, body); R(g, 1, 30, 8, 9, dark); R(g, 0, 32, 4, 4, gold);
        E(g, 29, 15, 10, 11, light);
        atop(g, () => R(g, 0, 21, 56, 8, body));
        R(g, 19, 12, 7, 5, '#ffee55'); R(g, 32, 12, 7, 5, '#ffee55'); R(g, 20, 13, 3, 3, '#fffbe0'); R(g, 33, 13, 3, 3, '#fffbe0');
        R(g, 22, 20, 12, 1, dark);
        R(g, 17, 1, 3, 9, gold); R(g, 23, 0, 3, 11, gold); R(g, 29, 0, 3, 11, gold); R(g, 35, 0, 3, 11, gold); R(g, 41, 1, 3, 9, gold);
        R(g, 17, 7, 27, 3, gold); R(g, 28, 3, 3, 3, prime ? '#ff5ad8' : '#5cf7ff');
      });
    },
    reactor(f) {
      return build(40, 54, g => {
        R(g, 1, 46, 38, 7, '#4a4f66');
        for (let i = 0; i < 6; i++) R(g, 3 + i * 6, 48, 3, 4, i % 2 ? '#1a1a1a' : '#ffd23f');
        R(g, 1, 45, 38, 2, '#7a8098');
        for (let y = 6; y <= 45; y++) {
          const t = (y - 26) / 20, hw = Math.round(9 + 9 * t * t);
          R(g, 20 - hw, y, hw * 2, 1, y % 8 < 4 ? '#a0a6be' : '#8f95ae');
        }
        atop(g, () => { R(g, 24, 0, 20, 54, '#6a7088'); R(g, 0, 40, 40, 14, '#7a8098'); });
        R(g, 9, 4, 22, 3, '#c9cee4'); R(g, 9, 6, 22, 1, '#5a6078');
        R(g, 15, 3, 10, 2, f ? '#8dff7a' : '#4ade3a');
        R(g, 1, 34, 7, 12, '#5a6078'); R(g, 32, 34, 7, 12, '#5a6078');
        R(g, 2, 37, 5, 2, f ? '#8dff7a' : '#4ade3a'); R(g, 33, 37, 5, 2, f ? '#8dff7a' : '#4ade3a');
        E(g, 20, 29, 8, 10, f ? '#8dff7a' : '#4ade3a'); E(g, 20, 29, 5, 7, '#eaffd0');
        R(g, 19, 28, 3, 3, '#12331a'); R(g, 16, 30, 3, 3, '#12331a'); R(g, 22, 30, 3, 3, '#12331a'); R(g, 19, 24, 3, 3, '#12331a');
      });
    },
    trooper(f) {
      return build(44, 54, g => {
        const lo = f ? 1 : 0;
        R(g, 14, 40 + lo, 7, 13 - lo, '#3d4257'); R(g, 25, 41 - lo, 7, 12 + lo, '#3d4257');
        R(g, 12, 51, 10, 3, '#23263a'); R(g, 24, 51, 10, 3, '#23263a');
        R(g, 29, 24, 8, 14, '#4a4f66');
        R(g, 12, 22, 22, 19, '#6a7088'); R(g, 12, 22, 22, 3, '#9aa0b8'); R(g, 14, 27, 18, 9, '#3d4257'); R(g, 21, 29, 4, 4, '#ff5a3a');
        R(g, 12, 38, 22, 3, '#3d4257'); R(g, 20, 38, 6, 3, '#ffd23f');
        R(g, 8, 20, 9, 8, '#8f95ae'); R(g, 8, 20, 9, 2, '#c9cee4'); R(g, 29, 20, 9, 8, '#8f95ae'); R(g, 29, 20, 9, 2, '#c9cee4');
        E(g, 23, 13, 10, 10, '#7a8098'); atop(g, () => R(g, 0, 19, 44, 8, '#5a6078'));
        R(g, 11, 10, 16, 5, '#1a1a28'); R(g, 13, 11, 4, 3, '#ff3b3b'); R(g, 20, 11, 4, 3, '#ff3b3b');
        R(g, 21, 1, 3, 6, '#c9cee4'); R(g, 16, 4, 13, 2, '#9aa0b8');
        R(g, 5, 27, 9, 5, '#6a7088'); R(g, 0, 25, 10, 6, '#2a2e42'); R(g, 0, 26, 3, 3, '#ff5a3a'); R(g, 8, 30, 4, 4, '#4a4f66');
      });
    },
    spiker(f) {
      return build(60, 42, g => {
        for (let i = 0; i < 4; i++) {
          const o = (i + f) % 2, x = 14 + i * 11;
          R(g, x, 29 + o, 4, 10 - o, '#1f4a63'); R(g, x - 2, 38, 8, 3, '#122a3a');
        }
        R(g, 3, 24, 11, 6, '#1f4a63'); R(g, 0, 20, 5, 5, '#d8dff0'); R(g, 0, 29, 5, 5, '#d8dff0'); R(g, 3, 25, 4, 4, '#3a7a99');
        E(g, 34, 23, 24, 14, '#2f6f8f');
        atop(g, () => { R(g, 0, 28, 60, 14, '#23566f'); });
        E(g, 34, 19, 20, 9, '#4fa3c7');
        R(g, 14, 17, 40, 2, '#2f6f8f'); R(g, 18, 22, 32, 2, '#2f6f8f');
        for (let i = 0; i < 6; i++) { const x = 17 + i * 7; R(g, x + 1, 5 + Math.abs(i - 2) * 1, 3, 9, '#e8ecf8'); R(g, x, 12, 5, 3, '#c9cee4'); }
        R(g, 12, 9, 2, 8, '#1f4a63'); E(g, 13, 8, 3, 3, '#ffe14a'); R(g, 13, 8, 2, 2, '#22103a');
        R(g, 21, 10, 2, 7, '#1f4a63'); E(g, 22, 9, 3, 3, '#ffe14a'); R(g, 22, 9, 2, 2, '#22103a');
      });
    },
    spitter(f) {
      return build(44, 54, g => {
        const lo = f ? 1 : 0;
        R(g, 17, 42 + lo, 5, 11 - lo, '#4f8f22'); R(g, 26, 43 - lo, 5, 10 + lo, '#4f8f22'); R(g, 15, 51, 8, 3, '#2a4a12'); R(g, 25, 51, 8, 3, '#2a4a12');
        R(g, 32, 38, 10, 5, '#5fa32a'); R(g, 40, 34, 3, 6, '#5fa32a');
        E(g, 25, 33, 11, 12, '#8fd03a'); atop(g, () => R(g, 0, 38, 44, 16, '#6fb02a'));
        E(g, 21, 32, 6, 7, '#b6ff3a'); E(g, 21, 32, 3, 4, '#eaffb0');
        E(g, 20, 17, 12, 10, '#8fd03a'); atop(g, () => R(g, 0, 22, 44, 6, '#7ac02c'));
        R(g, 5, 16, 11, 9, '#2a0f2a'); R(g, 7, 18, 7, 5, '#b6ff3a'); R(g, 4, 15, 3, 3, '#eaffb0'); R(g, 4, 24, 3, 3, '#eaffb0');
        R(g, 17, 8, 5, 5, '#ffe14a'); R(g, 18, 9, 2, 3, '#22103a'); R(g, 25, 9, 5, 5, '#ffe14a'); R(g, 26, 9, 2, 3, '#22103a');
        R(g, 14, 5, 3, 4, '#5fa32a'); R(g, 29, 5, 3, 4, '#5fa32a');
        R(g, 12, 34, 7, 4, '#8fd03a'); R(g, 10, 36, 4, 5, '#6fb02a');
      });
    },
    bomber(f) {
      return build(38, 38, g => {
        R(g, 9, 31 + f, 4, 6 - f, '#7a2a10'); R(g, 15, 32 - f, 4, 5 + f, '#7a2a10'); R(g, 22, 31 + f, 4, 6 - f, '#7a2a10'); R(g, 28, 32 - f, 4, 5 + f, '#7a2a10');
        E(g, 19, 21, 15, 12, '#e8642a'); atop(g, () => R(g, 0, 27, 38, 12, '#b84a1a'));
        E(g, 19, 25, 9, 8, '#3a3f52'); R(g, 15, 21, 3, 1, '#5a6078'); R(g, 17, 22, 5, 5, f ? '#ff3b3b' : '#ffe14a'); R(g, 18, 23, 3, 3, '#ffffff');
        R(g, 24, 4, 2, 8, '#3a3f52'); R(g, 22, 1, 6, 4, f ? '#ffe14a' : '#ff9a3d'); R(g, 23, 0, 4, 2, '#ffffff');
        R(g, 6, 14, 7, 5, '#ffffff'); R(g, 6, 15, 3, 4, '#22103a'); R(g, 15, 13, 7, 5, '#ffffff'); R(g, 15, 14, 3, 4, '#22103a');
        R(g, 5, 11, 9, 2, '#7a2a10'); R(g, 14, 10, 9, 2, '#7a2a10');
        R(g, 2, 22, 5, 4, '#e8642a');
      });
    },
    medic(f) {
      return build(46, 56, g => {
        const sw = f ? 1 : 0;
        R(g, 8 - sw, 32, 30 + sw * 2, 22, '#2a9c86'); R(g, 6 - sw, 48, 34 + sw * 2, 6, '#1d7060');
        atop(g, () => R(g, 0, 44, 46, 14, '#238a76'));
        R(g, 30, 14, 13, 24, '#2a8f78'); R(g, 31, 15, 11, 3, '#5fd6bf');
        R(g, 34, 20, 4, 12, f ? '#b6ff9a' : '#8dff7a'); R(g, 30, 24, 12, 4, f ? '#b6ff9a' : '#8dff7a');
        R(g, 12, 24, 20, 12, '#3ab8a0'); R(g, 12, 24, 20, 3, '#7ae6d0');
        E(g, 22, 15, 10, 10, '#a8f0e0'); atop(g, () => R(g, 0, 20, 46, 8, '#8ad8c8'));
        R(g, 15, 12, 5, 5, '#1a3a3a'); R(g, 16, 13, 2, 2, '#ffffff'); R(g, 24, 12, 5, 5, '#1a3a3a'); R(g, 25, 13, 2, 2, '#ffffff');
        R(g, 17, 20, 8, 1, '#1a3a3a');
        R(g, 5, 8, 3, 42, '#8a6a3a'); E(g, 6, 7, 5, 5, f ? '#b6ff9a' : '#8dff7a'); E(g, 6, 7, 2, 2, '#ffffff');
        R(g, 7, 28, 8, 4, '#3ab8a0');
      });
    },
    juggernaut(f) {
      return build(74, 68, g => {
        const lo = f ? 2 : 0;
        R(g, 22, 48 + lo, 14, 19 - lo, '#4a3535'); R(g, 40, 49 - lo, 14, 18 + lo, '#4a3535');
        R(g, 19, 63, 19, 5, '#2a2a3a'); R(g, 38, 63, 19, 5, '#2a2a3a');
        R(g, 56, 30, 14, 24, '#5a3a3a'); R(g, 58, 50, 12, 8, '#7a4a4a');
        R(g, 16, 22, 46, 30, '#8a3a3a'); atop(g, () => R(g, 0, 44, 74, 24, '#6a2a2a'));
        R(g, 20, 26, 38, 22, '#6a6f86'); R(g, 20, 26, 38, 3, '#a0a6be'); R(g, 20, 44, 38, 4, '#4a4f66');
        R(g, 26, 32, 3, 12, '#ff7a1a'); R(g, 47, 34, 3, 10, '#ff7a1a'); R(g, 36, 30, 6, 14, '#ff9a3d'); R(g, 37, 32, 4, 10, '#ffe14a');
        E(g, 14, 25, 10, 9, '#8f95ae'); R(g, 12, 12, 3, 8, '#d8dff0'); R(g, 18, 13, 3, 7, '#d8dff0'); R(g, 6, 18, 3, 6, '#d8dff0');
        E(g, 60, 25, 9, 8, '#8f95ae'); R(g, 60, 13, 3, 8, '#d8dff0'); R(g, 66, 16, 3, 7, '#d8dff0');
        R(g, 2, 34, 18, 13, '#6a6f86'); E(g, 5, 42, 8, 8, '#8a3a3a'); R(g, 4, 36, 3, 8, '#ff7a1a');
        E(g, 39, 14, 11, 10, '#7a3232'); atop(g, () => R(g, 0, 20, 74, 8, '#5a2626'));
        R(g, 30, 12, 18, 5, '#1a1a28'); R(g, 32, 13, 5, 3, '#ff3b3b'); R(g, 41, 13, 5, 3, '#ff3b3b');
        R(g, 30, 3, 4, 8, '#8f95ae'); R(g, 44, 3, 4, 8, '#8f95ae');
      });
    },
    scorpion(f) {
      return build(66, 42, g => {
        for (let i = 0; i < 4; i++) { const x = 18 + i * 9, o = (i + f) % 2; R(g, x, 30 + o, 3, 9 - o, '#7a4a12'); R(g, x - 2, 38, 6, 2, '#4a2a08'); }
        R(g, 52, 26, 8, 6, '#c9903a'); R(g, 58, 18, 7, 10, '#c9903a'); R(g, 58, 10, 7, 9, '#b07a28'); R(g, 52, 4, 10, 7, '#b07a28'); R(g, 46, 3, 8, 6, '#c9903a');
        R(g, 42, 7, 5, 5, '#c25aff'); R(g, 41, 10, 3, 4, '#eab0ff');
        E(g, 32, 27, 20, 9, '#c9903a'); atop(g, () => R(g, 0, 31, 66, 12, '#a67424'));
        E(g, 30, 24, 16, 5, '#e0b060'); R(g, 20, 20, 2, 10, '#8a5a18'); R(g, 28, 19, 2, 11, '#8a5a18'); R(g, 36, 19, 2, 11, '#8a5a18');
        R(g, 4, 24, 12, 6, '#a67424'); R(g, 0, 19 + f, 7, 6, '#e0b060'); R(g, 0, 28 - f, 7, 6, '#e0b060'); R(g, 4, 21, 3, 3, '#a67424');
        R(g, 15, 21, 3, 3, '#22103a'); R(g, 15, 21, 1, 1, '#ffffff'); R(g, 20, 20, 3, 3, '#22103a');
      });
    },
    burrower(f) {
      return build(46, 54, g => {
        E(g, 23, 50, 21, 5, '#a88850');
        R(g, 12, 24, 22, 26, '#d8b070'); E(g, 23, 27, 11, 14, '#d8b070');
        for (let y = 28; y < 49; y += 5) R(g, 12, y, 22, 1, '#a88850');
        atop(g, () => R(g, 0, 40, 46, 16, '#b89860'));
        E(g, 23, 14, 11, 11, '#e6c48a');
        E(g, 14, 16, 6, 7, '#3a1a10'); R(g, 9, 11, 2, 3, '#ffffff'); R(g, 9, 19, 2, 3, '#ffffff'); R(g, 12, 9, 2, 3, '#ffffff'); R(g, 12, 23, 2, 3, '#ffffff');
        R(g, 24, 8, 4, 4, '#22103a'); R(g, 25, 9, 1, 1, '#ffffff');
        R(g, 3, 33 + f, 10, 4, '#e6c48a'); R(g, 0, 31 + f, 4, 3, '#ffffff'); R(g, 0, 36 + f, 4, 3, '#ffffff');
        R(g, 34, 34, 8, 4, '#d8b070');
      });
    },
    cactus(f) {
      return build(62, 68, g => {
        const lo = f ? 1 : 0;
        R(g, 20, 56 + lo, 8, 11 - lo, '#2a7a34'); R(g, 34, 57 - lo, 8, 10 + lo, '#2a7a34'); R(g, 17, 65, 13, 3, '#5a3a1a'); R(g, 32, 65, 13, 3, '#5a3a1a');
        R(g, 16, 16, 30, 42, '#3f9a48'); R(g, 22, 16, 2, 42, '#2a7a34'); R(g, 30, 16, 2, 42, '#2a7a34'); R(g, 38, 16, 2, 42, '#2a7a34'); R(g, 18, 16, 3, 42, '#6fd078');
        atop(g, () => R(g, 0, 46, 62, 24, '#33853c'));
        R(g, 4, 28, 13, 8, '#3f9a48'); R(g, 4, 10, 8, 20, '#3f9a48'); R(g, 5, 10, 3, 20, '#6fd078');
        R(g, 45, 32, 13, 8, '#3f9a48'); R(g, 52, 18, 8, 16, '#3f9a48'); R(g, 53, 18, 3, 16, '#6fd078');
        for (let i = 0; i < 9; i++) { R(g, 13, 18 + i * 5, 3, 2, '#f0f0a0'); R(g, 46, 20 + i * 5, 3, 2, '#f0f0a0'); }
        R(g, 2, 8, 2, 4, '#f0f0a0'); R(g, 9, 6, 2, 4, '#f0f0a0'); R(g, 54, 14, 2, 4, '#f0f0a0'); R(g, 58, 16, 2, 4, '#f0f0a0');
        R(g, 21, 24, 7, 5, '#ffe14a'); R(g, 23, 25, 3, 3, '#22103a'); R(g, 33, 24, 7, 5, '#ffe14a'); R(g, 35, 25, 3, 3, '#22103a');
        R(g, 20, 21, 9, 2, '#1a3a1a'); R(g, 32, 21, 9, 2, '#1a3a1a');
        R(g, 24, 36, 14, 4, '#1a3a1a'); R(g, 25, 36, 2, 2, '#ffffff'); R(g, 29, 36, 2, 2, '#ffffff'); R(g, 33, 36, 2, 2, '#ffffff');
        E(g, 31, 13, 5, 4, '#ff5ad8'); R(g, 30, 11, 3, 3, '#ffe14a');
      });
    },
    hopper(f) {
      return build(44, 44, g => {
        if (f) { R(g, 28, 24, 14, 4, '#8a90b0'); R(g, 38, 22, 5, 6, '#6a7090'); } else { R(g, 26, 28, 10, 10, '#8a90b0'); R(g, 32, 36, 8, 4, '#6a7090'); }
        E(g, 20, 27, 12, 10, '#b8c0d8'); atop(g, () => R(g, 0, 32, 44, 14, '#98a0c0'));
        E(g, 18, 29, 7, 6, '#dfe6f5');
        E(g, 14, 18, 9, 8, '#c8d0e8');
        R(g, 8, 8, 2, 9, '#7a80a0'); E(g, 9, 7, 3, 3, '#7ffcff'); R(g, 15, 5, 2, 10, '#7a80a0'); E(g, 16, 4, 3, 3, '#7ffcff');
        R(g, 9, 17, 5, 5, '#22103a'); R(g, 10, 18, 2, 2, '#ffffff'); R(g, 17, 16, 5, 5, '#22103a'); R(g, 18, 17, 2, 2, '#ffffff');
        R(g, 6, 23, 8, 2, '#22103a');
        R(g, 6, 30, 6, 3, '#98a0c0'); R(g, 4, 32, 3, 4, '#98a0c0'); R(g, 12, 37, 8, 3, '#6a7090');
      });
    },
    astronaut(f) {
      return build(48, 60, g => {
        const lo = f ? 1 : 0;
        R(g, 15, 44 + lo, 7, 13 - lo, '#c9d0e4'); R(g, 26, 45 - lo, 7, 12 + lo, '#c9d0e4'); R(g, 13, 56, 10, 4, '#5a5f78'); R(g, 25, 56, 10, 4, '#5a5f78');
        R(g, 33, 24, 8, 18, '#8a8fa8'); R(g, 34, 24, 6, 3, '#c9cee4'); R(g, 36, 30, 3, 3, '#ff9a3d');
        R(g, 12, 24, 23, 22, '#dfe6f5'); R(g, 12, 24, 23, 3, '#ffffff'); R(g, 15, 30, 8, 6, '#ff5a3a'); R(g, 16, 31, 6, 4, '#ffb84a'); R(g, 26, 30, 6, 8, '#8a8fa8');
        atop(g, () => R(g, 0, 40, 48, 22, '#b8c0d8'));
        R(g, 5, 28, 9, 6, '#dfe6f5'); R(g, 0, 26, 9, 6, '#3a3f52'); R(g, 0, 27, 3, 3, '#7ffcff');
        E(g, 22, 15, 12, 12, '#dfe6f5'); E(g, 21, 15, 9, 9, '#7ad8ff'); E(g, 20, 16, 5, 5, '#7ad04a');
        R(g, 17, 15, 2, 2, '#22103a'); R(g, 22, 14, 2, 2, '#22103a'); R(g, 16, 5, 6, 2, '#ffffff');
        R(g, 6, 10, 2, 2, '#ffffff');
      });
    },
    shade(f) {
      return build(44, 60, g => {
        for (let y = 12; y < 50; y++) { const hw = Math.round(5 + (y - 12) * 0.3); R(g, 22 - hw, y, hw * 2, 1, y % 6 < 3 ? '#2a1a4a' : '#341f5c'); }
        for (let i = 0; i < 5; i++) { const x = 8 + i * 6 + ((i + f) % 2), h = 6 + ((i * 3 + f * 2) % 5); R(g, x, 50, 4, h, '#2a1a4a'); R(g, x + 1, 50 + h, 2, 2, '#4a2a7a'); }
        atop(g, () => R(g, 0, 40, 44, 24, '#221340'));
        E(g, 22, 14, 10, 11, '#1a0f30'); R(g, 15, 13, 5, 3, '#ff5ad8'); R(g, 24, 13, 5, 3, '#ff5ad8'); R(g, 16, 14, 2, 1, '#ffffff'); R(g, 25, 14, 2, 1, '#ffffff');
        R(g, 5, 28, 10, 3, '#6a4aa0'); R(g, 2, 26, 5, 2, '#a080e0'); R(g, 2, 31, 5, 2, '#a080e0');
        R(g, 30, 30, 9, 3, '#6a4aa0');
      });
    },
    golem(f) {
      return build(62, 68, g => {
        const lo = f ? 1 : 0;
        R(g, 18, 52 + lo, 10, 15 - lo, '#1a7a8a'); R(g, 34, 53 - lo, 10, 14 + lo, '#1a7a8a'); R(g, 16, 64, 14, 4, '#0f4a56'); R(g, 33, 64, 14, 4, '#0f4a56');
        R(g, 14, 20, 34, 34, '#3ac2c8'); R(g, 14, 20, 34, 3, '#8ffcff'); R(g, 18, 26, 12, 12, '#2aa0a8'); R(g, 34, 30, 10, 16, '#2aa0a8');
        R(g, 24, 34, 12, 12, '#ff5ad8'); R(g, 27, 37, 6, 6, '#ffd0f8');
        atop(g, () => R(g, 0, 44, 62, 26, '#1a8a96'));
        R(g, 6, 18, 12, 12, '#5ae0e8'); R(g, 8, 8, 4, 12, '#8ffcff'); R(g, 13, 12, 3, 8, '#8ffcff');
        R(g, 44, 18, 12, 12, '#5ae0e8'); R(g, 48, 8, 4, 12, '#8ffcff'); R(g, 54, 14, 3, 8, '#8ffcff');
        R(g, 2, 30, 12, 20, '#3ac2c8'); R(g, 2, 46, 12, 8, '#8ffcff'); R(g, 48, 30, 12, 20, '#3ac2c8');
        R(g, 22, 8, 18, 14, '#5ae0e8'); R(g, 26, 2, 4, 8, '#8ffcff'); R(g, 32, 4, 4, 6, '#8ffcff');
        R(g, 24, 13, 5, 4, '#ff5ad8'); R(g, 33, 13, 5, 4, '#ff5ad8');
      });
    },
    shard(f) {
      return build(32, 36, g => {
        R(g, 9, 30 + f, 4, 5 - f, '#1a7a8a'); R(g, 19, 31 - f, 4, 4 + f, '#1a7a8a');
        E(g, 16, 20, 8, 12, '#5ae0e8'); atop(g, () => R(g, 0, 26, 32, 12, '#3ac2c8'));
        R(g, 15, 4, 3, 12, '#8ffcff'); R(g, 6, 11, 3, 9, '#8ffcff'); R(g, 23, 11, 3, 9, '#8ffcff');
        R(g, 11, 18, 3, 3, '#22103a'); R(g, 18, 18, 3, 3, '#22103a'); R(g, 12, 18, 1, 1, '#ffffff'); R(g, 19, 18, 1, 1, '#ffffff');
        R(g, 13, 24, 6, 2, '#ff5ad8');
      });
    },
    brood(f) {
      return build(68, 62, g => {
        for (let i = 0; i < 3; i++) { const x = 18 + i * 10, o = (i + f) % 2; R(g, x, 46 + o, 3, 12 - o, '#5a2a52'); R(g, x - 2, 57, 7, 3, '#3a1a34'); }
        E(g, 44, 36, 21, 19, '#8a3a7a'); atop(g, () => R(g, 0, 44, 68, 20, '#6a2a5e'));
        E(g, 40, 30, 14, 9, '#a84a94');
        E(g, 38, 30, 4, 4, '#ffe14a'); E(g, 46, 28, 3, 3, '#ffe14a'); E(g, 52, 34, 4, 4, '#ffe14a'); E(g, 44, 40, 3, 3, '#ffe14a'); E(g, 36, 40, 3, 3, '#ffe14a');
        E(g, 18, 28, 11, 10, '#a04a8a'); atop(g, () => R(g, 0, 33, 68, 6, '#8a3a7a'));
        R(g, 3, 27, 10, 3, '#d8c0e0'); R(g, 3, 33, 10, 3, '#d8c0e0'); R(g, 2, 30, 4, 3, '#ffffff');
        R(g, 13, 20, 5, 5, '#ffe14a'); R(g, 14, 21, 2, 3, '#22103a'); R(g, 21, 21, 5, 5, '#ffe14a'); R(g, 22, 21, 2, 3, '#22103a');
        R(g, 15, 14, 2, 7, '#5a2a52'); R(g, 22, 14, 2, 7, '#5a2a52');
      });
    },
    larva(f) {
      return build(30, 26, g => {
        const w = f ? 1 : 0;
        E(g, 17, 16, 9, 6, '#e89ac0'); E(g, 24, 16 + w, 5, 4, '#e07aa8'); R(g, 11, 12, 1, 8, '#c86a98'); R(g, 17, 11, 1, 9, '#c86a98');
        E(g, 8, 14 + w, 6, 6, '#f0b0d0'); R(g, 5, 11 + w, 3, 3, '#22103a'); R(g, 6, 12 + w, 1, 1, '#ffffff'); R(g, 3, 17 + w, 4, 1, '#22103a');
      });
    },
    mindsquid(f) {
      return build(48, 66, g => {
        E(g, 24, 20, 16, 15, '#7a5ad0'); atop(g, () => R(g, 0, 26, 48, 14, '#5a3ab0'));
        E(g, 22, 15, 9, 6, '#a08af5');
        R(g, 12, 8, 2, 8, '#ff8af0'); R(g, 20, 5, 2, 8, '#ff8af0'); R(g, 29, 7, 2, 9, '#ff8af0'); R(g, 14, 11, 8, 1, '#ff8af0'); R(g, 24, 10, 8, 1, '#ff8af0');
        R(g, 12, 21, 8, 8, '#ffffff'); R(g, 14, 23, 5, 5, '#ff5ad8'); R(g, 15, 24, 2, 2, '#22103a'); R(g, 28, 21, 8, 8, '#ffffff'); R(g, 30, 23, 5, 5, '#ff5ad8'); R(g, 31, 24, 2, 2, '#22103a');
        R(g, 21, 31, 6, 3, '#3a1a70');
        for (let i = 0; i < 5; i++) {
          const x = 10 + i * 7, w = (i + f) % 2;
          R(g, x + w, 34, 4, 10, '#a08af5'); R(g, x - w + 1, 44, 4, 10, '#8a70e0'); R(g, x + w, 54, 4, 8, '#a08af5'); R(g, x + w, 61, 3, 2, '#ff8af0');
        }
      });
    },
    mothership() {
      return build(230, 110, g => {
        R(g, 100, 92, 30, 14, '#3a2470'); R(g, 106, 100, 18, 6, '#ff5ad8'); R(g, 110, 104, 10, 4, '#ffe14a');
        E(g, 115, 74, 108, 24, '#3a2470');
        E(g, 115, 66, 108, 20, '#5a3aa0');
        atop(g, () => { R(g, 0, 78, 230, 40, '#2c1a58'); R(g, 0, 86, 230, 30, '#231548'); });
        E(g, 115, 58, 100, 12, '#7b52c9');
        E(g, 115, 32, 46, 30, '#5cf7ff');
        atop(g, () => { R(g, 0, 44, 230, 30, '#2f9fd0'); });
        E(g, 115, 32, 40, 25, '#a8fbff');
        R(g, 104, 22, 22, 26, '#3b8f5a'); E(g, 115, 20, 12, 11, '#5fd68a');
        R(g, 106, 18, 6, 6, '#111a2a'); R(g, 118, 18, 6, 6, '#111a2a'); R(g, 108, 19, 2, 3, '#ffffff'); R(g, 120, 19, 2, 3, '#ffffff');
        for (let i = 0; i < 6; i++) { R(g, 24 + i * 6, 62 + Math.floor(i / 2), 4, 2, '#3a2470'); R(g, 200 - i * 6, 62 + Math.floor(i / 2), 4, 2, '#3a2470'); }
        R(g, 30, 74, 170, 1, '#7b52c9'); R(g, 60, 82, 110, 1, '#4a2f8a');
        R(g, 40, 50, 3, 10, '#8a8fa8'); R(g, 187, 50, 3, 10, '#8a8fa8'); E(g, 41, 48, 4, 4, '#ff5ad8'); E(g, 188, 48, 4, 4, '#ff5ad8');
      }, 2);
    }
  };

  const ITEMDRAW = {
    firewall(state, f) {
      return build(36, 54, g => {
        R(g, 0, 47, 36, 6, '#2a2a3d'); R(g, 0, 47, 36, 1, '#5a5f78');
        R(g, 2, 12, 32, 36, '#0f1a30'); R(g, 2, 12, 2, 36, '#c94a1a'); R(g, 32, 12, 2, 36, '#c94a1a'); R(g, 2, 12, 32, 2, '#ff9a3d');
        for (let y = 16; y < 46; y += 5) {
          for (let x = 5; x < 30; x += 5) {
            const v = (x * 7 + y * 3 + f * 5) % 5;
            if (v === 0) continue;
            const c = v % 2 ? '#3dff7a' : '#5cf7ff';
            R(g, x, y, 3, 1, c); if (v > 2) R(g, x, y + 2, 2, 1, c); R(g, x + (v % 2), y + 1, 1, 2, c);
          }
        }
        const fl = state === 0 ? 1 : state === 1 ? 0.7 : 0.45;
        for (let i = 0; i < 6; i++) {
          const x = 3 + i * 5, h = Math.round((7 + ((i * 3 + f * 2) % 5) * 2) * fl);
          R(g, x, 12 - h, 4, h, state === 2 ? '#c93a1a' : '#ff5a1a'); R(g, x + 1, 12 - Math.round(h * 0.7), 2, Math.round(h * 0.7), '#ffb84a'); R(g, x + 1, 12 - h, 2, 2, '#ffe98a');
        }
        if (state >= 1) {
          R(g, 10, 22, 2, 10, '#05051a'); R(g, 12, 30, 2, 5, '#05051a'); R(g, 4, 27, 28, 1, '#ff5ad8'); R(g, 20, 34, 8, 5, '#05051a'); R(g, 22, 33, 5, 1, '#ff5ad8');
        }
        if (state >= 2) {
          R(g, 5, 16, 9, 7, '#05051a'); R(g, 5, 15, 9, 1, '#ff5ad8'); R(g, 24, 18, 7, 9, '#05051a'); R(g, 3, 40, 30, 1, '#ff5ad8'); R(g, 14, 36, 6, 8, '#05051a');
        }
      });
    },
    dynamite(f) {
      return build(34, 42, g => {
        R(g, 5, 15, 8, 25, '#a81e26'); R(g, 13, 12, 8, 28, '#d8343a'); R(g, 21, 15, 8, 25, '#a81e26');
        R(g, 6, 16, 2, 22, '#ff6a6a'); R(g, 14, 13, 2, 25, '#ff8a8a'); R(g, 22, 16, 2, 22, '#ff6a6a');
        R(g, 3, 23, 28, 5, '#2a2a3d'); R(g, 3, 23, 28, 1, '#5a5f78');
        R(g, 8, 24, 4, 1, '#ffd23f'); R(g, 9, 24, 2, 3, '#ffd23f'); R(g, 15, 24, 1, 3, '#ffd23f'); R(g, 15, 24, 4, 1, '#ffd23f'); R(g, 18, 24, 1, 3, '#ffd23f'); R(g, 23, 24, 4, 1, '#ffd23f'); R(g, 24, 24, 2, 3, '#ffd23f');
        R(g, 16, 6, 2, 7, '#c9a56a'); R(g, 17, 3, 4, 3, '#c9a56a'); R(g, 20, 1, 2, 3, '#c9a56a');
        E(g, 22, 1, 3, 3, f ? '#ffe14a' : '#ff9a3d'); R(g, 21, 0, 2, 2, '#ffffff');
        R(g, 3, 38, 28, 3, '#7a1218');
      });
    }
  };

  S.DRAW = DRAW; S.kit = { R, E, atop, build, mk };

  function energyCell() {
    const [c, g] = mk(16, 22);
    R(g, 5, 0, 6, 3, '#9aa0b8'); R(g, 6, 0, 4, 1, '#d6dbef');
    R(g, 2, 3, 12, 17, '#ffd23f'); R(g, 3, 4, 3, 15, '#fff08a'); R(g, 11, 4, 2, 15, '#e0a100');
    R(g, 8, 6, 3, 4, '#ffffff'); R(g, 6, 9, 5, 3, '#ffffff'); R(g, 5, 12, 3, 5, '#ffffff'); R(g, 7, 14, 2, 3, '#fff08a');
    outline(c, '#7a4a00');
    return c;
  }

  S.alien = function (type, frame) {
    const key = type + (frame ? 1 : 0);
    if (!S.aliens[key]) {
      if (type === 'prime') S.aliens[key] = DRAW.commander(frame, true);
      else S.aliens[key] = DRAW[type](frame);
    }
    return S.aliens[key];
  };

  S.sil = function (canvas, color) {
    const key = canvas._id || (canvas._id = Math.random().toString(36).slice(2));
    const k = key + color;
    if (S.cache[k]) return S.cache[k];
    const [c, g] = mk(canvas.width, canvas.height);
    g.drawImage(canvas, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
    S.cache[k] = c;
    return c;
  };

  S.alienURL = function (type) {
    const c = S.alien(type, 0);
    return c.toDataURL();
  };

  const FRAME_ROWS = { idle: [0, 4], attack: [1, 4], hit: [2, 2], die: [3, 5], special: [4, 3] };

  function sliceStrip(im, rows) {
    const cols = 5, fw = Math.round(im.width / cols), fh = Math.round(im.height / rows);
    const out = { w: fw, h: fh };
    Object.keys(FRAME_ROWS).forEach(k => {
      if (rows === 1) return;
      out[k] = [];
      for (let i = 0; i < FRAME_ROWS[k][1]; i++) {
        const [c, g] = mk(fw, fh);
        g.drawImage(im, i * fw, FRAME_ROWS[k][0] * fh, fw, fh, 0, 0, fw, fh);
        out[k].push(c);
      }
    });
    return out;
  }

  S.load = function (done) {
    S.frames = {};
    const jobs = [];
    H.HUMANS.forEach(h => { jobs.push({ src: h.id, kind: 'sprite' }); jobs.push({ src: 'frames_' + h.id, kind: 'frames', id: h.id }); });
    jobs.push({ src: 'drone', kind: 'sprite' }, { src: 'frames_drone', kind: 'drone' });
    let left = jobs.length;
    jobs.forEach(j => {
      const im = new Image();
      im.onload = () => {
        if (j.kind === 'sprite') {
          const [c, g] = mk(im.width, im.height);
          g.drawImage(im, 0, 0);
          S.human[j.src] = c;
        } else if (j.kind === 'frames') {
          S.frames[j.id] = sliceStrip(im, 5);
        } else {
          const fw = Math.round(im.width / 2);
          S.frames.drone = { w: fw, h: im.height, fly: [0, 1].map(i => { const [c, g] = mk(fw, im.height); g.drawImage(im, i * fw, 0, fw, im.height, 0, 0, fw, im.height); return c; }) };
        }
        if (--left === 0) finish();
      };
      im.onerror = () => { if (--left === 0) finish(); };
      im.src = H.asset('assets/' + j.src + '.png');
    });
    function finish() {
      Object.keys(DRAW).forEach(k => { S.alien(k, 0); S.alien(k, 1); });
      S.alien('prime', 0); S.alien('prime', 1);
      S.energy = energyCell();
      S.reactor = [DRAW.reactor(0), DRAW.reactor(1)];
      S.firewall = [0, 1, 2].map(st => [ITEMDRAW.firewall(st, 0), ITEMDRAW.firewall(st, 1)]);
      S.dynamite = [ITEMDRAW.dynamite(0), ITEMDRAW.dynamite(1)];
      S.itemSprite = id => id === 'reactor' ? S.reactor[0] : id === 'firewall' ? S.firewall[0][0] : S.dynamite[0];
      S.itemURL = id => S.itemSprite(id).toDataURL();
      S.reactorURL = () => S.reactor[0].toDataURL();
      S.ready = true;
      done();
    }
  };
})(window.HVA);
