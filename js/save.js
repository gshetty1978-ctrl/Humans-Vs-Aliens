(function (H) {
  const KEY = 'humans_vs_aliens_save_v1';
  const def = () => ({
    bonusEnergy: 0, coins: 100, completed: {}, stars: {}, unlocked: ['ryan', 'lucy'], upgrades: {}, tech: 0, xp: 0,
    achievements: {}, stats: { kills: 0, energy: 0, bosses: 0 },
    settings: { sfx: true, volume: 0.6, music: true, musicVol: 0.6, shake: true, dmgNumbers: true }, selected: ['ryan', 'lucy']
  });
  function merge(a, b) {
    for (const k in b) {
      if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object') merge(a[k], b[k]);
      else a[k] = b[k];
    }
    return a;
  }
  H.Save = {
    data: def(),
    load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) this.data = merge(def(), JSON.parse(raw));
      } catch (e) { this.data = def(); }
      return this.data;
    },
    save() { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) {} },
    reset() { try { localStorage.removeItem(KEY); } catch (e) {} this.data = def(); },
    isUnlocked(id) { return id === 'reactor' || this.data.unlocked.includes(id); },
    levelDone(idx) { return !!this.data.completed[idx]; },
    levelOpen(idx) { return idx === 0 || !!this.data.completed[idx - 1]; },
    worldDone(w) { for (let l = 1; l <= 5; l++) if (!this.data.completed[(w - 1) * 5 + l - 1]) return false; return true; },
    upgrades(id) { return this.data.upgrades[id] || {}; },
    buy(id) {
      const h = H.defOf(id);
      if (!h || h.price == null || this.isUnlocked(id) || this.data.coins < h.price) return false;
      this.data.coins -= h.price;
      this.data.unlocked.push(id);
      return true;
    },
    checkAchievements() {
      const d = this.data, out = [], a = d.achievements;
      const give = id => { if (!a[id]) { a[id] = true; out.push(id); } };
      if (Object.keys(d.completed).length >= 1) give('first');
      if (d.stats.kills >= 100) give('buster');
      if (d.unlocked.filter(id => H.HUMANS.some(h => h.id === id)).length >= 5) give('squad');
      if (d.stats.energy >= 1000) give('hoarder');
      if (d.stats.bosses >= 1) give('boss');
      if (this.worldDone(1)) give('saved');
      return out;
    }
  };
})(window.HVA);
