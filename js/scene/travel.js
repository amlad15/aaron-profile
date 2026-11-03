/**
 * travel.js: effects that only exist while the camera is moving between planets:
 * warp streaks, near-camera dust, the occasional comet or asteroid cluster, and a lens flare near the sun.
 * Strengths come from FX in scene.js.
 */
import * as THREE from 'three';
import { STREAK_VS, STREAK_FS } from './shaders.js';

// Two vertices per point (head, tail); the shader stretches the tail toward the vanishing point
function streakGeometry(positions) {
  const n = positions.length / 3;
  const pos = new Float32Array(n * 6), tail = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    pos.set(positions.subarray(i * 3, i * 3 + 3), i * 6);
    pos.set(positions.subarray(i * 3, i * 3 + 3), i * 6 + 3);
    tail[i * 2 + 1] = 1;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aTail', new THREE.BufferAttribute(tail, 1));
  return g;
}

export function createStreaks(positions, shared) {
  const mat = new THREE.ShaderMaterial({
    vertexShader: STREAK_VS, fragmentShader: STREAK_FS, transparent: true, depthWrite: false,
    uniforms: { ...shared, uMinLen: { value: 0 }, uBox: { value: 1 }, uAlpha: { value: 0 }, uColor: { value: new THREE.Color('#ECE8DF') } }
  });
  const lines = new THREE.LineSegments(streakGeometry(positions), mat);
  lines.frustumCulled = false;
  return lines;
}

export function createDust(count, box, shared, rand) {
  const p = new Float32Array(count * 3);
  for (let i = 0; i < p.length; i++) p[i] = (rand() - 0.5) * box;
  const mat = new THREE.ShaderMaterial({
    vertexShader: STREAK_VS, fragmentShader: STREAK_FS, transparent: true, depthWrite: false, defines: { DUST: 1 },
    uniforms: { ...shared, uMinLen: { value: 0.0025 }, uBox: { value: box }, uAlpha: { value: 0 }, uColor: { value: new THREE.Color('#D9D2C3') } }
  });
  const lines = new THREE.LineSegments(streakGeometry(p), mat);
  lines.frustumCulled = false;                              // positions wrap around the camera in the shader
  return lines;
}

// A small pool: one comet and one asteroid cluster, reused
export function createExtras(scene, rand) {
  const comet = new THREE.Group();
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), new THREE.MeshBasicMaterial({ color: 0xF4EEE2, transparent: true }));
  const tailGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, 1)]);
  tailGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array([0.95, 0.92, 0.86, 0.05, 0.05, 0.06]), 3));
  const tail = new THREE.Line(tailGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  comet.add(head, tail);
  const rocks = new THREE.Group();
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x7D776D, roughness: 0.95, flatShading: true, transparent: true });
  for (let i = 0; i < 5; i++) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.25 + rand() * 0.45, 0), rockMat);
    m.position.set((rand() - 0.5) * 6, (rand() - 0.5) * 3, (rand() - 0.5) * 4);
    m.userData.spin = new THREE.Vector3(rand(), rand(), rand()).multiplyScalar(0.8);
    rocks.add(m);
  }
  comet.visible = rocks.visible = false;
  scene.add(comet, rocks);
  const live = [];                                          // { obj, vel, t, life, mats }
  const toSun = new THREE.Vector3();

  return {
    // Launch on the planet side of the frame, ahead of the camera, drifting across and down
    spawn(kind, camera, side) {
      const obj = kind === 'comet' ? comet : rocks;
      if (live.some(l => l.obj === obj)) return;
      const fwd = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3();
      camera.matrixWorld.extractBasis(right, up, fwd); fwd.negate();
      const D = 40 + rand() * 30;
      obj.position.copy(camera.position).addScaledVector(fwd, D).addScaledVector(right, D * side).addScaledVector(up, D * 0.22);
      const vel = new THREE.Vector3().addScaledVector(up, -0.55).addScaledVector(right, -0.25 * Math.sign(side)).addScaledVector(fwd, 0.15).normalize().multiplyScalar(kind === 'comet' ? 16 : 7);
      obj.visible = true;
      const mats = kind === 'comet' ? [head.material, tail.material] : [rockMat];
      live.push({ obj, vel, t: 0, life: kind === 'comet' ? 3.2 : 3.8, mats, kind });
    },
    update(dt, intensity) {
      for (let i = live.length - 1; i >= 0; i--) {
        const l = live[i];
        l.t += dt;
        l.obj.position.addScaledVector(l.vel, dt);
        const k = l.t / l.life;
        const a = Math.min(1, k * 4, (1 - k) * 4) * intensity;   // fade in and out so nothing pops
        l.mats.forEach(m => { m.opacity = Math.max(0, a); });
        if (l.kind === 'comet') {
          toSun.copy(l.obj.position).normalize().multiplyScalar(7);   // tails point away from the sun
          tail.geometry.attributes.position.setXYZ(1, toSun.x, toSun.y, toSun.z);
          tail.geometry.attributes.position.needsUpdate = true;
        } else {
          l.obj.children.forEach(r => { r.rotation.x += r.userData.spin.x * dt; r.rotation.y += r.userData.spin.y * dt; });
        }
        if (k >= 1) { l.obj.visible = false; live.splice(i, 1); }
      }
    },
    clear() { live.length = 0; comet.visible = rocks.visible = false; }
  };
}

// Lens flare: a few additive sprites along the line from the sun through the centre of the frame
export function createFlare() {
  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const tex = (fn) => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d'); fn(x);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return t;
  };
  const glow = tex(x => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,236,210,0.9)'); g.addColorStop(0.25, 'rgba(255,190,130,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); });
  const ring = tex(x => { x.strokeStyle = 'rgba(255,200,150,0.55)'; x.lineWidth = 3; x.beginPath(); x.arc(64, 64, 52, 0, 6.283); x.stroke(); });
  const disc = tex(x => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(170,200,255,0.35)'); g.addColorStop(0.7, 'rgba(170,200,255,0.12)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); });
  const parts = [[glow, 1.0, 0.55], [disc, 0.45, 0.12], [ring, 0.1, 0.22], [disc, -0.35, 0.08], [ring, -0.7, 0.3]].map(([map, t, s]) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false }));
    sp.userData = { t, s };
    scene.add(sp);
    return sp;
  });
  return {
    // sun: NDC of the sun; strength 0..1 already includes proximity and readability fades
    update(sun, strength, aspect, fadeAt) {
      parts.forEach(sp => {
        const { t, s } = sp.userData;
        sp.position.set(sun.x * t, sun.y * t, 0);
        sp.scale.set(s / aspect, s, 1);
        const sx = sp.position.x * 0.5 + 0.5;
        sp.material.opacity = strength * fadeAt(sx);
      });
      scene.visible = strength > 0.002;
    },
    render(renderer) {
      if (!scene.visible) return;
      const ac = renderer.autoClear;
      renderer.autoClear = false;
      renderer.render(scene, cam);
      renderer.autoClear = ac;
    }
  };
}
