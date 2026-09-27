(function (H) {
  const $ = id => document.getElementById(id);
  const Hud = { battle: null, level: null, ids: [], lastHud: 0, bannerT: null };
  H.Hud = Hud;

  function cardHTML(id, n) {
    const src = H.isItem(id) ? H.Sprites.itemURL(id) : H.asset('assets/' + id + '.png');
    const d = H.defOf(id);
    return '<div class="tcard' + (H.isItem(id) ? ' reactor' : '') + '" data-id="' + id + '" role="button" tabindex="0" aria-label="' + d.name + ' ' + d.cost + ' energy">' +
      '<span class="k">' + (H.ITEM_KEYS[id] || n) + '</span><div class="pt"><img src="' + src + '" alt="" draggable="false"></div><div class="cs">' + d.cost + '</div><i class="rc"></i></div>';
  }

  function tipHTML(id) {
    const d = H.defOf(id), b = Hud.battle;
    let stats;
    if (H.isItem(id)) stats = '❤️ ' + d.hp + ' HP · ' + d.tip;
    else { const up = H.Save.upgrades(id); stats = '❤️ ' + H.stat(d, up, 'hp') + ' HP · ⚔️ ' + H.stat(d, up, 'dmg') + ' DMG · 🎯 ' + d.rangeLabel; }
    const need = b && b.energy < d.cost ? '<div class="n">NEED ' + d.cost + ' ⚡</div>' : '';
    return '<b>' + d.name + '</b><div class="r">' + d.icon + ' ' + d.role + ' · ' + d.cost + ' ⚡</div><div>' + stats + '</div><div class="a">✨ ' + d.ability + '</div>' + need;
  }

  Hud.showTip = function (card) {
    const tip = $('cardTip'), stage = $('stage');
    tip.innerHTML = tipHTML(card.dataset.id);
    tip.style.display = 'block';
    const sr = stage.getBoundingClientRect(), cr = card.getBoundingClientRect(), br = $('bank').getBoundingClientRect();
    let left = cr.left - sr.left;
    left = Math.max(6, Math.min(left, sr.width - tip.offsetWidth - 6));
    tip.style.left = left + 'px';
    tip.style.top = (br.bottom - sr.top + 8) + 'px';
  };
  Hud.hideTip = function () { $('cardTip').style.display = 'none'; };

  Hud.fit = function () {
    const stage = $('field'), c = $('game');
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    const k = Math.min(w / H.G.W, h / H.G.H);
    c.style.width = Math.floor(H.G.W * k) + 'px';
    c.style.height = Math.floor(H.G.H * k) + 'px';
  };

  Hud.begin = function (level, ids) {
    Hud.stop();
    Hud.level = level; Hud.ids = ids.slice();
    $('battle').hidden = false;
    $('tray').innerHTML = ids.concat(level.sandbox ? H.ITEMS.map(i => i.id) : H.ownedItems()).map((id, i) => cardHTML(id, i + 1)).join('');
    Hud.hideTip();
    const b = new H.Battle($('game'), level, ids, {
      hud: () => Hud.update(false),
      banner: (t, c) => Hud.banner(t, c),
      music: n => H.Music.play(n),
      end: r => H.UI.finishBattle(level, r)
    });
    Hud.battle = b;
    $('bgFill').style.backgroundImage = 'url(' + b.bg.toDataURL() + ')';
    H.Music.play(H.Music.trackFor(level));
    $('waveTotal').textContent = level.waves;
    $('btnSpeed').textContent = '1x';
    $('bossBar').hidden = true;
    Hud.fit();
    Hud.update(true);
    requestAnimationFrame(Hud.fit);
  };

  Hud.stop = function () {
    Hud.battle = null;
    const sb = $('sbox'); if (sb) sb.remove();
    $('battle').classList.remove('sandbox');
    $('battle').hidden = true;
    $('banner').className = '';
    document.querySelectorAll('.modal-battle').forEach(n => n.remove());
  };

  Hud.banner = function (text, cls) {
    const el = $('banner');
    el.className = ''; void el.offsetWidth;
    el.textContent = text;
    el.className = cls === 'final' ? 'final' : cls === 'info' ? 'info' : 'show';
  };

  Hud.update = function (force) {
    const b = Hud.battle;
    if (!b) return;
    const now = performance.now();
    if (!force && now - Hud.lastHud < 90) return;
    Hud.lastHud = now;
    const ev = $('energyVal'), en = Math.floor(b.energy);
    const shown = b.sandbox ? '∞' : String(en);
    if (ev.textContent !== shown) ev.textContent = shown;
    if (b.sandbox) Hud.syncSandbox();
    $('waveVal').textContent = Math.min(b.waveNo, b.waveTotal);
    const pct = Math.max(0, b.baseHp / b.baseMax * 100);
    const bar = $('baseBar'); bar.style.width = pct + '%'; bar.className = pct < 35 ? 'low' : '';
    $('baseVal').textContent = Math.max(0, Math.ceil(b.baseHp));
    const frac = b.waveNo / b.waveTotal, pressure = Math.min(1, b.aliens.filter(a => !a.dead).length / 8);
    H.Music.setIntensity(b.waveNo === 0 ? 0.2 : b.waveNo === b.waveTotal ? 1 : 0.2 + 0.5 * frac + 0.25 * pressure);
    const bi = b.bossInfo(), bb = $('bossBar');
    if (bi) {
      bb.hidden = false; $('bossName').textContent = bi.name;
      $('bossHp').style.width = Math.max(0, bi.hp / bi.max * 100) + '%';
      $('bossShield').style.width = bi.maxShield ? Math.max(0, bi.shield / bi.maxShield * 100) + '%' : '0';
    } else bb.hidden = true;
    document.querySelectorAll('.tcard').forEach(card => {
      const d = H.defOf(card.dataset.id), can = en >= d.cost, sel = b.selected === d.id;
      card.classList.toggle('cant', !can && !sel);
      card.classList.toggle('sel', sel);
    });
    const any = b.drops.some(d => !d.taken && d.state !== 'gone'), cb = $('btnCollect');
    cb.disabled = !any; cb.classList.toggle('ready', any);
    if (b.selected) { const sc = document.querySelector('.tcard.sel'); if (sc && $('cardTip').style.display === 'block') $('cardTip').innerHTML = tipHTML(b.selected); }
  };

  const SB_ORDER = ['slime', 'grunt', 'brute', 'bomber', 'trooper', 'spiker', 'spitter', 'zapper', 'jet', 'medic', 'shield', 'juggernaut', 'commander', 'prime'];
  Hud.beginSandbox = function (world) {
    const lvl = { world: world || 1, level: 1, idx: 1, waves: 999, pool: [], boss: null, name: 'SANDBOX', sandbox: true };
    Hud.begin(lvl, H.HUMANS.map(h => h.id));
    $('battle').classList.add('sandbox');
    const keys = Object.keys(H.ALIENS).filter(k => k !== 'mothership');
    const list = SB_ORDER.filter(k => H.ALIENS[k]).concat(keys.filter(k => !SB_ORDER.includes(k))).concat(['mothership']);
    const chip = t => '<button class="sb-chip" data-sp="' + t + '" title="' + H.ALIENS[t].name + '"><img src="' + H.Sprites.alienURL(t) + '" alt="" draggable="false"><span>' + H.chipName(t) + '</span></button>';
    const p = document.createElement('div');
    p.id = 'sbox';
    p.innerHTML = '<div class="sb-bar"><button class="sb-b" data-sb="exit">⏏ EXIT</button><button class="sb-b" data-sb="wprev">◀</button><span class="sb-w" id="sbWorld"></span><button class="sb-b" data-sb="wnext">▶</button>' +
      '<button class="sb-b" data-sb="boss" id="sbBoss">☠ BOSS: OFF</button><button class="sb-b" data-sb="maxup" id="sbMax">⬆ MAX UPGRADES: OFF</button>' +
      '<button class="sb-b" data-sb="clra">🧹 ALIENS</button><button class="sb-b" data-sb="clrh">🧹 HUMANS</button><button class="sb-b" data-sb="hide" id="sbHide">▼</button></div>' +
      '<div class="sb-hint" id="sbHint">PICK A CARD ABOVE TO PLACE A HUMAN · PICK AN ALIEN BELOW, THEN CLICK A LANE · RIGHT-CLICK CANCELS · NOTHING IS SAVED</div>' +
      '<div class="sb-chips" id="sbChips">' + list.map(chip).join('') + '</div>';
    p.addEventListener('pointerdown', e => e.stopPropagation());
    p.addEventListener('click', e => {
      const b = Hud.battle; if (!b) return;
      const sp = e.target.closest('[data-sp]'), bt = e.target.closest('[data-sb]');
      if (sp) { H.Sound.click(); b.selected = null; b.spawnSel = b.spawnSel === sp.dataset.sp ? null : sp.dataset.sp; Hud.update(true); return; }
      if (!bt) return;
      H.Sound.click();
      const k = bt.dataset.sb;
      if (k === 'exit') { Hud.stop(); H.UI.show('menu'); return; }
      if (k === 'boss') b.spawnBoss = !b.spawnBoss;
      if (k === 'maxup') b.maxUp = !b.maxUp;
      if (k === 'clra') b.clearAliens();
      if (k === 'clrh') b.clearHumans();
      if (k === 'hide') p.classList.toggle('min');
      if (k === 'wprev' || k === 'wnext') {
        const n = H.WORLDS.length, w = b.level.world;
        b.setWorld(k === 'wnext' ? (w % n) + 1 : ((w - 2 + n) % n) + 1);
        $('bgFill').style.backgroundImage = 'url(' + b.bg.toDataURL() + ')';
      }
      Hud.update(true);
    });
    $('stage').appendChild(p);
    Hud.update(true);
  };
  Hud.syncSandbox = function () {
    const b = Hud.battle; if (!b) return;
    const w = H.WORLDS[b.level.world - 1];
    const set = (id, t) => { const el = $(id); if (el && el.textContent !== t) el.textContent = t; };
    set('sbWorld', 'W' + w.id + ' ' + w.name);
    set('sbBoss', '☠ BOSS: ' + (b.spawnBoss ? 'ON' : 'OFF'));
    set('sbMax', '⬆ MAX UPGRADES: ' + (b.maxUp ? 'ON' : 'OFF'));
    document.querySelectorAll('.sb-chip').forEach(c => c.classList.toggle('on', c.dataset.sp === b.spawnSel));
    const bb = $('sbBoss'); if (bb) bb.classList.toggle('on', b.spawnBoss);
    const mm = $('sbMax'); if (mm) mm.classList.toggle('on', b.maxUp);
  };

  Hud.tickCards = function () {
    const b = Hud.battle;
    if (!b) return;
    document.querySelectorAll('.tcard').forEach(card => {
      const id = card.dataset.id, left = b.cd[id] || 0, tot = H.RECHARGE[id] || 8, rc = card.lastElementChild;
      const on = left > 0;
      if (card._cd !== on) { card._cd = on; card.classList.toggle('cool', on); }
      if (rc && rc.className === 'rc') rc.style.height = on ? (left / tot * 100).toFixed(1) + '%' : '0';
    });
  };

  Hud.pause = function (on) {
    const b = Hud.battle;
    if (!b || b.state !== 'running') return;
    b.paused = on;
    H.Music.setDuck(on ? 0.3 : 1);
    if (on) {
      const m = document.createElement('div');
      m.className = 'modal-battle'; m.id = 'pauseModal';
      m.style.cssText = 'position:absolute;inset:0;background:rgba(2,2,20,.82);display:flex;align-items:center;justify-content:center;z-index:20;padding:16px';
      m.innerHTML = '<div class="dialog"><h2>PAUSED</h2><div class="btns" style="flex-direction:column;align-items:center">' +
        '<button class="btn play" data-act="resume">▶ RESUME</button><button class="btn" data-act="restart">↻ RESTART</button><button class="btn red" data-act="quit">✖ QUIT LEVEL</button></div></div>';
      $('battle').appendChild(m);
    } else {
      const m = $('pauseModal'); if (m) m.remove();
    }
  };

  Hud.act = function (act) {
    const b = Hud.battle;
    if (act === 'pause') { H.Sound.click(); Hud.pause(true); return true; }
    if (act === 'resume') { H.Sound.click(); Hud.pause(false); return true; }
    if (act === 'restart') { H.Sound.click(); const l = Hud.level, ids = Hud.ids; if (l.sandbox) Hud.beginSandbox(l.world); else Hud.begin(l, ids); return true; }
    if (act === 'quit' && Hud.level.sandbox) { H.Sound.click(); Hud.stop(); H.UI.show('menu'); return true; }
    if (act === 'quit') { H.Sound.click(); Hud.stop(); H.UI.show('levels', { world: Hud.level.world }); return true; }
    if (act === 'collect' && b) { if (b.collectAll()) Hud.update(true); else H.Sound.deny(); return true; }
    if (act === 'speed' && b) {
      H.Sound.click();
      b.speed = b.speed === 1 ? 2 : b.speed === 2 ? 3 : 1;
      $('btnSpeed').textContent = b.speed + 'x';
      return true;
    }
    return false;
  };

  function toLogical(e) {
    const c = $('game'), r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * H.G.W / r.width, y: (e.clientY - r.top) * H.G.H / r.height };
  }

  Hud.init = function () {
    const c = $('game');
    c.addEventListener('pointermove', e => { if (Hud.battle) { const p = toLogical(e); Hud.battle.pointerMove(p.x, p.y); } });
    c.addEventListener('pointerdown', e => {
      if (!Hud.battle) return;
      e.preventDefault();
      H.Sound.unlock();
      if (e.button === 2) { Hud.battle.cancel(); return; }
      const p = toLogical(e);
      Hud.battle.pointerMove(p.x, p.y);
      Hud.battle.pointerDown(p.x, p.y);
      Hud.update(true);
    });
    c.addEventListener('pointerleave', () => { if (Hud.battle) { Hud.battle.hover = null; Hud.battle.pointer = null; } });
    c.addEventListener('contextmenu', e => { e.preventDefault(); if (Hud.battle) Hud.battle.cancel(); });
    const tray = $('tray');
    let drag = null;
    tray.addEventListener('dragstart', e => e.preventDefault());
    const endDrag = () => {
      if (!drag) return;
      if (drag.ghost) drag.ghost.remove();
      drag = null;
    };
    const pointAt = (cx, cy) => {
      const r = c.getBoundingClientRect();
      return { x: (cx - r.left) * H.G.W / r.width, y: (cy - r.top) * H.G.H / r.height };
    };
    tray.addEventListener('pointerdown', e => {
      const card = e.target.closest('.tcard');
      const b = Hud.battle;
      if (!card || !b || b.paused || b.state !== 'running' || e.button > 0) return;
      H.Sound.unlock();
      drag = { id: card.dataset.id, card, pid: e.pointerId, sx: e.clientX, sy: e.clientY, active: false, touch: e.pointerType === 'touch', ghost: null };
    });
    window.addEventListener('pointermove', e => {
      const b = Hud.battle;
      if (!drag || !b || e.pointerId !== drag.pid) return;
      const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (!drag.active) {
        const dist = Math.hypot(dx, dy);
        if (dist < 9) return;
        if (drag.touch && Math.abs(dx) > Math.abs(dy)) { endDrag(); return; }
        const d = H.defOf(drag.id);
        if (b.energy < d.cost) { b.select(drag.id); endDrag(); return; }
        b.selected = null; b.select(drag.id);
        if (b.selected !== drag.id) { endDrag(); return; }
        drag.active = true;
        Hud.hideTip();
        const g = document.createElement('div');
        g.id = 'dragGhost';
        const im = document.createElement('img');
        im.src = H.isItem(drag.id) ? H.Sprites.itemURL(drag.id) : H.asset('assets/' + drag.id + '.png');
        g.appendChild(im);
        document.body.appendChild(g);
        drag.ghost = g;
        try { drag.card.setPointerCapture(e.pointerId); } catch (err) {}
      }
      e.preventDefault();
      const p = pointAt(e.clientX, e.clientY);
      b.pointerMove(p.x, p.y);
      drag.ghost.style.left = e.clientX + 'px';
      drag.ghost.style.top = e.clientY + 'px';
      drag.ghost.style.display = b.hover ? 'none' : 'block';
    }, { passive: false });
    const finishDrag = (e, cancelled) => {
      const b = Hud.battle;
      if (!drag || e.pointerId !== drag.pid) return;
      if (drag.active && b) {
        const p = pointAt(e.clientX, e.clientY);
        const cell = cancelled ? null : b.cellAt(p.x, p.y);
        if (cell && !b.cells[cell.row][cell.col]) b.place(cell.row, cell.col);
        else { b.cancel(); if (cell) H.Sound.deny(); }
        b.hover = null;
        Hud.dragUntil = performance.now() + 250;
        Hud.update(true);
      }
      endDrag();
    };
    window.addEventListener('pointerup', e => finishDrag(e, false));
    window.addEventListener('pointercancel', e => finishDrag(e, true));
    tray.addEventListener('click', e => {
      if (performance.now() < (Hud.dragUntil || 0)) return;
      const card = e.target.closest('.tcard');
      if (!card || !Hud.battle) return;
      Hud.battle.select(card.dataset.id);
      Hud.update(true);
      if (e.pointerType === 'touch' || (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents)) { Hud.showTip(card); clearTimeout(Hud.tipT); Hud.tipT = setTimeout(Hud.hideTip, 2600); }
    });
    tray.addEventListener('mouseover', e => { const card = e.target.closest('.tcard'); if (card && Hud.battle) Hud.showTip(card); });
    tray.addEventListener('mouseleave', Hud.hideTip);
    window.addEventListener('resize', Hud.fit);
    if (window.ResizeObserver) new ResizeObserver(Hud.fit).observe($('field'));
    window.addEventListener('keydown', e => {
      const b = Hud.battle;
      if (!b || $('battle').hidden) return;
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') { if (b.paused) Hud.pause(false); else if (b.selected) b.cancel(); else Hud.pause(true); return; }
      if (b.paused) return;
      if (e.key === 'c' || e.key === 'C') { if (b.collectAll()) Hud.update(true); }
      if (e.key === 'r' || e.key === 'R') { b.select('reactor'); Hud.update(true); }
      if ((e.key === 'f' || e.key === 'F') && H.ownedItems().includes('firewall')) { b.select('firewall'); Hud.update(true); }
      if ((e.key === 'd' || e.key === 'D') && H.ownedItems().includes('dynamite')) { b.select('dynamite'); Hud.update(true); }
      if (e.key >= '1' && e.key <= '6') { const id = Hud.ids[+e.key - 1]; if (id) { b.select(id); Hud.update(true); } }
      if (e.key === 'u' || e.key === 'U') b.humans.forEach(h => { if (h.id === 'max' && h.ultReady && !h.dead) b.tryUlt(h); });
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden && Hud.battle && !Hud.battle.paused && Hud.battle.state === 'running') Hud.pause(true); });
  };
})(window.HVA);
