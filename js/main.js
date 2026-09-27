(function (H) {
  const menuCanvas = document.getElementById('menuBg');
  const mctx = menuCanvas.getContext('2d');
  let last = 0;

  function sizeMenu() {
    menuCanvas.width = window.innerWidth; menuCanvas.height = window.innerHeight;
    mctx.imageSmoothingEnabled = false;
  }

  function drawSquad(W, Hh) {
    const F = H.Sprites.frames;
    if (!F || Hh < 620) return;
    const sc = W > 1500 ? 3 : W > 760 ? 2 : 1;
    const ids = H.HUMANS.map(h => h.id);
    const total = ids.reduce((s, id) => s + F[id].w * sc * 0.75, 0);
    let x = (W - total) / 2;
    const t = H.MenuScene.t;
    ids.forEach((id, i) => {
      const f = F[id], fr = f.idle[Math.floor(t * 4 + i) % 4];
      const w = f.w * sc, hh = f.h * sc;
      mctx.fillStyle = 'rgba(0,0,0,.35)'; mctx.fillRect(Math.round(x + w * 0.2), Hh - 30, Math.round(w * 0.6), 8);
      mctx.drawImage(fr, Math.round(x), Hh - 26 - hh, w, hh);
      x += f.w * sc * 0.75;
    });
  }

  function frame(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016);
    last = ts;
    const b = H.Hud.battle;
    if (b) {
      if (b.paused || b.state !== 'running') b.update(dt);
      else b.update(dt);
      b.render();
      H.Hud.tickCards();
    } else {
      H.MenuScene.update(dt);
      mctx.clearRect(0, 0, menuCanvas.width, menuCanvas.height);
      H.MenuScene.draw(mctx, menuCanvas.width, menuCanvas.height);
      drawSquad(menuCanvas.width, menuCanvas.height);
    }
    requestAnimationFrame(frame);
  }

  function boot() {
    H.Save.load();
    sizeMenu();
    window.addEventListener('resize', sizeMenu);
    H.MenuScene.init();
    H.UI.init();
    H.Hud.init();
    H.I18N.init();
    const fontReady = document.fonts && document.fonts.load ? document.fonts.load("12px 'Press Start 2P'") : Promise.resolve();
    H.Sprites.load(() => {
      fontReady.catch(() => {}).then(() => {
        requestAnimationFrame(frame);
        H.Intro.play(() => H.UI.show('menu'));
      });
    });
  }
  window.addEventListener('DOMContentLoaded', boot);
  if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
})(window.HVA);
