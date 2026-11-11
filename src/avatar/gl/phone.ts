// The phone in his hand: an ordinary 71 x 147 x 7.8 mm slab. From the page you mostly see its back. What counts is the light: the screen lights his face and hands,
// a soft glow leaks round its edges, and a small strip on the back pulses when a message lands.
import { AdditiveBlending, CircleGeometry, Color, CylinderGeometry, DoubleSide, ExtrudeGeometry, Group, Matrix4, Mesh, MeshStandardMaterial, PlaneGeometry, ShaderMaterial, Shape } from "three";
import { DISSOLVE, DISSOLVE_FRAG, shared } from "./head";
import { PHONE_GLSL, phoneU } from "./reveal";

export { PHONE_GLSL, phoneU };

function rounded(w: number, h: number, r: number) {
  const s = new Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

function dissolving(m: MeshStandardMaterial) {
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, shared);
    s.vertexShader = s.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vDis;").replace("#include <begin_vertex>", "#include <begin_vertex>\nvDis = position * 40.0;");
    s.fragmentShader = s.fragmentShader.replace("#include <common>", `#include <common>\n${DISSOLVE}`).replace("#include <map_fragment>", `#include <map_fragment>\n${DISSOLVE_FRAG}`);
  };
  return m;
}

export function buildPhone(half: number[]) {
  const group = new Group();
  const [hw, hh, ht] = half;
  const W = hw * 2, H = hh * 2, T = ht * 2;
  const bevel = 0.0009;
  const body = new ExtrudeGeometry(rounded(W - bevel * 2, H - bevel * 2, 0.0088), { depth: T - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 10 });
  body.translate(0, 0, -T / 2 + bevel);
  const frame = dissolving(new MeshStandardMaterial({ color: 0x6a676c, roughness: 0.26, metalness: 1 }));
  const shell = new Mesh(body, frame);
  group.add(shell);

  // The back faces away from the screen: matte dark glass, and a lens island.
  const backM = dissolving(new MeshStandardMaterial({ color: 0x1f1f23, roughness: 0.36, metalness: 0.2 }));
  const back = new Mesh(new ExtrudeGeometry(rounded(W - 0.0016, H - 0.0016, 0.0082), { depth: 0.0002, bevelEnabled: false, curveSegments: 10 }), backM);
  back.rotation.y = Math.PI;
  back.position.z = -ht - 0.00001;
  group.add(back);
  const islandM = dissolving(new MeshStandardMaterial({ color: 0x1d1d20, roughness: 0.28, metalness: 0.6 }));
  const island = new Mesh(new ExtrudeGeometry(rounded(0.03, 0.03, 0.007), { depth: 0.001, bevelEnabled: true, bevelThickness: 0.0004, bevelSize: 0.0004, bevelSegments: 2, curveSegments: 8 }), islandM);
  island.rotation.y = Math.PI;
  // Seen from the back, the lenses sit in the top corner by his thumb side.
  island.position.set(hw - 0.0185, hh - 0.0185, -ht);
  group.add(island);
  const glassM = dissolving(new MeshStandardMaterial({ color: 0x050507, roughness: 0.08, metalness: 0.3 }));
  const lensGeo = new CylinderGeometry(0.0051, 0.0055, 0.0014, 22);
  for (const [dx, dy] of [[-0.007, 0.0075], [-0.007, -0.0075], [0.0075, 0]]) {
    const l = new Mesh(lensGeo, glassM);
    l.rotation.x = Math.PI / 2;
    l.position.set(hw - 0.0185 + dx, hh - 0.0185 + dy, -ht - 0.0016);
    group.add(l);
  }

  // The lit parts draw directly.
  const litU = { ...phoneU };
  const strip = new Mesh(new PlaneGeometry(0.018, 0.0011), new ShaderMaterial({
    uniforms: litU,
    side: DoubleSide,
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `
      uniform float uPing, uPhoneOn; varying vec2 vUv;
      void main() {
        float k = 0.22 + 0.78 * uPing;
        vec3 c = mix(vec3(0.55, 0.7, 1.0), vec3(0.94, 0.96, 1.0), uPing);
        gl_FragColor = vec4(c * k, 1.0);
      }`,
  }));
  strip.rotation.y = Math.PI;
  strip.position.set(-0.012, hh - 0.012, -ht - 0.0003);
  group.add(strip);

  const screen = new Mesh(new PlaneGeometry(W - 0.002, H - 0.002), new ShaderMaterial({
    uniforms: litU,
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `
      uniform float uPhoneOn; varying vec2 vUv;
      void main() { gl_FragColor = vec4(vec3(0.95, 0.88, 0.8) * uPhoneOn + vec3(0.012), 1.0); }`,
  }));
  screen.position.z = ht + 0.00005;
  group.add(screen);

  // Light leaking round the edges when the screen is on.
  const halo = new Mesh(new PlaneGeometry(W * 2.3, H * 1.75), new ShaderMaterial({
    uniforms: litU,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    vertexShader: "varying vec2 vUv; void main() { vUv = uv * 2.0 - 1.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `
      uniform float uPhoneOn, uPing; varying vec2 vUv;
      void main() {
        float d = length(vUv);
        float a = pow(max(0.0, 1.0 - d), 2.2);
        gl_FragColor = vec4(vec3(0.84, 0.9, 1.0) * a * (uPhoneOn * 0.72 + uPing * 0.5), 1.0);
      }`,
  }));
  halo.position.z = ht + 0.0012;
  halo.renderOrder = 9;
  group.add(halo);

  void CircleGeometry; void Color; void Matrix4;
  const meshes: any[] = [];
  group.traverse((o) => { if ((o as Mesh).isMesh) { o.frustumCulled = false; meshes.push(o); } });
  return { group, meshes, shell };
}
