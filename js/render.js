/**
 * render.js: turns SITE (content.js) into HTML strings.
 * Shared by tools/render.mjs (writes index.html) and site.js (stale-HTML fallback),
 * so the prerendered page and the live re-render can never drift apart.
 */

var SiteRender = (function () {
  'use strict';

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  // Inline line icons: no icon font, and currentColor follows the theme
  const ICON = {
    github: '<path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/>',
    arrow:  '<path fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" d="M7 17 17 7M8 7h9v9"/>'
  };
  const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICON[name]}</svg>`;

  // kicker = the mission-log label; title = the plain heading people scan for
  const SECTIONS = [
    { id: 'experience',   label: 'Experience',   kicker: 'Flight record',  title: 'Experience' },
    { id: 'services',     label: 'Services',     kicker: 'Contract work',  title: 'Freelance &amp; Services' },
    { id: 'projects',     label: 'Projects',     kicker: 'Mission log',    title: 'Projects' },
    { id: 'skills',       label: 'Skills',       kicker: 'Systems',        title: 'Skills' },
    { id: 'education',    label: 'Education',    kicker: 'Training',       title: 'Education' },
    { id: 'certificates', label: 'Certificates', kicker: 'Certifications', title: 'Certificates' },
    { id: 'about',        label: 'About',        kicker: 'Crew file',      title: 'About' },
    { id: 'contact',      label: 'Contact',      kicker: 'Open channel',   title: 'Contact' }
  ];
  const sec = id => SECTIONS.find(s => s.id === id);

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const launch = ym => {                                    // "2026-01" → "Jan 2026"; machine value kept for <time>
    if (!ym) return '<span class="m-nodate" aria-label="Date not listed">—</span>';   // TODO in content.js; never guess a date
    const [y, m] = ym.split('-');
    return `<time datetime="${esc(ym)}">${MONTHS[+m - 1]} ${esc(y)}</time>`;
  };
  const pad = n => String(n).padStart(2, '0');
  const mailto = (email, subject) => `mailto:${email}${subject ? '?subject=' + encodeURIComponent(subject) : ''}`;
  const ext = (href, text) => `<a class="link" href="${esc(href)}">${text}${icon('arrow')}</a>`;

  const bullets = list => list && list.length ? `<ul class="bullets">${list.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : '';
  const stack = list => list && list.length
    ? `<ul class="stack" aria-label="Stack">${list.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : '';

  // Same 16:10 box with or without an image, so adding screenshots later causes no layout shift
  function shot(image, title, alt) {
    return image
      ? `<figure class="shot"><img src="${esc(image)}" alt="${esc(alt || 'Screenshot of ' + title)}" width="1200" height="750" loading="lazy" decoding="async"></figure>`   // width/height reserve the 16:10 box before load
      : `<figure class="shot shot--empty" aria-hidden="true"><span>Screenshot pending</span></figure>`;
  }

  // Left column: mono kicker + h2 (+ optional dek); sticky on wide screens
  function head(id, dek) {
    const s = sec(id);
    return `<header class="sec-head" data-reveal>
      <p class="kicker">${s.kicker}</p>
      <h2 id="${id}-title">${s.title}</h2>
      ${dek ? `<p class="dek">${dek}</p>` : ''}
    </header>`;
  }
  const section = (id, inner, dek, extra = '') =>
    `<section id="${id}" class="section" aria-labelledby="${id}-title"${extra}>
  <div class="wrap grid">
    ${head(id, dek)}
    <div class="sec-body">${inner}</div>
  </div>
</section>`;

  /* ── Nav ───────────────────────────────────────────────────────────── */
  function nav(certCount) {
    return SECTIONS.map(s => {
      const cert = s.id === 'certificates';
      return `<li${cert ? ` data-cert-nav${certCount ? '' : ' hidden'}` : ''}><a href="#${s.id}">${s.label}</a></li>`;
    }).join('');
  }

  /* ── Hero ──────────────────────────────────────────────────────────── */
  // Decorative nod to the 3D mode: a tilted orrery, moons riding SMIL paths
  function orbitDiagram() {
    const orbits = [[96, 36, 26, true], [150, 56, 44], [204, 76, 70]];   // rx, ry, seconds per lap, accent moon
    const path = (rx, ry) => `M${220 - rx} 220a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 ${-rx * 2} 0`;
    return `<svg class="hero-orbit" viewBox="0 0 440 440" aria-hidden="true" focusable="false">
    <g transform="rotate(-16 220 220)">
      ${orbits.map(([rx, ry]) => `<ellipse cx="220" cy="220" rx="${rx}" ry="${ry}"/>`).join('')}
      <line class="hero-orbit-axis" x1="0" y1="220" x2="440" y2="220"/>
      <circle class="hero-orbit-sun" cx="220" cy="220" r="7"/>
      ${orbits.map(([rx, ry, dur, accent], i) => `<circle class="${accent ? 'hero-orbit-moon is-accent' : 'hero-orbit-moon'}" r="${accent ? 4.5 : 3}"><animateMotion dur="${dur}s" begin="-${i * 9}s" repeatCount="indefinite" path="${path(rx, ry)}"/></circle>`).join('')}
    </g>
  </svg>`;
  }

  function hero(site) {
    const p = site.profile, now = site.experience[0], edu = site.education[0];
    const status = (Array.isArray(p.status) ? p.status : [p.status]).filter(Boolean);
    return `
<section id="top" class="hero" aria-labelledby="hero-title">
  <canvas class="starfield" aria-hidden="true"></canvas>
  ${orbitDiagram()}
  <div class="wrap hero-grid">
    <p class="kicker" data-intro="0">Flight record</p>
    <h1 id="hero-title" class="hero-name" data-intro="1">${esc(p.name)}</h1>
    <p class="hero-pitch" data-intro="2">${esc(p.pitch)}</p>
    ${status.length ? `<ul class="status" data-intro="3" aria-label="Status">${status.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
    <ul class="hero-links" data-intro="4">
      <li><a class="btn btn--primary" href="${esc(p.resume)}">Resume <span class="btn-note">PDF</span></a></li>
      <li><a class="btn" href="${esc(p.github)}">GitHub</a></li>
      <li><a class="btn" href="${esc(p.linkedin)}">LinkedIn</a></li>
      <li><a class="btn" href="${esc(mailto(p.email))}">Email</a></li>
    </ul>
    <div class="hero-foot" data-intro="5">
      <dl class="manifest">
        <div><dt>Current</dt><dd>${esc(now.role)}, ${esc(now.org.replace(/ (Ltd\.|Inc\.)$/, ''))}</dd></div>
        <div><dt>Training</dt><dd>${esc(edu.degree)}, ${esc(edu.school)}${edu.end ? ` · ${esc(edu.end)}` : ''}</dd></div>
      </dl>
      <button type="button" class="explore" data-open-3d hidden>
        <svg class="explore-orbit" viewBox="0 0 48 48" aria-hidden="true"><circle class="explore-sun" cx="24" cy="24" r="4"/><ellipse cx="24" cy="24" rx="20" ry="8"/><g class="explore-path"><circle class="explore-moon" cx="44" cy="24" r="2.75"/></g></svg>
        <span class="explore-text">Explore in 3D<span class="explore-sub">This portfolio as a solar system</span></span>
      </button>
    </div>
  </div>
</section>`;
  }

  /* ── Experience: timeline, highlights collapse per role ────────────── */
  function experience(list) {
    const items = list.map((e, i) => `
      <li id="experience/${esc(e.id)}" class="tl-item${i === 0 ? ' is-current' : ''}${e.compact ? ' tl-item--compact' : ''}" data-reveal>
        <p class="tl-when">${esc(e.dates)}</p>
        <div class="tl-body">
          <h3 class="tl-role">${esc(e.role)}${e.type ? ` <span class="tl-type">${esc(e.type)}</span>` : ''}</h3>
          <p class="tl-org">${esc(e.org)}${e.orgNote ? ` <span class="muted">· ${esc(e.orgNote)}</span>` : ''} <span class="muted">· ${esc(e.location)}</span></p>
          <details class="disclose"${i < 2 ? ' open' : ''}>
            <summary><span class="disclose-label">Highlights</span><span class="count">${pad(e.bullets.length)}</span></summary>
            <div class="disclose-body">
              ${bullets(e.bullets)}
              ${stack(e.tags)}
              ${(e.links || []).map(l => ext(l.href, esc(l.label))).join('')}
            </div>
          </details>
        </div>
      </li>`).join('');
    return section('experience', `<ol class="timeline">${items}</ol>`);
  }

  /* ── Services ──────────────────────────────────────────────────────── */
  function services(s, p) {
    const cs = s.caseStudy;
    return section('services', `
      <dl class="rows" data-reveal>${s.offerings.map(o => `<div class="row"><dt>${esc(o.title)}</dt><dd>${esc(o.text)}</dd></div>`).join('')}</dl>
      <article id="services/${esc(cs.id)}" class="case" data-reveal>
        <div class="case-text">
          <p class="kicker">Case study · ${esc(cs.sector)}</p>
          <h3 class="case-title">${esc(cs.title)}</h3>
          <p class="muted">${esc(cs.client)}</p>
          ${bullets(cs.points)}
          ${ext(cs.href, `Visit ${esc(cs.title)}`)}
        </div>
        ${shot(cs.image, cs.title, cs.imageAlt)}
      </article>
      <p class="track" data-reveal>${esc(s.trackRecord)}</p>
      <p class="cta" data-reveal><a class="btn btn--primary btn--lg" href="${esc(mailto(p.email, s.cta.subject))}">${esc(s.cta.label)}</a></p>`,
      esc(s.intro));
  }

  /* ── Projects: mission rows; <details> so they open with JS off ────── */
  function mission(pr, n) {
    const links = [];
    if (pr.repo && pr.repoPublic !== false) links.push(`<a class="btn btn--sm" href="${esc(pr.repo)}">${icon('github')}Code</a>`);
    if (pr.live && pr.liveReady !== false) links.push(`<a class="btn btn--sm" href="${esc(pr.live)}">${esc(pr.liveLabel || 'Live demo')}${icon('arrow')}</a>`);
    return `
      <li id="projects/${esc(pr.id)}" class="mission${pr.minor ? ' mission--minor' : ''}" data-reveal>
        <details class="disclose disclose--row">
          <summary class="m-row">
            <span class="m-date">${launch(pr.launch)}</span>
            <span class="m-main">
              <h3 class="m-name"><span class="m-id">M-${pad(n)}</span> ${esc(pr.title)}</h3>
              <span class="m-result">${esc(pr.result)}</span>
            </span>
            <span class="m-stack">${pr.tags.slice(0, 3).map(esc).join(' · ')}</span>
            <span class="m-toggle" aria-hidden="true"></span>
          </summary>
          <div class="disclose-body m-detail">
            <div class="m-text">
              <p class="m-summary">${esc(pr.summary)}</p>
              ${bullets(pr.bullets)}
              ${stack(pr.tags)}
              <p class="m-links">${links.join('')}<a class="permalink" href="#projects/${esc(pr.id)}">Link to this mission</a></p>
            </div>
            ${shot(pr.image, pr.title, pr.imageAlt)}
          </div>
        </details>
      </li>`;
  }

  function projects(list) {
    const main = list.filter(p => !p.minor), side = list.filter(p => p.minor);
    return section('projects', `
      <div class="m-head" aria-hidden="true"><span>Launch</span><span>Mission · result</span><span>Stack</span></div>
      <ol class="missions">${main.map((p, i) => mission(p, i + 1)).join('')}</ol>
      ${side.length ? `<h3 class="subhead" data-reveal>Side missions</h3>
      <ol class="missions missions--minor">${side.map((p, i) => mission(p, main.length + i + 1)).join('')}</ol>` : ''}`,
      'Open any row for the full mission report.');
  }

  /* ── Skills: label/value rows, not a chip wall ─────────────────────── */
  function skills(groups) {
    return section('skills', `
      <dl class="rows rows--skills">${groups.map(g => `
        <div class="row" data-reveal>
          <dt>${esc(g.title)}<span class="row-note">${esc(g.note)}</span></dt>
          <dd><ul class="inline-list">${g.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul></dd>
        </div>`).join('')}
      </dl>`);
  }

  function education(list) {
    return section('education', `<ol class="timeline">${list.map(e => `
      <li id="education/${esc(e.id)}" class="tl-item" data-reveal>
        <p class="tl-when">${e.end ? `${esc(e.start)} – ${esc(e.end)}` : `Since ${esc(e.start)}`}</p>
        <div class="tl-body">
          <h3 class="tl-role">${esc(e.degree)}</h3>
          <p class="tl-org"><a class="link" href="${esc(e.href)}">${esc(e.school)}</a> <span class="muted">· ${esc(e.minor)} · ${esc(e.location)}</span></p>
          ${e.awards && e.awards.length ? `<p class="small-label">Scholarships</p>${bullets(e.awards)}` : ''}
        </div>
      </li>`).join('')}</ol>`);
  }

  function certificateItems(certs) {
    return certs.map(c => `<div class="row"><dt><a class="link" href="${esc(c.file)}">${esc(c.title)}</a></dt><dd>${esc(c.issuer)} <span class="muted">· ${esc(c.date)}</span></dd></div>`).join('');
  }

  // Hidden while no PDF is verified; site.js re-checks at runtime so new PDFs appear without a re-render
  function certificates(verified) {
    return section('certificates', `<dl class="rows" data-certs>${certificateItems(verified)}</dl>`, '', verified.length ? '' : ' hidden');
  }

  function about(a, interests) {
    return section('about', `
      <div class="prose" data-reveal>${a.paragraphs.map(t => `<p>${esc(t)}</p>`).join('')}</div>
      <dl class="rows" data-reveal>
        <div class="row"><dt>Languages</dt><dd>${a.languages.map(esc).join(', ')}</dd></div>
        <div class="row"><dt>Background</dt><dd>${esc(a.background)}</dd></div>
      </dl>
      <h3 class="subhead" id="interests" data-reveal>Off duty</h3>
      <dl class="rows">${interests.map(i => `<div class="row" id="about/${esc(i.id)}" data-reveal><dt>${esc(i.title)}</dt><dd>${esc(i.text)}</dd></div>`).join('')}</dl>`);
  }

  function contact(p) {
    const rows = [
      ['Phone', p.phone, 'tel:' + p.phoneE164],
      ['LinkedIn', p.linkedin.replace(/^https?:\/\/(www\.)?/, ''), p.linkedin],
      ['GitHub', p.github.replace(/^https?:\/\//, ''), p.github],
      ['Resume', 'Download PDF', p.resume]
    ];
    return section('contact', `
      <p data-reveal><a class="contact-email" href="${esc(mailto(p.email))}">${esc(p.email)}</a></p>
      <dl class="rows" data-reveal>${rows.map(([label, text, href]) =>
        `<div class="row"><dt>${label}</dt><dd><a class="link" href="${esc(href)}">${esc(text)}</a></dd></div>`).join('')}</dl>`,
      'Hiring for a new-grad role, or need a website for your business? Email is the best way to reach me.');
  }

  function main(site, verifiedCerts) {
    return [
      hero(site),
      experience(site.experience),
      services(site.services, site.profile),
      projects(site.projects),
      skills(site.skills),
      education(site.education),
      certificates(verifiedCerts),
      about(site.about, site.interests),
      contact(site.profile)
    ].join('\n');
  }

  // FNV-1a over the JSON: cheap fingerprint so site.js can tell if index.html is stale
  function hash(site) {
    const s = JSON.stringify(site);
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return (h >>> 0).toString(16);
  }

  return { esc, icon, SECTIONS, nav, main, certificateItems, hash };
}());

if (typeof module !== 'undefined') module.exports = SiteRender;
