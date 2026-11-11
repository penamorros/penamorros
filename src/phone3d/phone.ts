// Lumina Labs' demo on a real phone (round 4, the client asked for 3D "like the energy drink website"). A flagship phone held sideways, measured
// from a 146.6 × 70.6 × 8.25 mm handset: brushed titanium band, black front glass that only shows the room's reflections, the promo playing on
// the screen (16:9 inside a 2.17:1 display, so thin black side bars, as a real phone shows it), a frosted back with the camera island.
// Studio softboxes for the reflections that sweep across the glass as it turns, one key, one cool rim, neutral tone mapping once, 50 mm lens.
// It turns a little with the scroll and leans towards the pointer; it draws only while on screen and while something moves or the video plays.
import {
	AmbientLight, BufferGeometry, TextureLoader, SphereGeometry, BackSide, DoubleSide, CanvasTexture, Color, DirectionalLight, Group, LinearFilter, Mesh, MeshBasicMaterial, MeshPhysicalMaterial,
	MeshStandardMaterial, NeutralToneMapping, PerspectiveCamera, PlaneGeometry, PMREMGenerator, Scene, Shape, ShapeGeometry, SRGBColorSpace,
	VideoTexture, WebGLRenderer, CylinderGeometry, TorusGeometry, BoxGeometry, NoColorSpace, ClampToEdgeWrapping, AdditiveBlending,
} from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

export type PhoneApi = { setScroll(p: number): void; setVisible(on: boolean): void; resize(): void; dispose(): void }

// metres; the phone is held sideways, so its long side runs along x
const L = 0.1466, W = 0.0706, D = 0.00825
const R_OUT = 0.011, BEZEL = 0.0016, R_SCREEN = 0.0095

function roundedRect(w: number, h: number, r: number) {
	const s = new Shape()
	const x = -w / 2, y = -h / 2
	s.moveTo(x + r, y)
	s.lineTo(x + w - r, y)
	s.quadraticCurveTo(x + w, y, x + w, y + r)
	s.lineTo(x + w, y + h - r)
	s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
	s.lineTo(x + r, y + h)
	s.quadraticCurveTo(x, y + h, x, y + h - r)
	s.lineTo(x, y + r)
	s.quadraticCurveTo(x, y, x + r, y)
	return s
}

/** UVs over a shape's bounding box, so a texture covers the rounded screen edge to edge. */
function boxUV(g: BufferGeometry, w: number, h: number) {
	const p = g.attributes.position, uv = g.attributes.uv
	for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5)
	uv.needsUpdate = true
	return g
}

/** A faint, seeded smudge map for the glass and the band: real things are handled. */
function smudges(seed: number) {
	const c = document.createElement('canvas')
	c.width = c.height = 256
	const x = c.getContext('2d')!
	x.fillStyle = 'rgb(0,30,0)' // roughness lives in G
	x.fillRect(0, 0, 256, 256)
	let s = seed
	const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
	for (let i = 0; i < 26; i++) {
		const g = x.createRadialGradient(rnd() * 256, rnd() * 256, 0, rnd() * 256, rnd() * 256, 20 + rnd() * 50)
		g.addColorStop(0, `rgba(0,${70 + rnd() * 50},0,${0.25 + rnd() * 0.25})`)
		g.addColorStop(1, 'rgba(0,30,0,0)')
		x.fillStyle = g
		x.fillRect(0, 0, 256, 256)
	}
	const t = new CanvasTexture(c)
	t.colorSpace = NoColorSpace
	return t
}

export async function createPhone(canvas: HTMLCanvasElement, video: HTMLVideoElement, light: () => boolean): Promise<PhoneApi | null> {
	let renderer: WebGLRenderer
	try {
		renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' })
	} catch {
		return null
	}
	const gl = renderer.getContext()
	const info = gl.getExtension('WEBGL_debug_renderer_info')
	if (info && /swiftshader|llvmpipe|software|basic render/i.test(String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)))) { renderer.dispose(); return null }
	const coarse = window.matchMedia('(pointer: coarse)').matches
	renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2))
	renderer.setClearColor(0x000000, 0)
	renderer.outputColorSpace = SRGBColorSpace
	renderer.toneMapping = NeutralToneMapping
	renderer.toneMappingExposure = 1.0

	const scene = new Scene()
	// a small studio for the reflections: a dark room with three soft panels (top, and one each side), at brightnesses a camera would
	// see, so metal and glass get shaped highlights rather than glare. three's RoomEnvironment lights are so bright that 7 % of them clipped.
	const pmrem = new PMREMGenerator(renderer)
	const studio = new Scene()
	studio.add(new Mesh(new SphereGeometry(5, 32, 16), new MeshBasicMaterial({ color: new Color(0.11, 0.11, 0.12), side: BackSide })))
	const panel = (w: number, h: number, b: number, x: number, y: number, z: number) => {
		const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: new Color(b, b, b * 1.02), side: DoubleSide }))
		m.position.set(x, y, z)
		m.lookAt(0, 0, 0)
		studio.add(m)
	}
	panel(3.2, 1.0, 4.2, 0, 3.4, 1.2) // the big top light
	panel(0.7, 2.6, 2.8, -3.2, 0.4, 1.6) // a strip on the left
	panel(0.7, 2.6, 2.2, 3.2, 0.2, -0.4) // and one behind on the right, for the rim
	scene.environment = pmrem.fromScene(studio, 0.03).texture
	scene.environmentIntensity = 1
	pmrem.dispose()

	const camera = new PerspectiveCamera(30, 1, 0.05, 3)
	camera.filmGauge = 35

	// key from above left at 5600 K, a cool rim behind right, a whisper of fill
	const key = new DirectionalLight(new Color(1.0, 0.859, 0.778), 1.4)
	key.position.set(-0.4, 0.6, 0.5)
	const rim = new DirectionalLight(new Color(0.78, 0.86, 1.0), 1.6)
	rim.position.set(0.5, 0.2, -0.6)
	scene.add(key, rim, new AmbientLight(0xffffff, 0.04))

	const phone = new Group()
	const tilt = new Group()
	tilt.add(phone)
	scene.add(tilt)

	// the titanium band: the whole body, edges rounded like the real thing
	// natural titanium: a mid grey metal, satin brushed (linear base colour ~0.27)
	const bandMat = new MeshStandardMaterial({ color: new Color(0.5, 0.49, 0.47), metalness: 1, roughness: 0.34, roughnessMap: smudges(7) })
	const body = new Mesh(new RoundedBoxGeometry(L, W, D, 6, R_OUT * 0.5), bandMat)
	phone.add(body)

	// front glass: black, polished; the screen sits under it
	const faceShape = roundedRect(L - 0.0004, W - 0.0004, R_OUT)
	const glassBlack = new Mesh(new ShapeGeometry(faceShape, 16), new MeshStandardMaterial({ color: 0x050506, roughness: 0.06, metalness: 0 }))
	glassBlack.position.z = D / 2 + 0.00005
	phone.add(glassBlack)

	// the screen: the video, shown as light (not lit, not tone mapped), fitted inside the display with thin side bars
	const sw = L - BEZEL * 2, sh = W - BEZEL * 2
	const tex = new VideoTexture(video)
	tex.colorSpace = SRGBColorSpace
	tex.minFilter = tex.magFilter = LinearFilter
	const screenGeo = boxUV(new ShapeGeometry(roundedRect(sw, sh, R_SCREEN), 16), sw, sh)
	const vAspect = 16 / 9, sAspect = sw / sh
	tex.repeat.set(sAspect / vAspect, 1)
	tex.offset.set(-(sAspect / vAspect - 1) / 2, 0)
	tex.wrapS = tex.wrapT = ClampToEdgeWrapping
	// the poster until the video plays, then the video
	const poster = await new TextureLoader().loadAsync('/lumina-poster.jpg').catch(() => null)
	if (poster) { poster.colorSpace = SRGBColorSpace; poster.repeat.copy(tex.repeat); poster.offset.copy(tex.offset); poster.wrapS = poster.wrapT = ClampToEdgeWrapping }
	const screenMat = new MeshBasicMaterial({ map: video.readyState >= 2 && !video.paused ? tex : poster ?? tex, toneMapped: false })
	const onPlaying = () => { screenMat.map = tex; screenMat.needsUpdate = true }
	video.addEventListener('playing', onPlaying)
	screenMat.onBeforeCompile = (sh2) => {
		// black where the 16:9 picture doesn't reach, as a phone pillarboxes it
		sh2.fragmentShader = sh2.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
			{ vec2 q = vMapUv; if (q.x < 0.0 || q.x > 1.0) diffuseColor.rgb = vec3(0.0); }`)
	}
	const screen = new Mesh(screenGeo, screenMat)
	screen.position.z = D / 2 + 0.0001
	phone.add(screen)
	// the glass over it: only its reflection is added on top of the picture
	// a glass reflection, kept faint: the room's softboxes are very bright, and at full strength they washed the screen out
	const coat = new Mesh(new ShapeGeometry(faceShape, 16), new MeshStandardMaterial({ color: 0x000000, roughness: 0.1, metalness: 0, envMapIntensity: 0.32, roughnessMap: smudges(19), transparent: true, depthWrite: false }))
	;(coat.material as MeshStandardMaterial).blending = AdditiveBlending // black adds nothing; the reflections add light
	coat.position.z = D / 2 + 0.00016
	phone.add(coat)
	// the camera hole in the dynamic island, at the left end when held sideways
	const island = new Mesh(new RoundedBoxGeometry(0.0069, 0.0215, 0.0002, 2, 0.0034), new MeshStandardMaterial({ color: 0x010101, roughness: 0.2 }))
	island.position.set(-sw / 2 + 0.0062, 0, D / 2 + 0.00013)
	phone.add(island)

	// the back: frosted glass and the camera plateau with three lenses
	const back = new Mesh(new ShapeGeometry(faceShape, 16), new MeshStandardMaterial({ color: new Color(0.11, 0.11, 0.12), roughness: 0.45, metalness: 0 }))
	back.position.z = -D / 2 - 0.00005
	back.rotation.y = Math.PI
	phone.add(back)
	const plateau = new Mesh(new RoundedBoxGeometry(0.035, 0.035, 0.0014, 3, 0.007), new MeshStandardMaterial({ color: new Color(0.12, 0.12, 0.13), roughness: 0.3 }))
	plateau.position.set(-L / 2 + 0.022, W / 2 - 0.022, -D / 2 - 0.0007)
	phone.add(plateau)
	const lensMat = new MeshPhysicalMaterial({ color: 0x050508, roughness: 0.05, clearcoat: 1, iridescence: 0.6, iridescenceIOR: 1.6 })
	const ringMat = new MeshStandardMaterial({ color: new Color(0.42, 0.41, 0.39), metalness: 1, roughness: 0.25 })
	for (const [lx, ly] of [[-0.008, 0.008], [-0.008, -0.008], [0.008, 0]]) {
		const lens = new Mesh(new CylinderGeometry(0.0055, 0.0055, 0.0016, 32), lensMat)
		lens.rotation.x = Math.PI / 2
		lens.position.set(plateau.position.x + lx, plateau.position.y + ly, -D / 2 - 0.0018)
		const ring = new Mesh(new TorusGeometry(0.0057, 0.0006, 8, 40), ringMat)
		ring.position.copy(lens.position).setZ(-D / 2 - 0.0026)
		phone.add(lens, ring)
	}
	// side buttons, on the long edge facing up when held sideways
	const btnMat = bandMat
	for (const [bx, bl] of [[-0.03, 0.018], [-0.006, 0.01]]) {
		const b = new Mesh(new BoxGeometry(bl, 0.0012, 0.0034), btnMat)
		b.position.set(bx, W / 2 + 0.0005, 0)
		phone.add(b)
	}

	// a soft shadow below: it floats over the card, so the eye needs to know where
	const sc = document.createElement('canvas')
	sc.width = sc.height = 128
	const sx = sc.getContext('2d')!
	const grad = sx.createRadialGradient(64, 64, 0, 64, 64, 64)
	grad.addColorStop(0, 'rgba(0,0,0,0.55)')
	grad.addColorStop(1, 'rgba(0,0,0,0)')
	sx.fillStyle = grad
	sx.fillRect(0, 0, 128, 128)
	const shadow = new Mesh(new PlaneGeometry(L * 1.25, W * 0.42), new MeshBasicMaterial({ map: new CanvasTexture(sc), transparent: true, depthWrite: false, toneMapped: false }))
	shadow.rotation.x = -Math.PI / 2
	shadow.position.y = -W / 2 - 0.016
	scene.add(shadow)

	// ---- motion
	const aim = { x: 0, y: 0 }, now = { x: 0, y: 0, s: 0 }
	let scrollP = 0.5, visible = false, raf = 0, t0 = performance.now()
	const onPointer = (e: PointerEvent) => {
		const r = canvas.getBoundingClientRect()
		aim.x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (window.innerWidth * 0.5)))
		aim.y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (window.innerHeight * 0.5)))
		wake()
	}
	if (!coarse) window.addEventListener('pointermove', onPointer, { passive: true })

	const frame = () => {
		raf = 0
		const t = (performance.now() - t0) / 1000
		const k = 0.08
		now.x += (aim.x - now.x) * k
		now.y += (aim.y - now.y) * k
		now.s += (scrollP - now.s) * 0.1
		// as the block comes up it turns towards you and settles flat in the middle of the screen, then turns on as it leaves
		const turn = (now.s - 0.5) * 2
		// at rest it is turned a little away and seen slightly from above, so its titanium band and top edge always show
		tilt.rotation.set(0.24 + turn * 0.16 + now.y * 0.12, -0.36 - 0.42 * turn + now.x * 0.3, 0.05 - turn * 0.05)
		// a slow float, millimetres
		phone.position.y = Math.sin(t * 0.9) * 0.0012
		shadow.material.opacity = 0.85 - Math.sin(t * 0.9) * 0.1
		renderer.render(scene, camera)
		// the screen plays a video, so it draws every frame while on screen, and not at all off it
		if (visible) raf = requestAnimationFrame(frame)
	}
	const wake = () => { if (!raf && visible) raf = requestAnimationFrame(frame) }

	const resize = () => {
		const cw = canvas.clientWidth, ch = canvas.clientHeight
		if (!cw || !ch) return
		renderer.setSize(cw, ch, false)
		camera.aspect = cw / ch
		camera.setFocalLength(50)
		// far enough back that the phone, turned, keeps a margin all round
		const fitW = (L * 1.18) / 2 / Math.tan((camera.getEffectiveFOV() * Math.PI) / 360) / camera.aspect
		const fitH = (W * 2.0) / 2 / Math.tan((camera.getEffectiveFOV() * Math.PI) / 360)
		camera.position.set(0, 0.006, Math.max(fitW, fitH))
		camera.lookAt(0, -0.004, 0)
		camera.updateProjectionMatrix()
		wake()
	}
	resize()
	const themeLight = light()
	if (themeLight) { scene.environmentIntensity = 1.1; shadow.material.opacity = 0.4 }

	return {
		setScroll(p) { scrollP = p; wake() },
		setVisible(on) { visible = on; if (on) { t0 = performance.now() - 1000; wake() } },
		resize,
		dispose() {
			cancelAnimationFrame(raf)
			window.removeEventListener('pointermove', onPointer)
			video.removeEventListener('playing', onPlaying)
			tex.dispose()
			renderer.dispose()
		},
	}
}

