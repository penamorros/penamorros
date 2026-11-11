import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Moon, Sun } from './icons'
import { sections } from './content'
import { analytics } from './services/analytics'
import { isLiveSite } from './site-env'
import { ScrollTrigger, gsap, magnetic, resumeScroll, rewriteOnHover, scrollToSection, startSmoothScroll, tiltCards, useDesktop, whenBooted } from './motion'
import GridField from './motion/GridField'
import Cursor from './components/Cursor'
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

	useLayoutEffect(() => {
		if (!ready || !navRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
		const t = gsap.from(navRef.current, { autoAlpha: 0, duration: 1.2, delay: 0.5, clearProps: 'opacity,visibility' })
		return () => { t.kill() }
	}, [ready])

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
							<IconComponent size={20} />
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
					{colorMode ? <Sun size={20} /> : <Moon size={20} />}
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
