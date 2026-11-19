import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Moon, Sun } from './icons'
import { sections } from './content'
import { analytics } from './services/analytics'
import { isLiveSite } from './site-env'
import { ScrollTrigger, gsap, magnetic, resumeScroll, rewriteOnHover, scrollToSection, startSmoothScroll, tiltCards, useDesktop, whenBooted } from './motion'
import GridField from './motion/GridField'
import Cursor from './components/Cursor'
import JetGuide from './components/JetGuide'
import InkArt from './components/InkArt'
import InkRipple from './components/InkRipple'
import ScrollHint from './components/ScrollHint'
import './components/ink-art.css'
import './components/script-title.css'
import FooterSignature from './components/FooterSignature'
import Hero from './sections/Hero'
import Values from './sections/Values'
import SkillsGame from './sections/SkillsGame'
import Resume from './sections/Resume'
import Projects from './sections/Projects'
import Articles from './sections/Articles'
import Contact from './sections/Contact'
import Athletics, { AthleticsHomeButton } from './sections/Athletics'
import { avatar } from './avatar/link'

const AdminPage = lazy(() => import('./AdminPage'))

const isAthleticsPage = window.location.pathname.replace(/\/$/, '') === '/athletics'
const isAdminMode = isLiveSite && new URLSearchParams(window.location.search).get('admin') === 'true'

export default function App() {
	const [colorMode, setColorMode] = useState(false)
	const [active, setActive] = useState('about')
	const [ready, setReady] = useState(!window.__bootActive || !!window.__bootExited)
	const desktop = useDesktop()
	const navRef = useRef<HTMLElement>(null)

	useEffect(() => {
		window.dispatchEvent(new Event('app:mounted'))
		whenBooted().then(() => setReady(true))
		const stops = [
			startSmoothScroll(),
			// round 3: headings write again under the pointer, buttons lean towards it, cards tilt to it
			rewriteOnHover(),
			magnetic('.button, .chat-toggle, .carousel-prev, .carousel-next, .resume-dl, .project-video-button, .flappy-btn-restart, .video-viewer-close, .athletics-home-badge'),
			tiltCards(),
		]
		// HMR / prior scroll-lock experiments can leave Lenis stopped and pins stuck fixed.
		resumeScroll()
		requestAnimationFrame(() => ScrollTrigger.refresh())
		return () => stops.forEach((stop) => stop())
	}, [])

	// Suit + lights follow the page theme in every avatar iframe.
	useEffect(() => {
		avatar.send({ t: 'theme', light: colorMode })
		document.querySelectorAll<HTMLIFrameElement>('iframe[src*="avatar.html"]').forEach((el) => {
			el.contentWindow?.postMessage({ t: 'theme', light: colorMode }, location.origin)
		})
	}, [colorMode])

	// Everything that measures the page runs again once the fonts and images have settled it.
	useEffect(() => {
		const refresh = () => ScrollTrigger.refresh()
		document.fonts?.ready.then(refresh)
		window.addEventListener('load', refresh)
		return () => window.removeEventListener('load', refresh)
	}, [])

	// Analytics runs only on the real site, and only once the page has settled.
	useEffect(() => {
		if (!isLiveSite) return
		const start = () => {
		analytics.initialize()
		analytics.trackPageView(window.location.pathname)
		}
		if (typeof window.requestIdleCallback === 'function') {
			const id = window.requestIdleCallback(start, { timeout: 4000 })
			return () => window.cancelIdleCallback(id)
		}
		const id = window.setTimeout(start, 2500)
		return () => window.clearTimeout(id)
	}, [])

	useEffect(() => {
			analytics.trackSectionNavigation(active)
	}, [active])

	// Which section the rail marks as current
	useEffect(() => {
		const handler = () => {
			const scrollMiddle = window.scrollY + window.innerHeight / 3
			for (const s of sections) {
				const el = document.getElementById(s.id)
				if (!el) continue
				const { top, height } = el.getBoundingClientRect()
				const y = top + window.scrollY
				if (scrollMiddle >= y && scrollMiddle < y + height) {
					setActive(s.id)
					break
				}
			}
		}
		window.addEventListener('scroll', handler, { passive: true })
		handler()
		return () => window.removeEventListener('scroll', handler)
	}, [])

	// The seam line above a section draws when it arrives. Decoration loops rest while their section is off screen.
	useEffect(() => {
		const seams = new IntersectionObserver((entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						entry.target.classList.add('in')
					seams.unobserve(entry.target)
				}
			}
		}, { threshold: 0.05 })
		const rest = new IntersectionObserver((entries) => {
			for (const entry of entries) entry.target.classList.toggle('is-offscreen', !entry.isIntersecting)
		}, { rootMargin: '10% 0px' })
		document.querySelectorAll('.section').forEach((el) => {
			seams.observe(el)
			rest.observe(el)
		})
		return () => {
			seams.disconnect()
			rest.disconnect()
		}
	}, [])

	// The rail's marker slides to the current section.
	useLayoutEffect(() => {
		const nav = navRef.current
		const item = nav?.querySelector<HTMLElement>('.nav-item.active')
		if (!nav || !item) return
		const x = desktop ? 0 : item.offsetLeft + (item.offsetWidth - 20) / 2
		const y = desktop ? item.offsetTop + (item.offsetHeight - 20) / 2 : 0
		nav.style.setProperty('--ix', `${x}px`)
		nav.style.setProperty('--iy', `${y}px`)
	}, [active, desktop])

	// The rail stays hidden while the hero sets itself; at the first scroll his initial appears as a small glass pill and the bar unfolds
	// from it, up and down, the initial carried up by the bar's top edge and the icons arriving once it has passed (the client,
	// 2026-11-19). Phones keep the fade.
	useLayoutEffect(() => {
		const nav = navRef.current
		if (!nav) return
		const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
		if (!desktop || still) {
			if (!ready || still) return
			const t = gsap.from(nav, { autoAlpha: 0, duration: 1.2, delay: 0.5, clearProps: 'opacity,visibility' })
			return () => { t.kill() }
		}
		const logo = nav.querySelector<HTMLElement>('.nav-logo')
		const rest = nav.querySelectorAll<HTMLElement>(':scope > :not(.nav-logo)')
		const w = nav.offsetWidth, h = nav.offsetHeight
		const half = Math.max(0, (h - w) / 2)
		const lc = logo ? logo.offsetTop + logo.offsetHeight / 2 : 0
		// one frame of the opening, t from 0 (the pill) to 1 (the bar)
		const pose = (t: number) => {
			const v = half * (1 - t)
			const r = w / 2 + (Math.min(25, w / 2) - w / 2) * t
			nav.style.clipPath = `inset(${v.toFixed(2)}px 0px ${v.toFixed(2)}px 0px round ${r.toFixed(2)}px)`
			// the initial stays in the middle of what is open until the top edge reaches it, then rides up with the edge
			const at = Math.min(h / 2, v + lc)
			if (logo) logo.style.transform = `translate3d(0, ${(at - lc).toFixed(2)}px, 0)`
		}
		// the initial's own hover transition would make it trail the opening: off while it moves
		if (logo) logo.style.transition = 'none'
		gsap.set(nav, { autoAlpha: 0 })
		gsap.set(rest, { autoAlpha: 0 })
		pose(0)
		if (!ready) return
		let tl: gsap.core.Timeline | undefined
		let unfolded = false
		const unfold = () => {
			if (unfolded) return
			unfolded = true
			off()
			const open = { t: 0 }
			tl = gsap.timeline({ onComplete: () => { nav.style.clipPath = ''; if (logo) { logo.style.transform = ''; requestAnimationFrame(() => { logo.style.transition = '' }) } gsap.set(rest, { clearProps: 'opacity,visibility,transform' }) } })
			// the pill appears with a little spring, then opens
			tl.fromTo(nav, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(2)', clearProps: 'scale' })
			tl.to(open, { t: 1, duration: 1, ease: 'power3.inOut', onUpdate: () => pose(open.t) }, 0.4)
			tl.fromTo(rest, { autoAlpha: 0, y: -6 }, { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.04, ease: 'power2.out' }, 0.9)
		}
		const onScroll = () => { if (window.scrollY > 8) unfold() }
		const onKey = (e: KeyboardEvent) => { if ([' ', 'ArrowDown', 'PageDown', 'End'].includes(e.key)) unfold() }
		const off = () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('wheel', unfold); window.removeEventListener('touchmove', unfold); window.removeEventListener('keydown', onKey) }
		window.addEventListener('scroll', onScroll, { passive: true })
		window.addEventListener('wheel', unfold, { passive: true })
		window.addEventListener('touchmove', unfold, { passive: true })
		window.addEventListener('keydown', onKey)
		if (window.scrollY > 8) unfold()
		return () => { off(); tl?.kill(); if (logo) { logo.style.transition = ''; logo.style.transform = '' } nav.style.clipPath = '' }
	}, [ready, desktop])

	if (isAdminMode) {
		return (
			<Suspense fallback={null}>
				<AdminPage />
			</Suspense>
		)
	}

	return (
		<div className={`app ${colorMode ? 'color-mode' : ''}${isAthleticsPage ? ' athletics-page' : ''}`}>
			<GridField light={colorMode} />
			<Cursor colorMode={colorMode} />
			{/* the jetpack guide replaces the old corner capsule ("Book a call / Ask my AI twin") */}
			{!isAthleticsPage && <JetGuide />}

			{!isAthleticsPage && ready && createPortal(
				<>
					<div className="page-edge-line-wrap top" aria-hidden="true">
						<div className="page-edge-line" />
					</div>
					<div className="page-edge-line-wrap bottom" aria-hidden="true">
						<div className="page-edge-line" />
					</div>
				</>,
				document.body
			)}
			
			{isAthleticsPage ? (
				<AthleticsHomeButton />
			) : (
				<nav className="left-nav" ref={navRef} aria-label="Sections">
					<span className="nav-indicator" aria-hidden="true"></span>

					<button className="nav-logo" onClick={() => scrollToSection('about')} aria-label="Home"></button>

				<div className="nav-divider"></div>
				
					{sections.map((section) => {
					const IconComponent = section.icon
					return (
						<button
							key={section.id}
							className={`nav-item ${active === section.id ? 'active' : ''}`}
								onClick={() => scrollToSection(section.id)}
							aria-label={section.label}
								aria-current={active === section.id ? 'true' : undefined}
						>
							{/* drawn with a calligraphy nib, to match the titles (public/icons); the plain icon stays as the fallback */}
							<span className="nav-ink" aria-hidden="true" style={{ ['--icon' as string]: `url(/icons/${section.id === 'about' ? 'home' : section.id}.webp)` }} />
							<IconComponent size={20} className="nav-plain" />
						</button>
					)
				})}
				
				<div className="nav-divider"></div>
				
				<button 
					className="nav-theme-toggle" 
					onClick={() => {
						analytics.trackEvent('theme_toggle', {
							event_category: 'ui',
							event_label: colorMode ? 'light_mode' : 'dark_mode'
						})
						setColorMode(!colorMode)
					}}
					aria-label="Toggle theme"
				>
					<span className="nav-ink" aria-hidden="true" style={{ ['--icon' as string]: `url(/icons/${colorMode ? 'sun' : 'moon'}.webp)` }} />
					{colorMode ? <Sun size={20} className="nav-plain" /> : <Moon size={20} className="nav-plain" />}
				</button>
			</nav>
			)}

			<main className="main">
				{isAthleticsPage ? (
					<Athletics />
				) : (
				<>
						<Hero scrollTo={scrollToSection} interactive={ready} />
						<Values />
						<SkillsGame />
						<Resume />
						<Projects />
						<Articles />
						<Contact />
				</>
				)}
			</main>

			{!isAthleticsPage && <InkArt />}
			<InkRipple />
			{!isAthleticsPage && <ScrollHint />}

			{!isAthleticsPage && (
			<footer className="site-footer">
				<div className="container">
						<FooterSignature />
					<p className="muted">© {new Date().getFullYear()} Manuel Peña Morros. All rights reserved.</p>
				</div>
			</footer>
			)}
		</div>
	)
}
