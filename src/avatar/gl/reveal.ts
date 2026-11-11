// The cursor spotlight (from Cyberpunk Reveal): under it his clothes are armour with lit seams and his face shows Lumina's 478-point mesh.
// It's done in each material rather than with a second image, so it stays on the real 3D as he moves.
import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter, Vector3 } from "three";

export const spot = {
  uSpot: { value: new Vector3(-9999, -9999, 300) }, // x, y and radius, in device pixels, with y from the bottom
  uPower: { value: 0 },
};

// The ref's mask stops (1 until 0.4, 0.75 at 0.6, 0.4 at 0.75, 0.12 at 0.88, 0 at 1), which this one curve follows closely.
export const SPOT_GLSL = `
  uniform vec3 uSpot; uniform float uPower;
  float spotMask() { return uPower * (1.0 - smoothstep(0.42, 1.0, distance(gl_FragCoord.xy, uSpot.xy) / uSpot.z)); }`;

export const phoneU = {
  uPhoneOn: { value: 0 }, // screen brightness, 0 to 1
  uPing: { value: 0 }, // the back strip's pulse
  uPhoneV: { value: new Vector3() }, // where the screen is, in view space
  uPhoneN: { value: new Vector3(0, 0, 1) }, // which way it faces, in view space
};

// Light from the screen on anything near it. Falls off fast, only reaches what the screen faces.
export const PHONE_GLSL = `
  uniform vec3 uPhoneV, uPhoneN; uniform float uPhoneOn;
  vec3 phoneLight(vec3 n, vec3 p) {
    vec3 L = uPhoneV - p;
    float d2 = dot(L, L);
    vec3 l = L / sqrt(d2);
    float facing = max(dot(-l, uPhoneN), 0.0);
    return vec3(0.9, 0.94, 1.0) * max(dot(n, l), 0.0) * facing / (1.0 + d2 / 0.02) * uPhoneOn;
  }`;

// The armour is drawn on MakeHuman's rest pose, seen from the front in metres, arms out to the sides, so nothing overlaps and it stays on him when he moves.
export const MAP_LO = [-0.68, -1.0], MAP_SIZE = [1.36, 1.3];
export const MAP_GLSL = `vec2 armourUv(vec2 p) { return (p - vec2(${MAP_LO[0]}, ${MAP_LO[1]})) / vec2(${MAP_SIZE[0]}, ${MAP_SIZE[1]}); }`;

type Pt = [number, number];

/** R: lit lines. G: plate height. B: the clothes' own seams, always there. */
export function buildArmour(lite: boolean, rest: Record<string, number[]>) {
  const W = lite ? 720 : 1280, H = Math.round((W * MAP_SIZE[1]) / MAP_SIZE[0]);
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  // Drawn on the CPU: a GPU canvas holds up everything else the GPU process is doing, and has to be read back to upload.
  const x = c.getContext("2d", { willReadFrequently: true })!;
  const s = W / MAP_SIZE[0];
  const X = (m: number) => (m - MAP_LO[0]) * s;
  const Y = (m: number) => H - (m - MAP_LO[1]) * s;
  const path = (pts: Pt[], close: boolean, side: 1 | -1) => {
    x.beginPath();
    pts.forEach(([a, b], i) => { const px = X(a * side), py = Y(b); if (i) x.lineTo(px, py); else x.moveTo(px, py); });
    if (close) x.closePath();
  };
  const both = (f: (side: 1 | -1) => void) => { f(1); f(-1); };
  x.fillStyle = "#000";
  x.fillRect(0, 0, W, H);

  // A plate along an arm: t0 to t1 of the way between two joints, hw either side of its axis.
  const sh = rest["upperarm01.L"], el = rest["lowerarm01.L"], wr = rest["wrist.L"];
  const along = (a: number[], b: number[], t0: number, t1: number, hw: number): Pt[] => {
    const ux = b[0] - a[0], uy = b[1] - a[1];
    const l = Math.hypot(ux, uy);
    const nx = -uy / l, ny = ux / l;
    const p = (t: number, o: number): Pt => [a[0] + ux * t + nx * o, a[1] + uy * t + ny * o];
    const ch = 0.05;
    return [p(t0, hw * 0.7), p(t0 + ch, hw), p(t1 - ch, hw), p(t1, hw * 0.7), p(t1, -hw * 0.7), p(t1 - ch, -hw), p(t0 + ch, -hw), p(t0, -hw * 0.7)];
  };

  // Plates, with a stepped bevel so they catch light along their edges. Mirrored.
  const plates: Pt[][] = [
    [[0.026, 0.09], [0.128, 0.086], [0.172, 0.052], [0.118, 0.042], [0.026, 0.066]],
    [[0.026, 0.056], [0.118, 0.032], [0.172, 0.04], [0.174, -0.03], [0.13, -0.098], [0.026, -0.108]],
    [[0.026, -0.118], [0.124, -0.108], [0.106, -0.138], [0.026, -0.144]],
    [[0.18, 0.07], [0.235, 0.05], [0.272, -0.02], [0.24, -0.075], [0.19, -0.05], [0.172, -0.005]],
    along(sh, el, 0.34, 0.62, 0.052),
    along(sh, el, 0.68, 0.94, 0.05),
    along(el, wr, 0.1, 0.42, 0.042),
    along(el, wr, 0.5, 0.82, 0.034),
    [[0.176, -0.042], [0.164, -0.15], [0.14, -0.25], [0.122, -0.156]],
  ];
  for (let i = 0; i < 6; i++) {
    const t = -0.156 - i * 0.04;
    plates.push([[0.026, t], [0.064, t + 0.002], [0.064, t - 0.031], [0.026, t - 0.033]]);
    plates.push([[0.07, t + 0.002], [0.112 - i * 0.002, t + 0.012], [0.108 - i * 0.002, t - 0.021], [0.07, t - 0.031]]);
  }
  const lw = W / 1024;
  for (const pts of plates) {
    both((side) => {
      x.save();
      path(pts, true, side);
      x.clip();
      x.fillStyle = "rgb(0,190,0)";
      x.fillRect(0, 0, W, H);
      // Round the plate's rim: darker outside, the full height a few pixels in.
      for (let i = 0; i < 4; i++) {
        path(pts, true, side);
        x.lineWidth = (8 - i * 1.9) * lw;
        x.strokeStyle = `rgb(0,${60 + i * 34},0)`;
        x.stroke();
      }
      x.restore();
    });
  }
  // The middle plate under the zip.
  x.fillStyle = "rgb(0,120,0)";
  x.fillRect(X(-0.02), Y(0.096), 0.04 * s, 0.53 * s);

  // Adds channel to channel from here on.
  x.globalCompositeOperation = "lighter";
  x.lineCap = "round";
  x.lineJoin = "round";
  // A soft falloff built into the line: a hard thin one, magnified and then pushed past white, shows steps along its length.
  const lit = (pts: Pt[], w = 1.8) => both((side) => {
    path(pts, false, side);
    for (const [k, r] of [[9.5, 6], [6.8, 9], [4.8, 16], [3.2, 28], [2.1, 50], [1.4, 66], [1, 90]]) {
      x.strokeStyle = `rgb(${r},0,0)`;
      x.lineWidth = w * k * lw;
      x.stroke();
    }
  });
  const edge = (a: number[], b: number[], t: number, t0: number, t1: number, o: number): Pt[] => {
    const ux = b[0] - a[0], uy = b[1] - a[1];
    const l = Math.hypot(ux, uy);
    const nx = -uy / l, ny = ux / l;
    void t;
    return [[a[0] + ux * t0 + nx * o, a[1] + uy * t0 + ny * o], [a[0] + ux * t1 + nx * o, a[1] + uy * t1 + ny * o]];
  };
  lit([[0.05, 0.058], [0.118, 0.034]], 2.2);
  lit([[0.128, 0.078], [0.165, 0.054]]);
  lit([[0.174, -0.03], [0.13, -0.098], [0.062, -0.106]], 2);
  lit([[0.042, 0.042], [0.1, 0.022]], 1.2);
  lit([[0.19, -0.05], [0.24, -0.075]], 2.2);
  lit([[0.196, 0.034], [0.238, 0.018]], 1.4);
  lit(edge(sh, el, 0, 0.4, 0.58, 0.04), 1.8);
  lit(edge(sh, el, 0, 0.72, 0.9, -0.04), 1.6);
  lit(edge(el, wr, 0, 0.16, 0.38, 0.032), 1.8);
  lit(edge(el, wr, 0, 0.55, 0.78, -0.026), 1.5);
  lit([[0.17, -0.05], [0.145, -0.22]], 1.7);
  // Short dashes either side of the zip, not one long line.
  for (let i = 0; i < 13; i++) {
    const t = 0.082 - i * 0.03;
    lit([[0.024, t], [0.024, t - (i % 3 === 0 ? 0.02 : 0.009)]], 1.2);
  }
  for (let i = 0; i < 6; i++) {
    const t = -0.158 - i * 0.04;
    lit([[0.074, t - 0.012], [0.106 - i * 0.002, t - 0.004]], 1.2);
    lit([[0.03, t - 0.026], [0.054, t - 0.026]], 1);
  }
  // On his neck, read by the skin: two cords and a ring, above the collar.
  lit([[0.03, 0.2], [0.041, 0.175]], 1.2);
  lit([[0.051, 0.195], [0.055, 0.176]], 1);

  // The clothes' seams: collar to armpit, down the side, and the shirt's hem.
  const seam = (pts: Pt[]) => both((side) => {
    x.beginPath();
    x.moveTo(X(pts[0][0] * side), Y(pts[0][1]));
    x.bezierCurveTo(X(pts[1][0] * side), Y(pts[1][1]), X(pts[2][0] * side), Y(pts[2][1]), X(pts[3][0] * side), Y(pts[3][1]));
    x.strokeStyle = "#00f";
    x.lineWidth = 1.6 * lw;
    x.stroke();
  });
  seam([[0.08, 0.1], [0.11, 0.06], [0.14, 0.0], [0.165, -0.08]]);
  seam([[0.165, -0.08], [0.158, -0.2], [0.15, -0.32], [0.16, -0.46]]);
  x.strokeStyle = "#00f";
  x.lineWidth = 2.4 * lw;
  x.beginPath();
  x.moveTo(X(-0.3), Y(-0.46));
  x.lineTo(X(0.3), Y(-0.46));
  x.stroke();

  const t = new CanvasTexture(c);
  t.minFilter = LinearMipmapLinearFilter;
  t.magFilter = LinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = lite ? 2 : 4;
  return t;
}
