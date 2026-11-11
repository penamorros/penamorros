// The head: skin, eyes, corneas on GNM's skeleton, with a blink. Hair rides on the head joint.
import { BufferAttribute, BufferGeometry, Bone, Color, CustomBlending, DoubleSide, Group, Mesh, MeshStandardMaterial, OneFactor, ShaderMaterial, Skeleton, SkinnedMesh, SRGBColorSpace, Texture, Vector3, ZeroFactor } from "three";
import type { MeshData } from "./data";
import { MAP_GLSL, PHONE_GLSL, phoneU, spot, SPOT_GLSL } from "./reveal";

// Shared dissolve: the solid head appears through fine noise as the particles settle.
export const DISSOLVE = `
  uniform float uReveal;
  varying vec3 vDis;
  float disHash(vec3 p){ return fract(sin(dot(floor(p * 900.0), vec3(12.9898, 78.233, 37.719))) * 43758.5453); }`;
export const DISSOLVE_FRAG = `if (uReveal < 0.999 && disHash(vDis) > uReveal) discard;`;

export const shared = {
  uReveal: { value: 0 },
  uRimColor: { value: new Color(0xdbe5ff) },
  uThin: { value: 0.7 },
  uFres: { value: 0.9 },
  uCatch: { value: 1 },
  uStrip: { value: 0 }, // how much of the glasses' light falls on his face
};

function skinGeometry(d: MeshData): BufferGeometry {
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(d.position, 3));
  g.setAttribute("normal", new BufferAttribute(d.normal, 3));
  g.setAttribute("uv", new BufferAttribute(d.uv, 2));
  g.setAttribute("skinWeight", new BufferAttribute(d.skinWeight, 4));
  g.setAttribute("skinIndex", new BufferAttribute(d.skinIndex, 4));
  g.setAttribute("ao", new BufferAttribute(d.ao, 1));
  g.setAttribute("thick", new BufferAttribute(d.thick, 1));
  if (d.color) g.setAttribute("color", new BufferAttribute(d.color, 3));
  g.setIndex(new BufferAttribute(d.index, 1));
  if (d.blink) {
    g.morphAttributes.position = [new BufferAttribute(d.blink, 3), new BufferAttribute(d.mouth, 3)];
    g.morphTargetsRelative = true;
  }
  return g;
}

function skinMaterial(map: Texture, armour: Texture | null): MeshStandardMaterial {
  const m = new MeshStandardMaterial({ map, roughness: 0.46, metalness: 0 });
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, shared, spot, phoneU, { uArmour: { value: armour } });
    s.vertexShader = s.vertexShader
      .replace("#include <common>", `#include <common>
        attribute float ao; attribute float thick;
        varying float vAO; varying float vThick; varying float vY; varying vec3 vDis; varying vec3 vRestN;`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>
        vAO = ao; vThick = thick; vY = position.y; vDis = position; vRestN = normal;`);
    s.fragmentShader = s.fragmentShader
      .replace("#include <common>", `#include <common>
        ${DISSOLVE}
        ${SPOT_GLSL}
        ${MAP_GLSL}
        ${PHONE_GLSL}
        uniform float uThin, uFres, uStrip; uniform vec3 uRimColor; uniform sampler2D uArmour;
        varying float vAO; varying float vThick; varying float vY; varying vec3 vRestN;`)
      .replace("#include <map_fragment>", `#include <map_fragment>
        // Below this the fitted head flares into shoulders of its own, wider than the collar. The jacket is there instead.
        if (vY < 0.16) discard;
        ${DISSOLVE_FRAG}
        diffuseColor.rgb *= mix(1.0, smoothstep(0.0, 0.75, vAO), 0.9);
        // The chin's and the collar's shadow on the neck.
        diffuseColor.rgb *= mix(0.08, 1.0, smoothstep(0.17, 0.215, vY));`)
      .replace("#include <aomap_fragment>", `#include <aomap_fragment>
        {
          // The rims have no shadow map, and the room's floor would reflect in the underside of the jaw at a grazing angle: both draw a bright line there.
          // Where the baked occlusion, or the height, says nothing can reach, nothing arrives.
          float occ = smoothstep(0.1, 0.55, vAO) * smoothstep(0.18, 0.235, vY);
          reflectedLight.directDiffuse *= occ;
          reflectedLight.directSpecular *= occ;
          reflectedLight.indirectSpecular *= occ * smoothstep(-0.5, -0.05, normalize(vRestN).y);
        }`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
        // Light through thin parts (ears, nostril wings) and round the edges, but not under the hair, and less under the chin.
        float open = smoothstep(0.18, 0.62, vAO);
        float thin = exp(-vThick / 0.012) * open;
        // Never on what faces down: a lit line under the jaw reads as a seam.
        float fres = pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), 3.4) * open * smoothstep(-0.3, 0.12, normal.y);
        totalEmissiveRadiance += uRimColor * diffuseColor.rgb * (thin * uThin + fres * uFres);
        // The glasses' strip lights the brow, the cheeks and the bridge of the nose from close up: three short sources along it.
        {
          vec3 n = normalize(vRestN);
          float got = 0.0;
          for (int i = -1; i <= 1; i++) {
            vec3 L = vec3(float(i) * 0.042, 0.318, 0.142 - abs(float(i)) * 0.014) - vDis;
            float d2 = dot(L, L);
            got += max(dot(n, normalize(L)), 0.0) / (1.0 + d2 / 0.0011);
          }
          totalEmissiveRadiance += vec3(0.82, 0.88, 1.0) * diffuseColor.rgb * got * uStrip * 2.0;
        }
        // The phone's screen, from below: chin, lips, the underside of his nose.
        totalEmissiveRadiance += phoneLight(normal, -vViewPosition) * diffuseColor.rgb * 3.4;`);
  };
  return m;
}

function eyeMaterial(): MeshStandardMaterial {
  const m = new MeshStandardMaterial({ vertexColors: true, roughness: 0.35 });
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, shared);
    s.vertexShader = s.vertexShader.replace("#include <common>", `#include <common>
      varying vec3 vDis;`).replace("#include <begin_vertex>", `#include <begin_vertex>
      vDis = position;`);
    s.fragmentShader = s.fragmentShader.replace("#include <common>", `#include <common>
      ${DISSOLVE}`).replace("#include <map_fragment>", `#include <map_fragment>
      ${DISSOLVE_FRAG}`);
  };
  return m;
}

// The cornea only adds light: a small catchlight is what makes an eye in shadow read as looking at you.
function corneaMaterial(): MeshStandardMaterial {
  const m = new MeshStandardMaterial({ color: 0x000000, roughness: 0.08, transparent: true, depthWrite: false, blending: CustomBlending, blendSrc: OneFactor, blendDst: OneFactor, blendSrcAlpha: ZeroFactor, blendDstAlpha: OneFactor });
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, shared);
    s.vertexShader = s.vertexShader.replace("#include <common>", `#include <common>
      varying vec3 vDis;`).replace("#include <begin_vertex>", `#include <begin_vertex>
      vDis = position;`);
    s.fragmentShader = s.fragmentShader.replace("#include <common>", `#include <common>
      ${DISSOLVE}
      uniform float uCatch;`).replace("#include <map_fragment>", `#include <map_fragment>
      ${DISSOLVE_FRAG}`).replace("#include <opaque_fragment>", `
      {
        vec3 V = normalize(vViewPosition);
        vec3 H = normalize(normalize(vec3(-0.18, 0.5, 1.0)) + V);
        float c = pow(max(dot(normal, H), 0.0), 700.0) * 2.4;
        float halo = pow(max(dot(normal, H), 0.0), 60.0) * 0.022;
        outgoingLight += vec3(0.92, 0.95, 1.0) * (c + halo) * uCatch;
      }
      #include <opaque_fragment>`);
  };
  return m;
}

function hairMaterials(): { body: MeshStandardMaterial; strand: ShaderMaterial; strandU: any } {
  const body = new MeshStandardMaterial({ vertexColors: true, roughness: 1, side: DoubleSide });
  body.color.setScalar(0.07);
  body.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, shared);
    s.vertexShader = s.vertexShader.replace("#include <common>", `#include <common>
      varying vec3 vDis;`).replace("#include <begin_vertex>", `#include <begin_vertex>
      vDis = position;`);
    s.fragmentShader = s.fragmentShader.replace("#include <common>", `#include <common>
      ${DISSOLVE}`).replace("#include <map_fragment>", `#include <map_fragment>
      ${DISSOLVE_FRAG}`);
  };
  const strandU = {
    uReveal: shared.uReveal,
    uWidth: { value: 1.05 },
    uAmbient: { value: 0.09 },
    uDiff: { value: 0.8 },
    uSpec: { value: 0.42 },
    uShine: { value: 34 },
    uL0: { value: new Vector3(-1.25, 0.45, -2.1) },
    uL1: { value: new Vector3(1.25, 0.45, -2.1) },
    uC0: { value: new Color(0xd6e1ff) },
    uC1: { value: new Color(0xd6e1ff) },
    uCentre: { value: new Vector3(0, 0.3, 0.015) },
    uKey: { value: new Vector3(-1.25, 1.2, 0.62) },
    uSheen: { value: 0.03 },
  };
  const strand = new ShaderMaterial({
    uniforms: strandU,
    side: DoubleSide,
    vertexShader: `
      attribute vec3 tangent; attribute vec3 color; attribute float along; attribute float width; attribute float side;
      uniform float uWidth; uniform vec3 uCentre;
      varying vec3 vT; varying vec3 vN; varying vec3 vP; varying vec3 vColor; varying vec3 vDis;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vec3 T = normalize(mat3(modelViewMatrix) * tangent);
        vec3 V = normalize(-mv.xyz);
        vec3 S = normalize(cross(T, V));
        float taper = 0.12 + 0.88 * smoothstep(0.0, 0.1, along) * smoothstep(1.0, 0.7, along);
        mv.xyz += S * side * width * uWidth * taper;
        // The hair's outward direction, from the centre of the head: cheap, and enough for a rim.
        vT = T; vN = normalize(mat3(modelViewMatrix) * (position - uCentre)); vP = mv.xyz; vColor = color; vDis = position;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      ${DISSOLVE}
      uniform float uAmbient, uDiff, uSpec, uShine, uSheen; uniform vec3 uL0, uL1, uC0, uC1, uKey;
      varying vec3 vT; varying vec3 vN; varying vec3 vP; varying vec3 vColor;
      vec3 shade(vec3 L, vec3 C, vec3 T, vec3 N, vec3 V, float rim) {
        float tl = dot(T, L);
        vec3 H = normalize(L + V);
        float th = dot(T, H);
        float side = smoothstep(-0.25, 0.45, dot(N, L));
        return C * rim * side * (vColor * sqrt(max(0.0, 1.0 - tl * tl)) * uDiff + pow(sqrt(max(0.0, 1.0 - th * th)), uShine) * uSpec);
      }
      void main() {
        ${DISSOLVE_FRAG}
        vec3 T = normalize(vT), V = normalize(-vP), N = normalize(vN);
        float rim = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 4.0);
        vec3 col = vColor * uAmbient + shade(normalize(uL0), uC0, T, N, V, rim) + shade(normalize(uL1), uC1, T, N, V, rim);
        // The key light's long highlight along the strands, only where the hair faces it.
        vec3 KL = normalize(uKey);
        vec3 KH = normalize(KL + V);
        float kt = dot(T, KH);
        col += vec3(0.9, 0.93, 1.0) * pow(sqrt(max(0.0, 1.0 - kt * kt)), 48.0) * smoothstep(-0.1, 0.5, dot(N, KL)) * uSheen;
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  return { body, strand, strandU };
}

function strandGeometry(d: Record<string, any>): BufferGeometry {
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(d.position, 3));
  g.setAttribute("tangent", new BufferAttribute(d.tangent, 3));
  g.setAttribute("color", new BufferAttribute(d.color, 3));
  g.setAttribute("along", new BufferAttribute(d.along, 1));
  g.setAttribute("width", new BufferAttribute(d.width, 1));
  g.setAttribute("side", new BufferAttribute(d.side, 1));
  g.setIndex(new BufferAttribute(d.index, 1));
  return g;
}

/** Drops every triangle wholly below a height. */
function dropBelow(g: BufferGeometry, y: number) {
  const pos = g.getAttribute("position");
  const idx = g.getIndex()!;
  const keep: number[] = [];
  for (let i = 0; i < idx.count; i += 3) {
    const a = idx.getX(i), b = idx.getX(i + 1), c = idx.getX(i + 2);
    if (Math.max(pos.getY(a), pos.getY(b), pos.getY(c)) >= y) keep.push(a, b, c);
  }
  g.setIndex(keep);
}

export type Head = {
  group: Group;
  joints: number[][];
  centre: Vector3;
  setPose(yaw: number, pitch: number, eyeYaw: number, eyePitch: number): void;
  setBlink(v: number): void;
  /** Mouth open, 0 to 1, for speech. */
  setMouth(v: number): void;
  /** Rides on the head joint, in the head's rest coordinates. For anything that turns with the head. */
  headRoot: Group;
  /** Binds the skin to the skeleton where it stands now. Call once the group is in its final place, in the rest pose. */
  bindRest(): void;
  strandU: any;
  meshes: (Mesh | SkinnedMesh)[];
};

export function buildHead(data: { head: any; hair: any; map: Texture; lite: boolean; armour: Texture }): Head {
  const { head, hair, map, lite, armour } = data;
  map.colorSpace = SRGBColorSpace;
  map.flipY = false;
  map.anisotropy = lite ? 2 : 4;
  const J: number[][] = head.joints;
  const parents: number[] = head.parents;
  const bones = J.map(() => new Bone());
  J.forEach((p, i) => {
    const par = parents[i];
    const pp = par >= 0 ? J[par] : [0, 0, 0];
    bones[i].position.set(p[0] - pp[0], p[1] - pp[1], p[2] - pp[2]);
    if (par >= 0) bones[par].add(bones[i]);
  });
  const skeleton = new Skeleton(bones);
  const group = new Group();
  group.add(bones[0]);

  const skinMat = skinMaterial(map, armour);
  const skinGeo = skinGeometry(head.skin);
  // The fitted head flares into shoulders of its own. They are under the collar and would only throw a shadow on his chest.
  dropBelow(skinGeo, 0.155);
  const skin = new SkinnedMesh(skinGeo, skinMat);
  const eyes = new SkinnedMesh(skinGeometry(head.eyes), eyeMaterial());
  const cornea = new SkinnedMesh(skinGeometry(head.cornea), corneaMaterial());
  const skinned = [skin, eyes, cornea];
  for (const m of skinned) { m.frustumCulled = false; group.add(m); }
  skin.morphTargetInfluences = [0, 0];
  skin.renderOrder = 1;
  cornea.renderOrder = 2;

  const { body, strand, strandU } = hairMaterials();
  const hairRoot = new Group();
  hairRoot.position.set(-J[1][0], -J[1][1], -J[1][2]);
  bones[1].add(hairRoot);
  const bg = new BufferGeometry();
  bg.setAttribute("position", new BufferAttribute(hair.body.position, 3));
  bg.setAttribute("normal", new BufferAttribute(hair.body.normal, 3));
  bg.setAttribute("color", new BufferAttribute(hair.body.color, 3));
  bg.setIndex(new BufferAttribute(hair.body.index, 1));
  const bodyMesh = new Mesh(bg, body);
  bodyMesh.frustumCulled = false;
  hairRoot.add(bodyMesh);
  const strandMesh = new Mesh(strandGeometry(hair.strands), strand);
  strandMesh.frustumCulled = false;
  hairRoot.add(strandMesh);

  const centre = new Vector3(...(head.centre as [number, number, number]));
  return {
    group,
    joints: J,
    centre,
    strandU,
    headRoot: hairRoot,
    meshes: [...skinned, bodyMesh, strandMesh],
    setPose(yaw, pitch, eyeYaw, eyePitch) {
      // The head joint takes most of the turn, the neck the rest, so the shoulders stay still.
      bones[0].rotation.set(pitch * 0.35, yaw * 0.35, 0);
      bones[1].rotation.set(pitch * 0.65, yaw * 0.65, 0);
      bones[2].rotation.set(eyePitch, eyeYaw, 0);
      bones[3].rotation.set(eyePitch, eyeYaw, 0);
    },
    setBlink(v) { skin.morphTargetInfluences![0] = v; shared.uCatch.value = 1 - Math.min(v * 1.6, 1); },
    setMouth(v) { skin.morphTargetInfluences![1] = v; },
    bindRest() {
      group.updateMatrixWorld(true);
      for (const m of skinned) m.bind(skeleton, m.matrixWorld.clone());
      skeleton.calculateInverses();
    },
  };
}

