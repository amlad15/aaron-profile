/**
 * ui.js: DOM side of 3D mode: section list, clickable labels and the detail panel.
 * One generic panel layout replaces the old per-planet builders; scene-data.js
 * shapes every item into { kicker, title, subtitle, meta, text, bullets, tags, links, page }.
 */

class SpaceUI {

  constructor(root, scene, handlers) {
    this.root     = root;
    this.scene    = scene;
    this.h        = handlers;                                // { sun, planet, moon, overview }
    this.list     = root.querySelector('#space-list');
    this.panel    = root.querySelector('#space-panel');
    this.body     = root.querySelector('#space-panel-body');
    this.overview = root.querySelector('[data-space-overview]');
    this.labels   = root.querySelector('#space-labels');

    this.panel.querySelector('[data-space-close]').addEventListener('click', () => this.hidePanel());
    this.overview.addEventListener('click', () => this.h.overview());
    this.list.addEventListener('click', e => this._route(e.target.closest('button[data-act]')));
    this.labels.addEventListener('click', e => this._route(e.target.closest('button[data-act]')));

    this.renderList(null);
  }

  static hex(n) { return '#' + n.toString(16).padStart(6, '0'); }

  _esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  _route(btn) {
    if (!btn) return;
    const { act, id, planet } = btn.dataset;
    if (act === 'sun')    this.h.sun();
    if (act === 'planet') this.h.planet(id);
    if (act === 'moon')   this.h.moon(id, planet);
  }

  /* ── Section list: overview shows sections, focus shows that section's items ── */
  renderList(focusedId) {
    const hadFocus = this.list.contains(document.activeElement) || this.overview.contains(document.activeElement);
    this._renderList(focusedId);
    if (hadFocus) this.list.querySelector('button').focus();  // the focused button was just replaced; don't drop focus to <body>
  }

  _renderList(focusedId) {
    const esc = s => this._esc(s);
    const p = focusedId && this.scene.planets.find(pl => pl.id === focusedId);
    this.overview.hidden = !p;
    if (!p) {
      this.list.innerHTML =
        `<li><button type="button" data-act="sun" style="--c:#F5B544"><span class="dot" aria-hidden="true"></span>About <span class="hint">the sun</span></button></li>` +
        this.scene.planets.map(pl =>
          `<li><button type="button" data-act="planet" data-id="${esc(pl.id)}" style="--c:${SpaceUI.hex(pl.color)}">` +
          `<span class="dot" aria-hidden="true"></span>${esc(pl.label)} <span class="hint">${pl.moons.length}</span></button></li>`).join('');
      return;
    }
    this.list.innerHTML =
      `<li class="space-list-head" style="--c:${SpaceUI.hex(p.color)}"><span class="dot" aria-hidden="true"></span>${esc(p.label)}</li>` +
      p.moons.map(m =>
        `<li><button type="button" data-act="moon" data-id="${esc(m.id)}" data-planet="${esc(p.id)}" style="--c:${SpaceUI.hex(p.color)}">${esc(m.title)}</button></li>`).join('');
  }

  /* ── Detail panel ───────────────────────────────────────────────────── */
  showPanel(d, color) {
    const esc = s => this._esc(s);
    const link = l => l.external
      ? `<a class="space-link" href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)} <span class="sr">(opens in new tab)</span><span aria-hidden="true">↗</span></a>`
      : `<a class="space-link" href="${esc(l.href)}">${esc(l.label)}</a>`;
    this.panel.style.setProperty('--c', color);
    this.body.innerHTML = `
      <p class="space-kicker">${esc(d.kicker)}</p>
      <h2 tabindex="-1">${esc(d.title)}</h2>
      ${d.subtitle ? `<p class="space-sub">${esc(d.subtitle)}</p>` : ''}
      ${d.meta ? `<p class="space-meta">${esc(d.meta)}</p>` : ''}
      ${(d.text || []).map(t => `<p>${esc(t)}</p>`).join('')}
      ${d.bullets && d.bullets.length ? `<ul class="space-bullets">${d.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
      ${d.tags && d.tags.length ? `<ul class="space-tags">${d.tags.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
      ${d.links && d.links.length ? `<div class="space-links">${d.links.map(link).join('')}</div>` : ''}
      ${d.page ? `<a class="space-page" href="${esc(d.page)}">View on the page →</a>` : ''}`;
    this.panel.hidden = false;
    this.panel.scrollTop = 0;
    this.body.querySelector('h2').focus({ preventScroll: true });   // keyboard and screen-reader users land on the new content
  }

  hidePanel() {
    if (this.panel.hidden) return;
    const hadFocus = this.panel.contains(document.activeElement);
    this.panel.hidden = true;
    if (hadFocus) (this.list.querySelector('button') || this.root.querySelector('[data-space-exit]')).focus();  // don't strand focus on a hidden node
  }

  isPanelOpen() { return !this.panel.hidden; }

  /* ── Floating labels (mouse/touch targets; the list covers keyboard and AT) ── */
  makeLabel(text, color, data, isMoon) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'space-label' + (isMoon ? ' space-label--moon' : '');
    b.tabIndex = -1;                                         // duplicates the list; keep tab order short
    b.setAttribute('aria-hidden', 'true');
    b.style.setProperty('--c', color);
    b.textContent = text;
    Object.assign(b.dataset, data);
    this.labels.appendChild(b);
    return b;
  }
}
