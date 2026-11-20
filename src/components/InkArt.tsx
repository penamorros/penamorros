// The page's drawings (the client, 2026-11-19: "only the ones that take the whole width, more of them, drawn like calligraphy, fast").
// One hand, one pen, the road he took, a drawing on every screen: Mexico City, the Teotihuacán highlands, New Orleans, the flight north,
// New York, the Texas Hill Country, Austin. Each sits at the foot of the first screen of its section, so it is there the moment the
// section arrives.
//
// Each is a real line drawing: a brush-pen sketch turned into centre-line pen strokes (scripts/ink-vector.py; public/ink/*.svg, ~25 KB
// gzipped each). The first time a section comes into view its city draws itself in on a canvas, stroke by stroke, left to right, in about
// two seconds. Each frame paints only the bit of each stroke the pen has just added, so the page stays smooth while it draws. The colour
// is the page's ink (navy in white mode, soft ice in dark mode), and it repaints at once when the theme changes.
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { whenBooted } from '../motion'

type Box = { left: number; top: number; width: number; height: number }
type Piece = { section: string; name: string; kind: 'strip' | 'screen' | 'anchor'; front?: boolean; place?: (q: (sel: string) => DOMRect | null) => Box | null }

// strip: a panorama standing on the foot of the screen. screen: a whole composed screen, drawn only at its edges.
// anchor: one object fitted to the content it belongs with, measured from the page (the client, 2026-11-19: "not random drawings:
// cohesive with the site", like the jacaranda framing the values ring and the lamp lighting the game).
const PIECES: Piece[] = [
	{ section: 'about', name: 'cdmx', kind: 'strip' },
	// the projects: the work stands on an easel
	{ section: 'projects', name: 'a_easel', kind: 'anchor', place: (q) => {
		const prev = q('.carousel-prev'), next = q('.carousel-next'), card = q('.project-card')
		if (!prev || !next || !card) return null
		const cx = (prev.left + next.right) / 2
		const ledge = card.bottom + 6, top = card.top - 250
		const height = (ledge - top) / 0.411, width = Math.min(820, (next.right - prev.left) * 0.98)
		return { left: cx - width * 0.479, top, width, height }
	} },
]

type Stroke = { pts: Float32Array; cum: Float32Array; len: number; w: number; start: number }
type Drawing = { vw: number; vh: number; strokes: Stroke[]; end: number; svg: string }

const SWEEP = 1.45 // seconds for the pen to cross the page
const STROKE = 0.9 // seconds for one stroke
const JITTER = 0.28

export function parse(svg: string): Drawing | null {
	const vb = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg)
	if (!vb) return null
	const strokes: Stroke[] = []
	const re = /<path d="M([^"]+)" stroke-width="([\d.]+)" style="--t:([\d.]+)"/g
	let m: RegExpExecArray | null
	let i = 0
	while ((m = re.exec(svg))) {
		const nums = m[1].replace(/L/g, ' ').trim().split(/[\s,]+/).map(Number)
		const pts = new Float32Array(nums)
		const n = pts.length / 2
		const cum = new Float32Array(n)
		for (let k = 1; k < n; k++) cum[k] = cum[k - 1] + Math.hypot(pts[2 * k] - pts[2 * k - 2], pts[2 * k + 1] - pts[2 * k - 1])
		const j = ((i++ * 7919) % 97) / 97 // a pen does not move like a printer: a little unevenness in when each stroke starts
		strokes.push({ pts, cum, len: cum[n - 1] || 0.01, w: Number(m[2]), start: Number(m[3]) * SWEEP + j * JITTER })
	}
	const end = strokes.reduce((a, s) => Math.max(a, s.start + STROKE), 0)
	return { vw: Number(vb[1]), vh: Number(vb[2]), strokes, end, svg }
}

const cache = new Map<string, Promise<Drawing | null>>()
export const load = (name: string) => {
	if (!cache.has(name)) cache.set(name, fetch(`/ink/${name}.svg`).then((r) => (r.ok ? r.text() : '')).then(parse).catch(() => null))
	return cache.get(name)!
}

const ease = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** Paint stroke s from length a to length b. */
function segment(ctx: CanvasRenderingContext2D, s: Stroke, a: number, b: number) {
	const { pts, cum } = s
	const n = cum.length
	const at = (L: number): [number, number] => {
		let k = 1
		while (k < n - 1 && cum[k] < L) k++
		const t = (L - cum[k - 1]) / (cum[k] - cum[k - 1] || 1)
		return [pts[2 * k - 2] + (pts[2 * k] - pts[2 * k - 2]) * t, pts[2 * k - 1] + (pts[2 * k + 1] - pts[2 * k - 1]) * t]
	}
	ctx.lineWidth = s.w
	ctx.beginPath()
	const p0 = at(a)
	ctx.moveTo(p0[0], p0[1])
	for (let k = 1; k < n; k++) if (cum[k] > a && cum[k] < b) ctx.lineTo(pts[2 * k], pts[2 * k + 1])
	const p1 = at(b)
	ctx.lineTo(p1[0], p1[1])
	ctx.stroke()
}

/** One drawing on one canvas: draws in once, repaints whole on resize or theme change. */
export function mount(host: HTMLElement, d: Drawing, still: boolean) {
	const canvas = document.createElement('canvas')
	host.appendChild(canvas)
	const ctx = canvas.getContext('2d')!
	let t0 = -1 // when the drawing started (performance.now() seconds)
	let raf = 0
	const done = new Float32Array(d.strokes.length) // how much of each stroke is on the canvas

	const setup = () => {
		const dpr = Math.min(2, window.devicePixelRatio || 1)
		const w = host.clientWidth
		const screen = host.classList.contains('ink-screen')
		const h = screen ? host.clientHeight : (w * d.vh) / d.vw
		canvas.style.height = `${h}px`
		canvas.width = Math.round(w * dpr)
		canvas.height = Math.round(h * dpr)
		// a screen piece fills its screen edge to edge (the loose sketches take a little stretch on wider screens); a strip spans the width
		const kx = canvas.width / d.vw
		const ky = screen ? canvas.height / d.vh : kx
		ctx.setTransform(kx, 0, 0, ky, 0, 0)
		ctx.lineCap = 'round'
		ctx.lineJoin = 'round'
		ctx.strokeStyle = getComputedStyle(host).color
		done.fill(0)
	}
	const paint = (time: number) => {
		for (let i = 0; i < d.strokes.length; i++) {
			const s = d.strokes[i]
			const want = s.len * ease((time - s.start) / STROKE)
			if (want > done[i] + 0.05) { segment(ctx, s, Math.max(0, done[i] - 0.5), want); done[i] = want }
		}
	}
	// once drawn, the canvas gives way to the same drawing as plain SVG: no bitmap held in memory, and it follows the theme by itself
	let settled = false
	const settle = () => {
		if (settled) return
		settled = true
		ro.disconnect()
		theme.disconnect()
		host.insertAdjacentHTML('beforeend', d.svg.replace('preserveAspectRatio="xMidYMax meet"', host.classList.contains('ink-screen') ? 'preserveAspectRatio="none"' : 'preserveAspectRatio="xMidYMax meet"'))
		canvas.remove()
	}
	const frame = () => {
		const time = performance.now() / 1000 - t0
		paint(time)
		if (time < d.end + 0.05) raf = requestAnimationFrame(frame)
		else { raf = 0; settle() }
	}
	const redraw = () => {
		setup()
		if (t0 < 0) return
		paint(performance.now() / 1000 - t0)
		if (!raf && performance.now() / 1000 - t0 < d.end) raf = requestAnimationFrame(frame)
	}
	setup()
	const ro = new ResizeObserver(() => { if (canvas.width !== Math.round(host.clientWidth * Math.min(2, devicePixelRatio || 1))) redraw() })
	ro.observe(host)
	const theme = new MutationObserver(redraw)
	const app = host.closest('.app')
	if (app) theme.observe(app, { attributes: true, attributeFilter: ['class'] })

	return {
		draw() {
			if (t0 >= 0) return
			t0 = performance.now() / 1000 - (still ? 1e3 : 0)
			if (still) settle()
			else raf = requestAnimationFrame(frame)
		},
		stop() { cancelAnimationFrame(raf); ro.disconnect(); theme.disconnect(); canvas.remove(); host.querySelector('svg')?.remove() },
	}
}

export default function InkArt() {
	const [hosts, setHosts] = useState<{ piece: Piece; el: HTMLElement }[]>([])

	useEffect(() => {
		setHosts(PIECES.flatMap((p) => {
			const el = document.getElementById(p.section)
			return el ? [{ piece: p, el }] : []
		}))
	}, [])

	useEffect(() => {
		if (!hosts.length) return
		const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
		let alive = true
		let booted = false
		const live = new Map<HTMLElement, ReturnType<typeof mount>>()
		const wanted = new Set<HTMLElement>()

		// fetched a little ahead of its section and laid in undrawn
		const near = new IntersectionObserver((entries) => {
			for (const e of entries) {
				if (!e.isIntersecting) continue
				near.unobserve(e.target)
				const el = e.target as HTMLElement
				load(el.dataset.name!).then((d) => {
					if (!alive || !d) return
					const m = mount(el, d, still)
					live.set(el, m)
					if (wanted.has(el)) m.draw()
				})
			}
		}, { rootMargin: '150% 0px' })

		const draw = new IntersectionObserver((entries) => {
			for (const e of entries) {
				if (!e.isIntersecting || !booted) continue
				draw.unobserve(e.target)
				const el = e.target as HTMLElement
				wanted.add(el)
				live.get(el)?.draw()
			}
		}, { threshold: 0.3 })

		// anchored pieces follow the content they belong with
		const place = () => hosts.forEach(({ piece, el }) => {
			if (!piece.place) return
			const art = el.querySelector<HTMLElement>(`:scope > .ink-${piece.name}`)
			if (!art) return
			const base = el.getBoundingClientRect()
			const q = (sel: string) => {
				const r = el.querySelector(sel)?.getBoundingClientRect()
				return r && r.width ? new DOMRect(r.left - base.left, r.top - base.top, r.width, r.height) : null
			}
			const b = piece.place(q)
			if (!b) { art.style.display = 'none'; return }
			Object.assign(art.style, { display: '', left: `${b.left}px`, top: `${b.top}px`, width: `${b.width}px`, height: `${b.height}px`, right: 'auto' })
		})
		place()
		const placeRo = new ResizeObserver(() => place())
		hosts.forEach(({ el }) => placeRo.observe(el))
		const placeLate = [400, 1500, 3500].map((t) => window.setTimeout(place, t))
		// a pinned section slides its content in as it arrives: measure again as the page moves (once a frame at most)
		let placeRaf = 0
		const onScroll = () => { if (!placeRaf) placeRaf = requestAnimationFrame(() => { placeRaf = 0; place() }) }
		window.addEventListener('scroll', onScroll, { passive: true })

		const els = [...document.querySelectorAll<HTMLElement>('.ink-art')]
		els.forEach((el) => near.observe(el))
		// after the opening, so Mexico City is seen being drawn
		whenBooted().then(() => window.setTimeout(() => {
			if (!alive) return
			booted = true
			els.forEach((el) => draw.observe(el))
		}, 250))
		return () => { alive = false; near.disconnect(); draw.disconnect(); live.forEach((m) => m.stop()); placeRo.disconnect(); placeLate.forEach((t) => window.clearTimeout(t)); window.removeEventListener('scroll', onScroll); cancelAnimationFrame(placeRaf) }
	}, [hosts])

	return (
		<>
			{hosts.map(({ piece, el }) => createPortal(<div className={`ink-art ink-${piece.kind === 'anchor' ? 'screen ink-anchor' : piece.kind} ink-${piece.name}${piece.front ? ' is-front' : ''}`} data-name={piece.name} aria-hidden="true" />, el, piece.name))}
		</>
	)
}
