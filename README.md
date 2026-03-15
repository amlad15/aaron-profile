# Aaron Lad — 3D Portfolio

Interactive solar-system portfolio built with **Three.js r128**, vanilla JS, and zero build tooling.

---

## Quick Start

### Option A — Local (simplest)

Because the site loads scripts from CDN you need to serve it over HTTP (not `file://`) to avoid CORS restrictions on some browsers.

```bash
# Python 3
python -m http.server 8080

# Node.js (npx)
npx serve .

# VS Code
Install the "Live Server" extension, right-click index.html → "Open with Live Server"
```

Then open **http://localhost:8080** in your browser.

### Option B — Deploy (zero config)

| Platform | Steps |
|----------|-------|
| **GitHub Pages** | Push folder to a repo → Settings → Pages → Deploy from branch |
| **Netlify**      | Drag & drop the folder onto [netlify.com/drop](https://netlify.com/drop) |
| **Vercel**       | `npx vercel` inside the folder |

No build step, no npm install required.

---

## Project Structure

```
portfolio/
├── index.html               ← Entry point; loads all CDN + app scripts
├── README.md
├── assets/
│   ├── textures/            ← Optional planet/sun PNGs (not required)
│   └── images/              ← Project screenshots, headshots
├── css/
│   └── styles.css           ← All overlay / HUD / panel styles
├── js/
│   ├── planet-data.js       ← ★ EDIT THIS FILE to update content
│   ├── particles.js         ← Stars + comet particle system
│   ├── solar-system.js      ← Sun, planets, moons, orbit rings
│   ├── camera.js            ← OrbitControls + TWEEN transitions
│   ├── ui.js                ← DOM: HUD, info panel, tooltip
│   ├── interactions.js      ← Raycasting, clicks, keyboard
│   └── main.js              ← Scene init + render loop
└── libs/                    ← Reserved for offline copies if needed
```

---

## Updating Content

**All portfolio content lives in `js/planet-data.js`.** No other file needs to change.

Each planet has a `moons` array. Each moon uses this shape:

```js
{
  id:          "unique-id",           // must be unique across all moons
  title:       "Display Title",
  subtitle:    "Company / Stack / Institution",
  description: "Body text shown in the info panel.",
  image:       "assets/images/project.png",  // leave "" to hide
  tags:        ["React", "Node.js"],
  link:        "https://github.com/..."       // leave "#" for no button
}
```

### The Six Planets

| Planet | Category | Colour |
|--------|----------|--------|
| NEXUS  | Experience | Deep Crimson |
| FORGE  | Projects | Electric Blue |
| MATRIX | Technical Skills | Matrix Green |
| CITADEL | Education | Emerald |
| PULSE  | Interests & Extracurriculars | Violet |
| SIGNAL | Contact & Links | Cyan |

> **SIGNAL** moons automatically open their `link` in a new tab when clicked.

---

## Controls

| Input | Action |
|-------|--------|
| Left-click + drag | Rotate orbit |
| Right-click + drag / two-finger | Pan |
| Scroll / pinch | Zoom |
| Click planet | Focus planet, reveal moons |
| Click moon | Open info panel |
| Click sun | Return to overview |
| `Escape` | Return to overview |
| `Arrow keys` | Rotate / zoom camera |
| `+` / `-` | Zoom in / out |

---

## Dependencies (CDN, no install)

| Library | Version | Purpose |
|---------|---------|---------|
| three.js | r128 | 3D rendering |
| OrbitControls | r128 | Mouse/touch camera |
| TWEEN.js | 18.6.4 | Smooth transitions |

---

## Adding Real Images

1. Drop screenshots or photos into `assets/images/`
2. Reference them in `planet-data.js` as `"assets/images/filename.png"`

---

## Customising the Sun

Edit the `sun` object at the top of `js/planet-data.js`:

```js
sun: {
  name:     "Aaron",
  fullName: "Aaron Lad",
  tagline:  "CS @ University of Alberta | Edmonton, Alberta, Canada"
}
```
