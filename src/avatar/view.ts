// The window's size, read again only after a resize. Reading innerWidth or innerHeight makes the browser finish any pending layout first, so
// reading them inside a frame or a scroll handler costs a layout every time (measured: 566 forced layouts in 8 s of a phone load).
let w = innerWidth, h = innerHeight, dirty = false;
addEventListener("resize", () => { dirty = true; });
const sync = () => { if (dirty) { dirty = false; w = innerWidth; h = innerHeight; } };
export const vw = () => (sync(), w);
export const vh = () => (sync(), h);

/**
 * A box for pointer maths that doesn't follow the element as it tilts: measured when the pointer comes in and again only after a scroll.
 * Reading the box of something that leans towards the pointer feeds the lean back into the next move: the trophy jittered that way.
 */
export function steadyBox(el: HTMLElement) {
  let r: DOMRect | null = null;
  el.addEventListener("pointerenter", () => { r = null; });
  addEventListener("scroll", () => { r = null; }, { passive: true });
  return () => (r ||= el.getBoundingClientRect());
}
