// The particle flight, drawn off the main thread (OffscreenCanvas): creating the WebGL context, the software-renderer
// check, the shader compile and every frame of the flight happen here, so the page mounting at the same time never
// waits for them and the flight never stutters while it does. See src/motion/intro.ts.
import { createIntroGL, type IntroGL, type Rects } from './introGL'

type Msg =
	| { type: 'init'; canvas: OffscreenCanvas; W: number; H: number; dpr: number; data: Float32Array; n: number }
	| { type: 'start'; rects: Rects; land: number; reveal: number }
	| { type: 'scroll'; y: number }
	| { type: 'stop' }

const scope = self as unknown as {
	postMessage(m: unknown): void
	onmessage: ((e: MessageEvent<Msg>) => void) | null
	requestAnimationFrame?: (cb: (t: number) => void) => number
}
let gl: IntroGL | null = null
let scroll = 0
let running = false

const nextFrame = (cb: () => void) => (scope.requestAnimationFrame ? scope.requestAnimationFrame(cb) : setTimeout(cb, 16))

scope.onmessage = async (e) => {
	const m = e.data
	if (m.type === 'init') {
		const made = await createIntroGL(m.canvas, m.W, m.H, m.dpr, m.data, m.n).catch(() => null)
		gl = made && made !== 'software' ? made : null
		scope.postMessage({ type: 'ready', ok: !!gl, why: made === 'software' ? 'software' : gl ? '' : 'nogl' })
		return
	}
	if (!gl) return
	if (m.type === 'scroll') { scroll = m.y; return }
	if (m.type === 'stop') { running = false; gl.dispose(); gl = null; return }
	if (m.type === 'start') {
		gl.setRects(m.rects)
		running = true
		const t0 = performance.now()
		const frame = () => {
			if (!running || !gl) return
			const t = (performance.now() - t0) / 1000
			const alpha = t < m.land - 0.15 ? 1 : Math.max(0, 1 - (t - (m.land - 0.15)) / (m.reveal * 0.8))
			gl.draw(t, alpha, scroll)
			if (alpha <= 0) {
				running = false
				scope.postMessage({ type: 'done' })
				return
			}
			nextFrame(frame)
		}
		gl.draw(0, 1, scroll)
		nextFrame(frame)
	}
}
