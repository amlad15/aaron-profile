/**
 * shaders.js: GLSL for the background solar system. Every surface is procedural (3D noise),
 * so the scene ships no textures. Colours arrive as uniforms from scene.js (site palette).
 */

// 3D simplex noise: Ashima Arts / Stefan Gustavson, MIT licence (github.com/ashima/webgl-noise)
export const NOISE = /* glsl */`
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
float fbm(vec3 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < OCTAVES; i++) { s += a * snoise(p); p = p * 2.03 + vec3(17.3, 9.1, 4.7); a *= 0.5; }   // offset per octave hides lattice repeats
  return s;
}
`;

// Shared vertex shader: world-space normal/position for lighting, object-space point for noise (rotates with the planet)
export const BODY_VS = /* glsl */`
varying vec3 vObj;
varying vec3 vNormalW;
varying vec3 vPosW;
void main() {
  vObj = normalize(position);
  vec4 w = modelMatrix * vec4(position, 1.0);
  vPosW = w.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);   // uniform scale only, so no normal matrix needed
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

const CHART = /* glsl */`
// Light theme: ink-on-paper star chart instead of an inverted dark render
float gridLine(float x) { float w = fwidth(x); return 1.0 - smoothstep(0.0, 1.5 * w, abs(fract(x - 0.5) - 0.5)); }
vec3 chartShade(vec3 col, vec3 N0, vec3 V, float ndl) {
  float lum = dot(col, vec3(0.3, 0.59, 0.11));
  vec3 c = uPaper * (1.0 - (1.0 - smoothstep(-0.1, 0.5, ndl)) * 0.16);    // paper greys a little away from the sun
  c = mix(c, uInk, (1.0 - lum) * 0.10);                                    // surface pattern survives as faint ink wash
  float hatch = step(0.72, fract((gl_FragCoord.x - gl_FragCoord.y) / 4.5)) * smoothstep(0.25, -0.35, ndl);
  c = mix(c, uInk, hatch * 0.32);                                          // night side drawn with diagonal hatching
  float lat = asin(clamp(vObj.y, -1.0, 1.0)) * 3.8197;                     // 6 bands per hemisphere
  float lon = atan(vObj.z, vObj.x) * 1.9099;                               // 12 meridians
  c = mix(c, uInk, max(gridLine(lat), gridLine(lon)) * 0.14);
  float edge = smoothstep(0.78, 0.94, 1.0 - max(dot(N0, V), 0.0));
  c = mix(c, mix(uInk, uAccentCol, uAccent), edge * 0.92);                 // ink outline, orange only for the active section
  return c;
}
`;

// One planet shader; STYLE picks the surface. Bump comes from screen-space derivatives of the height (cheap, no extra noise taps).
export const PLANET_FS = /* glsl */`
uniform vec3 uSun;
uniform float uTime, uSeed, uBump, uChart, uAccent, uGlow, uPulse;
uniform vec3 uC0, uC1, uC2, uC3, uPaper, uInk, uAccentCol;
varying vec3 vObj;
varying vec3 vNormalW;
varying vec3 vPosW;
${NOISE}
${CHART}
vec3 bumpNormal(vec3 n, vec3 pos, float h, float k) {
  vec3 dpx = dFdx(pos), dpy = dFdy(pos);
  float dhx = dFdx(h), dhy = dFdy(h);
  vec3 r1 = cross(dpy, n), r2 = cross(n, dpx);
  float det = dot(dpx, r1);
  vec3 grad = sign(det) * (dhx * r1 + dhy * r2);
  return normalize(abs(det) * n - k * grad);
}
void main() {
  vec3 p = vObj;
  vec3 col; float h = 0.0; float spec = 0.0;
#if STYLE == 0
  // Rocky, cratered (Experience): basalt plains, bright crater rims
  float n = fbm(p * 2.2 + uSeed);
  float cr = snoise(p * 5.5 + uSeed * 1.7);
  float rim = smoothstep(0.45, 0.62, cr) - smoothstep(0.62, 0.9, cr);
  float bowl = smoothstep(0.62, 0.9, cr);
  col = mix(uC0, uC1, smoothstep(-0.55, 0.55, n));
  col = mix(col, uC2, rim * 0.55);
  col *= 1.0 - bowl * 0.25;
  h = n * 0.6 + rim * 0.5 - bowl * 0.4;
#elif STYLE == 1
  // Banded gas giant (Projects): bands warped by slow-drifting noise, one long-lived storm
  float warp = fbm(vec3(p.x * 1.3, p.y * 5.0, p.z * 1.3) + vec3(uTime * 0.006, 0.0, 0.0) + uSeed);
  float b = p.y * 5.5 + warp * 1.4;
  col = mix(uC0, uC1, 0.5 + 0.5 * sin(b * 3.1416));
  col = mix(col, uC2, (0.5 + 0.5 * sin(b * 1.7 + 1.3)) * 0.55);
  col = mix(col, uC3, smoothstep(0.35, 0.9, fbm(p * vec3(3.0, 14.0, 3.0) + uSeed)) * 0.35);
  float storm = distance(p, normalize(vec3(0.62, -0.32, 0.71)));
  col = mix(col, uC3, smoothstep(0.2, 0.08, storm) * 0.7);
  h = warp * 0.12;
#elif STYLE == 2
  // Icy world with soft cracks (Skills)
  float n = fbm(p * 1.8 + uSeed);
  float c1 = 1.0 - smoothstep(0.0, 0.05, abs(snoise(p * 3.2 + uSeed * 2.0)));
  float c2 = 1.0 - smoothstep(0.0, 0.035, abs(snoise(p * 7.5 - uSeed)));
  col = mix(uC0, uC1, smoothstep(-0.45, 0.5, n));
  col = mix(col, uC2, c1 * 0.6 + c2 * 0.3);
  h = n * 0.3 - c1 * 0.3 - c2 * 0.12;
  spec = 0.35;
#elif STYLE == 3
  // Ocean world (Services): open water, slow swirls; clouds live in their own shell
  float n = fbm(p * 1.5 + uSeed);
  col = mix(uC0, uC1, smoothstep(-0.35, 0.6, n));
  spec = 1.0;
#elif STYLE == 4
  // Dune desert (Education)
  float n = fbm(p * 1.6 + uSeed);
  float dunes = 0.5 + 0.5 * sin((p.x + p.z * 0.7) * 26.0 + n * 9.0);
  col = mix(uC0, uC1, smoothstep(-0.45, 0.55, n));
  col = mix(col, uC2, dunes * 0.16);
  h = n * 0.35 + dunes * 0.06;
#elif STYLE == 5
  // Terran (About): continents, shallows, ice caps
  float n = fbm(p * 1.7 + uSeed);
  float land = smoothstep(0.03, 0.09, n);
  vec3 sea = mix(uC0, uC0 * 1.5, smoothstep(-0.55, 0.03, n));
  vec3 ground = mix(uC1, uC2, smoothstep(0.1, 0.45, n));
  col = mix(sea, ground, land);
  col = mix(col, uC3, smoothstep(0.8, 0.88, abs(p.y) + n * 0.08));
  spec = 1.0 - land;
  h = land * n * 0.5;
#else
  // Small cratered moon (Contact, Certificates, the moons)
  float n = fbm(p * 2.6 + uSeed);
  float cr = snoise(p * 7.0 + uSeed);
  float rim = smoothstep(0.5, 0.64, cr) - smoothstep(0.64, 0.9, cr);
  col = mix(uC0, uC1, smoothstep(-0.5, 0.5, n));
  col = mix(col, uC2, rim * 0.5);
  h = n * 0.5 + rim * 0.4;
#endif
  vec3 N0 = normalize(vNormalW);
  vec3 N = uBump > 0.0 ? bumpNormal(N0, vPosW, h, uBump) : N0;
  vec3 L = normalize(uSun - vPosW);
  vec3 V = normalize(cameraPosition - vPosW);
  float ndl = dot(N, L);
  if (uChart > 0.5) { gl_FragColor = vec4(chartShade(col, N0, V, dot(N0, L)), 1.0); return; }
  float day = smoothstep(-0.12, 0.6, ndl);                                  // soft terminator, never a hard line
  vec3 lit = col * (0.02 + day * 1.08);
  lit += col * vec3(1.0, 0.55, 0.3) * exp(-pow(ndl * 4.5, 2.0)) * 0.07;    // warm scatter along the terminator
  vec3 H = normalize(L + V);
  lit += spec * pow(max(dot(N, H), 0.0), 70.0) * 0.45 * day;
  lit += col * uGlow * 0.55;                                                // moons brighten when their project is open
  lit += uAccentCol * uPulse * 0.55;                                        // current-role moon breathes in the accent
  gl_FragColor = vec4(lit, 1.0);
}
`;

// Cloud shell for the ocean/terran worlds: drifts independently of the surface
export const CLOUD_FS = /* glsl */`
uniform vec3 uSun, uCloud;
uniform float uTime, uSeed, uDensity;
varying vec3 vObj;
varying vec3 vNormalW;
varying vec3 vPosW;
${NOISE}
void main() {
  vec3 p = vObj * 2.4 + vec3(uTime * 0.01, 0.0, uTime * 0.004) + uSeed;
  float c = smoothstep(0.08, 0.55, fbm(p) + 0.18 * snoise(p * 3.0));
  float day = smoothstep(-0.15, 0.55, dot(normalize(vNormalW), normalize(uSun - vPosW)));
  float a = c * uDensity;
  gl_FragColor = vec4(uCloud * (0.04 + day), a * (0.25 + 0.75 * day));
}
`;

// Fresnel rim glow, lit side only; additive in dark mode, a thin accent halo in chart mode
export const ATMO_FS = /* glsl */`
uniform vec3 uSun, uAtmo, uAccentCol;
uniform float uAccent, uStrength, uChart;
varying vec3 vObj;
varying vec3 vNormalW;
varying vec3 vPosW;
void main() {
  vec3 N = normalize(vNormalW);
  vec3 V = normalize(cameraPosition - vPosW);
  float f = pow(1.0 - max(dot(N, V), 0.0), 2.4);
  if (uChart > 0.5) {
    float a = smoothstep(0.55, 0.95, f) * uAccent * 0.6;
    gl_FragColor = vec4(uAccentCol, a);
    return;
  }
  float day = smoothstep(-0.35, 0.45, dot(N, normalize(uSun - vPosW)));
  vec3 c = mix(uAtmo, uAccentCol, uAccent);
  float a = f * (0.08 + day) * uStrength * (1.0 + uAccent * 0.5);
  gl_FragColor = vec4(c * a, a);
}
`;

// Sun: slow convection noise and limb darkening. Calm, not a fireball.
export const SUN_FS = /* glsl */`
uniform float uTime, uChart;
uniform vec3 uPaper, uInk, uAccentCol;
varying vec3 vObj;
varying vec3 vNormalW;
varying vec3 vPosW;
${NOISE}
void main() {
  vec3 N = normalize(vNormalW);
  vec3 V = normalize(cameraPosition - vPosW);
  float mu = max(dot(N, V), 0.0);
  if (uChart > 0.5) {
    float edge = smoothstep(0.8, 0.95, 1.0 - mu);
    float dots = step(0.82, snoise(vObj * 18.0)) * 0.5;                    // stippled photosphere
    gl_FragColor = vec4(mix(mix(uPaper, uInk, dots * 0.35), uAccentCol, edge), 1.0);
    return;
  }
  float n = fbm(vObj * 3.0 + vec3(0.0, uTime * 0.015, 0.0));
  float g = fbm(vObj * 10.0 - vec3(uTime * 0.02));
  vec3 c = mix(vec3(1.0, 0.6, 0.3), vec3(1.0, 0.94, 0.84), smoothstep(-0.45, 0.6, n + g * 0.35));
  c *= 0.5 + 0.62 * pow(mu, 0.45);                                          // limb darkening
  gl_FragColor = vec4(c * 1.2, 1.0);
}
`;

// Camera-facing corona quad around the sun
export const CORONA_VS = /* glsl */`
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
export const CORONA_FS = /* glsl */`
uniform float uTime, uChart;
uniform vec3 uInk;
varying vec2 vUv;
${NOISE}
void main() {
  vec2 q = vUv * 2.0 - 1.0;
  float r = length(q);
  if (uChart > 0.5) {
    float ring = (1.0 - smoothstep(0.0, 0.012, abs(r - 0.42))) * 0.5 + (1.0 - smoothstep(0.0, 0.008, abs(r - 0.62))) * 0.25;
    float ang = atan(q.y, q.x);
    float ticks = step(0.9, fract(ang * 3.8197)) * step(0.62, r) * step(r, 0.7) * 0.4;   // compass ticks round the sun
    gl_FragColor = vec4(uInk, (ring + ticks) * 0.7);
    return;
  }
  float ang = atan(q.y, q.x);
  float streak = 0.5 + 0.5 * snoise(vec3(cos(ang) * 1.6, sin(ang) * 1.6, uTime * 0.02));
  float glow = pow(max(1.0 - r, 0.0), 3.0) * 0.6 + pow(max(1.0 - r, 0.0), 1.6) * 0.12 * streak;
  gl_FragColor = vec4(vec3(1.0, 0.72, 0.45) * glow, glow);
}
`;

// Ring: canvas texture sampled by radius; darkened where the planet blocks the sun
export const RING_VS = /* glsl */`
varying vec3 vPosW;
varying vec3 vLocal;
void main() {
  vLocal = position;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vPosW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;
export const RING_FS = /* glsl */`
uniform sampler2D uTex;
uniform vec3 uSun, uCenter, uTint, uInk;
uniform float uR1, uR2, uPlanetR, uChart;
varying vec3 vPosW;
varying vec3 vLocal;
void main() {
  float u = (length(vLocal.xy) - uR1) / (uR2 - uR1);
  vec4 t = texture2D(uTex, vec2(u, 0.5));
  vec3 L = normalize(uSun - vPosW);
  vec3 oc = vPosW - uCenter;
  float b = dot(oc, L);
  float disc = b * b - (dot(oc, oc) - uPlanetR * uPlanetR);
  float shadow = (disc > 0.0 && b < 0.0) ? 0.18 : 1.0;                       // ray toward the sun passes through the planet
  if (uChart > 0.5) { gl_FragColor = vec4(uInk, t.a * 0.42 * (shadow < 1.0 ? 1.4 : 1.0)); return; }
  gl_FragColor = vec4(uTint * t.rgb * shadow, t.a * 0.9);
}
`;

// Stars: round soft points with a very slow twinkle; depth layers give parallax as the camera travels
export const STAR_VS = /* glsl */`
attribute float aSize;
attribute float aPhase;
uniform float uTime, uPR, uChart;
varying float vAlpha;
void main() {
  vAlpha = 0.6 + 0.4 * sin(uTime * 0.5 + aPhase);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uPR * (uChart > 0.5 ? 0.85 : 1.0);
  gl_Position = projectionMatrix * mv;
}
`;
export const STAR_FS = /* glsl */`
uniform vec3 uColor;
uniform float uChart;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.05, d) * vAlpha;
  gl_FragColor = vec4(uColor, a * (uChart > 0.5 ? 0.42 : 1.0));
}
`;

// Nebula wash on the inside of a huge sphere; dark theme only, deliberately faint
export const NEBULA_FS = /* glsl */`
uniform float uStrength;
varying vec3 vObj;
varying vec3 vNormalW;
varying vec3 vPosW;
${NOISE}
void main() {
  vec3 d = normalize(vObj);
  float n = fbm(d * 2.2 + 3.1);
  float m = fbm(d * 4.5 - 1.7);
  vec3 c = mix(vec3(0.16, 0.09, 0.06), vec3(0.06, 0.09, 0.13), 0.5 + 0.5 * m);   // warm dust into cold gas
  gl_FragColor = vec4(c * smoothstep(-0.1, 0.75, n) * uStrength, 1.0);
}
`;
