/**
 * solar-system.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Builds and animates the entire 3D solar system:
 *   • The Sun (textured canvas sphere + glow shells + point light)
 *   • Seven planets with richly-textured canvas surfaces
 *   • Atmosphere glow shells on every planet
 *   • Moons for each planet (hidden until planet is focused)
 *   • Orbit line rings
 * All textures are procedurally generated — zero external URLs.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/* ── Planet id → canvas texture type ──────────────────────────────────────── */
const PLANET_TEXTURE_TYPE = {
  nexus:   'mars',
  forge:   'neptune',
  matrix:  'toxic',
  citadel: 'earth',
  pulse:   'jupiter',
  signal:  'ice',
  vault:   'volcanic',
};

/* ── Atmosphere config per planet ──────────────────────────────────────────── */
const PLANET_ATMO = {
  nexus:   { color: 0xff2200, opacity: 0.18 },
  forge:   { color: 0x0055ff, opacity: 0.20 },
  matrix:  { color: 0x00ff44, opacity: 0.15 },
  citadel: { color: 0x4499ff, opacity: 0.18 },
  pulse:   { color: 0xff8833, opacity: 0.15 },
  signal:  { color: 0x00ffee, opacity: 0.18 },
  vault:   { color: 0xffaa00, opacity: 0.15 },
};

/* ══════════════════════════════════════════════════════════════════════════════
   PROCEDURAL PLANET TEXTURES (512 × 512 canvas, all drawn CPU-side)
══════════════════════════════════════════════════════════════════════════════ */

function makePlanetTexture(type) {
  const SIZE = 512;
  const c    = document.createElement('canvas');
  c.width    = SIZE;
  c.height   = SIZE;
  const ctx  = c.getContext('2d');

  const rng = Math.random; // shorthand

  /* helpers ──────────────────────────────────────────────────────────────── */
  function blob(x, y, r, col) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0,   col);
    g.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(Math.max(0, x - r), Math.max(0, y - r), r * 2, r * 2);
  }
  function fill(col) { ctx.fillStyle = col; ctx.fillRect(0, 0, SIZE, SIZE); }
  function randBetween(a, b) { return a + rng() * (b - a); }

  /* ── SUN ─────────────────────────────────────────────────────────────── */
  if (type === 'sun') {
    const bg = ctx.createRadialGradient(256, 256, 0, 256, 256, 280);
    bg.addColorStop(0,   '#ffcc00');
    bg.addColorStop(0.3, '#ff7700');
    bg.addColorStop(0.7, '#ff2200');
    bg.addColorStop(1,   '#cc1100');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Granulation blobs
    for (let i = 0; i < 300; i++) {
      const x = rng() * SIZE, y = rng() * SIZE, r = 3 + rng() * 16;
      const t = rng();
      const R = Math.round(204 + t * 51), G = Math.round(34 + t * 102);
      blob(x, y, r, `rgba(${R},${G},0,${0.08 + rng() * 0.25})`);
    }
    // Bright flare spots
    for (let i = 0; i < 30; i++) {
      blob(rng() * SIZE, rng() * SIZE, 2 + rng() * 8,
        `rgba(255,255,200,${0.4 + rng() * 0.5})`);
    }
    // Sunspots
    for (let i = 0; i < 20; i++) {
      const x = rng() * SIZE, y = rng() * SIZE, r = 4 + rng() * 14;
      blob(x, y, r, `rgba(60,0,0,${0.55 + rng() * 0.3})`);
    }
  }

  /* ── MARS ────────────────────────────────────────────────────────────── */
  else if (type === 'mars') {
    fill('#6b2810');

    // Large surface regions
    for (let i = 0; i < 60; i++) {
      const x = rng() * SIZE, y = rng() * SIZE, r = 30 + rng() * 90;
      const dark = rng() < 0.4;
      const col  = dark ? `rgba(30,10,5,0.15)` : `rgba(180,80,30,0.12)`;
      blob(x, y, r, col);
    }
    // Craters
    for (let i = 0; i < 180; i++) {
      const x = rng() * SIZE, y = rng() * SIZE, r = 2 + rng() * 12;
      blob(x, y, r, `rgba(30,10,5,0.55)`);
      ctx.beginPath();
      ctx.arc(x, y, r * 0.9, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(200,120,60,0.4)`;
      ctx.lineWidth   = 0.8;
      ctx.stroke();
    }
    // Polar ice cap (top)
    const ice = ctx.createRadialGradient(256, 0, 0, 256, 0, 100);
    ice.addColorStop(0,   'rgba(220,235,255,0.92)');
    ice.addColorStop(0.6, 'rgba(200,220,255,0.45)');
    ice.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = ice;
    ctx.fillRect(0, 0, SIZE, 120);
    // Dust storm streaks
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = '#c47840';
    ctx.lineWidth   = 7;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(rng() * SIZE, rng() * 200);
      ctx.lineTo(rng() * SIZE, 300 + rng() * 200);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ── NEPTUNE ─────────────────────────────────────────────────────────── */
  else if (type === 'neptune') {
    fill('#0a1540');

    const BANDS = ['#0020aa','#0040cc','#0060dd','#1155bb','#002299','#0048bb','#0055cc','#003399'];
    const bandH = SIZE / 12;
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle  = BANDS[i % BANDS.length];
      ctx.globalAlpha = 0.55 + rng() * 0.3;
      ctx.fillRect(0, i * bandH, SIZE, bandH + 2);
    }
    ctx.globalAlpha = 1;

    // Bright polar region (top 15%)
    const polar = ctx.createLinearGradient(0, 0, 0, SIZE * 0.15);
    polar.addColorStop(0,   'rgba(180,220,255,0.7)');
    polar.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = polar;
    ctx.fillRect(0, 0, SIZE, SIZE * 0.18);

    // Storm ovals
    for (let i = 0; i < 8; i++) {
      const x = rng() * SIZE, y = rng() * SIZE;
      const w = 20 + rng() * 50, h = 10 + rng() * 25;
      ctx.beginPath();
      ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(80,150,255,${0.25 + rng() * 0.3})`;
      ctx.fill();
    }

    // Atmospheric swirls
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = '#4488ff';
    ctx.lineWidth   = 2;
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo(0, rng() * SIZE);
      ctx.bezierCurveTo(
        SIZE * 0.3, rng() * SIZE,
        SIZE * 0.7, rng() * SIZE,
        SIZE, rng() * SIZE
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ── TOXIC (Matrix planet) ───────────────────────────────────────────── */
  else if (type === 'toxic') {
    fill('#050f05');

    // Horizontal green bands
    for (let i = 0; i < 10; i++) {
      const y  = rng() * SIZE;
      const h  = 8 + rng() * 40;
      const g  = 30 + Math.round(rng() * 80);
      ctx.fillStyle  = `rgba(0,${g},0,${0.2 + rng() * 0.35})`;
      ctx.fillRect(0, y, SIZE, h);
    }

    // Circuit-line veins
    ctx.strokeStyle = '#00ff44';
    ctx.lineWidth   = 1.5;
    ctx.globalAlpha = 0.55;
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      let x = rng() * SIZE, y = rng() * SIZE;
      ctx.moveTo(x, y);
      const steps = 3 + Math.floor(rng() * 5);
      for (let s = 0; s < steps; s++) {
        if (rng() < 0.5) { x += (rng() - 0.5) * 80; }
        else             { y += (rng() - 0.5) * 80; }
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Glowing patches
    for (let i = 0; i < 25; i++) {
      const g2 = 80 + Math.round(rng() * 175);
      blob(rng() * SIZE, rng() * SIZE, 10 + rng() * 40,
        `rgba(0,${g2},20,${0.18 + rng() * 0.25})`);
    }
  }

  /* ── EARTH ───────────────────────────────────────────────────────────── */
  else if (type === 'earth') {
    fill('#061428');

    // Ocean depth variation
    for (let i = 0; i < 40; i++) {
      const dark = rng() < 0.5;
      blob(rng() * SIZE, rng() * SIZE, 20 + rng() * 80,
        dark ? 'rgba(4,20,60,0.3)' : 'rgba(10,50,120,0.25)');
    }

    // Continents (green/brown)
    const contColors = ['#2d5a1b','#3d7a22','#8b6914','#6b5012','#4a8a1a','#705518','#2a5018','#916a10'];
    for (let i = 0; i < 8; i++) {
      const cx = rng() * SIZE, cy = 80 + rng() * (SIZE - 160);
      const col = contColors[i % contColors.length];
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rng() * Math.PI * 2);
      ctx.beginPath();
      const pts = 8 + Math.floor(rng() * 6);
      for (let p = 0; p < pts; p++) {
        const ang = (p / pts) * Math.PI * 2;
        const rad = 25 + rng() * 55;
        const px  = Math.cos(ang) * rad + (rng() - 0.5) * 20;
        const py  = Math.sin(ang) * rad * (0.5 + rng() * 0.5) + (rng() - 0.5) * 20;
        if (p === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle   = col;
      ctx.globalAlpha = 0.8 + rng() * 0.2;
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    // Cloud wisps
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 2;
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.moveTo(rng() * SIZE, rng() * SIZE);
      ctx.bezierCurveTo(rng() * SIZE, rng() * SIZE, rng() * SIZE, rng() * SIZE, rng() * SIZE, rng() * SIZE);
      ctx.stroke();
    }
    ctx.restore();

    // Ice caps
    const icN = ctx.createLinearGradient(0, 0, 0, 70);
    icN.addColorStop(0, 'rgba(240,248,255,0.95)');
    icN.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = icN; ctx.fillRect(0, 0, SIZE, 70);
    const icS = ctx.createLinearGradient(0, SIZE, 0, SIZE - 60);
    icS.addColorStop(0, 'rgba(240,248,255,0.90)');
    icS.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = icS; ctx.fillRect(0, SIZE - 60, SIZE, 60);
  }

  /* ── JUPITER ─────────────────────────────────────────────────────────── */
  else if (type === 'jupiter') {
    fill('#c8884a');

    const BAND_COLORS = [
      '#e8aa66','#8b4513','#cc6633','#e0a055','#7a3a0a',
      '#d49044','#6b3008','#dda060','#804010','#e8b070',
      '#8b4513','#cc7733','#7a3a0a','#dda060','#8b4020','#e0a055',
    ];
    const bandH = SIZE / 16;
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle  = BAND_COLORS[i];
      ctx.globalAlpha = 0.85;
      // Slight waviness
      ctx.beginPath();
      const yBase = i * bandH;
      ctx.moveTo(0, yBase);
      for (let x = 0; x <= SIZE; x += 16) {
        ctx.lineTo(x, yBase + Math.sin(x * 0.04 + i) * 3);
      }
      ctx.lineTo(SIZE, yBase + bandH);
      ctx.lineTo(0, yBase + bandH);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Great Red Spot
    ctx.save();
    ctx.translate(180, 280);
    ctx.scale(1, 0.55);
    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, Math.PI * 2);
    ctx.fillStyle = '#cc3300';
    ctx.globalAlpha = 0.9;
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;

    // Storm ovals
    for (let i = 0; i < 10; i++) {
      ctx.save();
      ctx.translate(rng() * SIZE, rng() * SIZE);
      ctx.scale(1, 0.45 + rng() * 0.3);
      ctx.beginPath();
      ctx.arc(0, 0, 8 + rng() * 22, 0, Math.PI * 2);
      ctx.fillStyle  = rng() < 0.5 ? '#ffddaa' : '#aa5522';
      ctx.globalAlpha = 0.5 + rng() * 0.35;
      ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }

  /* ── ICE (Signal planet) ─────────────────────────────────────────────── */
  else if (type === 'ice') {
    fill('#0a2030');

    // Cyan teal base tint
    blob(256, 256, 280, 'rgba(0,120,140,0.35)');

    // Crystalline crack network
    ctx.save();
    ctx.strokeStyle = 'rgba(200,240,255,0.6)';
    ctx.lineWidth   = 1;
    for (let i = 0; i < 60; i++) {
      ctx.beginPath();
      let x = rng() * SIZE, y = rng() * SIZE;
      ctx.moveTo(x, y);
      const segs = 2 + Math.floor(rng() * 4);
      for (let s = 0; s < segs; s++) {
        x += (rng() - 0.5) * 120;
        y += (rng() - 0.5) * 120;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();

    // Ice patches
    for (let i = 0; i < 30; i++) {
      blob(rng() * SIZE, rng() * SIZE, 15 + rng() * 55,
        `rgba(220,240,255,${0.12 + rng() * 0.28})`);
    }

    // Dark rifts
    ctx.save();
    ctx.strokeStyle = 'rgba(2,15,30,0.6)';
    ctx.lineWidth   = 3;
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.moveTo(rng() * SIZE, rng() * SIZE);
      ctx.lineTo(rng() * SIZE, rng() * SIZE);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ── VOLCANIC (Vault planet) ─────────────────────────────────────────── */
  else if (type === 'volcanic') {
    fill('#1a0800');

    // Dark gold ambient tone
    for (let i = 0; i < 30; i++) {
      blob(rng() * SIZE, rng() * SIZE, 30 + rng() * 90,
        `rgba(${80 + Math.round(rng()*60)},${30 + Math.round(rng()*30)},0,0.2)`);
    }

    // 150 volcanic features
    for (let i = 0; i < 150; i++) {
      const x = rng() * SIZE, y = rng() * SIZE, r = 3 + rng() * 18;
      blob(x, y, r, `rgba(40,10,0,0.55)`);
      ctx.beginPath();
      ctx.arc(x, y, r * 1.3, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${150 + Math.round(rng()*80)},${40 + Math.round(rng()*40)},0,0.35)`;
      ctx.lineWidth   = 0.8;
      ctx.stroke();
    }

    // Lava flow lines
    ctx.save();
    ctx.strokeStyle = '#ff6600';
    ctx.lineWidth   = 1.5;
    ctx.globalAlpha = 0.65;
    for (let i = 0; i < 18; i++) {
      ctx.beginPath();
      const sx = rng() * SIZE, sy = rng() * SIZE;
      ctx.moveTo(sx, sy);
      ctx.bezierCurveTo(
        sx + (rng()-0.5)*120, sy + (rng()-0.5)*120,
        sx + (rng()-0.5)*120, sy + (rng()-0.5)*120,
        sx + (rng()-0.5)*180, sy + (rng()-0.5)*180
      );
      ctx.stroke();
    }
    ctx.restore();

    // Sulfuric yellow patches
    for (let i = 0; i < 20; i++) {
      blob(rng() * SIZE, rng() * SIZE, 10 + rng() * 35,
        `rgba(160,140,0,${0.15 + rng() * 0.25})`);
    }

    // Glowing calderas
    for (let i = 0; i < 8; i++) {
      blob(rng() * SIZE, rng() * SIZE, 6 + rng() * 18,
        `rgba(255,${80 + Math.round(rng()*80)},0,${0.5 + rng() * 0.5})`);
    }
  }

  /* ── MOON ────────────────────────────────────────────────────────────── */
  else if (type === 'moon') {
    fill('#707068');

    // Terrain variation
    for (let i = 0; i < 40; i++) {
      const br = rng() < 0.5 ? 'rgba(90,88,80,0.35)' : 'rgba(130,128,118,0.25)';
      blob(rng() * SIZE, rng() * SIZE, 20 + rng() * 80, br);
    }
    // Mare (dark flat areas)
    for (let i = 0; i < 6; i++) {
      const x = rng() * SIZE, y = rng() * SIZE;
      blob(x, y, 30 + rng() * 60, `rgba(50,48,44,${0.5 + rng() * 0.35})`);
    }
    // 120 craters
    for (let i = 0; i < 120; i++) {
      const x = rng() * SIZE, y = rng() * SIZE, r = 1.5 + rng() * 14;
      blob(x, y, r, `rgba(50,48,44,0.6)`);
      ctx.beginPath();
      ctx.arc(x, y, r * 1.1, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(160,158,148,0.35)`;
      ctx.lineWidth   = 0.6;
      ctx.stroke();
    }
    // Ray systems
    ctx.save();
    ctx.strokeStyle = 'rgba(200,198,188,0.3)';
    ctx.lineWidth   = 0.6;
    for (let i = 0; i < 12; i++) {
      const cx = rng() * SIZE, cy = rng() * SIZE;
      for (let j = 0; j < 6; j++) {
        const ang = rng() * Math.PI * 2;
        const len = 40 + rng() * 80;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(ang) * len, cy + Math.sin(ang) * len);
        ctx.stroke();
      }
    }
    ctx.restore();

    // Bright highlands
    for (let i = 0; i < 15; i++) {
      blob(rng() * SIZE, rng() * SIZE, 15 + rng() * 40,
        `rgba(200,198,185,${0.12 + rng() * 0.18})`);
    }
  }

  return new THREE.CanvasTexture(c);
}

/* ══════════════════════════════════════════════════════════════════════════════
   SOLAR SYSTEM CLASS
══════════════════════════════════════════════════════════════════════════════ */

class SolarSystem {

  constructor(scene) {
    this.scene = scene;

    this._planetMeshes = [];
    this._moonMeshes   = [];
    this._moonHitboxes = [];
    this._sunMesh      = null;

    this._planets  = [];
    this._sunGroup = null;

    this._focusedPlanetId = null;
    this._moonTweens      = [];

    // ── Strong directional key light (top-left) ──────────────────────────
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(-200, 300, 200);
    keyLight.name = 'keyLight';
    this.scene.add(keyLight);

    // ── Dim fill from opposite side ──────────────────────────────────────
    const fillLight = new THREE.DirectionalLight(0x334466, 0.4);
    fillLight.position.set(200, -100, -200);
    fillLight.name = 'fillLight';
    this.scene.add(fillLight);

    this._buildSun();
    this._buildPlanets();
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     SUN
  ═══════════════════════════════════════════════════════════════════════════ */

  _buildSun() {
    this._sunGroup      = new THREE.Group();
    this._sunGroup.name = 'sunGroup';

    const SUN_RADIUS = 32;

    // Canvas texture (generated once, reused for both map + emissiveMap)
    const sunTex = makePlanetTexture('sun');

    const coreMat = new THREE.MeshStandardMaterial({
      map:               sunTex,
      emissiveMap:       sunTex,
      emissive:          new THREE.Color(0xff4400),
      emissiveIntensity: 1.4,
      roughness:         0.5,
      metalness:         0.0,
    });
    const coreMesh = new THREE.Mesh(
      new THREE.SphereGeometry(SUN_RADIUS, 48, 48),
      coreMat
    );
    coreMesh.name     = 'sun';
    coreMesh.userData = { type: 'sun' };
    this._sunMesh     = coreMesh;
    this._sunGroup.add(coreMesh);

    // Outer glow shell
    const glowMat = new THREE.MeshBasicMaterial({
      color:       new THREE.Color(0xff7700),
      transparent: true,
      opacity:     0.25,
      side:        THREE.BackSide,
      blending:    THREE.AdditiveBlending,
      depthWrite:  false,
    });
    this._sunGlow = new THREE.Mesh(
      new THREE.SphereGeometry(SUN_RADIUS * 1.45, 32, 32),
      glowMat
    );
    this._sunGlow.userData = { type: 'ignore' };
    this._sunGroup.add(this._sunGlow);

    // Secondary softer outer glow
    const outerGlowMat = new THREE.MeshBasicMaterial({
      color:       new THREE.Color(0xff4400),
      transparent: true,
      opacity:     0.10,
      side:        THREE.BackSide,
      blending:    THREE.AdditiveBlending,
      depthWrite:  false,
    });
    this._sunOuterGlow = new THREE.Mesh(
      new THREE.SphereGeometry(SUN_RADIUS * 2.0, 32, 32),
      outerGlowMat
    );
    this._sunOuterGlow.userData = { type: 'ignore' };
    this._sunGroup.add(this._sunOuterGlow);

    // Wireframe overlay
    const icoMat = new THREE.MeshBasicMaterial({
      color:       new THREE.Color(0xffcc44),
      wireframe:   true,
      transparent: true,
      opacity:     0.16,
    });
    this._sunWireframe = new THREE.Mesh(
      new THREE.IcosahedronGeometry(SUN_RADIUS + 1, 2),
      icoMat
    );
    this._sunWireframe.userData = { type: 'ignore' };
    this._sunGroup.add(this._sunWireframe);

    // Point light
    const sunLight = new THREE.PointLight(0xfff5cc, 3.0, 1800, 1.4);
    sunLight.name  = 'sunLight';
    this._sunGroup.add(sunLight);

    this.scene.add(this._sunGroup);
    this._sunPulseTime = 0;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     PLANETS & MOONS
  ═══════════════════════════════════════════════════════════════════════════ */

  _buildPlanets() {
    PORTFOLIO_DATA.planets.forEach((data, pIdx) => {
      this._planets.push(this._buildSinglePlanet(data, pIdx));
    });
  }

  _buildSinglePlanet(data, pIdx) {
    const startAngle = (pIdx / PORTFOLIO_DATA.planets.length) * Math.PI * 2;

    this._addOrbitRing(data.orbitRadius, data.tilt, data.color);

    const group = new THREE.Group();
    group.name  = `planet-group-${data.id}`;
    this.scene.add(group);

    // ── Canvas texture material ──────────────────────────────────────────
    const texType = PLANET_TEXTURE_TYPE[data.id] || 'moon';
    const tex     = makePlanetTexture(texType);

    const mat = new THREE.MeshStandardMaterial({
      map:               tex,
      emissive:          new THREE.Color(data.color),
      emissiveIntensity: 0.0,
      roughness:         0.7,
      metalness:         0.1,
    });

    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(data.size, 32, 32),
      mat
    );
    mesh.name          = `planet-${data.id}`;
    mesh.castShadow    = true;
    mesh.receiveShadow = true;
    mesh.userData = {
      type:     'planet',
      planetId: data.id,
      baseEmissiveIntensity: 0.0,
    };
    group.add(mesh);
    this._planetMeshes.push(mesh);

    // ── Atmosphere glow ──────────────────────────────────────────────────
    const atmo = PLANET_ATMO[data.id];
    if (atmo) {
      this._addAtmosphereGlow(group, data.size, atmo.color, atmo.opacity);
    }

    // ── Decorative ring (every 3rd planet) ───────────────────────────────
    if (pIdx % 3 === 1) {
      const ringMat = new THREE.MeshBasicMaterial({
        color:       new THREE.Color(data.color),
        transparent: true,
        opacity:     0.30,
        side:        THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(data.size * 1.7, data.size * 0.08, 8, 64),
        ringMat
      );
      ring.rotation.x = Math.PI / 2 + 0.4;
      ring.userData   = { type: 'ignore' };
      group.add(ring);
    }

    // ── Moons ────────────────────────────────────────────────────────────
    const moons = [];
    data.moons.forEach((moonData, mIdx) => {
      moons.push(this._buildMoon(moonData, mIdx, data, group));
    });

    return { data, group, mesh, angle: startAngle, moons, isFocused: false, cloudMesh: null };
  }

  _addOrbitRing(radius, tilt, color) {
    const SEGMENTS = 128;
    const points   = [];
    for (let i = 0; i <= SEGMENTS; i++) {
      const a = (i / SEGMENTS) * Math.PI * 2;
      points.push(new THREE.Vector3(
        Math.cos(a) * radius,
        Math.sin(a) * Math.sin(tilt) * radius * 0.18,
        Math.sin(a) * radius
      ));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color:       new THREE.Color(color),
      transparent: true,
      opacity:     0.18,
      depthWrite:  false,
    });
    const ring    = new THREE.LineLoop(geo, mat);
    ring.userData = { type: 'ignore' };
    this.scene.add(ring);
  }

  _buildMoon(moonData, mIdx, planetData, parentGrp) {
    const BASE_MOON_ORBIT    = planetData.size * 2.6;
    const MOON_ORBIT_SPACING = planetData.size * 1.4;
    const orbitRadius = BASE_MOON_ORBIT + mIdx * MOON_ORBIT_SPACING;
    const orbitSpeed  = 0.55 + mIdx * 0.1 + Math.random() * 0.2;
    const tilt        = (mIdx % 3) * 0.35 - 0.35;

    const moonGroup = new THREE.Group();
    moonGroup.name  = `moon-group-${moonData.id}`;
    parentGrp.add(moonGroup);

    const moonSize = 2.2 + (mIdx % 2) * 0.8;
    const moonTex  = makePlanetTexture('moon');
    const moonMat  = new THREE.MeshStandardMaterial({
      map:               moonTex,
      emissive:          new THREE.Color(planetData.color),
      emissiveIntensity: 0.0,
      roughness:         0.9,
      metalness:         0.0,
    });
    const moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(moonSize, 16, 16),
      moonMat
    );
    moonMesh.name     = `moon-${moonData.id}`;
    moonMesh.userData = {
      type:     'moon',
      moonId:   moonData.id,
      planetId: planetData.id,
      baseEmissiveIntensity: 0.0,
    };
    moonGroup.add(moonMesh);
    this._moonMeshes.push(moonMesh);

    // Invisible hitbox
    const hitboxMesh = new THREE.Mesh(
      new THREE.SphereGeometry(moonSize * 3.8, 8, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitboxMesh.name     = `moon-hitbox-${moonData.id}`;
    hitboxMesh.userData = {
      type:     'moon',
      moonId:   moonData.id,
      planetId: planetData.id,
    };
    moonGroup.add(hitboxMesh);
    this._moonHitboxes.push(hitboxMesh);

    const moonOrbitRing = this._addMoonOrbitRing(orbitRadius, planetData.color, parentGrp);
    moonGroup.scale.setScalar(0);

    return {
      data: moonData,
      group: moonGroup,
      mesh: moonMesh,
      orbitRing: moonOrbitRing,
      angle: (mIdx / planetData.moons.length) * Math.PI * 2,
      orbitRadius,
      orbitSpeed,
      tilt,
      isVisible: false,
    };
  }

  _addMoonOrbitRing(radius, color, parentGrp) {
    const SEGMENTS = 64;
    const points   = [];
    for (let i = 0; i <= SEGMENTS; i++) {
      const a = (i / SEGMENTS) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color:       new THREE.Color(color),
      transparent: true,
      opacity:     0.12,
      depthWrite:  false,
    });
    const ring    = new THREE.LineLoop(geo, mat);
    ring.userData = { type: 'ignore' };
    ring.visible  = false;
    parentGrp.add(ring);
    return ring;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     ATMOSPHERE HELPER
  ═══════════════════════════════════════════════════════════════════════════ */

  _addAtmosphereGlow(group, size, color, opacity) {
    const glowMat = new THREE.MeshBasicMaterial({
      color:       new THREE.Color(color),
      transparent: true,
      opacity:     opacity,
      side:        THREE.BackSide,
      blending:    THREE.AdditiveBlending,
      depthWrite:  false,
    });
    const glowMesh = new THREE.Mesh(
      new THREE.SphereGeometry(size * 1.15, 32, 32),
      glowMat
    );
    glowMesh.userData = { type: 'ignore' };
    group.add(glowMesh);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     FOCUS / UNFOCUS
  ═══════════════════════════════════════════════════════════════════════════ */

  focusPlanet(planetId) {
    if (this._focusedPlanetId && this._focusedPlanetId !== planetId) {
      this._hideMoons(this._focusedPlanetId);
    }
    this._focusedPlanetId = planetId;
    const planetObj = this._planets.find(p => p.data.id === planetId);
    if (!planetObj) return;

    planetObj.isFocused = true;
    planetObj.moons.forEach((moonObj, mIdx) => {
      const delay  = mIdx * 120;
      const target = { s: 0 };
      if (moonObj._tween) moonObj._tween.stop();
      moonObj.group.scale.setScalar(0);
      moonObj.orbitRing.visible = true;
      moonObj._tween = new TWEEN.Tween(target)
        .to({ s: 1 }, 600)
        .delay(delay)
        .easing(TWEEN.Easing.Back.Out)
        .onUpdate(() => { moonObj.group.scale.setScalar(target.s); })
        .onComplete(() => { moonObj.isVisible = true; })
        .start();
    });
  }

  _hideMoons(planetId) {
    const planetObj = this._planets.find(p => p.data.id === planetId);
    if (!planetObj) return;
    planetObj.isFocused = false;
    planetObj.moons.forEach(moonObj => {
      if (moonObj._tween) moonObj._tween.stop();
      const target = { s: moonObj.group.scale.x };
      moonObj._tween = new TWEEN.Tween(target)
        .to({ s: 0 }, 350)
        .easing(TWEEN.Easing.Quadratic.In)
        .onUpdate(() => moonObj.group.scale.setScalar(target.s))
        .onComplete(() => {
          moonObj.isVisible = false;
          moonObj.orbitRing.visible = false;
        })
        .start();
    });
  }

  unfocusAll() {
    if (this._focusedPlanetId) this._hideMoons(this._focusedPlanetId);
    this._focusedPlanetId = null;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     PER-FRAME UPDATE
  ═══════════════════════════════════════════════════════════════════════════ */

  update(delta, focusedId) {
    this._animateSun(delta);

    this._planets.forEach(planetObj => {
      const data = planetObj.data;

      if (focusedId !== data.id) {
        planetObj.angle += data.orbitSpeed * delta;
      }

      const a = planetObj.angle;
      const r = data.orbitRadius;
      planetObj.group.position.set(
        Math.cos(a) * r,
        Math.sin(a) * Math.sin(data.tilt) * r * 0.18,
        Math.sin(a) * r
      );

      planetObj.mesh.rotation.y += 0.3 * delta;

      planetObj.moons.forEach(moonObj => {
        moonObj.angle += moonObj.orbitSpeed * delta;
        const ma = moonObj.angle;
        const mr = moonObj.orbitRadius;
        moonObj.group.position.set(
          Math.cos(ma) * mr,
          Math.sin(ma) * Math.sin(moonObj.tilt) * mr * 0.3,
          Math.sin(ma) * mr
        );
      });
    });
  }

  _animateSun(delta) {
    this._sunPulseTime += delta;
    const pulse = Math.sin(this._sunPulseTime * 1.8) * 0.5 + 0.5;

    this._sunMesh.rotation.y      += 0.05 * delta;
    this._sunWireframe.rotation.y -= 0.03 * delta;
    this._sunWireframe.rotation.x += 0.015 * delta;

    this._sunGlow.material.opacity      = 0.18 + pulse * 0.14;
    this._sunOuterGlow.material.opacity = 0.06 + pulse * 0.06;
    this._sunGlow.scale.setScalar(1.0 + pulse * 0.04);

    this._sunMesh.material.emissiveIntensity = 1.0 + pulse * 0.4;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     HOVER EFFECTS
  ═══════════════════════════════════════════════════════════════════════════ */

  setHovered(mesh) {
    if (this._hoveredMesh && this._hoveredMesh !== mesh) {
      const base = this._hoveredMesh.userData.baseEmissiveIntensity || 0;
      this._hoveredMesh.material.emissiveIntensity = base;
    }
    this._hoveredMesh = mesh;
    if (mesh) {
      mesh.material.emissiveIntensity = 0.45;
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     ACCESSORS
  ═══════════════════════════════════════════════════════════════════════════ */

  getSunMesh()      { return this._sunMesh; }
  getPlanetMeshes() { return this._planetMeshes; }
  getMoonMeshes()   { return this._moonMeshes; }
  getMoonHitboxes() { return this._moonHitboxes; }

  getAllMoonObjects() {
    const result = [];
    this._planets.forEach(p => {
      p.moons.forEach(m => result.push({ moonObj: m, planetId: p.data.id }));
    });
    return result;
  }

  getPlanetWorldPosition(planetId, target) {
    const p = this._planets.find(p => p.data.id === planetId);
    if (!p) return target.set(0, 0, 0);
    return p.mesh.getWorldPosition(target);
  }

  getPlanetData(planetId) {
    return PORTFOLIO_DATA.planets.find(p => p.id === planetId) || null;
  }

  getMoonData(moonId, planetId) {
    const planet = this.getPlanetData(planetId);
    if (!planet) return null;
    return planet.moons.find(m => m.id === moonId) || null;
  }

  getFocusedPlanetData() {
    if (!this._focusedPlanetId) return null;
    return this.getPlanetData(this._focusedPlanetId);
  }
}
