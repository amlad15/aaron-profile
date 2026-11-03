/**
 * flight.js: the camera's route through the system and the scroll → distance mapping.
 * The route is one arc-length-parameterised spline. Scroll maps to a distance along it through a
 * monotone cubic, so every pixel of scroll moves the camera forward and speed never jumps.
 */
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);
const DIV = 6000;

// Fritsch–Carlson monotone cubic through (x, y) knots: no overshoot, continuous slope
function monotone(xs, ys) {
  const n = xs.length, d = [], m = new Array(n).fill(0);
  if (n < 2) return () => ys[0] || 0;
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return x => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (xs[mid] <= x) lo = mid; else hi = mid; }
    const h = xs[hi] - xs[lo], t = (x - xs[lo]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[lo] + (t3 - 2 * t2 + t) * h * m[lo] + (-2 * t3 + 3 * t2) * ys[hi] + (t3 - t2) * h * m[hi];
  };
}

export function createFlight(cfg) {
  let curve = null, total = 1, map = () => 0, knots = [];
  let stops = [];                                            // { kind, body, focus, xNdc, LA, LC, LD }
  const flybys = [];                                         // positions of the moonlets the route skims

  // hero → for each planet: transit (bowed outward, past a moonlet, or along a ring plane) → a short held arc around it
  function build(bodies, wide, cfgOverride) {
    const c = { ...cfg, ...cfgOverride };
    const pts = [], hold = [];
    stops = []; flybys.length = 0;
    const th = THREE.MathUtils.degToRad(c.holdArc);
    const v = new THREE.Vector3(), w = new THREE.Vector3();

    // Hero: above and behind the first planet along the route, looking at the sun
    const p0 = bodies[0].group.position;
    const a0 = Math.atan2(p0.z, p0.x) + c.heroAngle;          // the route runs toward smaller angles, so the hero sits at a larger one
    const H0 = new THREE.Vector3(Math.cos(a0) * c.heroDistance, c.heroHeight, Math.sin(a0) * c.heroDistance);
    const H1 = H0.clone().multiplyScalar(0.94);
    pts.push(H0, H1);
    hold.push([0, 0, 1]);
    stops.push({ kind: 'hero', focus: new THREE.Vector3(), xNdc: wide ? 0.32 : 0 });

    let prev = H1;
    bodies.forEach((b, j) => {
      const P = b.group.position, R = b.radius;
      const d = R * (b.dist || c.holdDistance) * (wide ? 1 : 1.5);
      const o = v.copy(P).setY(0).normalize();
      const next = bodies[j + 1] ? bodies[j + 1].group.position : P.clone().addScaledVector(o, 200);
      const want = w.subVectors(next, prev).setY(0).normalize();
      // Sun-side three-quarter view. The camera circles each planet with the planet on its right, so a departing
      // planet slides off the right edge and an approaching one comes in from the right: never across the text.
      let base = null, best = -2;
      for (const s of [-1, 1]) {
        const b0 = o.clone().negate().applyAxisAngle(UP, s * THREE.MathUtils.degToRad(c.viewAngle)).addScaledVector(UP, 0.26).normalize();
        const t = new THREE.Vector3().crossVectors(b0, UP).normalize();
        if (t.dot(want) > best) { best = t.dot(want); base = b0; }
      }
      const A = P.clone().addScaledVector(base.clone().applyAxisAngle(UP, th), d * 1.08);
      const C = P.clone().addScaledVector(base, d);
      const D = P.clone().addScaledVector(base.clone().applyAxisAngle(UP, -th), d * 0.94);

      const seg = new THREE.Vector3().subVectors(A, prev), len = seg.length();
      const side = new THREE.Vector3().crossVectors(seg, UP).normalize();   // right of travel
      const mid = new THREE.Vector3().addVectors(prev, A).multiplyScalar(0.5);
      const out = Math.sign(side.dot(mid)) || 1;              // away from the sun
      const bow = mid.clone().addScaledVector(side, out * len * c.arc * 0.5).addScaledVector(UP, len * c.arc * 0.08);
      if (c.flybys && j % 2 === 1 && len > 60) {
        pts.push(bow);
        flybys.push(bow.clone().addScaledVector(side, out * c.flybyGap).addScaledVector(UP, c.flybyGap * 0.3));
      } else if (b.ringNormal) {
        // Run in alongside the ring plane, just above it, then rise to the viewpoint
        const n = b.ringNormal, inPlane = A.clone().sub(P);
        inPlane.addScaledVector(n, -inPlane.dot(n)).normalize();
        pts.push(bow, P.clone().addScaledVector(inPlane, d * 1.7).addScaledVector(n, R * 0.35));
      } else {
        pts.push(bow);
      }
      const i = pts.length;
      pts.push(A, C, D);
      hold.push([i, i + 1, i + 2]);
      stops.push({ kind: 'planet', body: b, focus: P, xNdc: wide ? 0.66 : 0 });
      prev = D;
    });

    curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    curve.arcLengthDivisions = DIV;
    curve.updateArcLengths();
    const lengths = curve.getLengths(DIV);
    total = lengths[DIV];
    const at = i => lengths[Math.round((i / (pts.length - 1)) * DIV)];
    stops.forEach((s, k) => { [s.LA, s.LC, s.LD] = hold[k].map(at); });
    return flybys;
  }

  // spans[k] = [scrollStart, scrollEnd] of the section for planet stop k+1 (top and bottom crossing mid-screen)
  function setScroll(spans, heroEnd, max, travel) {
    const xs = [], ys = [];
    const push = (x, y) => {
      const px = xs.length ? xs[xs.length - 1] : -Infinity, py = ys.length ? ys[ys.length - 1] : -Infinity;
      xs.push(Math.max(x, px + 1)); ys.push(Math.max(y, py + 0.01));   // strictly increasing, or the cubic can't be built
    };
    push(0, stops[0].LA);
    push(heroEnd, stops[0].LD);
    spans.forEach(([s, e], k) => {
      const st = stops[k + 1], span = Math.max(1, e - s);
      push(s + span * travel, st.LA);
      push(s + span * 0.5, st.LC);
      push(Math.min(max, e - span * travel), st.LD);
    });
    knots = xs.map((x, i) => [x, ys[i]]);
    map = monotone(xs, ys);
  }

  // Focus weight per stop: 1 through the hold, easing to 0 over part of each neighbouring transit
  function weights(L, falloff, out = []) {
    out.length = stops.length;
    for (let k = 0; k < stops.length; k++) {
      const s = stops[k];
      if (L >= s.LA && L <= s.LD) { out[k] = 1; continue; }
      const before = L < s.LA, nb = stops[before ? k - 1 : k + 1];
      if (!nb) { out[k] = 1; continue; }                     // past the last stop: keep it framed
      const gap = before ? s.LA - nb.LD : nb.LA - s.LD;
      const x = (before ? s.LA - L : L - s.LD) / Math.max(1, gap * falloff);
      out[k] = x >= 1 ? 0 : 1 - x * x * (3 - 2 * x);
    }
    return out;
  }

  return {
    build, setScroll, weights,
    get stops() { return stops; },
    get total() { return total; },
    get knots() { return knots; },
    get curve() { return curve; },
    toL: y => map(y),
    point(L, out) {
      if (L <= total) return curve.getPointAt(THREE.MathUtils.clamp(L / total, 0, 1), out);
      curve.getPointAt(1, out);                               // past the end: keep going along the last tangent
      return out.addScaledVector(curve.getTangentAt(1, new THREE.Vector3()), L - total);
    },
    tangent: (L, out) => curve.getTangentAt(THREE.MathUtils.clamp(L / total, 0, 1), out)
  };
}
