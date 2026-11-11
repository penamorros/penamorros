// The Resume's map as a real globe (round 4, the client asked for "distinctive elements ... like the energy drink website": the dotted map
// from Version B became this). Land dots sampled evenly over the sphere from the land mask Version B's map was drawn from (public/land-mask.png,
// NASA imagery), his four cities, the route between them lifted off the surface, drawn leg by leg as the resume steps,
// with a spark on the newest leg, and the globe turning to bring each entry's city to the middle. Draws only while something moves.
import {
	AdditiveBlending, BufferAttribute, BufferGeometry, Color, Group, Line, LineBasicMaterial, Mesh, PerspectiveCamera, Points, Scene,
	ShaderMaterial, SphereGeometry, Vector3, WebGLRenderer, MeshBasicMaterial,
} from 'three'

export type City = { key: string; lat: number; lon: number }
export type GlobeApi = {
	setActive(i: number, animate: boolean): void
	resize(): void
	setVisible(on: boolean): void
	/** The light theme: dark ink, no glow. */
	setLight(on: boolean): void
	/** Screen positions of the cities, for the HTML labels; null when a city faces away. */
	onLabels(fn: (pos: Record<string, { x: number; y: number; front: number } | null>) => void): void
	pick(x: number, y: number): string | null
	dispose(): void
}

const rad = (d: number) => (d * Math.PI) / 180
const toVec = (lat: number, lon: number, r = 1) => new Vector3(Math.cos(rad(lat)) * Math.sin(rad(lon)) * r, Math.sin(rad(lat)) * r, Math.cos(rad(lat)) * Math.cos(rad(lon)) * r)

async function landDots(count: number) {
	const img = new Image()
	img.src = '/land-mask.png'
	await img.decode()
	const W = img.naturalWidth, H = img.naturalHeight
	const c = document.createElement('canvas')
	c.width = W
	c.height = H
	const ctx = c.getContext('2d', { willReadFrequently: true })!
	ctx.drawImage(img, 0, 0)
	const px = ctx.getImageData(0, 0, W, H).data
	const at = (lat: number, lon: number) => px[((Math.floor(((90 - lat) / 180) * (H - 1)) * W + Math.floor(((lon + 180) / 360) * (W - 1))) * 4)]
	const landIsWhite = at(40, -100) > 127 // Kansas is land
	const out: number[] = []
	// a Fibonacci sphere: every dot the same distance from its neighbours, no rows bunching at the poles
	const golden = Math.PI * (3 - Math.sqrt(5))
	for (let i = 0; i < count; i++) {
		const y = 1 - (i / (count - 1)) * 2
		const r = Math.sqrt(1 - y * y)
		const th = golden * i
		const x = Math.cos(th) * r, z = Math.sin(th) * r
		const lat = (Math.asin(y) * 180) / Math.PI
		const lon = (Math.atan2(x, z) * 180) / Math.PI
		const v = at(lat, lon)
		if ((v > 127) === landIsWhite) out.push(x, y, z)
	}
	return new Float32Array(out)
}

export async function createGlobe(canvas: HTMLCanvasElement, cities: City[], route: string[]): Promise<GlobeApi | null> {
	let renderer: WebGLRenderer
	try {
		renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' })
	} catch {
		return null
	}
	const gl = renderer.getContext()
	const info = gl.getExtension('WEBGL_debug_renderer_info')
	if (info && /swiftshader|llvmpipe|software|basic render/i.test(String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)))) { renderer.dispose(); return null }
	renderer.setClearColor(0x000000, 0)
	const dpr = Math.min(window.devicePixelRatio || 1, 2)
	renderer.setPixelRatio(dpr)

	const ink = { value: new Color(0xffffff) }
	const scene = new Scene()
	const camera = new PerspectiveCamera(30, 1, 0.1, 20)
	camera.position.set(0, 0, 3.6)
	const globe = new Group()
	scene.add(globe)

	// the body: only writes depth, so the dots on the far side are hidden and the card shows through
	const body = new Mesh(new SphereGeometry(0.995, 64, 48), new MeshBasicMaterial({ colorWrite: false }))
	body.renderOrder = 0
	globe.add(body)

	// land dots, fading towards the edge of the disc
	const dots = new BufferGeometry()
	dots.setAttribute('position', new BufferAttribute(await landDots(26000), 3))
	const dotMat = new ShaderMaterial({
		uniforms: { uSize: { value: 2.1 * dpr }, uInk: ink },
		transparent: true,
		depthWrite: false,
		vertexShader: `uniform float uSize; varying float vA;
			void main() {
				vec4 mv = modelViewMatrix * vec4(position, 1.0);
				vec3 n = normalize(mat3(modelViewMatrix) * position);
				vA = smoothstep(-0.02, 0.4, n.z);
				gl_PointSize = uSize * (0.6 + 0.4 * vA);
				gl_Position = projectionMatrix * mv;
			}`,
		fragmentShader: `uniform vec3 uInk; varying float vA;
			void main() { float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(uInk, (0.18 + 0.32 * vA) * smoothstep(0.5, 0.2, d)); }`,
	})
	const dotPoints = new Points(dots, dotMat)
	dotPoints.renderOrder = 1
	globe.add(dotPoints)

	// a faint rim of light round the disc
	const rim = new Mesh(new SphereGeometry(1.06, 64, 48), new ShaderMaterial({
		uniforms: { uInk: ink },
		transparent: true,
		depthWrite: false,
		blending: AdditiveBlending,
		vertexShader: `varying float vF; void main() { vec3 n = normalize(normalMatrix * normal); vF = pow(1.0 - abs(n.z), 2.2); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
		fragmentShader: `uniform vec3 uInk; varying float vF; void main() { float a = vF * 0.32; gl_FragColor = vec4(uInk * a, a); }`,
	}))
	scene.add(rim)

	// the route: one arc per leg between consecutive entries in different cities
	const pos: Record<string, Vector3> = {}
	for (const c of cities) pos[c.key] = toVec(c.lat, c.lon, 1.002)
	const SEG = 64
	type Leg = { from: number; line: Line; ghost: Line; pts: Vector3[] }
	const legs: Leg[] = []
	for (let i = 0; i < route.length - 1; i++) {
		const a = pos[route[i]], b = pos[route[i + 1]]
		if (!a || !b || route[i] === route[i + 1]) continue
		const angle = a.angleTo(b)
		const lift = 0.04 + angle * 0.32
		const pts: Vector3[] = []
		const an = a.clone().normalize(), bn = b.clone().normalize()
		for (let k = 0; k <= SEG; k++) {
			const t = k / SEG
			// along the great circle, lifted in the middle like a flight
			const s = Math.sin(angle)
			const p = an.clone().multiplyScalar(Math.sin((1 - t) * angle) / s).add(bn.clone().multiplyScalar(Math.sin(t * angle) / s))
			pts.push(p.normalize().multiplyScalar(1.002 + lift * Math.sin(Math.PI * t)))
		}
		const geo = new BufferGeometry().setFromPoints(pts)
		const ghost = new Line(geo, new LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, depthWrite: false }))
		const line = new Line(geo.clone(), new LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthWrite: false }))
		line.geometry.setDrawRange(0, 0)
		ghost.renderOrder = line.renderOrder = 2
		globe.add(ghost, line)
		legs.push({ from: i, line, ghost, pts })
	}

	// city markers and the spark: soft round points, the current city with a ring that keeps pulsing
	const markGeo = new BufferGeometry()
	const markPos = new Float32Array(cities.length * 3)
	const markState = new Float32Array(cities.length) // 0 not yet, 1 been, 2 here
	cities.forEach((c, i) => { const v = pos[c.key]; markPos.set([v.x, v.y, v.z], i * 3) })
	markGeo.setAttribute('position', new BufferAttribute(markPos, 3))
	markGeo.setAttribute('aState', new BufferAttribute(markState, 1))
	const markMat = new ShaderMaterial({
		uniforms: { uT: { value: 0 }, uDpr: { value: dpr }, uInk: ink },
		transparent: true,
		depthWrite: false,
		vertexShader: `attribute float aState; uniform float uDpr; varying float vS; varying float vF;
			void main() {
				vec4 mv = modelViewMatrix * vec4(position, 1.0);
				vF = smoothstep(-0.05, 0.25, normalize(mat3(modelViewMatrix) * position).z);
				vS = aState;
				gl_PointSize = (aState > 1.5 ? 34.0 : 13.0) * uDpr;
				gl_Position = projectionMatrix * mv;
			}`,
		fragmentShader: `uniform float uT; uniform vec3 uInk; varying float vS; varying float vF;
			void main() {
				vec2 p = gl_PointCoord - 0.5; float d = length(p) * 2.0;
				float core = vS > 1.5 ? smoothstep(0.24, 0.16, d) : smoothstep(0.62, 0.42, d) * (vS > 0.5 ? 1.0 : 0.0) + (smoothstep(0.72, 0.6, d) - smoothstep(0.52, 0.4, d)) * (vS > 0.5 ? 0.0 : 0.8);
				float ring = 0.0;
				if (vS > 1.5) { float r = fract(uT * 0.42); ring = (smoothstep(r - 0.06, r, d) - smoothstep(r, r + 0.06, d)) * (1.0 - r); ring += (smoothstep(0.34, 0.3, d) - smoothstep(0.28, 0.24, d)) * 0.5; }
				float a = max(core, ring) * vF;
				if (a < 0.01) discard;
				gl_FragColor = vec4(uInk, a);
			}`,
	})
	const marks = new Points(markGeo, markMat)
	marks.renderOrder = 3
	globe.add(marks)

	const sparkGeo = new BufferGeometry()
	sparkGeo.setAttribute('position', new BufferAttribute(new Float32Array(3), 3))
	const spark = new Points(sparkGeo, new ShaderMaterial({
		uniforms: { uDpr: { value: dpr }, uA: { value: 0 } },
		transparent: true,
		depthWrite: false,
		blending: AdditiveBlending,
		vertexShader: `uniform float uDpr; void main() { gl_PointSize = 22.0 * uDpr; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
		fragmentShader: `uniform float uA; void main() { float d = length(gl_PointCoord - 0.5) * 2.0; float a = exp(-d * d * 9.0) * uA; gl_FragColor = vec4(vec3(1.0, 0.97, 0.92) * a, a); }`,
	}))
	spark.renderOrder = 4
	globe.add(spark)

	// ---- turning: the current city to the middle, a little below it so the arcs above show
	const view = { lat: 0, lon: 0 }
	const want = { lat: 0, lon: 0 }
	// the view centres a little north of the current city, so it sits just below the middle with the land above it in view
const OFFSET_LAT = 7
	let active = -1
	let drawFrom = -1, drawT = 1, drawStart = 0
	const legOf = (i: number) => legs.find((l) => l.from === i - 1)

	const setActive = (i: number, animate: boolean) => {
		if (i === active) return
		const prev = active
		active = i
		const c = cities.find((x) => x.key === route[i])!
		want.lat = c.lat + OFFSET_LAT
		// the shorter way round
		let lon = c.lon
		while (lon - view.lon > 180) lon -= 360
		while (lon - view.lon < -180) lon += 360
		want.lon = lon
		if (!animate || prev < 0) { view.lat = want.lat; view.lon = want.lon }
		// city states: been to, here, not yet
		const been = new Set(route.slice(0, i + 1))
		cities.forEach((x, k) => { markState[k] = x.key === route[i] ? 2 : been.has(x.key) ? 1 : 0 })
		markGeo.attributes.aState.needsUpdate = true
		// legs up to here drawn; the newest one draws itself if we moved forward by one
		for (const l of legs) l.line.geometry.setDrawRange(0, l.from < i ? SEG + 1 : 0)
		const leg = legOf(i)
		if (animate && leg && prev === i - 1) { drawFrom = leg.from; drawT = 0; drawStart = performance.now(); leg.line.geometry.setDrawRange(0, 0) }
		else drawT = 1
		wake()
	}

	// ---- labels and picking
	let labelFn: Parameters<GlobeApi['onLabels']>[0] | null = null
	const tmp = new Vector3()
	const project = () => {
		const W = canvas.clientWidth, H = canvas.clientHeight
		const out: Record<string, { x: number; y: number; front: number } | null> = {}
		for (const c of cities) {
			tmp.copy(pos[c.key]).applyMatrix4(globe.matrixWorld)
			const front = tmp.clone().sub(camera.position).normalize().dot(tmp.clone().normalize()) * -1
			if (front < 0.12) { out[c.key] = null; continue }
			tmp.project(camera)
			out[c.key] = { x: (tmp.x * 0.5 + 0.5) * W, y: (0.5 - tmp.y * 0.5) * H, front }
		}
		return out
	}

	// ---- drawing: only while something moves (turning, a leg drawing, the spark) or the current city pulses on screen
	let raf = 0, visible = true, lastLabels = ''
	const t0 = performance.now()
	const frame = () => {
		raf = 0
		const now = performance.now()
		const k = 0.085
		view.lat += (want.lat - view.lat) * k
		view.lon += (want.lon - view.lon) * k
		globe.rotation.set(rad(view.lat), -rad(view.lon), 0, 'XYZ')
		markMat.uniforms.uT.value = (now - t0) / 1000
		let moving = Math.abs(want.lat - view.lat) + Math.abs(want.lon - view.lon) > 0.02
		;(spark.material as ShaderMaterial).uniforms.uA.value = 0
		if (drawT < 1) {
			drawT = Math.min(1, (now - drawStart) / 1100)
			const e = drawT * drawT * (3 - 2 * drawT)
			const leg = legs.find((l) => l.from === drawFrom)
			if (leg) {
				leg.line.geometry.setDrawRange(0, Math.max(2, Math.round(e * SEG) + 1))
				const p = leg.pts[Math.round(e * SEG)]
				;(sparkGeo.attributes.position as BufferAttribute).setXYZ(0, p.x, p.y, p.z)
				sparkGeo.attributes.position.needsUpdate = true
				;(spark.material as ShaderMaterial).uniforms.uA.value = Math.sin(Math.PI * e)
			}
			moving = true
		}
		globe.updateMatrixWorld()
		renderer.render(scene, camera)
		if (labelFn) {
			const l = project()
			const key = JSON.stringify(l, (_, v) => (typeof v === 'number' ? Math.round(v) : v))
			if (key !== lastLabels) { lastLabels = key; labelFn(l) }
		}
		// the current city's ring keeps pulsing while the globe is on screen
		if (visible) raf = requestAnimationFrame(frame)
		else if (moving) raf = requestAnimationFrame(frame)
	}
	const wake = () => { if (!raf) raf = requestAnimationFrame(frame) }

	const resize = () => {
		const W = canvas.clientWidth, H = canvas.clientHeight
		if (!W || !H) return
		renderer.setSize(W, H, false)
		camera.aspect = W / H
		// a wide frame shows more globe, never a cut-off one
		// far enough back that the globe's round edges show at the sides: it reads as a planet, not a flat map
		camera.position.z = W / H < 1 ? 3.6 / Math.max(0.72, W / H) : 3.6
		camera.updateProjectionMatrix()
		lastLabels = ''
		wake()
	}
	resize()

	return {
		setActive,
		resize,
		setVisible(on) { visible = on; if (on) wake() },
		setLight(on) {
			ink.value.set(on ? 0x111111 : 0xffffff)
			for (const l of legs) { (l.line.material as LineBasicMaterial).color.set(on ? 0x111111 : 0xffffff); (l.ghost.material as LineBasicMaterial).color.set(on ? 0x111111 : 0xffffff) }
			rim.visible = !on
			wake()
		},
		onLabels(fn) { labelFn = fn; lastLabels = ''; wake() },
		pick(x, y) {
			const l = project()
			let best: string | null = null, bd = 22
			for (const k in l) { const p = l[k]; if (!p) continue; const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = k } }
			return best
		},
		dispose() { cancelAnimationFrame(raf); renderer.dispose() },
	}
}
