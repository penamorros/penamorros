import { ImageBitmapLoader, Texture, TextureLoader } from "three";

/** Decodes off the main thread where the browser can, so the first upload doesn't stop the page. */
export async function loadTexture(url: string): Promise<Texture> {
  if (typeof createImageBitmap === "undefined") return new TextureLoader().loadAsync(url);
  try {
    const l = new ImageBitmapLoader();
    l.setOptions({ imageOrientation: "from-image", premultiplyAlpha: "none", colorSpaceConversion: "none" });
    const t = new Texture(await l.loadAsync(url));
    t.flipY = false;
    t.needsUpdate = true;
    return t;
  } catch {
    return new TextureLoader().loadAsync(url);
  }
}
