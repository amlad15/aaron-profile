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

  // Small inline icons: no icon font request, and currentColor follows the theme
  const ICON = {
    github:   '<path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/>',
    linkedin: '<path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z"/>',
    mail:     '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M3 5h18v14H3zM3 6l9 7 9-7"/>',
    phone:    '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z"/>',
    file:     '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5"/>',
    external: '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    play:     '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M3 5h18v14H3zM10 9l5 3-5 3z"/>',
    link:     '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>'
  };
  const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICON[name]}</svg>`;

  // Sections in page order; nav + 3D side list both read this
  const SECTIONS = [
    { id: 'experience',   label: 'Experience' },
    { id: 'services',     label: 'Services' },
    { id: 'projects',     label: 'Projects' },
    { id: 'skills',       label: 'Skills' },
    { id: 'education',    label: 'Education' },
    { id: 'certificates', label: 'Certificates' },
    { id: 'about',        label: 'About' },
    { id: 'contact',      label: 'Contact' }
  ];

  const tags = list => list && list.length
    ? `<ul class="tags" aria-label="Tags">${list.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : '';
  const bullets = list => list && list.length
    ? `<ul class="bullets">${list.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : '';
  const mailto = (email, subject) => `mailto:${email}${subject ? '?subject=' + encodeURIComponent(subject) : ''}`;

  // Fixed 16:10 box either way, so adding a screenshot later causes no layout shift
  function figure(image, title) {
    if (image) {
      return `<div class="shot"><img src="${esc(image)}" alt="Screenshot of ${esc(title)}" width="1600" height="1000" loading="lazy" decoding="async"></div>`;
    }
    return `<div class="shot shot--empty" aria-hidden="true"><span>${esc(title)}</span></div>`;
  }

  /* ── Sections ─────────────────────────────────────────────────────────── */

  function nav(certCount) {
    return SECTIONS.map(s =>
      `<li${s.id === 'certificates' && !certCount ? ' hidden data-cert-nav' : s.id === 'certificates' ? ' data-cert-nav' : ''}>` +
      `<a href="#${s.id}">${s.label}</a></li>`).join('');
  }

  function hero(p) {
    return `
<section id="top" class="hero" aria-labelledby="hero-title">
  <div class="hero-sky" aria-hidden="true">
    <svg class="orbit" viewBox="0 0 600 600"><circle cx="300" cy="300" r="220"/><circle cx="300" cy="300" r="290"/><circle class="orbit-dot" cx="520" cy="300" r="5"/></svg>
  </div>
  <div class="wrap hero-inner">
    <p class="eyebrow">${esc(p.location)}</p>
    <h1 id="hero-title">${esc(p.name)}</h1>
    <p class="pitch">${esc(p.pitch)}</p>
    <p class="status"><span class="status-dot" aria-hidden="true"></span>${esc(p.status)}</p>
    <div class="actions">
      <a class="btn btn--primary" href="${esc(p.resume)}">${icon('file')}Resume <span class="sr-note">(PDF)</span></a>
      <a class="btn" href="${esc(p.github)}">${icon('github')}GitHub</a>
      <a class="btn" href="${esc(p.linkedin)}">${icon('linkedin')}LinkedIn</a>
      <a class="btn" href="${esc(mailto(p.email))}">${icon('mail')}Email</a>
    </div>
    <button type="button" class="link-3d" data-open-3d hidden>Explore this portfolio in 3D <span aria-hidden="true">→</span></button>
  </div>
</section>`;
  }

  function sectionHead(id, title, lede) {
    return `<header class="section-head"><h2 id="${id}-title">${title}</h2>${lede ? `<p class="lede">${lede}</p>` : ''}</header>`;
  }

  function experience(list) {
    const items = list.map(e => `
    <li>
      <article id="experience/${esc(e.id)}" class="job${e.compact ? ' job--compact' : ''}">
        <header>
          <h3>${esc(e.role)}${e.type ? ` <span class="job-type">${esc(e.type)}</span>` : ''}</h3>
          <p class="job-org">${esc(e.org)}${e.orgNote ? ` <span class="muted">· ${esc(e.orgNote)}</span>` : ''}</p>
          <p class="meta">${esc(e.dates)} · ${esc(e.location)}</p>
        </header>
        ${bullets(e.bullets)}
        ${tags(e.tags)}
        ${(e.links || []).map(l => `<a class="text-link" href="${esc(l.href)}">${esc(l.label)}${icon('external')}</a>`).join('')}
      </article>
    </li>`).join('');
    return `
<section id="experience" class="section" aria-labelledby="experience-title">
  <div class="wrap">
    ${sectionHead('experience', 'Experience')}
    <ol class="timeline">${items}</ol>
  </div>
</section>`;
  }

  function services(s, p) {
    const cs = s.caseStudy;
    return `
<section id="services" class="section section--alt" aria-labelledby="services-title">
  <div class="wrap">
    ${sectionHead('services', 'Freelance &amp; Services', esc(s.intro))}
    <ul class="offerings">${s.offerings.map(o => `<li><h3>${esc(o.title)}</h3><p>${esc(o.text)}</p></li>`).join('')}</ul>
    <article id="services/${esc(cs.id)}" class="case">
      ${figure(cs.image, cs.title)}
      <div class="case-body">
        <p class="eyebrow">Case study · ${esc(cs.sector)}</p>
        <h3>${esc(cs.title)} <span class="muted">for ${esc(cs.client)}</span></h3>
        ${bullets(cs.points)}
        <a class="text-link" href="${esc(cs.href)}">Visit ${esc(cs.title)}${icon('external')}</a>
      </div>
    </article>
    <p class="track">${esc(s.trackRecord)}</p>
    <a class="btn btn--primary btn--lg" href="${esc(mailto(p.email, s.cta.subject))}">${icon('mail')}${esc(s.cta.label)}</a>
  </div>
</section>`;
  }

  function projectCard(pr) {
    const links = [];
    if (pr.repo && pr.repoPublic !== false) links.push(`<a class="btn btn--sm" href="${esc(pr.repo)}">${icon('github')}Code</a>`);
    if (pr.live && pr.liveReady !== false) {
      const yt = /youtube\.com/.test(pr.live);
      links.push(`<a class="btn btn--sm" href="${esc(pr.live)}">${icon(yt ? 'play' : 'external')}${esc(pr.liveLabel || 'Live demo')}</a>`);
    }
    return `
    <article id="projects/${esc(pr.id)}" class="project${pr.featured ? ' project--featured' : ''}">
      ${figure(pr.image, pr.title)}
      <div class="project-body">
        <h3>${esc(pr.title)} <a class="permalink" href="#projects/${esc(pr.id)}" aria-label="Link to ${esc(pr.title)}">${icon('link')}</a></h3>
        <p class="meta">${esc(pr.dates)}</p>
        <p>${esc(pr.summary)}</p>
        ${bullets(pr.bullets)}
        ${tags(pr.tags)}
        ${links.length ? `<div class="actions">${links.join('')}</div>` : ''}
      </div>
    </article>`;
  }

  function projects(list) {
    const featured = list.filter(p => p.featured), more = list.filter(p => !p.featured);
    return `
<section id="projects" class="section" aria-labelledby="projects-title">
  <div class="wrap">
    ${sectionHead('projects', 'Projects')}
    <div class="projects-grid">${featured.map(projectCard).join('')}</div>
    ${more.length ? `<h3 class="subhead">More projects</h3><div class="projects-grid projects-grid--small">${more.map(projectCard).join('')}</div>` : ''}
  </div>
</section>`;
  }

  function skills(groups) {
    return `
<section id="skills" class="section section--alt" aria-labelledby="skills-title">
  <div class="wrap">
    ${sectionHead('skills', 'Skills')}
    <div class="skills-grid">${groups.map(g => `
      <div class="skill-group">
        <h3>${esc(g.title)}</h3>
        <p class="muted small">${esc(g.note)}</p>
        <ul class="tags tags--lg">${g.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
      </div>`).join('')}
    </div>
  </div>
</section>`;
  }

  function education(list) {
    return `
<section id="education" class="section" aria-labelledby="education-title">
  <div class="wrap">
    ${sectionHead('education', 'Education')}
    ${list.map(e => `
    <article id="education/${esc(e.id)}" class="edu">
      <h3>${esc(e.degree)}${e.minor ? `, <span class="muted">${esc(e.minor)}</span>` : ''}</h3>
      <p class="job-org"><a class="text-link" href="${esc(e.href)}">${esc(e.school)}</a></p>
      <p class="meta">${e.end ? `${esc(e.start)} – ${esc(e.end)}` : `Since ${esc(e.start)}`} · ${esc(e.location)}</p>
      ${e.awards && e.awards.length ? `<h4 class="small-head">Scholarships</h4>${bullets(e.awards)}` : ''}
    </article>`).join('')}
  </div>
</section>`;
  }

  function certificateItems(certs) {
    return certs.map(c => `<li><a href="${esc(c.file)}">${icon('file')}<span><span class="cert-title">${esc(c.title)}</span><span class="meta">${esc(c.issuer)} · ${esc(c.date)}</span></span></a></li>`).join('');
  }

  // Hidden when no cert is verified; site.js re-checks at runtime so new PDFs appear without a re-render
  function certificates(verified) {
    return `
<section id="certificates" class="section section--alt" aria-labelledby="certificates-title"${verified.length ? '' : ' hidden'}>
  <div class="wrap">
    ${sectionHead('certificates', 'Certificates')}
    <ul class="certs" data-certs>${certificateItems(verified)}</ul>
  </div>
</section>`;
  }

  function about(a, interests) {
    return `
<section id="about" class="section" aria-labelledby="about-title">
  <div class="wrap about">
    <div>
      ${sectionHead('about', 'About')}
      ${a.paragraphs.map(t => `<p class="prose">${esc(t)}</p>`).join('')}
      <dl class="facts">
        <div><dt>Languages</dt><dd>${a.languages.map(esc).join(', ')}</dd></div>
        <div><dt>Background</dt><dd>${esc(a.background)}</dd></div>
      </dl>
    </div>
    <div>
      <h3 class="subhead" id="interests">Interests</h3>
      <ul class="interests">${interests.map(i => `<li id="about/${esc(i.id)}"><h4>${esc(i.title)}</h4><p>${esc(i.text)}</p></li>`).join('')}</ul>
    </div>
  </div>
</section>`;
  }

  function contact(p) {
    const rows = [
      ['mail', 'Email', p.email, mailto(p.email)],
      ['phone', 'Phone', p.phone, 'tel:' + p.phoneE164],
      ['linkedin', 'LinkedIn', p.linkedin.replace(/^https?:\/\/(www\.)?/, ''), p.linkedin],
      ['github', 'GitHub', p.github.replace(/^https?:\/\//, ''), p.github],
      ['file', 'Resume', 'Download PDF', p.resume]
    ];
    return `
<section id="contact" class="section section--alt" aria-labelledby="contact-title">
  <div class="wrap">
    ${sectionHead('contact', 'Contact', `Hiring for a new-grad role, or need a website for your business? Email is the best way to reach me. Based in ${esc(p.location)}.`)}
    <ul class="contact-list">${rows.map(([ic, label, text, href]) =>
      `<li><a href="${esc(href)}">${icon(ic)}<span><span class="contact-label">${label}</span><span class="contact-value">${esc(text)}</span></span></a></li>`).join('')}
    </ul>
  </div>
</section>`;
  }

  function main(site, verifiedCerts) {
    return [
      hero(site.profile),
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
