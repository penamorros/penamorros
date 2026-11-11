import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { values } from '../content'
import { ScrollTrigger, drawIcons, gsap, prefersReducedMotion, resumeScroll, useDesktop, useMotion, writeIn } from '../motion'

const STEP_MS = 3400

export default memo(function Values() {
	const sectionRef = useRef<HTMLElement>(null)
	const captionRef = useRef<HTMLDivElement>(null)
	const arcRef = useRef<SVGCircleElement>(null)
	const desktop = useDesktop()
	const [active, setActive] = useState(0)
	const [hovered, setHovered] = useState<number | null>(null)
	const pausedByTap = useRef(false)

	// What is lit and described: the icon under the pointer, otherwise the one the scroll has reached.
	const shown = hovered ?? active

	useMotion(sectionRef, () => {
		const section = sectionRef.current!
		const q = gsap.utils.selector(section)
		const arrive = { trigger: section, start: desktop ? 'top 85%' : 'top 80%', once: true }

		// Undo a stuck Lenis stop from the earlier scroll-lock experiment / HMR.
		resumeScroll()

		writeIn(q('.write')[0])
		gsap.from(q('.animation-container'), { scale: 0.72, autoAlpha: 0, duration: 1.5, scrollTrigger: arrive })
		gsap.fromTo(q('.values-ring .base'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut', scrollTrigger: arrive })
		gsap.fromTo(q('.value-item'), { '--k': 0, autoAlpha: 0 }, { '--k': 1, autoAlpha: 1, duration: 1.4, stagger: 0.07, scrollTrigger: arrive })
		drawIcons(section, { delay: 0.4, stagger: 0.03, scrollTrigger: arrive })
		gsap.from(q('.value-caption'), { y: 22, autoAlpha: 0, duration: 1, delay: 0.5, scrollTrigger: arrive })

		if (!desktop) return () => { resumeScroll() }
		let last = 0
		ScrollTrigger.create({
			id: 'values',
			trigger: section,
			start: 'top top',
			end: '+=240%',
			pin: true,
			onUpdate: (self) => {
				const i = Math.min(values.length - 1, Math.floor(self.progress * values.length))
				if (i !== last) {
					last = i
					setActive(i)
				}
				if (arcRef.current) arcRef.current.style.strokeDashoffset = String(1 - self.progress)
			},
		})
		return () => { resumeScroll() }
	}, [desktop])

	// Small screens have no scroll stops: the values step by themselves while on screen, until someone taps one.
	useEffect(() => {
		const section = sectionRef.current
		if (desktop || !section || prefersReducedMotion()) return
		let timer = 0
		const io = new IntersectionObserver(([e]) => {
			window.clearInterval(timer)
			if (e.isIntersecting && !pausedByTap.current) timer = window.setInterval(() => setActive((a) => (a + 1) % values.length), STEP_MS)
		}, { threshold: 0.4 })
		io.observe(section)
		return () => {
			io.disconnect()
			window.clearInterval(timer)
		}
	}, [desktop])

	useEffect(() => {
		if (!desktop && arcRef.current) arcRef.current.style.strokeDashoffset = String(1 - (active + 1) / values.length)
	}, [active, desktop])

	useLayoutEffect(() => {
		if (prefersReducedMotion() || !captionRef.current) return
		const item = captionRef.current.querySelector('.value-caption-item.active')
		if (!item) return
		const t = gsap.fromTo(item.children, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.07, overwrite: true })
		return () => { t.kill() }
	}, [shown])

	const select = (index: number) => {
		const pin = ScrollTrigger.getById('values')
		if (pin && window.__lenis) {
			window.__lenis.scrollTo(pin.start + ((index + 0.5) / values.length) * (pin.end - pin.start), { duration: 1 })
			return
		}
		if (pin) {
			window.scrollTo(0, pin.start + ((index + 0.5) / values.length) * (pin.end - pin.start))
			return
		}
		pausedByTap.current = true
		setActive(index)
	}

	const current = values[shown]

	return (
		<section id="values" ref={sectionRef} className="section tone-1 tone-sep values-section">
			<div className="container">
				<h2><span className="write">Core Values</span></h2>
			</div>
			<div className="values-container">
				<div className="values-visual" style={{ '--accent': current.color } as React.CSSProperties}>
					<div className="animation-container">
						<ValuesStill selectedValue={values[shown].id} />
					</div>
					<div className="values-circle"></div>
					<svg className="values-ring" viewBox="0 0 100 100" aria-hidden="true">
						<circle className="base" cx="50" cy="50" r="49.7" pathLength={1} />
						<circle className="arc" ref={arcRef} cx="50" cy="50" r="49.7" pathLength={1} />
					</svg>
					{values.map((value, index) => (
						<div key={value.id} className="value-item visible" style={{ '--i': index } as React.CSSProperties}>
							<button
								className={`value-icon ${value.id}${index === shown ? ' selected' : ''}`}
								aria-label={value.label}
								aria-pressed={index === active}
								onClick={() => select(index)}
								onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHovered(index) }}
								onPointerLeave={() => setHovered(null)}
								onFocus={(e) => { if (e.target.matches(':focus-visible')) setHovered(index) }}
								onBlur={() => setHovered(null)}
							>
								<value.icon size={24} />
							</button>
						</div>
					))}
				</div>
			</div>
			<div className="value-caption" ref={captionRef} aria-live="polite">
				{values.map((value, index) => (
					<div key={value.id} className={`value-caption-item${index === shown ? ' active' : ''}`}>
						<h3>{value.label}</h3>
						<p>{value.description}</p>
					</div>
				))}
			</div>
		</section>
	)
})

// Finished drawing — tint follows the lit value (pointer, scroll stop, or phone timer).
function ValuesStill({ selectedValue }: { selectedValue: string | null }) {
	const hue: Record<string, number> = { hardwork: 320, coding: 120, teamwork: 240, excellence: 45, innovation: 270, growth: 180 }
	const style = selectedValue
		? { filter: `hue-rotate(${hue[selectedValue] ?? 0}deg) saturate(1.2) brightness(1.1)`, transition: 'filter 0.5s ease' }
		: { transition: 'filter 0.5s ease' }

	return (
		<img
			src="/illus-final.webp"
			alt=""
			className="values-animation"
			draggable={false}
			style={style}
		/>
	)
}
