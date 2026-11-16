import React, { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Download } from '../icons'
import { timelineData } from '../content'
import { ScrollTrigger, gsap, prefersReducedMotion, resumeScroll, stopScroll, useDesktop, useMotion, writeIn } from '../motion'
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

const RESUME_URL = '/resume.pdf'
// How wide each grey line of the little paper résumé is, and which ones are headings.
const SHEET_LINES: Array<[number, boolean?]> = [[34, true], [92], [84], [70], [30, true], [88], [94], [62], [38, true], [80], [90], [54]]

/**
 * The client, 2026-11-16: "when downloading the resume make an animation 3D insane and then it opens the pdf in
 * another tab". The click lifts a paper résumé out of the button: it tumbles in from there in 3D with a trail behind
 * it, lands facing the reader while its lines write in and a light crosses it, then rushes at the screen — and the
 * PDF opens in a new tab. If the browser blocks that tab, the paper stays and offers a button instead.
 * Reduced motion, and ctrl/cmd-clicks, just open the PDF.
 */
function ResumeDownloadLink() {
	const [hovering, setHovering] = useState(false)
	const [pos, setPos] = useState({ x: 0, y: 0 })
	const [flight, setFlight] = useState<{ x: number; y: number; light: boolean } | null>(null)
	const [blocked, setBlocked] = useState(false)
	const overlayRef = useRef<HTMLDivElement>(null)

	const close = () => {
		resumeScroll()
		setFlight(null)
		setBlocked(false)
	}

	const launch = (e: React.MouseEvent<HTMLAnchorElement>) => {
		if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || prefersReducedMotion()) return
		e.preventDefault()
		if (flight) return
		const r = e.currentTarget.getBoundingClientRect()
		setHovering(false)
		setFlight({ x: r.left + r.width / 2, y: r.top + r.height / 2, light: !!document.querySelector('.app.color-mode') })
	}

	useLayoutEffect(() => {
		const root = overlayRef.current
		if (!flight || !root) return
		const q = gsap.utils.selector(root)
		const sheets = q('.rf-sheet') // the trail first, the real sheet last
		const ghosts = q('.rf-sheet.ghost')
		const dx = flight.x - window.innerWidth / 2
		const dy = flight.y - window.innerHeight / 2
		stopScroll()
		const tl = gsap.timeline()
		tl.fromTo(root, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: 'none' })
			// out of the button, tumbling; the real sheet leads and the trail follows
			.fromTo(sheets,
				{ x: dx, y: dy, scale: 0.05, rotationY: -540, rotationX: 75, rotationZ: -30 },
				{ x: 0, y: 0, scale: 1, rotationY: 0, rotationX: 0, rotationZ: 0, duration: 1.3, ease: 'expo.out', stagger: { each: 0.055, from: 'end' } }, 0)
			// the floor of the page's own grid tips up under it, and a reading line runs down the sheet
			.fromTo(q('.rf-floor'), { autoAlpha: 0, yPercent: 12 }, { autoAlpha: 1, yPercent: 0, duration: 0.9, ease: 'power2.out' }, 0.1)
			.fromTo(q('.rf-scan'), { yPercent: -100, autoAlpha: 1 }, { yPercent: 1250, duration: 0.75, ease: 'power1.inOut' }, 0.8)
			.set(q('.rf-scan'), { autoAlpha: 0 })
			.fromTo(q('.rf-line'), { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: 'power2.out', stagger: 0.035 }, 0.55)
			.to(ghosts, { autoAlpha: 0, duration: 0.3, ease: 'none' }, 1.15)
			.fromTo(q('.rf-shine'), { xPercent: -160 }, { xPercent: 160, duration: 0.7, ease: 'power2.inOut' }, 1.0)
			.fromTo(q('.rf-caption'), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0.9)
			// it leans back, then comes straight at the reader
			.to(sheets, { rotationX: -16, scale: 0.88, duration: 0.32, ease: 'power2.out' }, 1.6)
			.to(q('.rf-floor'), { autoAlpha: 0, duration: 0.4, ease: 'none' }, 1.85)
			.to(q('.rf-caption'), { autoAlpha: 0, duration: 0.2, ease: 'none' }, 1.85)
			.to(sheets, { rotationX: 0, scale: 9, duration: 0.5, ease: 'power4.in' }, 1.92)
			.to(q('.rf-flash'), { autoAlpha: 1, duration: 0.22, ease: 'power2.in' }, 2.2)
			.add(() => {
				const tab = window.open(RESUME_URL, '_blank')
				if (tab) {
					tab.opener = null
					return
				}
				// blocked: put the paper back and let the reader open it with a real click
				tl.pause()
				setBlocked(true)
				gsap.to(q('.rf-flash'), { autoAlpha: 0, duration: 0.3 })
				gsap.to(sheets[sheets.length - 1], { scale: 1, rotationX: 0, duration: 0.6, ease: 'expo.out' })
			}, 2.45)
			.to(root, { autoAlpha: 0, duration: 0.45, ease: 'none' }, 2.6)
			.add(close)
		return () => {
			tl.kill()
			resumeScroll()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [flight])

	// Escape closes it.
	useEffect(() => {
		if (!flight) return
		const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [flight])

	return (
		<>
			<span
				className="resume-dl-wrap"
				onMouseEnter={() => setHovering(true)}
				onMouseLeave={() => setHovering(false)}
				onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
			>
				<a href={RESUME_URL} target="_blank" rel="noopener noreferrer" className="resume-dl" aria-label="Open résumé (PDF) in a new tab" onClick={launch}>
					<Download size={15} stroke={2.6} />
					<span className="resume-dl-label">PDF</span>
				</a>
			</span>
			{hovering && !flight && (
				<span className="resume-dl-tip-cursor" style={{ left: pos.x + 18, top: pos.y - 14 }}>
					Download
				</span>
			)}
			{flight && createPortal(
				<div ref={overlayRef} className={`rf-overlay${flight.light ? ' light' : ''}`} onClick={close} aria-hidden={!blocked}>
					<div className="rf-floor"></div>
					<div className="rf-stage">
						{[0, 1, 2].map((g) => <div key={g} className="rf-sheet ghost"></div>)}
						<div className="rf-sheet">
							<span className="rf-name">Manuel Peña-Morros</span>
							<span className="rf-role">Résumé</span>
							<span className="rf-rule"></span>
							{SHEET_LINES.map(([w, head], i) => (
								<span key={i} className={`rf-line${head ? ' head' : ''}`} style={{ width: `${w}%` }}></span>
							))}
							<span className="rf-shine"></span>
							<span className="rf-scan"></span>
						</div>
					</div>
					<span className="rf-caption">resume.pdf</span>
					<div className="rf-flash"></div>
					{blocked && (
						<a href={RESUME_URL} target="_blank" rel="noopener noreferrer" className="rf-open" onClick={(e) => { e.stopPropagation(); close() }}>
							Open résumé ↗
						</a>
					)}
				</div>,
				document.body
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
