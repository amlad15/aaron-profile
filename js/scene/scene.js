/**
 * scene.js: the solar system behind the page. The camera flies one continuous route through it (flight.js);
 * scroll position is a distance along that route. Native scrolling is never touched.
 * Loaded by site.js after first paint; the page is complete without it.
 */
import * as THREE from 'three';
import {
  BODY_VS, PLANET_FS, CLOUD_FS, ATMO_FS, SUN_FS, CORONA_VS, CORONA_FS,
  RING_VS, RING_FS, STAR_VS, STAR_FS, NEBULA_FS
} from './shaders.js';
import { createStreaks, createDust, createExtras, createFlare } from './travel.js';
import { createFlight } from './flight.js';

// Every tunable in one place. README.md explains each setting and a sensible range.
export const FX = {
  flight:  { damping: 0.1, travel: 0.25, heroHold: 0.45, holdArc: 9, holdDistance: 7.6, viewAngle: 50, arc: 0.35, lookAhead: 45,
             focusFalloff: 0.45, bank: 6, flybys: true, flybyGap: 9, heroDistance: 330, heroHeight: 120, heroAngle: 0.55 },
  stars:   { near: 2600, tube: 320, nearBoost: 70 },
  warp:    { length: 0.25, trail: 0.09, radial: 0.04, startSpeed: 60, fullSpeed: 700, attack: 0.12, release: 0.5, starDim: 0.4, opacity: 0.85 },
  fov:     { base: 40, punch: 8 },
  arrival: { duration: 1.6, sweep: 0.9, glowLift: 0.6, spinSlow: 0.35 },
  extras:  { chance: 0.4, dust: 260, dustBox: 80, dustOpacity: 0.55, flare: 0.6, flareNear: 150, flareFar: 320 },
  textFade: [0.5, 0.68]
};

THREE.ColorManagement.enabled = false;                       // palette hexes are display colours; skip linear conversion

const C = hex => new THREE.Color(hex);
const UP = new THREE.Vector3(0, 1, 0);

// Section → body, in route order. Planets sit still at real distances (orbit = distance from the sun, lift = height
// off the ecliptic); the route spirals outward past them.
// Styles: 0 rocky, 1 gas giant, 2 ice, 3 ocean, 4 desert, 5 terran, 6 small cratered moon
export const BODIES = [
  { section: 'experience',   style: 0, orbit: 138, angle: 0.35, lift: 6,   radius: 3.4, seed: 1.3, colors: ['#3E3832', '#857A6C', '#CEC4B4', '#000000'], atmo: '#C9A98A', moons: '#experience .tl-item', pulseFirst: true },
  { section: 'services',     style: 3, orbit: 198, angle: 1.2,  lift: -14, radius: 3.8, seed: 4.1, colors: ['#172329', '#30505C', '#000000', '#000000'], atmo: '#8FB6C6', clouds: 0.85 },
  { section: 'projects',     style: 1, orbit: 282, angle: 2.05, lift: 10,  radius: 8.0, seed: 2.7, colors: ['#D9CCB3', '#8A795F', '#B8A07C', '#5B4B39'], atmo: '#D9C7A6', rings: true, moons: '#projects .mission', dist: 11 },
  { section: 'skills',       style: 2, orbit: 360, angle: 2.9,  lift: 24,  radius: 3.6, seed: 7.7, colors: ['#BCC6CC', '#8C9DA6', '#6A7E89', '#000000'], atmo: '#B5CCD8' },   // kept below the bloom threshold
  { section: 'education',    style: 4, orbit: 426, angle: 3.7,  lift: 4,   radius: 3.1, seed: 5.5, colors: ['#C4AC87', '#7B674D', '#E6D5B7', '#000000'], atmo: '#E2CBA5' },
  { section: 'certificates', style: 6, orbit: 474, angle: 4.35, lift: -12, radius: 2.0, seed: 9.2, colors: ['#8E8A82', '#56534D', '#BAB5AB', '#000000'], atmo: '#BDB7AC' },
  { section: 'about',        style: 5, orbit: 528, angle: 5.0,  lift: 8,   radius: 4.1, seed: 3.3, colors: ['#1A2930', '#6B6550', '#9C9173', '#ECE9E1'], atmo: '#9CC2D2', clouds: 0.7 },
  { section: 'contact',      style: 6, orbit: 612, angle: 5.75, lift: 30,  radius: 2.9, seed: 6.6, colors: ['#9C978D', '#5C5852', '#CCC6B9', '#000000'], atmo: '#C9C3B6', satellite: true }
];

export const THEME = {
  dark:  { bg: '#0B0C0E', ink: '#17181B', paper: '#F3F0E8', accent: '#FF6A2B', star: '#ECE8DF', orbit: ['#ECE8DF', 0.07] },
  chart: { bg: '#F3F0E8', ink: '#2A2B2F', paper: '#F3F0E8', accent: '#B4380A', star: '#2A2B2F', orbit: ['#2A2B2F', 0.2] }
};

const yieldToBrowser = () => new Promise(r => (window.requestIdleCallback ? requestIdleCallback(() => r(), { timeout: 120 }) : setTimeout(r, 16)));

/* Deterministic RNG so the starfield and rings look the same on every visit */
function rng(seed) { let s = seed >>> 0; return () => ((s = Math.imul(s ^ (s >>> 15), 0x2c1b3c6d) + 0x9e3779b9 >>> 0) / 4294967296); }

export async function start({ canvas, isChart }) {
  const lite = matchMedia('(max-width: 767px), (pointer: coarse)').matches;   // phones/tablets: lighter everything
  const reducedMQ = matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = reducedMQ.matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !lite, powerPreference: lite ? 'low-power' : 'high-performance' });
  renderer.debug.checkShaderErrors = location.hostname === 'localhost';   // status queries are synchronous: only pay for them while developing
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, lite ? 1 : 1.5));
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;   // with colour management off this is a pass-through
  const size = () => [canvas.clientWidth || innerWidth, canvas.clientHeight || innerHeight];
  renderer.setSize(...size(), false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FX.fov.base, size()[0] / size()[1], 0.1, 9000);
  const ghost = camera.clone();                              // where the camera was a moment ago: streak tails
  const OCT = lite ? 3 : 5;                                  // fbm octaves: the biggest single GPU cost
  const SEG = lite ? 48 : 112;

  // Uniform objects shared by reference across every material, so one write updates the whole scene
  const U = {
    uTime: { value: 0 }, uChart: { value: 0 }, uSun: { value: new THREE.Vector3() },
    uPaper: { value: C('#F3F0E8') }, uInk: { value: C('#2A2B2F') }, uAccentCol: { value: C('#FF6A2B') },
    uSweep: { value: FX.arrival.sweep }, uLift: { value: FX.arrival.glowLift }
  };
  // Shared by the streak and dust layers
  const TU = {
    uWarp: { value: 0 }, uLen: { value: FX.warp.length }, uRadial: { value: FX.warp.radial }, uFlip: { value: 1 }, uVP: { value: new THREE.Vector2() },
    uPrevVP: { value: new THREE.Matrix4() }, uFade: { value: new THREE.Vector2(...FX.textFade) }, uWide: { value: 1 }
  };

  /* ── Sun ─────────────────────────────────────────────────────────── */
  const sunMat = new THREE.ShaderMaterial({ vertexShader: BODY_VS, fragmentShader: SUN_FS, defines: { OCTAVES: OCT - 1 }, uniforms: { ...U } });
  const sun = new THREE.Mesh(new THREE.SphereGeometry(9, SEG, SEG / 2), sunMat);
  sun.scale.setScalar(1.6);                                  // scaled, not rebuilt, so the surface detail keeps its size
  scene.add(sun);
  const coronaMat = new THREE.ShaderMaterial({ vertexShader: CORONA_VS, fragmentShader: CORONA_FS, defines: { OCTAVES: 2 }, uniforms: { ...U },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const corona = new THREE.Mesh(new THREE.PlaneGeometry(64, 64), coronaMat);
  corona.scale.setScalar(1.6);
  scene.add(corona);
  scene.add(new THREE.AmbientLight(0xffffff, 0.08));
  scene.add(new THREE.PointLight(0xfff1e0, 2.2, 0, 0));    // only the satellite and asteroids use standard lighting; decay 0 so distance doesn't matter

  /* ── Far stars: three distant shells, the backdrop ───────────────── */
  const starMats = [];
  const rand = rng(42);
  const starMaterial = near => {
    const m = new THREE.ShaderMaterial({ vertexShader: STAR_VS, fragmentShader: STAR_FS, transparent: true, depthWrite: false,
      uniforms: { ...U, uPR: { value: renderer.getPixelRatio() }, uColor: { value: C('#ECE8DF') }, uDim: { value: 0 }, uNear: { value: near } } });
    starMats.push(m);
    return m;
  };
  const pointsOf = (pos, s0, s1, r, mat) => {
    const n = pos.length / 3, sz = new Float32Array(n), ph = new Float32Array(n);
    for (let i = 0; i < n; i++) { sz[i] = s0 + (s1 - s0) * Math.pow(r(), 3); ph[i] = r() * 6.283; }   // mostly small, a few bright
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
    g.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
    const p = new THREE.Points(g, mat);
    p.frustumCulled = false;
    return p;
  };
  [[lite ? 400 : 1600, 1800, 1.5, 2.4], [lite ? 300 : 1300, 2600, 1.2, 2.0], [lite ? 250 : 1100, 3400, 0.9, 1.5]].forEach(([n, r, s0, s1]) => {
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = rand() * 2 - 1, a = rand() * Math.PI * 2, rr = r * (0.9 + rand() * 0.2), q = Math.sqrt(1 - u * u);
      pos.set([Math.cos(a) * q * rr, u * rr * 0.7, Math.sin(a) * q * rr], i * 3);   // flattened a little toward the ecliptic
    }
    scene.add(pointsOf(pos, s0, s1, rand, starMaterial(0)));
  });
  let nearStars = null, streaks = null;                      // built along the route once it exists

  const dust = lite ? null : createDust(FX.extras.dust, FX.extras.dustBox, TU, rng(9));   // phones skip dust, comets and flare
  if (dust) scene.add(dust);
  const extras = lite ? null : createExtras(scene, rng(11));
  const flare = lite ? null : createFlare();

  /* ── Nebula wash (dark theme only) ───────────────────────────────── */
  const nebula = new THREE.Mesh(new THREE.SphereGeometry(3800, 32, 16),
    new THREE.ShaderMaterial({ vertexShader: BODY_VS, fragmentShader: NEBULA_FS, side: THREE.BackSide, depthWrite: false,
      defines: { OCTAVES: lite ? 2 : 4 }, uniforms: { uStrength: { value: 0.32 } } }));
  scene.add(nebula);

  await yieldToBrowser();

  /* ── Planets ─────────────────────────────────────────────────────── */
  const ringTex = makeRingTexture();
  const bodies = [];
  for (const b of BODIES) {
    const el = document.getElementById(b.section);
    if (!el) continue;
    const group = new THREE.Group();
    group.position.set(Math.cos(b.angle) * b.orbit, b.lift, -Math.sin(b.angle) * b.orbit);
    const spin = new THREE.Group();                          // surface spins; atmosphere and rings don't need to
    spin.rotation.z = 0.18 + b.seed * 0.03;                  // a little axial tilt each
    group.add(spin);
    const mat = planetMaterial(b.style, b.colors, b.seed, lite ? 0 : 0.08, OCT, U);   // bump costs 3 extra relief taps; phones skip it
    spin.add(new THREE.Mesh(new THREE.SphereGeometry(b.radius, SEG, SEG / 2), mat));
    const atmo = new THREE.Mesh(new THREE.SphereGeometry(b.radius * 1.06, SEG / 2, SEG / 4),
      new THREE.ShaderMaterial({ vertexShader: BODY_VS, fragmentShader: ATMO_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { ...U, uAtmo: { value: C(b.atmo) }, uAccent: { value: 0 }, uStrength: { value: 0.8 }, uArrive: { value: 0 } } }));
    group.add(atmo);
    let clouds = null;
    if (b.clouds) {
      clouds = new THREE.Mesh(new THREE.SphereGeometry(b.radius * 1.015, SEG, SEG / 2),
        new THREE.ShaderMaterial({ vertexShader: BODY_VS, fragmentShader: CLOUD_FS, transparent: true, depthWrite: false, defines: { OCTAVES: OCT },
          uniforms: { ...U, uSeed: { value: b.seed * 3.1 }, uCloud: { value: C('#F1EEE7') }, uDensity: { value: b.clouds } } }));
      spin.add(clouds);
    }
    let ring = null, ringNormal = null;
    if (b.rings) {
      const r1 = b.radius * 1.35, r2 = b.radius * 2.3;
      ring = new THREE.Mesh(new THREE.RingGeometry(r1, r2, lite ? 96 : 192, 1),
        new THREE.ShaderMaterial({ vertexShader: RING_VS, fragmentShader: RING_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide,
          uniforms: { ...U, uTex: { value: ringTex }, uCenter: { value: group.position }, uTint: { value: C('#E4D7BE') },
            uR1: { value: r1 }, uR2: { value: r2 }, uPlanetR: { value: b.radius } } }));
      ring.rotation.x = -Math.PI / 2 + 0.38;                 // tilted so the rings read as an ellipse on the way in
      ring.rotation.y = 0.2;
      ringNormal = new THREE.Vector3(0, 0, 1).applyEuler(ring.rotation);
      group.add(ring);
    }
    const moons = [];
    if (b.moons) {
      const n = document.querySelectorAll(b.moons).length;   // one moon per project row / role
      for (let i = 0; i < n; i++) {
        const mr = b.radius * (0.1 + (i % 3) * 0.025) * (b.rings ? 0.9 : 1.4);
        const mm = planetMaterial(6, ['#8F8A80', '#54514B', '#BDB8AE', '#000000'], b.seed + i * 1.7, lite ? 0 : 0.06, Math.max(2, OCT - 2), U);
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(mr, lite ? 16 : 28, lite ? 10 : 18), mm);
        moons.push({ mesh, mat: mm, orbit: b.radius * ((b.rings ? 2.5 : 1.7) + i * (b.rings ? 0.2 : 0.3)), speed: 0.045 / (1 + i * 0.25),   // tight orbits: moons must not wander under the text
          phase: i * 2.399, incline: (i % 2 ? 1 : -1) * (0.08 + i * 0.03), glow: 0, glowTarget: 0 });
        group.add(mesh);
      }
    }
    let satellite = null;
    if (b.satellite) { satellite = makeSatellite(); group.add(satellite); }

    // Faint orbit line through the planet: ink on the chart, a whisper in the dark
    const pts = [];
    for (let i = 0; i <= 256; i++) { const a = i / 256 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * b.orbit, b.lift, Math.sin(a) * b.orbit)); }
    const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ transparent: true, opacity: 0.07, depthWrite: false }));
    scene.add(line);

    scene.add(group);
    bodies.push({ ...b, el, group, spin, mat, atmo, clouds, ring, ringNormal, moons, satellite, line, accent: 0, spinAngle: b.seed, arriveT0: -1 });
    await yieldToBrowser();                                  // build one planet per idle slice: no long tasks
  }

  // Moonlets the route skims between planets
  const flybyMeshes = [0, 1, 2, 3].map(i => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1.6 + (i % 2) * 0.9, lite ? 20 : 36, lite ? 12 : 22),
      planetMaterial(6, ['#8A857C', '#4F4C47', '#B5B0A6', '#000000'], 11.3 + i * 2.9, lite ? 0 : 0.07, Math.max(2, OCT - 2), U));
    m.visible = false;
    scene.add(m);
    return m;
  });

  /* ── Project rows ↔ projects moons; current role moon pulses ─────── */
  const projectBody = bodies.find(b => b.section === 'projects');
  const rows = [...document.querySelectorAll('#projects .mission')];
  const syncRows = () => rows.forEach((li, i) => { const d = li.querySelector('details'); if (projectBody && projectBody.moons[i]) projectBody.moons[i].glowTarget = d && d.open ? 1 : 0; });
  document.addEventListener('toggle', e => { if (e.target.closest && e.target.closest('#projects')) { syncRows(); poke(); } }, true);   // toggle doesn't bubble; capture does
  syncRows();
  const expBody = bodies.find(b => b.section === 'experience');

  /* ── Post-processing: subtle bloom on desktop dark only ──────────── */
  let composer = null, bloomPass = null;
  if (!lite) {
    try {
      const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all([
        import('three/addons/postprocessing/EffectComposer.js'), import('three/addons/postprocessing/RenderPass.js'),
        import('three/addons/postprocessing/UnrealBloomPass.js'), import('three/addons/postprocessing/OutputPass.js')]);
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      bloomPass = new UnrealBloomPass(new THREE.Vector2(...size()), 0.32, 0.55, 0.9);   // threshold high: only the sun and its corona glow
      const fullSize = bloomPass.setSize.bind(bloomPass);
      bloomPass.setSize = (w, h) => fullSize(Math.ceil(w / 2), Math.ceil(h / 2));   // soft glow needs no full-res buffers: ~4x cheaper
      composer.addPass(bloomPass);
      composer.addPass(new OutputPass());
    } catch (e) { composer = null; }                         // bloom is garnish; carry on without it
  }

  /* ── Theme ───────────────────────────────────────────────────────── */
  let chart = false;
  function applyTheme() {
    chart = isChart();
    const t = chart ? THEME.chart : THEME.dark;
    U.uChart.value = chart ? 1 : 0;
    U.uAccentCol.value.set(t.accent); U.uInk.value.set(t.ink); U.uPaper.value.set(t.paper);
    renderer.setClearColor(t.bg, 1);
    starMats.forEach(m => m.uniforms.uColor.value.set(t.star));
    if (streaks) streaks.material.uniforms.uColor.value.set(t.star);
    if (dust) dust.visible = !chart;                          // dust, comets and flare are light effects: dark theme only
    if (extras && chart) extras.clear();
    nebula.visible = !chart;
    const add = chart ? THREE.NormalBlending : THREE.AdditiveBlending;   // additive glow vanishes on paper
    coronaMat.blending = add; coronaMat.needsUpdate = true;
    bodies.forEach(b => {
      b.atmo.material.blending = add; b.atmo.material.needsUpdate = true;
      if (b.clouds) b.clouds.visible = !chart;
      b.line.material.color.set(t.orbit[0]); b.line.material.opacity = t.orbit[1];
      if (b.satellite) b.satellite.traverse(o => { if (o.isMesh) o.material = chart ? o.userData.chartMat : o.userData.darkMat; });
    });
    poke();
  }

  /* ── Route and scroll mapping ────────────────────────────────────── */
  const flight = createFlight(FX.flight);
  const wide = () => innerWidth >= 1100;                     // only then is there a free right third to put the planet in
  let active = [], routeKey = '';
  function measure() {
    const vh = innerHeight, max = Math.max(1, document.documentElement.scrollHeight - vh);
    active = bodies.filter(b => !b.el.hidden);               // certificates only exists while its section is shown
    bodies.forEach(b => { b.group.visible = !b.el.hidden; b.line.visible = !b.el.hidden; });
    const key = active.map(b => b.section).join() + wide();
    let rebuilt = false;
    if (key !== routeKey) {
      routeKey = key;
      const fly = flight.build(active, wide());
      flybyMeshes.forEach((m, i) => { m.visible = !!fly[i]; if (fly[i]) m.position.copy(fly[i]); });
      rebuilt = true;
    }
    // Each section's span: from its top to its bottom crossing the middle of the screen
    const spans = active.map(b => {
      const top = b.el.getBoundingClientRect().top + scrollY;
      return [Math.min(top - vh / 2, max), Math.min(top + b.el.offsetHeight - vh / 2, max)];
    });
    flight.setScroll(spans, spans.length ? Math.max(1, spans[0][0] * FX.flight.heroHold) : max, max, FX.flight.travel);
    return rebuilt;
  }

  // Near stars: a deep volume wrapped around the route, so stars genuinely pass the camera (near ones faster)
  function buildNearStars() {
    const n = lite ? 900 : FX.stars.near, r = rng(77);
    const pos = new Float32Array(n * 3), c = new THREE.Vector3(), t = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), p = new THREE.Vector3();
    const clear = active.map(s => [s.group.position, s.radius * (s.dist || FX.flight.holdDistance) * 1.25]);
    for (let i = 0; i < n;) {
      const L = (r() * 1.1 - 0.05) * flight.total;
      flight.point(L, c); flight.tangent(L, t);
      a.crossVectors(t, UP).normalize(); b.crossVectors(a, t).normalize();
      const rad = 4 + FX.stars.tube * Math.pow(r(), 1.7), ang = r() * Math.PI * 2;
      p.copy(c).addScaledVector(a, Math.cos(ang) * rad).addScaledVector(b, Math.sin(ang) * rad * 0.75);
      if (p.length() < 60 || clear.some(([q, d]) => p.distanceTo(q) < d)) continue;   // keep the sun and the framed views clean
      pos.set([p.x, p.y, p.z], i * 3); i++;
    }
    nearStars = pointsOf(pos, 1.1, 2.2, r, starMaterial(FX.stars.nearBoost));
    scene.add(nearStars);
    streaks = createStreaks(lite ? pos.subarray(0, 500 * 3) : pos, TU);
    scene.add(streaks);
  }

  /* ── Camera pose: a pure function of distance along the route ───── */
  const W = [], P_ = new THREE.Vector3(), ahead = new THREE.Vector3(), tgt = new THREE.Vector3(), fwd = new THREE.Vector3(), right = new THREE.Vector3();
  const qT = new THREE.Quaternion(), qF = new THREE.Quaternion(), m4 = new THREE.Matrix4(), t0 = new THREE.Vector3(), t1 = new THREE.Vector3();
  function frameTarget(focus, eye, xNdc, out) {
    // Shift the look-at point left so `focus` lands at xNdc on screen (right third on desktop)
    fwd.subVectors(focus, eye).normalize();
    right.crossVectors(fwd, UP).normalize();
    const hf = Math.atan(Math.tan(THREE.MathUtils.degToRad(FX.fov.base / 2)) * camera.aspect);
    return out.copy(focus).addScaledVector(right, -eye.distanceTo(focus) * Math.tan(hf) * xNdc);
  }
  function bankAt(L) {
    flight.tangent(L - 20, t0); flight.tangent(L + 20, t1);
    const turn = (t0.z * t1.x - t0.x * t1.z) / 40;            // >0 turning left
    return THREE.MathUtils.degToRad(FX.flight.bank) * THREE.MathUtils.clamp(turn * 150, -1, 1);
  }
  function pose(L, cam, bank, hold = 1) {
    flight.point(L, P_);
    flight.point(L + FX.flight.lookAhead, ahead);
    m4.lookAt(P_, ahead, UP); qT.setFromRotationMatrix(m4); // face the direction of travel...
    flight.weights(L, FX.flight.focusFalloff, W);
    let k = 0;
    for (let i = 1; i < W.length; i++) if (W[i] > W[k]) k = i;
    const w = (W[k] || 0) * hold;                          // hold < 1 at speed: a fling stays pointed down the route instead of whip-panning
    if (w > 0) {                                              // ...turning toward the planet as it comes up
      const s = flight.stops[k];
      m4.lookAt(P_, frameTarget(s.focus, P_, s.xNdc, tgt), UP); qF.setFromRotationMatrix(m4);
      qT.slerp(qF, w);
    }
    cam.position.copy(P_);
    cam.quaternion.copy(qT);
    cam.rotateZ(bank * (1 - w));                              // bank into curves in transit, level while framing
    cam.updateMatrixWorld();
    return w;
  }

  /* ── World update ────────────────────────────────────────────────── */
  let time = 0;
  function updateWorld(dt) {
    U.uTime.value = time;
    bodies.forEach(b => {
      b.spinAngle += dt * 0.05 * (1 + (FX.arrival.spinSlow - 1) * b.accent);   // matched orbit: the focused planet turns slower
      b.spin.rotation.y = b.spinAngle;
      const ap = b.arriveT0 < 0 ? 0 : (time - b.arriveT0) / FX.arrival.duration;
      const arrive = ap > 0 && ap < 1 ? ap : 0;
      b.atmo.material.uniforms.uArrive.value = arrive;
      b.mat.uniforms.uArrive.value = arrive;
      if (ap >= 1) b.arriveT0 = -1;
      if (b.clouds) b.clouds.rotation.y = time * 0.012;      // clouds drift against the surface
      b.moons.forEach(m => {
        const ma = m.phase + time * m.speed;
        m.mesh.position.set(Math.cos(ma) * m.orbit, Math.sin(ma) * m.orbit * m.incline, Math.sin(ma) * m.orbit);
        m.glow += (m.glowTarget - m.glow) * (1 - Math.exp(-dt * 4));
        m.mat.uniforms.uGlow.value = m.glow;
      });
      if (b.satellite) { const sa = time * 0.08; b.satellite.position.set(Math.cos(sa) * b.radius * 2.1, b.radius * 0.5, Math.sin(sa) * b.radius * 2.1); b.satellite.rotation.y = -sa; }
    });
    flybyMeshes.forEach((m, i) => { m.rotation.y = time * 0.03 + i; });
    if (expBody && expBody.moons[0]) expBody.moons[0].mat.uniforms.uPulse.value = reduced ? 0.55 : 0.35 + 0.35 * Math.sin(time * 2.4);   // "you are here"
  }
  function updateAccent(dt) {
    flight.stops.forEach((s, k) => {
      if (!s.body) return;
      const b = s.body, target = THREE.MathUtils.smoothstep(W[k] || 0, 0.4, 0.9);
      b.accent += (target - b.accent) * (dt ? 1 - Math.exp(-dt * 3) : 1);
      b.atmo.material.uniforms.uAccent.value = b.accent;
      b.mat.uniforms.uAccent.value = b.accent;
    });
  }

  const focusHold = () => 1 - 0.85 * THREE.MathUtils.smoothstep(warp, 0.35, 0.95);
  function place(L, bank = 0, warp = 0) {
    const fov = FX.fov.base + FX.fov.punch * warp * warp * (3 - 2 * warp);
    if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
    const w = pose(L, camera, bank, focusHold());
    corona.quaternion.copy(camera.quaternion);              // corona always faces the viewer
    return w;
  }
  function draw() {
    if (composer && !chart) composer.render(); else renderer.render(scene, camera);
    if (flare && !chart) flare.render(renderer);
  }
  // Adaptive quality from real frame intervals (no blocking GPU sync): if the first ~40 active frames
  // average under ~45fps, shed bloom; if still slow, drop to 1x resolution
  const perf = { n: 0, sum: 0, step: 0 };
  function samplePerf(dtMs) {
    if (perf.step > 1 || dtMs > 200) return;                 // done adapting, or a stall (tab switch) that says nothing about the GPU
    perf.n++; perf.sum += dtMs;
    if (perf.n < 40) return;
    const avg = perf.sum / perf.n;
    perf.n = perf.sum = 0;
    if (avg <= 22) { perf.step = 2; return; }                // fast enough: stop measuring
    if (perf.step === 0 && composer) { composer = null; perf.step = 1; return; }
    if (renderer.getPixelRatio() > 1) { renderer.setPixelRatio(1); resize(); starMats.forEach(m => { m.uniforms.uPR.value = 1; }); }
    perf.step = 2;
  }

  /* ── Travel effects ──────────────────────────────────────────────── */
  let warp = 0, speed = 0, bank = 0;
  const inside = [], announced = [];
  const vp = new THREE.Vector4(), sunNdc = new THREE.Vector3(), Wg = [];
  const sideFade = x => (wide() ? THREE.MathUtils.smoothstep(x, FX.textFade[0], FX.textFade[1]) : 0.6);
  function updateTravel(dt, dL, Lt) {
    const v = dt ? dL / dt : 0;                              // route units per second
    speed += (v - speed) * (dt ? 1 - Math.exp(-dt / 0.08) : 1);
    const want = THREE.MathUtils.clamp((Math.abs(speed) - FX.warp.startSpeed) / (FX.warp.fullSpeed - FX.warp.startSpeed), 0, 1);
    const tau = want > warp ? FX.warp.attack : FX.warp.release / 3;
    warp += (want - warp) * (dt ? 1 - Math.exp(-dt / tau) : 1);
    if (warp < 0.001) warp = 0;

    // Streak tails: the same pose a short way back along the route
    const back = THREE.MathUtils.clamp(speed * FX.warp.trail, -40, 40);
    ghost.fov = camera.fov; ghost.aspect = camera.aspect; ghost.updateProjectionMatrix();
    pose(L - back, ghost, bank, focusHold());
    flight.weights(L, FX.flight.focusFalloff, W);             // pose() on the ghost overwrote the camera's weights
    TU.uPrevVP.value.multiplyMatrices(ghost.projectionMatrix, ghost.matrixWorldInverse);
    flight.tangent(L, t0).multiplyScalar(Math.sign(speed) || 1);
    vp.set(camera.position.x + t0.x * 1000, camera.position.y + t0.y * 1000, camera.position.z + t0.z * 1000, 1).applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix);
    TU.uFlip.value = vp.w < 0 ? -1 : 1;                       // vanishing point behind us: streaks converge instead
    TU.uVP.value.set(vp.x / Math.abs(vp.w || 1), vp.y / Math.abs(vp.w || 1));
    TU.uWarp.value = warp;
    TU.uWide.value = wide() ? 1 : 0;
    if (streaks) streaks.material.uniforms.uAlpha.value = THREE.MathUtils.smoothstep(warp, 0.05, 0.5) * FX.warp.opacity * (chart ? 0.55 : 1);
    starMats.forEach(m => { m.uniforms.uDim.value = warp * FX.warp.starDim * (m.uniforms.uNear.value ? 1 : 0.5); });
    if (dust) dust.material.uniforms.uAlpha.value = FX.extras.dustOpacity * Math.min(1, 0.3 + warp * 1.5);

    // Glare when the route passes near the sun
    if (flare) {
      sunNdc.set(0, 0, 0).project(camera);
      const onScreen = sunNdc.z < 1 && Math.abs(sunNdc.x) < 1.3 && Math.abs(sunNdc.y) < 1.3;
      const near = 1 - THREE.MathUtils.smoothstep(camera.position.length(), FX.extras.flareNear, FX.extras.flareFar);
      flare.update(sunNdc, onScreen && !chart ? FX.extras.flare * near : 0, camera.aspect, sideFade);
    }
    if (extras) extras.update(dt, chart ? 0 : 1);

    flight.stops.forEach((s, k) => {
      // Arrival: crossing into a planet's held arc while flying forward plays its moment
      const now = L >= s.LA - 0.5 && L <= s.LD + 0.5;
      if (now && !inside[k] && speed > 0 && s.body) s.body.arriveT0 = time;
      // Leaving a planet with a long way still to go: now and then something drifts through the frame
      if (!now && inside[k] && speed > 0 && Lt - L > 60 && extras && !chart && Math.random() < FX.extras.chance)
        extras.spawn(Math.random() < 0.5 ? 'comet' : 'rocks', camera, wide() ? 0.55 : 0.2);
      inside[k] = now;
    });
    announce();
  }
  // The section's heading reveal waits for its planet to come up (site.js has a fallback)
  function announce() {
    flight.stops.forEach((s, k) => {
      const w = W[k] || 0;
      if (w > 0.35 && !announced[k]) {
        announced[k] = true;
        document.dispatchEvent(new CustomEvent('scene:arrive', { detail: { section: s.body ? s.body.section : 'top' } }));
      } else if (w === 0) announced[k] = false;
    });
  }

  /* ── Resize / layout changes ─────────────────────────────────────── */
  function resize() {
    const [w, h] = size();
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    if (composer) composer.setSize(w, h);
    if (measure()) L = flight.toL(scrollY);                  // new route: jump onto it rather than fly across
    poke();
  }
  let rt; const onResize = () => { clearTimeout(rt); rt = setTimeout(resize, 120); };
  addEventListener('resize', onResize);
  new ResizeObserver(onResize).observe(document.body);       // expanding rows / certificates changes the scroll map
  new MutationObserver(onResize).observe(document.getElementById('certificates') || document.body, { attributes: true, attributeFilter: ['hidden'] });

  /* ── Loop ────────────────────────────────────────────────────────── */
  let L = 0, still = -1, raf = 0, last = 0, frameN = 0, lastScroll = 0, dirty = true;
  const fade = document.createElement('canvas');             // reduced motion: previous still, faded out over the new one
  fade.className = 'scene-fade'; fade.setAttribute('aria-hidden', 'true');
  canvas.after(fade);
  function poke() { dirty = true; if (!raf && !document.hidden) raf = requestAnimationFrame(loop); }

  function loop(now) {
    raf = 0;
    if (document.hidden) return;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;   // cap so a stalled frame never teleports the camera
    last = now;
    const Lt = flight.toL(scrollY);
    if (reduced) {
      const idx = stillIndex(Lt);                            // one still per section, no flight
      if (idx !== still || dirty) stillFrame(idx);
      dirty = false;
      return;                                                 // no continuous loop: nothing moves
    }
    time += dt;
    const prevL = L;
    L += (Lt - L) * (1 - Math.pow(1 - FX.flight.damping, dt * 60));   // light, frame-rate independent smoothing
    if (Math.abs(Lt - L) < 0.01) L = Lt;
    const moving = L !== prevL || now - lastScroll < 400 || dirty;
    frameN++;
    if (moving || warp > 0 || frameN % 2 === 0) {             // settled: 30fps is plenty for spins this slow
      bank += (bankAt(L) - bank) * (dt ? 1 - Math.exp(-dt * 3) : 1);
      updateWorld(dt);
      place(L, bank, warp);
      updateTravel(dt, L - prevL, Lt);
      updateAccent(dt);
      draw();
      dirty = false;
      if (moving) samplePerf(dt * 1000);                     // only frames rendered back to back say anything about speed
    }
    raf = requestAnimationFrame(loop);
  }
  function stillIndex(Lt) {
    const s = flight.stops;
    for (let k = 0; k < s.length - 1; k++) if (Lt < (s[k].LD + s[k + 1].LA) / 2) return k;
    return s.length - 1;
  }
  function stillFrame(idx) {
    const ctx = fade.getContext('2d');
    if (still !== -1 && still !== idx && canvas.width) {
      fade.width = canvas.width; fade.height = canvas.height;
      updateWorld(0); place(flight.stops[still].LC); draw();  // redraw the old still so it can be copied (no preserved buffer)
      ctx.drawImage(canvas, 0, 0);
      fade.style.transition = 'none'; fade.style.opacity = '1';
      requestAnimationFrame(() => { fade.style.transition = 'opacity .7s ease'; fade.style.opacity = '0'; });
    }
    still = idx;
    L = flight.stops[idx].LC;
    updateWorld(0); place(L); flight.weights(L, FX.flight.focusFalloff, W); updateAccent(0); draw();
    announce();                                               // headings still reveal, without the arrival effect
  }

  addEventListener('scroll', () => { lastScroll = performance.now(); poke(); }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else { last = 0; poke(); } });
  reducedMQ.addEventListener('change', e => { reduced = e.matches; still = -1; poke(); });
  new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', applyTheme);

  /* ── First frame: compile off the main path, place the camera where the reader already is ── */
  measure();
  buildNearStars();
  applyTheme();
  L = flight.toL(scrollY);                                   // deep links / mid-page reloads: no fly-in
  if (reduced) L = flight.stops[still = stillIndex(L)].LC;
  updateWorld(0); place(L);
  flight.weights(L, FX.flight.focusFalloff, W);
  updateAccent(0);
  flight.stops.forEach((s, k) => { inside[k] = L >= s.LA - 0.5 && L <= s.LD + 0.5; });   // no arrival flash on load
  TU.uPrevVP.value.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  if (renderer.extensions.has('KHR_parallel_shader_compile')) await renderer.compileAsync(scene, camera);   // compile off the main thread where the GPU allows
  else {
    for (const o of [...scene.children]) { renderer.compile(o, camera, scene); await yieldToBrowser(); }   // no parallel compile: one object per idle slice
  }
  draw();
  canvas.classList.add('is-ready');                          // CSS fades the canvas in over the static starfield
  document.documentElement.classList.add('scene-live');
  announce();                                                 // already at a planet (top or a deep link): reveal its heading now
  poke();
  const api = { bodies, flight, FX, debug: () => ({ L, Lt: flight.toL(scrollY), warp, speed, W: [...W], stops: flight.stops.map(s => [s.kind, s.body && s.body.section, s.LA, s.LC, s.LD]), knots: flight.knots, total: flight.total }) };
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__scene = api;   // test hook, local only
  return api;
}

/* ── Helpers ───────────────────────────────────────────────────────── */

export function planetMaterial(style, colors, seed, bump, octaves, U) {
  return new THREE.ShaderMaterial({
    vertexShader: BODY_VS, fragmentShader: PLANET_FS,
    defines: { STYLE: style, OCTAVES: octaves },
    extensions: { derivatives: true },
    uniforms: { ...U, uSeed: { value: seed }, uBump: { value: bump }, uAccent: { value: 0 }, uGlow: { value: 0 }, uPulse: { value: 0 }, uArrive: { value: 0 },
      uC0: { value: C(colors[0]) }, uC1: { value: C(colors[1]) }, uC2: { value: C(colors[2]) }, uC3: { value: C(colors[3]) } }
  });
}

export function makeRingTexture() {
  // 1D band profile on a canvas: soft ringlets, one clear gap, ragged inner/outer edges
  const c = document.createElement('canvas'); c.width = 1024; c.height = 4;
  const x = c.getContext('2d'), r = rng(7);
  for (let i = 0; i < 1024; i++) {
    const u = i / 1023;
    let a = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(u * 38 + Math.sin(u * 9) * 2.5)) + 0.25 * r();
    a *= Math.min(1, u / 0.08) * Math.min(1, (1 - u) / 0.12);   // fade the edges
    if (u > 0.56 && u < 0.6) a *= 0.08;                     // the gap
    const shade = 200 + Math.round(40 * Math.sin(u * 23));
    x.fillStyle = `rgba(${shade},${shade - 12},${shade - 30},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
    x.fillRect(i, 0, 1, 4);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  t.wrapS = THREE.ClampToEdgeWrapping;
  return t;
}

function makeSatellite() {
  // A small, low-detail relay near the Contact planet
  const g = new THREE.Group();
  const mk = (geo, dark, x = 0) => {
    const darkMat = new THREE.MeshStandardMaterial({ color: dark, metalness: 0.4, roughness: 0.55 });
    const chartMat = new THREE.MeshBasicMaterial({ color: 0x2A2B2F });
    const m = new THREE.Mesh(geo, darkMat);
    m.userData = { darkMat, chartMat };
    m.position.x = x;
    g.add(m);
  };
  mk(new THREE.BoxGeometry(0.5, 0.5, 0.7), 0xB8B2A6);
  mk(new THREE.BoxGeometry(1.4, 0.04, 0.55), 0x34404A, 0.98);
  mk(new THREE.BoxGeometry(1.4, 0.04, 0.55), 0x34404A, -0.98);
  mk(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6), 0xB8B2A6);
  g.children[3].position.y = 0.5;
  return g;
}
