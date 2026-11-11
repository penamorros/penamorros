// What the page can run, and where he stands. No three.js in here: a machine without a real GPU never loads it.
import { vh, vw } from "../view";
export type Tier = { lite: boolean; maxDpr: number };

export function detectTier(): Tier {
  const coarse = matchMedia("(hover: none) and (pointer: coarse)").matches;
  const narrow = innerWidth < 900;
  const cores = navigator.hardwareConcurrency || 4;
  const lite = coarse || (narrow && cores <= 6);
  return { lite, maxDpr: lite ? 1.5 : 1.75 };
}

/** Software renderers (PageSpeed, some VMs) draw every frame on the CPU: those get a still instead. */
export function hasRealGPU(): boolean {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") as WebGL2RenderingContext | null;
    if (!gl) return false;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const r = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return !/swiftshader|llvmpipe|software|basic render/i.test(r);
  } catch {
    return false;
  }
}

/** Version A: set by the avatar page, which fills a small frame instead of a page. */
export let frameOnly = false;
export const useFrame = () => { frameOnly = true; };
const params = new URLSearchParams(location.search);
const framePad = Math.max(0, Number(params.get("pad")) || 0);
/** Tiny chat-button peek: tighter crop so face + waving left hand read at ~70px. */
export const peekMode = params.has("peek");
export const inviteMode = params.has("invite");

export const isPortrait = () => vw() < 900 || vw() / vh() <= 1;

/**
 * Where he stands, in CSS pixels. Always on the page's centre line.
 * k is pixels per metre at his depth; crown is the height of the top of his hair on the page, just under the nav. From there down to the hips fills the window.
 */
export function placeFigure() {
  const W = vw(), H = vh();
    // Round 4b: the frame is the whole circle, so he is framed for a circle: headroom where it narrows at the top, head to waist, phone in view.
  if (frameOnly) {
    // ?pad=N: the frame runs N px below the circle (see AVATAR_PAD in link.tsx), so he is framed in the top W×(H-N) only
    const Hc = H - framePad;
    if (inviteMode) return { cx: W * 0.5, crown: Hc * 0.06, k: W * 1.48 };
    if (peekMode) {
      // Tight portrait: face fills the disc, looking at you.
      return { cx: W * 0.5, crown: Hc * 0.1, k: Math.min(Hc, W) * 1.55 };
    }
    return { cx: W * 0.5, crown: Hc * 0.115, k: Math.min(Hc, W) * 1.2 };
  }
  if (isPortrait()) return { cx: W * 0.5, crown: 58, k: Math.min(H * 0.8, W * 1.72) };
  // Narrower windows stand him further back, so his elbow stays clear of the words at the bottom left.
  const t = Math.min(1, Math.max(0, (W - 1000) / 400));
  return { cx: W * 0.5, crown: Math.max(52, H * 0.07), k: Math.min(H * 0.98, W * (0.56 + 0.14 * t * t * (3 - 2 * t))) };
}

/**
 * The Lumina chapter: his face close up, beside the words on wide screens, above them on tall ones. cy is where eye level lands on the page.
 */
export function placeFace() {
  const W = vw(), H = vh();
  if (isPortrait()) return { cx: W * 0.5, cy: H * 0.25, k: Math.min(H * 1.12, W * 2.3) };
  return { cx: W * 0.67, cy: H * 0.47, k: Math.min(H * 2.25, W * 1.25) };
}
