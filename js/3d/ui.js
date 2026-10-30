/**
 * ui.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages all DOM-based UI: HUD labels, the sliding info panel, tooltip,
 * back button, and the loading screen dismissal.
 * The 3D canvas continues rendering behind all overlay elements.
 * ─────────────────────────────────────────────────────────────────────────────
 */

class UIController {

  constructor() {
    // Cache DOM element references once
    this._hudPlanetName  = document.getElementById('hud-planet-name');
    this._tooltip        = document.getElementById('tooltip');
    this._backBtn        = document.getElementById('back-btn');
    this._infoPanel      = document.getElementById('info-panel');
    this._panelClose     = document.getElementById('panel-close');
    this._panelImageWrap = document.getElementById('panel-image-container');
    this._loadingScreen  = document.getElementById('loading-screen');

    this._tooltipVisible = false;
    this._panelOpen      = false;

    this._injectPanelStyles();
    this._bindPanelClose();
  }

  /* ── Loading Screen ────────────────────────────────────────────────────── */

  dismissLoadingScreen() {
    if (!this._loadingScreen) return;
    setTimeout(() => {
      this._loadingScreen.classList.add('fade-out');
      setTimeout(() => {
        this._loadingScreen.style.display = 'none';
      }, 900);
    }, 600);
  }

  /* ── HUD ───────────────────────────────────────────────────────────────── */

  updateHUDPlanet(planetLabel, planetCategory) {
    if (!this._hudPlanetName) return;
    this._hudPlanetName.innerHTML =
      `<span class="hud-planet-label">${planetLabel}</span>` +
      `<span class="hud-planet-cat">${planetCategory}</span>`;
  }

  resetHUD() {
    if (!this._hudPlanetName) return;
    this._hudPlanetName.innerHTML = '';
  }

  /* ── Back Button ───────────────────────────────────────────────────────── */

  showBackButton(callback) {
    if (!this._backBtn) return;
    this._backBtn.classList.remove('hidden');
    this._backBtn.onclick = () => { callback(); };
  }

  hideBackButton() {
    if (!this._backBtn) return;
    this._backBtn.classList.add('hidden');
    this._backBtn.onclick = null;
  }

  /* ── Tooltip ───────────────────────────────────────────────────────────── */

  showTooltip(label, x, y) {
    if (!this._tooltip) return;
    this._tooltip.innerHTML     = label;
    this._tooltip.style.left    = `${x + 14}px`;
    this._tooltip.style.top     = `${y - 10}px`;
    this._tooltip.style.opacity = '1';
    this._tooltipVisible = true;
  }

  hideTooltip() {
    if (!this._tooltip || !this._tooltipVisible) return;
    this._tooltip.style.opacity = '0';
    this._tooltipVisible = false;
  }

  /* ── Info Panel ────────────────────────────────────────────────────────── */

  /**
   * Populates and slides the info panel in from the right.
   * Renders different layouts depending on the parent planet type.
   * @param {Object} moonData   - Moon data object from PORTFOLIO_DATA.
   * @param {Object} planetData - Parent planet data (for accent colour).
   */
  /**
   * Opens the About Me panel for the sun.
   * @param {Object} sunData - The sun data object from PORTFOLIO_DATA.
   */
  showSunPanel(sunData) {
    if (!this._infoPanel) return;

    const hex = '#ff8c00';
    this._infoPanel.style.borderLeftColor = hex;
    this._infoPanel.style.setProperty('--accent', hex);

    if (this._panelImageWrap) this._panelImageWrap.style.display = 'none';

    const content = document.getElementById('panel-content');
    if (content) {
      content.innerHTML = this._buildSunPanel(sunData, hex);
    }

    this._infoPanel.classList.remove('hidden');
    void this._infoPanel.offsetWidth;
    this._infoPanel.classList.add('open');
    this._panelOpen = true;
  }

  showInfoPanel(moonData, planetData) {
    if (!this._infoPanel) return;

    // Accent colour derived from planet
    const hex = planetData
      ? '#' + planetData.color.toString(16).padStart(6, '0')
      : '#00ff88';

    this._infoPanel.style.borderLeftColor = hex;
    this._infoPanel.style.setProperty('--accent', hex);

    // Hide image (no project images in current dataset)
    if (this._panelImageWrap) this._panelImageWrap.style.display = 'none';

    // Dynamically build content based on planet type
    const content = document.getElementById('panel-content');
    if (content) {
      content.innerHTML = this._buildPanelContent(moonData, planetData, hex);
    }

    // Slide in
    this._infoPanel.classList.remove('hidden');
    void this._infoPanel.offsetWidth; // force reflow for CSS transition
    this._infoPanel.classList.add('open');
    this._panelOpen = true;
  }

  /** Slides the info panel out and hides it. */
  hideInfoPanel() {
    if (!this._infoPanel || !this._panelOpen) return;
    this._infoPanel.classList.remove('open');
    this._panelOpen = false;
    setTimeout(() => {
      this._infoPanel.classList.add('hidden');
    }, 420);
  }

  /** @returns {boolean} Whether the info panel is currently open. */
  isPanelOpen() { return this._panelOpen; }

  /* ── Panel Content Builders ────────────────────────────────────────────── */

  /** SUN — About Me panel */
  _buildSunPanel(sun, hex) {
    const aboutParas = (sun.about || [])
      .map(p => `<p class="pi-about-para">${this._esc(p)}</p>`)
      .join('');

    return `
      <div class="pi-sun-header">
        <div class="pi-sun-orbit-badge" style="color:${hex};border-color:${hex}">THE CORE</div>
        <h1 class="pi-sun-name" style="color:${hex}">${this._esc(sun.fullName)}</h1>
        <p class="pi-sun-tagline">${this._esc(sun.tagline)}</p>
      </div>
      <div class="pi-about-divider" style="background:linear-gradient(90deg,${hex},transparent)"></div>
      <div class="pi-about-body">
        ${aboutParas}
      </div>
      <div class="pi-sun-links">
        ${sun.email    ? `<a class="pi-sun-chip" href="mailto:${this._esc(sun.email)}" style="--chip-color:${hex}">✉&nbsp; ${this._esc(sun.email)}</a>` : ''}
        ${sun.phone    ? `<span class="pi-sun-chip" style="--chip-color:${hex}">📞&nbsp; ${this._esc(sun.phone)}</span>` : ''}
        ${sun.linkedin ? `<a class="pi-sun-chip" href="${this._esc(sun.linkedin)}" target="_blank" rel="noopener noreferrer" style="--chip-color:${hex}">in&nbsp; LinkedIn</a>` : ''}
        ${sun.github   ? `<a class="pi-sun-chip" href="${this._esc(sun.github)}"   target="_blank" rel="noopener noreferrer" style="--chip-color:${hex}">⌥&nbsp; GitHub</a>`   : ''}
      </div>
    `;
  }

  /**
   * Routes to the correct builder based on planet id.
   */
  _buildPanelContent(moon, planet, hex) {
    const pid = planet ? planet.id : '';
    switch (pid) {
      case 'nexus':   return this._buildNexus(moon, hex);
      case 'forge':   return this._buildForge(moon, hex);
      case 'matrix':  return this._buildMatrix(moon, hex);
      case 'citadel': return this._buildCitadel(moon, hex);
      case 'pulse':   return this._buildPulse(moon, hex);
      case 'signal':  return this._buildSignal(moon, hex);
      case 'vault':   return this._buildVault(moon, hex);
      default:        return this._buildGeneric(moon, hex);
    }
  }

  /** NEXUS — Experience: role, company, duration, location, description, tags */
  _buildNexus(moon, hex) {
    const locationBadge = moon.location
      ? `<span class="pi-location-badge" style="border-color:${hex};color:${hex}">${this._esc(moon.location)}</span>`
      : '';
    return `
      <div id="panel-tags">${this._renderTagPills(moon.tags, hex)}</div>
      <h2 id="panel-title" style="color:${hex}">${this._esc(moon.title)}</h2>
      <div class="pi-meta">
        <span class="pi-company">${this._esc(moon.subtitle)}</span>
        ${moon.duration ? `<span class="pi-duration">${this._esc(moon.duration)}</span>` : ''}
        ${locationBadge}
      </div>
      <p id="panel-description">${this._esc(moon.description)}</p>
    `;
  }

  /** FORGE — Projects: title, subtitle, duration, description, tags, buttons */
  _buildForge(moon, hex) {
    const isYouTube = moon.live_url && moon.live_url.includes('youtube.com');
    const liveLabel = isYouTube ? 'Watch on YouTube &#8599;' : 'Live Demo &#8599;';

    const ghBtn   = moon.github_url
      ? `<a class="pi-btn" href="${this._esc(moon.github_url)}" target="_blank" rel="noopener noreferrer" style="border-color:${hex};color:${hex}">View on GitHub &#8599;</a>`
      : '';
    const liveBtn = moon.live_url
      ? `<a class="pi-btn" href="${this._esc(moon.live_url)}" target="_blank" rel="noopener noreferrer" style="border-color:${hex};color:${hex}">${liveLabel}</a>`
      : '';
    const btnRow  = (ghBtn || liveBtn)
      ? `<div class="pi-btn-row">${ghBtn}${liveBtn}</div>`
      : '';

    return `
      <h2 id="panel-title" style="color:${hex}">${this._esc(moon.title)}</h2>
      <h3 id="panel-subtitle">${this._esc(moon.subtitle)}</h3>
      ${moon.duration ? `<span class="pi-duration">${this._esc(moon.duration)}</span>` : ''}
      <p id="panel-description">${this._esc(moon.description)}</p>
      <div id="panel-tags">${this._renderTagPills(moon.tags, hex)}</div>
      ${btnRow}
    `;
  }

  /** MATRIX — Technical Skills: category heading, note, skills tag cloud */
  _buildMatrix(moon, hex) {
    const skills = moon.skills || moon.tags || [];
    return `
      <h2 id="panel-title" style="color:${hex}">${this._esc(moon.title)}</h2>
      ${moon.note ? `<p class="pi-note">${this._esc(moon.note)}</p>` : ''}
      <div id="panel-tags">${this._renderTagPills(skills, hex)}</div>
    `;
  }

  /** CITADEL — Education: degree or cert list */
  _buildCitadel(moon, hex) {
    const locationBadge = moon.location
      ? `<span class="pi-location-badge" style="border-color:${hex};color:${hex}">${this._esc(moon.location)}</span>`
      : '';

    let bodyHTML = '';
    if (moon.certList) {
      // Render pipe-separated certs as individual line items
      const items = moon.description.split('|').map(s => s.trim()).filter(Boolean);
      bodyHTML = `<ul class="pi-cert-list">${items.map(c => `<li>${this._esc(c)}</li>`).join('')}</ul>`;
    } else {
      bodyHTML = `<p id="panel-description">${this._esc(moon.description)}</p>`;
    }

    const linkBtn = moon.link
      ? `<div class="pi-btn-row"><a class="pi-btn" href="${this._esc(moon.link)}" target="_blank" rel="noopener noreferrer" style="border-color:${hex};color:${hex}">Visit Website &#8599;</a></div>`
      : '';

    return `
      <h2 id="panel-title" style="color:${hex}">${this._esc(moon.title)}</h2>
      ${moon.subtitle ? `<h3 id="panel-subtitle">${this._esc(moon.subtitle)}</h3>` : ''}
      <div class="pi-meta">
        ${moon.duration ? `<span class="pi-duration">${this._esc(moon.duration)}</span>` : ''}
        ${locationBadge}
      </div>
      ${bodyHTML}
      <div id="panel-tags">${this._renderTagPills(moon.tags, hex)}</div>
      ${linkBtn}
    `;
  }

  /** PULSE — Interests: title, subtitle, description, tags, optional link */
  _buildPulse(moon, hex) {
    const isYouTube = moon.link && moon.link.includes('youtube.com');
    const linkBtn   = moon.link
      ? `<div class="pi-btn-row"><a class="pi-btn" href="${this._esc(moon.link)}" target="_blank" rel="noopener noreferrer" style="border-color:${hex};color:${hex}">${isYouTube ? 'Watch Channel &#8599;' : 'Visit &#8599;'}</a></div>`
      : '';

    return `
      <h2 id="panel-title" style="color:${hex}">${this._esc(moon.title)}</h2>
      ${moon.subtitle ? `<h3 id="panel-subtitle">${this._esc(moon.subtitle)}</h3>` : ''}
      <p id="panel-description">${this._esc(moon.description)}</p>
      <div id="panel-tags">${this._renderTagPills(moon.tags, hex)}</div>
      ${linkBtn}
    `;
  }

  /** SIGNAL — Contact: large prominent button per contact type */
  _buildSignal(moon, hex) {
    const btnLabels = {
      'signal-email':    'Send Email',
      'signal-linkedin': 'View Profile &#8599;',
      'signal-github':   'View GitHub &#8599;',
      'signal-resume':   'Download Resume &#8599;'
    };
    const btnLabel = btnLabels[moon.id] || 'Open Link &#8599;';
    const isEmail  = moon.link && moon.link.startsWith('mailto:');
    const attrs    = isEmail ? '' : 'target="_blank" rel="noopener noreferrer"';

    return `
      <h2 id="panel-title" style="color:${hex}">${this._esc(moon.title)}</h2>
      <span class="pi-contact-sub">${this._esc(moon.subtitle)}</span>
      <div class="pi-btn-row">
        <a class="pi-btn pi-btn-large" href="${this._esc(moon.link)}" ${attrs} style="border-color:${hex};color:${hex}">${btnLabel}</a>
      </div>
    `;
  }

  /** VAULT — Certificates: title, subtitle, description, tags, view PDF button */
  _buildVault(moon, hex) {
    const pdfUrl   = moon.cert_pdf ? this._esc(moon.cert_pdf) : '';
    const certBtn  = pdfUrl
      ? `<div class="pi-btn-row">
          <button class="pi-btn pi-cert-open-btn" data-pdf="${pdfUrl}"
            style="border-color:${hex};color:${hex};cursor:pointer;background:transparent">
            View Certificate &#8599;
          </button>
        </div>`
      : '';

    return `
      <h2 id="panel-title" style="color:${hex}">${this._esc(moon.title)}</h2>
      ${moon.subtitle ? `<h3 id="panel-subtitle">${this._esc(moon.subtitle)}</h3>` : ''}
      <p id="panel-description">${this._esc(moon.description)}</p>
      <div id="panel-tags">${this._renderTagPills(moon.tags, hex)}</div>
      ${certBtn}
    `;
  }

  /** Generic fallback */
  _buildGeneric(moon, hex) {
    return `
      <div id="panel-tags">${this._renderTagPills(moon.tags, hex)}</div>
      <h2 id="panel-title" style="color:${hex}">${this._esc(moon.title || '')}</h2>
      ${moon.subtitle ? `<h3 id="panel-subtitle">${this._esc(moon.subtitle)}</h3>` : ''}
      ${moon.description ? `<p id="panel-description">${this._esc(moon.description)}</p>` : ''}
      ${moon.link && moon.link !== '#'
        ? `<div class="pi-btn-row"><a class="pi-btn" href="${this._esc(moon.link)}" target="_blank" rel="noopener noreferrer" style="border-color:${hex};color:${hex}">Open Link &#8599;</a></div>`
        : ''}
    `;
  }

  /* ── Helpers ───────────────────────────────────────────────────────────── */

  /** Returns HTML for a row of tag pills. */
  _renderTagPills(tags, hex) {
    if (!tags || !tags.length) return '';
    return tags.map(t =>
      `<span class="panel-tag" style="border-color:${hex};color:${hex}">${this._esc(t)}</span>`
    ).join('');
  }

  /** HTML-escapes a string to prevent injection. */
  _esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#39;');
  }

  /* ── Internal Helpers ──────────────────────────────────────────────────── */

  _bindPanelClose() {
    if (!this._panelClose) return;
    this._panelClose.addEventListener('click', () => {
      this.hideInfoPanel();
    });

    // Delegated handler for vault certificate "View Certificate" buttons
    if (this._infoPanel) {
      this._infoPanel.addEventListener('click', e => {
        const btn = e.target.closest('.pi-cert-open-btn');
        if (!btn) return;
        const pdfUrl = btn.dataset.pdf;
        if (!pdfUrl) return;
        fetch(pdfUrl, { method: 'HEAD' })
          .then(r => {
            if (r.ok) window.open(pdfUrl, '_blank', 'noopener');
            else       btn.textContent = 'Certificate PDF coming soon';
          })
          .catch(() => { btn.textContent = 'Certificate PDF coming soon'; });
      });
    }
  }

  /**
   * Injects CSS for dynamically generated panel elements that don't
   * have rules in styles.css. Uses a "pi-" prefix to avoid conflicts.
   */
  _injectPanelStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* ── Dynamic panel elements (pi- prefix) ── */

      .pi-meta {
        margin-bottom: 16px;
      }

      .pi-company {
        display: block;
        font-family: var(--font-sans);
        font-size: 13px;
        font-weight: 600;
        color: rgba(220, 235, 225, 0.95);
        margin-bottom: 5px;
        letter-spacing: 0.01em;
      }

      .pi-duration {
        display: inline-block;
        font-family: var(--font-mono);
        font-size: 9px;
        letter-spacing: 0.13em;
        text-transform: uppercase;
        color: rgba(180, 220, 200, 0.45);
        margin-bottom: 8px;
        margin-right: 10px;
      }

      .pi-location-badge {
        display: inline-block;
        font-family: var(--font-mono);
        font-size: 8px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        border: 1px solid;
        padding: 2px 8px;
        margin-bottom: 8px;
        vertical-align: middle;
        border-radius: 100px;
        opacity: 0.85;
      }

      .pi-note {
        font-family: var(--font-sans);
        font-size: 12px;
        color: rgba(180, 220, 200, 0.55);
        letter-spacing: 0.02em;
        margin-bottom: 16px;
        font-style: italic;
      }

      .pi-cert-list {
        list-style: none;
        padding: 0;
        margin: 0 0 22px;
      }

      .pi-cert-list li {
        font-family: var(--font-sans);
        font-size: 12.5px;
        color: rgba(210, 230, 220, 0.82);
        padding: 9px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        line-height: 1.55;
      }

      .pi-cert-list li:last-child {
        border-bottom: none;
      }

      .pi-btn {
        display: inline-block;
        font-family: var(--font-mono);
        font-size: 9px;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        border: 1px solid;
        padding: 8px 20px;
        text-decoration: none;
        transition: background 0.2s, box-shadow 0.2s;
        border-radius: 4px;
      }

      .pi-btn:hover {
        background: rgba(255, 255, 255, 0.07);
        box-shadow: 0 0 12px rgba(255, 255, 255, 0.1);
      }

      .pi-btn-large {
        font-size: 10px;
        padding: 13px 30px;
        letter-spacing: 0.22em;
      }

      .pi-btn-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 20px;
      }

      .pi-contact-sub {
        display: block;
        font-family: var(--font-mono);
        font-size: 13px;
        letter-spacing: 0.08em;
        color: rgba(210, 230, 220, 0.72);
        margin: 12px 0 6px;
      }

      /* ── Sun / About Me panel ── */

      .pi-sun-header {
        margin-bottom: 6px;
      }

      .pi-sun-orbit-badge {
        display: inline-block;
        font-family: var(--font-mono);
        font-size: 9px;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        border: 1px solid;
        padding: 3px 12px;
        border-radius: 100px;
        margin-bottom: 14px;
        opacity: 0.8;
      }

      .pi-sun-name {
        font-family: var(--font-mono);
        font-size: 28px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        line-height: 1.1;
        margin-bottom: 10px;
        text-shadow: 0 0 30px currentColor, 0 0 60px rgba(255,140,0,0.3);
      }

      .pi-sun-tagline {
        font-family: var(--font-sans);
        font-size: 12px;
        font-weight: 400;
        color: rgba(210, 220, 215, 0.65);
        letter-spacing: 0.04em;
        line-height: 1.5;
      }

      .pi-about-divider {
        height: 1px;
        margin: 22px 0 22px;
        border-radius: 1px;
      }

      .pi-about-body {
        display: flex;
        flex-direction: column;
        gap: 14px;
        margin-bottom: 28px;
      }

      .pi-about-para {
        font-family: var(--font-sans);
        font-size: 13.5px;
        font-weight: 400;
        color: rgba(210, 228, 220, 0.83);
        line-height: 1.78;
        letter-spacing: 0.01em;
      }

      .pi-sun-links {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-top: 4px;
      }

      .pi-sun-chip {
        display: inline-flex;
        align-items: center;
        font-family: var(--font-mono);
        font-size: 9.5px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--chip-color, #ff8c00);
        border: 1px solid var(--chip-color, #ff8c00);
        padding: 7px 16px;
        text-decoration: none;
        border-radius: 5px;
        transition: background 0.2s, box-shadow 0.2s;
        background: rgba(255,140,0,0.04);
        width: fit-content;
      }

      .pi-sun-chip:hover {
        background: rgba(255,140,0,0.1);
        box-shadow: 0 0 12px rgba(255,140,0,0.25);
      }

      span.pi-sun-chip {
        cursor: default;
        opacity: 0.75;
      }
      span.pi-sun-chip:hover {
        background: rgba(255,140,0,0.04);
        box-shadow: none;
      }

      /* ── Tooltip multi-line support ── */
      #tooltip small {
        display: block;
        font-size: 10px;
        opacity: 0.72;
        margin-top: 3px;
        line-height: 1.5;
      }
    `;
    document.head.appendChild(style);
  }
}
