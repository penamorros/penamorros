// "My Story" (the client, 2026-11-20): the hero runs straight on, with no line, into his story, told in six chapters and an ending.
// Each chapter is a few lines on one side and a pen drawing on the other, sides alternating, in the same brush-pen hand as the Mexico City
// skyline; each drawing draws itself, stroke by stroke, as its chapter arrives, and one ink thread runs down the page from drawing to
// drawing, drawn by the scroll. The story ends on a portrait of him in the same hand. Every chapter is a stop for the page's wheel
// stepping ([data-snap]). The section keeps the id 'values' so the rail, the stepping and the guide find it where Core Values was.
// (Some details here are placeholders for him to correct: marked with "draft" in the copy notes below.)
import { memo, useEffect, useRef } from 'react'
import ScriptTitle from '../components/ScriptTitle'
import { load, mount } from '../components/InkArt'
import { gsap, whenBooted } from '../motion'

type Chapter = { id: string; when: string; title: string; body: string; art: string; photo?: string }

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']

// who he is, in six chapters of 34 words each (draft for him to make his own)
const CHAPTERS: Chapter[] = [
	{ id: 'home', when: 'Mexico City', art: 'story4-1', title: 'Where I come from',
		body: 'Mexico City raised me: its noise, its color, its traditions, its people. I grew up surrounded by family and by a culture that always taught me to be proud of where I come from.' },
	{ id: 'two', when: 'Growing up', art: 'story4-2', title: 'Seeing both sides',
		body: 'Growing up, I had every opportunity, and I saw how many people around me didn’t. That contrast stayed with me. Mexico has so much talent; what it lacks is the chance to use it.' },
	{ id: 'help', when: 'Teenage years', art: 'story2-5', photo: 'story2-5-photo', title: 'Learning to give back',
		body: 'As a teenager I started looking for ways to help: giving talks at schools and children’s homes, volunteering, listening. I realized I could do something, and that small actions add up to real change.' },
	{ id: 'leave', when: 'Leaving home', art: 'story3-4', title: 'Leaving to learn',
		body: 'Leaving Mexico to study was the hardest decision I’ve ever made. I left to learn from the world, see how things are built elsewhere, and to bring everything I learn back home one day.' },
	{ id: 'build', when: 'Austin · now', art: 'story2-6', title: 'Learning to build',
		body: 'Today I study at UT Austin, in Texas. Every project, every late night, every product I ship is practice for the very same goal: building tools that can change things at scale back home.' },
	{ id: 'back', when: 'Mexico · next', art: 'story4-6', title: 'Going back',
		body: 'One day I’ll go back. Not to visit, but to build: companies, jobs and opportunities. Mexico shaped the person I am today. I want to give back to the community I was born in.' },
]

/** One drawing: laid in undrawn when its chapter is near, drawn when it arrives. */
function useInk(ref: React.RefObject<HTMLDivElement | null>, name: string) {
	useEffect(() => {
		const el = ref.current
		if (!el) return
		const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
		let m: ReturnType<typeof mount> | null = null
		let want = false
		let alive = true
		const near = new IntersectionObserver(([e]) => {
			if (!e.isIntersecting) return
			near.disconnect()
			load(name).then((d) => { if (!alive || !d) return; m = mount(el, d, still); if (want) m.draw() })
		}, { rootMargin: '120% 0px' })
		const arrive = new IntersectionObserver(([e]) => {
			if (!e.isIntersecting) return
			arrive.disconnect()
			want = true
			m?.draw()
		}, { threshold: 0.45 })
		near.observe(el)
		whenBooted().then(() => { if (alive) arrive.observe(el) })
		return () => { alive = false; near.disconnect(); arrive.disconnect(); m?.stop() }
	}, [ref, name])
}

function Art({ name, className = '', exact, photo, cutout = false }: { name: string; className?: string; exact?: string; photo?: string; cutout?: boolean }) {
	const ref = useRef<HTMLDivElement>(null)
	useInk(ref, name)
	// a drawing with fine detail (his face): once the pen has drawn it, the exact drawing fades in over the strokes
	useEffect(() => {
		const el = ref.current
		if (!el || !exact) return
		// the finished strokes must be painted once at full strength before they fade, or there is a blink with nothing on screen
		const mo = new MutationObserver(() => {
			if (!el.querySelector(':scope > svg')) return
			mo.disconnect()
			requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-exact')))
		})
		mo.observe(el, { childList: true })
		return () => mo.disconnect()
	}, [exact])
	return (
		<div ref={ref} className={`story-ink ${className}`} data-name={name} aria-hidden="true">
			{exact && <i className="story-exact" style={{ ['--src' as string]: `url(/ink/${exact}.webp)` }} />}
			{photo && <BrushReveal host={ref} src={`/ink/${photo}.webp`} cutout={cutout} />}
		</div>
	)
}

export default memo(function Story() {
	const sectionRef = useRef<HTMLElement>(null)
	const svgRef = useRef<SVGSVGElement>(null)

	// the words of each chapter rise in as it arrives
	useEffect(() => {
		const els = sectionRef.current?.querySelectorAll('.story-ch, .story-head, .story-end') ?? []
		const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) } }), { threshold: 0.3 })
		els.forEach((el) => io.observe(el))
		return () => io.disconnect()
	}, [])

	// the thread: one piece of line into each chapter, from the title (or the drawing before) down to its drawing. Each piece is drawn
	// when its chapter arrives, a small light riding the pen's tip, so the line follows you down the story.
	useEffect(() => {
		const section = sectionRef.current, svg = svgRef.current
		if (!section || !svg) return
		const NS = 'http://www.w3.org/2000/svg'
		const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
		const targets = [...section.querySelectorAll<HTMLElement>('.story-ch, .story-end')]
		const pieces = targets.map(() => {
			const path = document.createElementNS(NS, 'path')
			path.setAttribute('class', 'story-thread-line')
			svg.appendChild(path)
			return path
		})
		const tip = document.createElementNS(NS, 'circle')
		tip.setAttribute('class', 'story-thread-tip')
		tip.setAttribute('r', '3')
		svg.appendChild(tip)
		const drawn = new Set<number>()
		const layout = () => {
			const base = section.getBoundingClientRect()
			const box = (el: Element | null) => { const r = el!.getBoundingClientRect(); return { x: r.left - base.left + r.width / 2, top: r.top - base.top, bottom: r.bottom - base.top } }
			svg.setAttribute('viewBox', `0 0 ${section.offsetWidth} ${section.offsetHeight}`)
			let from = box(section.querySelector('.story-lede'))
			targets.forEach((t, i) => {
				const to = box(t.querySelector('.story-ink'))
				const y0 = from.bottom + 18, y1 = to.top - 18, mid = (y0 + y1) / 2
				const d = `M${from.x.toFixed(1)},${y0.toFixed(1)} C${from.x.toFixed(1)},${(mid + (y1 - y0) * 0.18).toFixed(1)} ${to.x.toFixed(1)},${(mid - (y1 - y0) * 0.18).toFixed(1)} ${to.x.toFixed(1)},${y1.toFixed(1)}`
				const p = pieces[i]
				p.setAttribute('d', d)
				const L = p.getTotalLength()
				p.style.strokeDasharray = `${L} ${L}`
				if (!drawn.has(i)) p.style.strokeDashoffset = String(L)
				from = to
			})
		}
		layout()
		// measured again whenever a drawing loads and takes its height, so the line always lands on the drawing's top
		const ro = new ResizeObserver(layout)
		ro.observe(section)
		section.querySelectorAll('.story-ink').forEach((el) => ro.observe(el))
		const late = window.setTimeout(layout, 1200)
		const run = (i: number) => {
			if (drawn.has(i)) return
			drawn.add(i)
			const p = pieces[i]
			if (still) { p.style.strokeDashoffset = '0'; return }
			const s = { v: 0 }
			gsap.to(s, {
				v: 1, duration: 1.3, ease: 'power2.inOut',
				onStart: () => { tip.style.opacity = '1' },
				onUpdate: () => {
					const L = p.getTotalLength()
					p.style.strokeDasharray = `${L} ${L}`
					p.style.strokeDashoffset = String(L * (1 - s.v))
					const pt = p.getPointAtLength(p.getTotalLength() * s.v)
					tip.setAttribute('cx', pt.x.toFixed(1)); tip.setAttribute('cy', pt.y.toFixed(1))
				},
				onComplete: () => { tip.style.opacity = '0' },
			})
		}
		// a chapter arriving draws its piece (and any before it the stepping jumped past)
		const io = new IntersectionObserver((entries) => entries.forEach((e) => {
			if (!e.isIntersecting) return
			const i = targets.indexOf(e.target as HTMLElement)
			for (let k = 0; k <= i; k++) if (!drawn.has(k)) { if (k < i) { drawn.add(k); pieces[k].style.strokeDashoffset = '0' } else run(k) }
		}), { threshold: 0.35 })
		whenBooted().then(() => targets.forEach((t) => io.observe(t)))
		return () => { ro.disconnect(); io.disconnect(); window.clearTimeout(late); pieces.forEach((p) => p.remove()); tip.remove() }
	}, [])

	return (
		<section id="values" ref={sectionRef} className="section story" aria-label="My story">
			<svg ref={svgRef} className="story-thread" aria-hidden="true" />
			<div className="container">
				<header className="story-head" data-snap>
					<h2><ScriptTitle text="My Story" /></h2>
					<p className="story-lede">Six chapters, so far.</p>
				</header>
				{CHAPTERS.map((c, i) => (
					<article key={c.id} className={`story-ch ${i % 2 ? 'is-right' : 'is-left'}`} data-snap>
						<div className="story-text">
							<span className="story-when"><i>{ROMAN[i]}</i>{c.when}</span>
							<h3>{c.title}</h3>
							<p>{c.body}</p>
						</div>
						<Art name={c.art} photo={c.photo} />
					</article>
				))}
				<article className="story-end" data-snap>
					<Art name="story-me" className="is-me" exact="story-me-exact" photo="story-me-photo" cutout />
					<div className="story-text">
						<span className="story-when"><i>VII</i>So far</span>
						<h3>And that’s me.</h3>
						<p className="story-next">Here’s what I can do.</p>
					</div>
				</article>
			</div>
		</section>
	)
})

/**
 * The real photo under a drawing (chapter III, and the portrait at the end), painted in like a soft brush.
 * - When the drawing has finished sketching itself, an invisible brush paints one stroke of the photo and lets it fade:
 *   no words, it just shows there is something there. It replays a couple of times until someone tries it.
 * - Exactly what a visitor brushes stays, for good: leaving the drawing never takes it away, and nothing fills in by itself.
 * - A full photo gets feathered edges instead of a frame; a cut-out figure (`cutout`) has its own shape, no background.
 * Only with a mouse or trackpad; phones keep the drawing.
 */
function BrushReveal({ host, src, cutout = false }: { host: React.RefObject<HTMLDivElement | null>; src: string; cutout?: boolean }) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	useEffect(() => {
		const el = host.current, cv = canvasRef.current
		if (!el || !cv || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
		const layer = () => { const c = document.createElement('canvas'); return [c, c.getContext('2d')!] as const }
		const ctx = cv.getContext('2d')!
		const [keep, kctx] = layer()   // what the visitor has brushed: permanent
		const [ghost, gctx] = layer()  // the teaser stroke: fades
		const [both, bctx] = layer()   // the two together, as the mask
		const [edge, ectx] = layer()   // feathered edges for a full photo
		let img: HTMLImageElement | null = null
		let W = 0, H = 0, dpr = 1, raf = 0
		let last: { x: number; y: number } | null = null
		let used = false
		let teasing = false, ghostFrames = -1, teases = 0, seen = false, teaseTimer = 0

		// ---- the brush: a soft round core with a few loose bristles
		const dab = (c: CanvasRenderingContext2D, x: number, y: number) => {
			const R = W * 0.1
			const g = c.createRadialGradient(x, y, 0, x, y, R)
			g.addColorStop(0, 'rgba(0,0,0,.38)'); g.addColorStop(0.6, 'rgba(0,0,0,.2)'); g.addColorStop(1, 'rgba(0,0,0,0)')
			c.fillStyle = g
			c.beginPath(); c.arc(x, y, R, 0, Math.PI * 2); c.fill()
			for (let k = 0; k < 3; k++) {
				const a = Math.random() * Math.PI * 2, d = R * (0.5 + Math.random() * 0.55), r = R * (0.12 + Math.random() * 0.16)
				const bx = x + Math.cos(a) * d, by = y + Math.sin(a) * d
				const b = c.createRadialGradient(bx, by, 0, bx, by, r)
				b.addColorStop(0, 'rgba(0,0,0,.22)'); b.addColorStop(1, 'rgba(0,0,0,0)')
				c.fillStyle = b
				c.beginPath(); c.arc(bx, by, r, 0, Math.PI * 2); c.fill()
			}
		}
		const stroke = (c: CanvasRenderingContext2D, from: { x: number; y: number }, to: { x: number; y: number }) => {
			const n = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / (W * 0.012)))
			for (let i = 1; i <= n; i++) dab(c, from.x + ((to.x - from.x) * i) / n, from.y + ((to.y - from.y) * i) / n)
		}

		// ---- sizes: keep what has been painted when the drawing resizes
		const size = () => {
			const r = el.getBoundingClientRect()
			dpr = Math.min(2, window.devicePixelRatio || 1)
			const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr))
			if (w === W && h === H) return
			let saved: HTMLCanvasElement | null = null
			if (W && H) { saved = document.createElement('canvas'); saved.width = W; saved.height = H; saved.getContext('2d')!.drawImage(keep, 0, 0) }
			W = w; H = h
			for (const c of [cv, keep, ghost, both, edge]) { c.width = W; c.height = H }
			// feathered on all four sides (eased ramps), so even the whole photo has no edge or frame
			const ramp = (g: CanvasGradient, a: number, b: number) => {
				for (let k = 0; k <= 8; k++) { const t = k / 8, e = t * t * (3 - 2 * t); g.addColorStop(a * t, `rgba(0,0,0,${e})`); g.addColorStop(1 - b * t, `rgba(0,0,0,${e})`) }
			}
			const gx = ectx.createLinearGradient(0, 0, W, 0); ramp(gx, 0.16, 0.16)
			ectx.globalCompositeOperation = 'source-over'; ectx.fillStyle = gx; ectx.fillRect(0, 0, W, H)
			const gy = ectx.createLinearGradient(0, 0, 0, H); ramp(gy, 0.06, 0.12)
			ectx.globalCompositeOperation = 'destination-in'; ectx.fillStyle = gy; ectx.fillRect(0, 0, W, H)
			ectx.globalCompositeOperation = 'source-over'
			if (saved) kctx.drawImage(saved, 0, 0, W, H)
			render()
		}

		// ---- drawing the frame
		const render = () => {
			ctx.clearRect(0, 0, W, H)
			if (!img) return
			bctx.clearRect(0, 0, W, H)
			bctx.drawImage(keep, 0, 0)
			if (ghostFrames >= 0) bctx.drawImage(ghost, 0, 0)
			ctx.globalCompositeOperation = 'source-over'
			ctx.drawImage(img, 0, 0, W, H)
			ctx.globalCompositeOperation = 'destination-in'
			ctx.drawImage(both, 0, 0)
			if (!cutout) ctx.drawImage(edge, 0, 0)
			ctx.globalCompositeOperation = 'source-over'
		}
		const tick = () => {
			raf = 0
			let more = teasing
			// the teaser stroke fades back to ink once it has been drawn
			if (!teasing && ghostFrames >= 0) {
				gctx.globalCompositeOperation = 'destination-out'
				gctx.fillStyle = 'rgba(0,0,0,.05)'
				gctx.fillRect(0, 0, W, H)
				gctx.globalCompositeOperation = 'source-over'
				if (++ghostFrames > 80) { gctx.clearRect(0, 0, W, H); ghostFrames = -1 } else more = true
			}
			render()
			if (more) raf = requestAnimationFrame(tick)
		}
		const wake = () => { if (!raf) raf = requestAnimationFrame(tick) }

		// ---- the teaser
		const path = cutout
			? [[0.28, 0.16], [0.7, 0.22], [0.34, 0.36], [0.72, 0.48], [0.3, 0.6], [0.66, 0.72]]
			: [[0.24, 0.1], [0.42, 0.06], [0.5, 0.22], [0.36, 0.36], [0.46, 0.52], [0.62, 0.42]]
		const along = (t: number) => {
			// Catmull-Rom through the points, so the stroke is one smooth curve
			const n = path.length - 1, f = Math.min(n - 1e-6, t * n), i = Math.floor(f), u = f - i
			const p0 = path[Math.max(0, i - 1)], p1 = path[i], p2 = path[i + 1], p3 = path[Math.min(n, i + 2)]
			const c = (k: number) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * u + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u * u + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * u * u * u)
			return { x: c(0) * W, y: c(1) * H }
		}
		const tease = () => {
			if (used || teasing || !img || !seen) return
			teasing = true; teases++; ghostFrames = 0
			gctx.clearRect(0, 0, W, H)
			const t0 = performance.now(), dur = 1500
			let prev = along(0)
			const run = (now: number) => {
				const t = Math.min(1, (now - t0) / dur)
				const p = along(t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
				stroke(gctx, prev, p)
				prev = p
				wake()
				if (t < 1 && !used) requestAnimationFrame(run)
				else window.setTimeout(() => { teasing = false; ghostFrames = 0; wake(); schedule() }, used ? 0 : 650)
			}
			requestAnimationFrame(run)
		}
		// the hint plays as soon as the drawing slides into view (the client, 2026-11-24: it took too long), then again later
		const schedule = () => {
			window.clearTimeout(teaseTimer)
			if (used || teases >= 3) return
			teaseTimer = window.setTimeout(tease, teases ? 6500 : 250)
		}
		const view = new IntersectionObserver(([e]) => {
			seen = e.isIntersecting && e.intersectionRatio > 0.35
			if (seen && !teasing) schedule()
			else if (!seen) window.clearTimeout(teaseTimer)
		}, { threshold: [0, 0.35, 0.6] })
		view.observe(el)

		// the photo is fetched when the chapter is near, so the first stroke already has it
		const near = new IntersectionObserver(([e]) => {
			if (!e.isIntersecting) return
			near.disconnect()
			const im = new Image()
			im.decoding = 'async'
			im.src = src
			const ready = () => { img = im; render(); if (seen) schedule() }
			im.decode().then(ready).catch(ready)
		}, { rootMargin: '250% 0px' })
		near.observe(el)

		const ro = new ResizeObserver(size)
		ro.observe(el)
		size()

		// ---- the visitor's brush
		const move = (e: PointerEvent) => {
			if (!img) return
			const r = el.getBoundingClientRect()
			const p = { x: (e.clientX - r.left) * dpr, y: (e.clientY - r.top) * dpr }
			stroke(kctx, last ?? p, p)
			last = p
			if (!used) { used = true; window.clearTimeout(teaseTimer) }
			wake()
		}
		const leave = () => { last = null }
		el.addEventListener('pointermove', move)
		el.addEventListener('pointerleave', leave)
		return () => {
			near.disconnect(); ro.disconnect(); view.disconnect(); window.clearTimeout(teaseTimer)
			el.removeEventListener('pointermove', move)
			el.removeEventListener('pointerleave', leave)
			cancelAnimationFrame(raf)
		}
	}, [host, src, cutout])
	return <canvas ref={canvasRef} className="story-brush" />
}
