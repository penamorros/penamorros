// The field behind him (from DJ ZakDerdan): silk light streaks in a hot orange, bending round him like water round a stone. Streak lines are the
// stream function of flow past a cylinder, tilted up and away on both sides, so they always read as coming from where he stands.
// A second pass of the same streaks lies over the figure, faintly, for the double exposure.
import { AdditiveBlending, Mesh, NoBlending, PlaneGeometry, ShaderMaterial, Vector2 } from "three";
import { spot, SPOT_GLSL } from "./reveal";

const FIELD = `
  uniform float uTime, uGain, uAspect, uDetail; uniform vec2 uCentre; uniform vec2 uPx;
  varying vec2 vUv;
  ${SPOT_GLSL}
  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  vec2 frame(vec2 p) {
    // Both sides lean up and outward; the tilt turns smoothly through the middle so there is no crease above his head.
    float a = 0.42 * tanh(p.x * 2.6);
    float c = cos(a), s = sin(a);
    return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
  }
  float flow(vec2 p, float freq, float sharp, float seed, float R2) {
    float r2 = dot(p, p);
    // Lines pinch together as they pass him and never close into rings.
    float psi = p.y * r2 / (r2 + R2);
    float phi = p.x * (1.0 + R2 / (r2 + R2));
    psi += 0.22 * (vnoise(vec2(p.x * 0.8 - uTime * 0.03, p.y * 1.2 + seed)) - 0.5);
    float n = vnoise(vec2(psi * freq + seed * 3.1, phi * 0.42 - uTime * 0.07 + seed));
    n = n * 0.68 + 0.32 * vnoise(vec2(psi * freq * 2.1 - seed, phi * 0.7 - uTime * 0.1));
    return pow(n, sharp);
  }
  float streaks(vec2 p, float seed) {
    vec2 q = frame(p);
    float v = flow(q, 2.6, 1.5, seed, 0.06);
    v = v * 0.92 + 0.5 * flow(q + 0.3, 6.5, 3.0, seed + 4.7, 0.05);
    if (uDetail > 0.5) v += 0.3 * flow(q - 0.2, 19.0, 4.5, seed + 9.1, 0.04);
    return v;
  }`;

export function buildBackdrop(lite: boolean) {
  const uniforms = {
    uTime: { value: 0 }, uGain: { value: 0 }, uAspect: { value: 1 }, uDetail: { value: lite ? 0 : 1 },
    uCentre: { value: new Vector2() }, uPx: { value: new Vector2(1, 1) }, uFront: { value: 0.0 },
    ...spot,
  };
  const vertexShader = `varying vec2 vUv; void main() { vUv = position.xy; gl_Position = vec4(position.xy, 1.0, 1.0); }`;
  const back = new ShaderMaterial({
    uniforms,
    depthTest: false,
    depthWrite: false,
    blending: NoBlending,
    vertexShader,
    fragmentShader: `
      ${FIELD}
      vec3 ramp(float v) {
        vec3 c = mix(vec3(0.04, 0.012, 0.008), vec3(0.4, 0.085, 0.015), smoothstep(0.02, 0.26, v));
        c = mix(c, vec3(0.88, 0.3, 0.03), smoothstep(0.2, 0.52, v));
        c = mix(c, vec3(1.0, 0.56, 0.1), smoothstep(0.48, 0.82, v));
        return mix(c, vec3(1.0, 0.8, 0.5), smoothstep(0.86, 1.3, v));
      }
      void main() {
        vec2 p = vec2(vUv.x * uAspect, vUv.y) - uCentre;
        // Hottest behind his head and shoulders, falling to near black in the corners and along the top, where the words start.
        float d = length(p * vec2(0.66, 0.86));
        float glow = exp(-d * d * 1.05);
        float top = 1.0 - 0.8 * smoothstep(0.5, 1.0, vUv.y);
        float bottom = 1.0 - 0.55 * smoothstep(-0.4, -1.0, vUv.y);
        float s = streaks(p, 1.3);
        float v = (0.26 + s * 1.0) * (0.1 + 1.2 * glow) * top * bottom;
        vec3 col = ramp(v * uGain);
        // Under the spotlight the field runs hotter and a fine grid appears, the same 48 px as the ref.
        float m = spotMask();
        vec2 g = abs(fract(gl_FragCoord.xy / uPx.x) - 0.5);
        float grid = smoothstep(0.5 - 1.2 / uPx.x, 0.5, max(g.x, g.y));
        col += col * m * 0.2 + vec3(1.0, 0.72, 0.46) * grid * m * 0.26;
        col += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) / 160.0;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const front = new ShaderMaterial({
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: AdditiveBlending,
    vertexShader,
    fragmentShader: `
      ${FIELD}
      void main() {
        vec2 p = vec2(vUv.x * uAspect, vUv.y) - uCentre;
        // Only low on the body and at the edges of the head: never across the glasses.
        float keep = smoothstep(0.05, 0.42, abs(p.x)) * 0.8 + smoothstep(-0.28, -0.72, p.y) * 0.7;
        float s = pow(streaks(p + vec2(0.0, 0.12), 2.9), 2.2);
        float d = length(p * vec2(0.72, 0.92));
        float a = s * keep * exp(-d * d * 0.9) * uGain;
        gl_FragColor = vec4(vec3(1.0, 0.42, 0.09) * a * 0.42, a);
      }`,
  });
  const geo = new PlaneGeometry(2, 2);
  const backMesh = new Mesh(geo, back), frontMesh = new Mesh(geo, front);
  backMesh.frustumCulled = frontMesh.frustumCulled = false;
  backMesh.renderOrder = -100;
  frontMesh.renderOrder = 50;
  return { back: backMesh, front: frontMesh, uniforms };
}
