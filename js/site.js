/**
 * site.js: progressive enhancement for the static page.
 * Everything here is optional; the prerendered HTML works without it.
 */
(function () {
  'use strict';

  const $  = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const main = $('#main');

  /* ── Stale-HTML fallback ───────────────────────────────────────────── */
  // If content.js changed but tools/render.mjs wasn't re-run, render from data so the site is never out of date
  if (window.SITE && window.SiteRender && main.dataset.contentHash !== SiteRender.hash(SITE)) {
    console.warn('[site] index.html is out of date with js/content.js. Run: node tools/render.mjs');
    main.innerHTML = SiteRender.main(SITE, []);
    $('#nav-menu').innerHTML = SiteRender.nav(0);
  }

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
  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      links.forEach(a => a.removeAttribute('aria-current'));
      const a = links.get(en.target.id);
      if (a) a.setAttribute('aria-current', 'true');
    });
  }, { rootMargin: '-40% 0px -55% 0px' });                 // a thin band near mid-screen = "the section you're reading"
  $$('main > section[id]').forEach(s => spy.observe(s));
  $('#top') && new IntersectionObserver(([en]) => {
    if (en.isIntersecting) links.forEach(a => a.removeAttribute('aria-current'));   // hero has no nav item
  }, { rootMargin: '-40% 0px -55% 0px' }).observe($('#top'));

  /* ── Deep links: #projects, #projects/gcid ─────────────────────────── */
  function followHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    if (id === '3d') { open3D(); return; }
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView();                                     // native jump can miss after a stale re-render
    if (el.tagName !== 'SECTION') {                          // move focus so screen readers land on the card
      el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
    }
  }
  window.addEventListener('hashchange', followHash);

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
      const sec = $('#certificates'), ul = $('[data-certs]');
      if (sec && ul) {
        ul.innerHTML = SiteRender.certificateItems(verified);
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
    'js/3d/scene-data.js',
    'js/3d/solar-system.js',
    'js/3d/particles.js',
    'js/3d/camera.js',
    'js/3d/ui.js',
    'js/3d/interactions.js',
    'js/3d/main.js'
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

  function open3D() {
    if (!hasWebGL || dialog.open) return;
    setMenu(false);
    dialog.showModal();
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

  if (hasWebGL) {
    $$('[data-open-3d]').forEach(b => { b.hidden = false; b.addEventListener('click', open3D); });
  }
  $('[data-space-exit]', dialog).addEventListener('click', () => dialog.close());
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
