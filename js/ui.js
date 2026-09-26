(function (H) {
  const $ = id => document.getElementById(id);
  const S = () => H.Save;
  const UI = { current: 'menu', world: 1, upgHuman: 'ryan', preLevel: 0, picked: [] };
  H.UI = UI;

  const stars = (n, max) => { let s = ''; for (let i = 0; i < (max || 3); i++) s += '<span class="' + (i < n ? 'star-on' : 'star-off') + '">★</span>'; return s; };
  const speedLabel = v => v >= 0.95 ? 'Very Fast' : v >= 0.7 ? 'Fast' : v >= 0.45 ? 'Normal' : 'Slow';
  const playerLevel = () => 1 + Math.floor(S().data.xp / 150);
  const totalStars = () => Object.values(S().data.stars).reduce((a, b) => a + b, 0);

  UI.toast = function (text, cls) {
    const t = document.createElement('div');
    t.className = 'toast ' + (cls || ''); t.innerHTML = text;
    $('toast').appendChild(t);
    setTimeout(() => t.remove(), 3800);
  };
  UI.modal = function (html) { const m = $('modal'); m.innerHTML = html; m.hidden = false; };
  UI.closeModal = function () { const m = $('modal'); m.hidden = true; m.innerHTML = ''; };
  UI.confirm = function (title, text, okLabel, act) {
    UI.modal('<div class="dialog"><h2>' + title + '</h2><div>' + text + '</div><div class="btns"><button class="btn red" data-act="' + act + '">' + okLabel + '</button><button class="btn" data-act="closeModal">CANCEL</button></div></div>');
  };

  function statBlock(h, up) {
    return '<div class="stats"><span>❤️ ' + H.stat(h, up, 'hp') + ' HP</span><span>⚔️ ' + H.stat(h, up, 'dmg') + ' DMG</span><span>🎯 ' + h.rangeLabel + ' Range</span><span>⏱️ ' + H.stat(h, up, 'cd').toFixed(1) + 's</span></div>';
  }
  function fullCard(h, extra, cls) {
    const unlocked = S().isUnlocked(h.id), up = S().upgrades(h.id);
    return '<div class="card ' + (unlocked ? '' : 'locked') + ' ' + (cls || '') + '" data-id="' + h.id + '">' +
      '<span class="tag ' + (unlocked ? '' : 'lock') + '">' + (unlocked ? 'OWNED' : '🪙 ' + h.price) + '</span>' +
      '<h3>' + h.name + '</h3><div class="portrait"><img src="' + H.asset('assets/' + h.id + '.png') + '" alt="' + h.name + '"></div>' +
      '<div class="role">' + h.icon + ' ' + h.role + '</div><div class="cost">' + h.cost + ' ⚡</div>' + statBlock(h, up) +
      '<div class="ability">✨ ' + h.ability + '</div><div class="desc">"' + h.desc + '"</div>' + (extra || '') + '</div>';
  }

  UI.show = function (name, arg) {
    UI.current = name;
    $('battle').hidden = true;
    UI.closeModal();
    const el = $('screen');
    el.hidden = false; el.style.display = '';
    el.className = 'screen';
    const fn = UI['screen_' + name];
    el.innerHTML = fn.call(UI, arg || {});
    el.scrollTop = 0;
    if (UI['after_' + name]) UI['after_' + name](arg || {});
    H.Music.play('menu');
  };
  UI.hideScreen = function () { $('screen').style.display = 'none'; };

  const back = (to) => '<button class="btn small" data-act="' + (to || 'menu') + '">◀ BACK</button>';

  UI.screen_menu = function () {
    const d = S().data;
    return '<div class="wrap"><h1 class="title">HUMANS<span class="vs">VS</span>ALIENS</h1><div class="subtitle">DEFEND EARTH. ONE LANE AT A TIME.</div>' +
      '<div class="menu"><button class="btn play" data-act="play">▶ PLAY</button><button class="btn" data-act="humans">🛒 SHOP</button><button class="btn" data-act="aliens">👽 ALIENS</button><button class="btn" data-act="sandbox">🧪 SANDBOX</button>' +
      '<button class="btn" data-act="upgrades">🔧 UPGRADES</button><button class="btn" data-act="achievements">🏆 ACHIEVEMENTS</button><button class="btn" data-act="settings">⚙ SETTINGS</button></div>' +
      '<a class="itch-link" href="https://cricketlover.itch.io/humans-vs-aliens" target="_blank" rel="noopener">🎮 PLAY ON ITCH.IO</a>' +
      '<div class="menu-foot"><span class="pill">RANK LV ' + playerLevel() + '</span><span class="pill">★ ' + totalStars() + ' / ' + H.LEVELS.length * 3 + '</span><span class="pill">🔧 ' + d.tech + ' TECH</span><span class="pill">🪙 ' + d.coins + '</span></div></div>';
  };

  UI.screen_levels = function (arg) {
    if (arg.world) UI.world = arg.world;
    const w = H.WORLDS[UI.world - 1];
    let tabs = '';
    H.WORLDS.forEach(x => {
      const open = S().levelOpen((x.id - 1) * 5);
      tabs += '<button class="tab ' + (x.id === UI.world ? 'on' : '') + '" data-act="world" data-w="' + x.id + '" ' + (open ? '' : 'disabled') + '>' + (open ? '' : '🔒 ') + 'WORLD ' + x.id + '</button>';
    });
    let nodes = '';
    for (let l = 1; l <= 5; l++) {
      const i = (UI.world - 1) * 5 + l - 1, open = S().levelOpen(i), done = S().levelDone(i), st = S().data.stars[i] || 0;
      nodes += '<button class="lvl ' + (l === 5 ? 'boss ' : '') + (done ? 'done' : '') + '" data-act="level" data-i="' + i + '" ' + (open ? '' : 'disabled') + '>' +
        (open ? (l === 5 ? '👑' : '') + UI.world + '-' + l : '🔒') + '<span class="stars">' + stars(st) + '</span><small>' + (l === 5 ? 'BOSS' : 'LEVEL ' + (i + 1)) + '</small></button>';
    }
    const chips = w.pool.concat([w.boss]).filter((v, i, a) => a.indexOf(v) === i).map(t => alienChip(t)).join('');
    return '<div class="wrap"><div class="page-head">' + back() + '<h2>SELECT MISSION</h2><span class="pill">🔧 ' + S().data.tech + '</span></div>' +
      '<div class="tabs">' + tabs + '</div><div class="panel"><h2 style="margin:0 0 8px;color:var(--cy2);font-size:16px">WORLD ' + w.id + ' — ' + w.name + '</h2><div class="muted">' + w.blurb + '</div>' +
      '<div class="levels">' + nodes + '</div>' +
      '<div class="muted">BOSS: ' + (w.boss === 'mothership' ? 'THE MOTHERSHIP' : H.ALIENS[w.boss].name) + '</div><div class="alien-strip">' + chips + '</div></div></div>';
  };
  function alienChip(t) {
    return '<div class="alien-chip"><img src="' + H.Sprites.alienURL(t) + '" alt=""><span>' + H.ALIENS[t].name.split(' ')[0] + '</span></div>';
  }

  function defaultPick() {
    let p = (S().data.selected || []).filter(id => S().isUnlocked(id));
    if (!p.length) p = S().data.unlocked.filter(id => H.HUMANS.some(h => h.id === id)).slice(0, 6);
    return p.slice(0, 6);
  }

  UI.screen_prebattle = function (arg) {
    if (arg.i != null) { UI.preLevel = arg.i; UI.picked = defaultPick(); }
    const level = H.LEVELS[UI.preLevel];
    const w = H.WORLDS[level.world - 1];
    const enemies = level.pool.concat(level.boss ? [level.boss] : []).filter((v, i, a) => a.indexOf(v) === i);
    if (level.boss === 'mothership') enemies.push('mothership');
    const cards = H.HUMANS.map(h => {
      const un = S().isUnlocked(h.id), on = UI.picked.includes(h.id);
      const btn = un ? '<button class="btn small ' + (on ? 'green' : '') + '" data-act="pick" data-id="' + h.id + '">' + (on ? '✔ SELECTED' : 'SELECT') + '</button>' : '<button class="btn small" data-act="humans">🛒 BUY IN SHOP</button>';
      return fullCard(h, btn, on ? 'sel' : '');
    }).join('');
    return '<div class="wrap"><div class="page-head">' + back('levels') + '<h2>LEVEL ' + level.world + '-' + level.level + (level.boss ? ' — BOSS' : '') + '</h2><span class="pill">' + w.name + '</span></div>' +
      '<div class="panel" style="margin-bottom:16px"><div class="muted">' + level.waves + ' WAVES · START WITH 250 ⚡' + (S().data.bonusEnergy ? ' + ' + S().data.bonusEnergy + ' BONUS' : '') + ' · PICK UP TO 6 HUMANS · ☢️ NUCLEAR REACTOR ALWAYS AVAILABLE</div><div class="alien-strip">' + enemies.map(alienChip).join('') + '</div></div>' +
      '<div class="page-head"><h2 style="font-size:13px">SELECT HUMANS (<span id="pickCount">' + UI.picked.length + '</span>/6)</h2><button class="btn play" id="startBtn" data-act="start" style="min-width:220px;font-size:14px" ' + (UI.picked.length ? '' : 'disabled') + '>▶ DEPLOY</button></div>' +
      '<div class="grid h-scroll">' + cards + '</div></div>';
  };

  function itemCard(d) {
    const owned = S().isUnlocked(d.id), can = S().data.coins >= d.price;
    const btn = owned ? '<button class="btn small" disabled>' + (d.id === 'reactor' ? 'STARTER · ALWAYS READY' : '✔ IN YOUR TRAY') + '</button>'
      : can ? '<button class="btn small green" data-act="buy" data-id="' + d.id + '">BUY · ' + d.price + ' 🪙</button>'
      : '<button class="btn small" disabled>NEED ' + d.price + ' 🪙</button>';
    return '<div class="card"><span class="tag ' + (owned ? '' : 'lock') + '">' + (owned ? 'OWNED' : '🪙 ' + d.price) + '</span><h3>' + d.name + '</h3><div class="portrait"><img src="' + H.Sprites.itemURL(d.id) + '" alt="' + d.name + '"></div>' +
      '<div class="role">' + d.icon + ' ' + d.role + '</div><div class="cost">' + d.cost + ' ⚡</div><div class="stats"><span>❤️ ' + d.hp + ' HP</span><span>' + d.tip + '</span></div>' +
      '<div class="ability">✨ ' + d.ability + '</div><div class="desc">"' + d.desc + '"</div>' + btn + '</div>';
  }

  UI.screen_humans = function () {
    const cards = H.HUMANS.map(h => {
      const un = S().isUnlocked(h.id), can = S().data.coins >= h.price;
      const btn = un ? '<button class="btn small" data-act="upgrades" data-h="' + h.id + '">🔧 UPGRADE</button>'
        : can ? '<button class="btn small green" data-act="buy" data-id="' + h.id + '">BUY · ' + h.price + ' 🪙</button>'
        : '<button class="btn small" disabled>NEED ' + h.price + ' 🪙</button>';
      return fullCard(h, btn);
    }).join('') + H.ITEMS.map(itemCard).join('');
    return '<div class="wrap"><div class="page-head">' + back() + '<h2>HUMAN SHOP</h2><span class="pill">🪙 ' + S().data.coins + ' COINS</span></div>' +
      '<div class="muted" style="margin-bottom:14px">Earn 🪙 Coins by completing levels. Buying a human adds them to your roster — you still spend ⚡ Energy in battle to place them.</div><div class="grid h-scroll">' + cards + '</div></div>';
  };

  UI.screen_aliens = function () {
    const order = ['slime', 'grunt', 'brute', 'bomber', 'trooper', 'scorpion', 'burrower', 'cactus', 'spitter', 'zapper', 'jet', 'hopper', 'astronaut', 'shade', 'shield', 'medic', 'spiker', 'golem', 'shard', 'brood', 'larva', 'mindsquid', 'juggernaut', 'commander', 'prime', 'mothership', 'frostling', 'icebat', 'snowmage', 'yeti', 'frosttitan', 'emberhound', 'magmaling', 'lavaslug', 'obsidian', 'magmawyrm', 'piranha', 'jelly', 'angler', 'shellback', 'kraken', 'voidling', 'gravitron', 'eclipse', 'starwyrm', 'voidtitan', 'vinelasher', 'sporecap', 'swamptoad', 'mossgolem', 'swamphydra', 'stormsprite', 'thunderbird', 'rocktroll', 'voltbeetle', 'stormcolossus', 'scarab', 'mummy', 'anubis', 'sarcophagus', 'pharaoh', 'nanoswarm', 'turretbot', 'hackerbot', 'tankbot', 'omegaprime'];
    const where = t => H.WORLDS.filter(w => w.pool.includes(t) || w.boss === t).map(w => w.id).join(', ') || '4';
    const cards = order.map(t => {
      const a = H.ALIENS[t];
      const hp = t === 'mothership' ? '5,000' : a.hp + (a.shield ? ' + ' + a.shield + ' 🛡️' : '');
      return '<div class="card"><h3>' + a.name + '</h3><div class="portrait"><img src="' + H.Sprites.alienURL(t) + '" alt="' + a.name + '"' + (t === 'mothership' ? ' style="max-height:60px"' : '') + '></div>' +
        '<div class="stats"><span>❤️ ' + hp + '</span><span>⚔️ ' + (a.dmg || '—') + ' DMG</span><span>👟 ' + (t === 'mothership' ? 'Hovers' : speedLabel(a.speed)) + '</span><span>🔩 ' + (a.armor || 0) + ' ARMOR</span><span>🌎 W' + where(t) + '</span></div>' +
        '<div class="ability">✨ ' + a.ability + '</div></div>';
    }).join('');
    return '<div class="wrap"><div class="page-head">' + back() + '<h2>ALIEN FILES</h2></div><div class="grid h-scroll">' + cards + '</div></div>';
  };

  const UROWS = ['dmg', 'hp', 'spd', 'rng', 'spc'];
  function upgVal(h, up, k) {
    const cd = () => H.stat(h, up, 'cd');
    if (k === 'dmg') return H.stat(h, up, 'dmg') + ' DMG';
    if (k === 'hp') return H.stat(h, up, 'hp') + ' HP';
    if (k === 'spd') return (1 / cd()).toFixed(2) + ' shots/s';
    if (k === 'rng') return (h.id === 'sam' ? H.stat(h, up, 'range') : H.stat(h, up, 'range')).toFixed(1) + ' tiles';
    return 'LV ' + ((up.spc || 0) + 1);
  }
  UI.screen_upgrades = function (arg) {
    if (arg.h && S().isUnlocked(arg.h)) UI.upgHuman = arg.h;
    if (!S().isUnlocked(UI.upgHuman)) UI.upgHuman = 'ryan';
    const h = H.HUMANS.find(x => x.id === UI.upgHuman), up = S().upgrades(h.id);
    const list = H.HUMANS.map(x => '<button class="upg-pick ' + (x.id === h.id ? 'on ' : '') + (S().isUnlocked(x.id) ? '' : 'locked') + '" data-act="pickUpg" data-h="' + x.id + '"><img src="' + H.asset('assets/' + x.id + '.png') + '" alt=""><span>' + x.name + '</span></button>').join('');
    const rows = UROWS.map(k => {
      const l = up[k] || 0, meta = H.UPG[k], max = l >= 4, cost = H.upgCost(l);
      const next = max ? null : upgVal(h, Object.assign({}, up, { [k]: l + 1 }), k);
      let pips = ''; for (let i = 0; i < 5; i++) pips += '<i class="' + (i <= l ? 'on' : '') + '"></i>';
      const can = !max && S().data.tech >= cost;
      return '<div class="urow"><div style="font-size:22px">' + meta.icon + '</div><div class="n">' + meta.name + ' — LEVEL ' + (l + 1) + '/5<div class="pips">' + pips + '</div>' +
        '<div class="v" style="margin-top:6px">' + upgVal(h, up, k) + (max ? ' · MAX' : ' → ' + next) + '</div>' + (k === 'spc' ? '<div class="muted" style="font-size:8px">' + H.specialText[h.id] + '</div>' : '') + '</div>' +
        '<button class="btn small ' + (can ? 'green' : '') + '" data-act="upg" data-k="' + k + '" ' + (can ? '' : 'disabled') + '>' + (max ? 'MAX' : '⬆ ' + cost + ' 🔧') + '</button></div>';
    }).join('');
    return '<div class="wrap"><div class="page-head">' + back() + '<h2>UPGRADES</h2><span class="pill">🔧 ' + S().data.tech + ' TECH POINTS</span></div>' +
      '<div class="upg"><div class="upg-list panel">' + list + '</div><div class="panel"><div style="display:flex;gap:16px;align-items:flex-end;margin-bottom:8px"><img src="' + H.asset('assets/' + h.id + '.png') + '" style="height:110px" alt=""><div><div style="color:var(--yel);font-size:14px;margin-bottom:8px">' + h.name + '</div><div class="muted">' + h.role + '</div></div></div>' + rows + '</div></div></div>';
  };

  UI.screen_achievements = function () {
    const d = S().data;
    const prog = {
      first: Object.keys(d.completed).length + ' / 1', buster: Math.min(d.stats.kills, 100) + ' / 100', squad: Math.min(d.unlocked.filter(id => H.HUMANS.some(h => h.id === id)).length, 5) + ' / 5',
      hoarder: Math.min(d.stats.energy, 1000) + ' / 1000', boss: Math.min(d.stats.bosses, 1) + ' / 1', saved: (S().worldDone(1) ? 5 : [1, 2, 3, 4, 5].filter(l => d.completed[l - 1]).length) + ' / 5'
    };
    const list = H.ACHIEVEMENTS.map(a => {
      const got = d.achievements[a.id];
      return '<div class="ach ' + (got ? '' : 'locked') + '"><div class="ic">' + (got ? a.icon : '🔒') + '</div><div><b>' + a.name + '</b>' + a.desc + '</div><div class="st">' + (got ? '✔ DONE' : prog[a.id]) + '</div></div>';
    }).join('');
    return '<div class="wrap"><div class="page-head">' + back() + '<h2>ACHIEVEMENTS</h2><span class="pill">' + Object.keys(d.achievements).length + ' / 6</span></div>' + list + '</div>';
  };

  UI.screen_settings = function () {
    const s = S().data.settings;
    const tog = (k, label) => '<div class="row"><span>' + label + '</span><button class="btn small toggle ' + (s[k] ? 'green' : 'red') + '" data-act="set" data-k="' + k + '">' + (s[k] ? 'ON' : 'OFF') + '</button></div>';
    return '<div class="wrap"><div class="page-head">' + back() + '<h2>SETTINGS</h2></div><div class="panel">' + tog('sfx', '🔊 SOUND EFFECTS') +
      '<div class="row"><span>🔉 SFX VOLUME</span><input type="range" min="0" max="100" value="' + Math.round(s.volume * 100) + '" id="volRange"></div>' +
      tog('music', '🎵 MUSIC') +
      '<div class="row"><span>🎶 MUSIC VOLUME</span><input type="range" min="0" max="100" value="' + Math.round(s.musicVol * 100) + '" id="musicRange"></div>' +
      tog('shake', '📳 SCREEN SHAKE') + tog('dmgNumbers', '💬 DAMAGE NUMBERS') +
      '<div class="row"><span>⚠️ ERASE ALL PROGRESS</span><button class="btn small red" data-act="reset">RESET PROGRESS</button></div></div></div>';
  };

  UI.startBattle = function () {
    const level = H.LEVELS[UI.preLevel];
    if (!UI.picked.length) return;
    S().data.selected = UI.picked.slice();
    S().save();
    UI.hideScreen();
    H.Sound.wave();
    H.Hud.begin(level, UI.picked);
  };

  UI.finishBattle = function (level, r) {
    const d = S().data, i = level.idx - 1;
    d.stats.kills += r.kills; d.stats.energy += r.energy;
    let html;
    if (r.won) {
      const first = !d.completed[i];
      d.completed[i] = true; d.stars[i] = Math.max(d.stars[i] || 0, r.stars);
      const bonus = 50 + r.stars * 25, tech = (first ? 3 : 1) + r.stars + (level.boss && first ? 3 : 0), xp = 40 + r.stars * 20 + level.idx * 5 + (level.boss ? 100 : 0);
      d.bonusEnergy = (d.bonusEnergy || 0) + bonus; d.tech += tech; d.xp += xp;
      if (r.boss) d.stats.bosses++;
      const coins = 60 + r.stars * 40 + r.kills * 2 + (level.boss ? 150 : 0); d.coins += coins;
      const ach = S().checkAchievements();
      S().save();
      ach.forEach((id, n) => setTimeout(() => UI.toast('🏆 ACHIEVEMENT: ' + H.ACHIEVEMENTS.find(a => a.id === id).name, 'ach-t'), 600 + n * 900));
      const nextIdx = i + 1, hasNext = nextIdx < H.LEVELS.length;
      const worldDone = level.level === 5;
      html = '<div class="dialog"><h2 class="win">' + (level.idx === H.LEVELS.length ? 'THE UNIVERSE IS SAVED!' : level.idx === 40 ? 'THE GALAXY IS SAVED!' : level.idx === 20 ? 'EARTH IS SAVED!' : worldDone ? 'WORLD ' + level.world + ' CLEARED!' : 'VICTORY!') + '</h2>' +
        '<div class="big-stars">' + [1, 2, 3].map(n => '<span style="animation-delay:' + (n * 0.35) + 's" class="' + (n <= r.stars ? 'star-on' : 'star-off') + '">★</span>').join('') + '</div>' +
        '<div class="rewards"><div>⚡ BONUS ENERGY<b>+' + bonus + '</b><span class="muted" style="font-size:7px">next level head start</span></div><div>🔧 TECH POINTS<b>+' + tech + '</b></div><div>🪙 COINS<b>+' + coins + '</b></div><div>⭐ XP<b>+' + xp + '</b></div><div>👽 ALIENS DEFEATED<b>' + r.kills + '</b></div></div>' +
        '<div class="btns">' + (hasNext ? '<button class="btn play" data-act="next">NEXT LEVEL ▶</button>' : '') + '<button class="btn" data-act="retry">↻ RETRY</button><button class="btn" data-act="humans">🛒 SHOP</button><button class="btn" data-act="upgrades">🔧 UPGRADES</button><button class="btn" data-act="tolevels">MAP</button>' + H.Install.button() + '</div></div>';
    } else {
      const dCoins = Math.floor(r.kills * 1.5); d.coins += dCoins;
      const ach = S().checkAchievements();
      S().save();
      ach.forEach((id, n) => setTimeout(() => UI.toast('🏆 ACHIEVEMENT: ' + H.ACHIEVEMENTS.find(a => a.id === id).name, 'ach-t'), 600 + n * 900));
      html = '<div class="dialog"><h2 class="lose">DEFEAT</h2><div>The aliens broke through. Earth needs you, commander.</div>' +
        '<div class="rewards"><div>👽 ALIENS DEFEATED<b>' + r.kills + '</b></div><div>⚡ ENERGY COLLECTED<b>' + r.energy + '</b></div><div>🪙 COINS<b>+' + dCoins + '</b></div></div>' +
        '<div class="btns"><button class="btn play" data-act="retry">↻ TRY AGAIN</button><button class="btn" data-act="humans">🛒 SHOP</button><button class="btn" data-act="tolevels">MAP</button>' + H.Install.button() + '</div></div>';
    }
    UI.lastLevel = level;
    UI.lastIds = H.Hud.ids.slice();
    UI.modal(html);
  };

  UI.handle = function (act, el) {
    switch (act) {
      case 'menu': UI.show('menu'); break;
      case 'play': UI.show('levels', {}); break;
      case 'sandbox': UI.hideScreen(); H.Hud.beginSandbox(1); break;
      case 'levels': UI.show('levels', {}); break;
      case 'humans': UI.show('humans'); break;
      case 'aliens': UI.show('aliens'); break;
      case 'upgrades': UI.show('upgrades', { h: el.dataset.h }); break;
      case 'achievements': UI.show('achievements'); break;
      case 'settings': UI.show('settings'); break;
      case 'world': UI.show('levels', { world: +el.dataset.w }); break;
      case 'level': UI.show('prebattle', { i: +el.dataset.i }); break;
      case 'pick': {
        const id = el.dataset.id, k = UI.picked.indexOf(id);
        if (k >= 0) UI.picked.splice(k, 1);
        else if (UI.picked.length < 6) UI.picked.push(id);
        else { UI.toast('MAX 6 HUMANS PER MISSION'); H.Sound.deny(); return; }
        const sc = $('screen').scrollTop, hs = document.querySelector('.grid.h-scroll'), hx = hs ? hs.scrollLeft : 0;
        UI.show('prebattle', {});
        $('screen').scrollTop = sc; const g2 = document.querySelector('.grid.h-scroll'); if (g2) g2.scrollLeft = hx;
        break;
      }
      case 'start': UI.startBattle(); break;
      case 'pickUpg': UI.show('upgrades', { h: el.dataset.h }); break;
      case 'upg': {
        const id = UI.upgHuman, k = el.dataset.k, up = S().data.upgrades[id] || (S().data.upgrades[id] = {});
        const l = up[k] || 0, cost = H.upgCost(l);
        if (l >= 4 || S().data.tech < cost) { H.Sound.deny(); return; }
        S().data.tech -= cost; up[k] = l + 1; S().save(); H.Sound.buy();
        const sc = $('screen').scrollTop; UI.show('upgrades', {}); $('screen').scrollTop = sc;
        break;
      }
      case 'set': {
        const k = el.dataset.k; S().data.settings[k] = !S().data.settings[k]; S().save(); if (k === 'music') H.Music.applySettings();
        const sc = $('screen').scrollTop; UI.show('settings'); $('screen').scrollTop = sc; break;
      }
      case 'reset': UI.confirm('RESET PROGRESS?', 'This erases all levels, stars, purchases, coins, upgrades, Tech Points and achievements. This cannot be undone.', 'YES, ERASE', 'resetYes'); break;
      case 'resetYes': S().reset(); S().save(); UI.closeModal(); UI.toast('PROGRESS RESET'); UI.show('settings'); break;
      case 'buy': {
        const id = el.dataset.id, h = H.defOf(id);
        if (!S().buy(id)) { H.Sound.deny(); return; }
        const ach = S().checkAchievements();
        S().save(); H.Sound.buy();
        UI.toast('🛒 BOUGHT ' + h.name + '!');
        ach.forEach((aid, n) => setTimeout(() => UI.toast('🏆 ACHIEVEMENT: ' + H.ACHIEVEMENTS.find(a => a.id === aid).name, 'ach-t'), 700 + n * 900));
        const sc = $('screen').scrollTop, hs = document.querySelector('.grid.h-scroll'), hx = hs ? hs.scrollLeft : 0;
        UI.show('humans');
        $('screen').scrollTop = sc; const g2 = document.querySelector('.grid.h-scroll'); if (g2) g2.scrollLeft = hx;
        break;
      }
      case 'install': H.Install.run(); break;
      case 'closeModal': UI.closeModal(); break;
      case 'next': { const n = UI.lastLevel.idx; UI.closeModal(); H.Hud.stop(); UI.show('prebattle', { i: n }); break; }
      case 'retry': { const l = UI.lastLevel, ids = UI.lastIds; UI.closeModal(); if (ids && ids.length) { UI.hideScreen(); H.Hud.begin(l, ids); } else UI.show('levels', {}); break; }
      case 'tolevels': UI.closeModal(); H.Hud.stop(); UI.show('levels', { world: UI.lastLevel ? UI.lastLevel.world : 1 }); break;
      default: return false;
    }
    return true;
  };

  UI.init = function () {
    document.addEventListener('click', e => {
      const el = e.target.closest('[data-act]');
      if (!el || el.disabled) return;
      H.Sound.unlock();
      const act = el.dataset.act;
      if (H.Hud.act(act)) return;
      H.Sound.click();
      UI.handle(act, el);
    });
    document.addEventListener('input', e => {
      if (e.target.id === 'volRange') { S().data.settings.volume = +e.target.value / 100; S().save(); H.Sound.click(); }
      if (e.target.id === 'musicRange') { S().data.settings.musicVol = +e.target.value / 100; S().save(); H.Music.applySettings(); }
    });
  };
})(window.HVA);
