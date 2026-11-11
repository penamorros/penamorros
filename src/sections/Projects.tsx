import { memo, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, Coin, Clinic, FaceId, Play, TrendingUp, X } from '../icons'
import { projects } from '../content'
import { analytics } from '../services/analytics'
import { ScrollTrigger, drawIcons, gsap, pointerTilt, prefersReducedMotion, resumeScroll, revealFrame, stopScroll, useDesktop, useMotion, writeIn } from '../motion'

const STEP = 120
const START_INDEX = 1

const press = [
	{ i: '/press-el_universal_white.png', n: 'El Universal', u: 'https://www.eluniversal.com.mx/de-ultima/la-inteligencia-artificial-y-la-alta-tecnologia-tambien-cuidan-tu-cabello/' },
	{ i: '/press-skinsational_white.png', n: 'Skinsational', u: 'https://skinsational.com.mx/el-futuro-del-cuidado-capilar-ya-esta-aqui-la-era-de-tratar-el-pelo-como-piel/' },
	{ i: '/press-luxperience_white.png', n: 'Luxperience', u: 'https://luxperience.mx/2026/03/francisco-iglesias-haircare-ciencia-real-para-el-cuidado-capilar/' },
	{ i: '/press-the_editorial_mexico_white.png', n: 'The Editorial', u: 'https://theeditorialmexico.com/el-futuro-del-haircare-francisco-iglesias/' },
	{ i: '/press-quien_white.png', n: 'Quién', u: '' },
]

const mod = (n: number, m: number) => ((n % m) + m) % m

export default memo(function Projects() {
	const sectionRef = useRef<HTMLElement>(null)
	const carouselRef = useRef<HTMLDivElement>(null)
	const ringRef = useRef<HTMLDivElement>(null)
	const desktop = useDesktop()
	const [currentProjectIndex, setCurrentProjectIndex] = useState(START_INDEX)
	const [viewer, setViewer] = useState<string | null>(null)
	const angle = useRef({ value: -START_INDEX * STEP })
	const moved = useRef(false)

	// Reserve the projected height of the tallest card, including its video.
	// The front card is enlarged by the existing 1200px perspective / 220px orbit.
	useEffect(() => {
		const carousel = carouselRef.current, ring = ringRef.current
		if (!carousel || !ring) return
		if (!desktop) { carousel.style.removeProperty('height'); return }
		const items = Array.from(ring.children) as HTMLElement[]
		const measure = () => {
			const height = Math.max(...items.map(item => item.offsetHeight))
			carousel.style.height = `${Math.ceil(height * 1200 / (1200 - 220)) + 16}px`
			ScrollTrigger.refresh()
		}
		const observer = new ResizeObserver(measure)
		items.forEach(item => observer.observe(item))
		measure()
		return () => { observer.disconnect(); carousel.style.removeProperty('height') }
	}, [desktop])


	// Sets the turn and fades each card by how far it faces us, so a back card never shows mirrored text.
	const applyRing = () => {
		const ring = ringRef.current
		if (!ring) return
		ring.style.transform = `rotateY(${angle.current.value}deg)`
		ring.querySelectorAll<HTMLElement>('.project-item').forEach((item, i) => {
			const facing = Math.cos(((angle.current.value + i * STEP) * Math.PI) / 180)
			const face = Math.max(0, Math.min(1, facing * 1.6 + 0.1))
			item.style.setProperty('--face', face.toFixed(3))
			item.style.pointerEvents = face > 0.7 ? 'auto' : 'none'
		})
	}

	const turnTo = (value: number, duration = 1.25) => {
		setCurrentProjectIndex(mod(Math.round(-value / STEP), projects.length))
		if (prefersReducedMotion()) {
			angle.current.value = value
			applyRing()
			return
		}
		gsap.to(angle.current, { value, duration, overwrite: true, onUpdate: applyRing })
	}

	const nextProject = () => turnTo(Math.round(angle.current.value / STEP) * STEP - STEP)
	const prevProject = () => turnTo(Math.round(angle.current.value / STEP) * STEP + STEP)

	const goToCard = (index: number) => {
		if (desktop) {
			const near = Math.round(angle.current.value / 360) * 360 - index * STEP
			turnTo(near)
			return
		}
		const ring = ringRef.current
		const card = ring?.children[index] as HTMLElement | undefined
		if (ring && card) ring.scrollTo({ left: card.offsetLeft - (ring.clientWidth - card.offsetWidth) / 2, behavior: 'smooth' })
	}

	// Desktop: drag to turn. Small screens: the cards are a native swipe row, and the dots follow it.
	useEffect(() => {
		const ring = ringRef.current
		const area = carouselRef.current
		if (!ring || !area) return

		if (!desktop) {
			ring.style.transform = ''
			ring.querySelectorAll<HTMLElement>('.project-item').forEach((item) => {
				item.style.removeProperty('--face')
				item.style.pointerEvents = ''
			})
			const onScroll = () => {
				const centre = ring.scrollLeft + ring.clientWidth / 2
				let best = 0, dist = Infinity
				Array.from(ring.children).forEach((c, i) => {
					const el = c as HTMLElement
					const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - centre)
					if (d < dist) { dist = d; best = i }
				})
				setCurrentProjectIndex(best)
			}
			ring.addEventListener('scroll', onScroll, { passive: true })
			const card = ring.children[START_INDEX] as HTMLElement | undefined
			if (card) ring.scrollLeft = card.offsetLeft - (ring.clientWidth - card.offsetWidth) / 2
			return () => ring.removeEventListener('scroll', onScroll)
		}

		applyRing()
		let startX = 0, startAngle = 0, dragging = false
		const down = (e: PointerEvent) => {
			if ((e.target as Element).closest('a, button')) return
			dragging = true
			moved.current = false
			startX = e.clientX
			startAngle = angle.current.value
			gsap.killTweensOf(angle.current)
		}
		const move = (e: PointerEvent) => {
			if (!dragging) return
			const dx = e.clientX - startX
			if (Math.abs(dx) > 5) {
				moved.current = true
				area.classList.add('is-dragging')
			}
			angle.current.value = startAngle + dx * 0.32
			applyRing()
		}
		const up = (e: PointerEvent) => {
			if (!dragging) return
			dragging = false
			area.classList.remove('is-dragging')
			const dx = e.clientX - startX
			const flick = Math.abs(dx) > 40 ? Math.sign(dx) * 30 : 0
			turnTo(Math.round((angle.current.value + flick) / STEP) * STEP, 1)
		}
		area.addEventListener('pointerdown', down)
		window.addEventListener('pointermove', move)
		window.addEventListener('pointerup', up)
		return () => {
			area.removeEventListener('pointerdown', down)
			window.removeEventListener('pointermove', move)
			window.removeEventListener('pointerup', up)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [desktop])

	useMotion(sectionRef, () => {
		const section = sectionRef.current!
		const q = gsap.utils.selector(section)
		writeIn(q('.write')[0])

		if (desktop) {
			// The ring turns once as it arrives.
			const final = angle.current.value
			angle.current.value = final + 360
			applyRing()
			gsap.to(angle.current, { value: final, duration: 2.4, onUpdate: applyRing, scrollTrigger: { trigger: q('.projects-carousel')[0], start: 'top 75%', once: true } })
			gsap.from(q('.projects-carousel'), { autoAlpha: 0, y: 40, duration: 1.3, scrollTrigger: { trigger: q('.projects-carousel')[0], start: 'top 85%', once: true } })
			const untilt = pointerTilt(carouselRef.current!, q('.projects-tilt')[0], 3)
			return untilt
		}
		gsap.from(q('.project-item'), { y: 40, autoAlpha: 0, duration: 1.1, stagger: 0.1, scrollTrigger: { trigger: q('.projects-carousel')[0], start: 'top 82%', once: true } })
	}, [desktop])

	useMotion(sectionRef, () => {
		const q = gsap.utils.selector(sectionRef.current)
		gsap.from(q('.ll-sep'), { scaleX: 0, duration: 1.6, ease: 'power2.inOut', scrollTrigger: { trigger: q('.ll-sep')[0], start: 'top 88%', once: true } })
		gsap.from(q('.ll-head > *'), { y: 24, autoAlpha: 0, duration: 1, stagger: 0.1, scrollTrigger: { trigger: q('.ll-head')[0], start: 'top 86%', once: true } })
		revealFrame(q('.ll-video')[0], null, { from: 'inset(0% 100% 0% 0% round 12px)' })

		const kpis = q('.ll-kpis')[0]
		gsap.from(q('.ll-kpi'), { y: 26, autoAlpha: 0, duration: 1, stagger: 0.1, scrollTrigger: { trigger: kpis, start: 'top 86%', once: true } })
		drawIcons(kpis, { delay: 0.2, stagger: 0.05, scrollTrigger: { trigger: kpis, start: 'top 86%', once: true } })

		gsap.from(q('.ll-press'), { autoAlpha: 0, y: 18, duration: 1, scrollTrigger: { trigger: q('.ll-press')[0], start: 'top 92%', once: true } })

		// The press strip runs faster while the page moves.
		const strip = q('.ll-press-scroll')[0] as HTMLElement
		const stripAnim = strip?.getAnimations()[0]
		if (stripAnim) {
			const rate = { v: 1 }
			ScrollTrigger.create({
				trigger: q('.ll-press')[0],
				start: 'top bottom',
				end: 'bottom top',
				onUpdate: (self) => {
					gsap.to(rate, { v: 1 + Math.min(3, Math.abs(self.getVelocity()) / 700), duration: 0.3, overwrite: true, onUpdate: () => { stripAnim.playbackRate = rate.v } })
					gsap.to(rate, { v: 1, duration: 1.6, delay: 0.35, overwrite: false, onUpdate: () => { stripAnim.playbackRate = rate.v } })
				},
			})
		}

		const screens = q('.ll-sc')
		gsap.from(screens, { clipPath: 'inset(100% 0% 0% 0% round 10px)', duration: 1.2, stagger: 0.05, scrollTrigger: { trigger: q('.ll-screens-clip')[0], start: 'top 90%', once: true }, clearProps: 'clipPath' })
		if (desktop) {
			gsap.fromTo(q('.ll-screens'), { xPercent: 3 }, { xPercent: -3, ease: 'none', scrollTrigger: { trigger: q('.ll-screens-clip')[0], start: 'top bottom', end: 'bottom top', scrub: true } })
		}
	}, [desktop])

	// Videos play only while they are on screen.
	useEffect(() => {
		const videos = sectionRef.current?.querySelectorAll<HTMLVideoElement>('video[data-autoplay-on-visible]')
		if (!videos?.length) return
		const cleanups: Array<() => void> = []
		const obs = new IntersectionObserver((entries) => {
			entries.forEach((e) => {
				const v = e.target as HTMLVideoElement
				if (e.isIntersecting) {
					v.muted = true
					v.playbackRate = parseFloat(v.dataset.playbackRate || '1')
					const startAt = parseFloat(v.dataset.startAt || '0')
					if (startAt > 0 && v.currentTime < startAt) v.currentTime = startAt
					v.play().catch(() => {})
				} else {
					v.pause()
				}
			})
		}, { threshold: 0.3 })
		videos.forEach((v) => {
			const startAt = parseFloat(v.dataset.startAt || '0')
			if (startAt > 0) {
				const keepStart = () => {
					if (v.loop && v.currentTime < 0.3) v.currentTime = startAt
				}
				const onMeta = () => { if (v.currentTime < startAt) v.currentTime = startAt }
				v.addEventListener('timeupdate', keepStart)
				v.addEventListener('loadedmetadata', onMeta)
				cleanups.push(() => {
					v.removeEventListener('timeupdate', keepStart)
					v.removeEventListener('loadedmetadata', onMeta)
				})
			}
			obs.observe(v)
		})
		return () => {
			obs.disconnect()
			cleanups.forEach((fn) => fn())
		}
	}, [])

	return (
		<section id="projects" ref={sectionRef} className="section tone-1 tone-sep">
			<div className="container">
				<h2><span className="write">Projects</span></h2>
				<div className="projects-carousel-wrapper">
					<div className="projects-carousel" ref={carouselRef}>
						<div className="projects-tilt">
							<div className="projects-container" ref={ringRef}>
								{projects.map((project, index) => (
									<div key={project.id} className="project-item">
										{index === 2 ? (
											<img
												src="/diaita-preview.png"
												alt="Health Education Platform"
												className="project-video"
												style={{ borderRadius: '15px', objectFit: 'cover' }}
												loading="lazy"
												decoding="async"
											/>
										) : (
											<button
												className="project-video-button"
												aria-label={`Play the ${project.title} video`}
												onClick={() => {
													if (!moved.current) setViewer(index === 0 ? '/project-azteca.mp4' : '/bb.mp4')
												}}
											>
												<video muted loop playsInline preload="none" data-autoplay-on-visible data-playback-rate="2.5" className="project-video">
													<source src={index === 0 ? '/project-azteca.mp4' : '/bb.mp4'} type="video/mp4" />
												</video>
											</button>
										)}
										<div className="project-card">
											<h3 className="project-title">{project.title}</h3>
											<p className="project-description">{project.description}</p>
											<div className="project-technologies">
												{project.technologies.map((tech) => (
													<span key={tech} className="tech-tag">{tech}</span>
												))}
											</div>
											{project.title !== 'Health Education Platform' && (
												<div className="project-links">
													<a
														href={project.link}
														className="project-link"
														target="_blank"
														rel="noopener noreferrer"
														onClick={() => {
															analytics.trackProjectView(project.title)
															analytics.trackEvent('project_demo_click', { event_category: 'projects', event_label: project.title, project_url: project.link })
														}}
													>
														Live Demo
													</a>
													<a
														href={project.github}
														className="project-link"
														target="_blank"
														rel="noopener noreferrer"
														onClick={() => {
															analytics.trackEvent('project_github_click', { event_category: 'projects', event_label: project.title, github_url: project.github })
														}}
													>
														GitHub
													</a>
												</div>
											)}
										</div>
									</div>
								))}
							</div>
						</div>
						<button className="carousel-arrows carousel-prev" onClick={prevProject} aria-label="Previous project">
							<ChevronLeft size={24} />
						</button>
						<button className="carousel-arrows carousel-next" onClick={nextProject} aria-label="Next project">
							<ChevronRight size={24} />
						</button>
					</div>
					<div className="carousel-indicators">
						{projects.map((project, index) => (
							<button
								key={project.id}
								className={`carousel-indicator ${currentProjectIndex === index ? 'active' : ''}`}
								aria-label={`Show ${project.title}`}
								onClick={() => goToCard(index)}
							/>
						))}
					</div>
				</div>

				<div className="ll-sep"></div>

				<div className="ll-head">
					<img src="/lumina-app-icon.png" alt="Lumina Labs" className="ll-icon" loading="lazy" decoding="async" />
					<div>
						<span className="ll-name">Lumina Labs</span>
						<a
							href="https://apps.apple.com/us/app/lumina-labs/id6758263196"
							target="_blank"
							rel="noopener noreferrer"
							className="ll-store-badge"
							aria-label="Download Lumina Labs on the App Store"
						>
							<img src="/app-store-badge.png" alt="Download on the App Store" loading="lazy" decoding="async" />
						</a>
					</div>
				</div>

				<div className="ll-row">
					<LuminaPhone onOpen={() => setViewer('/lumina-demo.mp4')} />
					<LuminaKpis />
				</div>

				<div className="ll-press">
					<span className="ll-press-label">Featured In</span>
					<div className="ll-press-track">
						<div className="ll-press-scroll">
							{[0, 1, 2].map((s) =>
								press.map((p, j) =>
									p.u ? (
										<a key={s * 5 + j} href={p.u} target="_blank" rel="noopener noreferrer" className="ll-pi" tabIndex={s === 0 ? 0 : -1}>
											<img src={p.i} alt={s === 0 ? p.n : ''} className="ll-pl" loading="lazy" decoding="async" />
										</a>
									) : (
										<span key={s * 5 + j} className="ll-pi">
											<img src={p.i} alt={s === 0 ? p.n : ''} className="ll-pl" loading="lazy" decoding="async" />
										</span>
									)
								)
							)}
						</div>
					</div>
				</div>

				<div className="ll-screens-clip">
					<div className="ll-screens">
						{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
							<img key={n} src={`/ll-${n}.jpg`} alt={`Lumina Labs screenshot ${n}`} className="ll-sc" loading="lazy" decoding="async" />
						))}
					</div>
				</div>
			</div>

			{viewer && <VideoViewer src={viewer} onClose={() => setViewer(null)} />}
		</section>
	)
})

// Round 4: Lumina's demo plays on a 3D phone (src/phone3d/phone.ts) that turns a little with the scroll and leans to the pointer; a click, or
// the button, opens it in the viewer with sound. The flat video stays underneath: it feeds the phone's screen, and it is what shows without a
// real GPU or with reduced motion, exactly as before.
function LuminaPhone({ onOpen }: { onOpen: () => void }) {
	const wrap = useRef<HTMLDivElement>(null)
	const canvas = useRef<HTMLCanvasElement>(null)
	const video = useRef<HTMLVideoElement>(null)
	const [ready, setReady] = useState(false)

	useEffect(() => {
		const el = wrap.current, cv = canvas.current, v = video.current
		if (!el || !cv || !v || prefersReducedMotion()) return
		let gone = false
		let api: import('../phone3d/phone').PhoneApi | null = null
		const near = new IntersectionObserver(async ([e]) => {
			if (!e.isIntersecting) return
			near.disconnect()
			const { createPhone } = await import('../phone3d/phone')
			if (gone) return
			api = await createPhone(cv, v, () => !!document.querySelector('.app.color-mode')).catch(() => null)
			if (!api || gone) { api?.dispose(); api = null; return }
			api.setVisible(seenNow)
			setReady(true)
		}, { rootMargin: '600px 0px' })
		near.observe(el)
		let seenNow = false
		const seen = new IntersectionObserver(([e]) => { seenNow = e.isIntersecting; api?.setVisible(e.isIntersecting) })
		seen.observe(el)
		// where the block is on the way through the window: 0 entering at the bottom, 0.5 in the middle, 1 leaving at the top
		const onScroll = () => {
			if (!api) return
			const r = el.getBoundingClientRect()
			const p = (window.innerHeight - (r.top + r.height / 2)) / (window.innerHeight + r.height)
			api.setScroll(Math.max(0, Math.min(1, p * 1.0)))
		}
		window.addEventListener('scroll', onScroll, { passive: true })
		const ro = new ResizeObserver(() => api?.resize())
		ro.observe(cv)
		return () => {
			gone = true
			near.disconnect(); seen.disconnect(); ro.disconnect()
			window.removeEventListener('scroll', onScroll)
			api?.dispose()
		}
	}, [])

	return (
		<div ref={wrap} className={`ll-phone${ready ? ' is-ready' : ''}`}>
			<video ref={video} controls={!ready} muted loop={ready} playsInline preload="none" poster="/lumina-poster.jpg" className="ll-video" data-autoplay-on-visible data-start-at="7">
				<source src="/lumina-demo.mp4" type="video/mp4" />
			</video>
			<canvas ref={canvas} className="ll-phone-canvas" aria-hidden="true" onClick={onOpen} />
			{ready && (
				<button type="button" className="ll-phone-play" onClick={onOpen}>
					<Play size={14} />
					<span>Watch the demo</span>
				</button>
			)}
		</div>
	)
}

function VideoViewer({ src, onClose }: { src: string; onClose: () => void }) {
	const rootRef = useRef<HTMLDivElement>(null)
	const closeRef = useRef<HTMLButtonElement>(null)
	const onCloseRef = useRef(onClose)
	onCloseRef.current = onClose

	useEffect(() => {
		stopScroll()
		const opener = document.activeElement as HTMLElement | null
		const root = rootRef.current
		const clip = root?.querySelector('video')
		closeRef.current?.focus()
		const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current() }
		window.addEventListener('keydown', key)
		// fromTo + kill on cleanup: gsap.from alone can leave autoAlpha stuck at 0 (Strict Mode / remount).
		if (root && !prefersReducedMotion()) {
			gsap.fromTo(root, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, ease: 'power2.out', overwrite: true })
			if (clip) gsap.fromTo(clip, { scale: 0.93, y: 24 }, { scale: 1, y: 0, duration: 0.85, ease: 'power2.out', overwrite: true })
		} else if (root) {
			gsap.set(root, { autoAlpha: 1 })
		}
		return () => {
			if (root) {
				gsap.killTweensOf(root)
				gsap.set(root, { clearProps: 'opacity,visibility' })
			}
			if (clip) {
				gsap.killTweensOf(clip)
				gsap.set(clip, { clearProps: 'transform' })
			}
			resumeScroll()
			window.removeEventListener('keydown', key)
			opener?.focus()
		}
	}, [])

	// Port to body — Lenis/transforms on .app break position:fixed and the overlay opens off-screen.
	return createPortal(
		<div className="video-viewer" ref={rootRef} role="dialog" aria-modal="true" aria-label="Project video" onClick={() => onCloseRef.current()}>
			<button className="video-viewer-close" ref={closeRef} onClick={(e) => { e.stopPropagation(); onCloseRef.current() }} aria-label="Close video">
				<X size={20} />
			</button>
			<video
				src={src}
				controls
				autoPlay
				playsInline
				onLoadedMetadata={(e) => {
					if (src.includes('lumina-demo')) e.currentTarget.currentTime = 7
				}}
				onClick={(e) => e.stopPropagation()}
			/>
		</div>,
		document.body
	)
}

function LuminaKpis() {
	const ref = useRef<HTMLDivElement>(null)
	const [started, setStarted] = useState(false)
	const [progress, setProgress] = useState(0)

	useEffect(() => {
		const el = ref.current
		if (!el) return
		const obs = new IntersectionObserver(([entry]) => {
			if (entry.isIntersecting) {
				setStarted(true)
				obs.disconnect()
			}
		}, { threshold: 0.6 })
		obs.observe(el)
		return () => obs.disconnect()
	}, [])

	useEffect(() => {
		if (!started) return
		if (prefersReducedMotion()) {
			setProgress(1)
			return
		}
		let raf = 0
		const t0 = performance.now()
		const duration = 2800
		const tick = (t: number) => {
			const p = Math.min(1, (t - t0) / duration)
			// Ease-out so the ticking visibly slows as it approaches the final value
			setProgress(1 - Math.pow(1 - p, 2.2))
			if (p < 1) raf = requestAnimationFrame(tick)
		}
		raf = requestAnimationFrame(tick)
		return () => cancelAnimationFrame(raf)
	}, [started])

	return (
		<div ref={ref} className="ll-kpis">
			<div className="ll-kpi" data-tilt="4"><span className="ll-kpi-icon"><TrendingUp size={20} /></span><span className="ll-kpi-n">${(2.5 * progress).toFixed(1)}M</span><span className="ll-kpi-l">Valuation</span></div>
			<div className="ll-kpi" data-tilt="4"><span className="ll-kpi-icon"><Coin size={20} /></span><span className="ll-kpi-n">${Math.round(15 * progress)}K</span><span className="ll-kpi-l">MRR</span></div>
			<div className="ll-kpi" data-tilt="4"><span className="ll-kpi-icon"><FaceId size={20} /></span><span className="ll-kpi-n">{Math.round(1000 * progress).toLocaleString('en-US')}+</span><span className="ll-kpi-l">Analyses</span></div>
			<div className="ll-kpi" data-tilt="4"><span className="ll-kpi-icon"><Clinic size={20} /></span><span className="ll-kpi-n">{Math.round(5 * progress)}</span><span className="ll-kpi-l">Clinics</span></div>
		</div>
	)
}
