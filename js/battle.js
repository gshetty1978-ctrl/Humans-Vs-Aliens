(function (H) {
  const G = H.G;
  const FIELD_R = G.GX + G.COLS * G.CW;
  const AL_SCALE = 1.5;
  const AP = { sniper: 0.6, gold: 0.3, plasma: 0.3, laser: 0.15, ult: 1 };
  const RECHARGE = { ryan: 5, lucy: 7.5, tom: 10, maya: 8, sam: 12, eli: 12, priya: 14, max: 20, reactor: 7.5, firewall: 20, dynamite: 30 };
  H.RECHARGE = RECHARGE;
  const BOSS_MULT = { commander: 2, shield: 4, prime: 1.5, frosttitan: 3, magmawyrm: 3, kraken: 3, voidtitan: 4, swamphydra: 4, stormcolossus: 4, pharaoh: 4, omegaprime: 5 };
  const BURST = {
    slime: ['#34c95f', '#7dffa0', '#1f8d43'], grunt: ['#8a4fd6', '#a56cf0', '#8d93a8'], brute: ['#a97347', '#8f5d3a', '#6b6f80'],
    zapper: ['#9b5de5', '#7ffcff', '#ffe14a'], jet: ['#ff7a59', '#ffd23f', '#8a8fa8'], shield: ['#3a7bd5', '#5cf7ff', '#6fa8ff'],
    trooper: ['#6a7088', '#9aa0b8', '#ff5a3a'], spiker: ['#2f6f8f', '#4fa3c7', '#e8ecf8'], spitter: ['#8fd03a', '#b6ff3a', '#eaffb0'],
    bomber: ['#e8642a', '#ffe14a', '#3a3f52'], medic: ['#3ab8a0', '#8dff7a', '#a8f0e0'], juggernaut: ['#8a3a3a', '#8f95ae', '#ff7a1a'],
    scorpion: ['#c9903a', '#e0b060', '#c25aff'], burrower: ['#d8b070', '#e6c48a', '#a88850'], cactus: ['#3f9a48', '#6fd078', '#f0f0a0'],
    hopper: ['#b8c0d8', '#dfe6f5', '#7ffcff'], astronaut: ['#dfe6f5', '#7ad8ff', '#ff9a3d'], shade: ['#2a1a4a', '#ff5ad8', '#6a4aa0'],
    golem: ['#3ac2c8', '#8ffcff', '#ff5ad8'], shard: ['#5ae0e8', '#8ffcff', '#ffffff'], brood: ['#8a3a7a', '#ffe14a', '#a84a94'],
    larva: ['#e89ac0', '#f0b0d0', '#c86a98'], mindsquid: ['#7a5ad0', '#ff8af0', '#a08af5'],
    commander: ['#c2185b', '#ffd23f', '#e8467f'], prime: ['#3a2f8f', '#5cf7ff', '#ff5ad8'], mothership: ['#7b52c9', '#5cf7ff', '#ff5ad8']
  };
  const MUZZLE = {
    ryan: [0.97, 0.37], lucy: [0.98, 0.42], tom: [0.9, 0.5], maya: [0.8, 0.62], sam: [1, 0.37], eli: [0.9, 0.62], priya: [0.98, 0.7], max: [1, 0.62]
  };
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };
  const rand = (a, b) => a + Math.random() * (b - a);
  const cellX = c => G.GX + c * G.CW;
  const cellCX = c => G.GX + c * G.CW + G.CW / 2;
  const rowTop = r => G.GY + r * G.RH;
  const footY = r => G.GY + r * G.RH + G.RH - 8;
  H.cellCX = cellCX;

  class Battle {
    constructor(canvas, level, selected, hooks) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.ctx.imageSmoothingEnabled = false;
      this.level = level;
      this.world = H.WORLDS[level.world - 1];
      this.theme = this.world.theme;
      this.selectedIds = selected;
      this.hooks = hooks;
      this.bg = G.buildBackground(this.theme, level.idx * 13 + 3);
      G.Fx.init(this.theme);
      const bonus = H.Save.data.bonusEnergy || 0;
      this.startBonus = bonus;
      H.Save.data.bonusEnergy = 0;
      this.energy = 250 + bonus;
      this.baseHp = 100; this.baseMax = 100; this.baseFlash = 0;
      this.humans = []; this.aliens = []; this.projs = []; this.parts = []; this.floats = []; this.drops = []; this.aprojs = [];
      this.beams = []; this.zones = []; this.blasts = [];
      this.cells = []; for (let r = 0; r < G.ROWS; r++) this.cells.push(new Array(G.COLS).fill(null));
      this.laneOff = new Array(G.ROWS).fill(0);
      this.time = 0; this.speed = 1; this.paused = false; this.state = 'running';
      this.waveNo = 0; this.waveTotal = level.waves; this.queue = []; this.lastWaveAt = -999; this.nextWaveAt = 16;
      this.finalPending = 0; this.allSpawned = false; this.endT = 0;
      this.dropT = 3.5; this.shake = 0; this.flashScreen = 0;
      this.selected = null; this.hover = null; this.pointer = null;
      this.stats = { kills: 0, energy: 0, placed: 0, baseLost: 0, boss: false };
      this.boss = null; this.ms = null; this.lastRow = -1; this.cd = {};
      this.hint = 0;
      this.sandbox = !!level.sandbox; this.spawnSel = null; this.spawnBoss = false; this.maxUp = false;
      if (this.sandbox) { this.energy = 99999; this.nextWaveAt = 1e9; this.dropT = 1e9; }
      this.hooks.banner && this.hooks.banner(this.sandbox ? 'SANDBOX — NOTHING IS SAVED' : 'WAVE 1 IN ' + Math.round(this.nextWaveAt) + 's — COLLECT ⚡', 'info');
    }

    up(id) { return this.sandbox && this.maxUp ? { dmg: 5, hp: 5, spd: 5, rng: 5, spc: 5 } : H.Save.upgrades(id); }
    hdef(id) { return H.defOf(id); }

    select(id) {
      if (this.state !== 'running') return;
      if (this.sandbox) this.spawnSel = null;
      if (this.selected === id) { this.selected = null; return; }
      const d = this.hdef(id);
      if (!d) return;
      if ((this.cd[id] || 0) > 0) { H.Sound.deny(); this.floatText(G.W / 2, 40, 'RECHARGING…', '#ff6b6b', 12); return; }
      if (this.energy < d.cost) { H.Sound.deny(); this.floatText(G.W / 2, 40, 'NEED ' + d.cost + ' ⚡', '#ff6b6b', 12); return; }
      this.selected = id; H.Sound.click();
    }
    cancel() { this.selected = null; this.spawnSel = null; }

    cellAt(x, y) {
      const col = Math.floor((x - G.GX) / G.CW), row = Math.floor((y - G.GY) / G.RH);
      if (col < 0 || col >= G.COLS || row < 0 || row >= G.ROWS) return null;
      return { row, col };
    }
    pointerMove(x, y) { this.pointer = { x, y }; this.hover = this.cellAt(x, y); }

    pointerDown(x, y) {
      if (this.state !== 'running' || this.paused) return;
      this.pointer = { x, y };
      if (this.sandbox && this.spawnSel && !this.selected) {
        const row = Math.floor((y - G.GY) / G.RH);
        if (row >= 0 && row < G.ROWS && x > G.GX - 10) this.spawnAt(this.spawnSel, row, Math.min(x, FIELD_R + 14), this.spawnBoss);
        return;
      }
      let best = null, bd = 1e9;
      for (const d of this.drops) {
        if (d.taken || d.state === 'gone') continue;
        const dx = Math.abs(x - d.x), dy = Math.abs(y - (d.y - 12));
        if (dx < 40 && dy < 46 && dx + dy < bd) { best = d; bd = dx + dy; }
      }
      if (best) { this.collect(best); return; }
      const cell = this.cellAt(x, y);
      if (!cell) { return; }
      const occ = this.cells[cell.row][cell.col];
      if (this.selected) {
        if (!occ) this.place(cell.row, cell.col);
        else { H.Sound.deny(); this.floatText(cellCX(cell.col), rowTop(cell.row) + 20, 'OCCUPIED', '#ff6b6b', 10); }
        return;
      }
      if (occ && occ.id === 'max' && !occ.dead) this.tryUlt(occ);
    }

    collectAll() {
      if (this.state !== 'running' || this.paused) return 0;
      let total = 0, n = 0;
      for (const d of this.drops) {
        if (d.taken || d.state === 'gone') continue;
        d.taken = true; d.state = 'gone'; total += d.value; n++;
        this.burst(d.x, d.y - 10, 8, ['#ffe14a', '#fff08a', '#ffffff'], 80, 0, 0.5, 3);
      }
      if (!n) return 0;
      this.energy += total; this.stats.energy += total;
      H.Sound.energy();
      this.floatText(G.W / 2, G.GY + 34, '+' + total + ' ⚡ COLLECTED!', '#ffe14a', 12);
      return total;
    }

    place(row, col) {
      const d = this.hdef(this.selected);
      if (!d || this.cells[row][col] || this.energy < d.cost || (this.cd[d.id] || 0) > 0) return false;
      if (!this.sandbox) { this.energy -= d.cost; this.cd[d.id] = RECHARGE[d.id] || 8; }
      const up = this.up(d.id);
      const hp = H.stat(d, up, 'hp');
      const h = {
        id: d.id, def: d, up, row, col, x: cellCX(col), hp, maxhp: hp, cdT: 0.5, animT: Math.random() * 6, atk: 0, hit: 0, dead: false,
        deathT: 0, disabled: 0, pend: [], healT: 3, buildT: d.id === 'eli' ? 3.5 : 0, building: 0, drone: null, ultT: d.id === 'max' ? 6 : 0,
        ultReady: false, aim: 0, spawnT: 0.35, zapFx: 0, shieldFlash: 0, ultAnim: 0, prodT: 5, fuseT: d.id === 'dynamite' ? 1.5 : 0
      };
      this.humans.push(h); this.cells[row][col] = h;
      this.stats.placed++;
      H.Sound.place(); H.Sound.buy();
      this.burst(h.x, footY(row), 12, ['#ffffff', '#54c7ff', '#cfe8ff'], 60, 0, 0.5, 3);
      this.selected = null;
      return true;
    }

    hurtHuman(h, dmg) {
      if (h.dead) return;
      if (h.id === 'tom') { dmg *= 1 - 0.08 * (h.up.spc || 0); h.shieldFlash = 0.25; }
      dmg = Math.max(1, Math.round(dmg));
      h.hp -= dmg; h.hit = 0.18;
      this.floatText(h.x + rand(-8, 8), footY(h.row) - (h.isDrone ? 60 : 70), '-' + dmg, '#ff6b6b', 10);
      if (!h.isDrone) H.Sound.hit();
      if (h.hp <= 0) this.killHuman(h);
    }
    killHuman(h) {
      if (h.id === 'dynamite' && !h.detonated) { this.detonate(h); return; }
      h.dead = true; h.deathT = 0;
      if (h.isDrone) { if (h.owner) { h.owner.drone = null; h.owner.buildT = 9; } }
      else {
        this.cells[h.row][h.col] = null;
        if (h.drone) { h.drone.hp = 0; h.drone.dead = true; h.drone.deathT = 0; }
      }
      H.Sound.explode();
      this.burst(h.x, footY(h.row) - 30, 18, ['#ffffff', '#54c7ff', '#7ffcff', '#a0a8c0'], 90, 60, 0.7, 4);
      this.addShake(4);
    }
    detonate(h) {
      if (h.detonated) return;
      h.detonated = true; h.dead = true; h.deathT = 0.7; this.cells[h.row][h.col] = null;
      this.explosion(h.x, footY(h.row) - 30, 2.1);
      this.addShake(14); this.flashScreen = 0.25;
      for (const a of this.aliens) {
        if (a.dead) continue;
        if (Math.abs(a.row - h.row) <= 1 && Math.abs(a.x - h.x) <= G.CW * 1.7) this.hurtAlien(a, 350, true, 0.5);
      }
      const m = this.ms;
      if (m && !m.dead && m.state !== 'arrive' && Math.abs(m.x - 180 - h.x) < G.CW * 2) this.hurtMs(300, true);
    }
    healHuman(h, amt) {
      const real = Math.min(amt, h.maxhp - h.hp);
      if (real <= 0) return false;
      h.hp += real;
      this.floatText(h.x, footY(h.row) - 78, '+' + Math.round(real), '#6dff9a', 10);
      this.burst(h.x, footY(h.row) - 40, 8, ['#6dff9a', '#7ffcff', '#ffffff'], 30, -30, 0.7, 3);
      return true;
    }

    spawnAlien(type, row, boss, atX) {
      const d = H.ALIENS[type];
      const mult = (boss ? (BOSS_MULT[type] || 1) : 1) * (1 + 0.12 * Math.max(0, this.level.world - 8));
      const a = {
        type, def: d, row, x: atX || FIELD_R + 14, hp: Math.round(d.hp * mult), maxhp: Math.round(d.hp * mult),
        shield: d.shield ? Math.round(d.shield * mult) : 0, maxShield: d.shield ? Math.round(d.shield * mult) : 0,
        armor: d.armor || 0, healT: 2, healFx: 0, dmg: d.dmg, atkT: 0.4, atkAnim: 0, hit: 0, dead: false, deathT: 0, animT: Math.random() * 5,
        cloakT: rand(2, 5), cloaked: false, hopT: rand(0.4, 2), hopping: 0, broodT: 5, psyT: rand(3, 6), psyFx: 0, psyTo: 0,
        flyOver: type === 'jet' || !!d.burrow || !!d.fly, abT: 6, abI: 0, flying: 0, flyX: 0, boss: !!boss, buffed: false, blocking: null, zapFx: 0
      };
      this.aliens.push(a);
      if (boss) { this.boss = a; }
      return a;
    }

    hurtAlien(a, dmg, crit, ap) {
      if (a.dead) return;
      dmg = Math.round(dmg);
      let shown = dmg, col = crit ? '#ffe14a' : '#ffffff';
      if (a.shield > 0) {
        const s = Math.min(a.shield, dmg);
        a.shield -= s; shown = s; col = '#7ffcff';
        if (a.shield <= 0) {
          this.burst(a.x - 30, footY(a.row) - 40, 16, ['#7ffcff', '#5cf7ff', '#ffffff'], 100, 0, 0.6, 4);
          H.Sound.explode(); this.floatText(a.x, footY(a.row) - 100, 'SHIELD DOWN!', '#7ffcff', 10);
        }
      } else {
        let d2 = dmg;
        if (a.armor) {
          const arm = a.armor * (1 - (ap || 0));
          d2 = Math.max(Math.round(dmg * 0.25), Math.round(dmg - arm));
          if (d2 < dmg * 0.6 && Math.random() < 0.35) this.floatText(a.x, footY(a.row) - 100, 'CLANK', '#b0b6cc', 8);
          if (d2 < dmg && !crit) col = '#b0b6cc';
        }
        a.hp -= d2; shown = d2;
      }
      a.hit = 0.12;
      this.floatText(a.x + rand(-10, 10), footY(a.row) - 60 * AL_SCALE / 1.5 - 20, String(shown), col, crit ? 14 : 10);
      H.Sound.hit();
      if (a.hp <= 0 && !a.dead) this.killAlien(a);
    }
    hidden(a) { return (a.flying > 0 && a.def.burrow) || a.cloaked; }

    killAlien(a) {
      a.dead = true; a.deathT = 0; a.hp = 0;
      this.stats.kills++;
      H.Sound.kill();
      this.burst(a.x, footY(a.row) - 30, 20, BURST[a.type] || a.def.burst || ['#ffffff', '#aaaaaa', '#666666'], 110, 80, 0.7, 4);
      if (a.def.deathBlast) {
        this.explosion(a.x, footY(a.row) - 30, 0.9); this.addShake(5);
        for (const h of this.humans) {
          if (h.dead) continue;
          const dr = Math.abs(h.row - a.row), dx = Math.abs(h.x - a.x);
          if (dr === 0 && dx <= G.CW * 1.2) this.hurtHuman(h, a.def.deathBlast.dmg);
          else if (dr === 1 && dx <= G.CW * 0.8) this.hurtHuman(h, a.def.deathBlast.dmg * 0.6);
        }
      }
      if (a.def.shatter) {
        this.floatText(a.x, footY(a.row) - 80, 'SHATTER!', '#8ffcff', 9);
        for (let i = 0; i < a.def.shatter; i++) this.spawnAlien('shard', a.row, false, a.x + (i ? 26 : -8));
      }
      if (a.boss) { this.stats.boss = true; this.addShake(10); this.explosion(a.x, footY(a.row) - 40, 1.6); }
      if (Math.random() < (a.boss ? 1 : 0.22)) this.addDrop(a.x, footY(a.row) - 20, footY(a.row) - 6, a.boss ? 50 : 15, true);
    }

    hurtMs(dmg, crit) {
      const m = this.ms;
      if (!m || m.dead) return;
      dmg = Math.round(dmg);
      m.hp -= dmg; m.hit = 0.1;
      this.floatText(m.x - 150 + rand(-20, 20), m.y - 20 + rand(-20, 20), String(dmg), crit ? '#ffe14a' : '#ffffff', crit ? 14 : 10);
      H.Sound.hit();
      if (m.hp <= 0) { m.hp = 0; this.killMs(); }
    }
    killMs() {
      const m = this.ms;
      m.dead = true; m.deathT = 0; m.state = 'dying';
      this.stats.boss = true; this.stats.kills++;
      H.Sound.explode(); this.addShake(14);
      this.aliens.forEach(a => { if (!a.dead) { a.dead = true; a.deathT = 0; this.stats.kills++; this.burst(a.x, footY(a.row) - 30, 12, BURST[a.type], 90, 60, 0.6, 3); } });
      this.zones = []; this.laneOff.fill(0); this.blasts = [];
    }

    tryUlt(h) {
      if (!h.ultReady || h.disabled > 0 || this.laneOff[h.row] > 0) { H.Sound.deny(); return; }
      const cd = Math.max(10, 20 - 2 * (h.up.spc || 0));
      h.ultT = cd; h.ultReady = false; h.ultAnim = 0.9;
      H.Sound.plasma();
      this.floatText(h.x, footY(h.row) - 100, 'ULTIMATE!', '#ffe14a', 12);
      h.pend.push({ t: 0.5, fn: () => {
        this.projs.push({ kind: 'ult', row: h.row, x: h.x + 40, y: footY(h.row) - 50, vx: 760, dmg: Math.round(H.stat(h.def, h.up, 'dmg') * 2.5), hits: new Set(), pierce: 999, life: 3 });
        this.addShake(8); this.flashScreen = 0.25;
        this.burst(h.x + 40, footY(h.row) - 50, 20, ['#ffe14a', '#ff9a3d', '#ffffff'], 140, 0, 0.5, 4);
      } });
    }

    floatText(x, y, text, color, size) {
      if (!H.Save.data.settings.dmgNumbers && /^[-+]?\d+$/.test(text)) return;
      this.floats.push({ x, y, text, color, size: size || 10, t: 0, life: 0.9 });
    }
    addShake(v) { if (H.Save.data.settings.shake) this.shake = Math.max(this.shake, v); }
    burst(x, y, n, cols, spd, grav, life, size) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, s = rand(0.3, 1) * spd;
        this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - spd * 0.2, g: grav, life: life * rand(0.6, 1), t: 0, c: cols[Math.floor(Math.random() * cols.length)], s: size > 3 && Math.random() < 0.5 ? size - 2 : size });
      }
    }
    explosion(x, y, scale) {
      scale = scale || 1;
      this.blasts.push({ x, y, t: 0, life: 0.5, r: 46 * scale });
      this.burst(x, y, Math.round(26 * scale), ['#ffffff', '#ffe14a', '#ff9a3d', '#ff5a3a'], 170 * scale, 40, 0.7, 4);
      H.Sound.explode();
    }

    addDrop(x, y, ty, value, fromKill) {
      this.drops.push({ x, y, ty, vy: fromKill ? 30 : (this.theme === 'moon' ? 55 : 95), value, state: 'fall', life: 11, t: Math.random() * 6, taken: false });
    }
    collect(d) {
      d.taken = true; d.state = 'gone';
      this.energy += d.value; this.stats.energy += d.value;
      H.Sound.energy();
      this.floatText(d.x, d.y - 30, '+' + d.value + ' ⚡', '#ffe14a', 11);
      this.burst(d.x, d.y - 10, 12, ['#ffe14a', '#fff08a', '#ffffff'], 80, 0, 0.5, 3);
    }

    waveSize(w) { return Math.max(1, Math.round(1.6 + w * 0.8 + Math.min(this.level.idx - 1, 26) * 0.12)); }
    pickType(w, used) {
      const idx = this.level.idx;
      const T = {
        slime: [6, 1], grunt: [w >= 2 ? 5 : 2, 1], brute: [1.5 + idx * 0.08, idx === 1 ? 5 : 3], zapper: [2, 2], jet: [2, 2], shield: [2, 4], commander: [1, 5, 1],
        bomber: [2.5, 2], trooper: [3, 3], spitter: [2.5, 2], spiker: [2, 3], medic: [1.5, 4, 1], juggernaut: [1.2, 6, 1],
        scorpion: [5, 1], burrower: [3, 2], cactus: [2.5, 3], hopper: [5, 1], astronaut: [3, 2], shade: [3, 3],
        golem: [3, 2], brood: [2, 4, 1], mindsquid: [2.5, 3],
        frostling: [5, 1], icebat: [4, 1], snowmage: [2.5, 3], yeti: [2.2 + idx * 0.03, 4],
        emberhound: [5, 1], magmaling: [3.5, 2], lavaslug: [3, 3], obsidian: [1.8, 4],
        piranha: [6, 1], jelly: [3, 2], angler: [3, 3], shellback: [2.5, 3],
        voidling: [3, 2], gravitron: [2.5, 3], eclipse: [2.5, 3], starwyrm: [3, 3],
        vinelasher: [5, 1], sporecap: [3, 2], swamptoad: [4, 2], mossgolem: [2, 4],
        stormsprite: [3, 2], thunderbird: [4, 1], rocktroll: [2.2, 3], voltbeetle: [3, 2],
        scarab: [6, 1], mummy: [4, 1], anubis: [2.5, 3], sarcophagus: [2, 4],
        nanoswarm: [6, 1], turretbot: [3, 2], hackerbot: [2.5, 3], tankbot: [1.8, 4]
      };
      const ws = [];
      this.level.pool.forEach(t => {
        const e = T[t];
        let wt = 0;
        if (e && w >= e[1] && !(e[2] && used.has(t))) wt = e[0];
        ws.push([t, wt]);
      });
      const sum = ws.reduce((s, x) => s + x[0 + 1], 0);
      if (sum <= 0) return this.level.pool[0];
      let r = Math.random() * sum;
      for (const [t, wt] of ws) { r -= wt; if (r <= 0) return t; }
      return this.level.pool[0];
    }
    pickRow() {
      let r; do { r = Math.floor(Math.random() * G.ROWS); } while (r === this.lastRow && Math.random() < 0.7);
      this.lastRow = r; return r;
    }

    startWave() {
      this.waveNo++;
      this.lastWaveAt = this.time;
      const isFinal = this.waveNo === this.waveTotal;
      let n = this.waveSize(this.waveNo);
      let t = isFinal ? 3.6 : 0.5; const used = new Set();
      for (let i = 0; i < n; i++) {
        const type = this.pickType(this.waveNo, used);
        if (['commander', 'medic', 'juggernaut', 'brood'].includes(type)) used.add(type);
        this.queue.push({ t: t, type, row: this.pickRow() });
        t += rand(0.9, 2.4) * (this.waveNo === 1 ? 2.2 : 1);
      }
      if (isFinal && this.level.boss) {
        if (this.level.boss === 'mothership') this.queue.push({ t: 4.5, type: 'mothership' });
        else this.queue.push({ t: 5.5, type: this.level.boss, row: 2, boss: true });
      }
      this.hooks.banner && this.hooks.banner('WAVE ' + this.waveNo + ' / ' + this.waveTotal, 'wave');
      H.Sound.wave();
      if (isFinal) {
        this.hooks.banner && this.hooks.banner(this.level.boss ? '⚠️ BOSS INCOMING! ⚠️' : '⚠️ FINAL WAVE INCOMING! ⚠️', 'final');
        H.Sound.boss();
        if (this.level.boss && this.hooks.music) this.hooks.music(['mothership', 'voidtitan', 'omegaprime'].includes(this.level.boss) ? 'mothership' : this.level.world >= 9 ? 'boss3' : this.level.world >= 5 ? 'boss2' : 'boss');
      }
      this.nextWaveAt = this.time + 30;
      if (isFinal) this.allSpawned = true;
    }

    spawnMothership() {
      const d = H.ALIENS.mothership;
      this.ms = { x: 720, y: -200, ty: G.GY + 2.5 * G.RH - 8, hp: d.hp, max: d.hp, hit: 0, dead: false, deathT: 0, state: 'arrive', t: 0, abT: 5, ab: null, phase: 0, seq: 0 };
      this.boss = this.ms;
      this.addShake(6);
    }

    updateWaves(dt) {
      if (!this.allSpawned && this.finalPending <= 0) {
        const clear = this.queue.length === 0 && this.aliens.filter(a => !a.dead).length === 0;
        if (this.queue.length === 0 && (this.time >= this.nextWaveAt || (clear && this.time - this.lastWaveAt > 7 && this.waveNo > 0))) this.startWave();
      }
      if (this.waveNo > 0 || true) {
        const still = [];
        for (const q of this.queue) {
          q.t -= dt;
          if (q.t > 0) { still.push(q); continue; }
          if (q.type === 'mothership') this.spawnMothership();
          else this.spawnAlien(q.type, q.row, q.boss);
        }
        this.queue = still;
      }
    }

    updateDrops(dt) {
      this.dropT -= dt;
      if (this.dropT <= 0) {
        this.dropT = this.energyInterval();
        const x = rand(G.GX + 30, FIELD_R - 30), ty = rand(G.GY + 40, G.GY + G.RH * G.ROWS - 20);
        this.addDrop(x, G.GY - 30, ty, 25, false);
      }
      for (const d of this.drops) {
        if (d.state === 'fall') {
          d.y += d.vy * dt;
          if (d.y >= d.ty) { d.y = d.ty; d.state = 'float'; }
        } else if (d.state === 'float') {
          d.life -= dt; d.t += dt;
          if (d.life <= 0) { d.state = 'gone'; }
          for (const z of this.zones) {
            if (d.x > cellX(z.col) && d.x < cellX(z.col + 2) && d.y > rowTop(z.row) && d.y < rowTop(z.row + 2) + 20 && !d.taken) {
              d.state = 'gone'; this.floatText(d.x, d.y - 20, 'STOLEN!', '#ff5ad8', 10);
              this.burst(d.x, d.y - 10, 10, ['#ff5ad8', '#7a1a6a', '#ffffff'], 60, 0, 0.5, 3);
            }
          }
        }
      }
      this.drops = this.drops.filter(d => d.state !== 'gone');
    }
    energyInterval() { return (this.level.idx > 5 ? 5 : 6.2) + rand(-0.8, 0.8); }

    findTarget(h, range) {
      let best = null;
      const maxX = h.x + range;
      for (const a of this.aliens) {
        if (a.dead || a.row !== h.row || a.x < h.x - 12 || a.x > maxX || a.x > G.W - 6 || this.hidden(a)) continue;
        if (!best || a.x < best.x) best = a;
      }
      if (best) return best;
      const m = this.ms;
      if (m && !m.dead && m.state !== 'arrive' && m.x - 180 <= maxX && m.x - 180 > h.x - 200) return m;
      return null;
    }

    proj(h, kind, dmg, speed, opts) {
      const spr = H.Sprites.human[h.id];
      const mz = MUZZLE[h.id] || [1, 0.5];
      const x = h.x - spr.width / 2 + spr.width * mz[0];
      const y = footY(h.row) - spr.height + spr.height * mz[1];
      this.projs.push(Object.assign({ kind, row: h.row, x, y, vx: speed, dmg, hits: new Set(), pierce: 0, life: 3 }, opts || {}));
      return { x, y };
    }

    fire(h, target) {
      const d = h.def, up = h.up;
      const dmg = H.stat(d, up, 'dmg');
      const spc = up.spc || 0;
      h.atk = 0.2;
      switch (h.id) {
        case 'ryan': {
          this.proj(h, 'blue', dmg, 380); H.Sound.pistol();
          if (Math.random() < 0.15 * spc + (spc ? 0.1 : 0)) h.pend.push({ t: 0.16, fn: () => { this.proj(h, 'blue', dmg, 380); H.Sound.pistol(); } });
          break;
        }
        case 'lucy': this.proj(h, 'laser', dmg, 680 + spc * 40, { pierce: spc >= 4 ? 2 : spc >= 2 ? 1 : 0 }); H.Sound.laser(); break;
        case 'tom':
          h.atk = 0.35;
          h.pend.push({ t: 0.2, fn: () => {
            const t = this.findTarget(h, H.stat(d, up, 'range') * G.CW);
            H.Sound.hit(); this.addShake(3);
            if (t) {
              const tx = t === this.ms ? t.x - 180 : t.x;
              this.burst(tx, footY(h.row) - 40, 10, ['#7ffcff', '#ffffff', '#5cf7ff'], 90, 0, 0.4, 3);
              if (t === this.ms) this.hurtMs(dmg); else { this.hurtAlien(t, dmg, false, 0.3); if (t.def.thorns) { this.hurtHuman(h, t.def.thorns); this.floatText(h.x, footY(h.row) - 96, 'OUCH!', '#8dff7a', 8); } }
            }
          } });
          break;
        case 'maya': this.proj(h, 'pulse', dmg, 340); H.Sound.pistol(); break;
        case 'sam': {
          h.aim = 0.45;
          h.pend.push({ t: 0.45, fn: () => {
            const crit = Math.random() < 0.25 + 0.05 * spc;
            this.proj(h, 'sniper', crit ? dmg * 2 : dmg, 1500, { crit });
            H.Sound.laser(); this.addShake(crit ? 4 : 2); h.atk = 0.3; h.atkMax = 0.3;
          } });
          break;
        }
        case 'eli': this.proj(h, 'blue', dmg, 360); H.Sound.pistol(); break;
        case 'priya': this.proj(h, 'plasma', dmg, 270, { aoe: G.CW * 1.15 * (1 + 0.15 * spc) }); H.Sound.plasma(); break;
        case 'max': this.proj(h, 'gold', dmg, 460); H.Sound.plasma(); this.addShake(2); break;
      }
      h.atkMax = h.atk;
    }

    updateHuman(h, dt) {
      if (h.dead) { h.deathT += dt; return; }
      h.animT += dt;
      h.spawnT = Math.max(0, h.spawnT - dt);
      h.atk = Math.max(0, h.atk - dt); h.hit = Math.max(0, h.hit - dt); h.shieldFlash = Math.max(0, h.shieldFlash - dt);
      h.ultAnim = Math.max(0, h.ultAnim - dt); h.zapFx = Math.max(0, h.zapFx - dt);
      for (const p of h.pend) p.t -= dt;
      const ready = h.pend.filter(p => p.t <= 0); h.pend = h.pend.filter(p => p.t > 0);
      ready.forEach(p => p.fn());
      if (h.poisonT > 0) {
        h.poisonT -= dt; h.poisonTick = (h.poisonTick || 0) - dt;
        if (h.poisonTick <= 0) {
          h.poisonTick = 1; this.hurtHuman(h, h.poisonDps);
          this.burst(h.x, footY(h.row) - 40, 5, ['#8dff7a', '#4a9f2a', '#c25aff'], 30, -20, 0.5, 3);
        }
      }
      if (h.id === 'dynamite') {
        h.fuseT -= dt;
        if (Math.random() < dt * 30) this.parts.push({ x: h.x + 11, y: footY(h.row) - 62, vx: rand(-30, 30), vy: rand(-70, -20), g: 60, life: 0.35, t: 0, c: Math.random() < 0.5 ? '#ffe14a' : '#ff9a3d', s: 3 });
        if (h.fuseT <= 0) this.detonate(h);
        return;
      }
      if (h.id === 'firewall') return;
      if (h.disabled > 0) { h.disabled -= dt; return; }
      if (h.id === 'reactor') {
        h.prodT -= dt;
        if (h.prodT <= 0) {
          h.prodT = 9;
          this.addDrop(h.x + rand(-8, 8), rowTop(h.row) + 14, rowTop(h.row) + G.RH - 22, 25, false);
          this.burst(h.x, footY(h.row) - 50, 10, ['#8dff7a', '#eaffd0', '#4ade3a'], 60, -20, 0.6, 3);
          H.Sound.heal();
        }
        return;
      }
      if (this.laneOff[h.row] > 0) return;
      h.aim = Math.max(0, h.aim - dt);
      const d = h.def, up = h.up;
      if (h.id === 'max' && !h.ultReady) { h.ultT -= dt; if (h.ultT <= 0) { h.ultReady = true; H.Sound.heal(); } }
      if (h.id === 'maya') {
        h.healT -= dt;
        if (h.healT <= 0) {
          h.healT = 4;
          let any = false;
          for (const o of this.humans) {
            if (o.dead || Math.abs(o.col - h.col) > 1 || Math.abs(o.row - h.row) > 1 || o.isDrone) continue;
            if (this.healHuman(o, 25 * (1 + 0.2 * (up.spc || 0)))) any = true;
          }
          if (any) { H.Sound.heal(); h.healFx = 0.7; }
        }
        h.healFx = Math.max(0, (h.healFx || 0) - dt);
      }
      if (h.id === 'eli') {
        if (h.building > 0) {
          h.building -= dt;
          if (h.building <= 0 && !h.drone) this.makeDrone(h);
        } else if (!h.drone) {
          h.buildT -= dt;
          if (h.buildT <= 0) { h.building = 1.2; H.Sound.click(); }
        }
        if (h.building > 0) return;
      }
      h.cdT -= dt;
      if (h.cdT <= 0 && h.aim <= 0) {
        const t = this.findTarget(h, H.stat(d, up, 'range') * G.CW);
        if (t) { this.fire(h, t); h.cdT = H.stat(d, up, 'cd'); }
        else h.cdT = 0.1;
      }
    }

    makeDrone(e) {
      const spc = 1 + 0.25 * (e.up.spc || 0);
      const hp = Math.round(75 * spc * H.UPG.hp.mult[e.up.hp || 0]);
      const dr = { isDrone: true, owner: e, id: 'drone', def: e.def, row: e.row, col: e.col, x: e.x + 40, hp, maxhp: hp, cdT: 0.6, dmg: Math.round(10 * spc * H.UPG.dmg.mult[e.up.dmg || 0]), animT: Math.random() * 6, hit: 0, dead: false, deathT: 0, atk: 0, disabled: 0, pend: [], up: e.up };
      e.drone = dr; this.humans.push(dr);
      this.burst(dr.x, footY(e.row) - 60, 12, ['#ffb84a', '#ffffff', '#7ffcff'], 60, 0, 0.5, 3);
      H.Sound.buy();
    }

    updateDrone(dr, dt) {
      if (dr.dead) { dr.deathT += dt; return; }
      dr.animT += dt; dr.hit = Math.max(0, dr.hit - dt); dr.atk = Math.max(0, dr.atk - dt);
      if (dr.owner.dead) { this.killHuman(dr); return; }
      if (dr.owner.disabled > 0 || this.laneOff[dr.row] > 0) return;
      dr.cdT -= dt;
      if (dr.cdT <= 0) {
        const t = this.findTarget(dr, 4 * G.CW);
        if (t) {
          dr.atk = 0.1; dr.cdT = 0.5;
          this.projs.push({ kind: 'blue', row: dr.row, x: dr.x + 14, y: footY(dr.row) - 56 + Math.sin(dr.animT * 4) * 3, vx: 420, dmg: dr.dmg, hits: new Set(), pierce: 0, life: 2, small: true });
          H.Sound.pistol();
        } else dr.cdT = 0.1;
      }
    }

    updateAlien(a, dt) {
      if (a.dead) { a.deathT += dt; return; }
      a.animT += dt; a.hit = Math.max(0, a.hit - dt); a.atkAnim = Math.max(0, a.atkAnim - dt); a.zapFx = Math.max(0, a.zapFx - dt);
      let spd = a.def.speed * 40, dmg = a.dmg;
      if (a.buffed) { spd *= 1.3; dmg *= 1.25; }
      a.healFx = Math.max(0, a.healFx - dt); a.psyFx = Math.max(0, a.psyFx - dt);
      const df = a.def;
      if (df.cloak) {
        a.cloakT -= dt;
        if (a.cloakT <= 0) {
          if (!a.cloaked) { a.cloaked = true; a.cloakT = df.cloak.dur; } else { a.cloaked = false; a.cloakT = df.cloak.every; }
          this.burst(a.x, footY(a.row) - 40, 8, ['#ff5ad8', '#6a4aa0', '#2a1a4a'], 50, -10, 0.5, 3);
        }
      }
      if (df.regen && a.hp < a.maxhp) a.hp = Math.min(a.maxhp, a.hp + df.regen * dt);
      if (a.boss && Math.random() < dt * 14) {
        const col = (BURST[a.type] || df.burst || ['#ff5ad8'])[Math.floor(Math.random() * 2)];
        this.parts.push({ x: a.x + rand(-34, 34) * (df.size || 1), y: footY(a.row) - rand(6, 90) * (df.size || 1), vx: rand(-14, 14), vy: -rand(20, 55), g: 0, life: rand(0.6, 1.1), t: 0, c: col, s: Math.random() < 0.4 ? 4 : 3 });
      }
      if (a.boss && df.bossAb) { this.bossAbility(a, dt); if (a.hp < a.maxhp * 0.5) spd *= 1.35; }
      if (df.hop) {
        if (a.hopping > 0) { a.hopping -= dt; spd *= 6.5; }
        else { a.hopT -= dt; if (a.hopT <= 0) { a.hopping = 0.45; a.hopT = 2.3; } }
      }
      if (df.brood) {
        a.broodT -= dt;
        if (a.broodT <= 0) {
          a.broodT = df.brood.every;
          if (this.aliens.filter(o => !o.dead && o.spawnedBy === a).length < 3) {
            const l = this.spawnAlien(df.brood.type, a.row, false, a.x + 34); l.spawnedBy = a;
            this.burst(a.x + 30, footY(a.row) - 30, 8, ['#ffe14a', '#e89ac0', '#ffffff'], 60, 20, 0.5, 3);
          }
        }
      }
      if (df.psy) {
        a.psyT -= dt;
        if (a.psyT <= 0) {
          let tgt = null;
          for (const h of this.humans) if (!h.dead && !h.isDrone && h.row === a.row && h.x < a.x && a.x - h.x <= df.psy.range * G.CW && (!tgt || h.x > tgt.x)) tgt = h;
          if (tgt) {
            a.psyT = df.psy.every; a.psyFx = 0.35; a.psyTo = tgt.x; a.atkAnim = 0.3;
            tgt.disabled = Math.max(tgt.disabled || 0, df.psy.dur);
            H.Sound.zap(); this.floatText(tgt.x, footY(tgt.row) - 90, df.psy.label || 'MIND BLAST!', '#ff8af0', 9);
            this.burst(tgt.x, footY(tgt.row) - 50, 10, ['#ff8af0', '#a08af5', '#ffffff'], 70, 0, 0.5, 3);
          } else a.psyT = 0.5;
        }
      }
      if (a.type === 'medic') {
        a.healT -= dt;
        if (a.healT <= 0) {
          a.healT = 3; let any = false;
          for (const o of this.aliens) {
            if (o.dead || o === a || o.hp >= o.maxhp || Math.abs(o.x - a.x) > G.CW * 2.5 || Math.abs(o.row - a.row) > 1) continue;
            o.hp = Math.min(o.maxhp, o.hp + 25); any = true;
            this.floatText(o.x, footY(o.row) - 90, '+25', '#8dff7a', 9);
            this.burst(o.x, footY(o.row) - 40, 6, ['#8dff7a', '#eaffd0'], 40, -20, 0.6, 3);
          }
          if (any) { a.healFx = 0.7; H.Sound.heal(); }
        }
      }
      if (a.flying > 0) {
        a.x -= spd * 1.4 * dt;
        if (a.def.burrow && Math.random() < dt * 25) this.parts.push({ x: a.x + rand(-10, 10), y: footY(a.row) - 2, vx: rand(-20, 20), vy: rand(-60, -20), g: 120, life: 0.4, t: 0, c: Math.random() < 0.5 ? '#c9a45a' : '#e6c48a', s: 3 });
        if (a.x <= a.flyX) { a.flying = 0; if (a.def.burrow) { this.burst(a.x, footY(a.row) - 10, 14, ['#c9a45a', '#e6c48a', '#a88850'], 90, 60, 0.5, 4); this.floatText(a.x, footY(a.row) - 80, 'SURPRISE!', '#e6c48a', 8); } }
      } else if (df.ranged) {
        let tgt = null;
        for (const h of this.humans) if (!h.dead && h.row === a.row && h.x < a.x - 10 && (!tgt || h.x > tgt.x)) tgt = h;
        if (tgt && a.x - tgt.x <= G.CW * 3.2) {
          a.atkT -= dt;
          if (a.atkT <= 0) {
            a.atkT = 2.2; a.atkAnim = 0.3;
            this.aprojs.push({ x: a.x - 26, y: footY(a.row) - 52, row: a.row, vx: -250, dmg: Math.round(dmg), life: 4 });
            H.Sound.plasma();
          }
        } else { a.atkT = Math.min(a.atkT, 0.6); a.x -= spd * dt; }
      } else {
        let blocker = null;
        const reach = a.type === 'zapper' ? G.CW * 1.7 : 34 + a.def.size * 8;
        for (const h of this.humans) {
          if (h.dead || h.row !== a.row) continue;
          const dx = a.x - h.x;
          if (dx >= -6 && dx <= reach && (!blocker || h.x > blocker.x)) blocker = h;
        }
        if (blocker && a.type === 'bomber') {
          this.bomberBlast(a, dmg);
        } else if (blocker && a.flyOver) {
          a.flyOver = false; a.flying = 1; a.flyX = blocker.x - 46;
          this.floatText(a.x, footY(a.row) - 80, a.def.burrow ? 'DIG!' : 'WHOOSH!', a.def.burrow ? '#e6c48a' : '#ff9a3d', 9);
        } else if (blocker) {
          a.atkT -= dt;
          if (a.atkT <= 0) {
            const ivl = a.type === 'zapper' ? 2.6 : 1;
            a.atkT = ivl; a.atkAnim = 0.3;
            if (a.type === 'zapper') {
              a.zapFx = 0.3; blocker.disabled = Math.max(blocker.disabled || 0, 4);
              H.Sound.zap(); this.floatText(blocker.x, footY(blocker.row) - 90, 'STUNNED!', '#7ffcff', 9);
              this.burst(blocker.x, footY(blocker.row) - 40, 10, ['#7ffcff', '#ffe14a', '#ffffff'], 80, 0, 0.4, 3);
            }
            this.hurtHuman(blocker, dmg);
            if (a.def.poison && !blocker.dead && !blocker.isDrone) { blocker.poisonT = a.def.poison.dur; blocker.poisonDps = a.def.poison.dps; blocker.poisonTick = 1; this.floatText(blocker.x, footY(blocker.row) - 100, a.def.poison.label || 'POISONED', a.def.poison.label ? '#ff8a2a' : '#c25aff', 8); }
            if (a.def.freeze && !blocker.dead && blocker.id !== 'firewall' && blocker.id !== 'dynamite') { blocker.disabled = Math.max(blocker.disabled || 0, a.def.freeze); this.floatText(blocker.x, footY(blocker.row) - 90, a.def.freezeText || 'FROZEN!', '#9fe8ff', 9); this.burst(blocker.x, footY(blocker.row) - 40, 8, ['#9fe8ff', '#ffffff', '#5ab8e8'], 60, 0, 0.5, 3); }
            if (blocker.id === 'firewall' && !blocker.dead) {
              this.hurtAlien(a, 8, false, 1);
              this.burst(a.x + 8, footY(a.row) - 40, 6, ['#ff7a1a', '#ffe14a', '#ff3b1a'], 60, -30, 0.4, 3);
            }
          }
        } else {
          a.atkT = Math.min(a.atkT, 0.4);
          a.x -= spd * dt;
        }
      }
      if (a.x < G.GX - 4 && this.sandbox) { a.dead = true; a.deathT = 1; a.noCount = true; return; }
      if (a.x < G.GX - 4) {
        const loss = Math.max(3, Math.round(dmg * 0.4));
        this.baseHp -= loss; this.stats.baseLost += loss; this.baseFlash = 0.5;
        this.addShake(6); H.Sound.explode();
        this.floatText(G.GX + 30, footY(a.row) - 60, '-' + loss + ' BASE', '#ff6b6b', 11);
        this.burst(G.GX, footY(a.row) - 30, 18, ['#ff5a3a', '#ffe14a', '#ffffff'], 130, 40, 0.6, 4);
        a.dead = true; a.deathT = 1; a.noCount = true;
        if (this.baseHp <= 0) { this.baseHp = 0; this.finish(false); }
      }
    }

    bossAbility(a, dt) {
      a.abT -= dt;
      if (a.abT > 0) return;
      const df = a.def, list = df.bossAb, kind = list[a.abI++ % list.length];
      a.abT = a.hp < a.maxhp * 0.5 ? 4.6 : 6.6;
      a.atkAnim = 0.4;
      const foes = this.humans.filter(h => !h.dead && !h.isDrone && h.id !== 'firewall' && h.id !== 'dynamite');
      if (kind === 'freeze' || kind === 'grab') {
        const cnt = new Array(G.ROWS).fill(0); foes.forEach(h => cnt[h.row]++);
        const row = cnt.indexOf(Math.max(...cnt));
        const lbl = (df.abLabel && df.abLabel[kind]) || (kind === 'grab' ? 'TENTACLE GRAB!' : 'FLASH FREEZE!');
        this.floatText(a.x, footY(a.row) - 130, lbl, '#9fe8ff', 11); H.Sound.zap();
        foes.forEach(h => { if (h.row === row) { h.disabled = Math.max(h.disabled || 0, 3); this.burst(h.x, footY(h.row) - 40, 10, ['#9fe8ff', '#ffffff', '#5ab8e8'], 70, 0, 0.5, 3); } });
        this.flashScreen = 0.1;
      } else if (kind === 'quake') {
        this.floatText(a.x, footY(a.row) - 130, 'QUAKE!', '#ffb04a', 11); this.addShake(10); H.Sound.explode();
        this.humans.forEach(h => { if (!h.dead && !h.isDrone && Math.abs(h.row - a.row) <= 1 && h.x < a.x + 20 && a.x - h.x < G.CW * 4) { this.hurtHuman(h, h.row === a.row ? 45 : 25); this.burst(h.x, footY(h.row) - 10, 8, ['#c9a45a', '#8a6a3a', '#ffffff'], 70, 60, 0.5, 3); } });
      } else if (kind === 'summon') {
        this.floatText(a.x, footY(a.row) - 130, 'REINFORCEMENTS!', '#ffe14a', 11); H.Sound.wave();
        const mins = df.minions || ['grunt'], n = a.hp < a.maxhp * 0.5 ? 4 : 3;
        for (let i = 0; i < n; i++) this.queue.push({ t: i * 0.5, type: mins[i % mins.length], row: this.pickRow() });
      } else if (kind === 'heal') {
        const amt = Math.round(a.maxhp * 0.06); a.hp = Math.min(a.maxhp, a.hp + amt);
        this.floatText(a.x, footY(a.row) - 130, '+' + amt + ' REGEN', '#8dff7a', 10); H.Sound.heal();
        this.burst(a.x, footY(a.row) - 50, 14, ['#8dff7a', '#eaffd0'], 60, -20, 0.6, 3);
      }
    }

    spawnAt(type, row, x, boss) {
      if (type === 'mothership') { if (!this.ms || this.ms.dead) this.spawnMothership(); return; }
      const a = this.spawnAlien(type, row, boss, x);
      this.burst(x, footY(row) - 30, 12, ['#ff5ad8', '#ffffff', '#7ffcff'], 70, 0, 0.5, 3);
      return a;
    }
    clearAliens() {
      this.aliens.forEach(a => { if (!a.dead) { a.dead = true; a.deathT = 0.3; a.noCount = true; } });
      this.queue = []; this.ms = null; this.boss = null; this.aprojs = []; this.zones = []; this.beams = [];
    }
    clearHumans() {
      this.humans.forEach(h => { h.dead = true; h.deathT = 0; });
      for (let r = 0; r < G.ROWS; r++) this.cells[r].fill(null);
    }
    setWorld(id) {
      this.level = Object.assign({}, this.level, { world: id });
      this.world = H.WORLDS[id - 1]; this.theme = this.world.theme;
      this.bg = G.buildBackground(this.theme, id * 13 + 3);
      G.Fx.init(this.theme);
    }

    bomberBlast(a, dmg) {
      a.dead = true; a.deathT = 0; a.noCount = true;
      this.explosion(a.x - 10, footY(a.row) - 30, 1.1); this.addShake(6);
      for (const h of this.humans) {
        if (h.dead) continue;
        const dr = Math.abs(h.row - a.row), dx = Math.abs(h.x - a.x);
        if (dr === 0 && dx <= G.CW * 1.4) this.hurtHuman(h, dmg);
        else if (dr === 1 && dx <= G.CW * 1.0) this.hurtHuman(h, dmg * 0.6);
      }
    }

    updateProj(p, dt) {
      p.x += p.vx * dt; p.life -= dt;
      if (p.x > G.W + 40 || p.life <= 0) { p.dead = true; return; }
      if (p.kind === 'ult') {
        if (Math.random() < 0.7) this.parts.push({ x: p.x - 20, y: p.y + rand(-8, 8), vx: rand(-40, 0), vy: rand(-30, 30), g: 0, life: 0.4, t: 0, c: ['#ffe14a', '#ff9a3d', '#ffffff'][Math.floor(Math.random() * 3)], s: 4 });
        for (const a of this.aliens) {
          if (a.dead || a.row !== p.row || p.hits.has(a) || a.x > p.x + 20 || a.x < p.x - 60) continue;
          p.hits.add(a);
          this.hurtAlien(a, p.dmg, true, 1);
          this.explosion(a.x, footY(a.row) - 30, 0.8);
        }
        const m = this.ms;
        if (m && !m.dead && !p.hits.has(m) && p.x > m.x - 190) { p.hits.add(m); this.hurtMs(p.dmg * 1.5, true); this.explosion(p.x, p.y, 1.2); }
        return;
      }
      for (const a of this.aliens) {
        if (a.dead || a.row !== p.row || p.hits.has(a) || this.hidden(a)) continue;
        const hw = 16 + a.def.size * 10;
        if (Math.abs(a.x - p.x) < hw && a.x < G.W - 4) { this.projHit(p, a); if (p.dead) return; }
      }
      const m = this.ms;
      if (m && !m.dead && m.state !== 'arrive' && !p.hits.has(m) && p.x >= m.x - 185 && p.x <= m.x + 180) { this.projHit(p, m); }
    }
    projHit(p, t) {
      p.hits.add(t);
      const isMs = t === this.ms;
      if (p.aoe) {
        this.explosion(p.x, p.y, 0.9); this.addShake(3);
        for (const a of this.aliens) {
          if (a.dead) continue;
          const dx = a.x - p.x, dy = (a.row - p.row) * G.RH;
          const dist = Math.hypot(dx, dy);
          if (dist <= p.aoe) this.hurtAlien(a, a === t ? p.dmg : p.dmg * 0.7, false, AP[p.kind] || 0);
        }
        if (isMs) this.hurtMs(p.dmg);
        p.dead = true; return;
      }
      if (isMs) this.hurtMs(p.dmg, p.crit); else this.hurtAlien(t, p.dmg, p.crit, AP[p.kind] || 0);
      const col = p.kind === 'laser' ? ['#7ffcff', '#ffffff'] : p.kind === 'gold' ? ['#ffe14a', '#ffffff'] : ['#54c7ff', '#ffffff'];
      this.burst(p.x, p.y, p.crit ? 16 : 6, p.crit ? ['#ffe14a', '#ffffff', '#ff9a3d'] : col, p.crit ? 120 : 60, 0, 0.3, p.crit ? 4 : 2);
      if (p.crit) { this.blasts.push({ x: p.x, y: p.y, t: 0, life: 0.35, r: 30 }); }
      if (p.pierce > 0) p.pierce--; else p.dead = true;
    }

    updateMothership(dt) {
      const m = this.ms;
      if (!m) return;
      m.hit = Math.max(0, m.hit - dt); m.t += dt;
      if (m.state === 'arrive') {
        m.y += (m.ty - m.y) * Math.min(1, dt * 1.6);
        if (Math.abs(m.ty - m.y) < 2) { m.y = m.ty; m.state = 'active'; }
        if (Math.random() < 0.3) this.addShake(2);
        return;
      }
      if (m.state === 'dying') {
        m.deathT += dt;
        if (Math.random() < dt * 14) this.explosion(m.x + rand(-170, 170), m.y + rand(-50, 50), rand(0.5, 1));
        m.y += 14 * dt; this.addShake(3);
        return;
      }
      m.y = m.ty + Math.sin(m.t * 1.4) * 5;
      if (m.hp < m.max * 0.5 && Math.random() < dt * 3) this.parts.push({ x: m.x + rand(-120, 120), y: m.y + rand(-10, 30), vx: rand(-10, 10), vy: -30, g: 0, life: 0.8, t: 0, c: Math.random() < 0.5 ? '#4a4a5a' : '#ff9a3d', s: 4 });
      m.abT -= dt;
      if (m.ab) {
        m.ab.t -= dt;
        if (m.ab.t <= 0) { this.msFire(m.ab); m.ab = null; }
      } else if (m.abT <= 0) {
        const list = ['blast', 'summon', 'shutdown', 'steal', 'blast', 'summon'];
        const kind = list[m.seq++ % list.length];
        m.abT = m.hp < m.max * 0.5 ? 4.6 : 6.6;
        if (kind === 'blast') {
          const cnt = new Array(G.ROWS).fill(0);
          this.humans.forEach(h => { if (!h.dead && !h.isDrone) cnt[h.row]++; });
          let row = cnt.indexOf(Math.max(...cnt)); if (Math.random() < 0.35) row = Math.floor(Math.random() * G.ROWS);
          m.ab = { kind, t: 1.5, row };
          this.floatText(m.x, m.y - 110, 'PLASMA BLAST!', '#ff5ad8', 11); H.Sound.boss();
        } else if (kind === 'summon') { m.ab = { kind, t: 0.9 }; this.floatText(m.x, m.y - 110, 'REINFORCEMENTS!', '#ffe14a', 11); H.Sound.wave(); }
        else if (kind === 'shutdown') { m.ab = { kind, t: 1.0, row: Math.floor(Math.random() * G.ROWS) }; this.floatText(m.x, m.y - 110, 'LANE SHUTDOWN!', '#7ffcff', 11); H.Sound.zap(); }
        else { m.ab = { kind, t: 0.9 }; this.floatText(m.x, m.y - 110, 'ENERGY DRAIN!', '#ff5ad8', 11); H.Sound.zap(); }
      }
    }
    msFire(ab) {
      const m = this.ms;
      if (ab.kind === 'blast') {
        this.beams.push({ row: ab.row, t: 0, life: 0.45 });
        this.addShake(12); this.flashScreen = 0.2; H.Sound.explode();
        this.humans.forEach(h => { if (!h.dead && h.row === ab.row) { this.hurtHuman(h, 90); this.explosion(h.x, footY(h.row) - 40, 0.7); } });
        this.aliens.forEach(a => { if (!a.dead && a.row === ab.row && a.type !== 'mothership') { } });
      } else if (ab.kind === 'summon') {
        const n = m.hp < m.max * 0.5 ? 4 : 3;
        for (let i = 0; i < n; i++) {
          const type = ['grunt', 'jet', 'zapper', 'grunt'][Math.floor(Math.random() * 4)];
          this.queue.push({ t: i * 0.5, type, row: this.pickRow() });
        }
      } else if (ab.kind === 'shutdown') {
        this.laneOff[ab.row] = 6;
      } else if (ab.kind === 'steal') {
        const n = m.hp < m.max * 0.5 ? 2 : 1;
        for (let i = 0; i < n; i++) this.zones.push({ col: Math.floor(rand(1, 6)), row: Math.floor(rand(0, 4)), life: 9, t: 0 });
      }
    }

    updateAuras() {
      const cmds = this.aliens.filter(a => !a.dead && (a.type === 'commander' || a.type === 'prime'));
      for (const a of this.aliens) {
        a.buffed = false;
        if (a.dead) continue;
        for (const c of cmds) if (c !== a && Math.abs(c.x - a.x) < G.CW * 3 && Math.abs(c.row - a.row) <= 1) { a.buffed = true; break; }
      }
    }

    finish(won) {
      if (this.state !== 'running') return;
      this.state = won ? 'won' : 'lost';
      const ratio = this.baseHp / this.baseMax;
      const stars = won ? (ratio >= 0.75 ? 3 : ratio >= 0.4 ? 2 : 1) : 0;
      if (won) H.Music.victory(); else H.Music.defeat();
      this.result = { won, stars, kills: this.stats.kills, energy: this.stats.energy, boss: this.stats.boss, ratio, time: this.time, hpLeft: this.baseHp };
      setTimeout(() => this.hooks.end && this.hooks.end(this.result), won ? 900 : 700);
    }

    update(dtRaw) {
      if (this.paused || this.state !== 'running') {
        if (this.state !== 'running') this.updateFxOnly(dtRaw);
        return;
      }
      let left = Math.min(dtRaw, 0.1) * this.speed;
      while (left > 0) { const s = Math.min(left, 0.03); this.step(s); left -= s; }
    }
    updateFxOnly(dt) {
      dt = Math.min(dt, 0.05);
      this.updatePartsFloats(dt);
    }

    updatePartsFloats(dt) {
      for (const p of this.parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 0) * dt * (this.theme === 'moon' ? 0.35 : 1); }
      this.parts = this.parts.filter(p => p.t < p.life);
      for (const f of this.floats) { f.t += dt; f.y -= 24 * dt; }
      this.floats = this.floats.filter(f => f.t < f.life);
      for (const b of this.blasts) b.t += dt;
      this.blasts = this.blasts.filter(b => b.t < b.life);
      for (const b of this.beams) b.t += dt;
      this.beams = this.beams.filter(b => b.t < b.life);
      this.shake = Math.max(0, this.shake - dt * 22);
      this.flashScreen = Math.max(0, this.flashScreen - dt);
      this.baseFlash = Math.max(0, this.baseFlash - dt);
    }

    step(dt) {
      this.time += dt;
      for (const k in this.cd) if (this.cd[k] > 0) this.cd[k] = Math.max(0, this.cd[k] - dt);
      G.Fx.update(dt);
      if (this.sandbox) this.energy = 99999;
      this.updateWaves(dt);
      this.updateDrops(dt);
      this.updateAuras();
      for (let i = 0; i < this.laneOff.length; i++) this.laneOff[i] = Math.max(0, this.laneOff[i] - dt);
      for (const z of this.zones) { z.t += dt; z.life -= dt; }
      this.zones = this.zones.filter(z => z.life > 0);
      for (const h of this.humans) { if (h.isDrone) this.updateDrone(h, dt); else this.updateHuman(h, dt); }
      for (const a of this.aliens) this.updateAlien(a, dt);
      for (const p of this.projs) this.updateProj(p, dt);
      for (const p of this.aprojs) {
        p.x += p.vx * dt; p.life -= dt;
        let hit = null;
        for (const h of this.humans) if (!h.dead && h.row === p.row && Math.abs(h.x - p.x) < 26 && (!hit || h.x > hit.x)) hit = h;
        if (hit) { this.hurtHuman(hit, p.dmg); this.burst(p.x, p.y, 8, ['#b6ff3a', '#8fd03a', '#eaffb0'], 70, 40, 0.4, 3); p.dead = true; }
        else if (p.x < G.GX - 10 || p.life <= 0) p.dead = true;
      }
      this.aprojs = this.aprojs.filter(p => !p.dead);
      this.updateMothership(dt);
      this.updatePartsFloats(dt);
      this.humans = this.humans.filter(h => !h.dead || h.deathT < 0.7);
      this.aliens = this.aliens.filter(a => !a.dead || a.deathT < 0.6);
      this.projs = this.projs.filter(p => !p.dead);
      if (this.state === 'running' && this.allSpawned && this.queue.length === 0 && this.aliens.every(a => a.dead)) {
        const m = this.ms;
        if (!m || (m.dead && m.deathT > 2.4)) {
          if (m === null || this.level.boss !== 'mothership') this.endT += dt; else this.endT += dt;
          if (this.endT > 0.6) this.finish(true);
        }
      }
      if (this.hooks.hud) this.hooks.hud(this);
    }

    bossInfo() {
      if (this.ms) return { name: 'THE MOTHERSHIP', hp: this.ms.hp, max: this.ms.max, shield: 0 };
      if (this.boss && !this.boss.dead) return { name: this.boss.def.name, hp: this.boss.hp, max: this.boss.maxhp, shield: this.boss.shield, maxShield: this.boss.maxShield };
      return null;
    }

    drawText(ctx, text, x, y, color, size, alpha) {
      ctx.font = size + "px 'Press Start 2P', monospace";
      ctx.textAlign = 'center'; ctx.globalAlpha = alpha == null ? 1 : alpha;
      ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.strokeText(text, x, y);
      ctx.fillStyle = color; ctx.fillText(text, x, y);
      ctx.globalAlpha = 1;
    }

    drawReactor(ctx, h) {
      const fr = H.Sprites.reactor[Math.floor(h.animT * 3) % 2];
      const w = Math.round(fr.width * 1.5), hh = Math.round(fr.height * 1.5), fy = footY(h.row);
      let sy = 1, alpha = 1;
      if (h.dead) { const k = Math.min(1, h.deathT / 0.6); sy = 1 - k * 0.9; alpha = 1 - k; }
      const x = Math.round(h.x - w / 2), y = Math.round(fy + 2 - hh * sy - (h.spawnT > 0 ? h.spawnT * 30 : 0));
      ctx.save();
      if (!h.dead) { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(Math.round(h.x - w * 0.4), fy - 3, Math.round(w * 0.8), 5); }
      ctx.globalAlpha = alpha;
      if (!h.dead) { ctx.globalAlpha = 0.14 + 0.1 * Math.sin(this.time * 4 + h.animT); ctx.fillStyle = '#6dff9a'; ctx.fillRect(x - 6, y + Math.round(hh * 0.3), w + 12, Math.round(hh * 0.45)); ctx.globalAlpha = alpha; }
      ctx.drawImage(fr, x, y, w, Math.round(hh * sy));
      if (h.hit > 0 && !h.dead) { ctx.globalAlpha = 0.75; ctx.drawImage(H.Sprites.sil(fr, '#ffffff'), x, y, w, hh); }
      ctx.restore();
      if (!h.dead) {
        for (let i = 0; i < 3; i++) {
          const t = (this.time * 0.7 + i / 3) % 1;
          ctx.globalAlpha = (1 - t) * 0.6; ctx.fillStyle = '#dfe6f5';
          ctx.fillRect(Math.round(h.x - 10 + i * 9 + Math.sin(this.time * 2 + i) * 3), Math.round(y - 2 - t * 26), 6, 6);
        }
        ctx.globalAlpha = 1;
        const k = h.disabled > 0 ? 0 : 1 - Math.max(0, h.prodT) / 9;
        ctx.fillStyle = '#000'; ctx.fillRect(Math.round(h.x - 21), fy + 1, 42, 6);
        ctx.fillStyle = k > 0.85 ? '#ffe14a' : '#6dff9a'; ctx.fillRect(Math.round(h.x - 20), fy + 2, Math.round(40 * k), 4);
        if (h.hp < h.maxhp) {
          ctx.fillStyle = '#000'; ctx.fillRect(Math.round(h.x - 21), y - 8, 42, 6);
          ctx.fillStyle = h.hp / h.maxhp > 0.5 ? '#6dff9a' : '#ff6b6b'; ctx.fillRect(Math.round(h.x - 20), y - 7, Math.round(40 * h.hp / h.maxhp), 4);
        }
        if (h.disabled > 0) this.drawText(ctx, 'ZZT', h.x, y - 12, '#7ffcff', 8);
      }
    }

    drawFirewall(ctx, h) {
      const frac = h.hp / h.maxhp, st = frac > 0.66 ? 0 : frac > 0.33 ? 1 : 2;
      const fr = H.Sprites.firewall[st][Math.floor(this.time * 5 + h.animT) % 2];
      const w = Math.round(fr.width * 1.5), hh = Math.round(fr.height * 1.5), fy = footY(h.row);
      let sy = 1, alpha = 1;
      if (h.dead) { const k = Math.min(1, h.deathT / 0.6); sy = 1 - k * 0.6; alpha = 1 - k; }
      const x = Math.round(h.x - w / 2), y = Math.round(fy + 2 - hh * sy - (h.spawnT > 0 ? h.spawnT * 30 : 0));
      ctx.save();
      if (!h.dead) { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(Math.round(h.x - w * 0.45), fy - 3, Math.round(w * 0.9), 5); }
      ctx.globalAlpha = alpha * (st === 2 ? 0.6 + 0.4 * Math.abs(Math.sin(this.time * 12)) : 1);
      ctx.drawImage(fr, x, y, w, Math.round(hh * sy));
      if (h.hit > 0 && !h.dead) { ctx.globalAlpha = 0.7; ctx.drawImage(H.Sprites.sil(fr, '#ffe98a'), x, y, w, hh); }
      ctx.restore();
      if (!h.dead && h.hp < h.maxhp) {
        ctx.fillStyle = '#000'; ctx.fillRect(Math.round(h.x - 21), fy + 1, 42, 6);
        ctx.fillStyle = frac > 0.5 ? '#6dff9a' : frac > 0.25 ? '#ffe14a' : '#ff6b6b'; ctx.fillRect(Math.round(h.x - 20), fy + 2, Math.round(40 * frac), 4);
      }
    }

    drawDynamite(ctx, h) {
      const fr = H.Sprites.dynamite[Math.floor(this.time * 12) % 2];
      const w = Math.round(fr.width * 1.5), hh = Math.round(fr.height * 1.5), fy = footY(h.row);
      const shake = h.fuseT < 0.7 ? Math.round((Math.random() - 0.5) * 4) : 0;
      const x = Math.round(h.x - w / 2) + shake, y = Math.round(fy + 2 - hh - (h.spawnT > 0 ? h.spawnT * 30 : 0));
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(Math.round(h.x - w * 0.4), fy - 3, Math.round(w * 0.8), 5);
      ctx.drawImage(fr, x, y, w, hh);
      if (Math.floor(h.fuseT * (h.fuseT < 0.7 ? 14 : 6)) % 2 === 0) { ctx.globalAlpha = 0.65; ctx.drawImage(H.Sprites.sil(fr, '#ffffff'), x, y, w, hh); }
      ctx.restore();
      this.drawText(ctx, Math.max(0, h.fuseT).toFixed(1), h.x, y - 6, '#ffe14a', 8);
    }

    drawHuman(ctx, h) {
      if (h.id === 'reactor') { this.drawReactor(ctx, h); return; }
      if (h.id === 'firewall') { this.drawFirewall(ctx, h); return; }
      if (h.id === 'dynamite') { this.drawDynamite(ctx, h); return; }
      const spr = H.Sprites.human[h.id];
      if (!spr) return;
      const fy = footY(h.row);
      const F = H.Sprites.frames[h.id];
      let frame;
      if (h.dead) frame = F.die[Math.min(4, Math.floor(h.deathT / 0.14))];
      else if (h.hit > 0) frame = F.hit[h.hit > 0.09 ? 0 : 1];
      else if (h.id === 'eli' && h.building > 0) frame = F.special[Math.min(2, Math.floor((1.2 - h.building) / 0.4))];
      else if (h.id === 'max' && h.ultAnim > 0) frame = F.special[Math.min(2, Math.floor((0.9 - h.ultAnim) / 0.3))];
      else if (h.id === 'sam' && h.aim > 0) frame = F.attack[h.aim > 0.22 ? 0 : 1];
      else if (h.atk > 0) {
        const k = 1 - h.atk / (h.atkMax || 0.2);
        frame = F.attack[h.id === 'sam' ? 2 + (k > 0.5 ? 1 : 0) : Math.min(3, Math.floor(k * 4))];
      } else frame = F.idle[Math.floor(h.animT * 4) % 4];
      const w = spr.width, hh = spr.height;
      let dy = 0;
      if (h.spawnT > 0) dy -= Math.round(h.spawnT * 30);
      const x = Math.round(h.x - F.w / 2), y = Math.round(fy + 2 - F.h + dy);
      const padX = Math.round((F.w - w) / 2), padY = F.h - hh - 2;
      ctx.save();
      const dis = h.disabled > 0 || this.laneOff[h.row] > 0;
      if (!h.dead) { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(Math.round(h.x - w * 0.35), fy - 3, Math.round(w * 0.7), 5); }
      ctx.drawImage(frame, x, y);
      if (dis && !h.dead) {
        ctx.globalAlpha = 0.35 + 0.25 * Math.sin(this.time * 20);
        ctx.drawImage(H.Sprites.sil(frame, '#7ffcff'), x, y);
        if (h.disabled > 0) { ctx.globalAlpha = 1; this.drawText(ctx, 'ZZT', h.x, y + padY - 4, '#7ffcff', 8); }
      }
      if (h.id === 'tom' && h.shieldFlash > 0 && !h.dead) {
        ctx.globalAlpha = 0.8; ctx.fillStyle = '#7ffcff';
        ctx.fillRect(x + padX + w - 32, y + padY + 22, 8, 48); ctx.fillRect(x + padX + w - 26, y + padY + 16, 6, 56);
        ctx.globalAlpha = 0.5; ctx.drawImage(H.Sprites.sil(frame, '#7ffcff'), x, y);
      }
      ctx.restore();
      if (h.id === 'max' && !h.dead) {
        const rdy = footY(h.row) - hh - 8;
        if (h.ultReady) {
          const pulse = 0.5 + 0.5 * Math.sin(this.time * 8);
          ctx.globalAlpha = 0.25 + pulse * 0.3; ctx.fillStyle = '#ffe14a';
          ctx.fillRect(Math.round(h.x - 34), footY(h.row) - 6, 68, 6);
          ctx.globalAlpha = 1;
          this.drawText(ctx, 'TAP: ULT!', h.x, rdy + 2, pulse > 0.5 ? '#ffe14a' : '#ffffff', 8);
        } else {
          const k = 1 - Math.max(0, h.ultT) / Math.max(10, 20 - 2 * (h.up.spc || 0));
          ctx.fillStyle = '#000'; ctx.fillRect(Math.round(h.x - 22), rdy + 2, 44, 6);
          ctx.fillStyle = '#ffb84a'; ctx.fillRect(Math.round(h.x - 21), rdy + 3, Math.round(42 * Math.max(0, k)), 4);
        }
      }
      if (h.id === 'maya' && h.healFx > 0) {
        ctx.save(); ctx.globalAlpha = Math.min(1, h.healFx * 1.4) * 0.35; ctx.fillStyle = '#6dff9a';
        const r = (1 - h.healFx / 0.7) * G.CW * 1.4 + 20;
        ctx.fillRect(Math.round(h.x - r), footY(h.row) - 8, Math.round(r * 2), 6);
        ctx.fillRect(Math.round(h.x - r * 0.5), footY(h.row) - 60, 4, 4); ctx.fillRect(Math.round(h.x + r * 0.5), footY(h.row) - 40, 4, 4);
        ctx.restore();
      }
      if (h.id === 'sam' && h.aim > 0) {
        ctx.globalAlpha = 0.5 + 0.4 * Math.sin(this.time * 40); ctx.fillStyle = '#ff3b3b';
        ctx.fillRect(Math.round(h.x + w * 0.5), footY(h.row) - hh + Math.round(hh * 0.37), G.W, 1);
        ctx.globalAlpha = 1;
      }
      if (h.id === 'eli' && h.building > 0) {
        for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#ffb84a', '#ffffff', '#7ffcff'][i]; ctx.fillRect(Math.round(h.x + 20 + Math.sin(this.time * 30 + i * 2) * 10), footY(h.row) - 30 - i * 6, 3, 3); }
        this.drawText(ctx, 'BUILDING', h.x, footY(h.row) - hh - 4, '#ffb84a', 7);
      }
      if (!h.dead && h.hp < h.maxhp) {
        const bw = 40, bx = Math.round(h.x - bw / 2), by = footY(h.row) + 1;
        ctx.fillStyle = '#000'; ctx.fillRect(bx - 1, by - 1, bw + 2, 6);
        ctx.fillStyle = h.hp / h.maxhp > 0.5 ? '#6dff9a' : h.hp / h.maxhp > 0.25 ? '#ffe14a' : '#ff6b6b';
        ctx.fillRect(bx, by, Math.round(bw * h.hp / h.maxhp), 4);
      }
    }

    drawDrone(ctx, dr) {
      const F = H.Sprites.frames.drone;
      if (!F) return;
      const spr = F.fly[Math.floor(dr.animT * 14) % 2];
      const fy = footY(dr.row);
      const bob = Math.round(Math.sin(dr.animT * 5) * 3);
      let alpha = 1, fall = 0;
      if (dr.dead) { const k = Math.min(1, dr.deathT / 0.6); alpha = 1 - k; fall = k * 40; }
      const x = Math.round(dr.x - spr.width / 2), y = Math.round(fy - 66 + bob + fall);
      ctx.save(); ctx.globalAlpha = alpha;
      ctx.drawImage(spr, x, y);
      if (dr.hit > 0) { ctx.globalAlpha = 0.7; ctx.drawImage(H.Sprites.sil(spr, '#ffffff'), x, y); }
      ctx.restore();
      if (!dr.dead && dr.hp < dr.maxhp) {
        ctx.fillStyle = '#000'; ctx.fillRect(x, y - 6, 30, 5); ctx.fillStyle = '#6dff9a'; ctx.fillRect(x + 1, y - 5, Math.round(28 * dr.hp / dr.maxhp), 3);
      }
    }

    drawAlien(ctx, a) {
      const frame = Math.floor(a.animT * (['brute', 'commander', 'juggernaut', 'spiker', 'medic', 'prime', 'cactus', 'golem', 'brood', 'astronaut', 'yeti', 'frosttitan', 'magmawyrm', 'obsidian', 'kraken', 'voidtitan', 'shellback', 'mossgolem', 'swamphydra', 'rocktroll', 'stormcolossus', 'sarcophagus', 'pharaoh', 'tankbot', 'omegaprime'].includes(a.type) ? 3 : 5)) % 2;
      const spr = H.Sprites.alien(a.type, frame);
      const w = Math.round(spr.width * AL_SCALE), h = Math.round(spr.height * AL_SCALE);
      const fy = footY(a.row);
      let dx = 0, dy = 0, sy = 1, alpha = 1;
      if (a.type === 'jet' || a.def.fly) dy -= 6 + Math.round(Math.sin(a.animT * 6) * 4);
      if (a.flying > 0 && !a.def.burrow) dy -= 34;
      if (a.def.hop && a.hopping > 0) dy -= Math.round(Math.sin((0.45 - a.hopping) / 0.45 * Math.PI) * 34);
      if (a.atkAnim > 0) dx = -Math.round(8 * Math.sin((a.atkAnim / 0.3) * Math.PI));
      if (a.dead) { const k = Math.min(1, a.deathT / 0.5); sy = 1 - k * 0.9; alpha = 1 - k; dx = Math.round(Math.sin(a.deathT * 50) * 3); }
      if (a.cloaked) alpha *= 0.2 + 0.08 * Math.sin(this.time * 10);
      if (a.flying > 0 && a.def.burrow) { alpha *= 0.55; dy += Math.round(h * 0.42); }
      const x = Math.round(a.x - w / 2 + dx), y = Math.round(fy - h * sy + dy + 4);
      ctx.save();
      if (a.flying > 0 && a.def.burrow) { ctx.beginPath(); ctx.rect(0, 0, G.W, fy + 3); ctx.clip(); }
      if (a.buffed && !a.dead) {
        ctx.globalAlpha = 0.3 + 0.15 * Math.sin(this.time * 8); ctx.fillStyle = '#ff3b3b';
        ctx.fillRect(x + 4, fy - 4, w - 8, 6);
      }
      if (!a.dead && (a.type === 'commander' || a.type === 'prime')) {
        ctx.globalAlpha = 0.12 + 0.05 * Math.sin(this.time * 4); ctx.fillStyle = '#ff3b3b';
        ctx.fillRect(Math.round(a.x - G.CW * 3), fy - 6, G.CW * 6, 6);
      }
      ctx.globalAlpha = alpha * (a.flying > 0 ? 1 : 1);
      if (!a.dead && a.boss) {
        const col = (BURST[a.type] || a.def.burst || ['#ff5ad8'])[0], pulse = 0.5 + 0.5 * Math.sin(this.time * 3 + a.animT), rad = Math.max(w, h) * 0.8, gx = a.x, gy = y + h * 0.55;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const gr = ctx.createRadialGradient(gx, gy, rad * 0.08, gx, gy, rad);
        gr.addColorStop(0, rgba(col, 0.42 + 0.16 * pulse)); gr.addColorStop(0.55, rgba(col, 0.14 + 0.06 * pulse)); gr.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = gr; ctx.fillRect(gx - rad, gy - rad, rad * 2, rad * 2);
        ctx.globalAlpha = 0.3 + 0.2 * pulse;
        const grow = 1.1 + 0.03 * pulse, hw = Math.round(w * grow), hh = Math.round(h * grow);
        ctx.drawImage(H.Sprites.sil(spr, col), Math.round(x - (hw - w) / 2), Math.round(y - (hh - h)), hw, hh);
        ctx.restore();
      }
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(Math.round(a.x - w * 0.3), fy - 3, Math.round(w * 0.6), 5);
      ctx.drawImage(spr, x, y, w, Math.round(h * sy));
      if (a.hit > 0 && !a.dead) { ctx.globalAlpha = 0.75; ctx.drawImage(H.Sprites.sil(spr, '#ffffff'), x, y, w, h); }
      if (a.buffed && !a.dead) { ctx.globalAlpha = 0.3; ctx.drawImage(H.Sprites.sil(spr, '#ff3b3b'), x, y, w, h); }
      ctx.restore();
      if (a.type === 'jet' && !a.dead) {
        ctx.fillStyle = Math.floor(a.animT * 20) % 2 ? '#ffd23f' : '#ff6b1a';
        ctx.fillRect(x + w - 16, y + h - 6 + Math.round(Math.sin(a.animT * 30) * 2), 6, 8);
      }
      if (a.type === 'shield' && !a.dead) {
        const k = a.maxShield ? a.shield / a.maxShield : 0;
        if (a.shield > 0) {
          ctx.save();
          ctx.globalAlpha = (0.35 + 0.15 * Math.sin(this.time * 6)) * (0.5 + 0.5 * k);
          ctx.fillStyle = '#5cf7ff'; ctx.fillRect(x - 14, y + 18, 14, h - 34);
          ctx.globalAlpha = 0.9; ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 14, y + 18, 3, h - 34);
          ctx.fillStyle = '#5cf7ff'; ctx.fillRect(x - 14, y + 18, 14, 3); ctx.fillRect(x - 14, y + h - 19, 14, 3);
          if (a.hit > 0) { ctx.globalAlpha = 0.8; ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 14, y + 18, 14, h - 34); }
          ctx.restore();
        }
      }
      if (a.psyFx > 0) {
        ctx.fillStyle = '#ff8af0';
        const n = Math.max(2, Math.floor((a.x - a.psyTo) / 14));
        for (let i = 0; i < n; i++) ctx.fillRect(Math.round(a.x - 14 - i * 14), fy - 60 + Math.round(Math.sin(i * 1.7 + this.time * 40) * 10), 8, 4);
      }
      if (a.type === 'zapper' && a.zapFx > 0) {
        ctx.fillStyle = '#7ffcff';
        for (let i = 0; i < 6; i++) ctx.fillRect(Math.round(a.x - 20 - i * 12 - Math.random() * 6), fy - 50 + Math.round(Math.sin(i * 2 + this.time * 40) * 12), 10, 3);
      }
      if (!a.dead && a.armor) {
        const bx = Math.round(a.x - 22) - 17, by = y - 8;
        ctx.fillStyle = '#000'; ctx.fillRect(bx - 1, by - 1, 17, 12); ctx.fillStyle = '#8f95ae'; ctx.fillRect(bx, by, 15, 10); ctx.fillStyle = '#c9cee4'; ctx.fillRect(bx, by, 15, 2);
        this.drawText(ctx, String(a.armor), bx + 8, by + 9, '#1a1a28', 7);
      }
      if (a.healFx > 0 && !a.dead) {
        ctx.fillStyle = '#8dff7a';
        for (let i = 0; i < 3; i++) { const t = (0.7 - a.healFx) / 0.7, px = Math.round(a.x - 24 + i * 22), py = Math.round(y + 10 - t * 30 - i * 4); ctx.fillRect(px, py + 3, 9, 3); ctx.fillRect(px + 3, py, 3, 9); }
      }
      if (!a.dead && (a.hp < a.maxhp || (a.shield > 0 && a.shield < a.maxShield))) {
        const bw = 44, bx = Math.round(a.x - bw / 2), by = y - 4;
        ctx.fillStyle = '#000'; ctx.fillRect(bx - 1, by - 1, bw + 2, 6);
        ctx.fillStyle = '#ff6b6b'; ctx.fillRect(bx, by, Math.round(bw * a.hp / a.maxhp), 4);
        if (a.shield > 0) { ctx.fillStyle = '#7ffcff'; ctx.fillRect(bx, by, Math.round(bw * a.shield / a.maxShield), 2); }
      }
    }

    drawProj(ctx, p) {
      const x = Math.round(p.x), y = Math.round(p.y);
      switch (p.kind) {
        case 'blue': { const s = p.small ? 0.7 : 1; ctx.fillStyle = '#2a7bff'; ctx.fillRect(x - 8 * s, y - 2, 14 * s, 5); ctx.fillStyle = '#7ffcff'; ctx.fillRect(x - 4 * s, y - 1, 10 * s, 3); ctx.fillStyle = '#fff'; ctx.fillRect(x + 1, y, 4, 1); break; }
        case 'laser': ctx.fillStyle = 'rgba(127,252,255,0.35)'; ctx.fillRect(x - 40, y - 4, 44, 8); ctx.fillStyle = '#5cf7ff'; ctx.fillRect(x - 30, y - 2, 34, 4); ctx.fillStyle = '#fff'; ctx.fillRect(x - 24, y - 1, 26, 2); break;
        case 'pulse': ctx.fillStyle = '#6dff9a'; ctx.fillRect(x - 4, y - 4, 8, 8); ctx.fillStyle = '#fff'; ctx.fillRect(x - 2, y - 2, 4, 4); break;
        case 'sniper': ctx.fillStyle = 'rgba(255,225,74,0.35)'; ctx.fillRect(x - 90, y - 3, 92, 6); ctx.fillStyle = p.crit ? '#ffe14a' : '#ffffff'; ctx.fillRect(x - 70, y - 1, 74, 3); ctx.fillStyle = '#ffe14a'; ctx.fillRect(x - 2, y - 3, 6, 6); break;
        case 'plasma': {
          const r = 10 + Math.floor(Math.sin(this.time * 20) * 2);
          ctx.fillStyle = '#7a1a9a'; ctx.fillRect(x - r, y - r, r * 2, r * 2);
          ctx.fillStyle = '#ff5ad8'; ctx.fillRect(x - r + 3, y - r + 3, r * 2 - 6, r * 2 - 6);
          ctx.fillStyle = '#ffd0f8'; ctx.fillRect(x - 4, y - 4, 8, 8);
          ctx.fillStyle = 'rgba(255,90,216,0.4)'; ctx.fillRect(x - r - 14, y - 3, 14, 6);
          break;
        }
        case 'gold': ctx.fillStyle = '#ff9a3d'; ctx.fillRect(x - 12, y - 4, 20, 8); ctx.fillStyle = '#ffe14a'; ctx.fillRect(x - 8, y - 3, 18, 6); ctx.fillStyle = '#fff'; ctx.fillRect(x, y - 1, 8, 2); break;
        case 'ult':
          ctx.fillStyle = 'rgba(255,154,61,0.5)'; ctx.fillRect(x - 90, y - 12, 90, 24);
          ctx.fillStyle = '#ff5a3a'; ctx.fillRect(x - 60, y - 9, 60, 18);
          ctx.fillStyle = '#ffe14a'; ctx.fillRect(x - 36, y - 7, 44, 14);
          ctx.fillStyle = '#fff'; ctx.fillRect(x - 20, y - 4, 40, 8);
          ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 8, y - 10, 10, 20);
          break;
      }
    }

    drawMs(ctx) {
      const m = this.ms;
      if (!m) return;
      const spr = H.Sprites.alien('mothership', 0);
      const w = spr.width * 2, h = spr.height * 2;
      const x = Math.round(m.x - w / 2), y = Math.round(m.y - h / 2);
      ctx.save();
      const dying = m.state === 'dying';
      if (dying) ctx.globalAlpha = Math.max(0.2, 1 - m.deathT / 3);
      if (m.ab && m.ab.kind === 'blast') {
        ctx.globalAlpha = 0.3 + 0.3 * Math.sin(this.time * 30); ctx.fillStyle = '#ff5ad8';
        ctx.fillRect(x + 40, y + h - 20, w - 80, 30);
        ctx.globalAlpha = dying ? ctx.globalAlpha : 1;
      }
      if (!dying) {
        const pulse = 0.5 + 0.5 * Math.sin(this.time * 2.4), gx = m.x, gy = m.y + 10, rad = w * 0.7;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const gr = ctx.createRadialGradient(gx, gy, rad * 0.1, gx, gy, rad);
        gr.addColorStop(0, rgba('#ff5ad8', 0.34 + 0.14 * pulse)); gr.addColorStop(0.5, rgba('#7b52c9', 0.16 + 0.08 * pulse)); gr.addColorStop(1, rgba('#7b52c9', 0));
        ctx.fillStyle = gr; ctx.fillRect(gx - rad, gy - rad * 0.7, rad * 2, rad * 1.4);
        ctx.restore();
      }
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + 60, G.GY + G.RH * 5 - 6, w - 120, 6);
      ctx.drawImage(spr, x, y, w, h);
      if (m.hit > 0) { ctx.globalAlpha = 0.6; ctx.drawImage(H.Sprites.sil(spr, '#ffffff'), x, y, w, h); ctx.globalAlpha = 1; }
      const cols = ['#ff5ad8', '#ffe14a', '#5cf7ff'];
      for (let i = 0; i < 12; i++) {
        const lx = x + 60 + i * ((w - 120) / 11), ly = y + h * 0.61 + Math.sin(i / 11 * Math.PI) * 6;
        ctx.fillStyle = cols[(i + Math.floor(this.time * 4)) % 3]; ctx.fillRect(Math.round(lx), Math.round(ly), 6, 6);
      }
      ctx.restore();
    }

    render() {
      const ctx = this.ctx;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, G.W, G.H);
      let sx = 0, sy = 0;
      if (this.shake > 0) { sx = Math.round((Math.random() - 0.5) * this.shake); sy = Math.round((Math.random() - 0.5) * this.shake); }
      ctx.translate(sx, sy);
      ctx.drawImage(this.bg, 0, 0);
      G.Fx.draw(ctx);
      if (this.baseFlash > 0) { ctx.fillStyle = 'rgba(255,60,60,' + (this.baseFlash * 0.8) + ')'; ctx.fillRect(0, G.GY, G.GX, G.RH * G.ROWS); }

      for (let r = 0; r < G.ROWS; r++) {
        if (this.laneOff[r] > 0) {
          ctx.fillStyle = 'rgba(10,20,50,0.55)'; ctx.fillRect(G.GX, rowTop(r), G.COLS * G.CW, G.RH);
          ctx.fillStyle = 'rgba(127,252,255,0.25)';
          for (let x = G.GX; x < FIELD_R; x += 24) ctx.fillRect(x + Math.floor(this.time * 30) % 24, rowTop(r) + 40, 8, 3);
          this.drawText(ctx, 'OFFLINE ' + Math.ceil(this.laneOff[r]), G.GX + G.COLS * G.CW / 2, rowTop(r) + 56, '#7ffcff', 10, 0.8);
        }
      }
      for (const b of this.beams) {
        const k = 1 - b.t / b.life;
        ctx.fillStyle = 'rgba(255,90,216,' + (0.5 * k) + ')'; ctx.fillRect(G.GX, rowTop(b.row) + 8, G.COLS * G.CW, G.RH - 16);
        ctx.fillStyle = 'rgba(255,255,255,' + k + ')'; ctx.fillRect(G.GX, rowTop(b.row) + 34, G.COLS * G.CW, 28);
      }
      if (this.ms && this.ms.ab && this.ms.ab.kind === 'blast') {
        const on = Math.floor(this.time * 10) % 2;
        ctx.fillStyle = on ? 'rgba(255,60,60,0.35)' : 'rgba(255,60,60,0.15)'; ctx.fillRect(G.GX, rowTop(this.ms.ab.row), G.COLS * G.CW, G.RH);
      }
      if (this.ms && this.ms.ab && this.ms.ab.kind === 'shutdown') {
        ctx.fillStyle = 'rgba(127,252,255,0.25)'; ctx.fillRect(G.GX, rowTop(this.ms.ab.row), G.COLS * G.CW, G.RH);
      }
      for (const z of this.zones) {
        const x = cellX(z.col), y = rowTop(z.row), w = G.CW * 2, h = G.RH * 2;
        ctx.fillStyle = 'rgba(160,30,140,0.45)'; ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#ff5ad8';
        for (let i = 0; i < 4; i++) { ctx.fillRect(x + (i % 2 ? 0 : w - 3), y + i * h / 4, 3, h / 4 - 4); ctx.fillRect(x + i * w / 4, y + (i % 2 ? 0 : h - 3), w / 4 - 4, 3); }
        for (let i = 0; i < 8; i++) { const a = this.time * 2 + i; ctx.fillRect(Math.round(x + w / 2 + Math.cos(a) * (20 + (i * 9) % 40)), Math.round(y + h / 2 + Math.sin(a) * (20 + (i * 7) % 40)), 4, 4); }
        this.drawText(ctx, 'DRAIN ' + Math.ceil(z.life), x + w / 2, y + h / 2 + 4, '#ffd0f8', 9);
      }

      this.drawPlacementUI(ctx);

      this.drawMs(ctx);

      const hs = this.humans.slice(), as = this.aliens.slice();
      for (let r = 0; r < G.ROWS; r++) {
        const items = [];
        hs.forEach(h => { if (h.row === r) items.push({ x: h.x, h, k: 0 }); });
        as.forEach(a => { if (a.row === r) items.push({ x: a.x, a, k: 1 }); });
        items.sort((p, q) => p.k - q.k || p.x - q.x);
        items.forEach(it => { if (it.h) { if (it.h.isDrone) this.drawDrone(ctx, it.h); else this.drawHuman(ctx, it.h); } else this.drawAlien(ctx, it.a); });
      }
      for (const p of this.projs) this.drawProj(ctx, p);
      for (const p of this.aprojs) {
        const x = Math.round(p.x), y = Math.round(p.y + Math.sin(this.time * 18 + p.x) * 2);
        ctx.fillStyle = 'rgba(182,255,58,0.35)'; ctx.fillRect(x, y - 3, 22, 6);
        ctx.fillStyle = '#4a8f1a'; ctx.fillRect(x - 8, y - 6, 16, 12); ctx.fillStyle = '#b6ff3a'; ctx.fillRect(x - 6, y - 4, 12, 8); ctx.fillStyle = '#eaffb0'; ctx.fillRect(x - 3, y - 2, 5, 3);
      }
      for (const b of this.blasts) {
        const k = b.t / b.life, r = b.r * (0.4 + k * 0.9);
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = '#ff5a3a'; ctx.fillRect(Math.round(b.x - r), Math.round(b.y - r * 0.7), Math.round(r * 2), Math.round(r * 1.4));
        ctx.fillStyle = '#ff9a3d'; ctx.fillRect(Math.round(b.x - r * 0.75), Math.round(b.y - r * 0.55), Math.round(r * 1.5), Math.round(r * 1.1));
        ctx.fillStyle = '#ffe14a'; ctx.fillRect(Math.round(b.x - r * 0.45), Math.round(b.y - r * 0.35), Math.round(r * 0.9), Math.round(r * 0.7));
        ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(b.x - r * 0.2), Math.round(b.y - r * 0.15), Math.round(r * 0.4), Math.round(r * 0.3));
        ctx.globalAlpha = 1;
      }
      for (const p of this.parts) {
        ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.c;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
      }
      ctx.globalAlpha = 1;
      this.drawDrops(ctx);
      for (const f of this.floats) this.drawText(ctx, f.text, Math.round(f.x), Math.round(f.y), f.color, f.size, Math.min(1, (f.life - f.t) * 3));
      if (this.flashScreen > 0) { ctx.fillStyle = 'rgba(255,255,255,' + this.flashScreen * 1.5 + ')'; ctx.fillRect(0, 0, G.W, G.H); }
    }

    drawDrops(ctx) {
      const spr = H.Sprites.energy;
      for (const d of this.drops) {
        const bob = d.state === 'float' ? Math.round(Math.sin(d.t * 3) * 3) : 0;
        if (d.state === 'float' && d.life < 3 && Math.floor(d.life * 6) % 2) continue;
        const pulse = 0.5 + 0.5 * Math.sin((d.t + this.time) * 5);
        const x = Math.round(d.x - spr.width * 0.75), y = Math.round(d.y - spr.height * 1.5 + bob);
        ctx.globalAlpha = 0.18 + 0.14 * pulse; ctx.fillStyle = '#ffe14a';
        ctx.fillRect(x - 6, y - 6, 42, 54); ctx.globalAlpha = 0.25 + 0.15 * pulse; ctx.fillRect(x, y, 30, 42);
        ctx.globalAlpha = 1;
        ctx.drawImage(spr, x + 3, y + 2, spr.width * 1.5, spr.height * 1.5);
        if (d.value > 25) this.drawText(ctx, '+' + d.value, d.x, y - 2, '#ffe14a', 7);
      }
    }

    drawPlacementUI(ctx) {
      if (this.sandbox && this.spawnSel && !this.selected && this.pointer) {
        const spr = H.Sprites.alien(this.spawnSel, 0), sc = this.spawnSel === 'mothership' ? 1 : 1.5, w = Math.round(spr.width * sc), h = Math.round(spr.height * sc);
        const row = Math.floor((this.pointer.y - G.GY) / G.RH);
        if (row >= 0 && row < G.ROWS) {
          ctx.save(); ctx.globalAlpha = 0.2; ctx.fillStyle = '#ff5ad8'; ctx.fillRect(G.GX, rowTop(row) + 6, G.COLS * G.CW, G.RH - 12);
          ctx.globalAlpha = 0.75; ctx.drawImage(spr, Math.round(Math.min(this.pointer.x, FIELD_R + 14) - w / 2), Math.round(footY(row) - h + 4), w, h); ctx.restore();
        }
      }
      if (!this.selected) return;
      const d = this.hdef(this.selected);
      const t = this.time;
      ctx.save();
      const hv = this.hover;
      if (hv) {
        const occ = this.cells[hv.row][hv.col];
        const rng = H.stat(d, this.up(d.id), 'range');
        const x0 = cellX(hv.col), x1 = Math.min(FIELD_R, cellCX(hv.col) + Math.max(rng, 0.5) * G.CW);
        ctx.globalAlpha = rng > 0 ? 0.28 : 0.12; ctx.fillStyle = occ ? '#ff6b6b' : '#7ffcff';
        ctx.fillRect(x0, rowTop(hv.row) + 6, x1 - x0, G.RH - 12);
        ctx.globalAlpha = 0.9; ctx.fillStyle = occ ? '#ff6b6b' : '#7ffcff';
        for (let x = x0; x < x1; x += 12) { ctx.fillRect(x, rowTop(hv.row) + 6, 6, 2); ctx.fillRect(x, rowTop(hv.row) + G.RH - 8, 6, 2); }
        ctx.fillRect(x1 - 2, rowTop(hv.row) + 6, 3, G.RH - 12);
        if (d.id === 'dynamite') {
          const r0 = Math.max(0, hv.row - 1), r1 = Math.min(G.ROWS - 1, hv.row + 1);
          ctx.globalAlpha = 0.28; ctx.fillStyle = '#ff5a3a';
          ctx.fillRect(Math.max(G.GX, cellCX(hv.col) - G.CW * 1.7), rowTop(r0), Math.min(FIELD_R, cellCX(hv.col) + G.CW * 1.7) - Math.max(G.GX, cellCX(hv.col) - G.CW * 1.7), G.RH * (r1 - r0 + 1));
        }
        ctx.globalAlpha = occ ? 0.2 : 0.4;
        const spr = H.Sprites.human[d.id] || H.Sprites.itemSprite(d.id), sc = H.isItem(d.id) ? 1.5 : 1;
        ctx.drawImage(spr, Math.round(cellCX(hv.col) - spr.width * sc / 2), Math.round(footY(hv.row) - spr.height * sc), Math.round(spr.width * sc), Math.round(spr.height * sc));
        if (occ) this.drawText(ctx, 'X', cellCX(hv.col), rowTop(hv.row) + 52, '#ff6b6b', 20);
      }
      if (this.pointer) {
        const spr = H.Sprites.human[d.id] || H.Sprites.itemSprite(d.id), sc = H.isItem(d.id) ? 1.5 : 1, w = Math.round(spr.width * sc), h = Math.round(spr.height * sc);
        ctx.globalAlpha = 0.85; ctx.drawImage(spr, Math.round(this.pointer.x - w / 2), Math.round(this.pointer.y - h * 0.62), w, h);
      }
      ctx.restore();
    }
  }

  H.Battle = Battle;
})(window.HVA);
