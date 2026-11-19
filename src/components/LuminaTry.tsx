// "Try Lumina live" (the client, 2026-11-19, after Ali's proposal): turn the camera on and Lumina sketches your face in real time.
// The page blurs away behind a glowing circle; inside it, Google's MediaPipe Face Landmarker finds 478 points on the face every frame
// and they are drawn as a fine ink sketch in the site's blue: the outline, brows, eyes, nose and lips in ink, the mesh as faint hatching,
// with scan brackets and a couple of live readings. Everything runs in the browser: no frame ever leaves the device.
// The tracker (~1 MB of code + a 14 MB engine + a 3.7 MB model) loads only when someone presses the button.
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type State = 'idle' | 'loading' | 'live' | 'denied' | 'error'
type Pt = { x: number; y: number; z: number }
type Conn = { start: number; end: number }
type Landmarker = { detectForVideo: (v: HTMLVideoElement, t: number) => { faceLandmarks: Pt[][] }; close: () => void }

const VERSION = '1.2.3' // keep in step with @mediapipe/tasks-vision in package.json
const local = () => (window as unknown as { __MP_LOCAL?: string }).__MP_LOCAL
const WASM = () => (local() ? [local()!] : [`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}/wasm`, `https://unpkg.com/@mediapipe/tasks-vision@${VERSION}/wasm`])
const MODEL = () => (local() ? `${local()}/face_landmarker.task` : 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task')

export default function LuminaTry() {
	const [open, setOpen] = useState(false)
	const [state, setState] = useState<State>('idle')
		const canvasRef = useRef<HTMLCanvasElement>(null)
	const videoRef = useRef<HTMLVideoElement>(null)
	const stop = useRef<() => void>(() => {})

	const close = useCallback(() => {
		stop.current()
		setOpen(false)
		setState('idle')
	}, [])

	useEffect(() => {
		if (!open) return
		const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
		window.addEventListener('keydown', onKey)
		document.documentElement.classList.add('lt-open')
		return () => { window.removeEventListener('keydown', onKey); document.documentElement.classList.remove('lt-open') }
	}, [open, close])

	useEffect(() => () => stop.current(), [])

	const start = async () => {
		setState('loading')
		let stream: MediaStream | null = null
		let raf = 0
		let alive = true
		let landmarker: Landmarker | null = null
		stop.current = () => {
			alive = false
			cancelAnimationFrame(raf)
			stream?.getTracks().forEach((t) => t.stop())
			landmarker?.close()
			stop.current = () => {}
		}
		try {
			stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 720 } }, audio: false })
		} catch (e) {
			if (alive) setState((e as DOMException)?.name === 'NotAllowedError' ? 'denied' : 'error')
			return
		}
		try {
			const vision = await import('@mediapipe/tasks-vision')
			// the engine from jsDelivr, or unpkg if that one fails
			const tryCdn = async (base: string, delegate: 'GPU' | 'CPU') => vision.FaceLandmarker.createFromOptions(await vision.FilesetResolver.forVisionTasks(base), {
				baseOptions: { modelAssetPath: MODEL(), delegate },
				runningMode: 'VIDEO',
				numFaces: 1,
			})
			let made: unknown = null
			for (const base of WASM()) {
				made = await tryCdn(base, 'GPU').catch(() => tryCdn(base, 'CPU')).catch(() => null)
				if (made) break
			}
			if (!made) throw new Error('scanner failed to load')
			landmarker = made as Landmarker
			if (!alive) { landmarker.close(); return }
			const F = vision.FaceLandmarker
			const video = videoRef.current!
			video.srcObject = stream
			await video.play()
			setState('live')
			const ink: Conn[][] = [F.FACE_LANDMARKS_FACE_OVAL, F.FACE_LANDMARKS_LEFT_EYEBROW, F.FACE_LANDMARKS_RIGHT_EYEBROW, F.FACE_LANDMARKS_LEFT_EYE, F.FACE_LANDMARKS_RIGHT_EYE, F.FACE_LANDMARKS_LIPS, F.FACE_LANDMARKS_LEFT_IRIS, F.FACE_LANDMARKS_RIGHT_IRIS]
			const mesh: Conn[] = F.FACE_LANDMARKS_TESSELATION
			const NOSE: Conn[] = [[168, 6], [6, 197], [197, 195], [195, 5], [5, 4], [4, 1], [1, 19], [19, 94], [98, 97], [97, 2], [2, 326], [326, 327], [129, 98], [358, 327]].map(([start, end]) => ({ start, end }))
			draw(video, landmarker!, ink, mesh, NOSE, () => alive, (r) => { raf = r })
		} catch (e) {
			console.error(e)
			if (alive) setState('error')
			stop.current()
		}
	}

	// one frame: the face, smoothed, mirrored like a mirror, drawn in ink into the circle
	const draw = (video: HTMLVideoElement, lm: Landmarker, ink: Conn[][], mesh: Conn[], nose: Conn[], alive: () => boolean, setRaf: (r: number) => void) => {
		const canvas = canvasRef.current!
		const ctx = canvas.getContext('2d')!
		let smooth: Pt[] | null = null
		let lastT = -1
		let view: { k: number; cx: number; cy: number } | null = null
		// the mesh's triangles, from its edges: three points that are all joined to each other
		const adj = new Map<number, Set<number>>()
		for (const c of mesh) { (adj.get(c.start) ?? adj.set(c.start, new Set()).get(c.start)!).add(c.end); (adj.get(c.end) ?? adj.set(c.end, new Set()).get(c.end)!).add(c.start) }
		const tris: [number, number, number][] = []
		adj.forEach((na, a) => na.forEach((b) => { if (b <= a) return; adj.get(b)!.forEach((c) => { if (c > b && na.has(c)) tris.push([a, b, c]) }) }))
		const frame = (now: number) => {
			if (!alive()) return
			setRaf(requestAnimationFrame(frame))
			const dpr = Math.min(2, devicePixelRatio || 1)
			const S = canvas.clientWidth
			if (canvas.width !== Math.round(S * dpr)) { canvas.width = canvas.height = Math.round(S * dpr) }
			if (video.readyState < 2 || video.currentTime === lastT) return
			lastT = video.currentTime
			const res = lm.detectForVideo(video, now)
			const face = res.faceLandmarks?.[0]
			const W = canvas.width
			ctx.setTransform(1, 0, 0, 1, 0, 0)
			ctx.clearRect(0, 0, W, W)
			if (!face) { smooth = null; view = null; return }
			// smoothing: the points glide instead of shivering
			if (!smooth) smooth = face.map((p) => ({ ...p }))
			else for (let i = 0; i < face.length; i++) { const a = smooth[i], b = face[i]; a.x += (b.x - a.x) * 0.55; a.y += (b.y - a.y) * 0.55; a.z += (b.z - a.z) * 0.55 }
			// frame the face: the circle follows it and zooms so the face fills it, gliding (a portrait lens, not a security camera)
			const vw = video.videoWidth, vh = video.videoHeight
			let nx0 = 1, nx1 = 0, ny0 = 1, ny1 = 0
			for (const p of smooth) { if (p.x < nx0) nx0 = p.x; if (p.x > nx1) nx1 = p.x; if (p.y < ny0) ny0 = p.y; if (p.y > ny1) ny1 = p.y }
			const fw = (nx1 - nx0) * vw, fh = (ny1 - ny0) * vh
			const want = { k: (W * 0.78) / Math.max(fh, fw * 1.1, 1), cx: ((nx0 + nx1) / 2) * vw, cy: ((ny0 + ny1) / 2) * vh - fh * 0.04 }
			if (!view) view = want
			else { view.k += (want.k - view.k) * 0.08; view.cx += (want.cx - view.cx) * 0.12; view.cy += (want.cy - view.cy) * 0.12 }
			const k = view.k, ox = W / 2 - view.cx * k, oy = W / 2 - view.cy * k
			const X = (p: Pt) => W - (ox + p.x * vw * k)
			const Y = (p: Pt) => oy + p.y * vh * k
			const line = (cs: Conn[]) => { for (const c of cs) { const a = smooth![c.start], b = smooth![c.end]; ctx.moveTo(X(a), Y(a)); ctx.lineTo(X(b), Y(b)) } }
			const light = !!document.documentElement.querySelector('.app.color-mode')
			// a 3D mask: every triangle of the mesh lit by a light from the upper left, the farthest drawn first
			const P3 = smooth.map((p) => [X(p), Y(p), -p.z * vw * k] as [number, number, number])
			const order = tris.map((t, i) => [P3[t[0]][2] + P3[t[1]][2] + P3[t[2]][2], i]).sort((m, n) => m[0] - n[0])
			const Lx = -0.45, Ly = -0.55, Lz = 0.7
			for (const [, i] of order) {
				const [a0, a1, a2] = tris[i], A = P3[a0], B = P3[a1], C = P3[a2]
				const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2]
				let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx
				const nl = Math.hypot(nx, ny, nz) || 1
				nx /= nl; ny /= nl; nz /= nl
				if (nz < 0) { nx = -nx; ny = -ny; nz = -nz }
				const lam = Math.max(0, nx * Lx + ny * Ly + nz * Lz)
				const spec = Math.pow(lam, 18)
				ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(C[0], C[1]); ctx.closePath()
				if (light) {
					const v = Math.round(255 - (1 - lam) * 120)
					ctx.fillStyle = `rgba(${v - 70}, ${v - 50}, ${v}, ${0.5 + lam * 0.35})`
				} else {
					const r = Math.round(30 + lam * 120 + spec * 100), g = Math.round(50 + lam * 140 + spec * 90), bl = Math.round(120 + lam * 135)
					ctx.fillStyle = `rgba(${Math.min(255, r)}, ${Math.min(255, g)}, ${Math.min(255, bl)}, ${0.42 + lam * 0.4})`
				}
				ctx.fill()
			}
			// the facets' edges, faint, so it reads as a sculpted mask
			ctx.beginPath(); line(mesh)
			ctx.strokeStyle = light ? 'rgba(11, 18, 32, .16)' : 'rgba(190, 215, 255, .22)'; ctx.lineWidth = 0.6 * dpr; ctx.stroke()
			// the features in ink, with the blue glow
			const top = light ? '#0b1220' : '#f6f8ff', low = light ? '#33457a' : '#9fb4ff'
			let y0 = 1e9, y1 = -1e9
			for (const p of P3) { if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1] }
			const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0.3, top); g.addColorStop(1, low)
			ctx.beginPath(); ink.forEach(line); line(nose)
			ctx.strokeStyle = g; ctx.lineWidth = 1.5 * dpr; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
			ctx.shadowColor = light ? 'transparent' : 'rgba(120, 170, 255, .9)'; ctx.shadowBlur = 12 * dpr
			ctx.stroke(); ctx.shadowBlur = 0
		}
		setRaf(requestAnimationFrame(frame))
	}

	const overlay = open && createPortal(
		<div className="lt-overlay" onClick={close} role="dialog" aria-modal="true" aria-label="Try Lumina's live face scan">
			<div className="lt-stage" onClick={(e) => e.stopPropagation()}>
				<button type="button" className="lt-close" onClick={close} aria-label="Close">×</button>
				<div className={`lt-circle is-${state}`}>
					<video ref={videoRef} className="lt-video" muted playsInline />
					<canvas ref={canvasRef} className="lt-canvas" />
					{state !== 'live' && (
						<div className="lt-msg">
							{state === 'idle' && <>
								<p className="lt-title">See yourself the way Lumina does</p>
								<p className="lt-sub">Your face, mapped into a 3D mask in real time. It all runs on your device: nothing is recorded or uploaded.</p>
								<button type="button" className="lt-go" onClick={start}>Turn on camera</button>
							</>}
							{state === 'loading' && <p className="lt-sub">Waking up the scanner…</p>}
							{state === 'denied' && <><p className="lt-title">Camera blocked</p><p className="lt-sub">Allow the camera for this site in your browser, then try again.</p><button type="button" className="lt-go" onClick={start}>Try again</button></>}
							{state === 'error' && <><p className="lt-title">Couldn’t start the scan</p><p className="lt-sub">Your browser or device may not support it. The demo video above shows the real app.</p></>}
						</div>
					)}
				</div>
			</div>
		</div>,
		document.body,
	)

	return (
		<>
			<button type="button" className="lt-try" onClick={() => setOpen(true)}>
				<i className="lt-dot" aria-hidden="true" />Try the face scan live
			</button>
			{overlay}
		</>
	)
}
