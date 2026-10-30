# Aaron Lad: Portfolio

A fast, scrolling portfolio with an optional **Explore in 3D** solar-system mode.
Plain HTML, CSS and JavaScript. No build step is needed to deploy: GitHub Pages serves the repo as-is at
<https://amlad15.github.io/aaron-profile/>.

## Edit content

All content lives in **`js/content.js`**. Both the page and the 3D mode read it.

```bash
# 1. edit js/content.js
# 2. write the content into index.html (so it works without JS and for search engines)
node tools/render.mjs
# 3. commit index.html, js/content.js and sitemap.xml
```

If you forget step 2, the site still shows the new content: `js/site.js` notices the HTML is stale,
re-renders from `content.js`, and logs a warning in the console.

Conventions in `content.js`:

- `null` means not ready yet, and the field is hidden on the site.
- `// TODO:` comments list what's still open (summarised at the top of the file).
- `repoPublic: false` / `liveReady: false` keep a link in the data but hide its button.
- `image: null` shows a placeholder. Add screenshots per `assets/projects/README.txt`.
- Certificates only appear once their file is a real PDF (see `assets/certificates/README.txt`).

## Preview locally

The site lives under a `/aaron-profile/` subpath on Pages, so serve the parent folder to test the same paths:

```bash
cd ..                      # the folder that contains aaron-profile/
python -m http.server 8080
# open http://localhost:8080/aaron-profile/
```

## Structure

```
index.html            page shell + prerendered content (between build markers)
css/site.css          page styles
css/3d.css            3D mode styles (loaded on first open)
js/content.js         ★ all content
js/render.js          SITE → HTML (shared by the page and tools/render.mjs)
js/site.js            menu, active section, deep links, certificate check, 3D loader
js/3d/                Three.js r128 solar system, loaded only when 3D mode opens
tools/render.mjs      prerender script (Node, no dependencies)
assets/               resume, certificates, project screenshots, social preview image
```

## Deep links

Every section and card has a link: `#projects`, `#projects/gcid`, `#experience/guidepost`,
`#services/aerocool-case`. `#3d` opens the 3D mode.

## 3D mode

- Opened from the hero or footer, and loaded on demand (about 600 KB of Three.js is never fetched otherwise).
- A section list (or a chip bar on phones) and clickable labels. Orbits pause while you hover.
- Escape steps back from the panel, to the overview, then exits.
- Respects `prefers-reduced-motion` (static scene, instant camera). Phones and low-memory devices get a lighter scene.
