(function (H) {
  const LANGS = [
    { id: 'en', name: 'English' }, { id: 'es', name: 'Español' }, { id: 'fr', name: 'Français' }, { id: 'de', name: 'Deutsch' },
    { id: 'pt', name: 'Português' }, { id: 'it', name: 'Italiano' }, { id: 'ru', name: 'Русский' },
    { id: 'hi', name: 'हिन्दी' }, { id: 'mr', name: 'मराठी' }
  ];
  H.LANGS = LANGS;
  const I = H.I18N = { lang: 'en', dict: {}, pats: {}, seen: new Set(), record: false };
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const NUM = '(\\d+(?:[.,]\\d+)*)', STR = '(.+?)';

  function build() {
    const rows = H.LANG_ROWS || [];
    LANGS.forEach((L, ci) => {
      if (ci === 0) return;
      const d = {}, pats = [];
      rows.forEach(r => {
        const en = r[0], t = r[ci];
        if (!t) return;
        if (/\{[ns]\}/.test(en)) {
          const kinds = [];
          const src = esc(en).replace(/\\\{([ns])\\\}/g, (m, k) => { kinds.push(k); return k === 'n' ? NUM : STR; });
          pats.push([new RegExp('^' + src + '$'), t, kinds, en.length]);
        } else d[en] = t;
      });
      pats.sort((a, b) => b[3] - a[3]);
      I.dict[L.id] = d; I.pats[L.id] = pats;
    });
  }

  const SPLIT = / · | — /;
  const SPLITG = /( · | — )/;
  function trCore(c, lang) {
    const d = I.dict[lang];
    if (!d) return null;
    if (d[c] != null) return d[c];
    const pats = I.pats[lang];
    for (let i = 0; i < pats.length; i++) {
      const m = c.match(pats[i][0]);
      if (m) { let k = 0; return pats[i][1].replace(/\{[ns]\}/g, () => { const v = m[++k], kind = pats[i][2][k - 1]; return kind === 's' ? trText(v, lang) : v; }); }
    }
    const m2 = c.match(/^(.*?)\s+(\d[\d\-\s\/x×]*)$/);
    if (m2 && d[m2[1]] != null) return d[m2[1]] + ' ' + m2[2];
    if (SPLIT.test(c)) {
      const parts = c.split(SPLITG); let any = false;
      const rec = I.record; I.record = false;
      const out = parts.map((p, i) => { if (i % 2) return p; const t = trText(p, lang); if (t !== p) any = true; return t; });
      I.record = rec;
      if (any) return out.join('');
    }
    return null;
  }
  const RE = /^([^\p{L}\p{N}]*)([\s\S]*?)([^\p{L}\p{N}.!?…')]*)$/u;
  function trText(s, lang) {
    if (!s || lang === 'en') return s;
    const m = s.match(RE);
    if (!m || !m[2]) return s;
    const lead = m[1], core = m[2], tail = m[3];
    const t = trCore(core.trim(), lang);
    if (t == null) { if (I.record && /\p{L}/u.test(core)) I.seen.add(core.trim()); return s; }
    return lead + t + tail;
  }
  H.tr = function (s) { return trText(String(s), I.lang); };

  const nodes = new WeakMap();
  function fix(n) {
    let st = nodes.get(n);
    const cur = n.nodeValue;
    if (!st) { st = { en: cur, out: cur }; nodes.set(n, st); }
    else if (cur !== st.out) { st.en = cur; st.out = cur; }
    const t = I.lang === 'en' ? st.en : trText(st.en, I.lang);
    if (t !== cur) { st.out = t; n.nodeValue = t; }
  }
  function titles(root) {
    if (!root.querySelectorAll) return;
    root.querySelectorAll('[title]').forEach(e => { if (!e._tEn) e._tEn = e.title; e.title = trText(e._tEn, I.lang); });
  }
  function walk(root) {
    if (root.nodeType === 3) { fix(root); return; }
    if (root.nodeType !== 1) return;
    const tag = root.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'CANVAS') return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) fix(n);
    titles(root);
  }
  function start() {
    const app = document.getElementById('app') || document.body;
    walk(app);
    new MutationObserver(recs => {
      for (const r of recs) {
        if (r.type === 'characterData') fix(r.target);
        else r.addedNodes.forEach(n => walk(n));
      }
    }).observe(app, { childList: true, subtree: true, characterData: true });
  }

  H.chipName = function (t) {
    const w = H.tr(H.ALIENS[t].name).split(' ');
    return w[0].length <= 3 && w[1] ? w[1] : w[0];
  };

  I.set = function (id) {
    if (!I.dict[id] && id !== 'en') id = 'en';
    I.lang = id;
    H.Save.data.settings.lang = id;
    document.documentElement.lang = id;
    walk(document.getElementById('app') || document.body);
  };
  I.cycle = function () {
    const i = LANGS.findIndex(l => l.id === I.lang);
    I.set(LANGS[(i + 1) % LANGS.length].id);
    H.Save.save();
  };
  I.name = () => (LANGS.find(l => l.id === I.lang) || LANGS[0]).name;
  I.init = function () {
    build();
    let id = H.Save.data.settings.lang;
    if (!id) {
      const nav = ((navigator.languages && navigator.languages[0]) || navigator.language || 'en').slice(0, 2).toLowerCase();
      id = LANGS.some(l => l.id === nav) ? nav : 'en';
    }
    I.lang = LANGS.some(l => l.id === id) ? id : 'en';
    document.documentElement.lang = I.lang;
    start();
    if (H.Battle) {
      const od = H.Battle.prototype.drawText;
      H.Battle.prototype.drawText = function (ctx, text, ...rest) { return od.call(this, ctx, H.tr(text), ...rest); };
    }
  };
})(window.HVA);
