// Hand marks on headings: one word per heading gets a
// mark drawn by hand in his ink (
// vanilla port in breva-hvac/src/core/markup.js; the shapes below are that port's, plus a double underline and a box).
// Only marks that add no words, because the copy stays his. The mark draws itself once its heading has written
// itself in (writeIn and rewriteOnHover send 'write:done'), and again whenever the heading is rewritten under the pointer.
//   <h2><span className="write">Core <Mark kind="underline">Values</Mark></span></h2>
import type { ReactNode } from 'react'

export type MarkKind = 'circle' | 'underline' | 'highlight' | 'double' | 'box'

const PEN = 0.026 // stroke width, in em of the heading
const TIME: Record<MarkKind, number> = { circle: 0.78, underline: 0.52, highlight: 0.58, double: 0.7, box: 0.86 }

export function Mark({ kind, children }: { kind: MarkKind; children: ReactNode }) {
	return (
		<span className="mk" data-k={kind} data-s="idle" style={{ ['--t' as string]: `${TIME[kind]}s` }}>
			{children}
			<i className="mk-bl" aria-hidden="true" />
			<svg className={`mk-svg${kind === 'highlight' ? ' mk-hl' : ''}`} aria-hidden="true">
				<path className={kind === 'highlight' ? 'mk-fill' : 'mk-draw'} pathLength={1} />
			</svg>
		</span>
	)
}

const f2 = (v: number) => String(Math.round(v * 100) / 100)
function rng(seed: number) {
	let a = seed >>> 0 || 1
	return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0 }
function smooth(pts: number[][]) {
	let d = `M${f2(pts[0][0])} ${f2(pts[0][1])}`
	for (let i = 0; i < pts.length - 1; i++) {
		const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)]
		d += `C${f2(p1[0] + (p2[0] - p0[0]) / 6)} ${f2(p1[1] + (p2[1] - p0[1]) / 6)} ${f2(p2[0] - (p3[0] - p1[0]) / 6)} ${f2(p2[1] - (p3[1] - p1[1]) / 6)} ${f2(p2[0])} ${f2(p2[1])}`
	}
	return d
}

/** The mark round, under or behind a word, in px of its box (bl = its baseline, F = font size, cap/xh in em). */
function markPath(kind: MarkKind, w: number, bl: number, F: number, xh: number, cap: number, seed: number) {
	const r = rng(seed), j = (s: number) => (r() - 0.5) * s * F, sw = PEN * F
	if (kind === 'circle') {
		// one loop from the upper right, carried a little past the start, as a hand does
		const cx = w / 2 + j(0.04), cy = bl - cap * F * 0.46, rx = w / 2 + 0.16 * F, ry = cap * F * 0.5 + 0.26 * F
		const tilt = ((-2.5 + r() * 1.5) * Math.PI) / 180, start = -0.5 - r() * 0.25, turn = Math.PI * 2 + 0.38, ph1 = r() * 6.28, ph2 = r() * 6.28
		const pts: number[][] = []
		for (let i = 0; i <= 56; i++) {
			const u = i / 56, th = start - turn * u
			const wob = 1 + 0.035 * Math.sin(2 * th + ph1) + 0.02 * Math.sin(3 * th + ph2), sp = 0.97 + 0.13 * u * u * u
			const x = rx * wob * sp * Math.cos(th), y = ry * wob * sp * Math.sin(th)
			pts.push([cx + x * Math.cos(tilt) - y * Math.sin(tilt), cy + x * Math.sin(tilt) + y * Math.cos(tilt)])
		}
		return { d: smooth(pts), sw }
	}
	if (kind === 'underline') {
		const y = bl + 0.12 * F + j(0.02)
		return { d: `M${f2(-0.04 * F)} ${f2(y + 0.015 * F)}C${f2(0.3 * w)} ${f2(y + 0.045 * F)} ${f2(0.7 * w)} ${f2(y + 0.02 * F)} ${f2(w + 0.07 * F)} ${f2(y - 0.035 * F)}`, sw: sw * 1.15 }
	}
	if (kind === 'double') {
		// two quick strokes, the second a little shorter and lower, as when something is underlined twice
		const y = bl + 0.1 * F + j(0.02), y2 = y + 0.1 * F
		return {
			d: `M${f2(-0.04 * F)} ${f2(y + 0.012 * F)}C${f2(0.32 * w)} ${f2(y + 0.035 * F)} ${f2(0.68 * w)} ${f2(y + 0.01 * F)} ${f2(w + 0.06 * F)} ${f2(y - 0.03 * F)}`
				+ `M${f2(0.06 * w)} ${f2(y2 + 0.01 * F)}C${f2(0.35 * w)} ${f2(y2 + 0.03 * F)} ${f2(0.66 * w)} ${f2(y2 + 0.012 * F)} ${f2(0.93 * w)} ${f2(y2 - 0.02 * F)}`,
			sw: sw * 1.05,
		}
	}
	if (kind === 'box') {
		// a box drawn in one go: corners not quite met, the last side running past the start
		const t = bl - cap * F - 0.2 * F, b = bl + 0.16 * F, x0 = -0.16 * F, x1 = w + 0.16 * F
		const p = [[x0 + 0.05 * F + j(0.03), t + j(0.04)], [x1 + j(0.04), t - 0.02 * F + j(0.03)], [x1 - 0.03 * F + j(0.03), b + j(0.03)], [x0 + j(0.03), b + 0.02 * F + j(0.03)], [x0 + 0.02 * F + j(0.02), t - 0.06 * F]]
		return { d: `M${p.map((q) => `${f2(q[0])} ${f2(q[1])}`).join('L')}`, sw }
	}
	// highlight: a marker swipe over the lower part of the letters, its ends cut on a chisel's slant
	const top = bl - xh * F * 0.84 + j(0.02), bot = bl + 0.1 * F, x0 = -0.07 * F, x1 = w + 0.07 * F, sl = 0.09 * F
	return { d: `M${f2(x0 + sl)} ${f2(top + 0.02 * F)}C${f2(0.35 * w)} ${f2(top + 0.004 * F)} ${f2(0.7 * w)} ${f2(top - 0.004 * F)} ${f2(x1)} ${f2(top - 0.022 * F)}L${f2(x1 - sl)} ${f2(bot - 0.03 * F)}C${f2(0.7 * w)} ${f2(bot - 0.01 * F)} ${f2(0.35 * w)} ${f2(bot + 0.006 * F)} ${f2(x0)} ${f2(bot + 0.012 * F)}Z`, sw: 0 }
}

let mctx: CanvasRenderingContext2D | null = null
const metricCache = new Map<string, { cap: number; xh: number }>()
function metrics(cs: CSSStyleDeclaration) {
	const key = `${cs.fontWeight} ${cs.fontFamily}`
	let m = metricCache.get(key)
	if (m) return m
	mctx ||= document.createElement('canvas').getContext('2d')
	if (!mctx) return { cap: 0.72, xh: 0.52 }
	mctx.font = `${cs.fontStyle} ${cs.fontWeight} 100px ${cs.fontFamily}`
	const cap = mctx.measureText('H').actualBoundingBoxAscent / 100, xh = mctx.measureText('x').actualBoundingBoxAscent / 100
	m = { cap: cap > 0.2 && cap < 1.2 ? cap : 0.72, xh: xh > 0.15 && xh < 1 ? xh : 0.52 }
	if (document.fonts?.check?.(`${cs.fontWeight} 100px ${cs.fontFamily}`)) metricCache.set(key, m)
	return m
}

/** Fits every mark's path to its word as laid out now. */
export function layoutMarks(root: ParentNode = document) {
	root.querySelectorAll<HTMLElement>('.mk').forEach((mk, i) => {
		const kind = mk.dataset.k as MarkKind
		const cs = getComputedStyle(mk), F = parseFloat(cs.fontSize) || 0
		const { cap, xh } = metrics(cs)
		const w = mk.offsetWidth, hgt = mk.offsetHeight, bl = mk.querySelector<HTMLElement>(':scope > .mk-bl')?.offsetTop ?? hgt * 0.8
		const svg = mk.querySelector<SVGSVGElement>(':scope > .mk-svg'), path = svg?.firstElementChild as SVGPathElement | null
		if (!svg || !path || !w) return
		const p = markPath(kind, w, bl, F, xh, cap, hash(mk.textContent || '') + i * 7919)
		svg.setAttribute('width', String(w))
		svg.setAttribute('height', String(hgt))
		svg.setAttribute('viewBox', `0 0 ${w} ${hgt}`)
		path.setAttribute('d', p.d)
		if (p.sw) path.setAttribute('stroke-width', f2(p.sw))
	})
}

const timers = new WeakMap<HTMLElement, number>()
function draw(mk: HTMLElement) {
	window.clearTimeout(timers.get(mk))
	mk.dataset.s = 'idle'
	void mk.offsetWidth // restart the animation
	mk.dataset.s = 'run'
	const t = parseFloat(mk.style.getPropertyValue('--t')) || 0.7
	timers.set(mk, window.setTimeout(() => { mk.dataset.s = 'done' }, (t + 0.1) * 1000))
}

/** Starts the marks: each draws after its heading's write-in, and hides while the heading is rewritten. */
export function startMarks() {
	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
	// measured when each one draws (and again if the fonts or the width change after that), never at mount
	const drawn = () => document.querySelectorAll<HTMLElement>('.mk:is([data-s="run"], [data-s="done"])').forEach((mk) => layoutMarks(mk.parentElement ?? document))
	document.fonts?.ready.then(drawn)
	let lastW = window.innerWidth, raf = 0
	const resize = () => {
		if (window.innerWidth === lastW) return
		lastW = window.innerWidth
		if (!raf) raf = requestAnimationFrame(() => { raf = 0; drawn() })
	}
	window.addEventListener('resize', resize)
	if (reduced) {
		document.querySelectorAll<HTMLElement>('.mk').forEach((mk) => { mk.dataset.s = 'done' })
		requestAnimationFrame(() => layoutMarks())
		return () => window.removeEventListener('resize', resize)
	}
	const start = (e: Event) => (e.target as HTMLElement).querySelectorAll<HTMLElement>('.mk').forEach((mk) => { window.clearTimeout(timers.get(mk)); mk.dataset.s = 'idle' })
	const done = (e: Event) => {
		const marks = (e.target as HTMLElement).querySelectorAll<HTMLElement>('.mk')
		if (!marks.length) return
		layoutMarks(e.target as HTMLElement)
		marks.forEach(draw)
	}
	document.addEventListener('write:start', start)
	document.addEventListener('write:done', done)
	return () => {
		window.removeEventListener('resize', resize)
		document.removeEventListener('write:start', start)
		document.removeEventListener('write:done', done)
	}
}
