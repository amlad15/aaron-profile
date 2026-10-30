/**
 * camera.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages the Three.js camera, OrbitControls, and all smooth TWEEN transitions:
 *   • Default overview position
 *   • Zoom-in to a selected planet
 *   • Return to overview
 *   • Keyboard zoom / rotate helpers
 * ─────────────────────────────────────────────────────────────────────────────
 */

class CameraController {

  /**
   * @param {THREE.PerspectiveCamera} camera   - The scene camera.
   * @param {HTMLElement}             domElement - Renderer's canvas element.
   */
  constructor(camera, domElement, opts) {
    this.camera     = camera;
    this.domElement = domElement;
    this.opts       = opts || {};
    this._fitRadius = this.opts.fitRadius || 560;            // outermost orbit + margin

    // Whether a TWEEN transition is in progress
    this.isTransitioning = false;

    // Default camera position (overview)
    this.defaultPosition = new THREE.Vector3();
    this.fitOverview();
    this.defaultTarget   = new THREE.Vector3(0, 0, 0);

    // Current OrbitControls target (updated during tweens)
    this._currentTarget = new THREE.Vector3(0, 0, 0);

    this._initOrbitControls();
    this._setDefaultPosition();
  }

  /* ── Initialisation ────────────────────────────────────────────────────── */

  /**
   * Sets up THREE.OrbitControls with comfortable defaults for exploring
   * the solar system (enable damping, limit zoom range, etc.)
   */
  _initOrbitControls() {
    this.controls = new THREE.OrbitControls(this.camera, this.domElement);

    this.controls.enableDamping  = true;
    this.controls.dampingFactor  = 0.06;
    this.controls.rotateSpeed    = 0.5;
    this.controls.zoomSpeed      = 1.0;
    this.controls.panSpeed       = 0.8;

    // Zoom limits
    this.controls.minDistance = 25;
    this.controls.maxDistance = 2600;                       // portrait phones need to pull far back to see every orbit

    // Restrict vertical orbit to avoid flipping upside-down
    this.controls.minPolarAngle = 0.15;
    this.controls.maxPolarAngle = Math.PI - 0.15;

    this.controls.target.copy(this.defaultTarget);
  }

  /**
   * Instantly snaps the camera to the default overview position.
   * Called once on init (no animation).
   */
  _setDefaultPosition() {
    this.camera.position.copy(this.defaultPosition);
    this.controls.target.copy(this.defaultTarget);
    this.controls.update();
  }

  /**
   * Distance at which the whole system fits the viewport width.
   * The old fixed position showed only 3 of 7 planets on a 386px phone.
   */
  fitOverview() {
    const vFov = THREE.MathUtils.degToRad(this.camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * this.camera.aspect);
    const fitW = this._fitRadius / Math.tan(hFov / 2);           // full width of the outer orbit
    const fitH = this._fitRadius * 0.55 / Math.tan(vFov / 2);    // seen at ~27°, the system is about half as tall as wide
    const dist = Math.max(520, fitW, fitH) * 0.92;
    this.defaultPosition.set(0, dist * 0.45, dist * 0.89);  // ~27° above the orbital plane
  }

  // Reduced motion: transitions become (almost) instant jumps
  _dur(ms) { return this.opts.reducedMotion ? 1 : ms; }

  /* ── Transitions ───────────────────────────────────────────────────────── */

  /**
   * Smoothly moves the camera to a viewing position near the given planet.
   * Disables OrbitControls during the tween, re-enables on completion.
   *
   * @param {THREE.Vector3} planetWorldPos - World position of the planet.
   * @param {number}        planetSize     - Planet radius (used to offset camera).
   * @param {Function}      [onComplete]   - Optional callback when tween finishes.
   */
  zoomToPlanet(planetWorldPos, planetSize, onComplete, moonCount = 4) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.controls.enabled = false;

    // Back off far enough that the outermost moon orbit fits the narrower screen axis
    const viewRadius = Math.max(planetSize * 4, planetSize * 2.6 + (moonCount - 1) * planetSize * 1.4 + planetSize);
    const vFov = THREE.MathUtils.degToRad(this.camera.fov);
    const fov  = Math.min(vFov, 2 * Math.atan(Math.tan(vFov / 2) * this.camera.aspect));
    const dist = viewRadius / Math.tan(fov / 2) * 1.05;
    const offset = new THREE.Vector3(0, 0.55, 0.83).normalize().multiplyScalar(dist);  // above and in front
    const camTarget = planetWorldPos.clone().add(offset);

    const DURATION = this._dur(1200);

    // Tween camera position
    const posStart = { x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z };
    new TWEEN.Tween(posStart)
      .to({ x: camTarget.x, y: camTarget.y, z: camTarget.z }, DURATION)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(() => {
        this.camera.position.set(posStart.x, posStart.y, posStart.z);
      })
      .start();

    // Tween OrbitControls target toward planet centre
    const tgtStart = { x: this.controls.target.x, y: this.controls.target.y, z: this.controls.target.z };
    new TWEEN.Tween(tgtStart)
      .to({ x: planetWorldPos.x, y: planetWorldPos.y, z: planetWorldPos.z }, DURATION)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(() => {
        this.controls.target.set(tgtStart.x, tgtStart.y, tgtStart.z);
        this.controls.update();
      })
      .onComplete(() => {
        this.isTransitioning = false;
        this.controls.enabled = true;
        this._currentTarget.copy(planetWorldPos);
        if (onComplete) onComplete();
      })
      .start();
  }

  /**
   * Smoothly returns the camera to the default overview position.
   * @param {Function} [onComplete] - Optional callback when tween finishes.
   */
  returnToOverview(onComplete) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.controls.enabled = false;

    const DURATION = this._dur(1000);

    const posStart = { x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z };
    new TWEEN.Tween(posStart)
      .to({ x: this.defaultPosition.x, y: this.defaultPosition.y, z: this.defaultPosition.z }, DURATION)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(() => {
        this.camera.position.set(posStart.x, posStart.y, posStart.z);
      })
      .start();

    const tgtStart = { x: this.controls.target.x, y: this.controls.target.y, z: this.controls.target.z };
    new TWEEN.Tween(tgtStart)
      .to({ x: this.defaultTarget.x, y: this.defaultTarget.y, z: this.defaultTarget.z }, DURATION)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(() => {
        this.controls.target.set(tgtStart.x, tgtStart.y, tgtStart.z);
        this.controls.update();
      })
      .onComplete(() => {
        this.isTransitioning = false;
        this.controls.enabled = true;
        this._currentTarget.copy(this.defaultTarget);
        if (onComplete) onComplete();
      })
      .start();
  }

  /* ── Keyboard Helpers ──────────────────────────────────────────────────── */

  /**
   * Handles keyboard input for camera navigation:
   *   Arrow keys  → rotate orbit
   *   +/-         → zoom
   *   Escape      → return to overview (handled in interactions.js)
   * @param {string} key - The key string from a keydown event.
   */
  handleKey(key) {
    const ROTATE_STEP = 0.05;
    const ZOOM_STEP   = 20;

    // OrbitControls internal state — manipulate spherical coords
    switch (key) {
      case 'ArrowLeft':
        this.controls.object.position.applyAxisAngle(
          new THREE.Vector3(0, 1, 0), ROTATE_STEP
        );
        this.controls.update();
        break;
      case 'ArrowRight':
        this.controls.object.position.applyAxisAngle(
          new THREE.Vector3(0, 1, 0), -ROTATE_STEP
        );
        this.controls.update();
        break;
      case 'ArrowUp': {
        // Move camera slightly closer to target
        const dir = new THREE.Vector3()
          .subVectors(this.controls.target, this.camera.position)
          .normalize();
        this.camera.position.addScaledVector(dir, ZOOM_STEP);
        this.controls.update();
        break;
      }
      case 'ArrowDown': {
        const dir = new THREE.Vector3()
          .subVectors(this.controls.target, this.camera.position)
          .normalize();
        this.camera.position.addScaledVector(dir, -ZOOM_STEP);
        this.controls.update();
        break;
      }
      case '+':
      case '=': {
        const dir2 = new THREE.Vector3()
          .subVectors(this.controls.target, this.camera.position)
          .normalize();
        this.camera.position.addScaledVector(dir2, ZOOM_STEP * 1.5);
        this.controls.update();
        break;
      }
      case '-':
      case '_': {
        const dir3 = new THREE.Vector3()
          .subVectors(this.controls.target, this.camera.position)
          .normalize();
        this.camera.position.addScaledVector(dir3, -ZOOM_STEP * 1.5);
        this.controls.update();
        break;
      }
    }
  }

  /* ── Per-Frame Update ──────────────────────────────────────────────────── */

  /**
   * Must be called every frame to apply OrbitControls damping.
   */
  update() {
    this.controls.update();
  }
}
