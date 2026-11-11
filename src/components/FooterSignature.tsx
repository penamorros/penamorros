import { useEffect, useRef } from 'react'

// The footer's signature in particles (round 4): the same ink as the intro's signature (public/signature-map.webp: red says when a pixel
// was written, green how much ink it has), as dots that gather in the order it was written when the footer comes into view, scatter from
// the pointer and spring back. A 2D canvas, drawing only while something moves. Reduced motion: the signature, still.

const SIG_W = 885, SIG_H = 292

export default function FooterSignature() {
	const wrap = useRef<HTMLDivElement>(null)
	const canvas = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		const el = wrap.current, cv = canvas.current
		if (!el || !cv) return
		const ctx = cv.getContext('2d')
		if (!ctx) return
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
		const coarse = window.matchMedia('(pointer: coarse)').matches
		let gone = false, raf = 0, visible = false, started = false, t0 = 0
		const dpr = Math.min(window.devicePixelRatio || 1, 2)
		let W = 0, H = 0, scale = 1, ox = 0
		type P = { hx: number; hy: number; x: number; y: number; vx: number; vy: number; t: number; a: number }
		let ps: P[] = []
		const pointer = { x: -9999, y: -9999 }
		const light = () => !!document.querySelector('.app.color-mode')

		const layout = () => {
			W = el.clientWidth
			H = Math.round(Math.min(W * 0.33, 240))
			cv.width = Math.round(W * dpr)
			cv.height = Math.round(H * dpr)
			cv.style.height = `${H}px`
			scale = Math.min(W / SIG_W, H / SIG_H) * 0.92
			ox = (W - SIG_W * scale) / 2
		}

		const build = (map: Uint8ClampedArray) => {
			const out: P[] = []
			const step = W < 500 ? 3 : 2
			for (let y = 0; y < SIG_H; y += step) {
				for (let x = 0; x < SIG_W; x += step) {
					const i = (y * SIG_W + x) * 4
					if (map[i + 1] < 60) continue
					const hx = ox + x * scale, hy = (H - SIG_H * scale) / 2 + y * scale
					// they start scattered below, as dust, and gather in the order the pen went
					out.push({ hx, hy, x: hx + (Math.random() - 0.5) * 140, y: H + 20 + Math.random() * 60, vx: 0, vy: 0, t: map[i] / 255, a: map[i + 1] / 255 })
				}
			}
			ps = out
		}

		const draw = (now: number) => {
			raf = 0
			if (gone) return
			const t = (now - t0) / 1000
			const ink = light() ? '0,0,0' : '255,255,255'
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
			ctx.clearRect(0, 0, W, H)
			let moving = false
			const R = 70
			for (const p of ps) {
				// each dot is released when its stroke was written, over about 2.2 s
				const go = reduced || t > p.t * 2.2
				if (go) {
					let fx = (p.hx - p.x) * 0.06, fy = (p.hy - p.y) * 0.06
					const dx = p.x - pointer.x, dy = p.y - pointer.y, d2 = dx * dx + dy * dy
					if (d2 < R * R) { const d = Math.sqrt(d2) || 1, f = (1 - d / R) * 3.2; fx += (dx / d) * f; fy += (dy / d) * f }
					p.vx = (p.vx + fx) * 0.82
					p.vy = (p.vy + fy) * 0.82
					p.x += p.vx
					p.y += p.vy
					if (reduced) { p.x = p.hx; p.y = p.hy }
					if (Math.abs(p.vx) + Math.abs(p.vy) > 0.02 || Math.abs(p.hx - p.x) + Math.abs(p.hy - p.y) > 0.3) moving = true
				} else moving = true
				const alpha = go ? 0.35 + p.a * 0.6 : 0
				if (alpha <= 0) continue
				ctx.fillStyle = `rgba(${ink},${alpha.toFixed(2)})`
				ctx.fillRect(p.x, p.y, 1.6, 1.6)
			}
			if (visible && moving && !reduced) raf = requestAnimationFrame(draw)
		}
		const wake = () => { if (!raf && visible && started) raf = requestAnimationFrame(draw) }

		const img = new Image()
		img.src = '/signature-map.webp'
		img.decode().then(() => {
			if (gone) return
			const c = document.createElement('canvas')
			c.width = SIG_W
			c.height = SIG_H
			const x = c.getContext('2d', { willReadFrequently: true })
			if (!x) return
			x.drawImage(img, 0, 0)
			const map = x.getImageData(0, 0, SIG_W, SIG_H).data
			layout()
			build(map)
			const io = new IntersectionObserver(([e]) => {
				visible = e.isIntersecting
				if (visible && !started) { started = true; t0 = performance.now() }
				wake()
			}, { threshold: 0.3 })
			io.observe(el)
			cleanup.push(() => io.disconnect())
			const ro = new ResizeObserver(() => { const w = W; layout(); if (W !== w) { build(map); for (const p of ps) { p.x = p.hx; p.y = p.hy } } wake() })
			ro.observe(el)
			cleanup.push(() => ro.disconnect())
		}).catch(() => {})

		const onMove = (e: PointerEvent) => {
			const r = cv.getBoundingClientRect()
			pointer.x = e.clientX - r.left
			pointer.y = e.clientY - r.top
			wake()
		}
		const onLeave = () => { pointer.x = pointer.y = -9999; wake() }
		const cleanup: (() => void)[] = []
		if (!coarse) { cv.addEventListener('pointermove', onMove); cv.addEventListener('pointerleave', onLeave) }
		return () => {
			gone = true
			cancelAnimationFrame(raf)
			cv.removeEventListener('pointermove', onMove)
			cv.removeEventListener('pointerleave', onLeave)
			cleanup.forEach((f) => f())
		}
	}, [])

	return (
		<div ref={wrap} className="footer-signature">
			<canvas ref={canvas} role="img" aria-label="Manuel Peña Morros signature" />
		</div>
	)
}
