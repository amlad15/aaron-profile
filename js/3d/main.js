/**
 * main.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Entry point: initialises the Three.js scene, wires up all modules,
 * and runs the requestAnimationFrame render loop.
 *
 * Load order (enforced in index.html):
 *   planet-data.js → particles.js → solar-system.js →
 *   camera.js → ui.js → interactions.js → main.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  /* ── Scene-level globals ────────────────────────────────────────────────── */
  let scene, camera, renderer, clock;
  let solarSystem, particleSystem, cameraController, ui, interactions;

  // Planet label DOM elements and shared vector for projection
  let _planetLabels = [];
  let _moonLabels   = [];
  let _labelVec;

  /* ═══════════════════════════════════════════════════════════════════════════
     INITIALISATION
  ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Main init function — called once on DOMContentLoaded.
   * Creates all Three.js primitives and bootstraps every module.
   */
  function init() {
    /* ── Dependency & WebGL checks ──────────────────────────────────────── */
    if (typeof THREE === 'undefined') {
      throw new Error('Three.js failed to load — check your network connection');
    }
    if (typeof TWEEN === 'undefined') {
      throw new Error('TWEEN.js failed to load — check your network connection');
    }
    if (typeof THREE.OrbitControls === 'undefined') {
      throw new Error('OrbitControls failed to load — check your network connection');
    }
    const _testCanvas = document.createElement('canvas');
    if (!_testCanvas.getContext('webgl') && !_testCanvas.getContext('experimental-webgl')) {
      throw new Error('WebGL is not supported by this browser or GPU');
    }

    /* ── Renderer ───────────────────────────────────────────────────────── */
    renderer = new THREE.WebGLRenderer({
      canvas:          document.getElementById('portfolio-canvas'),
      antialias:       true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000005, 1);  // Deep-space black

    /* ── Scene ──────────────────────────────────────────────────────────── */
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000005);
    scene.fog = new THREE.FogExp2(0x000005, 0.00022);

    /* ── Camera ─────────────────────────────────────────────────────────── */
    camera = new THREE.PerspectiveCamera(
      55,                                     // FOV
      window.innerWidth / window.innerHeight, // Aspect
      1,                                      // Near clip
      8000                                    // Far clip
    );

    /* ── Clock (for delta-time) ─────────────────────────────────────────── */
    clock = new THREE.Clock();

    /* ── Global Lighting ────────────────────────────────────────────────── */
    // Very dim ambient so the dark side of planets isn't pure black
    const ambientLight = new THREE.AmbientLight(0x111133, 0.8);
    scene.add(ambientLight);

    // Subtle fill light from above to give planets some shape
    const fillLight = new THREE.DirectionalLight(0x334466, 0.3);
    fillLight.position.set(0, 400, 0);
    scene.add(fillLight);

    /* ── Loading Manager (tracks all TextureLoader loads) ───────────────── */
    const loadingManager = new THREE.LoadingManager();
    window._portfolioLoadingManager = loadingManager;

    let _texturesDismissed = false;
    const _dismissWhenReady = () => {
      if (_texturesDismissed) return;
      _texturesDismissed = true;
      const txt = document.querySelector('.loading-text');
      if (txt) txt.textContent = 'RENDERING SCENE...';
      if (ui) ui.dismissLoadingScreen();
    };

    loadingManager.onProgress = (url, loaded, total) => {
      const pct = Math.round((loaded / total) * 100);
      const txt = document.querySelector('.loading-text');
      if (txt) txt.textContent = `LOADING TEXTURES... ${pct}%`;
    };

    loadingManager.onLoad  = _dismissWhenReady;
    loadingManager.onError = (url) => { console.warn('[Textures] Failed to load:', url); };

    /* ── Modules ────────────────────────────────────────────────────────── */
    particleSystem   = new ParticleSystem(scene);
    solarSystem      = new SolarSystem(scene);
    cameraController = new CameraController(camera, renderer.domElement);
    ui               = new UIController();
    interactions     = new InteractionHandler(
      camera,
      scene,
      solarSystem,
      cameraController,
      ui,
      renderer.domElement
    );

    window.interactions     = interactions;
    window.solarSystem      = solarSystem;
    window.cameraController = cameraController;
    window.ui               = ui;

    /* ── Planet floating labels ──────────────────────────────────────────── */
    _labelVec = new THREE.Vector3();
    const labelContainer = document.getElementById('planet-labels');
    if (labelContainer) {
      PORTFOLIO_DATA.planets.forEach(pd => {
        const hexColor = '#' + pd.color.toString(16).padStart(6, '0');
        const el = document.createElement('div');
        el.className = 'planet-label';
        el.style.setProperty('--planet-color', hexColor);
        el.innerHTML =
          `<span class="pl-name">${pd.label}</span>` +
          `<span class="pl-cat">${pd.category}</span>`;
        labelContainer.appendChild(el);
        _planetLabels.push({ el, planetId: pd.id });
      });
    }

    /* ── Moon floating labels ────────────────────────────────────────────── */
    const moonLabelContainer = document.getElementById('moon-labels');
    if (moonLabelContainer) {
      solarSystem.getAllMoonObjects().forEach(({ moonObj, planetId }) => {
        const planetData = solarSystem.getPlanetData(planetId);
        const hexColor = planetData
          ? '#' + planetData.color.toString(16).padStart(6, '0')
          : '#ffffff';
        const el = document.createElement('div');
        el.className = 'moon-label';
        el.style.setProperty('--moon-color', hexColor);
        el.textContent = moonObj.data.title;
        moonLabelContainer.appendChild(el);
        _moonLabels.push({ el, moonObj });
      });
    }

    /* ── Resize handler ─────────────────────────────────────────────────── */
    window.addEventListener('resize', onResize);

    /* ── Start render loop ──────────────────────────────────────────────── */
    requestAnimationFrame(animate);

    /* ── Dismiss loading screen after first frame ───────────────────────── */
    // (Called inside animate() on the very first frame)
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     RENDER LOOP
  ═══════════════════════════════════════════════════════════════════════════ */

  let _firstFrame = true;

  /**
   * The main requestAnimationFrame loop.
   * Updates TWEEN, all modules, and renders the scene.
   * @param {number} time - Timestamp supplied by rAF (milliseconds).
   */
  function animate(time) {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.1); // Cap at 100ms to avoid spiral

    // 1. Advance all active TWEEN animations
    TWEEN.update(time);

    // 2. Update camera damping
    cameraController.update();

    // 3. Advance orbits / moon animations (pass focused planet so it pauses)
    solarSystem.update(delta, interactions.focusedPlanetId);

    // 4. Move comets
    particleSystem.update(delta);

    // 5. Per-frame hover detection
    interactions.update();

    // 6. Render the scene
    renderer.render(scene, camera);

    // 7. Skip label projection on the very first completed frame (world matrices
    //    need at least one render before getWorldPosition returns valid values).
    //    Loading screen is dismissed by the LoadingManager's onLoad callback.
    if (_firstFrame) {
      _firstFrame = false;
      return;
    }

    // 8. Update floating planet labels — hide when any planet is focused
    const isFocused = !!interactions.focusedPlanetId;
    _planetLabels.forEach(({ el, planetId }) => {
      if (isFocused) {
        el.style.opacity = '0';
        return;
      }
      solarSystem.getPlanetWorldPosition(planetId, _labelVec);
      const proj = _labelVec.project(camera);
      if (proj.z >= 1) {
        el.style.opacity = '0';
        return;
      }
      const x = (proj.x *  0.5 + 0.5) * window.innerWidth;
      const y = (proj.y * -0.5 + 0.5) * window.innerHeight;
      el.style.left    = x + 'px';
      el.style.top     = (y - 22) + 'px';
      el.style.opacity = '1';
    });

    // 8b. Update floating moon labels — visible when their moon is scaled in
    _moonLabels.forEach(({ el, moonObj }) => {
      if (moonObj.group.scale.x < 0.05) {
        el.style.opacity = '0';
        return;
      }
      moonObj.group.getWorldPosition(_labelVec);
      const proj = _labelVec.project(camera);
      if (proj.z >= 1) {
        el.style.opacity = '0';
        return;
      }
      const x = (proj.x *  0.5 + 0.5) * window.innerWidth;
      const y = (proj.y * -0.5 + 0.5) * window.innerHeight;
      el.style.left    = x + 'px';
      el.style.top     = (y - 18) + 'px';
      el.style.opacity = String(moonObj.group.scale.x); // fade in with the moon
    });
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     RESIZE
  ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Updates camera aspect ratio and renderer size when the window is resized.
   */
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  /* ── Kick off on DOM ready ──────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {

    // Attempt initialisation; surface any constructor errors on the loading
    // screen instead of silently hanging.
    try {
      init();
    } catch (err) {
      console.error('[Portfolio] Initialisation failed:', err);
      const txt = document.querySelector('.loading-text');
      if (txt) {
        txt.textContent = 'ERROR: ' + String(err.message || err).toUpperCase().slice(0, 60);
      }
      return; // leave the loading screen visible as an error display
    }

    // No external textures — dismiss loading screen quickly
    setTimeout(function () {
      if (ui) ui.dismissLoadingScreen();
    }, 1200);

  });

}());
