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

type Chapter = { id: string; when: string; title: string; body: string; art: string }

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']

// who he is, in six chapters of 34 words each (draft for him to make his own)
const CHAPTERS: Chapter[] = [
	{ id: 'home', when: 'Mexico City', art: 'story4-1', title: 'Where I come from',
		body: 'Mexico City raised me: its noise, its color, its traditions, its people. I grew up surrounded by family and by a culture that always taught me to be proud of where I come from.' },
	{ id: 'two', when: 'Growing up', art: 'story4-2', title: 'Seeing both sides',
		body: 'Growing up, I had every opportunity, and I saw how many people around me didn’t. That contrast stayed with me. Mexico has so much talent; what it lacks is the chance to use it.' },
	{ id: 'help', when: 'Teenage years', art: 'story4-3', title: 'Learning to give back',
		body: 'As a teenager I started looking for ways to help: giving talks at schools and children’s homes, volunteering, listening. I realized I could do something, and that small actions add up to real change.' },
	{ id: 'leave', when: 'Leaving home', art: 'story3-4', title: 'Leaving to learn',
		body: 'Leaving Mexico to study was the hardest decision I’ve ever made. I left to learn from the world, see how things are built elsewhere, and to bring everything I learn back home one day.' },
	{ id: 'build', when: 'Austin · now', art: 'story2-6', title: 'Learning to build',
		body: 'Today I study data science at UT Austin. Every project, every late night, every product I ship is practice for the very same goal: building tools that can change things at scale back home.' },
	{ id: 'back', when: 'Mexico · next', art: 'story4-6', title: 'Going back',
		body: 'One day I’ll go back for good. Not to visit, but to build: companies, jobs and opportunities for the kids at those red lights. Mexico gave me everything. I want to return the favor.' },
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

function Art({ name, className = '', exact }: { name: string; className?: string; exact?: string }) {
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
						<Art name={c.art} />
					</article>
				))}
				<article className="story-end" data-snap>
					<Art name="story-me" className="is-me" exact="story-me-exact" />
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
