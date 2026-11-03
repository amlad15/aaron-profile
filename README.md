# Aaron Lad: Portfolio

**Live:** <https://amlad15.github.io/aaron-profile/>

A one-page portfolio (experience, freelance work, projects, skills, education, about, contact) set over a
solar system that you fly through as you scroll. Each section has its own planet; the camera travels one continuous
route past all of them. It's plain HTML, CSS and JavaScript with no build step: GitHub Pages serves the repo as-is.

---

## How the background scene works

### One planet per section

| Section | Planet |
|---|---|
| Top (hero) | Establishing shot from above the system, looking at the sun |
| Experience | Rocky, cratered world. One moon per role; the current role's moon pulses orange |
| Freelance & Services | Ocean world with its own drifting cloud layer |
| Projects | Banded gas giant with rings. One moon per project; a moon brightens while its row is open |
| Skills | Icy world with soft cracks |
| Education | Dune desert world |
| Certificates | Small cratered moon (only while that section is shown) |
| About | Earth-like world: continents, shallow seas, ice caps, clouds |
| Contact | Small moon with a relay satellite |

Every surface is generated in the browser from noise; there are no image textures. The planet you're at gets a thin
orange accent (the site's single accent colour); everything else stays in muted tones.

### The flight path

- **One route, scroll-locked.** The planets sit still at real distances from each other (hundreds of units apart,
  spiralling outward from the sun at different heights). The camera follows a single smooth spline through all of
  them, and your scroll position *is* a distance along that spline. Every pixel of scroll moves the camera forward;
  scrolling back flies you backward. Nothing switches targets or eases per section. The only smoothing is a light
  follow (`flight.damping`) so wheel steps don't judder. Native scrolling is never hijacked or snapped.
- **Planets go by.** Each planet starts as a dot ahead of you, grows, holds in frame, then slides past and drops
  behind. Between planets the camera is genuinely in transit:
  - stars in a deep volume around the route stream past, near ones faster than far ones;
  - dust rushes by;
  - the route skims small moonlets and runs in along the gas giant's ring plane.
- **Heading.** The camera faces along the route, looking slightly ahead, and turns toward the next planet only as it
  comes up. It banks gently into curves while travelling and levels out while a planet is framed.
- **Readability.** The route circles each planet from its sunlit side, with the planet on the camera's right.
  Planets enter from the right edge and leave off it, so they never sweep across the text. On wide screens
  (≥1100px) the planet sits in the right third. On narrower screens it sits behind the content, smaller and dimmer,
  under a stronger veil.

#### Pacing within a section

Each section's scroll span runs from its top reaching mid-screen to its bottom reaching mid-screen:

| Part of the section's scroll | What the camera does |
|---|---|
| First 25% | Finishes the trip in: the planet grows from a dot to full size |
| Middle 50% | Holds the planet framed, drifting slowly around it. Its best view is at the exact middle |
| Last 25% | Starts the trip out: the planet slides past and recedes |

The hero holds for the first 45% of the scroll before the first section, then sets off. A long section holds its
planet for longer; a short section gets a quicker trip. Each heading's reveal waits until its planet comes up
(with a 1.6s fallback), so text and planet arrive together.

### Transit and arrival effects

- **Warp streaks:** each nearby star leaves a trail from where it was on screen a moment ago, so the streaks are
  real motion: longer for near stars and faster scrolling. A fast fling becomes a hyperspace rush. They ease back
  to points shortly after you stop.
- **FOV punch:** the field of view widens a few degrees at speed and settles when you slow down.
- **No whip-pans:** at speed the camera stays pointed down the route instead of turning toward each planet it passes.
- **Arrival:** entering a planet's held view plays a rim of light across its atmosphere and briefly lifts its glow.
  The planet's spin slows while it's framed.
- **Extras (desktop, dark theme):** now and then a comet or a small cluster of asteroids drifts across the planet
  side of the frame as you leave a planet. Passing near the sun adds a soft lens flare.
- All of these fade out over the text column. Text contrast is checked to stay WCAG AA at every point on the route
  and at peak warp.

---

## Tuning: the `FX` object

Every tunable lives in one object at the top of [`js/scene/scene.js`](js/scene/scene.js). Change a number, reload.

### Spacing and pacing

| Setting | What it does | Default | Sensible range |
|---|---|---|---|
| `flight.travel` | Share of each section's scroll spent travelling in, and again travelling out. The rest (`1 − 2 × travel`) holds the planet | `0.25` | `0.15` – `0.35` |
| `flight.heroHold` | Share of the scroll before the first section that the opening shot holds | `0.45` | `0.2` – `0.7` |
| `flight.damping` | Per-frame follow toward the scroll position (1 = locked; lower = smoother but laggier) | `0.1` | `0.08` – `0.2` |
| `flight.holdDistance` | Viewing distance in planet radii. A planet's own `dist` in `BODIES` overrides it; phones use 1.5× | `7.6` | `6` – `11` |
| `flight.holdArc` | Degrees the camera drifts around a planet on each side of its best view | `9` | `4` – `15` |
| `flight.viewAngle` | How far round from the sun the planet is viewed, in degrees (0 = fully lit, 90 = half lit) | `50` | `30` – `70` |
| `flight.arc` | How far the route bows outward between planets (0 = straight) | `0.35` | `0` – `0.6` |
| `flight.flybys` / `flybyGap` | Skim a moonlet on every other trip, and how close it passes | `true` / `9` | gap `6` – `20` |
| `flight.lookAhead` | How far ahead along the route the camera looks while travelling | `45` | `20` – `90` |
| `flight.focusFalloff` | Share of each trip over which the camera turns toward the coming planet. Keep ≤ 0.5 so two planets never pull at once | `0.45` | `0.25` – `0.5` |
| `flight.bank` | Maximum roll into curves, in degrees | `6` | `0` – `10` |
| `flight.heroDistance` / `heroHeight` / `heroAngle` | Where the opening shot sits relative to the sun and the first planet | `330` / `120` / `0.55` | |

Three fields on each entry in `BODIES` set the **distances between planets**:
- `orbit`: distance from the sun;
- `angle`: position around the sun, increasing in route order;
- `lift`: height.

Larger gaps make planets start smaller and the trips feel longer.

**Scroll length** comes from the page itself. To give a trip more room, add vertical padding to the sections
(`.section` in `css/site.css`). Every section's span grows with its height, so its travel and hold phases stretch
with it.

### Stars and effects

| Setting | What it does | Default | Sensible range |
|---|---|---|---|
| `stars.near` | Stars in the volume around the route (phones use 900) | `2600` | `1000` – `5000` |
| `stars.tube` | How far from the route those stars spread | `320` | `150` – `600` |
| `stars.nearBoost` | Distance under which a near star is drawn larger (up to 2.2×) | `70` | `0` – `150` |
| `warp.length` | Longest streak, as a fraction of the screen | `0.25` | `0.1` – `0.4` |
| `warp.trail` | Seconds of motion each streak shows | `0.09` | `0.04` – `0.15` |
| `warp.radial` | Extra pull toward the vanishing point at full speed | `0.04` | `0` – `0.12` |
| `warp.startSpeed` / `fullSpeed` | Camera speed (route units per second) where streaks start and peak | `60` / `700` | keep `start < full` |
| `warp.attack` / `release` | Seconds for streaks to build up, and to fade after you stop | `0.12` / `0.5` | |
| `warp.starDim` | How much point stars dim while streaking | `0.4` | `0` – `0.8` |
| `warp.opacity` | Streak brightness | `0.85` | `0.4` – `1` |
| `fov.base` / `fov.punch` | Field of view, and extra degrees at full speed | `40` / `8` | `35`–`50` / `0`–`12` |
| `arrival.duration` / `sweep` / `glowLift` | Length and strength of the arrival rim light | `1.6` / `0.9` / `0.6` | |
| `arrival.spinSlow` | Spin of the framed planet relative to normal (1 = no slowdown) | `0.35` | `0.2` – `1` |
| `extras.chance` | Chance per departure of a comet or asteroids passing through | `0.4` | `0` – `1` |
| `extras.dust` / `dustBox` / `dustOpacity` | Near-camera dust: count, size of the box it fills around the camera, brightness | `260` / `80` / `0.55` | |
| `extras.flare` / `flareNear` / `flareFar` | Lens-flare brightness, and the distances from the sun where it is full and gone | `0.6` / `150` / `320` | keep `near < far` |
| `textFade` | Screen-width fractions where effects fade from none (first) to full (second) | `[0.5, 0.68]` | keep the first ≥ `0.45` |

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
link puts the camera at that point on the route immediately, with no fly-in and no warp.

## Fallbacks

| Situation | What visitors get |
|---|---|
| `prefers-reduced-motion` | No flight, warp, arrival or transit effects. One still per section (its planet's best view), cross-fading as the section changes. |
| Phones and tablets | The same flight, with planets viewed from further away behind a stronger veil; streaks and arrival effects stay; dust, comets and lens flare are skipped; fewer stars and lighter shaders. |
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
js/scene/scene.js     the solar system: FX config, bodies, camera pose, effects, render loop
js/scene/flight.js    the route spline and the scroll-to-distance mapping
js/scene/travel.js    transit effects: warp streaks, dust, comets/asteroids, lens flare
js/scene/shaders.js   GLSL for planets, atmosphere, sun, rings, stars, streaks
tools/render.mjs      prerender script (Node, no dependencies)
assets/               resume, certificates, project screenshots, social preview image
```
