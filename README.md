# Aaron Lad: Portfolio

A fast, scrolling portfolio with a scroll-driven solar system as its living background.
Plain HTML, CSS and JavaScript. No build step is needed to deploy: GitHub Pages serves the repo as-is at
<https://amlad15.github.io/aaron-profile/>.

## Edit content

All content lives in **`js/content.js`**. The page renders it, and the background scene reads the same sections.

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
- Projects (the "mission log"): `launch: "YYYY-MM"` sets the row date (`null` shows a dash), `result` is the one-line outcome
  shown while collapsed (facts only), and `minor: true` moves a project into *Side missions*.
- `profile.status` is a list; each item becomes one part of the hero status line.
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
js/content.js         ★ all content
js/render.js          SITE → HTML (shared by the page and tools/render.mjs)
js/site.js            menu, theme, active section, deep links, certificate check, scene loader
js/scene/             background solar system: shaders.js (GLSL) + scene.js (bodies, scroll camera, loop)
tools/render.mjs      prerender script (Node, no dependencies)
assets/               resume, certificates, project screenshots, social preview image
```

## Deep links

Every section and card has a link: `#projects`, `#projects/gcid`, `#experience/guidepost`,
`#services/aerocool-case`. Loading a deep link puts the background camera at that section immediately (no fly-in).

## Design system

- **Type:** Big Shoulders Display (headings), Public Sans (body), IBM Plex Mono (metadata only: dates, stacks, labels).
- **Colour:** near-black or warm paper, plus one accent (international orange) used for the status beacon, current role, open rows and primary actions.
- **Themes:** follows the system setting; the header toggle overrides it and remembers the choice.
- **Motion:** one easing curve. Hero intro under 1.2s, staggered scroll reveal, animated `<details>`. All of it is off under `prefers-reduced-motion`.

## Background scene (`js/scene/`)

One fixed WebGL canvas sits behind the content. Scroll position maps to a point on a Catmull-Rom camera path through
one planet per section, and the camera eases toward it every frame. Native scrolling is never intercepted.

| Section | Planet |
|---|---|
| Hero | Wide establishing shot of the whole system, slowly orbiting |
| Experience | Rocky, cratered world; one moon per role, the current role's moon pulses orange |
| Freelance & Services | Ocean world with a separate drifting cloud layer |
| Projects | Banded gas giant with canvas-generated rings; one moon per project, brightening when its row is open |
| Skills | Icy world with soft cracks |
| Education | Dune desert world |
| Certificates | Small cratered moon, only while that section is shown |
| About | Terran world: continents, shallows, ice caps, clouds |
| Contact | Small moon with an orbiting relay satellite, then a final pull-back wide shot |

- **Rendering:** three.js 0.186.1 as ES modules via the import map in `index.html` (jsDelivr, pinned). Surfaces are
  procedural GLSL (3D simplex noise + fbm, Ashima Arts / Stefan Gustavson, MIT). No textures are shipped.
- **Light theme:** the scene switches to an ink-on-paper "star chart" (contours, hatching, graticule) rather than an inverted dark render.
- **Performance:** built after `load` + idle so it never affects first paint. DPR capped (1.5 desktop, 1 mobile), fewer
  octaves/segments/stars on phones, renders at ~30fps once the camera settles, pauses when the tab is hidden.
  On start it times a few frames and drops bloom, then resolution, if the GPU can't hold ~8ms/frame.
- **Fallbacks:** reduced motion shows one still per section with a cross-fade. With JS off, or without WebGL2 (required by
  current three.js), a static CSS starfield is shown instead. The content works the same either way.
