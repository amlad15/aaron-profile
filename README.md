# Aaron Lad: Portfolio

**Live:** <https://amlad15.github.io/aaron-profile/>

A one-page portfolio (experience, freelance work, projects, skills, education, about, contact) set over a
scroll-driven solar system. As you scroll, a camera flies through the system and stops at a different planet
for each section. It's plain HTML, CSS and JavaScript with no build step: GitHub Pages serves the repo as-is.

---

## How the background scene works

### One planet per section

| Section | Planet |
|---|---|
| Top (hero) | Wide establishing shot of the whole system, slowly orbiting |
| Experience | Rocky, cratered world. One moon per role; the current role's moon pulses orange |
| Freelance & Services | Ocean world with its own drifting cloud layer |
| Projects | Banded gas giant with rings. One moon per project; a moon brightens while its row is open |
| Skills | Icy world with soft cracks |
| Education | Dune desert world |
| Certificates | Small cratered moon (only while that section is shown) |
| About | Earth-like world: continents, shallow seas, ice caps, clouds |
| Contact | Small moon with a relay satellite, then a final pull-back to a wide shot |

Every surface is generated in the browser from noise; there are no image textures. The planet for the section
you're reading gets a thin orange accent (the site's single accent colour); everything else stays in muted tones.

### The camera path

- Your scroll position is mapped to a point along a smooth path through all the planets. The camera eases toward
  that point every frame, so it glides even when you scroll fast. Native scrolling is never hijacked or snapped.
- Each journey starts when the next section enters the bottom of the screen and **arrives when its heading is about
  halfway up**. The heading's reveal waits for that arrival, so text and planet land together.
- Between planets the path **arcs outward** rather than sliding straight, the camera **banks** a few degrees into the
  curve, and it **looks ahead** in the direction of travel mid-journey before settling on the next planet.
- On wide screens (≥1100px) the planet sits in the right third, clear of the text. On narrower screens it sits
  behind the content, smaller and dimmer, under a stronger veil.

### Transit and arrival effects

- **Warp streaks:** the faster you move, the more the nearby stars stretch into lines pointing back along the
  direction of travel. A slow scroll barely stretches them; a fast fling becomes a hyperspace rush. They ease back
  to points shortly after you stop.
- **FOV punch:** the field of view widens a few degrees at speed and settles on arrival.
- **Arrival:** a rim of light sweeps across the planet's atmosphere and its glow lifts briefly, then settles.
  The planet's spin slows, as if the camera has matched its orbit.
- **In transit (desktop, dark theme):** dust motes near the camera streak with speed; now and then a comet or a
  small cluster of asteroids drifts across the planet side of the frame; passing close to the sun adds a soft lens flare.
- All of these fade out over the text column, and text contrast is checked to stay WCAG AA at peak warp.

---

## Tuning the effects: the `FX` object

Every strength lives in one object at the top of [`js/scene/scene.js`](js/scene/scene.js). Change a number, reload.

| Setting | What it does | Default | Sensible range |
|---|---|---|---|
| `warp.length` | Maximum streak length (fraction of the screen) at full speed | `0.16` | `0.05` – `0.3` |
| `warp.startSpeed` | Speed (sections per second) before streaks begin; raise it so slow scrolling never streaks | `0.35` | `0.2` – `0.8` |
| `warp.fullSpeed` | Speed at which streaks reach full length | `2.4` | `1.5` – `4` |
| `warp.attack` | Seconds for streaks to build up | `0.15` | `0.05` – `0.4` |
| `warp.release` | Seconds for streaks to ease back to points after you stop | `0.6` | `0.3` – `1.2` |
| `warp.starDim` | How much the point stars dim while streaking (0 = not at all) | `0.45` | `0` – `0.8` |
| `warp.opacity` | Streak brightness | `0.85` | `0.4` – `1` |
| `fov.base` | Normal field of view, in degrees | `40` | `35` – `50` |
| `fov.punch` | Extra degrees at full speed | `8` | `0` – `12` |
| `path.arc` | How far the path bows outward between planets (0 = straight) | `0.45` | `0` – `0.8` |
| `path.bank` | Roll into curves, in degrees | `4` | `0` – `8` |
| `path.lookAhead` | How much the camera faces its direction of travel mid-journey (0 = always at the next planet) | `0.55` | `0` – `0.8` |
| `arrival.duration` | Length of the arrival sweep, in seconds | `1.6` | `0.8` – `2.5` |
| `arrival.sweep` | Brightness of the rim-light sweep | `0.9` | `0` – `1.5` |
| `arrival.glowLift` | How much the atmosphere glow lifts on arrival | `0.6` | `0` – `1.2` |
| `arrival.spinSlow` | Spin speed of the focused planet relative to normal (1 = no slowdown) | `0.35` | `0.2` – `1` |
| `extras.chance` | Chance per journey of a comet or asteroids passing through | `0.4` | `0` – `1` |
| `extras.dust` | Number of near-camera dust motes | `260` | `0` – `600` |
| `extras.dustOpacity` | Dust brightness | `0.55` | `0` – `0.8` |
| `extras.flare` | Lens-flare brightness near the sun | `0.6` | `0` – `1` |
| `extras.flareNear` / `flareFar` | Camera distance from the sun where the flare is full / gone | `90` / `210` | keep `near < far` |
| `textFade` | Screen-width fractions where effects fade from none (first) to full (second) | `[0.5, 0.68]` | keep the first ≥ `0.45` so effects stay clear of the text |

If you make effects much stronger, re-check text contrast: the text column must stay readable at peak warp.

---

## Editing content

All content lives in **[`js/content.js`](js/content.js)**. The page and the scene both read it.

```bash
# 1. edit js/content.js
# 2. write the content into index.html (so it's there without JavaScript and for search engines)
node tools/render.mjs
# 3. commit and push
git add js/content.js index.html sitemap.xml
git commit -m "Update content"
git push
```

GitHub Pages redeploys within a minute or two. If you forget step 2, the page still shows the new content (it
re-renders from `content.js` and logs a console warning), but run it anyway so no-JS visitors and search engines see it.

Conventions in `content.js`:

- `null` means not ready yet; that field is hidden on the site. `// TODO:` comments list what's still open.
- Projects: `launch: "YYYY-MM"` sets the date (`null` shows a dash), `result` is the one-line outcome shown in the
  collapsed row, `minor: true` moves a project into *Side missions*, and `image` / `imageAlt` add a screenshot
  (see `assets/projects/README.txt`). `repoPublic: false` / `liveReady: false` keep a link in the data but hide its button.
- Certificates appear automatically once their file in `assets/certificates/` is a real PDF.

## Previewing locally

The live site sits under `/aaron-profile/`, so serve the folder *above* the repo to get the same paths:

```bash
cd ..                      # the folder that contains aaron-profile/
python -m http.server 8080
# open http://localhost:8080/aaron-profile/
```

Deep links work on any section or card, e.g. `#projects`, `#projects/deepforge`, `#experience/guidepost`. Loading a deep
link puts the camera at that section immediately, with no fly-in and no warp.

## Fallbacks

| Situation | What visitors get |
|---|---|
| `prefers-reduced-motion` | No camera flights, warp, arrival or transit effects. One still frame per section, cross-fading as the section changes. |
| Phones and tablets | Smaller planets behind a stronger veil; warp streaks and arrival effects stay; dust, comets and lens flare are skipped; fewer stars and lighter shaders. |
| JavaScript off | A static CSS starfield behind the full page. Everything else works: the content is plain HTML. |
| No WebGL2, or a software renderer (blocklisted GPU, audit and CI machines) | The same static starfield. Add `?scene=force` to the URL to run the scene anyway for testing. |

The scene loads on the first scroll, touch, key, wheel or pointer movement, or about 2.5 seconds after the page
loads, whichever comes first. Until it fades in, the static starfield is shown.

## Tech and licences

- **Three.js 0.186.1**, loaded as ES modules from jsDelivr via the import map in `index.html` (MIT licence).
- **Noise:** 3D simplex noise by Ashima Arts / Stefan Gustavson (MIT licence), in `js/scene/shaders.js`.
- **Fonts** (Google Fonts, SIL Open Font License 1.1): Big Shoulders Display (headings), Public Sans (body),
  IBM Plex Mono (dates and labels).
- **Assets:** no third-party images or textures. Planets, rings, flare and starfield are generated in code; project
  screenshots and the social preview image are original captures of this site and its projects.

## Structure

```
index.html            page shell + prerendered content (between build markers)
css/site.css          page styles, including the scene layering and fallback starfield
js/content.js         all content
js/render.js          turns content.js into HTML (used by the page and tools/render.mjs)
js/site.js            menu, theme, active section, deep links, reveals, certificate check, scene loader
js/scene/scene.js     the solar system: FX config, bodies, camera path, render loop
js/scene/travel.js    transit effects: warp streaks, dust, comets/asteroids, lens flare
js/scene/shaders.js   GLSL for planets, atmosphere, sun, rings, stars, streaks
tools/render.mjs      prerender script (Node, no dependencies)
assets/               resume, certificates, project screenshots, social preview image
```
