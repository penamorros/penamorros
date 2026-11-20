// A quiet hint that the page goes on (the client, 2026-11-19): once the hero has settled, a thin chevron appears at the foot of the
// screen, dips once like a blink, and rests there, barely visible. A click scrolls on; the first scroll sends it away for good.
import { useEffect, useState } from 'react'
import { scrollToSection, whenHeroSettled } from '../motion'

export default function ScrollHint() {
	const [state, setState] = useState<'wait' | 'in' | 'gone'>('wait')
	useEffect(() => {
		let alive = true
		const gone = () => { if (alive) setState('gone'); off() }
		const onScroll = () => { if (window.scrollY > 8) gone() }
		const onWheel = (e: WheelEvent) => { if (e.deltaY > 0) gone() }
		const off = () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('wheel', onWheel); window.removeEventListener('touchmove', gone) }
		window.addEventListener('scroll', onScroll, { passive: true })
		window.addEventListener('wheel', onWheel, { passive: true })
		window.addEventListener('touchmove', gone, { passive: true })
		if (window.scrollY > 8) gone()
		whenHeroSettled().then(() => window.setTimeout(() => { if (alive) setState((s) => (s === 'wait' ? 'in' : s)) }, 600))
		return () => { alive = false; off() }
	}, [])
	if (state === 'wait') return null
	return (
		// a click does what a scroll would: on to the next section
		<button type="button" className={`scroll-hint${state === 'gone' ? ' is-gone' : ''}`} onClick={() => scrollToSection('values')} aria-label="Scroll down">
			<svg viewBox="0 0 24 12" aria-hidden="true"><path d="M2 2 L12 10 L22 2" /></svg>
		</button>
	)
}
