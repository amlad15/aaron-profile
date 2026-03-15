/**
 * interactions.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles all user input and translates it into scene actions:
 *   • Mouse move  → raycasting for hover highlights + tooltip
 *   • Mouse click → planet focus, moon info panel, sun reset, SIGNAL links
 *   • Keyboard    → camera keys + Escape to return to overview
 *   • Touch       → forwarded to OrbitControls via DOM events
 *
 * Drag vs click disambiguation: pointerup is only treated as a click if the
 * pointer moved less than 8 px (Euclidean) from pointerdown.
 * ─────────────────────────────────────────────────────────────────────────────
 */

class InteractionHandler {

  /**
   * @param {THREE.PerspectiveCamera} camera           - Scene camera.
   * @param {THREE.Scene}             scene            - Three.js scene.
   * @param {SolarSystem}             solarSystem      - Solar system instance.
   * @param {CameraController}        cameraController - Camera controller.
   * @param {UIController}            ui               - UI controller.
   * @param {HTMLElement}             canvas           - Renderer canvas.
   */
  constructor(camera, scene, solarSystem, cameraController, ui, canvas) {
    this.camera           = camera;
    this.scene            = scene;
    this.solarSystem      = solarSystem;
    this.cameraController = cameraController;
    this.ui               = ui;
    this.canvas           = canvas;

    // Raycaster for mouse pick detection
    this.raycaster = new THREE.Raycaster();
    this.raycaster.params.Points = { threshold: 20 };
    this.mouse     = new THREE.Vector2(-999, -999);

    // Drag detection state (null when no button is held)
    this._mouseDownPos = null;

    // Currently hovered mesh (tracked to avoid redundant updates)
    this._hoveredMesh = null;

    // Currently focused planet id
    this.focusedPlanetId = null;

    this._bindEvents();
  }

  /* ── Event Binding ─────────────────────────────────────────────────────── */

  /**
   * Attaches all necessary DOM event listeners.
   */
  _bindEvents() {
    // Mouse movement → hover detection
    window.addEventListener('mousemove', e => this._onMouseMove(e));

    // Click vs drag: record pointer-down position, then check Euclidean
    // distance on pointer-up. 8 px radius allows normal click wobble but
    // still ignores drags. pointerdown/up works for mouse, touch, and stylus.
    window.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;   // left-button only
      this._mouseDownPos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('pointerup', e => {
      if (e.button !== 0 || !this._mouseDownPos) return;
      const dx   = e.clientX - this._mouseDownPos.x;
      const dy   = e.clientY - this._mouseDownPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      this._mouseDownPos = null;
      if (dist < 8) this._onClick(e);
    });

    // Keyboard navigation
    window.addEventListener('keydown', e => this._onKeyDown(e));
  }

  /* ── Mouse Move ────────────────────────────────────────────────────────── */

  /**
   * Updates normalised mouse coordinates and detects drag intent.
   * Per-frame hover checking happens in update() for performance.
   * @param {MouseEvent} e
   */
  _onMouseMove(e) {
    // Normalised device coordinates (-1..+1) relative to the canvas element
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;

    // Store screen coords for tooltip placement
    this._mouseScreenX = e.clientX;
    this._mouseScreenY = e.clientY;
  }

  /* ── Per-Frame Update (hover) ──────────────────────────────────────────── */

  /**
   * Called every render frame.
   * Casts a ray from the camera through the current mouse position and
   * highlights any hovered planet / moon, showing the tooltip.
   */
  update() {
    if (this.cameraController.isTransitioning) return;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Build target list: sun + all planets + VISIBLE moons + their hitboxes
    // (moon groups with scale=0 are excluded to avoid ghost hits)
    const visibleMoons = this.solarSystem.getMoonMeshes().filter(
      m => m.parent && m.parent.scale.x > 0.05
    );
    const visibleHitboxes = this.solarSystem.getMoonHitboxes().filter(
      m => m.parent && m.parent.scale.x > 0.05
    );
    // Extra interactive objects (sagittarius, galaxy, skill stars)
    const extraTargets = [];
    if (window.sagittariusSprite) extraTargets.push(window.sagittariusSprite);
    if (window.galaxyPoints)      extraTargets.push(window.galaxyPoints);
    if (window.skillStars)        window.skillStars.forEach(ss => extraTargets.push(ss.mesh));

    const targets = [
      this.solarSystem.getSunMesh(),
      ...this.solarSystem.getPlanetMeshes(),
      ...visibleMoons,
      ...visibleHitboxes,
      ...extraTargets,
    ];

    const hits = this.raycaster.intersectObjects(targets, false);
    // Filter out 'ignore' tagged objects
    const hit  = hits.find(h => h.object.userData.type !== 'ignore');

    if (hit) {
      const mesh = hit.object;
      const type = mesh.userData.type;

      if (mesh !== this._hoveredMesh) {
        this._hoveredMesh = mesh;

        // Only apply emissive glow to solar system objects
        if (type === 'sun' || type === 'planet' || type === 'moon') {
          this.solarSystem.setHovered(mesh);
        } else {
          this.solarSystem.setHovered(null);
        }

        this.canvas.style.cursor = 'pointer';

        // Determine tooltip label
        let label = '';
        if (type === 'sun') {
          label = 'THE CORE — Aaron Lad';
        } else if (type === 'planet') {
          const pd = this.solarSystem.getPlanetData(mesh.userData.planetId);
          label = pd ? `${pd.label} — ${pd.category}` : 'PLANET';
        } else if (type === 'moon') {
          const md = this.solarSystem.getMoonData(
            mesh.userData.moonId,
            mesh.userData.planetId
          );
          label = md ? md.title : 'MOON';
        } else if (type === 'sagittarius') {
          label = '&#9808; Sagittarius<br><small>Birthday: December 15</small>';
        } else if (type === 'galaxy') {
          label = '&#10022; View My GitHub Universe';
        } else if (type === 'skillstar') {
          label = `<span style="font-size:13px">&#9733; ${mesh.userData.label}</span>`;
        }

        this.ui.showTooltip(label, this._mouseScreenX, this._mouseScreenY);
      } else {
        // Keep tooltip position updated while hovering same object
        this.ui.showTooltip(
          this._tooltip_label || '',
          this._mouseScreenX,
          this._mouseScreenY
        );
      }

      // Cache label for position updates on same mesh
      if (type === 'sun') {
        this._tooltip_label = 'THE CORE — Aaron Lad';
      } else if (type === 'planet') {
        const pd = this.solarSystem.getPlanetData(mesh.userData.planetId);
        this._tooltip_label = pd ? `${pd.label} — ${pd.category}` : 'PLANET';
      } else if (type === 'moon') {
        const md = this.solarSystem.getMoonData(
          mesh.userData.moonId,
          mesh.userData.planetId
        );
        this._tooltip_label = md ? md.title : 'MOON';
      } else if (type === 'sagittarius') {
        this._tooltip_label = '&#9808; Sagittarius<br><small>Birthday: December 15</small>';
      } else if (type === 'galaxy') {
        this._tooltip_label = '&#10022; View My GitHub Universe';
      } else if (type === 'skillstar') {
        this._tooltip_label = `<span style="font-size:13px">&#9733; ${mesh.userData.label}</span>`;
      }

    } else {
      // Nothing under cursor — clear hover state
      if (this._hoveredMesh) {
        this._hoveredMesh = null;
        this.solarSystem.setHovered(null);
        this.canvas.style.cursor = 'default';
        this.ui.hideTooltip();
        this._tooltip_label = '';
      }
    }
  }

  /* ── Click Handler ─────────────────────────────────────────────────────── */

  /**
   * Handles a confirmed click (not drag) on the canvas.
   * Routes to the correct action based on what was clicked.
   * @param {MouseEvent} e
   */
  _onClick(e) {
    if (this.cameraController.isTransitioning) return;

    // Always recompute mouse position from the actual click event
    // (don't rely solely on the last mousemove coordinate)
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Only raycast visible moons + hitboxes (scale > 0)
    const visibleMoonsClick = this.solarSystem.getMoonMeshes().filter(
      m => m.parent && m.parent.scale.x > 0.05
    );
    const visibleHitboxesClick = this.solarSystem.getMoonHitboxes().filter(
      m => m.parent && m.parent.scale.x > 0.05
    );
    // Extra interactive objects
    const extraTargetsClick = [];
    if (window.sagittariusSprite) extraTargetsClick.push(window.sagittariusSprite);
    if (window.galaxyPoints)      extraTargetsClick.push(window.galaxyPoints);
    if (window.skillStars)        window.skillStars.forEach(ss => extraTargetsClick.push(ss.mesh));

    const targets = [
      this.solarSystem.getSunMesh(),
      ...this.solarSystem.getPlanetMeshes(),
      ...visibleMoonsClick,
      ...visibleHitboxesClick,
      ...extraTargetsClick,
    ];

    const hits = this.raycaster.intersectObjects(targets, false);
    const hit  = hits.find(h => h.object.userData.type !== 'ignore');

    if (!hit) return;

    const mesh = hit.object;
    const type = mesh.userData.type;

    if (type === 'sun') {
      this._handleSunClick();
    } else if (type === 'planet') {
      this._handlePlanetClick(mesh.userData.planetId);
    } else if (type === 'moon') {
      this._handleMoonClick(mesh.userData.moonId, mesh.userData.planetId);
    } else if (type === 'galaxy') {
      window.open('https://github.com/amlad15', '_blank', 'noopener');
    }
    // sagittarius and skillstar: hover only, no click action
  }

  /* ── Action Handlers ───────────────────────────────────────────────────── */

  /**
   * Clicking the sun opens the About Me panel.
   */
  _handleSunClick() {
    this.ui.showSunPanel(PORTFOLIO_DATA.sun);
  }

  /**
   * Clicking a planet:
   *   1. Zooms camera to planet
   *   2. Reveals moons with staggered animation
   *   3. Updates HUD + shows Back button
   * @param {string} planetId
   */
  _handlePlanetClick(planetId) {
    // Close info panel if open
    this.ui.hideInfoPanel();

    this.focusedPlanetId = planetId;

    const planetData = this.solarSystem.getPlanetData(planetId);
    if (!planetData) return;

    // Get planet's current world position
    const worldPos = new THREE.Vector3();
    this.solarSystem.getPlanetWorldPosition(planetId, worldPos);

    // Zoom camera
    this.cameraController.zoomToPlanet(worldPos, planetData.size, () => {
      // Re-enable orbit controls once zoom is done
    });

    // Reveal moons
    this.solarSystem.focusPlanet(planetId);

    // Update HUD
    this.ui.updateHUDPlanet(planetData.label, planetData.category);

    // Show Back button
    this.ui.showBackButton(() => this._returnToOverview());
  }

  /**
   * Clicking a moon:
   *   - For SIGNAL planet moons with a real link: open link in new tab
   *   - For all moons: show the sliding info panel
   * @param {string} moonId
   * @param {string} planetId
   */
  _handleMoonClick(moonId, planetId) {
    const moonData   = this.solarSystem.getMoonData(moonId, planetId);
    const planetData = this.solarSystem.getPlanetData(planetId);

    if (!moonData || !planetData) return;

    // SIGNAL planet moons open their link directly in a new tab
    if (planetId === 'signal' && moonData.link && moonData.link !== '#') {
      window.open(moonData.link, '_blank', 'noopener');
      // Still show the info panel as a confirmation
    }

    // Show info panel for all moons
    this.ui.showInfoPanel(moonData, planetData);
  }

  /**
   * Shared helper: returns camera to overview and resets all state.
   */
  _returnToOverview() {
    this.ui.hideInfoPanel();
    this.ui.hideBackButton();
    this.ui.resetHUD();

    this.solarSystem.unfocusAll();
    this.focusedPlanetId = null;

    this.cameraController.returnToOverview();
  }

  /* ── Keyboard ──────────────────────────────────────────────────────────── */

  /**
   * Handles keyboard shortcuts:
   *   Escape        → return to overview
   *   Arrow keys    → camera orbit / zoom (forwarded to CameraController)
   *   +/-           → zoom (forwarded to CameraController)
   * @param {KeyboardEvent} e
   */
  _onKeyDown(e) {
    switch (e.key) {
      case 'Escape':
        this._returnToOverview();
        break;

      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowUp':
      case 'ArrowDown':
      case '+':
      case '=':
      case '-':
      case '_':
        e.preventDefault();
        this.cameraController.handleKey(e.key);
        break;
    }
  }
}
