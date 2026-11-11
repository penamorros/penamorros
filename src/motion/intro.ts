// The signature intro's second half (round 3, the client's words: "keep the signature intro with the particles,
// and then it transforms into the hero page with my image"). index.html writes his signature; here its ink
// breaks into particles, on the same pixels and the same frame, that fly in the order they were written into the
// hero's circle and settle as a dotted portrait of him, which then resolves into the photo itself.
//
// The particle data is prepared here in small pieces while the signature is still being written, kept relative to
// the signature and to the circle, so the handover only measures two boxes. The drawing (WebGL, src/motion/introGL.ts)
// runs in a worker on an OffscreenCanvas where the browser can (src/motion/intro.worker.ts), so the page mounting
// meanwhile never waits for it; elsewhere it runs here. Without WebGL, on a software renderer, with reduced motion,
// or if anything fails, index.html fades the signature as before.
import { F, createIntroGL, type IntroGL, type Rects } from './introGL'

const SIG_W = 885, SIG_H = 292
const SPREAD = 0.72 // seconds between the first and the last particle leaving
const JITTER = 0.2
const FLIGHT = 1.05 // seconds in the air, plus up to 0.3 more
const LAND = SPREAD + JITTER + FLIGHT + 0.3
const REVEAL = 0.6

declare global {
	interface Window {
		__introTook?: boolean
		__bootSigned?: boolean
		__bootLeave?: (o?: { lift?: boolean }) => void
		__intro?: { state: string; count: number; t: number; worker: boolean }
	}
}

const loadImage = (src: string) =>
	new Promise<HTMLImageElement>((resolve, reject) => {
		const img = new Image()
		img.decoding = 'async'
		img.onload = () => img.decode().catch(() => {}).then(() => resolve(img))
		img.onerror = reject
		img.src = src
	})

const once = (name: string, ready: () => boolean) =>
	new Promise<void>((resolve) => {
		if (ready()) return resolve()
		window.addEventListener(name, () => resolve(), { once: true })
	})

/** Gives the page a turn between pieces of work, so none of them is a long task. */
const breathe = () => new Promise<void>((r) => setTimeout(r, 0))

/** What draws the flight: the worker, or this thread. */
type Renderer = { canvas: HTMLCanvasElement; worker: boolean; start(r: Rects, onDone: () => void): void; scroll(y: number): void; stop(): void }

const workerOk = () => typeof OffscreenCanvas !== 'undefined' && 'transferControlToOffscreen' in HTMLCanvasElement.prototype && typeof Worker !== 'undefined'

const makeCanvas = () => {
	const canvas = document.createElement('canvas')
	canvas.setAttribute('aria-hidden', 'true')
	canvas.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:10003;'
	return canvas
}

/** Resolves with a renderer, 'skip' (a software renderer: no particles anywhere), or null (try this thread). */
function inWorker(W: number, H: number, dpr: number, data: Float32Array, n: number): Promise<Renderer | 'skip' | null> {
	return new Promise((resolve) => {
		let worker: Worker
		try {
			worker = new Worker(new URL('./intro.worker.ts', import.meta.url), { type: 'module' })
		} catch {
			return resolve(null)
		}
		const canvas = makeCanvas()
		let offscreen: OffscreenCanvas
		try {
			offscreen = canvas.transferControlToOffscreen()
		} catch {
			worker.terminate()
			return resolve(null)
		}
		let onDone = () => {}
		worker.onmessage = (e) => {
			if (e.data.type === 'ready') {
				if (!e.data.ok) { worker.terminate(); return resolve(e.data.why === 'software' ? 'skip' : null) }
				resolve({
					canvas,
					worker: true,
					start(r, done) { onDone = done; worker.postMessage({ type: 'start', rects: r, land: LAND, reveal: REVEAL }) },
					scroll(y) { worker.postMessage({ type: 'scroll', y }) },
					stop() { worker.postMessage({ type: 'stop' }); setTimeout(() => worker.terminate(), 100) },
				})
			} else if (e.data.type === 'done') onDone()
		}
		worker.onerror = () => { worker.terminate(); resolve(null) }
		worker.postMessage({ type: 'init', canvas: offscreen, W, H, dpr, data, n }, [offscreen, data.buffer])
	})
}

async function onThisThread(W: number, H: number, dpr: number, data: Float32Array, n: number): Promise<Renderer | null> {
	const canvas = makeCanvas()
	const made = await createIntroGL(canvas, W, H, dpr, data, n).catch(() => null)
	if (!made || made === 'software') return null
	const gl: IntroGL = made
	let y = 0, running = false
	return {
		canvas,
		worker: false,
		start(r, done) {
			gl.setRects(r)
			running = true
			const t0 = performance.now()
			const frame = () => {
				if (!running) return
				const t = (performance.now() - t0) / 1000
				const alpha = t < LAND - 0.15 ? 1 : Math.max(0, 1 - (t - (LAND - 0.15)) / (REVEAL * 0.8))
				gl.draw(t, alpha, y)
				if (alpha <= 0) { running = false; done(); return }
				requestAnimationFrame(frame)
			}
			gl.draw(0, 1, 0)
			requestAnimationFrame(frame)
		},
		scroll(v) { y = v },
		stop() { running = false; gl.dispose() },
	}
}

export function startIntro() {
	if (!window.__bootActive || window.__bootExited) return
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
	run().catch(() => {
		// index.html leaves on its own when nobody took over
	})
}

async function run() {
	const [portrait, sigMap] = await Promise.all([
		loadImage('/portrait.webp'),
		loadImage('/signature-map.webp'),
		once('app:mounted', () => !!document.querySelector('.photo-wrap')),
	])
	if (window.__bootExited) return
	const wrap = document.querySelector<HTMLElement>('.photo-wrap')
	const photo = document.querySelector<HTMLImageElement>('.hero-photo')
	if (!wrap || !photo) return
	const W = window.innerWidth, H = window.innerHeight
	const dpr = Math.min(window.devicePixelRatio || 1, 2)

	// ---- 1. his photo, as particles: one per cell where he is (the photo has no background), kept relative to the circle
	const size = wrap.getBoundingClientRect().width || 480
	const inset = 2, inner = size - inset * 2
	const fit = Math.min(inner / portrait.naturalWidth, inner / portrait.naturalHeight)
	const pw = portrait.naturalWidth * fit, ph = portrait.naturalHeight * fit
	const px0 = inset + (inner - pw) / 2, py0 = inset + (inner - ph) / 2
	const r = size / 2 - inset - 1
	const target = Math.min(W, H) < 700 ? 3600 : 6500
	const step = Math.max(2.6, Math.sqrt((pw * ph * 0.55) / target))
	const cols = Math.max(1, Math.round(pw / step)), rows = Math.max(1, Math.round(ph / step))
	const sample = document.createElement('canvas')
	sample.width = cols
	sample.height = rows
	const sctx = sample.getContext('2d', { willReadFrequently: true })
	if (!sctx) return
	// decoded and shrunk off the main thread where the browser can (drawing the full photo here took 60 ms on a phone)
	const small = typeof createImageBitmap === 'function' ? await createImageBitmap(portrait, { resizeWidth: cols, resizeHeight: rows, resizeQuality: 'medium' }).catch(() => null) : null
	sctx.drawImage(small ?? portrait, 0, 0, cols, rows)
	small?.close()
	const pix = sctx.getImageData(0, 0, cols, rows).data
	const dst: number[] = [], col: number[] = []
	const lift = (v: number) => Math.min(1, (v / 255) * 1.15 + 0.03) // the photo is dark; lift it so the dotted portrait reads
	for (let y = 0; y < rows; y++) {
		for (let x = 0; x < cols; x++) {
			const i = (y * cols + x) * 4
			if (pix[i + 3] < 150) continue
			// off the grid by up to most of a cell, so the dotted portrait reads as grain, never as a mosaic
			const sx = px0 + ((x + 0.5 + (Math.random() - 0.5) * 0.85) / cols) * pw
			const sy = py0 + ((y + 0.5 + (Math.random() - 0.5) * 0.85) / rows) * ph
			if (Math.hypot(sx - size / 2, sy - size / 2) > r - step * 0.5) continue
			dst.push(sx / size, sy / size)
			col.push(lift(pix[i]), lift(pix[i + 1]), lift(pix[i + 2]))
		}
	}
	const n = dst.length / 2
	if (n < 200) return
	await breathe()

	// ---- 2. the ink: where each particle starts on the signature, and when that stroke was written
	const mctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
	if (!mctx) return
	mctx.canvas.width = SIG_W
	mctx.canvas.height = SIG_H
	mctx.drawImage(sigMap, 0, 0)
	const map = mctx.getImageData(0, 0, SIG_W, SIG_H).data
	const inked: number[] = []
	for (let i = 0; i < map.length; i += 4) if (map[i + 1] > 40) inked.push(i / 4)
	if (!inked.length) return
	await breathe()

	const src: { x: number; y: number; t: number }[] = []
	for (let k = 0; k < n; k++) {
		const p = inked[Math.floor((k / n) * inked.length + Math.random() * (inked.length / n))] ?? inked[inked.length - 1]
		src.push({ x: (p % SIG_W + Math.random()) / SIG_W, y: (Math.floor(p / SIG_W) + Math.random()) / SIG_H, t: map[p * 4] / 255 })
	}
	// the first strokes written leave first, and build him from the top down
	src.sort((a, b) => a.t - b.t)
	const order = Array.from({ length: n }, (_, k) => k).sort((a, b) => dst[a * 2 + 1] - dst[b * 2 + 1] || dst[a * 2] - dst[b * 2])
	const data = new Float32Array(n * F)
	for (let k = 0; k < n; k++) {
		const s = src[k], j = order[k], o = k * F, rnd = Math.random()
		data[o] = s.x; data[o + 1] = s.y
		data[o + 2] = dst[j * 2]; data[o + 3] = dst[j * 2 + 1]
		data[o + 4] = col[j * 3]; data[o + 5] = col[j * 3 + 1]; data[o + 6] = col[j * 3 + 2]
		data[o + 7] = (k / n) * SPREAD + rnd * JITTER
		data[o + 8] = FLIGHT + Math.random() * 0.3
		data[o + 9] = rnd
		data[o + 10] = (Math.random() - 0.38) * 0.55
	}
	await breathe()

	// ---- 3. who draws it: the worker where it can, this thread otherwise, nobody on a software renderer
	let found: Renderer | 'skip' | null = workerOk() ? await inWorker(W, H, dpr, data.slice(), n) : null
	if (found === null) found = await onThisThread(W, H, dpr, data, n)
	if (!found || found === 'skip') return
	const draw: Renderer = found

	// ---- 4. wait for the last stroke
	await once('boot:signed', () => !!window.__bootSigned)
	// the hero's text may still be swapping fonts; give it a moment so the circle sits where it will stay
	await Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((res) => setTimeout(res, 300))])
	const sigCanvas = document.getElementById('bootSig')
	if (!sigCanvas || window.__bootExited) { draw.stop(); return }

	// ---- 5. the handover, on one frame: the ink becomes particles, the cover clears, the hero starts
	const sig = sigCanvas.getBoundingClientRect()
	const box = wrap.getBoundingClientRect()
	const scroll0 = window.scrollY
	let finished = false
	const onScroll = () => draw.scroll(window.scrollY - scroll0)
	const finish = () => {
		if (finished) return
		finished = true
		window.removeEventListener('scroll', onScroll)
		photo.style.transition = ''
		photo.style.opacity = ''
		draw.canvas.remove()
		draw.stop()
		if (window.__intro) window.__intro.state = 'done'
	}
	document.body.appendChild(draw.canvas)
	draw.start({
		sig: [sig.left, sig.top, sig.width, sig.height],
		box: [box.left, box.top, box.width, box.width],
		sizeA: Math.max(1.6, (sig.width / SIG_W) * 1.9),
		sizeB: (step / size) * box.width * 1.7,
	}, finish)
	window.addEventListener('scroll', onScroll, { passive: true })
	window.__introTook = true
	window.__intro = { state: 'flying', count: n, t: 0, worker: draw.worker }
	photo.style.opacity = '0'
	window.__bootLeave?.({ lift: true })

	const t0 = performance.now()
	const clock = window.setInterval(() => {
		if (window.__intro) window.__intro.t = Math.round((performance.now() - t0) / 10) / 100
		if (finished) window.clearInterval(clock)
	}, 100)
	// the photo comes up under the last of the particles
	window.setTimeout(() => {
		if (finished) return
		photo.style.transition = `opacity ${REVEAL}s ease-out`
		photo.style.opacity = '1'
		if (window.__intro) window.__intro.state = 'resolving'
	}, (LAND - 0.35) * 1000)
	// a hidden tab holds animation frames (and the worker may not report back): never leave him invisible
	window.setTimeout(finish, (LAND + REVEAL + 1.5) * 1000)
}
