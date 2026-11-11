import { useEffect, useRef, useState } from 'react'
import { athleticsDocs, athleticsFederations, athleticsStagePhotos } from '../content'
import { gsap, isDesktop, isTouch, prefersReducedMotion, useMotion, whenBooted } from '../motion'

export default function Athletics() {
	const rootRef = useRef<HTMLDivElement>(null)

	useMotion(rootRef, () => {
		const q = gsap.utils.selector(rootRef.current)

		// The trophy rises into its light, then the medals come down one by one.
		const tl = gsap.timeline({ paused: true })
		tl.from(q('.athletics-spot'), { autoAlpha: 0, duration: 1.8, ease: 'power2.out' }, 0)
		tl.from(q('.athletics-trophy-wrap'), { y: 110, scale: 0.9, autoAlpha: 0, duration: 1.9 }, 0.15)
		q('.athletics-medal-inner').forEach((medal: Element, i: number) => {
			tl.fromTo(medal, { clipPath: 'inset(0% 0% 100% 0%)', autoAlpha: 0 }, { clipPath: 'inset(0% 0% 0% 0%)', autoAlpha: 1, duration: 1.8, clearProps: 'clipPath' }, 0.5 + i * 0.18)
		})
		whenBooted().then(() => tl.play())

		if (isDesktop()) {
			const leave = { trigger: q('.athletics-section')[0], start: 'top top', end: 'bottom top', scrub: true }
			gsap.to(q('.athletics-trophy-wrap'), { y: -50, ease: 'none', scrollTrigger: leave })
			q('.athletics-medal').forEach((medal: Element, i: number) => {
				gsap.to(medal, { y: i % 2 ? -110 : -60, ease: 'none', scrollTrigger: leave })
			})
		}

		q('.athletics-label').forEach((label: Element) => {
			gsap.from(label, { y: 18, autoAlpha: 0, duration: 1, scrollTrigger: { trigger: label, start: 'top 90%', once: true } })
		})
		gsap.from(q('.athletics-federations'), { autoAlpha: 0, duration: 1.2, scrollTrigger: { trigger: q('.athletics-federations')[0], start: 'top 92%', once: true } })
		gsap.from(q('.athletics-doc-card'), { y: 34, autoAlpha: 0, duration: 1.1, stagger: 0.09, scrollTrigger: { trigger: q('.athletics-docs-grid')[0], start: 'top 86%', once: true } })
	})

	return (
		<div ref={rootRef}>
			<section className="section athletics-section">
				<div className="athletics-content" aria-label="Athletics">
					<AthleticsShowcase />
				</div>
			</section>
			<AthleticsFederations />
			<AthleticsStageGallery />
			<AthleticsRecognitions />
		</div>
	)
}

// Round 3, the quick 3D idea: each medal is a real object on its ribbon. It has thickness (three darker copies
// stacked behind it), turns on the ribbon when the pointer brushes past, swings a little, spins right round on a
// click or tap, and catches the light as it turns. The trophy rocks slowly as if on a turntable and leans to the pointer.
function AthleticsMedal({ src, position, label }: { src: string; position: 'far-left' | 'mid-left' | 'mid-right' | 'far-right'; label: string }) {
	return (
		<div className={`athletics-medal athletics-medal--${position}`}>
			<div className="athletics-medal-inner">
				<div className="athletics-medal-turn" style={{ ['--medal' as string]: `url(${src})` }}>
					{[3, 2, 1].map((k) => <img key={k} src={src} alt="" aria-hidden="true" className="athletics-medal-edge" style={{ ['--z' as string]: `${-k * 1.6}px` }} decoding="async" />)}
					<img src={src} alt={label} className="athletics-medal-img" loading="eager" decoding="async" />
					<span className="athletics-medal-sheen" aria-hidden="true" />
				</div>
			</div>
			<div className="athletics-medal-tooltip">{label}</div>
		</div>
	)
}

/** Spring physics for the medals: twist (turning on the ribbon) and swing, one loop for all four, asleep at rest. */
function useMedals(ref: React.RefObject<HTMLDivElement>) {
	useEffect(() => {
		const root = ref.current
		if (!root || prefersReducedMotion()) return
		const medals = [...root.querySelectorAll<HTMLElement>('.athletics-medal')].map((el) => ({
			el,
			turn: el.querySelector<HTMLElement>('.athletics-medal-turn')!,
			twist: 0, spin: 0, swing: 0, sway: 0, // degrees, and degrees per second
			goal: 0, // where the twist settles: a full turn after a click
		}))
		let raf = 0, last = 0, visible = true
		const frame = (now: number) => {
			const dt = Math.min(0.05, last ? (now - last) / 1000 : 1 / 60)
			last = now
			let moving = false
			for (const m of medals) {
				// a click's full turn is damped harder, so it lands without spinning past
				const damp = m.goal !== 0 ? 7.6 : 3.4
				m.spin += (-(m.twist - m.goal) * 26 - m.spin * damp) * dt
				m.twist += m.spin * dt
				m.sway += (-m.swing * 11 - m.sway * 1.9) * dt
				m.swing += m.sway * dt
				if (Math.abs(m.twist - m.goal) < 0.08 && Math.abs(m.spin) < 0.6 && Math.abs(m.swing) < 0.08 && Math.abs(m.sway) < 0.5) {
					m.twist = 0; m.goal = 0; m.spin = 0; m.swing = 0; m.sway = 0
					m.turn.style.transform = ''
				} else {
					moving = true
					m.turn.style.transform = `rotateZ(${m.swing.toFixed(2)}deg) rotateY(${m.twist.toFixed(2)}deg)`
				}
				const rad = (m.twist * Math.PI) / 180
				m.turn.style.setProperty('--lit', (0.62 + 0.38 * Math.abs(Math.cos(rad))).toFixed(3))
				m.turn.style.setProperty('--sh', `${(50 - Math.sin(rad) * 120).toFixed(1)}%`)
				m.turn.style.setProperty('--sho', Math.min(1, Math.abs(Math.sin(rad)) * 2.2).toFixed(3))
			}
			raf = moving && visible ? requestAnimationFrame(frame) : 0
			if (!raf) last = 0
		}
		const wake = () => { if (!raf && visible) raf = requestAnimationFrame(frame) }
		const offs = medals.map((m) => {
			const move = (e: PointerEvent) => {
				if (e.pointerType !== 'mouse') return
				// brushing past turns it the way the pointer went, and sets it swinging a little
				const dx = Math.max(-60, Math.min(60, e.movementX))
				// a brush turns it so far and no further: its face stays towards the room
				if (Math.abs(m.twist - m.goal) < 40) m.spin = Math.max(-300, Math.min(300, m.spin + dx * 1.1))
				m.sway = Math.max(-40, Math.min(40, m.sway + dx * 0.14))
				wake()
			}
			const press = () => {
				// a full turn, onwards in the direction it is already turning
				const dir = m.spin >= 0 ? 1 : -1
				m.goal = m.twist + dir * 360
				m.spin += dir * 260
				wake()
			}
			m.el.addEventListener('pointermove', move)
			m.el.addEventListener('click', press)
			return () => { m.el.removeEventListener('pointermove', move); m.el.removeEventListener('click', press) }
		})
		const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) wake() })
		io.observe(root)
		return () => { cancelAnimationFrame(raf); io.disconnect(); offs.forEach((off) => off()) }
	}, [ref])
}

/** The trophy rocks slowly on its stand, leans to the pointer, and the light slides over its metal. */
function useTrophy(ref: React.RefObject<HTMLDivElement>) {
	useEffect(() => {
		const stage = ref.current
		const img = stage?.querySelector<HTMLElement>('.athletics-trophy-img')
		const sheen = stage?.querySelector<HTMLElement>('.athletics-trophy-sheen')
		if (!stage || !img || !sheen || prefersReducedMotion()) return
		gsap.set([img, sheen], { transformPerspective: 1300, transformOrigin: '50% 100%' })
		const ry = gsap.quickTo([img, sheen], 'rotationY', { duration: 1.1, ease: 'power3' })
		const rx = gsap.quickTo([img, sheen], 'rotationX', { duration: 1.1, ease: 'power3' })
		const sx = (v: number) => sheen.style.setProperty('--tx', `${v.toFixed(1)}%`)
		let hover = false
		const angle = { a: -1 }
		const rock = gsap.to(angle, {
			a: 1, duration: 3.6, ease: 'sine.inOut', yoyo: true, repeat: -1,
			onUpdate: () => { if (!hover) { ry(angle.a * 7); sx(50 - angle.a * 30) } },
		})
		const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) rock.resume(); else rock.pause() })
		io.observe(stage)
		if (isTouch()) return () => { rock.kill(); io.disconnect() }
		const move = (e: PointerEvent) => {
			hover = true
			const b = stage.getBoundingClientRect()
			const x = (e.clientX - b.left) / b.width - 0.5, y = (e.clientY - b.top) / b.height - 0.5
			ry(x * 26)
			rx(-y * 8)
			sx(50 - x * 90)
		}
		const leave = () => { hover = false; rx(0) }
		stage.addEventListener('pointermove', move)
		stage.addEventListener('pointerleave', leave)
		return () => { rock.kill(); io.disconnect(); stage.removeEventListener('pointermove', move); stage.removeEventListener('pointerleave', leave) }
	}, [ref])
}

function AthleticsShowcase() {
	const ref = useRef<HTMLDivElement>(null)
	useMedals(ref)
	return (
		<div className="athletics-showcase" ref={ref}>
			<AthleticsMedal src="/medal-1.webp" position="far-left" label="Gold — Champion, Fitnessmania INBA México" />
			<AthleticsMedal src="/medal-2.webp" position="mid-left" label="Silver — Runner-Up, INBA México National Qualifier" />
			<AthleticsTrophy />
			<AthleticsMedal src="/medal-3.webp" position="mid-right" label="Bronze — Third Place, INBA México National Qualifier" />
			<AthleticsMedal src="/medal-4.webp" position="far-right" label="Pro INBA Elite Medal — Natural Bodybuilding" />
		</div>
	)
}

function AthleticsTrophy() {
	const ref = useRef<HTMLDivElement>(null)
	useTrophy(ref)
	return (
		<div className="athletics-trophy-stage" ref={ref}>
			<div className="athletics-spot" aria-hidden="true"></div>
			<div className="athletics-trophy-wrap">
				<img src="/trophy.webp" alt="Trophy — 2nd Place, Mr. México Amateur" className="athletics-trophy-img" loading="eager" decoding="async" />
				<span className="athletics-trophy-sheen" aria-hidden="true" />
			</div>
			<div className="athletics-medal-tooltip">Trophy — 2nd Place, Mr. México Amateur (WABBA)</div>
		</div>
	)
}

function AthleticsStageGallery() {
	const galleryRef = useRef<HTMLDivElement>(null)

	useMotion(galleryRef, () => {
		const items = gsap.utils.toArray<HTMLElement>('.athletics-stage-item')
		const arrive = { trigger: galleryRef.current, start: 'top 75%', once: true }
		if (isDesktop()) {
			const slider = items.find((i) => i.classList.contains('athletics-stage-item--slider'))
			const rest = items.filter((i) => i !== slider)
			if (slider) gsap.from(slider, { x: () => window.innerWidth * 0.72, duration: 2.8, scrollTrigger: arrive })
			gsap.from(rest, { x: -32, autoAlpha: 0, duration: 1.5, stagger: 0.45, delay: 1.6, ease: 'power2.out', scrollTrigger: arrive })
			return
		}
		items.forEach((item) => {
			gsap.from(item, { y: 40, autoAlpha: 0, duration: 1.2, scrollTrigger: { trigger: item, start: 'top 86%', once: true } })
		})
	})

	return (
		<section className="athletics-stage-section" aria-label="Competition photos">
			<p className="athletics-label">On Stage</p>
			<div ref={galleryRef} className="athletics-stage-gallery">
				{athleticsStagePhotos.map((photo) => (
					<figure key={photo.src} className={`athletics-stage-item ${photo.slider ? 'athletics-stage-item--slider' : ''}`}>
						<div className="athletics-stage-spotlight" aria-hidden="true" />
						<img src={photo.src} alt={photo.caption} className={`athletics-stage-photo athletics-stage-photo--${photo.size}`} loading="lazy" decoding="async" />
						<div className="athletics-medal-tooltip">{photo.caption}</div>
					</figure>
				))}
			</div>
		</section>
	)
}

function AthleticsFederations() {
	return (
		<section className="athletics-federations" aria-label="Federations">
			<div className="athletics-fed-track">
				<div className="athletics-fed-scroll">
					{[0, 1, 2].map((s) =>
						athleticsFederations.map((f, j) => (
							<span key={`${s}-${j}`} className="athletics-fed-item">
								<img src={f.src} alt={s === 0 ? f.name : ''} loading="lazy" decoding="async" />
							</span>
						))
					)}
				</div>
			</div>
		</section>
	)
}

function AthleticsRecognitions() {
	return (
		<section className="athletics-recognitions" aria-label="Recognitions and certifications">
			<p className="athletics-label">Recognitions</p>
			<div className="athletics-docs-grid">
				{athleticsDocs.map((d) => (
					<a key={d.href} href={d.href} target="_blank" rel="noopener noreferrer" className="athletics-doc-card" data-tilt="4">
						<img src={d.preview} alt={d.label} loading="lazy" decoding="async" />
						<span>{d.label}</span>
					</a>
				))}
			</div>
		</section>
	)
}

export function AthleticsHomeButton() {
	const [hovering, setHovering] = useState(false)
	const [pos, setPos] = useState({ x: 0, y: 0 })

	return (
		<>
			<nav className="athletics-home-nav">
				<button
					className="athletics-home-badge"
					onClick={() => { window.location.href = '/' }}
					onMouseEnter={() => setHovering(true)}
					onMouseLeave={() => setHovering(false)}
					onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
					aria-label="Return to main page"
				>
					<span className="athletics-home-m" aria-hidden="true"></span>
					<span className="athletics-home-title">Athletics</span>
				</button>
			</nav>
			{hovering && (
				<span className="athletics-home-tip" style={{ left: pos.x + 18, top: pos.y - 14 }}>
					Return to main page
				</span>
			)}
		</>
	)
}
