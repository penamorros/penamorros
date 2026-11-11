// Downloads and unpacks the figure away from the main thread: a slow phone keeps moving while this runs.
import { loadPacked } from "./decode";
import { buffersOf, decodeBody, decodeHair, decodeHead } from "./data";

const post = (msg: any, transfer: Transferable[] = []) => (self as unknown as Worker).postMessage(msg, transfer);
const progress = (name: string) => (n: number) => post({ t: "bytes", name, n });

// Version A: the chat avatar needs no intro particles, so points-a.geo is never fetched.
async function boot(strands: number, lite: boolean) {
  const job = (name: string, url: string, decode: (p: any) => any) =>
    loadPacked(url, progress(name)).then((p) => {
      const data = decode(p);
      post({ t: name, data }, buffersOf(data));
    });
  await Promise.all([
    job("head", "/head/head.geo", (p) => decodeHead(p)),
    job("hair", "/head/hair.geo", (p) => decodeHair(p, strands)),
    job("body", lite ? "/head/body-lite.geo" : "/head/body.geo", (p) => decodeBody(p)),
  ]);
  post({ t: "done" });
}

self.onmessage = async (e: MessageEvent<any>) => {
  const m = e.data;
  try {
    await boot(m.strands, m.lite);
  } catch (err) {
    post({ t: "error", message: String(err) });
  }
};
