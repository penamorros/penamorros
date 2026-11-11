// His digital glasses, built in code to the measurements of his fitted head (face/tools/measure_fit.py): one smoked wraparound lens from temple to
// temple with a HUD inside it, a machined brow bar carrying a lit strip, temple arms with a small readout and a lit ring. Rides on the head joint.
import { AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, CatmullRomCurve3, Color, CustomBlending, CylinderGeometry, DoubleSide, Group, LinearFilter, Mesh, MeshStandardMaterial, OneFactor, OneMinusSrcAlphaFactor, ShaderMaterial, SphereGeometry, TorusGeometry, TubeGeometry, Vector2, Vector3 } from "three";
import { DISSOLVE, DISSOLVE_FRAG, shared } from "./head";
import { PHONE_GLSL, phoneU, spot, SPOT_GLSL } from "./reveal";

const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// Plan view of the lens: an ellipse fitted to his brow and cheek with 12 to 18 mm clear of the skin.
const A = 0.0955, B = 0.11, Z0 = 0.04, TH = (79 * Math.PI) / 180, YC = 0.305;
const yTop = (u: number) => 0.3335 - 0.0055 * u * u - 0.0175 * u ** 4;
const yBot = (u: number) => {
  const a = Math.abs(u);
  return 0.2985 + (0.2745 + 0.03 * a ** 2.6 - 0.2985) * smooth(0.055, 0.235, a);
};
function surf(u: number, y: number, off = 0): [number, number, number] {
  const th = u * TH;
  const tilt = (y - YC) * 0.1;
  const bow = -(((y - YC) / 0.03) ** 2) * 0.0035;
  return [(A + off) * Math.sin(th), y, Z0 + (B + off) * Math.cos(th) + tilt + bow];
}

function grid(nu: number, nv: number, f: (i: number, j: number) => number[], uv?: (i: number, j: number) => number[]) {
  const pos: number[] = [], uvs: number[] = [], idx: number[] = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    pos.push(...f(i, j));
    if (uv) uvs.push(...uv(i, j));
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
    idx.push(a, b, d, a, d, c);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  if (uv) g.setAttribute("uv", new BufferAttribute(new Float32Array(uvs), 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** A closed profile (out, up) swept along a line of frames. */
function sweep(n: number, frame: (t: number) => { c: number[]; out: number[]; up: number[]; s: number }, profile: number[][]) {
  const m = profile.length;
  return grid(n, m, (i, j) => {
    const fr = frame(i / n);
    const [o, h] = profile[j % m];
    return [fr.c[0] + (fr.out[0] * o + fr.up[0] * h) * fr.s, fr.c[1] + (fr.out[1] * o + fr.up[1] * h) * fr.s, fr.c[2] + (fr.out[2] * o + fr.up[2] * h) * fr.s];
  });
}

const CHAMFER = [[-0.0012, -0.0046], [0.0032, -0.0046], [0.0046, -0.0028], [0.0046, 0.0024], [0.0029, 0.0042], [-0.0012, 0.0042]].reverse();

function planOut(u: number): number[] {
  const th = u * TH;
  const n = new Vector3(Math.sin(th) / A, 0, Math.cos(th) / B).normalize();
  return [n.x, n.y, n.z];
}

export const glassU = {
  uOn: { value: 0 }, // the lit parts power up from the middle
  uHud: { value: 0 },
  uTime: { value: 0 },
  uLook: { value: new Vector2() },
};

const HUD_AMBER = "vec3(0.84, 0.91, 1.0)"; // Version A: cool white, not B's amber

function drawHud() {
  const W = 1024, H = 256;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d", { willReadFrequently: true })!;
  x.fillStyle = "#000";
  x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = "lighter";
  x.lineCap = "round";
  // Red stays still. Green moves a little with where he looks.
  // At rest the lens shows little: a corner mark round each eye, a line of data at the outer edge. Blue is the full reticle, only under the spotlight.
  const eye = (cx: number, cy: number) => {
    x.strokeStyle = "#0f0";
    x.lineWidth = 2;
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      x.beginPath();
      x.moveTo(cx + dx * 68, cy + dy * 34);
      x.lineTo(cx + dx * 68, cy + dy * 52);
      x.lineTo(cx + dx * 46, cy + dy * 52);
      x.stroke();
    }
    x.strokeStyle = "#00f";
    x.lineWidth = 1.5;
    x.beginPath(); x.arc(cx, cy, 44, 0, Math.PI * 2); x.stroke();
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2, r0 = i % 6 === 0 ? 30 : 37;
      x.beginPath(); x.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); x.lineTo(cx + Math.cos(a) * 41, cy + Math.sin(a) * 41); x.stroke();
    }
  };
  eye(375, 122);
  eye(649, 122);
  x.fillStyle = "#f00";
  x.textBaseline = "middle";
  x.font = "600 23px 'JetBrains Mono', monospace";
  x.textAlign = "right";
  x.fillText("478", 375 - 84, 110);
  x.textAlign = "left";
  x.fillText("LIVE", 649 + 84, 110);
  x.strokeStyle = "#f00";
  x.lineWidth = 4;
  x.beginPath(); x.moveTo(375 - 84, 134); x.lineTo(375 - 128, 134); x.stroke();
  x.beginPath(); x.moveTo(649 + 84, 134); x.lineTo(649 + 128, 134); x.stroke();
  x.fillStyle = "#00f";
  x.font = "500 17px 'JetBrains Mono', monospace";
  x.textAlign = "right";
  x.fillText("POINTS", 375 - 84, 156);
  x.textAlign = "left";
  x.fillText("LUMINA", 649 + 84, 156);
  const t = new CanvasTexture(c);
  t.minFilter = LinearFilter;
  t.magFilter = LinearFilter;
  t.generateMipmaps = false;
  t.anisotropy = 4;
  return t;
}

function metal(color = 0x101012, roughness = 0.3) {
  const m = new MeshStandardMaterial({ color, roughness, metalness: 1 });
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, shared);
    s.vertexShader = s.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vDis;").replace("#include <begin_vertex>", "#include <begin_vertex>\nvDis = position;");
    s.fragmentShader = s.fragmentShader.replace("#include <common>", `#include <common>\n${DISSOLVE}`).replace("#include <map_fragment>", `#include <map_fragment>\n${DISSOLVE_FRAG}`);
  };
  return m;
}

/** Light-emitting parts: core near white, edge amber, lit from the middle outward as uOn rises. The value goes out directly, not through tone mapping. */
function lit(gain = 1) {
  return new ShaderMaterial({
    uniforms: { ...glassU, ...shared, uGain: { value: gain } },
    vertexShader: `
      attribute float aU; attribute float aV;
      varying float vU; varying float vV; varying vec3 vDis;
      void main() { vU = aU; vV = aV; vDis = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      ${DISSOLVE}
      uniform float uOn, uTime, uGain;
      varying float vU; varying float vV;
      void main() {
        ${DISSOLVE_FRAG}
        float on = smoothstep(uOn * 1.15, uOn * 1.15 - 0.12, abs(vU));
        float core = exp(-pow((vV - 0.5) / 0.3, 2.0));
        float run = 0.86 + 0.14 * sin(vU * 9.0 - uTime * 1.3);
        vec3 c = mix(vec3(0.5, 0.66, 1.0), vec3(0.95, 0.97, 1.0), core * core);
        gl_FragColor = vec4(c * on * run * uGain, 1.0);
      }`,
  });
}

function withParams(g: BufferGeometry, fu: (i: number) => number, nPerRow: number, fv: (j: number) => number) {
  const count = g.getAttribute("position").count;
  const aU = new Float32Array(count), aV = new Float32Array(count);
  for (let k = 0; k < count; k++) { aU[k] = fu(k % nPerRow); aV[k] = fv(Math.floor(k / nPerRow)); }
  g.setAttribute("aU", new BufferAttribute(aU, 1));
  g.setAttribute("aV", new BufferAttribute(aV, 1));
  return g;
}

export function buildGlasses() {
  const group = new Group();
  const hud = drawHud();
  const NU = 140, NV = 18;

  // ---- the lens ----
  const lensG = grid(NU, NV, (i, j) => {
    const u = -1 + (2 * i) / NU;
    return surf(u, yBot(u) + (yTop(u) - yBot(u)) * (j / NV));
  }, (i, j) => {
    const u = -1 + (2 * i) / NU;
    const y = yBot(u) + (yTop(u) - yBot(u)) * (j / NV);
    return [u * 0.5 + 0.5, (y - 0.27) / 0.065];
  });
  const lensM = new MeshStandardMaterial({
    color: new Color(0x06070a), roughness: 0.07, metalness: 0, envMapIntensity: 2.4,
    transparent: true, depthWrite: false, side: DoubleSide,
    blending: CustomBlending, blendSrc: OneFactor, blendDst: OneMinusSrcAlphaFactor, blendSrcAlpha: OneFactor, blendDstAlpha: OneMinusSrcAlphaFactor,
  });
  lensM.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, shared, spot, glassU, phoneU, { uHudMap: { value: hud } });
    s.vertexShader = s.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vDis; varying vec2 vL;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvDis = position; vL = uv;");
    s.fragmentShader = s.fragmentShader
      .replace("#include <common>", `#include <common>
        ${DISSOLVE}
        ${SPOT_GLSL}
        ${PHONE_GLSL}
        uniform sampler2D uHudMap; uniform float uHud, uTime, uOn; uniform vec2 uLook;
        varying vec2 vL;`)
      .replace("#include <map_fragment>", `#include <map_fragment>
        ${DISSOLVE_FRAG}`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
        {
          float m = spotMask();
          vec3 h = texture2D(uHudMap, vL + vec2(0.0, 0.0)).rgb;
          float moves = texture2D(uHudMap, vL + uLook).g;
          float full = texture2D(uHudMap, vL + uLook).b;
          float scan = exp(-pow((vL.y - fract(uTime * 0.14) * 1.1) * 12.0, 2.0));
          float g = (h.r * 0.8 + moves * 0.55) * (0.62 + 0.38 * scan) + (h.r + moves) * m * 1.1 + full * m * 2.2;
          totalEmissiveRadiance += ${HUD_AMBER} * g * uHud;
          // The strip's light going down into the glass, strongest just under it, then the lens falls to smoke.
          float under = smoothstep(0.34, 1.0, vL.y);
          totalEmissiveRadiance += vec3(0.55, 0.68, 1.0) * under * under * under * 0.5 * uOn;
          totalEmissiveRadiance += phoneLight(normal, -vViewPosition) * 0.5;
        }`)
      .replace("#include <opaque_fragment>", `
        {
          // Smoked glass: the tint fades what's behind it; reflections sit on top at full strength.
          float fres = pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), 3.0);
          float a = mix(0.8, 0.98, fres);
          // A coated lens: warm reflections head on, cooler towards the edge.
          vec3 coat = mix(vec3(1.0, 0.72, 0.46), vec3(0.74, 0.86, 1.0), fres);
          gl_FragColor = vec4(totalDiffuse * a + totalSpecular * coat + totalEmissiveRadiance, a);
        }`)
      .replace("#include <premultiplied_alpha_fragment>", "");
  };
  const lens = new Mesh(lensG, lensM);
  lens.renderOrder = 6;
  group.add(lens);

  // ---- the brow bar ----
  const barM = metal();
  const bar = new Mesh(sweep(120, (t) => {
    const u = -1.015 + 2.03 * t;
    const y = yTop(Math.max(-1, Math.min(1, u))) + 0.0012;
    return { c: surf(u, y, 0.0004), out: planOut(u), up: [0, 1, 0], s: 1 - 0.32 * Math.abs(u) ** 5 };
  }, CHAMFER), barM);
  group.add(bar);

  // ---- the lit strip along the bar's lower lip, and its soft glow ----
  const stripNU = 120, stripNV = 2;
  const stripG = withParams(grid(stripNU, stripNV, (i, j) => {
    const u = -0.93 + (1.86 * i) / stripNU;
    return surf(u, yTop(u) - 0.0030 + 0.0019 * (j / stripNV), 0.0052);
  }), (i) => -1 + (2 * i) / stripNU, stripNU + 1, (j) => j / stripNV);
  const strip = new Mesh(stripG, lit(1));
  strip.renderOrder = 7;
  group.add(strip);

  const haloM = new ShaderMaterial({
    uniforms: { ...glassU },
    transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide,
    vertexShader: `
      attribute float aU; attribute float aV;
      varying float vU; varying float vV;
      void main() { vU = aU; vV = aV; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float uOn;
      varying float vU; varying float vV;
      void main() {
        float on = smoothstep(uOn * 1.15, uOn * 1.15 - 0.2, abs(vU));
        float v = exp(-pow((vV - 0.5) / 0.17, 2.0)) * 0.85 + exp(-pow((vV - 0.5) / 0.05, 2.0)) * 0.6;
        float e = smoothstep(1.0, 0.72, abs(vU));
        gl_FragColor = vec4(vec3(0.62, 0.76, 1.0) * v * e * on * 0.62, 1.0);
      }`,
  });
  const haloNU = 90, haloNV = 16;
  const haloG = withParams(grid(haloNU, haloNV, (i, j) => {
    const u = -1 + (2 * i) / haloNU;
    return surf(u, yTop(u) - 0.0021 + 0.034 * (j / haloNV - 0.5), 0.0072);
  }), (i) => -1 + (2 * i) / haloNU, haloNU + 1, (j) => j / haloNV);
  const halo = new Mesh(haloG, haloM);
  halo.renderOrder = 8;
  group.add(halo);

  // ---- the lens's bottom edge: lit from inside, faintly, like edge-lit glass ----
  const edgePts: Vector3[] = [];
  for (let i = 0; i <= 160; i++) { const u = -1 + i / 80; edgePts.push(new Vector3(...surf(u, yBot(u), 0.0002))); }
  const edgeG = new TubeGeometry(new CatmullRomCurve3(edgePts), 320, 0.00085, 6, false);
  const edgeU = new Float32Array(edgeG.getAttribute("position").count);
  const edgeV = new Float32Array(edgeU.length);
  const eps = edgeG.getAttribute("position");
  for (let k = 0; k < edgeU.length; k++) { edgeU[k] = Math.sin(Math.atan2(eps.getX(k), eps.getZ(k) - Z0)) * 1.0; edgeV[k] = 0.5; }
  edgeG.setAttribute("aU", new BufferAttribute(edgeU, 1));
  edgeG.setAttribute("aV", new BufferAttribute(edgeV, 1));
  group.add(new Mesh(edgeG, lit(0.34)));

  // ---- the temple arms, the ring and the readout ----
  const armM = metal(0x101012, 0.34);
  const ringGeo = new TorusGeometry(0.0084, 0.0007, 10, 48);
  const ringUv = new Float32Array(ringGeo.getAttribute("position").count);
  ringGeo.setAttribute("aU", new BufferAttribute(ringUv, 1));
  ringGeo.setAttribute("aV", new BufferAttribute(new Float32Array(ringUv.length).fill(0.5), 1));
  const podGeo = new CylinderGeometry(0.0118, 0.0124, 0.0052, 40);
  const faceGeo = new CylinderGeometry(0.0072, 0.0072, 0.0009, 32);
  const readoutGeo = withParams(grid(2, 1, (i, j) => [0, -0.0016 + 0.0032 * j, -0.0072 + 0.0072 * i]), () => 0, 3, (j) => j);
  for (const s of [-1, 1]) {
    const pts = [
      new Vector3(s * 0.0912, 0.3082, 0.0628),
      new Vector3(s * 0.0985, 0.3105, 0.041),
      new Vector3(s * 0.1048, 0.3125, 0.014),
      new Vector3(s * 0.1062, 0.3115, -0.014),
      new Vector3(s * 0.1022, 0.301, -0.041),
      new Vector3(s * 0.0962, 0.289, -0.054),
    ];
    const curve = new CatmullRomCurve3(pts);
    const armProfile = [[-0.0014, -0.0040], [0.0014, -0.0040], [0.0014, 0.0040], [-0.0014, 0.0040]];
    const arm = new Mesh(sweep(40, (t) => {
      const c = curve.getPoint(t);
      const tan = curve.getTangent(t);
      const out = new Vector3(tan.z, 0, -tan.x).multiplyScalar(s).normalize();
      const up = new Vector3().crossVectors(tan, out).multiplyScalar(s).normalize();
      if (up.y < 0) up.negate();
      return { c: [c.x, c.y, c.z], out: [out.x, out.y, out.z], up: [up.x, up.y, up.z], s: 1 - 0.42 * smooth(0.35, 1, t) };
    }, s > 0 ? armProfile : [...armProfile].reverse()), armM);
    group.add(arm);

    const pod = new Mesh(podGeo, armM);
    pod.rotation.z = Math.PI / 2;
    pod.position.set(s * 0.1056, 0.3122, 0.0242);
    group.add(pod);
    const faceM = metal(0x050505, 0.2);
    faceM.envMapIntensity = 0.25;
    const face = new Mesh(faceGeo, faceM);
    face.rotation.z = Math.PI / 2;
    face.position.set(s * 0.1086, 0.3122, 0.0242);
    group.add(face);
    const ring = new Mesh(ringGeo, lit(0.8));
    ring.rotation.y = Math.PI / 2;
    ring.position.set(s * 0.1086, 0.3122, 0.0242);
    group.add(ring);
    const readout = new Mesh(readoutGeo, lit(0.9));
    readout.position.set(s * 0.1007, 0.3106, 0.0448);
    readout.rotation.y = s * 0.27;
    (readout.material as ShaderMaterial).side = DoubleSide;
    group.add(readout);
  }

  // ---- the bridge: two small pads on his nose, held by thin wires from the lens ----
  const padM = metal(0x6a625c, 0.4);
  for (const s of [-1, 1]) {
    const pad = new Mesh(new SphereGeometry(0.0026, 14, 10), padM);
    pad.scale.set(0.55, 1.4, 0.85);
    pad.position.set(s * 0.0108, 0.2925, 0.1302);
    group.add(pad);
    const wire = new CatmullRomCurve3([new Vector3(s * 0.0118, 0.3005, 0.1452), new Vector3(s * 0.0138, 0.2985, 0.1395), new Vector3(s * 0.0112, 0.2945, 0.1322)]);
    group.add(new Mesh(new TubeGeometry(wire, 10, 0.0006, 6, false), padM));
  }
  const meshes: any[] = [];
  group.traverse((o) => { if ((o as Mesh).isMesh) { o.frustumCulled = false; meshes.push(o); } });
  return { group, meshes, hud };
}
