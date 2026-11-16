import { useEffect, useState } from 'react'
import { Calendar, MessageCircle, X } from '../icons'
import './chat-invite.css'

/**
 * The client, 2026-11-16: visitors scroll straight past the chat. Once the hero has left the screen — and only if the
 * chat hasn't been opened yet — a small pill stays in the corner: ask the AI twin, or book a call. One click takes
 * them back up with the chat open. It can be dismissed, and it never covers content or blocks scrolling.
 */
export default function ChatNudge() {
	const [away, setAway] = useState(false)
	const [done, setDone] = useState(false)

	useEffect(() => {
		const hero = document.getElementById('about')
		if (!hero) return
		const io = new IntersectionObserver(([e]) => setAway(!e.isIntersecting), { threshold: 0.15 })
		io.observe(hero)
		const used = () => setDone(true)
		window.addEventListener('chat:used', used)
		return () => { io.disconnect(); window.removeEventListener('chat:used', used) }
	}, [])

	const open = (meet: boolean) => window.dispatchEvent(new CustomEvent('chat:open', { detail: { meet } }))
	const on = away && !done

	return (
		<div className={`chat-nudge${on ? ' is-on' : ''}`} aria-hidden={!on || undefined} {...(on ? {} : { inert: '' })}>
			<span className="nudge-who" aria-hidden="true"><span className="nudge-face" /><i /></span>
			{/* two equal buttons, so "Ask my AI twin" reads as a choice and not as a label for the one beside it */}
			<button type="button" className="nudge-btn is-primary" onClick={() => open(false)}>
				<span className="nudge-ico"><MessageCircle size={14} /><i /></span>Ask my AI twin
			</button>
			<button type="button" className="nudge-btn" onClick={() => open(true)}><Calendar size={14} />Book a call</button>
			<button type="button" className="nudge-x" onClick={() => setDone(true)} aria-label="Hide"><X size={14} /></button>
		</div>
	)
}
