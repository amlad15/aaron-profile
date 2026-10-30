/**
 * site.js: progressive enhancement for the static page.
 * Everything here is optional; the prerendered HTML works without it.
 */
(function () {
  'use strict';

  const $  = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const root = document.documentElement;
  const main = $('#main');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  /* ── Stale-HTML fallback ───────────────────────────────────────────── */
  // If content.js changed but tools/render.mjs wasn't re-run, render from data so the site is never out of date
  if (window.SITE && window.SiteRender && main.dataset.contentHash !== SiteRender.hash(SITE)) {
    console.warn('[site] index.html is out of date with js/content.js. Run: node tools/render.mjs');
    main.innerHTML = SiteRender.main(SITE, []);
    $('#nav-menu').innerHTML = SiteRender.nav(0);
  }

  /* ── Theme toggle ──────────────────────────────────────────────────── */
  const themeBtn = $('[data-theme-toggle]');
  const systemLight = matchMedia('(prefers-color-scheme: light)');
  const currentTheme = () => root.dataset.theme || (systemLight.matches ? 'light' : 'dark');
  function syncThemeBtn() {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    themeBtn.querySelector('.theme-toggle-label').textContent = next === 'light' ? 'Light' : 'Dark';
    themeBtn.setAttribute('aria-label', `Switch to ${next} theme`);   // label states the action, not the state
  }
  themeBtn.hidden = false;
  syncThemeBtn();
  themeBtn.addEventListener('click', () => {
    root.dataset.theme = currentTheme() === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch (_) {}   // private mode: still works for this visit
    syncThemeBtn();
  });
  systemLight.addEventListener('change', syncThemeBtn);

  /* ── Mobile menu ───────────────────────────────────────────────────── */
  const toggle = $('.menu-toggle'), menu = $('#nav-menu');
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
  }
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });   // jump + close in one tap
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });
  matchMedia('(min-width: 1024px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

  /* ── Active section in nav ─────────────────────────────────────────── */
  const links = new Map($$('#nav-menu a').map(a => [a.getAttribute('href').slice(1), a]));
  const band = { rootMargin: '-40% 0px -55% 0px' };          // a thin band near mid-screen = "the section you're reading"
  const spy = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    links.forEach(a => a.removeAttribute('aria-current'));
    const a = links.get(en.target.id);
    if (a) a.setAttribute('aria-current', 'true');
  }), band);
  $$('main > section[id]').forEach(s => spy.observe(s));

  /* ── Scroll reveal (staggered) ─────────────────────────────────────── */
  function armReveal() {
    if (reduced.matches || !('IntersectionObserver' in window)) return;
    const items = $$('[data-reveal]');
    items.forEach(el => {                                    // stagger by position among revealable siblings
      const sibs = $$(':scope > [data-reveal]', el.parentElement);
      el.style.setProperty('--i', Math.min(sibs.indexOf(el), 6));
    });
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      io.unobserve(en.target);                               // reveal once; no re-hiding on scroll back
    }), { rootMargin: '0px 0px -8% 0px' });
    const vh = innerHeight;
    items.forEach(el => {
      if (el.getBoundingClientRect().top < vh) el.classList.add('is-in');   // already on screen: never hide it
      else io.observe(el);
    });
    root.classList.add('reveal-ready');                      // only now can CSS hide anything
  }
  armReveal();

  /* ── Disclosures: smooth expand/collapse on top of native <details> ─── */
  function animateDetails(d, open) {
    const body = $('.disclose-body', d);
    d._target = open;                                        // remembered so a click mid-animation reverses it
    if (reduced.matches || !body || !body.animate) { d.open = open; return; }
    if (d._anim) d._anim.cancel();
    const from = d.open ? body.offsetHeight : 0;
    if (open) d.open = true;                                 // must be open to measure the target height
    const to = open ? body.scrollHeight : 0;
    d.classList.add('is-animating');
    d._anim = body.animate(
      [{ height: from + 'px', opacity: open ? 0 : 1 }, { height: to + 'px', opacity: open ? 1 : 0 }],
      { duration: Math.min(520, 260 + to * 0.35), easing: 'cubic-bezier(.22, 1, .36, 1)' });   // taller panels take a bit longer
    d._anim.onfinish = () => { if (!open) d.open = false; d._anim = null; d.classList.remove('is-animating'); };
  }
  document.addEventListener('click', e => {
    const summary = e.target.closest('details.disclose > summary');
    if (!summary || e.target.closest('a')) return;
    e.preventDefault();                                      // we drive open/close so it can animate
    const d = summary.parentElement;
    animateDetails(d, d._anim ? !d._target : !d.open);
  });

  /* ── Deep links: #projects, #projects/gcid, #experience/guidepost ──── */
  function followHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    if (id === '3d') { open3D(); return; }
    const el = document.getElementById(id);
    if (!el) return;
    $$('.is-highlighted').forEach(x => x.classList.remove('is-highlighted'));
    const d = el.matches('details') ? el : $('details', el);
    if (d && el.tagName !== 'SECTION') { d.open = true; el.classList.add('is-highlighted'); }   // a card link should show the card's detail
    el.classList.add('is-in');                               // never land on a still-hidden reveal
    el.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth' });
    if (el.tagName !== 'SECTION') {                          // move focus so screen readers land on the card
      el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
    }
  }
  window.addEventListener('hashchange', followHash);

  /* ── Hero starfield: slow drift, cheap, pauses off-screen ──────────── */
  (function starfield() {
    const canvas = $('.starfield');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    let stars = [], w = 0, h = 0, raf = 0, visible = true, last = 0;
    function size() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(220, w * h / 6500));      // density scales with area, capped for big screens
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() < .08 ? 1.3 : .6 + Math.random() * .5,
        z: .25 + Math.random() * .75,                         // depth: nearer stars drift faster and brighter
        tw: Math.random() * Math.PI * 2
      }));
    }
    function draw(t) {
      const rgb = getComputedStyle(root).getPropertyValue('--star').trim() || '236, 232, 223';
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const a = (.25 + .55 * s.z) * (.8 + .2 * Math.sin(t / 1400 + s.tw));
        ctx.fillStyle = `rgba(${rgb}, ${a.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
      }
    }
    function tick(t) {
      const dt = Math.min(64, t - (last || t)); last = t;
      for (const s of stars) { s.x -= s.z * dt * .006; if (s.x < -2) { s.x = w + 2; s.y = Math.random() * h; } }   // ~6px/s at full depth
      draw(t);
      raf = requestAnimationFrame(tick);
    }
    function run() {
      cancelAnimationFrame(raf); last = 0;
      if (reduced.matches) { draw(0); return; }               // static sky
      if (visible && !document.hidden) raf = requestAnimationFrame(tick);
    }
    size(); run();
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; run(); }).observe(canvas);
    document.addEventListener('visibilitychange', run);
    reduced.addEventListener('change', run);
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { size(); run(); }, 150); });
    new MutationObserver(() => { if (!raf || reduced.matches) draw(0); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });   // recolour a static sky on theme change
  }());

  /* SMIL ignores CSS media queries, so pause the hero orrery by hand */
  const orrery = $('.hero-orbit');
  const syncOrrery = () => orrery && orrery.pauseAnimations && (reduced.matches ? orrery.pauseAnimations() : orrery.unpauseAnimations());
  syncOrrery(); reduced.addEventListener('change', syncOrrery);

  /* ── Certificates: publish only real PDFs ──────────────────────────── */
  // The repo ships 52-byte text placeholders; a cert appears automatically once its file starts with %PDF-
  function isPdf(url) {
    return fetch(url, { headers: { Range: 'bytes=0-4' }, cache: 'no-cache' })
      .then(r => r.ok ? r.text() : '')
      .then(t => t.startsWith('%PDF-'))
      .catch(() => false);
  }
  const certsReady = (window.SITE ? Promise.all(SITE.certificates.map(c => isPdf(c.file).then(ok => ok && c))) : Promise.resolve([]))
    .then(list => {
      const verified = list.filter(Boolean);
      const sec = $('#certificates'), dl = $('[data-certs]');
      if (sec && dl) {
        dl.innerHTML = SiteRender.certificateItems(verified);
        sec.hidden = !verified.length;
        $$('[data-cert-nav]').forEach(li => { li.hidden = !verified.length; });
      }
      return verified;
    });

  /* ── 3D mode (loaded only when opened) ─────────────────────────────── */
  const dialog = $('#space');
  const hasWebGL = (() => {
    try { const c = document.createElement('canvas'); return !!(c.getContext('webgl') || c.getContext('experimental-webgl')); }
    catch (_) { return false; }
  })();

  const SCRIPTS_3D = [
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
    'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js',
    'https://cdnjs.cloudflare.com/ajax/libs/tween.js/18.6.4/tween.umd.js',
    'js/3d/scene-data.js', 'js/3d/solar-system.js', 'js/3d/particles.js',
    'js/3d/camera.js', 'js/3d/ui.js', 'js/3d/interactions.js', 'js/3d/main.js'
  ];
  let loading3D = null;

  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.async = false;                          // keep execution order
      s.onload = res; s.onerror = () => rej(new Error('Could not load ' + src));
      document.head.appendChild(s);
    });
  }
  function load3D() {
    if (loading3D) return loading3D;
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = 'css/3d.css';
    document.head.appendChild(css);
    loading3D = SCRIPTS_3D.reduce((p, src) => p.then(() => loadScript(src)), Promise.resolve());
    return loading3D;
  }

  // View Transitions where supported; plain swap otherwise or with reduced motion
  const transition = fn => (document.startViewTransition && !reduced.matches) ? document.startViewTransition(fn) : fn();

  function open3D() {
    if (!hasWebGL || dialog.open) return;
    setMenu(false);
    transition(() => dialog.showModal());
    const status = $('[data-space-status]', dialog);
    status.hidden = false;
    status.textContent = 'Loading 3D scene…';
    Promise.all([load3D(), certsReady])
      .then(([, certs]) => { window.Space.start(dialog, certs); status.hidden = true; })
      .catch(err => {
        console.error('[3d]', err);
        status.textContent = '3D mode could not load. Press Exit to return to the site.';
        loading3D = null;                                    // allow a retry next time
      });
  }
  const close3D = () => transition(() => dialog.close());

  if (hasWebGL) $$('[data-open-3d]').forEach(b => { b.hidden = false; b.addEventListener('click', open3D); });
  $('[data-space-exit]', dialog).addEventListener('click', close3D);
  dialog.addEventListener('close', () => {
    if (window.Space) window.Space.stop();                   // stop the render loop; nothing runs while closed
    if (location.hash === '#3d') history.replaceState(null, '', location.pathname + location.search);
  });

  // Links inside 3D that point at page sections: close the dialog first, then jump
  dialog.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    e.preventDefault();
    dialog.close();
    setTimeout(() => { location.hash = a.getAttribute('href'); followHash(); }, 0);  // after focus is restored to the opener
  });

  if (location.hash) followHash();
}());
