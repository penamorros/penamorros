// Reads the packed head files written by face/tools/ship.py. Gzipped there and unpacked here, so it doesn't depend on the host.
import { gunzipSync } from "fflate";

type Rec = { offset: number; count: number; type: string };
export type Packed = { meta: any; view<T extends ArrayLike<number>>(rec: Rec): T };

const TYPES: Record<string, any> = { uint8: Uint8Array, uint16: Uint16Array, int16: Int16Array, uint32: Uint32Array, float32: Float32Array };

export async function loadPacked(url: string, onBytes?: (loaded: number) => void): Promise<Packed> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  let gz: Uint8Array;
  if (res.body && onBytes) {
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value!);
      total += value!.length;
      onBytes(total);
    }
    gz = new Uint8Array(total);
    let at = 0;
    for (const c of chunks) { gz.set(c, at); at += c.length; }
  } else {
    gz = new Uint8Array(await res.arrayBuffer());
  }
  // A host may already have decompressed it on the way: gzip starts 1f 8b.
  const raw = gz[0] === 0x1f && gz[1] === 0x8b ? gunzipSync(gz) : gz;
  const headerLen = new DataView(raw.buffer, raw.byteOffset, 4).getUint32(0, true);
  const meta = JSON.parse(new TextDecoder().decode(raw.subarray(4, 4 + headerLen)));
  const body = raw.slice(4 + headerLen); // a fresh buffer, so views line up
  return {
    meta,
    view<T>(rec: Rec) { return new TYPES[rec.type](body.buffer, rec.offset, rec.count) as T; },
  };
}

export function unpackPositions(q: Uint16Array, box: { lo: number[]; hi: number[] }): Float32Array {
  const out = new Float32Array(q.length);
  for (let i = 0; i < q.length; i += 3) {
    for (let c = 0; c < 3; c++) out[i + c] = box.lo[c] + (q[i + c] / 65535) * (box.hi[c] - box.lo[c]);
  }
  return out;
}

export function unpackNormals(o: Uint8Array): Float32Array {
  const n = o.length / 2;
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    let x = (o[i * 2] / 255) * 2 - 1;
    let y = (o[i * 2 + 1] / 255) * 2 - 1;
    let z = 1 - Math.abs(x) - Math.abs(y);
    if (z < 0) {
      const ox = x;
      x = (1 - Math.abs(y)) * (ox >= 0 ? 1 : -1);
      y = (1 - Math.abs(ox)) * (y >= 0 ? 1 : -1);
    }
    const l = Math.hypot(x, y, z) || 1;
    out[i * 3] = x / l; out[i * 3 + 1] = y / l; out[i * 3 + 2] = z / l;
  }
  return out;
}

/** Lets the browser breathe between heavy steps. MessageChannel, because nested setTimeout clamps to 4 ms. */
export function yieldToMain(): Promise<void> {
  return new Promise((res) => {
    const c = new MessageChannel();
    c.port1.onmessage = () => res();
    c.port2.postMessage(0);
  });
}
