// A click on the empty page sends a soft ring of ink out from the pointer (the client, 2026-11-19: "bring back the ripple, without the
// grid lines"). Two rings, the second a beat behind, spreading and thinning out like a drop of ink in water. Only on the page itself:
// clicks on buttons, cards, the game and the chat do what they always did.
import { useEffect } from 'react'

const SKIP = 'button, a, input, textarea, select, label, [role="button"], [contenteditable], .project-card, .timeline-card, .newspaper-card, .flappy-game-area, .contact-card, .business-card, .photo-wrap, .coin, .chat-float, .twin-chat, .chat-sheet, .jet-guide, .left-nav, .value-icon, .values-visual, .carousel-indicators, iframe, video, canvas:not(.grid-field)'

export default function InkRipple() {
	useEffect(() => {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
		const onDown = (e: PointerEvent) => {
			if (e.button !== 0 || e.pointerType === 'touch') return
			const t = e.target as Element | null
			if (!t || t.closest(SKIP) || window.getSelection()?.toString()) return
			const drop = document.createElement('i')
			drop.className = 'ink-ripple'
			drop.setAttribute('aria-hidden', 'true')
			drop.style.left = `${e.clientX}px`
			drop.style.top = `${e.clientY}px`
			drop.innerHTML = '<b></b><b></b><b></b>'
			document.body.appendChild(drop)
			window.setTimeout(() => drop.remove(), 2200)
		}
		window.addEventListener('pointerdown', onDown, { passive: true })
		return () => window.removeEventListener('pointerdown', onDown)
	}, [])
	return null
}
