import React, { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Download } from '../icons'
import { timelineData } from '../content'
import { ScrollTrigger, gsap, prefersReducedMotion, resumeScroll, useDesktop, useMotion, writeIn } from '../motion'
import JourneyGlobe from './JourneyGlobe'
import { countText } from '../journeyLog'
import { Facts, Leg, Points, orgOf, pad2, shortOf } from './JourneyLog'

export default memo(function Resume() {
	const sectionRef = useRef<HTMLElement>(null)
	const fillRef = useRef<HTMLDivElement>(null)
	const desktop = useDesktop()
	const [activeIndex, setActiveIndex] = useState(0)

	useMotion(sectionRef, () => {
		const section = sectionRef.current!
		const q = gsap.utils.selector(section)
		resumeScroll()
		writeIn(q('.write')[0])

		if (desktop) {
			const arrive = { trigger: section, start: 'top 85%', once: true }
			gsap.from(q('.timeline-line'), { scaleX: 0, transformOrigin: 'left center', duration: 1.8, ease: 'power2.inOut', scrollTrigger: arrive })
			gsap.from(q('.timeline-point-inner'), { scale: 0, autoAlpha: 0, duration: 1, stagger: 0.12, delay: 0.3, scrollTrigger: arrive })
			gsap.from(q('.timeline-card'), { y: 34, autoAlpha: 0, duration: 1.2, delay: 0.5, scrollTrigger: arrive })
			gsap.from(q('.timeline-navigation'), { autoAlpha: 0, duration: 1, delay: 0.9, scrollTrigger: arrive })

			let last = 0
			ScrollTrigger.create({
				id: 'resume',
				trigger: section,
				start: 'top top',
				end: '+=260%',
				pin: true,
				onUpdate: (self) => {
					const i = Math.min(timelineData.length - 1, Math.floor(self.progress * timelineData.length))
					if (i !== last) {
						last = i
						setActiveIndex(i)
					}
					if (fillRef.current) fillRef.current.style.transform = `scaleX(${self.progress})`
				},
			})
			return () => { resumeScroll() }
		}

		// Small screens: every entry is readable, and the line draws as you scroll.
		const list = q('.resume-list')[0]
		gsap.fromTo(q('.resume-list-line'), { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: list, start: 'top 70%', end: 'bottom 70%', scrub: 0.4 } })
		q('.resume-entry').forEach((entry: Element) => {
			const arrive = { trigger: entry, start: 'top 84%', once: true }
			gsap.from(entry.querySelector('.resume-entry-logo'), { scale: 0.4, autoAlpha: 0, duration: 0.9, scrollTrigger: arrive })
			gsap.from(entry.querySelector('.resume-entry-card'), { y: 26, autoAlpha: 0, duration: 1, delay: 0.08, scrollTrigger: arrive })
		})
	}, [desktop])

	const select = (index: number) => {
		const pin = ScrollTrigger.getById('resume')
		if (!pin) {
			setActiveIndex(index)
			return
		}
		const top = pin.start + ((index + 0.5) / timelineData.length) * (pin.end - pin.start)
		if (window.__lenis) window.__lenis.scrollTo(top, { duration: 1 })
		else window.scrollTo(0, top)
	}

	return (
		<section id="resume" ref={sectionRef} className="section tone-2 tone-sep">
			<div className="container">
				<h2><span className="write">Resume</span><ResumeDownloadLink /></h2>
				{desktop ? <TimelineStepper activeIndex={activeIndex} onSelect={select} fillRef={fillRef} /> : <TimelineList />}
			</div>
		</section>
	)
})

function ResumeDownloadLink() {
	const [hovering, setHovering] = useState(false)
	const [pos, setPos] = useState({ x: 0, y: 0 })

	return (
		<>
			<span
				className="resume-dl-wrap"
				onMouseEnter={() => setHovering(true)}
				onMouseLeave={() => setHovering(false)}
				onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
			>
				<a href="/resume.pdf" download="Manuel_Pena_Morros_Resume.pdf" className="resume-dl" aria-label="Download Resume">
					<Download size={18} stroke={3} />
				</a>
			</span>
			{hovering && (
				<span className="resume-dl-tip-cursor" style={{ left: pos.x + 18, top: pos.y - 14 }}>
					Download
				</span>
			)}
		</>
	)
}

function Logo({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
	return (
		<div className={`logo-container ${className}`}>
			<img src={src} alt={alt} className="organization-logo" loading="lazy" decoding="async" />
		</div>
	)
}

type StepperProps = { activeIndex: number; onSelect: (i: number) => void; fillRef: React.RefObject<HTMLDivElement> }

function TimelineStepper({ activeIndex, onSelect, fillRef }: StepperProps) {
	const cardRef = useRef<HTMLDivElement>(null)
	const first = useRef(true)

	useLayoutEffect(() => {
		if (first.current) {
			first.current = false
			return
		}
		if (prefersReducedMotion() || !cardRef.current) return
		const entry = cardRef.current.querySelector('.timeline-card-entry.is-active')
		if (!entry) return
		const parts = entry.querySelectorAll(':is(.timeline-card-icon, .timeline-card-info > *, .tl-index, .tl-facts > div, .tl-points li)')
		const t = gsap.fromTo(parts, { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.045, overwrite: true })
		// his figures roll up from zero as the entry comes in
		const rolls = [...entry.querySelectorAll<HTMLElement>('.tl-fig')].map((el, k) => {
			const text = el.dataset.fig || el.textContent || ''
			const o = { f: 0 }
			el.textContent = countText(text, 0)
			return gsap.to(o, { f: 1, duration: 1.1, delay: 0.35 + k * 0.08, ease: 'power2.out', onUpdate: () => { el.textContent = countText(text, o.f) }, onComplete: () => { el.textContent = text } })
		})
		return () => {
			t.kill()
			rolls.forEach((r) => r.kill())
			entry.querySelectorAll<HTMLElement>('.tl-fig').forEach((el) => { el.textContent = el.dataset.fig || el.textContent })
		}
	}, [activeIndex])

	return (
		<div className="timeline-container">
			<div className="timeline-wrapper">
				<div className="timeline-track">
					<div className="timeline-line"></div>
					<div className="timeline-line-fill" ref={fillRef}></div>
					<div className="timeline-indicator" style={{ left: `${(activeIndex / (timelineData.length - 1)) * 100}%` }}></div>
					{timelineData.map((entry, index) => (
						<button
							key={entry.id}
							className={`timeline-point visible ${activeIndex === index ? 'active' : ''}`}
							style={{ left: `${(index / (timelineData.length - 1)) * 100}%` }}
							aria-label={`${entry.title}, ${entry.period}`}
							aria-pressed={activeIndex === index}
							onClick={() => onSelect(index)}
						>
							<div className="timeline-point-inner">
								<Logo src={entry.logo} alt="" className="timeline-point-logo" />
							</div>
							<div className="timeline-point-glow"></div>
							<span className="tl-node-name" aria-hidden="true">{shortOf(entry)}</span>
						</button>
					))}
				</div>
			</div>

			<div className="timeline-content">
				<div className="timeline-card has-map is-log" ref={cardRef}>
					{/* a light passes over the card each time it changes entry */}
					<span key={activeIndex} className="tl-sweep" aria-hidden="true" />
					{/* Every entry sits in the same cell, so the card is always as tall as the longest one and the section never jumps. */}
					<div className="timeline-card-stack">
						{timelineData.map((entry, index) => (
							<div key={entry.id} className={`timeline-card-entry${index === activeIndex ? ' is-active' : ''}`} aria-hidden={index !== activeIndex}>
								<div className="timeline-card-header">
									<div className="timeline-card-icon">
										<Logo src={entry.logo} alt={index === activeIndex ? `${entry.title} logo` : ''} className="timeline-card-logo" />
									</div>
									<div className="timeline-card-info">
										<h3>{entry.title}</h3>
										<p className="timeline-card-subtitle">{orgOf(entry) || entry.subtitle}</p>
									</div>
									<span className="tl-index" aria-hidden="true">{pad2(index + 1)}<i>/ {pad2(timelineData.length)}</i></span>
								</div>
								<Facts entry={entry} />
								<Points items={entry.achievements} />
							</div>
						))}
					</div>
					<div className="tl-map">
						<JourneyGlobe active={activeIndex} onSelect={onSelect} />
						<Leg index={activeIndex} />
					</div>
				</div>
			</div>

			<div className="timeline-navigation">
				{timelineData.map((entry, index) => (
					<button
						key={entry.id}
						className={`timeline-nav-btn ${activeIndex === index ? 'active' : ''}`}
						aria-label={`Go to ${entry.title}`}
						onClick={() => onSelect(index)}
					/>
				))}
			</div>
		</div>
	)
}

// Phones and tablets: the map plays his route by itself while it is on screen, then starts again.
function JourneyMapAuto() {
	const ref = useRef<HTMLDivElement>(null)
	const [active, setActive] = useState(0)
	useEffect(() => {
		const el = ref.current
		if (!el || prefersReducedMotion()) return
		let timer = 0, at = 0
		const step = () => {
			at = at >= timelineData.length - 1 ? 0 : at + 1
			setActive(at)
			timer = window.setTimeout(step, at === timelineData.length - 1 ? 3600 : at === 0 ? 1200 : 1700)
		}
		const io = new IntersectionObserver(([e]) => {
			window.clearTimeout(timer)
			if (e.isIntersecting) timer = window.setTimeout(step, 900)
		}, { threshold: 0.45 })
		io.observe(el)
		return () => { io.disconnect(); window.clearTimeout(timer) }
	}, [])
	const item = timelineData[active]
	return (
		<div className="journey-map-card" ref={ref}>
			<JourneyGlobe active={active} onSelect={setActive} />
			<p className="journey-map-caption"><span>{item.period}</span>{item.subtitle.replace(' | ', ' · ')}</p>
		</div>
	)
}

function TimelineList() {
	return (
		<>
		<JourneyMapAuto />
		<div className="resume-list">
			<span className="resume-list-line" aria-hidden="true"></span>
			{timelineData.map((item) => (
				<article key={item.id} id={`resume-${item.id}`} className="resume-entry">
					<div className="resume-entry-logo">
						<Logo src={item.logo} alt="" className="timeline-point-logo" />
					</div>
					<div className="resume-entry-card">
						<h3>{item.title}</h3>
						<p className="timeline-card-subtitle">{orgOf(item) || item.subtitle}</p>
						<Facts entry={item} />
						<Points items={item.achievements} />
					</div>
				</article>
			))}
		</div>
		</>
	)
}
