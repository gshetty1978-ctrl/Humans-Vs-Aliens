(function (H) {
  let deferred = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; });
  window.addEventListener('appinstalled', () => { deferred = null; });
  const web = () => /^https?:/.test(location.protocol);
  const standalone = () => (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  const ios = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const phone = () => ios() || /android/i.test(navigator.userAgent);

  H.Install = {
    available() { return web() && phone() && !standalone(); },
    button() { return this.available() ? '<button class="btn green" data-act="install">📲 ADD TO PHONE</button>' : ''; },
    run() {
      if (deferred) {
        const p = deferred; deferred = null;
        p.prompt();
        if (p.userChoice) p.userChoice.then(r => { if (r && r.outcome === 'accepted') H.UI.toast('📲 ADDED TO YOUR PHONE!'); });
        return;
      }
      if (navigator.share) {
        navigator.share({ title: 'Humans vs Aliens', url: location.href }).catch(() => {});
        H.UI.toast(ios() ? 'TAP "ADD TO HOME SCREEN" IN THE MENU' : 'CHOOSE "ADD TO HOME SCREEN"');
        return;
      }
      H.UI.toast(ios() ? 'TAP THE SHARE BUTTON, THEN "ADD TO HOME SCREEN"' : 'OPEN THE ⋮ MENU, THEN "ADD TO HOME SCREEN"');
    }
  };
})(window.HVA);
