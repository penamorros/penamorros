// Bare hands: skin with creases, tendons and veins drawn per pixel, and fingernails. Not in use. The user preferred his hands not to show ("hath zada visable e na ho"), so he wears
// gloves (glove() in body.ts). To go back: use these in buildBody, and pack the hand data and nails again in face/tools/mh_parts.py.
import { Color, MeshStandardMaterial } from "three";
import { DISSOLVE, DISSOLVE_FRAG, shared } from "./head";
import { PHONE_GLSL, phoneU } from "./phone";

/**
 * Skin for his hands, with the colour of the face. The mesh gives the form; everything fine is drawn per pixel from where on the hand a point is: creases over the finger joints,
 * the tendons and veins on the back of the hand, redder knuckles and fingertips, a paler palm.
 */
export function handSkin(tone: Color) {
  const m = new MeshStandardMaterial({ color: tone, roughness: 0.46, metalness: 0, envMapIntensity: 0.45 });
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, shared, phoneU);
    s.vertexShader = s.vertexShader
      .replace("#include <common>", `#include <common>
        attribute float ao; attribute vec3 hand;
        varying float vAO; varying vec3 vDis; varying vec3 vH;`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>
        vAO = ao; vDis = position; vH = hand;`);
    s.fragmentShader = s.fragmentShader
      .replace("#include <common>", `#include <common>
        ${DISSOLVE}
        ${PHONE_GLSL}
        uniform vec3 uRimColor; uniform float uFres;
        varying float vAO; varying vec3 vH;
        float hNoise(vec3 p) { return fract(sin(dot(floor(p), vec3(127.1, 311.7, 74.7))) * 43758.5453); }
        float hSmooth(vec3 p) {
          vec3 i = floor(p), f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(hNoise(i), hNoise(i + vec3(1, 0, 0)), f.x), mix(hNoise(i + vec3(0, 1, 0)), hNoise(i + vec3(1, 1, 0)), f.x), f.y),
                     mix(mix(hNoise(i + vec3(0, 0, 1)), hNoise(i + vec3(1, 0, 1)), f.x), mix(hNoise(i + vec3(0, 1, 1)), hNoise(i + vec3(1, 1, 1)), f.x), f.y), f.z);
        }
        float tendon(float v, float s, float t) {
          float line = t * mix(0.42, 1.0, s);
          return exp(-pow((v - line) / 0.085, 2.0));
        }
        float vein(float v, float s) {
          float a = 0.18 + 0.3 * sin(s * 4.6 + 1.1);
          float b2 = -0.42 + 0.2 * sin(s * 6.2 + 3.4);
          return max(exp(-pow((v - a) / 0.05, 2.0)), 0.8 * exp(-pow((v - b2) / 0.045, 2.0)));
        }
        // Height of the skin above the mesh, in metres.
        float handHeight() {
          float u = vH.x, v = vH.y;
          float back = smoothstep(0.02, 0.5, vH.z);
          float h = 0.0;
          if (u >= 0.0) {
            // Creases over the two finger joints, and the softer ones at the knuckle.
            float x1 = u - 1.0, x2 = u - 2.0;
            float side = 1.0 - v * v * 0.6;
            h += sin(x1 * 72.0) * exp(-x1 * x1 / 0.022) * back * side * 0.00024;
            h += sin(x2 * 80.0) * exp(-x2 * x2 / 0.014) * back * side * 0.00018;
            h += sin(u * 60.0) * exp(-u * u / 0.012) * back * 0.00012;
          } else {
            float s = u + 1.0;
            float env = smoothstep(0.04, 0.4, s) * smoothstep(1.02, 0.78, s) * back;
            h += (tendon(v, s, -0.72) + tendon(v, s, -0.24) + tendon(v, s, 0.24) + tendon(v, s, 0.72)) * env * 0.00062;
            h += vein(v, s) * env * 0.00036;
          }
          // The grain of skin.
          return h;
        }`)
      .replace("#include <map_fragment>", `#include <map_fragment>
        ${DISSOLVE_FRAG}
        {
          vec3 tint = vec3(1.0);
          float u = vH.x;
          float back = smoothstep(-0.1, 0.5, vH.z);
          if (u >= 0.0) {
            float x1 = u - 1.0, x2 = u - 2.0;
            float joint = clamp(exp(-x1 * x1 / 0.03) + 0.7 * exp(-x2 * x2 / 0.025) + 0.9 * exp(-u * u / 0.02), 0.0, 1.0);
            tint *= mix(vec3(1.0), vec3(1.07, 0.84, 0.78), joint * back);
            tint *= mix(vec3(1.0), vec3(1.05, 0.86, 0.82), smoothstep(2.3, 2.95, u));
          } else {
            float s = u + 1.0;
            float env = smoothstep(0.04, 0.4, s) * smoothstep(1.02, 0.78, s) * back;
            tint *= mix(vec3(1.0), vec3(0.86, 0.86, 0.96), vein(vH.y, s) * env * 0.7);
            tint *= mix(vec3(1.0), vec3(1.06, 0.87, 0.81), smoothstep(0.78, 1.0, s) * back);
          }
          // The palm is paler, and nothing on skin is one flat colour.
          tint *= mix(vec3(1.09, 0.98, 0.93), vec3(1.0), back);
          tint *= 0.93 + 0.14 * hSmooth(vDis * 60.0) * hSmooth(vDis * 170.0 + 3.0);
          diffuseColor.rgb *= tint;
        }
        // Creases go darker and redder, as skin does.
        diffuseColor.rgb *= mix(vec3(0.42, 0.26, 0.22), vec3(1.0), smoothstep(0.12, 0.7, vAO));`)
      .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
        roughnessFactor = roughnessFactor + (hSmooth(vDis * 900.0) - 0.5) * 0.12 + (1.0 - smoothstep(-0.1, 0.5, vH.z)) * 0.08;`)
      .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
        {
          // Fine relief, fading out where a crease is smaller than a pixel: it would only shimmer.
          // The same test keeps it off the seams between bones, where these coordinates jump.
          float fine = (1.0 - smoothstep(0.05, 0.16, fwidth(vH.x))) * (1.0 - smoothstep(0.1, 0.3, fwidth(vH.y)));
          float hgt = handHeight() * fine + (hSmooth(vDis * 2600.0) - 0.5) * 0.000028;
          vec3 sx = dFdx(-vViewPosition), sy = dFdy(-vViewPosition);
          vec3 r1 = cross(sy, normal), r2 = cross(normal, sx);
          float det = dot(sx, r1);
          vec3 g = sign(det) * (dFdx(hgt) * r1 + dFdy(hgt) * r2);
          normal = normalize(abs(det) * normal - g);
        }`)
      .replace("#include <aomap_fragment>", `#include <aomap_fragment>
        {
          float occ = smoothstep(0.1, 0.6, vAO);
          reflectedLight.directDiffuse *= occ;
          reflectedLight.directSpecular *= occ;
          reflectedLight.indirectSpecular *= occ;
        }`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
        {
          // Light through the thin edges of fingers. Warmer and narrower than a plain rim.
          float nv = saturate(dot(normal, normalize(vViewPosition)));
          float fres = pow(1.0 - nv, 3.6) * smoothstep(0.2, 0.6, vAO);
          totalEmissiveRadiance += vec3(0.8, 0.86, 1.0) * diffuseColor.rgb * fres * uFres * 0.9;
          totalEmissiveRadiance += phoneLight(normal, -vViewPosition) * diffuseColor.rgb * 2.0 * smoothstep(0.1, 0.5, vAO);
        }`);
  };
  return m;
}

/** A fingernail: pale over the nail bed, a half moon at its root, a lighter free edge, and glossier than any skin. */
export function nailMaterial() {
  const m = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0, envMapIntensity: 1.3 });
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, shared, phoneU);
    s.vertexShader = s.vertexShader
      .replace("#include <common>", `#include <common>
        varying vec2 vN; varying vec3 vDis;`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>
        vN = uv * 2.0 - 1.0; vDis = position;`);
    s.fragmentShader = s.fragmentShader
      .replace("#include <common>", `#include <common>
        ${DISSOLVE}
        ${PHONE_GLSL}
        varying vec2 vN;`)
      .replace("#include <map_fragment>", `#include <map_fragment>
        ${DISSOLVE_FRAG}
        {
          vec3 c = vec3(0.56, 0.33, 0.28);
          c = mix(c, vec3(0.74, 0.56, 0.48), smoothstep(0.62, 0.34, length(vec2(vN.x * 0.9, vN.y + 1.12))));
          c = mix(c, vec3(0.86, 0.76, 0.66), smoothstep(0.66, 0.86, vN.y));
          // A soft dark line where it meets the skin.
          c *= 1.0 - 0.45 * smoothstep(0.72, 1.0, max(abs(vN.x), vN.y < 0.0 ? -vN.y : 0.0));
          diffuseColor.rgb = c;
        }`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
        totalEmissiveRadiance += phoneLight(normal, -vViewPosition) * diffuseColor.rgb * 1.6;`);
  };
  return m;
}

