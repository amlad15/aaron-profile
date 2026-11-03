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

  /* ── Background scene: built after first paint so it can never delay content ── */
  (function bootScene() {
    const canvas = $('.scene');
    if (!canvas) return;
    let gl2 = false;
    try { gl2 = !!document.createElement('canvas').getContext('webgl2'); } catch (_) {}
    if (!gl2) return;                                        // current three.js needs WebGL2; the CSS starfield stays
    const go = () => import('./scene/scene.js')
      .then(m => m.start({ canvas, isChart: () => currentTheme() === 'light' }))
      .catch(err => console.warn('[scene] not started:', err && err.message));   // the page is complete without it
    // Decorative, so it waits for the visitor's first interaction after load. Until then the static CSS starfield
    // carries the first impression; no WebGL work competes with loading, and devices that never interact never pay for it.
    let started = false;
    const EVENTS = ['scroll', 'pointerdown', 'pointermove', 'keydown', 'touchstart', 'wheel'];
    const once = () => {
      if (started) return;
      started = true;
      EVENTS.forEach(e => removeEventListener(e, once));
      window.requestIdleCallback ? requestIdleCallback(go, { timeout: 500 }) : setTimeout(go, 50);   // let the interaction's own frame paint first
    };
    const arm = () => EVENTS.forEach(e => addEventListener(e, once, { passive: true }));
    if (document.readyState === 'complete') arm(); else addEventListener('load', arm, { once: true });
  }());

  if (location.hash) followHash();
}());
