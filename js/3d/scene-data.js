/**
 * scene-data.js: maps SITE (js/content.js) onto planets and moons.
 * No content lives here, only layout (orbits, colours, textures), so the
 * 3D mode and the page always show the same facts.
 */

/* Plain section names; colours tuned to sit with the page palette (one green only) */
const SCENE_LAYOUT = {
  experience:   { color: 0xF5B544, texture: 'mars',     size: 10 },
  services:     { color: 0xF28C6B, texture: 'volcanic', size: 9 },
  projects:     { color: 0x6EA8FE, texture: 'neptune',  size: 11 },
  skills:       { color: 0x4FD1C5, texture: 'toxic',    size: 10 },
  education:    { color: 0xA78BFA, texture: 'earth',    size: 9 },
  certificates: { color: 0xE9C98A, texture: 'moon',     size: 8 },
  interests:    { color: 0xF472B6, texture: 'jupiter',  size: 9 },
  contact:      { color: 0x93C5FD, texture: 'ice',      size: 9 }
};

function buildScene(SITE, certs) {
  const p = SITE.profile;
  const ext = (label, href) => ({ label, href, external: /^https?:/.test(href) });

  const sections = [
    {
      id: 'experience', label: 'Experience',
      moons: SITE.experience.map(e => ({
        id: e.id, title: e.org.replace(/ (Ltd\.|Inc\.|L\.L\.C\.)$/, ''),   // labels stay short but never truncated
        panel: {
          kicker: 'Experience', title: e.role, subtitle: e.org,
          meta: [e.dates, e.location, e.type].filter(Boolean).join(' · '),
          bullets: e.bullets, tags: e.tags,
          links: (e.links || []).map(l => ext(l.label, l.href)),
          page: '#experience/' + e.id
        }
      }))
    },
    {
      id: 'services', label: 'Services',
      moons: [
        {
          id: SITE.services.caseStudy.id, title: 'Case study: ' + SITE.services.caseStudy.title,
          panel: {
            kicker: 'Freelance case study', title: SITE.services.caseStudy.title,
            subtitle: SITE.services.caseStudy.client + ' · ' + SITE.services.caseStudy.sector,
            bullets: SITE.services.caseStudy.points,
            links: [ext('Visit ' + SITE.services.caseStudy.title, SITE.services.caseStudy.href)],
            page: '#services/' + SITE.services.caseStudy.id
          }
        },
        {
          id: 'offerings', title: 'What I offer',
          panel: {
            kicker: 'Freelance & Services', title: 'What I offer', text: [SITE.services.intro],
            bullets: SITE.services.offerings.map(o => o.title + ': ' + o.text),
            links: [{ label: SITE.services.cta.label, href: 'mailto:' + p.email + '?subject=' + encodeURIComponent(SITE.services.cta.subject) }],
            page: '#services'
          }
        }
      ]
    },
    {
      id: 'projects', label: 'Projects',
      moons: SITE.projects.map(pr => ({
        id: pr.id, title: pr.title,
        panel: {
          kicker: 'Project', title: pr.title, meta: pr.dates, text: [pr.summary],
          bullets: pr.bullets, tags: pr.tags,
          links: [
            pr.repo && pr.repoPublic !== false ? ext('Code on GitHub', pr.repo) : null,   // same visibility rules as the page
            pr.live && pr.liveReady !== false ? ext(pr.liveLabel || 'Live demo', pr.live) : null
          ].filter(Boolean),
          page: '#projects/' + pr.id
        }
      }))
    },
    {
      id: 'skills', label: 'Skills',
      moons: SITE.skills.map((g, i) => ({
        id: 'skills-' + i, title: g.title,
        panel: { kicker: 'Skills', title: g.title, subtitle: g.note, tags: g.items, page: '#skills' }
      }))
    },
    {
      id: 'education', label: 'Education',
      moons: SITE.education.map(e => ({
        id: e.id, title: e.school,
        panel: {
          kicker: 'Education', title: e.degree, subtitle: e.school + (e.minor ? ' · ' + e.minor : ''),
          meta: (e.end ? e.start + ' – ' + e.end : 'Since ' + e.start) + ' · ' + e.location,
          bullets: e.awards, page: '#education'
        }
      }))
    },
    {
      id: 'certificates', label: 'Certificates',
      moons: certs.map(c => ({
        id: c.id, title: c.title,
        panel: { kicker: 'Certificate', title: c.title, subtitle: c.issuer, meta: c.date, links: [{ label: 'View certificate (PDF)', href: c.file, external: true }], page: '#certificates' }
      }))
    },
    {
      id: 'interests', label: 'Interests',
      moons: SITE.interests.map(i => ({
        id: i.id, title: i.title,
        panel: { kicker: 'Interests', title: i.title, text: [i.text], page: '#about/' + i.id }
      }))
    },
    {
      id: 'contact', label: 'Contact',
      moons: [
        { id: 'c-email',    title: 'Email',    panel: { kicker: 'Contact', title: 'Email',    links: [{ label: p.email, href: 'mailto:' + p.email }], page: '#contact' } },
        { id: 'c-phone',    title: 'Phone',    panel: { kicker: 'Contact', title: 'Phone',    links: [{ label: p.phone, href: 'tel:' + p.phoneE164 }], page: '#contact' } },
        { id: 'c-linkedin', title: 'LinkedIn', panel: { kicker: 'Contact', title: 'LinkedIn', links: [ext('Open LinkedIn profile', p.linkedin)], page: '#contact' } },
        { id: 'c-github',   title: 'GitHub',   panel: { kicker: 'Contact', title: 'GitHub',   links: [ext('Open GitHub profile', p.github)], page: '#contact' } },
        { id: 'c-resume',   title: 'Resume',   panel: { kicker: 'Contact', title: 'Resume',   links: [{ label: 'Download resume (PDF)', href: p.resume, external: true }], page: '#contact' } }
      ]
    }
  ].filter(s => s.moons.length);                              // no certificates yet = no empty planet

  const planets = sections.map((s, i) => Object.assign({}, s, SCENE_LAYOUT[s.id], {
    orbitRadius: 105 + i * 62,
    orbitSpeed:  0.2 - i * 0.018,                             // outer planets slower, like the real thing
    tilt:        [0.2, 0.15, 0.3, 0.1, 0.25, 0.2, 0.35, 0.15][i % 8]
  }));

  return {
    sun: {
      label: 'About',
      panel: {
        kicker: 'About', title: p.name, subtitle: p.pitch, text: SITE.about.paragraphs,
        bullets: ['Languages: ' + SITE.about.languages.join(', '), SITE.about.background],
        links: [{ label: 'Email', href: 'mailto:' + p.email }, ext('LinkedIn', p.linkedin), ext('GitHub', p.github)],
        page: '#about'
      }
    },
    planets,
    outerRadius: planets.length ? planets[planets.length - 1].orbitRadius : 300
  };
}
