/**
 * interactions.js: pointer + keyboard input for 3D mode.
 *   hover  → highlight and pause orbits (moving targets were hard to hit)
 *   click  → sun = About, planet = focus, moon = detail panel
 *   keys   → arrows/+/- move the camera; Escape steps back one level
 * Listeners sit on the canvas, not window, so clicks in the panel or list never
 * fall through to the scene.
 */

class InteractionHandler {

  constructor(camera, solarSystem, cameraController, ui, canvas, scene) {
    this.camera           = camera;
    this.solarSystem      = solarSystem;
    this.cameraController = cameraController;
    this.ui               = ui;
    this.canvas           = canvas;
    this.scene            = scene;

    this.raycaster = new THREE.Raycaster();
    this.mouse     = new THREE.Vector2(-999, -999);           // off-screen until the pointer moves
    this._down     = null;
    this._hovered  = null;
    this._inside   = false;
    this.labelHover = false;                                  // set by main.js when a label is under the pointer
    this.focusedPlanetId = null;

    canvas.addEventListener('pointermove', e => { this._inside = true; this._setMouse(e); });
    canvas.addEventListener('pointerleave', () => { this._inside = false; this._clearHover(); });
    canvas.addEventListener('pointerdown', e => { if (e.button === 0) this._down = { x: e.clientX, y: e.clientY }; });
    canvas.addEventListener('pointerup', e => {
      if (e.button !== 0 || !this._down) return;
      const moved = Math.hypot(e.clientX - this._down.x, e.clientY - this._down.y);
      this._down = null;
      if (moved < 8) this._onClick(e);                        // small wobble is a click, more is a drag
    });
    canvas.addEventListener('keydown', e => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', '_'].includes(e.key)) {
        e.preventDefault();
        this.cameraController.handleKey(e.key);
      }
    });
  }

  _setMouse(e) {
    const r = this.canvas.getBoundingClientRect();
    this.mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  }

  _targets() {
    const shown = m => m.parent && m.parent.scale.x > 0.05;  // hidden moons sit at scale 0
    return [
      this.solarSystem.getSunMesh(),
      ...this.solarSystem.getPlanetMeshes(),
      ...this.solarSystem.getMoonMeshes().filter(shown),
      ...this.solarSystem.getMoonHitboxes().filter(shown)
    ];
  }

  _pick() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hit = this.raycaster.intersectObjects(this._targets(), false).find(h => h.object.userData.type !== 'ignore');
    return hit ? hit.object : null;
  }

  _clearHover() {
    if (this._hovered) this.solarSystem.setHovered(null);
    this._hovered = null;
    this.canvas.style.cursor = '';
  }

  /* Per frame: hover highlight + pause */
  update() {
    const mesh = (this._inside && !this.cameraController.isTransitioning) ? this._pick() : null;
    if (mesh !== this._hovered) {
      this._hovered = mesh;
      // Hitboxes are invisible; highlight the real moon mesh instead
      const vis = mesh && mesh.userData.type === 'moon' && mesh.material.visible === false
        ? this.solarSystem.getMoonMeshes().find(m => m.userData.moonId === mesh.userData.moonId) : mesh;
      this.solarSystem.setHovered(vis || null);
      this.canvas.style.cursor = mesh ? 'pointer' : '';
    }
    this.solarSystem.paused = !!mesh || this.labelHover;
  }

  _onClick(e) {
    if (this.cameraController.isTransitioning) return;
    this._setMouse(e);
    const mesh = this._pick();
    if (!mesh) return;
    const d = mesh.userData;
    if (d.type === 'sun')    this.selectSun();
    if (d.type === 'planet') this.selectPlanet(d.planetId);
    if (d.type === 'moon')   this.selectMoon(d.moonId, d.planetId);
  }

  /* ── Actions (shared by canvas, labels and the side list) ───────────── */

  selectSun() {
    this.ui.showPanel(this.scene.sun.panel, '#FF6A2B');
  }

  selectPlanet(planetId) {
    if (this.cameraController.isTransitioning) return;
    const pd = this.solarSystem.getPlanetData(planetId);
    if (!pd) return;
    this.ui.hidePanel();
    this.focusedPlanetId = planetId;
    const pos = new THREE.Vector3();
    this.solarSystem.getPlanetWorldPosition(planetId, pos);
    this.cameraController.zoomToPlanet(pos, pd.size, null, pd.moons.length);
    this.solarSystem.focusPlanet(planetId);
    this.ui.renderList(planetId);
  }

  selectMoon(moonId, planetId) {
    if (this.focusedPlanetId !== planetId) this.selectPlanet(planetId);   // list/deep path: bring its planet into view too
    const pd = this.solarSystem.getPlanetData(planetId);
    const md = pd && pd.moons.find(m => m.id === moonId);
    if (md) this.ui.showPanel(md.panel, SpaceUI.hex(pd.color));
  }

  overview() {
    if (this.cameraController.isTransitioning) return;
    this.ui.hidePanel();
    this.solarSystem.unfocusAll();
    this.focusedPlanetId = null;
    this.cameraController.returnToOverview();
    this.ui.renderList(null);
  }

  /* Escape walks back: panel → overview → exit 3D.
     Handled on keydown: Chrome only lets a dialog's cancel event be blocked once per user click. */
  onKeyDown(e) {
    if (e.key !== 'Escape') return;
    if (this.ui.isPanelOpen())  { e.preventDefault(); this.ui.hidePanel(); return; }
    if (this.focusedPlanetId)   { e.preventDefault(); this.overview(); }
  }
}
