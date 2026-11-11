// Version A (round 4): copied from Version B (penamorros-story/src/gl/stage.ts) for the chat circle. Changes: a transparent canvas and no
// backdrop field, so he stands in the circle's own dark; framed for a small window by placeFigure() in tier.ts. Otherwise as B.
// One fixed canvas under the words. Long lens, low camera, lens shift to put him dead centre: a hot field behind him, a key light barely there,
// two strong rims from behind, one for each side.
import { BackSide, CubeUVReflectionMapping, DirectionalLight, DoubleSide, FrontSide, Group, HalfFloatType, HemisphereLight, LinearFilter, Matrix4, Mesh, MeshDepthMaterial, NearestFilter, NeutralToneMapping, NoColorSpace, OrthographicCamera, PCFShadowMap, PerspectiveCamera, PlaneGeometry, Quaternion, RawShaderMaterial, Scene, SRGBColorSpace, TextureLoader, Vector2, Vector3, WebGLRenderer, WebGLRenderTarget } from "three";
import { buildHead, type Head } from "./head";
import { buildBackdrop } from "./backdrop";
import { buildBody } from "./body";
import { buildArmour } from "./reveal";
import { buildGlasses } from "./glasses";
import { buildPhone, phoneU } from "./phone";
import { Rig } from "./rig";
import { yieldToMain } from "./decode";
import { type Tier, inviteMode, peekMode, placeFace, placeFigure } from "./tier";
import { vh, vw } from "../view";

// The camera looks level at this height on him (metres, the neck), so the head is seen a little from below.
const EYE_LEVEL = 0.24;
const NECK_Z = 0.004;
const v = new Vector3(), n = new Vector3();

export class Stage {
  renderer: WebGLRenderer;
  scene = new Scene();
  camera = new PerspectiveCamera(15, 1, 0.1, 12);
  figure = new Group();
  head!: Head;
  rig!: Rig;
  body!: ReturnType<typeof buildBody>;
  glasses!: ReturnType<typeof buildGlasses>;
  phone!: ReturnType<typeof buildPhone>;
  private phoneA!: { q: Quaternion; p: Vector3 };
  private phoneB!: { q: Quaternion; p: Vector3 };
  backdrop: ReturnType<typeof buildBackdrop>;
  textures: any[] = [];
  key = new DirectionalLight(0xf3f5ff, 1.15);
  fill = new HemisphereLight(0xdfe6ff, 0x0b0b0e, 0.06);
  rimL = new DirectionalLight(0xdbe5ff, 4.2);
  rimR = new DirectionalLight(0xdbe5ff, 4.2);
  /** Pixels per metre at his depth, and his place on the page. */
  k = 1000;
  cx = 0;
  cy = 0;
  dpr = 1;
  crownY = 0.44;
  /** 0: standing in the hero. 1: his face close up, for the Lumina chapter. */
  view = 0;
  private running = false;
  /** Where the phone is on the page right now, in CSS pixels. */
  phonePx = new Vector2();
  onFrame: ((t: number, dt: number) => void)[] = [];
  private last = 0;
  private slow = 0;
  private count = 0;
  private sum = 0;

  constructor(canvas: HTMLCanvasElement, public tier: Tier) {
    this.renderer = new WebGLRenderer({ canvas, alpha: true, premultipliedAlpha: true, antialias: true, powerPreference: "high-performance" });
    this.renderer.setClearColor(0x000000, 0);
    // Reading a shader's status makes the browser wait for it to finish compiling. In production nothing would act on it anyway.
    this.renderer.debug.checkShaderErrors = import.meta.env.DEV;
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = NeutralToneMapping;
    this.backdrop = buildBackdrop(tier.lite);
    this.backdrop.back.visible = false;
    this.backdrop.front.visible = false;
    // High and from the side: the lower face falls into shadow under the glasses and the nose, and the folds are drawn across the chest.
    this.key.position.set(-1.25, 1.2, 0.62);
    if (!tier.lite) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = PCFShadowMap;
      this.key.castShadow = true;
      this.key.shadow.mapSize.set(1024, 1024);
      this.key.shadow.radius = 6;
      this.key.shadow.bias = -0.0003;
      this.key.shadow.normalBias = 0.0015;
      const c = this.key.shadow.camera;
      c.left = -0.24; c.right = 0.24; c.top = 0.3; c.bottom = -0.2; c.near = 0.5; c.far = 3.5;
      c.updateProjectionMatrix();
    }
    this.rimL.position.set(-1.25, 0.45, -2.1);
    this.rimR.position.set(1.25, 0.45, -2.1);
    this.scene.add(this.key, this.fill, this.rimL, this.rimR, this.backdrop.back, this.backdrop.front);
    this.dpr = Math.min(devicePixelRatio || 1, tier.maxDpr);
    addEventListener("resize", () => this.resize());
  }

  /** Takes what the worker unpacked. Cheap: the GPU upload happens in warm(). */
  place(data: { head: any; hair: any; body: any; map: any }) {
    const lite = this.tier.lite;
    const rigData = data.body.rig;
    const armour = buildArmour(lite, rigData.rest);
    this.rig = new Rig(rigData);
    this.figure.position.set(0, -EYE_LEVEL, -NECK_Z);
    this.scene.add(this.figure);
    this.figure.add(this.rig.root);

    // His head rides on the top of the neck.
    this.head = buildHead({ head: data.head, hair: data.hair, map: data.map, armour, lite });
    let top = 0;
    const hp = data.hair.body.position as Float32Array;
    for (let i = 1; i < hp.length; i += 3) if (hp[i] > top) top = hp[i];
    this.crownY = top;
    const nh = this.rig.head("neck03");
    this.head.group.position.set(-nh[0], -nh[1], -nh[2]);
    this.rig.bone("neck03").add(this.head.group);

    this.body = buildBody(data.body, armour, this.rig, { bareHands: peekMode });
    this.figure.add(this.body.group);
    this.rig.finish();
    this.figure.updateMatrixWorld(true);
    this.head.bindRest();
    this.body.bind();

    this.glasses = buildGlasses();
    this.head.headRoot.add(this.glasses.group);

    // The phone rides on his right wrist. In the standing pose every bone's frame is the world's, so its place comes straight from the pose file.
    this.phone = buildPhone(rigData.phone.half);
    const pw = rigData.phoneWrist;
    const place = (R: number[][], p: number[]) => {
      const m = new Matrix4().set(R[0][0], R[0][1], R[0][2], p[0], R[1][0], R[1][1], R[1][2], p[1], R[2][0], R[2][1], R[2][2], p[2], 0, 0, 0, 1);
      return { q: new Quaternion().setFromRotationMatrix(m), p: new Vector3(p[0], p[1], p[2]) };
    };
    this.phoneA = place(pw.standR, pw.standP);
    this.phoneB = place(pw.textR, pw.textP);
    this.rig.bone("wrist.R").add(this.phone.group);
    this.setPhoneMix(0);

    this.textures = [data.map, armour, this.glasses.hud];
    if (!lite) {
      // Shadows are for his face: the nose and the glasses on it. On the clothes the head's shadow made hard blotches, and they have baked occlusion.
      for (const x of this.head.meshes) { x.castShadow = true; x.receiveShadow = true; }
      for (const x of this.glasses.meshes) if (x.material.isMeshStandardMaterial && !x.material.transparent) x.castShadow = true;
      // Strands draw through their own shader, which doesn't read shadows.
      const strands = this.head.meshes[this.head.meshes.length - 1];
      strands.receiveShadow = false;
      strands.castShadow = false;
    }
    this.resize();
  }

  /**
   * The room the skin and lens reflect, baked by tools/bake-env.mjs (src/gl/bakeEnv.ts holds the room). Filtering it live
   * compiles a shader that stops the page for over half a second; this is one small pass.
   */
  private async loadEnvironment() {
    const tex = await new TextureLoader().loadAsync("/head/env.png");
    tex.flipY = false;
    tex.colorSpace = NoColorSpace;
    tex.premultiplyAlpha = false;
    tex.generateMipmaps = false;
    tex.minFilter = tex.magFilter = NearestFilter;
    const { width, height } = tex.image as { width: number; height: number };
    const rt = new WebGLRenderTarget(width, height, { type: HalfFloatType, depthBuffer: false, generateMipmaps: false, minFilter: LinearFilter, magFilter: LinearFilter });
    rt.texture.mapping = CubeUVReflectionMapping;
    const mat = new RawShaderMaterial({
      uniforms: { t: { value: tex } },
      vertexShader: "attribute vec3 position; varying vec2 vUv; void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }",
      // Version A: the baked room is B's warm orange space; here it is turned to neutral, a touch cool, so he sits in A's black and white
      fragmentShader: "precision highp float; uniform sampler2D t; varying vec2 vUv; void main() { vec4 c = texture2D(t, vUv); vec3 col = c.rgb * c.a * 8.0; float l = dot(col, vec3(0.3, 0.59, 0.11)); gl_FragColor = vec4(mix(vec3(l), col, 0.12) * vec3(0.93, 0.97, 1.06), 1.0); }",
      depthTest: false,
      depthWrite: false,
    });
    const quad = new Mesh(new PlaneGeometry(2, 2), mat);
    quad.frustumCulled = false;
    const cam = new OrthographicCamera();
    this.renderer.setRenderTarget(rt);
    await this.renderer.compileAsync(quad, cam);
    this.renderer.render(quad, cam);
    this.renderer.setRenderTarget(null);
    tex.dispose();
    mat.dispose();
    quad.geometry.dispose();
    this.scene.environment = rt.texture;
    this.scene.environmentIntensity = 0.62;
  }

  /** The hand sits differently on the phone standing and texting: its place on the wrist blends with the pose. */
  setPhoneMix(m: number) {
    this.phone.group.position.lerpVectors(this.phoneA.p, this.phoneB.p, m);
    this.phone.group.quaternion.slerpQuaternions(this.phoneA.q, this.phoneB.q, m);
  }

  private all(extra: any[] = []) {
    return [...this.head.meshes, ...this.body.meshes, ...this.glasses.meshes, ...this.phone.meshes, ...extra];
  }

  /**
   * three builds its shadow shaders inside the first shadow pass, which stops the page while they link. So they get compiled here, without blocking:
   * a shared depth material, with a target set and the same side as the pass will use, so the program it finds later is this one.
   */
  private async warmShadows() {
    if (!this.renderer.shadowMap.enabled) return;
    const casters = this.all().filter((m) => m.castShadow);
    const depth = new MeshDepthMaterial();
    const target = new WebGLRenderTarget(4, 4);
    const flip = { [FrontSide]: BackSide, [BackSide]: FrontSide, [DoubleSide]: DoubleSide } as Record<number, number>;
    this.renderer.setRenderTarget(target);
    const seen = new Set<string>();
    for (const m of casters) {
      m.customDepthMaterial = depth;
      const side = flip[m.material.side];
      const kind = `${m.isSkinnedMesh}-${!!m.geometry.morphAttributes.position}-${side}`;
      if (seen.has(kind)) continue;
      seen.add(kind);
      const was = m.material;
      depth.side = side as any;
      m.material = depth;
      await this.renderer.compileAsync(m, this.key.shadow.camera, this.scene);
      m.material = was;
      await yieldToMain();
    }
    this.renderer.setRenderTarget(null);
    target.dispose();
  }

  /** Shaders and geometry onto the GPU before the first frame that needs them, one object at a time, with the page free between each. */
  async warm(extra: any[] = []) {
    // The lens needs something to reflect, on every tier.
    await this.loadEnvironment();
    await yieldToMain();
    for (const t of this.textures) {
      this.renderer.initTexture(t);
      await yieldToMain();
    }
    await this.warmShadows();
    const all = [this.backdrop.back, this.backdrop.front, ...this.all(extra)];
    // One program at a time, with the page free between each; then wait for all of them without blocking.
    for (const o of all) {
      this.renderer.compile(o, this.camera, this.scene);
      await yieldToMain();
    }
    await this.renderer.compileAsync(this.scene, this.camera);
    await yieldToMain();
    const was = all.map((o) => o.visible);
    this.renderer.setScissorTest(true);
    this.renderer.setScissor(0, 0, 1, 1);
    for (const o of all) {
      for (const x of all) x.visible = x === o;
      this.renderer.render(this.scene, this.camera);
      await yieldToMain();
    }
    this.renderer.setScissorTest(false);
    all.forEach((o, i) => { o.visible = was[i]; });
    this.renderer.setSize(vw(), vh(), false);
  }

  resize() {
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(vw(), vh(), false);
    this.layout();
  }

  /** Moves between the two framings. Only the lens changes, never the canvas, so it's cheap to call every frame. */
  setView(v: number) {
    if (Math.abs(v - this.view) < 1e-5) return;
    this.view = v;
    this.layout();
  }

  private layout() {
    const W = vw(), H = vh();
    const a = placeFigure();
    const f = placeFace();
    // The world origin's height on the page: below the crown by the distance between them.
    const cyA = a.crown + (this.crownY - EYE_LEVEL) * a.k;
    const v = this.view;
    // Zoom in proportion, so the push-in keeps one pace from start to finish.
    const k = a.k * Math.pow(f.k / a.k, v);
    const cx = a.cx + (f.cx - a.cx) * v;
    const cy = cyA + (f.cy - cyA) * v;
    this.k = k;
    this.cx = cx;
    this.cy = cy;
    const cam = this.camera;
    cam.aspect = W / H;
    cam.filmGauge = 35;
    cam.setFocalLength(85); // has to be set again after every change of aspect
    const tan = Math.tan((cam.fov * Math.PI) / 360);
    const dist = (H / 2 / tan) / k;
    cam.position.set(0, 0, dist);
    cam.near = Math.max(dist - 1.2, 0.05);
    cam.far = dist + 6;
    // A lens shift, not a camera move: he stays seen straight on wherever he stands on the page.
    cam.setViewOffset(W, H, W / 2 - cx, H / 2 - cy, W, H);
    cam.updateProjectionMatrix();
    const u = this.backdrop.uniforms;
    u.uAspect.value = W / H;
    // His chest's top, in the units the field is drawn in (the height runs from -1 to 1).
    const hotY = 0.2 - EYE_LEVEL;
    u.uCentre.value.set(((cx - W / 2) / (H / 2)), -((cy - hotY * k) - H / 2) / (H / 2));
    u.uPx.value.set(48 * this.dpr, 48 * this.dpr);
  }

  start() {
    this.setRunning(true);
  }

  /** Off while the sections cover him: no frames drawn for nobody. */
  setRunning(on: boolean) {
    if (on === this.running) return;
    this.running = on;
    this.last = performance.now();
    this.renderer.setAnimationLoop(on ? (now) => this.frame(now) : null);
  }

  /** Tells every material where the screen is, and the page where the phone is. */
  private trackPhone() {
    const g = this.phone.group;
    g.updateWorldMatrix(true, false);
    const e = g.matrixWorld.elements;
    v.set(e[12], e[13], e[14]);
    n.set(e[8], e[9], e[10]).normalize();
    // In view space. The camera never moves, so this inverse is always good.
    this.camera.updateMatrixWorld();
    phoneU.uPhoneV.value.copy(v).applyMatrix4(this.camera.matrixWorldInverse);
    phoneU.uPhoneN.value.copy(n).transformDirection(this.camera.matrixWorldInverse);
    v.project(this.camera);
    this.phonePx.set((v.x * 0.5 + 0.5) * vw(), (0.5 - v.y * 0.5) * vh());
  }

  private frame(now: number) {
    const dt = Math.min((now - this.last) / 1000, 0.05);
    const real = now - this.last;
    this.last = now;
    const t = now / 1000;
    this.backdrop.uniforms.uTime.value = t;
    for (const f of this.onFrame) f(t, dt);
    this.trackPhone();
    this.renderer.render(this.scene, this.camera);
    // Slow machine: lower the resolution rather than the frame rate. A browser capped at 30 fps doesn't count as slow.
    this.sum += real;
    if (++this.count >= 40) {
      const avg = this.sum / this.count;
      this.count = 0;
      this.sum = 0;
      if (avg > 23 && avg < 30 || avg > 36) this.slow++; else this.slow = 0;
      if (this.slow >= 2 && this.dpr > 1) {
        this.dpr = Math.max(1, this.dpr - 0.25);
        this.slow = 0;
        this.resize();
      }
    }
  }

  /** GPU time per frame. readPixels makes the CPU wait for the GPU to finish. For tests. */
  measure(n = 60) {
    const gl = this.renderer.getContext();
    const px = new Uint8Array(4);
    const t0 = performance.now();
    for (let i = 0; i < n; i++) {
      this.renderer.render(this.scene, this.camera);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    }
    return (performance.now() - t0) / n;
  }
}
