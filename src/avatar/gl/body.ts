// The half body, on MakeHuman's skeleton (face/tools/mh_pose.py, mh_parts.py): fitted black shirt and trousers from a cloth simulation, a stand collar, a zip, his hands.
// Under the cursor's spotlight the fabric gives way to armour with lit seams. The armour is drawn on the rest pose, so it stays on him however his arms move.
import { BufferAttribute, BufferGeometry, Color, DoubleSide, Group, MeshStandardMaterial, SkinnedMesh, Texture } from "three";
import { spot, SPOT_GLSL } from "./reveal";
import { DISSOLVE, DISSOLVE_FRAG, shared } from "./head";
import { handSkin } from "./handSkin";
import { Rig } from "./rig";
import { PHONE_GLSL, phoneU } from "./phone";

export const bodyU = {
  uTime: { value: 0 },
  /** 0 = dark theme, 1 = light theme — softens the suit off pure black. */
  uLight: { value: 0 },
};

function fabric(armour: Texture) {
  // Two sided: at a bent wrist you can see into the sleeve, and its far wall has to be there.
  const m = new MeshStandardMaterial({ color: new Color(0x0e0f13), roughness: 0.58, metalness: 0, envMapIntensity: 0.28, side: DoubleSide });
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, shared, spot, bodyU, phoneU, { uArmour: { value: armour } });
    s.vertexShader = s.vertexShader
      .replace("#include <common>", `#include <common>
        attribute float ao; attribute vec2 rest;
        varying float vAO; varying vec3 vObj; varying vec3 vDis; varying vec2 vRest;`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>
        vAO = ao; vObj = position; vDis = position; vRest = rest;`);
    s.fragmentShader = s.fragmentShader
      .replace("#include <common>", `#include <common>
        ${DISSOLVE}
        ${SPOT_GLSL}
        ${PHONE_GLSL}
        uniform sampler2D uArmour; uniform float uTime; uniform float uLight;
        varying float vAO; varying vec3 vObj; varying vec2 vRest;
        vec4 aMap; float aSpot; float aPlate;`)
      .replace("#include <map_fragment>", `#include <map_fragment>
        ${DISSOLVE_FRAG}
        aMap = texture2D(uArmour, vRest);
        aSpot = spotMask();
        // Soft armour plates always on (Ali suit), a bit stronger under the cursor spot.
        aPlate = smoothstep(0.04, 0.22, aMap.g) * mix(0.55, 1.0, smoothstep(0.02, 0.5, aSpot));
        float weave = sin((vRest.x + vRest.y) * 1600.0) * sin((vRest.x - vRest.y) * 1600.0);
        // Light theme: charcoal-slate instead of pure black so he doesn't punch a hole in the page.
        vec3 clothDark = vec3(0.055, 0.058, 0.07);
        vec3 clothLight = vec3(0.16, 0.175, 0.205);
        diffuseColor.rgb = mix(clothDark, clothLight, uLight);
        diffuseColor.rgb = mix(diffuseColor.rgb, mix(vec3(0.03, 0.032, 0.04), vec3(0.1, 0.11, 0.13), uLight) + 0.012 * weave, aPlate);
        diffuseColor.rgb *= 1.0 - aMap.b * 0.8;
        if (!gl_FrontFacing) diffuseColor.rgb *= 0.12;`)
      .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.3, aPlate);`)
      .replace("#include <metalnessmap_fragment>", `#include <metalnessmap_fragment>
        metalnessFactor = mix(metalnessFactor, 0.85, aPlate);`)
      .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
        if (aPlate > 0.001) {
          float e = 0.0014;
          float hx = texture2D(uArmour, vRest + vec2(e, 0.0)).g - texture2D(uArmour, vRest - vec2(e, 0.0)).g;
          float hy = texture2D(uArmour, vRest + vec2(0.0, e)).g - texture2D(uArmour, vRest - vec2(0.0, e)).g;
          normal = normalize(normal + mat3(viewMatrix) * vec3(-hx, -hy, 0.0) * 3.2 * aPlate);
        }`)
      .replace("#include <aomap_fragment>", `#include <aomap_fragment>
        {
          float occ = smoothstep(0.03, 0.62, vAO);
          occ = mix(occ, 1.0, aPlate * 0.4);
          reflectedLight.directDiffuse *= occ;
          reflectedLight.directSpecular *= occ * mix(0.42 * mix(0.16, 1.0, smoothstep(0.0, 0.55, saturate(dot(normal, normalize(vViewPosition))))), 1.0, aPlate);
          reflectedLight.indirectDiffuse *= occ;
          reflectedLight.indirectSpecular *= occ * mix(1.0, 3.0, aPlate);
        }`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
        {
          // Always-on blueish circuit lines (Ali's orange seams, iced).
          float line = aMap.r;
          float run = 0.68 + 0.32 * sin(vObj.y * 46.0 + vObj.x * 22.0 - uTime * 2.2);
          vec3 lineCol = mix(vec3(0.42, 0.72, 1.0), vec3(0.28, 0.48, 0.92), uLight);
          float lineGain = mix(1.0, 0.75, uLight);
          totalEmissiveRadiance += lineCol * (line * line * 4.0 * run + line * 1.15) * lineGain;
          float nv = saturate(dot(normal, normalize(vViewPosition)));
          if (gl_FrontFacing) totalEmissiveRadiance += mix(vec3(0.05, 0.07, 0.11), vec3(0.08, 0.09, 0.12), uLight) * pow(1.0 - nv, 3.4) * smoothstep(0.03, 0.62, vAO) * (1.0 - aPlate);
          totalEmissiveRadiance += phoneLight(normal, -vViewPosition) * vec3(0.11, 0.095, 0.08) * smoothstep(0.03, 0.5, vAO);
        }`);
  };
  return m;
}

function zipMaterial() {
  const m = new MeshStandardMaterial({ color: 0x2d2c2e, roughness: 0.42, metalness: 1 });
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, shared);
    s.vertexShader = s.vertexShader
      .replace("#include <common>", `#include <common>
        attribute float tape;
        varying float vTape; varying vec3 vDis; varying float vY;`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>
        vTape = tape; vDis = position; vY = position.y;`);
    s.fragmentShader = s.fragmentShader
      .replace("#include <common>", `#include <common>
        ${DISSOLVE}
        varying float vTape; varying float vY; float zTeeth;`)
      .replace("#include <map_fragment>", `#include <map_fragment>
        ${DISSOLVE_FRAG}
        zTeeth = step(vTape, 0.36) * step(0.42, fract(vY * 330.0));
        diffuseColor.rgb = mix(vec3(0.016), diffuseColor.rgb * 1.5, zTeeth);`)
      .replace("#include <metalnessmap_fragment>", `#include <metalnessmap_fragment>
        metalnessFactor = zTeeth;`)
      .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
        roughnessFactor = mix(0.7, 0.36, zTeeth);`);
  };
  return m;
}

/** Black gloves, the same dark as the shirt: his hands melt into the outfit, and the eye goes to the phone. Only a little leather sheen, so fingers just read where the light catches them. */
function glove() {
  const m = new MeshStandardMaterial({ color: new Color(0x0d0e11), roughness: 0.46, metalness: 0, envMapIntensity: 0.3 });
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, shared, phoneU);
    s.vertexShader = s.vertexShader
      .replace("#include <common>", `#include <common>
        attribute float ao;
        varying float vAO; varying vec3 vDis;`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>
        vAO = ao; vDis = position;`);
    s.fragmentShader = s.fragmentShader
      .replace("#include <common>", `#include <common>
        ${DISSOLVE}
        ${PHONE_GLSL}
        varying float vAO;`)
      .replace("#include <map_fragment>", `#include <map_fragment>
        ${DISSOLVE_FRAG}`)
      .replace("#include <aomap_fragment>", `#include <aomap_fragment>
        {
          float occ = smoothstep(0.08, 0.6, vAO);
          reflectedLight.directDiffuse *= occ;
          reflectedLight.directSpecular *= occ * 0.55;
          reflectedLight.indirectDiffuse *= occ;
          reflectedLight.indirectSpecular *= occ;
        }`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
        totalEmissiveRadiance += phoneLight(normal, -vViewPosition) * vec3(0.1, 0.09, 0.08) * smoothstep(0.1, 0.5, vAO);`);
  };
  return m;
}

/** Peek / invite: real hand skin when crease data exists; flat tone fallback on lite meshes. */
function peekSkin(data?: any) {
  if (data?.hand && data?.ao) return handSkin(new Color(0xd4b49a));
  return new MeshStandardMaterial({
    color: new Color(0xd4b49a),
    roughness: 0.42,
    metalness: 0.02,
    envMapIntensity: 1.1,
    emissive: new Color(0x4a2e1c),
    emissiveIntensity: 0.28,
  });
}

function geometry(d: any) {
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(d.position, 3));
  g.setAttribute("normal", new BufferAttribute(d.normal, 3));
  g.setAttribute("skinIndex", new BufferAttribute(d.skinIndex, 4));
  g.setAttribute("skinWeight", new BufferAttribute(d.skinWeight, 4));
  if (d.ao) g.setAttribute("ao", new BufferAttribute(d.ao, 1));
  if (d.rest) g.setAttribute("rest", new BufferAttribute(d.rest, 2));
  if (d.tape) g.setAttribute("tape", new BufferAttribute(d.tape, 1));
  if (d.hand) g.setAttribute("hand", new BufferAttribute(d.hand, 3));
  if (d.uv) g.setAttribute("uv", new BufferAttribute(d.uv, 2));
  g.setIndex(new BufferAttribute(d.index, 1));
  return g;
}

export function buildBody(data: any, armour: Texture, rig: Rig, opts?: { bareHands?: boolean }) {
  const group = new Group();
  const cloth = fabric(armour);
  const parts = [
    new SkinnedMesh(geometry(data.shirt), cloth),
    new SkinnedMesh(geometry(data.collar), cloth),
    new SkinnedMesh(geometry(data.zip), zipMaterial()),
    new SkinnedMesh(geometry(data.hands), opts?.bareHands ? peekSkin(data.hands) : glove()),
  ];
  for (const m of parts) { m.frustumCulled = false; group.add(m); }
  return { group, meshes: parts, bind() { for (const m of parts) m.bind(rig.skeleton); } };
}
