/**
 * main.js: 3D mode entry point. Exposes window.Space = { start, stop } for site.js.
 * Built once on first open; closing only stops the render loop so reopening is instant.
 * Load order (site.js): three → OrbitControls → tween → scene-data → solar-system →
 * particles → camera → ui → interactions → main
 */
(function () {
  'use strict';

  let S = null;                                               // everything built on first start
  let rafId = 0;

  function build(dialog, certs) {
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lite = matchMedia('(max-width: 768px)').matches
      || (navigator.deviceMemory || 8) <= 4
      || (navigator.hardwareConcurrency || 8) <= 4;           // phones and low-end laptops get the light scene
    const scene3d = buildScene(window.SITE, certs || []);

    const canvas = dialog.querySelector('#space-canvas');
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !lite,
      powerPreference: lite ? 'low-power' : 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lite ? 1.5 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x05070F, 1);                       // a touch darker than the page bg

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070F);
    scene.fog = new THREE.FogExp2(0x05070F, 0.00014);         // lighter fog: the fitted overview sits farther back on phones

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 9000);
    scene.add(new THREE.AmbientLight(0x223355, 0.9));
    const fill = new THREE.DirectionalLight(0x334466, 0.3);
    fill.position.set(0, 400, 0);
    scene.add(fill);

    const opts = { lite, reducedMotion, beltRadius: scene3d.outerRadius + 70, fitRadius: scene3d.outerRadius + 90 };
    const particles   = new ParticleSystem(scene, opts);
    const solarSystem = new SolarSystem(scene, scene3d, opts);
    const cameraCtl   = new CameraController(camera, canvas, opts);

    let interactions;                                         // UI handlers call into it, so define first
    const ui = new SpaceUI(dialog, scene3d, {
      sun:      () => interactions.selectSun(),
      planet:   id => interactions.selectPlanet(id),
      moon:     (id, pid) => interactions.selectMoon(id, pid),
      overview: () => interactions.overview()
    });
    interactions = new InteractionHandler(camera, solarSystem, cameraCtl, ui, canvas, scene3d);
    dialog.addEventListener('keydown', e => interactions.onKeyDown(e));   // unhandled Escape falls through to the native close

    /* Labels: real buttons, so clicking a name works (it used to be pointer-events:none) */
    const planetLabels = scene3d.planets.map(pd =>
      ({ id: pd.id, el: ui.makeLabel(pd.label, SpaceUI.hex(pd.color), { act: 'planet', id: pd.id }) }));
    const sunLabel = ui.makeLabel('About', '#FF6A2B', { act: 'sun' });
    const moonLabels = solarSystem.getAllMoonObjects().map(({ moonObj, planetId }) => ({
      moonObj, planetId,
      el: ui.makeLabel(moonObj.data.title, SpaceUI.hex(solarSystem.getPlanetData(planetId).color),
        { act: 'moon', id: moonObj.data.id, planet: planetId }, true)
    }));
    ui.labels.addEventListener('pointerover', () => { interactions.labelHover = true; });   // hold orbits still while aiming
    ui.labels.addEventListener('pointerout',  () => { interactions.labelHover = false; });

    window.addEventListener('resize', () => {
      if (!dialog.open) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      cameraCtl.fitOverview();
      if (!interactions.focusedPlanetId && !cameraCtl.isTransitioning) {
        camera.position.copy(cameraCtl.defaultPosition);       // keep the whole system in frame after rotate/resize
        cameraCtl.controls.update();
      }
    });

    return { renderer, scene, camera, clock: new THREE.Clock(), particles, solarSystem, cameraCtl, ui, interactions,
             planetLabels, sunLabel, moonLabels, v: new THREE.Vector3() };
  }

  /* Place a label under a world point; hide it if behind the camera or off-screen */
  function place(el, world, show, dy) {
    if (!show) { el.style.visibility = 'hidden'; return; }
    const p = world.project(S.camera);
    const x = (p.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-p.y * 0.5 + 0.5) * window.innerHeight;
    const off = p.z > 1 || x < -50 || x > window.innerWidth + 50 || y < -50 || y > window.innerHeight + 50;
    el.style.visibility = off ? 'hidden' : 'visible';
    if (!off) el.style.transform = `translate(${x.toFixed(1)}px, ${(y + dy).toFixed(1)}px) translateX(-50%)`;
  }

  function frame(time) {
    rafId = requestAnimationFrame(frame);
    const delta = Math.min(S.clock.getDelta(), 0.1);          // cap so a background tab doesn't teleport planets
    TWEEN.update(time);
    S.cameraCtl.update();
    S.interactions.update();
    S.solarSystem.update(delta, S.interactions.focusedPlanetId);
    S.particles.update(delta);
    S.renderer.render(S.scene, S.camera);

    const focused = S.interactions.focusedPlanetId;
    S.planetLabels.forEach(l => {
      S.solarSystem.getPlanetWorldPosition(l.id, S.v);
      place(l.el, S.v, !focused, 18);
    });
    place(S.sunLabel, S.v.set(0, 0, 0), !focused, 40);
    S.moonLabels.forEach(l => {
      const shown = focused === l.planetId && l.moonObj.group.scale.x > 0.5;
      if (shown) l.moonObj.group.getWorldPosition(S.v);
      place(l.el, S.v, shown, 10);
    });
  }

  window.Space = {
    start(dialog, certs) {
      if (!S) S = build(dialog, certs);
      else window.dispatchEvent(new Event('resize'));          // viewport may have changed while closed
      cancelAnimationFrame(rafId);
      S.clock.getDelta();                                     // drop the time spent closed
      rafId = requestAnimationFrame(frame);
      dialog.querySelector('#space-list button').focus();     // start keyboard users in the section list
    },
    stop() {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };
}());
