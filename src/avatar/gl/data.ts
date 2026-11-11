// Turns the packed files into plain typed arrays, ready for the GPU. Runs in the worker, so none of this blocks the page.
import { type Packed, unpackNormals, unpackPositions } from "./decode";

export type MeshData = Record<string, Float32Array | Uint16Array | Uint32Array> & { index: Uint16Array | Uint32Array };

function skinPart(p: Packed, part: any, box: any): MeshData {
  const uv16 = p.view<Uint16Array>(part.uv);
  const uv = new Float32Array(uv16.length);
  // The texture is read without a flip (a decoded image is top-down), so the UVs are turned here instead.
  for (let i = 0; i < uv.length; i += 2) { uv[i] = uv16[i] / 65535; uv[i + 1] = 1 - uv16[i + 1] / 65535; }
  const w8 = p.view<Uint8Array>(part.weights);
  const n = w8.length / 4;
  const skinWeight = new Float32Array(w8.length);
  const skinIndex = new Uint16Array(n * 4);
  for (let i = 0; i < n; i++) {
    const a = w8[i * 4], b = w8[i * 4 + 1], c = w8[i * 4 + 2], d = w8[i * 4 + 3];
    const s = a + b + c + d || 1;
    skinWeight[i * 4] = a / s; skinWeight[i * 4 + 1] = b / s; skinWeight[i * 4 + 2] = c / s; skinWeight[i * 4 + 3] = d / s;
    skinIndex[i * 4] = 0; skinIndex[i * 4 + 1] = 1; skinIndex[i * 4 + 2] = 2; skinIndex[i * 4 + 3] = 3;
  }
  const ao8 = p.view<Uint8Array>(part.ao), th8 = p.view<Uint8Array>(part.thick);
  const ao = new Float32Array(n), thick = new Float32Array(n);
  for (let i = 0; i < n; i++) { ao[i] = ao8[i] / 255; const t = th8[i] / 255; thick[i] = t * t * 0.2; }
  const out: any = {
    position: unpackPositions(p.view<Uint16Array>(part.position), box),
    normal: unpackNormals(p.view<Uint8Array>(part.normal)),
    uv, skinWeight, skinIndex, ao, thick,
    index: p.view<Uint16Array>(part.index).slice(),
  };
  if (part.color) {
    const c8 = p.view<Uint8Array>(part.color);
    const c = new Float32Array(c8.length);
    for (let i = 0; i < c.length; i++) c[i] = Math.pow(c8[i] / 255, 2.2);
    out.color = c;
  }
  if (part.blinkIndex) {
    const idx = p.view<Uint16Array>(part.blinkIndex);
    const del = p.view<Int16Array>(part.blinkDelta);
    const m = new Float32Array(n * 3);
    for (let i = 0; i < idx.length; i++) for (let c = 0; c < 3; c++) m[idx[i] * 3 + c] = del[i * 3 + c] * 0.00005;
    out.blink = m;
  }
  if (part.mouthIndex) {
    const idx = p.view<Uint16Array>(part.mouthIndex);
    const del = p.view<Int16Array>(part.mouthDelta);
    const m = new Float32Array(n * 3);
    for (let i = 0; i < idx.length; i++) for (let c = 0; c < 3; c++) m[idx[i] * 3 + c] = del[i * 3 + c] * 0.00005;
    out.mouth = m;
  }
  return out;
}

export function decodeHead(p: Packed) {
  const box = p.meta.box;
  return {
    skin: skinPart(p, p.meta.skin, box),
    eyes: skinPart(p, p.meta.eyes, box),
    cornea: skinPart(p, p.meta.cornea, box),
    joints: p.meta.joints.positions as number[][],
    parents: p.meta.joints.parents as number[],
    centre: p.meta.centre as [number, number, number],
  };
}

/** The clothes, collar, zip, hands and skeleton from face/tools/mh_parts.py. */
export function decodeBody(p: Packed) {
  const box = p.meta.box;
  const part = (r: any) => {
    const si = p.view<Uint8Array>(r.skinIndex), sw = p.view<Uint8Array>(r.skinWeight);
    const skinIndex = new Uint16Array(si.length), skinWeight = new Float32Array(sw.length);
    for (let i = 0; i < si.length; i++) { skinIndex[i] = si[i]; skinWeight[i] = sw[i] / 255; }
    const out: any = {
      position: unpackPositions(p.view<Uint16Array>(r.position), box),
      normal: unpackNormals(p.view<Uint8Array>(r.normal)),
      index: p.view<Uint16Array>(r.index).slice(),
      skinIndex,
      skinWeight,
    };
    for (const name of ["ao", "tape"]) {
      if (!r[name]) continue;
      const b = p.view<Uint8Array>(r[name]);
      const f = new Float32Array(b.length);
      for (let i = 0; i < b.length; i++) f[i] = b[i] / 255;
      out[name] = f;
    }
    if (r.hand) {
      // Where on the hand: along the finger or across its back, sideways, and how far round to the back. See mh_pose.py hand_data().
      const q = p.view<Uint16Array>(r.hand);
      const f = new Float32Array(q.length);
      for (let i = 0; i < q.length; i += 3) { f[i] = (q[i] / 65535) * 4 - 1; f[i + 1] = (q[i + 1] / 65535) * 2 - 1; f[i + 2] = (q[i + 2] / 65535) * 2 - 1; }
      out.hand = f;
    }
    if (r.uv) {
      const q = p.view<Uint8Array>(r.uv);
      const f = new Float32Array(q.length);
      for (let i = 0; i < q.length; i++) f[i] = q[i] / 255;
      out.uv = f;
    }
    if (r.rest) {
      // Where this point is on the armour map: already 0 to 1.
      const q = p.view<Uint16Array>(r.rest);
      const f = new Float32Array(q.length);
      for (let i = 0; i < q.length; i++) f[i] = q[i] / 65535;
      out.rest = f;
    }
    return out;
  };
  return { shirt: part(p.meta.shirt), collar: part(p.meta.collar), zip: part(p.meta.zip), hands: part(p.meta.hands), rig: p.meta.rig };
}

function hairBody(p: Packed) {
  const b = p.meta.body;
  const lum8 = p.view<Uint8Array>(b.lum);
  const color = new Float32Array(lum8.length * 3);
  for (let i = 0; i < lum8.length; i++) { const l = Math.pow(lum8[i] / 255, 2.2); color[i * 3] = l; color[i * 3 + 1] = l * 0.92; color[i * 3 + 2] = l * 0.85; }
  return { position: unpackPositions(p.view<Uint16Array>(b.position), p.meta.box), normal: unpackNormals(p.view<Uint8Array>(b.normal)), color, index: p.view<Uint16Array>(b.index).slice() };
}

function hairStrands(p: Packed, maxStrands: number) {
  const box = p.meta.box;
  const counts = p.view<Uint8Array>(p.meta.strandCounts);
  const widths = p.view<Uint8Array>(p.meta.strandWidths);
  const dx = p.view<Int16Array>(p.meta.dx), dy = p.view<Int16Array>(p.meta.dy), dz = p.view<Int16Array>(p.meta.dz);
  const lum = p.view<Uint8Array>(p.meta.lum), along = p.view<Uint8Array>(p.meta.along);
  const S = Math.min(maxStrands, counts.length);
  let N = 0;
  for (let i = 0; i < S; i++) N += counts[i];
  const P = new Float32Array(N * 6), T = new Float32Array(N * 6), C = new Float32Array(N * 6);
  const A = new Float32Array(N * 2), W = new Float32Array(N * 2), Sd = new Float32Array(N * 2);
  const idx = new Uint32Array((N - S) * 6);
  const sx = (box.hi[0] - box.lo[0]) / 65535, sy = (box.hi[1] - box.lo[1]) / 65535, sz = (box.hi[2] - box.lo[2]) / 65535;
  let at = 0, ii = 0;
  for (let s = 0; s < S; s++) {
    const n = counts[s];
    const width = (widths[s] / 255) * 0.001;
    let qx = 0, qy = 0, qz = 0;
    for (let i = 0; i < n; i++) {
      const k = at + i;
      // Steps along the strand, in 16-bit arithmetic: the first step from zero wraps, and wraps back.
      qx = (qx + dx[k]) & 0xffff; qy = (qy + dy[k]) & 0xffff; qz = (qz + dz[k]) & 0xffff;
      const x = box.lo[0] + qx * sx, y = box.lo[1] + qy * sy, z = box.lo[2] + qz * sz;
      P[k * 6] = P[k * 6 + 3] = x; P[k * 6 + 1] = P[k * 6 + 4] = y; P[k * 6 + 2] = P[k * 6 + 5] = z;
      const l = Math.pow(lum[k] / 255, 2.2);
      // Hair colour: near-black with a little warmth, from the photos' light and dark.
      C[k * 6] = C[k * 6 + 3] = l * 1.05; C[k * 6 + 1] = C[k * 6 + 4] = l * 0.97; C[k * 6 + 2] = C[k * 6 + 5] = l * 0.9;
      A[k * 2] = A[k * 2 + 1] = along[k] / 255;
      W[k * 2] = W[k * 2 + 1] = width;
      Sd[k * 2] = -1; Sd[k * 2 + 1] = 1;
      if (i < n - 1) {
        const a = k * 2;
        idx[ii++] = a; idx[ii++] = a + 1; idx[ii++] = a + 2; idx[ii++] = a + 1; idx[ii++] = a + 3; idx[ii++] = a + 2;
      }
    }
    // Directions along the strand, once its positions are known.
    for (let i = 0; i < n; i++) {
      const k = at + i, a = at + Math.max(i - 1, 0), b = at + Math.min(i + 1, n - 1);
      let tx = P[b * 6] - P[a * 6], ty = P[b * 6 + 1] - P[a * 6 + 1], tz = P[b * 6 + 2] - P[a * 6 + 2];
      const len = Math.hypot(tx, ty, tz) || 1;
      tx /= len; ty /= len; tz /= len;
      T[k * 6] = T[k * 6 + 3] = tx; T[k * 6 + 1] = T[k * 6 + 4] = ty; T[k * 6 + 2] = T[k * 6 + 5] = tz;
    }
    at += n;
  }
  return { position: P, tangent: T, color: C, along: A, width: W, side: Sd, index: idx };
}

export function decodeHair(p: Packed, maxStrands: number) {
  return { body: hairBody(p), strands: hairStrands(p, maxStrands) };
}

export type SigImage = { width: number; height: number; data: Uint8ClampedArray };

/** The particles, each given a place on the signature: left of the signature goes to the left of the head, so the ink flows rather than scatters. */
export function decodeParticles(p: Packed, sig: SigImage | null) {
  const n: number = p.meta.count;
  const position = unpackPositions(p.view<Uint16Array>(p.meta.position), p.meta.box);
  const normal = unpackNormals(p.view<Uint8Array>(p.meta.normal));
  const c8 = p.view<Uint8Array>(p.meta.color);
  const color = new Float32Array(c8.length);
  for (let i = 0; i < c8.length; i++) color[i] = c8[i] / 255;
  const aSig = new Float32Array(n * 2);
  const aDelay = new Float32Array(n);
  if (sig) {
    const { width: w, height: h, data } = sig;
    const xs: number[] = [], ys: number[] = [];
    // The map keeps how much ink a pixel has in green.
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 1] > 90) { xs.push(x); ys.push(y); }
    if (xs.length) {
      let s = 77;
      const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
      const m = 26000;
      const sx = new Float32Array(m), sy = new Float32Array(m);
      for (let i = 0; i < m; i++) {
        const k = Math.floor(rnd() * xs.length);
        sx[i] = (xs[k] + rnd()) / w;
        sy[i] = (ys[k] + rnd()) / h;
      }
      const bySig = Array.from(sx.keys()).sort((a, b) => sx[a] - sx[b]);
      const byHead = Array.from({ length: n }, (_, i) => i).sort((a, b) => position[a * 3] - position[b * 3]);
      for (let i = 0; i < n; i++) {
        const hi = byHead[i], si = bySig[Math.floor((i / n) * m)];
        aSig[hi * 2] = sx[si];
        aSig[hi * 2 + 1] = sy[si];
        aDelay[hi] = sx[si] + rnd() * 0.05;
      }
    }
  }
  return { position, normal, color, aSig, aDelay, count: n };
}

/** Every buffer inside a decoded result, so it can move to the page without being copied. */
export function buffersOf(o: any, out: Transferable[] = []): Transferable[] {
  for (const v of Object.values(o)) {
    if (ArrayBuffer.isView(v)) { if (!out.includes(v.buffer as ArrayBuffer)) out.push(v.buffer as ArrayBuffer); }
    else if (v && typeof v === "object" && !Array.isArray(v)) buffersOf(v, out);
  }
  return out;
}
