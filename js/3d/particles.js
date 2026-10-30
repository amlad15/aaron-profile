/**
 * particles.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Cinematic space background:
 *   • Three star layers (5000 / 1500 / 300 stars)
 *   • 10 diffraction-spike stars
 *   • 4 nebula cloud clusters
 *   • Milky Way band (3500 particles)
 *   • Asteroid belt (350 rocks)
 *   • 3 animated comets
 *   • Sagittarius constellation (stars + connecting lines)
 *   • Distant spiral galaxy (clickable → GitHub)
 *   • 12 skill stars (hoverable)
 * ─────────────────────────────────────────────────────────────────────────────
 */

class ParticleSystem {

  constructor(scene) {
    this.scene  = scene;
    this.comets = [];

    this._time  = 0;
    this._frame = 0;

    // Sagittarius state
    this._sagStarSprites = [];
    this._sagStarBasePos = [];   // {x, y, z} world-space base per star
    this._sagLabelSprite = null;
    this._sagOrigin      = new THREE.Vector3(320, 140, -200);
    this.sagittarius     = null; // set to first sprite for backward-compat

    // Effect buckets
    this._spikeStars        = [];
    this._nebulaSprites     = [];
    this._milkyWayGroup     = null;
    this._asteroids         = [];
    this._foregroundStarMat = null;

    // Build everything
    this._createStarLayers();
    this._createSpikeStars();
    this._createNebulaClouds();
    this._createMilkyWayBand();
    this._createAsteroidBelt();
    this._createComets();
    this._createSagittarius();
    this._createGalaxy();
    this._createSkillStars();
  }

  /* ── Glow Sprite Helper ────────────────────────────────────────────────── */

  _makeGlowSprite(r, g, b, size) {
    const sz   = size || 64;
    const half = sz / 2;
    const c    = document.createElement('canvas');
    c.width    = sz;
    c.height   = sz;
    const ctx  = c.getContext('2d');
    const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
    grad.addColorStop(0,   `rgba(${r},${g},${b},1)`);
    grad.addColorStop(0.2, `rgba(${r},${g},${b},0.8)`);
    grad.addColorStop(0.5, `rgba(${r},${g},${b},0.3)`);
    grad.addColorStop(1,   `rgba(0,0,0,0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, sz, sz);
    return new THREE.CanvasTexture(c);
  }

  /* ── Star Layers ───────────────────────────────────────────────────────── */

  _createStarLayers() {
    const glowTex = this._makeGlowSprite(255, 255, 255, 64);

    const buildLayer = (count, radius, size, layer3) => {
      const positions = new Float32Array(count * 3);
      const colors    = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi   = Math.acos(2 * Math.random() - 1);
        positions[i * 3]     = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);

        const rnd = Math.random();
        let cr, cg, cb;
        if (layer3) {
          // bright layer: white or light blue only
          if (rnd < 0.6) { cr = 1; cg = 1; cb = 1; }
          else            { cr = 0.706; cg = 0.824; cb = 1; }
          colors[i * 3]     = cr;
          colors[i * 3 + 1] = cg;
          colors[i * 3 + 2] = cb;
        } else {
          if      (rnd < 0.70) { cr = 1;     cg = 1;     cb = 1;     } // white
          else if (rnd < 0.85) { cr = 0.706; cg = 0.824; cb = 1;     } // blue
          else if (rnd < 0.95) { cr = 1;     cg = 0.941; cb = 0.706; } // yellow
          else                 { cr = 1;     cg = 0.706; cb = 0.706; } // red
          const br = 0.4 + Math.random() * 0.6;
          colors[i * 3]     = cr * br;
          colors[i * 3 + 1] = cg * br;
          colors[i * 3 + 2] = cb * br;
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color',    new THREE.BufferAttribute(colors,    3));

      const mat = new THREE.PointsMaterial({
        size:            size,
        vertexColors:    true,
        map:             glowTex,
        transparent:     true,
        blending:        THREE.AdditiveBlending,
        depthWrite:      false,
        sizeAttenuation: true,
      });

      const pts = new THREE.Points(geo, mat);
      pts.userData = { type: 'ignore' };
      this.scene.add(pts);
      return mat;
    };

    buildLayer(5000, 3600, 0.7,  false);
    buildLayer(1500, 2000, 1.5,  false);
    this._foregroundStarMat = buildLayer(300, 1200, 3.5, true);
  }

  /* ── Diffraction Spike Stars ───────────────────────────────────────────── */

  _createSpikeStars() {
    for (let s = 0; s < 10; s++) {
      const group = new THREE.Group();
      group.userData = { type: 'ignore' };

      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 600 + Math.random() * 500;
      group.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );

      const core = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff, blending: THREE.AdditiveBlending })
      );
      core.userData = { type: 'ignore' };
      group.add(core);

      const hSpikeMat = new THREE.MeshBasicMaterial({
        color:      0xaaccff,
        transparent: true,
        opacity:    0.7,
        blending:   THREE.AdditiveBlending,
        depthWrite: false,
        side:       THREE.DoubleSide,
      });
      const hSpike = new THREE.Mesh(new THREE.PlaneGeometry(35, 0.6), hSpikeMat);
      hSpike.userData = { type: 'ignore' };
      group.add(hSpike);

      const vSpikeMat = hSpikeMat.clone();
      const vSpike = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 35), vSpikeMat);
      vSpike.userData = { type: 'ignore' };
      group.add(vSpike);

      const dMat1 = new THREE.MeshBasicMaterial({
        color:      0x8899ff,
        transparent: true,
        opacity:    0.4,
        blending:   THREE.AdditiveBlending,
        depthWrite: false,
        side:       THREE.DoubleSide,
      });
      const d1 = new THREE.Mesh(new THREE.PlaneGeometry(22, 0.4), dMat1);
      d1.rotation.z = Math.PI / 4;
      d1.userData   = { type: 'ignore' };
      group.add(d1);

      const dMat2 = dMat1.clone();
      const d2 = new THREE.Mesh(new THREE.PlaneGeometry(22, 0.4), dMat2);
      d2.rotation.z = -Math.PI / 4;
      d2.userData   = { type: 'ignore' };
      group.add(d2);

      const halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map:         this._makeGlowSprite(150, 200, 255, 128),
        transparent: true,
        blending:    THREE.AdditiveBlending,
        opacity:     0.5,
      }));
      halo.scale.set(12, 12, 1);
      halo.userData = { type: 'ignore' };
      group.add(halo);

      this.scene.add(group);

      this._spikeStars.push({
        group,
        mats:   [hSpikeMat, vSpikeMat, dMat1, dMat2],
        offset: Math.random() * Math.PI * 2,
      });
    }
  }

  /* ── Nebula Clouds ─────────────────────────────────────────────────────── */

  _makeNebulaSprite(r, g, b) {
    const c   = document.createElement('canvas');
    c.width   = 256;
    c.height  = 256;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 256, 256);
    for (let i = 0; i < 10; i++) {
      const x     = 30 + Math.random() * 196;
      const y     = 30 + Math.random() * 196;
      const rad   = 30 + Math.random() * 90;
      const alpha = 0.06 + Math.random() * 0.12;
      const grad  = ctx.createRadialGradient(x, y, 0, x, y, rad);
      grad.addColorStop(0,   `rgba(${r},${g},${b},${alpha})`);
      grad.addColorStop(0.4, `rgba(${r},${g},${b},${alpha * 0.5})`);
      grad.addColorStop(1,   `rgba(0,0,0,0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    }
    return new THREE.CanvasTexture(c);
  }

  _createNebulaClouds() {
    const DEFS = [
      { r: 30,  g: 80,  b: 255, count: 500, cx:  500, cy:  400, cz: -1200, scatter: 600, sMin: 150, sMax: 350, op: 0.40 },
      { r: 140, g: 50,  b: 230, count: 350, cx:  950, cy:  300, cz: -1000, scatter: 400, sMin: 120, sMax: 280, op: 0.35 },
      { r: 20,  g: 50,  b: 200, count: 400, cx: -800, cy:   50, cz: -1100, scatter: 500, sMin: 180, sMax: 380, op: 0.30 },
      { r: 80,  g: 30,  b: 180, count: 200, cx: -100, cy: -350, cz:  -900, scatter: 300, sMin: 100, sMax: 200, op: 0.25 },
    ];

    this._nebulaSprites = [];

    DEFS.forEach(def => {
      const tex = this._makeNebulaSprite(def.r, def.g, def.b);

      // One shared material per nebula colour
      const sharedMat = new THREE.SpriteMaterial({
        map:         tex,
        transparent: true,
        blending:    THREE.AdditiveBlending,
        depthWrite:  false,
        opacity:     def.op,
      });

      for (let i = 0; i < def.count; i++) {
        const sprite = new THREE.Sprite(sharedMat);
        const scale  = def.sMin + Math.random() * (def.sMax - def.sMin);
        sprite.scale.set(scale, scale, 1);
        sprite.position.set(
          def.cx + (Math.random() - 0.5) * def.scatter * 2,
          def.cy + (Math.random() - 0.5) * def.scatter * 2,
          def.cz + (Math.random() - 0.5) * def.scatter * 2
        );
        sprite.userData = { type: 'ignore' };
        this.scene.add(sprite);
        this._nebulaSprites.push({ sprite });
      }
    });
  }

  /* ── Milky Way Band ────────────────────────────────────────────────────── */

  _createMilkyWayBand() {
    const COUNT     = 3500;
    const positions = new Float32Array(COUNT * 3);
    const colors    = new Float32Array(COUNT * 3);

    const palette = [
      new THREE.Color(0x7788ff),
      new THREE.Color(0xaabbff),
      new THREE.Color(0xffffff),
      new THREE.Color(0xcc99ff),
    ];

    for (let i = 0; i < COUNT; i++) {
      const angle  = Math.random() * Math.PI * 2;
      const radius = 1000 + (Math.random() - 0.5) * 600;
      positions[i * 3]     = Math.cos(angle) * radius;
      positions[i * 3 + 2] = Math.sin(angle) * radius * 0.35;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40 + Math.sin(angle * 4) * 10;

      const c  = palette[Math.floor(Math.random() * palette.length)];
      const br = 0.3 + Math.random() * 0.7;
      colors[i * 3]     = c.r * br;
      colors[i * 3 + 1] = c.g * br;
      colors[i * 3 + 2] = c.b * br;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors,    3));

    const mat = new THREE.PointsMaterial({
      size:            1.0,
      vertexColors:    true,
      transparent:     true,
      blending:        THREE.AdditiveBlending,
      depthWrite:      false,
      sizeAttenuation: true,
    });

    const group = new THREE.Group();
    const pts   = new THREE.Points(geo, mat);
    pts.userData   = { type: 'ignore' };
    group.userData = { type: 'ignore' };
    group.add(pts);
    this.scene.add(group);
    this._milkyWayGroup = group;
  }

  /* ── Asteroid Belt ─────────────────────────────────────────────────────── */

  _createAsteroidBelt() {
    const COUNT = 350;
    const asteroidMesh = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(1, 0),
      new THREE.MeshStandardMaterial({ color: 0x554433, roughness: 0.95 }),
      COUNT
    );
    asteroidMesh.userData.type = 'ignore';

    const dummy = new THREE.Object3D();
    for (let i = 0; i < COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r     = 172 + (Math.random() - 0.5) * 28;
      dummy.position.set(
        Math.cos(angle) * r,
        (Math.random() - 0.5) * 14,
        Math.sin(angle) * r
      );
      dummy.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      dummy.scale.setScalar(0.3 + Math.random() * 1.5);
      dummy.updateMatrix();
      asteroidMesh.setMatrixAt(i, dummy.matrix);
    }
    asteroidMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(asteroidMesh);

    this._asteroids = []; // no per-frame rotation needed
  }

  /* ── Sagittarius Constellation ─────────────────────────────────────────── */

  _createSagittarius() {
    const origin = this._sagOrigin;
    const SCALE  = 18;

    const STARS = [
      { x: -2.0, y: -2.5 },  // 0 Kaus Australis
      { x: -1.0, y: -1.8 },  // 1 Kaus Media
      { x:  0.0, y: -1.0 },  // 2 Kaus Borealis
      { x:  1.2, y: -0.5 },  // 3 Nunki
      { x:  2.0, y:  0.5 },  // 4 Tau Sgr
      { x:  1.0, y:  1.5 },  // 5 Phi Sgr
      { x: -0.5, y:  2.0 },  // 6 Sigma Sgr
      { x: -1.8, y:  1.2 },  // 7 Zeta Sgr
      { x: -2.5, y:  0.2 },  // 8 Epsilon Sgr
      { x: -1.2, y: -0.8 },  // 9 Delta Sgr
      { x:  0.5, y:  0.5 },  // 10 Lambda Sgr
      { x:  1.8, y: -1.5 },  // 11 Eta Sgr
    ];

    const LINES = [
      [0, 1], [1, 2], [2, 3],  [3, 4],  [4, 5], [5, 6],
      [6, 7], [7, 8], [8, 9],  [9, 1],  [2,10], [10,5],
      [3,11], [9, 0],
    ];

    const glowTex = this._makeGlowSprite(200, 220, 255, 64);

    this._sagStarSprites = [];
    this._sagStarBasePos = [];

    STARS.forEach((star, i) => {
      const wx = origin.x + star.x * SCALE;
      const wy = origin.y + star.y * SCALE;
      const wz = origin.z;

      // Glow sprite (raycaster target)
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map:         glowTex,
        transparent: true,
        blending:    THREE.AdditiveBlending,
        depthWrite:  false,
        opacity:     0.9,
      }));
      sprite.scale.set(6, 6, 1);
      sprite.position.set(wx, wy, wz);
      sprite.userData = { type: 'sagittarius' };
      this.scene.add(sprite);
      this._sagStarSprites.push(sprite);
      this._sagStarBasePos.push({ x: wx, y: wy, z: wz });

      // Solid core dot
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.8, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xffffff, blending: THREE.AdditiveBlending })
      );
      dot.position.set(wx, wy, wz);
      dot.userData = { type: 'ignore' };
      this.scene.add(dot);
    });

    // Connecting lines
    LINES.forEach(pair => {
      const s0 = STARS[pair[0]];
      const s1 = STARS[pair[1]];
      const p1 = new THREE.Vector3(origin.x + s0.x * SCALE, origin.y + s0.y * SCALE, origin.z);
      const p2 = new THREE.Vector3(origin.x + s1.x * SCALE, origin.y + s1.y * SCALE, origin.z);
      const geo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      const mat = new THREE.LineBasicMaterial({
        color:       0x8899cc,
        transparent: true,
        opacity:     0.5,
        blending:    THREE.AdditiveBlending,
        depthWrite:  false,
      });
      const line3d    = new THREE.Line(geo, mat);
      line3d.userData = { type: 'ignore' };
      this.scene.add(line3d);
    });

    // "SAGITTARIUS" label
    const lc  = document.createElement('canvas');
    lc.width  = 320;
    lc.height = 64;
    const lx  = lc.getContext('2d');
    lx.clearRect(0, 0, 320, 64);
    lx.fillStyle    = 'rgba(255,255,255,0.6)';
    lx.font         = '20px monospace';
    lx.textAlign    = 'center';
    lx.textBaseline = 'middle';
    lx.fillText('SAGITTARIUS', 160, 32);

    const labelSprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map:         new THREE.CanvasTexture(lc),
      transparent: true,
      depthWrite:  false,
      opacity:     0.6,
    }));
    labelSprite.scale.set(36, 9, 1);
    labelSprite.position.set(origin.x - 20, origin.y - 62, origin.z);
    labelSprite.userData  = { type: 'ignore' };
    this._sagLabelSprite  = labelSprite;
    this.scene.add(labelSprite);

    // Backward compatibility
    this.sagittarius         = this._sagStarSprites[0];
    window.sagittariusSprite = this.sagittarius;
  }

  /* ── Galaxy ─────────────────────────────────────────────────────────────── */

  _createGalaxy() {
    const COUNT     = 3000;
    const positions = new Float32Array(COUNT * 3);
    const colors    = new Float32Array(COUNT * 3);

    const palette = [
      new THREE.Color(0x8899ff),
      new THREE.Color(0xaa66ff),
      new THREE.Color(0xffffff),
      new THREE.Color(0xccaaff),
      new THREE.Color(0xaabbff),
    ];

    for (let i = 0; i < COUNT; i++) {
      const arm    = i % 2;
      const t      = (i / COUNT) * Math.PI * 6 + arm * Math.PI;
      const r      = t * 30 + Math.random() * 25;
      const spread = 18;

      positions[i * 3]     = r * Math.cos(t) + (Math.random() - 0.5) * spread;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20 * Math.exp(-r / 350);
      positions[i * 3 + 2] = r * Math.sin(t) + (Math.random() - 0.5) * spread;

      const c          = palette[Math.floor(Math.random() * palette.length)];
      const brightness = 0.3 + Math.random() * 0.7;
      colors[i * 3]     = c.r * brightness;
      colors[i * 3 + 1] = c.g * brightness;
      colors[i * 3 + 2] = c.b * brightness;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors,    3));

    const mat = new THREE.PointsMaterial({
      size:            1.6,
      vertexColors:    true,
      transparent:     true,
      opacity:         0.78,
      sizeAttenuation: true,
      depthWrite:      false,
      blending:        THREE.AdditiveBlending,
    });

    const galaxy = new THREE.Points(geo, mat);
    galaxy.position.set(250, -80, -1500);
    galaxy.rotation.x    = 0.28;
    galaxy.userData.type = 'galaxy';

    this.galaxy         = galaxy;
    window.galaxyPoints = galaxy;
    this.scene.add(galaxy);
  }

  /* ── Skill Stars ────────────────────────────────────────────────────────── */

  _createSkillStars() {
    const SKILL_DEFS = [
      { label: 'Python',       x: -540, y:  210, z: -320 },
      { label: 'TypeScript',   x:  470, y:  270, z: -190 },
      { label: 'JavaScript',   x: -380, y: -160, z: -360 },
      { label: 'React',        x:  360, y:  160, z: -410 },
      { label: 'Next.js',      x: -290, y:  260, z: -140 },
      { label: 'Node.js',      x:  510, y: -110, z: -290 },
      { label: 'Docker',       x: -490, y:   90, z: -210 },
      { label: 'PostgreSQL',   x:  410, y: -210, z: -160 },
      { label: 'AWS',          x: -190, y:  290, z: -390 },
      { label: 'Ollama / LLM', x:  580, y:  190, z: -340 },
      { label: 'Git',          x: -440, y: -190, z: -110 },
      { label: 'Linux',        x:  310, y: -270, z: -240 },
    ];

    window.skillStars = [];

    SKILL_DEFS.forEach(def => {
      const skillLabel        = def.label;
      const skillStarPosition = new THREE.Vector3(def.x, def.y, def.z);
      const offset            = Math.random() * Math.PI * 2;

      // Large outer glow
      const outerSprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map:         this._makeGlowSprite(100, 160, 255, 256),
        transparent: true,
        blending:    THREE.AdditiveBlending,
        depthWrite:  false,
        opacity:     0.6,
      }));
      outerSprite.scale.set(30, 30, 1);
      outerSprite.userData.type = 'ignore';

      // Mid glow
      const midSprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map:         this._makeGlowSprite(180, 220, 255, 128),
        transparent: true,
        blending:    THREE.AdditiveBlending,
        depthWrite:  false,
        opacity:     0.9,
      }));
      midSprite.scale.set(14, 14, 1);
      midSprite.userData.type = 'ignore';

      // Bright core — this is the raycaster target
      const coreSprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map:         this._makeGlowSprite(255, 255, 255, 64),
        transparent: true,
        blending:    THREE.AdditiveBlending,
        depthWrite:  false,
        opacity:     1.0,
      }));
      coreSprite.scale.set(6, 6, 1);
      coreSprite.userData.type  = 'skillstar';
      coreSprite.userData.label = skillLabel;

      // 4 diffraction spikes
      const spikeH = new THREE.Mesh(
        new THREE.PlaneGeometry(28, 0.5),
        new THREE.MeshBasicMaterial({
          color:       0xaaccff,
          transparent: true,
          opacity:     0.8,
          blending:    THREE.AdditiveBlending,
          depthWrite:  false,
          side:        THREE.DoubleSide,
        })
      );
      spikeH.userData.type = 'ignore';

      const spikeV = new THREE.Mesh(
        new THREE.PlaneGeometry(0.5, 28),
        spikeH.material.clone()
      );
      spikeV.userData.type = 'ignore';

      // Group all at same position
      const starGroup = new THREE.Group();
      starGroup.add(outerSprite);
      starGroup.add(midSprite);
      starGroup.add(coreSprite);
      starGroup.add(spikeH);
      starGroup.add(spikeV);
      starGroup.position.copy(skillStarPosition);
      starGroup.userData.type = 'ignore';
      this.scene.add(starGroup);

      console.log(
        `[SkillStar] "${skillLabel}" added to scene at`, skillStarPosition.toArray(),
        '— children:', starGroup.children.map(c => c.constructor.name + (c.userData.type ? `[${c.userData.type}]` : ''))
      );

      window.skillStars.push({
        mesh:        coreSprite,
        outerSprite,
        midSprite,
        spikeH,
        spikeV,
        label:       skillLabel,
        position:    skillStarPosition,
        _phase:      offset,
        _speed:      1.4 + Math.random() * 2.2,
      });
    });
  }

  /* ── Comets ────────────────────────────────────────────────────────────── */

  _createComets() {
    const COMET_CONFIGS = [
      { speed: 28, size: 1.8, tailLen: 24, color: 0x88eeff },
      { speed: 18, size: 1.4, tailLen: 18, color: 0xffeebb },
      { speed: 22, size: 1.6, tailLen: 20, color: 0xaaffcc },
    ];

    COMET_CONFIGS.forEach((cfg, idx) => {
      const comet = this._buildComet(cfg, idx);
      this.comets.push(comet);
      this.scene.add(comet.group);
    });
  }

  _buildComet(cfg, index) {
    const group = new THREE.Group();

    const tailPositions = new Float32Array(cfg.tailLen * 3);
    const tailColors    = new Float32Array(cfg.tailLen * 3);
    const baseColor     = new THREE.Color(cfg.color);

    for (let i = 0; i < cfg.tailLen; i++) {
      tailPositions[i * 3]     = -i * 4;
      tailPositions[i * 3 + 1] = 0;
      tailPositions[i * 3 + 2] = 0;
      const fade = 1 - (i / cfg.tailLen);
      tailColors[i * 3]     = baseColor.r * fade;
      tailColors[i * 3 + 1] = baseColor.g * fade;
      tailColors[i * 3 + 2] = baseColor.b * fade;
    }

    const tailGeo = new THREE.BufferGeometry();
    tailGeo.setAttribute('position', new THREE.BufferAttribute(tailPositions, 3));
    tailGeo.setAttribute('color',    new THREE.BufferAttribute(tailColors,    3));

    const tailMat = new THREE.PointsMaterial({
      size:            cfg.size,
      vertexColors:    true,
      transparent:     true,
      opacity:         0.8,
      sizeAttenuation: true,
      depthWrite:      false,
      blending:        THREE.AdditiveBlending,
    });

    const tail = new THREE.Points(tailGeo, tailMat);
    group.add(tail);

    const headGeo = new THREE.BufferGeometry();
    headGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3));
    const headMat = new THREE.PointsMaterial({
      size:        cfg.size * 2.5,
      color:       cfg.color,
      transparent: true,
      opacity:     1.0,
      blending:    THREE.AdditiveBlending,
      depthWrite:  false,
    });
    const head = new THREE.Points(headGeo, headMat);
    group.add(head);

    const cometObj = {
      group,
      tail,
      tailGeo,
      speed:       cfg.speed,
      tailLen:     cfg.tailLen,
      dir:         new THREE.Vector3(),
      headHistory: [],
    };

    this._resetComet(cometObj, true, index);
    return cometObj;
  }

  _resetComet(comet, firstTime = false, index = 0) {
    const SPAWN_RADIUS = 1600;
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const spawn = new THREE.Vector3(
      SPAWN_RADIUS * Math.sin(phi) * Math.cos(theta),
      (Math.random() - 0.5) * 600,
      SPAWN_RADIUS * Math.sin(phi) * Math.sin(theta)
    );
    if (firstTime) spawn.multiplyScalar(0.2 + index * 0.3);

    comet.group.position.copy(spawn);
    comet.dir.copy(spawn).negate().normalize();
    comet.dir.x += (Math.random() - 0.5) * 0.4;
    comet.dir.y += (Math.random() - 0.5) * 0.4;
    comet.dir.z += (Math.random() - 0.5) * 0.4;
    comet.dir.normalize();

    comet.headHistory = [];
    for (let i = 0; i < comet.tailLen; i++) comet.headHistory.push(spawn.clone());
  }

  /* ── Per-Frame Update ──────────────────────────────────────────────────── */

  update(delta) {
    this._time  += delta;
    this._frame += 1;
    const t = this._time;

    // ── Foreground star twinkle every 60 frames
    if (this._frame % 60 === 0 && this._foregroundStarMat) {
      this._foregroundStarMat.size = 2.5 + Math.random() * 2.5;
    }

    // ── Spike stars: slow Z rotation + opacity pulse
    this._spikeStars.forEach(ss => {
      ss.group.rotation.z += 0.001;
      const op = Math.max(0, Math.min(1, 0.5 + Math.sin(t * 2 + ss.offset) * 0.35));
      ss.mats.forEach(m => { m.opacity = op; });
    });

    // ── Nebula very slow drift
    this._nebulaSprites.forEach(ns => {
      ns.sprite.position.y += Math.sin(t * 0.00005) * 0.01;
    });

    // ── Milky Way band rotation
    if (this._milkyWayGroup) this._milkyWayGroup.rotation.y += 0.00002;

    // ── Asteroid belt rotation
    this._asteroids.forEach(ast => {
      ast.mesh.rotateOnAxis(ast.rotAxis, ast.rotSpeed * delta);
    });

    // ── Sagittarius: bob + pulse opacity
    if (this._sagStarSprites.length > 0) {
      const bob = Math.sin(t * 0.4) * 5;

      this._sagStarSprites.forEach((sprite, i) => {
        const base = this._sagStarBasePos[i];
        sprite.position.y          = base.y + bob;
        sprite.material.opacity    = 0.7 + Math.sin(t * 1.5 + i * 0.3) * 0.3;
      });

      if (this._sagLabelSprite) {
        this._sagLabelSprite.position.y = this._sagOrigin.y - 62 + bob;
      }
    }

    // ── Galaxy slow rotation
    if (this.galaxy) this.galaxy.rotation.y += 0.0003 * delta * 60;

    // ── Skill star pulse
    if (window.skillStars) {
      const t2 = Date.now() * 0.001;
      window.skillStars.forEach(ss => {
        const offset = ss._phase;
        ss.spikeH.material.opacity       = 0.6 + Math.sin(t2 * 2 + offset) * 0.3;
        ss.spikeV.material.opacity        = 0.6 + Math.sin(t2 * 2 + offset) * 0.3;
        ss.outerSprite.material.opacity   = 0.4 + Math.sin(t2 * 1.5 + offset) * 0.2;
      });
    }

    // ── Comets
    const RESET_DIST = 2200;
    this.comets.forEach(comet => {
      comet.group.position.addScaledVector(comet.dir, comet.speed * delta);
      comet.headHistory.unshift(comet.group.position.clone());
      if (comet.headHistory.length > comet.tailLen) comet.headHistory.pop();

      const posAttr = comet.tailGeo.getAttribute('position');
      for (let i = 0; i < comet.tailLen && i < comet.headHistory.length; i++) {
        const wp = comet.headHistory[i];
        posAttr.setXYZ(
          i,
          wp.x - comet.group.position.x,
          wp.y - comet.group.position.y,
          wp.z - comet.group.position.z
        );
      }
      posAttr.needsUpdate = true;

      if (comet.group.position.length() > RESET_DIST) this._resetComet(comet);
    });
  }
}
