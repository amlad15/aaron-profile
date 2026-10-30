/**
 * scene.js: the solar system behind the page. Scroll position picks a point on a camera path
 * through one planet per section; the camera eases toward it. Native scrolling is never touched.
 * Loaded by site.js after first paint; the page is complete without it.
 */
import * as THREE from 'three';
import {
  BODY_VS, PLANET_FS, CLOUD_FS, ATMO_FS, SUN_FS, CORONA_VS, CORONA_FS,
  RING_VS, RING_FS, STAR_VS, STAR_FS, NEBULA_FS
} from './shaders.js';

THREE.ColorManagement.enabled = false;                       // palette hexes are display colours; skip linear conversion

const C = hex => new THREE.Color(hex);
const UP = new THREE.Vector3(0, 1, 0);

// Section → body. Styles: 0 rocky, 1 gas giant, 2 ice, 3 ocean, 4 desert, 5 terran, 6 small cratered moon
export const BODIES = [
  { section: 'experience',   style: 0, orbit: 46,  angle: 0.35, radius: 3.4, seed: 1.3, colors: ['#3E3832', '#857A6C', '#CEC4B4', '#000000'], atmo: '#C9A98A', moons: '#experience .tl-item', pulseFirst: true },
  { section: 'services',     style: 3, orbit: 66,  angle: 1.2,  radius: 3.8, seed: 4.1, colors: ['#172329', '#30505C', '#000000', '#000000'], atmo: '#8FB6C6', clouds: 0.85 },
  { section: 'projects',     style: 1, orbit: 94,  angle: 2.05, radius: 8.0, seed: 2.7, colors: ['#D9CCB3', '#8A795F', '#B8A07C', '#5B4B39'], atmo: '#D9C7A6', rings: true, moons: '#projects .mission', dist: 11 },
  { section: 'skills',       style: 2, orbit: 120, angle: 2.9,  radius: 3.6, seed: 7.7, colors: ['#BCC6CC', '#8C9DA6', '#6A7E89', '#000000'], atmo: '#B5CCD8' },   // kept below the bloom threshold
  { section: 'education',    style: 4, orbit: 142, angle: 3.7,  radius: 3.1, seed: 5.5, colors: ['#C4AC87', '#7B674D', '#E6D5B7', '#000000'], atmo: '#E2CBA5' },
  { section: 'certificates', style: 6, orbit: 158, angle: 4.35, radius: 2.0, seed: 9.2, colors: ['#8E8A82', '#56534D', '#BAB5AB', '#000000'], atmo: '#BDB7AC' },
  { section: 'about',        style: 5, orbit: 176, angle: 5.0,  radius: 4.1, seed: 3.3, colors: ['#1A2930', '#6B6550', '#9C9173', '#ECE9E1'], atmo: '#9CC2D2', clouds: 0.7 },
  { section: 'contact',      style: 6, orbit: 204, angle: 5.75, radius: 2.9, seed: 6.6, colors: ['#9C978D', '#5C5852', '#CCC6B9', '#000000'], atmo: '#C9C3B6', satellite: true }
];

export const THEME = {
  dark:  { bg: '#0B0C0E', ink: '#17181B', paper: '#F3F0E8', accent: '#FF6A2B', star: '#ECE8DF', orbit: ['#ECE8DF', 0.07] },
  chart: { bg: '#F3F0E8', ink: '#2A2B2F', paper: '#F3F0E8', accent: '#B4380A', star: '#2A2B2F', orbit: ['#2A2B2F', 0.2] }
};

const yieldToBrowser = () => new Promise(r => (window.requestIdleCallback ? requestIdleCallback(() => r(), { timeout: 120 }) : setTimeout(r, 16)));
const ease = t => t * t * (3 - 2 * t);                        // smoothstep: travel starts and lands gently

/* Deterministic RNG so the starfield and rings look the same on every visit */
function rng(seed) { let s = seed >>> 0; return () => ((s = Math.imul(s ^ (s >>> 15), 0x2c1b3c6d) + 0x9e3779b9 >>> 0) / 4294967296); }

export async function start({ canvas, isChart }) {
  const lite = matchMedia('(max-width: 767px), (pointer: coarse)').matches;   // phones/tablets: lighter everything
  const reducedMQ = matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = reducedMQ.matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !lite, powerPreference: lite ? 'low-power' : 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, lite ? 1 : 1.5));
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;   // with colour management off this is a pass-through
  const size = () => [canvas.clientWidth || innerWidth, canvas.clientHeight || innerHeight];
  renderer.setSize(...size(), false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, size()[0] / size()[1], 0.1, 9000);
  const OCT = lite ? 3 : 5;                                  // fbm octaves: the biggest single GPU cost
  const SEG = lite ? 48 : 112;

  // Uniform objects shared by reference across every material, so one write updates the whole scene
  const U = {
    uTime: { value: 0 }, uChart: { value: 0 }, uSun: { value: new THREE.Vector3() },
    uPaper: { value: C('#F3F0E8') }, uInk: { value: C('#2A2B2F') }, uAccentCol: { value: C('#FF6A2B') }
  };

  /* ── Sun ─────────────────────────────────────────────────────────── */
  const sunMat = new THREE.ShaderMaterial({ vertexShader: BODY_VS, fragmentShader: SUN_FS, defines: { OCTAVES: OCT - 1 }, uniforms: { ...U } });
  const sun = new THREE.Mesh(new THREE.SphereGeometry(9, SEG, SEG / 2), sunMat);
  scene.add(sun);
  const coronaMat = new THREE.ShaderMaterial({ vertexShader: CORONA_VS, fragmentShader: CORONA_FS, defines: { OCTAVES: 2 }, uniforms: { ...U },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const corona = new THREE.Mesh(new THREE.PlaneGeometry(64, 64), coronaMat);
  scene.add(corona);
  scene.add(new THREE.AmbientLight(0xffffff, 0.08));
  scene.add(new THREE.PointLight(0xfff1e0, 2.2, 0, 0));    // only the satellite uses standard lighting; decay 0 so distance doesn't matter

  /* ── Stars: three depth layers so camera travel produces parallax ─── */
  const starMats = [];
  const rand = rng(42);
  [[lite ? 450 : 2200, 650, 1.6, 2.6], [lite ? 350 : 1600, 1300, 1.2, 2.0], [lite ? 250 : 1100, 2600, 0.9, 1.5]].forEach(([n, r, s0, s1]) => {
    const pos = new Float32Array(n * 3), sz = new Float32Array(n), ph = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const u = rand() * 2 - 1, a = rand() * Math.PI * 2, rr = r * (0.9 + rand() * 0.2), q = Math.sqrt(1 - u * u);
      pos.set([Math.cos(a) * q * rr, u * rr * 0.7, Math.sin(a) * q * rr], i * 3);   // flattened a little toward the ecliptic
      sz[i] = s0 + (s1 - s0) * Math.pow(rand(), 3);          // mostly small, a few bright
      ph[i] = rand() * 6.283;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
    g.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
    const m = new THREE.ShaderMaterial({ vertexShader: STAR_VS, fragmentShader: STAR_FS, transparent: true, depthWrite: false,
      uniforms: { ...U, uPR: { value: renderer.getPixelRatio() }, uColor: { value: C('#ECE8DF') } } });
    starMats.push(m);
    scene.add(new THREE.Points(g, m));
  });

  /* ── Nebula wash (dark theme only) ───────────────────────────────── */
  const nebula = new THREE.Mesh(new THREE.SphereGeometry(3800, 32, 16),
    new THREE.ShaderMaterial({ vertexShader: BODY_VS, fragmentShader: NEBULA_FS, side: THREE.BackSide, depthWrite: false,
      defines: { OCTAVES: lite ? 2 : 4 }, uniforms: { uStrength: { value: 0.32 } } }));
  scene.add(nebula);

  await yieldToBrowser();

  /* ── Planets ─────────────────────────────────────────────────────── */
  const ringTex = makeRingTexture();
  const bodies = [];
  const orbitLines = [];
  for (const b of BODIES) {
    const el = document.getElementById(b.section);
    if (!el) continue;
    const group = new THREE.Group();
    const spin = new THREE.Group();                          // surface spins; atmosphere and rings don't need to
    spin.rotation.z = 0.18 + b.seed * 0.03;                  // a little axial tilt each
    group.add(spin);
    const mat = planetMaterial(b.style, b.colors, b.seed, lite ? 0 : 0.08, OCT, U);   // bump costs 3 extra relief taps; phones skip it
    spin.add(new THREE.Mesh(new THREE.SphereGeometry(b.radius, SEG, SEG / 2), mat));
    const atmo = new THREE.Mesh(new THREE.SphereGeometry(b.radius * 1.06, SEG / 2, SEG / 4),
      new THREE.ShaderMaterial({ vertexShader: BODY_VS, fragmentShader: ATMO_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { ...U, uAtmo: { value: C(b.atmo) }, uAccent: { value: 0 }, uStrength: { value: 0.8 } } }));
    group.add(atmo);
    let clouds = null;
    if (b.clouds) {
      clouds = new THREE.Mesh(new THREE.SphereGeometry(b.radius * 1.015, SEG, SEG / 2),
        new THREE.ShaderMaterial({ vertexShader: BODY_VS, fragmentShader: CLOUD_FS, transparent: true, depthWrite: false, defines: { OCTAVES: OCT },
          uniforms: { ...U, uSeed: { value: b.seed * 3.1 }, uCloud: { value: C('#F1EEE7') }, uDensity: { value: b.clouds } } }));
      spin.add(clouds);
    }
    let ring = null;
    if (b.rings) {
      const r1 = b.radius * 1.35, r2 = b.radius * 2.3;
      ring = new THREE.Mesh(new THREE.RingGeometry(r1, r2, lite ? 96 : 192, 1),
        new THREE.ShaderMaterial({ vertexShader: RING_VS, fragmentShader: RING_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide,
          uniforms: { ...U, uTex: { value: ringTex }, uCenter: { value: new THREE.Vector3() }, uTint: { value: C('#E4D7BE') },
            uR1: { value: r1 }, uR2: { value: r2 }, uPlanetR: { value: b.radius } } }));
      ring.rotation.x = -Math.PI / 2 + 0.38;                 // tilted so the rings read as an ellipse from the camera path
      ring.rotation.y = 0.2;
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

    // Faint orbit line: ink on the chart, a whisper in the dark
    const pts = [];
    for (let i = 0; i <= 256; i++) { const a = i / 256 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * b.orbit, 0, Math.sin(a) * b.orbit)); }
    const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ transparent: true, opacity: 0.07, depthWrite: false }));
    scene.add(line); orbitLines.push(line);

    scene.add(group);
    bodies.push({ ...b, el, group, spin, mat, atmo, clouds, ring, moons, satellite, line, accent: 0 });
    await yieldToBrowser();                                  // build one planet per idle slice: no long tasks
  }

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

  /* ── Scroll → camera keyframe index ──────────────────────────────── */
  let knots = [[0, 0]], active = [];                         // knots: [scrollY, keyframe index]
  function measure() {
    const vh = innerHeight, max = Math.max(1, document.documentElement.scrollHeight - vh);
    active = bodies.filter(b => !b.el.hidden);               // certificates only exists while its section is shown
    bodies.forEach(b => { b.group.visible = !b.el.hidden; b.line.visible = !b.el.hidden; });
    knots = [[0, 0]];
    let prev = 0;
    active.forEach((b, j) => {
      const top = b.el.getBoundingClientRect().top + scrollY;
      let s0 = Math.min(Math.max(top - vh * 0.85, prev), max);   // start travelling as the section rises into view
      let s1 = Math.min(Math.max(top - vh * 0.2, s0 + 1), max);  // arrive as its heading nears the top
      if (j === active.length - 1) s1 = Math.max(s0 + 1, Math.min(s1, max));   // the last stop must be reachable
      knots.push([s0, j], [s1, j + 1]);
      prev = s1;
    });
  }
  function scrollToK(y) {
    if (y <= knots[0][0]) return 0;
    for (let i = 1; i < knots.length; i++) {
      const [s1, k1] = knots[i], [s0, k0] = knots[i - 1];
      if (y <= s1) return k0 === k1 ? k0 : k0 + (k1 - k0) * ease((y - s0) / Math.max(1, s1 - s0));
    }
    return knots[knots.length - 1][1];
  }

  /* ── Camera framing ─────────────────────────────────────────────── */
  const tmp = { fwd: new THREE.Vector3(), right: new THREE.Vector3(), dir: new THREE.Vector3(), tan: new THREE.Vector3(), off: new THREE.Vector3() };
  const wide = () => innerWidth >= 1100;                     // only then is there a free right third to put the planet in
  function frame(focus, cam, xNdc, outPos, outTgt) {
    // Shift the look-at point left so `focus` lands at xNdc on screen (right third on desktop)
    tmp.fwd.subVectors(focus, cam).normalize();
    tmp.right.crossVectors(tmp.fwd, UP).normalize();
    const d = cam.distanceTo(focus);
    const hf = Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    outPos.copy(cam);
    outTgt.copy(focus).addScaledVector(tmp.right, -d * Math.tan(hf) * xNdc);
  }
  function planetKey(b, outPos, outTgt) {
    const p = b.group.position;
    tmp.dir.copy(p).normalize();
    tmp.tan.crossVectors(UP, tmp.dir).normalize();
    tmp.off.copy(tmp.dir).multiplyScalar(-0.5).addScaledVector(tmp.tan, 0.82).addScaledVector(UP, 0.24).normalize();   // sun-side three-quarter view: lit face plus a terminator
    const d = b.radius * (b.dist || 7.6) * (wide() ? 1 : 1.5);
    const cam = p.clone().addScaledVector(tmp.off, d);
    frame(p, cam, wide() ? 0.66 : 0, outPos, outTgt);       // planet centre sits ~83% across: clear of the text column
  }
  function heroKey(outPos, outTgt) {
    const a = 0.9 + time * 0.012;                             // slow establishing orbit
    const r = wide() ? 250 : 380;                             // close enough that the inner planets read, wide enough to show the system
    frame(new THREE.Vector3(), new THREE.Vector3(Math.cos(a) * r, 105, Math.sin(a) * r), wide() ? 0.32 : 0, outPos, outTgt);
  }
  function finalKey(b, outPos, outTgt) {
    const p = b.group.position;
    const cam = p.clone().multiplyScalar(1.45).addScaledVector(UP, 70);   // pull back past the last planet and look home
    frame(new THREE.Vector3(), cam, wide() ? 0.5 : 0, outPos, outTgt);    // the sun lands in the right third; the contact planet passes below
  }
  const posCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3()], false, 'centripetal');
  const tgtCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3()], false, 'centripetal');
  function updateKeys() {
    const n = active.length + 1;
    while (posCurve.points.length < n) { posCurve.points.push(new THREE.Vector3()); tgtCurve.points.push(new THREE.Vector3()); }
    posCurve.points.length = tgtCurve.points.length = n;
    heroKey(posCurve.points[0], tgtCurve.points[0]);
    active.forEach((b, j) => (j === active.length - 1 ? finalKey : planetKey)(b, posCurve.points[j + 1], tgtCurve.points[j + 1]));
  }

  /* ── World update ────────────────────────────────────────────────── */
  let time = 0;
  function updateWorld(dt) {
    U.uTime.value = time;
    bodies.forEach(b => {
      const a = b.angle + time * 0.004 * Math.sqrt(46 / b.orbit);   // outer planets drift slower
      b.group.position.set(Math.cos(a) * b.orbit, Math.sin(a * 2.0) * b.orbit * 0.03, Math.sin(a) * b.orbit);
      b.spin.rotation.y = time * 0.05 + b.seed;
      if (b.clouds) b.clouds.rotation.y = time * 0.012;      // clouds drift against the surface
      if (b.ring) b.ring.material.uniforms.uCenter.value.copy(b.group.position);
      b.moons.forEach((m, i) => {
        const ma = m.phase + time * m.speed;
        m.mesh.position.set(Math.cos(ma) * m.orbit, Math.sin(ma) * m.orbit * m.incline, Math.sin(ma) * m.orbit);
        m.glow += (m.glowTarget - m.glow) * (1 - Math.exp(-dt * 4));
        m.mat.uniforms.uGlow.value = m.glow;
      });
      if (b.satellite) { const sa = time * 0.08; b.satellite.position.set(Math.cos(sa) * b.radius * 2.1, b.radius * 0.5, Math.sin(sa) * b.radius * 2.1); b.satellite.rotation.y = -sa; }
    });
    if (expBody && expBody.moons[0]) expBody.moons[0].mat.uniforms.uPulse.value = reduced ? 0.55 : 0.35 + 0.35 * Math.sin(time * 2.4);   // "you are here"
  }
  function updateAccent(k, dt) {
    const idx = Math.round(k);
    bodies.forEach(b => {
      const target = active[idx - 1] === b ? 1 : 0;           // keyframe 0 is the hero: nobody is active
      b.accent += (target - b.accent) * (dt ? 1 - Math.exp(-dt * 3) : 1);
      b.atmo.material.uniforms.uAccent.value = b.accent;
      b.mat.uniforms.uAccent.value = b.accent;
    });
  }

  const posNow = new THREE.Vector3(), tgtNow = new THREE.Vector3();
  function place(k) {
    updateKeys();
    const u = active.length ? k / active.length : 0;
    posCurve.getPoint(u, posNow); tgtCurve.getPoint(u, tgtNow);
    camera.position.copy(posNow);
    camera.lookAt(tgtNow);
    corona.quaternion.copy(camera.quaternion);              // corona always faces the viewer
  }
  function draw() {
    if (composer && !chart) composer.render(); else renderer.render(scene, camera);
  }
  // Budget ~8ms/frame so a mid-range laptop holds 60fps: shed bloom first, then resolution
  function adaptQuality() {
    if (composer && !chart && gpuMs(renderer, draw) > 8) { composer = null; }
    if (!lite && gpuMs(renderer, draw) > 8 && renderer.getPixelRatio() > 1) {
      renderer.setPixelRatio(1); resize();
      starMats.forEach(m => { m.uniforms.uPR.value = 1; });
    }
  }

  /* ── Resize / layout changes ─────────────────────────────────────── */
  function resize() {
    const [w, h] = size();
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    if (composer) composer.setSize(w, h);
    measure(); poke();
  }
  let rt; const onResize = () => { clearTimeout(rt); rt = setTimeout(resize, 120); };
  addEventListener('resize', onResize);
  new ResizeObserver(onResize).observe(document.body);       // expanding rows / certificates changes the scroll map
  new MutationObserver(onResize).observe(document.getElementById('certificates') || document.body, { attributes: true, attributeFilter: ['hidden'] });

  /* ── Loop ────────────────────────────────────────────────────────── */
  let k = 0, raf = 0, last = 0, frameN = 0, lastScroll = 0, dirty = true;
  const fade = document.createElement('canvas');             // reduced motion: previous still, faded out over the new one
  fade.className = 'scene-fade'; fade.setAttribute('aria-hidden', 'true');
  canvas.after(fade);
  function poke() { dirty = true; if (!raf && !document.hidden) raf = requestAnimationFrame(loop); }

  function loop(now) {
    raf = 0;
    if (document.hidden) return;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;   // cap so a stalled frame never teleports the camera
    last = now;
    const target = scrollToK(scrollY);
    if (reduced) {
      const idx = Math.round(target);                         // one still per section, no flight
      if (idx !== k || dirty) stillFrame(idx);
      dirty = false;
      return;                                                 // no continuous loop: nothing moves
    }
    time += dt;
    k += (target - k) * (1 - Math.exp(-dt * 3.2));          // damped follow: fast flings glide instead of jumping
    if (Math.abs(target - k) < 0.0004) k = target;
    const moving = k !== target || now - lastScroll < 400 || dirty;
    frameN++;
    if (moving || frameN % 2 === 0) {                         // settled: 30fps is plenty for orbits this slow
      updateWorld(dt); updateAccent(k, dt); place(k); draw();
      dirty = false;
    }
    raf = requestAnimationFrame(loop);
  }
  function stillFrame(idx) {
    const ctx = fade.getContext('2d');
    if (k !== idx && canvas.width) {
      fade.width = canvas.width; fade.height = canvas.height;
      updateWorld(0); updateAccent(k, 0); place(k); draw();   // redraw the old still so it can be copied (no preserved buffer)
      ctx.drawImage(canvas, 0, 0);
      fade.style.transition = 'none'; fade.style.opacity = '1';
      requestAnimationFrame(() => { fade.style.transition = 'opacity .7s ease'; fade.style.opacity = '0'; });
    }
    k = idx;
    updateWorld(0); updateAccent(k, 0); place(k); draw();
  }

  addEventListener('scroll', () => { lastScroll = performance.now(); poke(); }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else { last = 0; poke(); } });
  reducedMQ.addEventListener('change', e => { reduced = e.matches; poke(); });
  new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', applyTheme);

  /* ── First frame: compile off the main path, place the camera where the reader already is ── */
  applyTheme();
  measure();
  k = scrollToK(scrollY);                                    // deep links / mid-page reloads: no fly-in
  if (reduced) k = Math.round(k);
  updateWorld(0); updateAccent(k, 0); place(k);
  if (renderer.extensions.has('KHR_parallel_shader_compile')) await renderer.compileAsync(scene, camera);   // compile off the main thread where the GPU allows
  else renderer.compile(scene, camera);                     // otherwise compile once now (compileAsync would only warn)
  draw();
  adaptQuality();
  canvas.classList.add('is-ready');                          // CSS fades the canvas in over the static starfield
  poke();
  return { bodies };
}

/* ── Helpers ───────────────────────────────────────────────────────── */
// Time a few frames to completion (readPixels forces the GPU to finish), so the cost is measured, not guessed
function gpuMs(renderer, draw, n = 6) {
  const gl = renderer.getContext(), px = new Uint8Array(4);
  draw(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const t0 = performance.now();
  for (let i = 0; i < n; i++) draw();
  gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  return (performance.now() - t0) / n;
}

export function planetMaterial(style, colors, seed, bump, octaves, U) {
  return new THREE.ShaderMaterial({
    vertexShader: BODY_VS, fragmentShader: PLANET_FS,
    defines: { STYLE: style, OCTAVES: octaves },
    extensions: { derivatives: true },
    uniforms: { ...U, uSeed: { value: seed }, uBump: { value: bump }, uAccent: { value: 0 }, uGlow: { value: 0 }, uPulse: { value: 0 },
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
