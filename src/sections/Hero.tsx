import { memo, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUp, Check, Copy, X } from '../icons'
import { CHAT_SYSTEM_PROMPT } from '../content'
import { analytics } from '../services/analytics'
import { isLiveSite, saveChatMessage } from '../site-env'
import { gsap, SplitText, isDesktop, pointerTilt, resumeScroll, stopScroll, useDesktop, useMotion, whenBooted, whenHeroSettled, writeIn } from '../motion'
import { AvatarFrame, ChatBeam, avatar, beam } from '../avatar/link'
import ChatInvite from '../components/ChatInvite'
import MeetingPicker from '../components/MeetingPicker'
import { FIRST_QUESTIONS, nextQuestions, rememberQuestion } from '../followups'
import { Calendar, MessageCircle } from '../icons'
import { Brain, SUGGEST } from '../brain'

type Props = { scrollTo: (id: string) => void; interactive: boolean }
type Message = { role: string; content: string; meet?: boolean }
// Questions that are really "can we talk?": his answer comes with a button to book the call.
const WANTS_CALL = /\b(hir(e|ing)|intern(ship)?s?|recruit\w*|interview|job|role|position|opportunit\w*|freelance|collab\w*|work(ing)? (with|together)|meet(ing)?|call|schedule|talk to (you|him|manuel)|reach (you|him)|contact|available|availability)\b/i

/** Manuel + the value behind each letter — loops forever on the hero. */
const HERO_WORDS = ['Manuel', 'Motivation', 'Ambition', 'Nobility', 'Understanding', 'Excellence', 'Leadership'] as const
const MANUEL_LETTERS = ['M', 'A', 'N', 'U', 'E', 'L'] as const

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x))
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Real answers use the existing Netlify function and server-side key, including through Vite's local proxy.
async function liveReply(history: Message[]): Promise<string | null> {
	try {
		const response = await fetch('/.netlify/functions/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: 'gpt-5.6-terra',
				messages: [{ role: 'system', content: CHAT_SYSTEM_PROMPT }, ...history],
				max_tokens: 200,
				temperature: 0.4
			})
		})
		const responseText = await response.text()
		if (!responseText) return null
		let data: any
		try {
			data = JSON.parse(responseText)
		} catch {
			return null
		}
		if (!response.ok || !data.choices?.[0]) return null
		return data.choices[0].message.content as string
	} catch {
		return null
	}
}

// His answer arrives word by word, each word fading in out of a soft blur, about 1.6 s for a long one.
// Pure CSS: the words are spans with staggered delays, so a re-render never replays them.
function Streamed({ text }: { text: string }) {
	const parts = text.split(/(\s+)/)
	const count = parts.filter((w) => w.trim()).length
	const step = Math.min(55, 1600 / Math.max(1, count))
	let n = 0
	return (
		<>
			{parts.map((w, i) => (w.trim() ? <span key={i} className="tc-w" style={{ animationDelay: `${Math.round(n++ * step)}ms` }}>{w}</span> : w))}
		</>
	)
}
const streamMs = (text: string) => {
	const count = text.split(/\s+/).filter(Boolean).length
	return Math.round(Math.min(55, 1600 / Math.max(1, count)) * count) + 450
}

export default memo(function Hero({ scrollTo, interactive }: Props) {
	const sectionRef = useRef<HTMLElement>(null)
	const desktop = useDesktop()
	const [photoHovered, setPhotoHovered] = useState(false)
	const [chatOpen, setChatOpen] = useState(false)
	// The call picker takes the conversation's place inside the panel while it is open.
	const [meet, setMeet] = useState(false)
	useEffect(() => {
		if (!chatOpen) setMeet(false)
		else window.dispatchEvent(new Event('chat:used')) // the corner nudge retires once the chat has been opened
	}, [chatOpen])
	// Anything on the page can open the chat (or go straight to booking a call): window.dispatchEvent(new CustomEvent('chat:open', { detail: { meet: true } }))
	useEffect(() => {
		const open = (e: Event) => {
			scrollTo('about')
			setAvatarWanted(true)
			setChatOpen(true)
			setMeet(!!(e as CustomEvent).detail?.meet)
		}
		window.addEventListener('chat:open', open)
		return () => window.removeEventListener('chat:open', open)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])
	const [chatMessages, setChatMessages] = useState<Message[]>([])
	const [currentMessage, setCurrentMessage] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	// He is typing an answer (the dots show); isLoading covers the whole exchange.
	const [typing, setTyping] = useState(false)
	// what he's doing, under his name, as in a messaging app
	const [status, setStatus] = useState<'online' | 'reading…' | 'typing…'>('online')
	// Offline fact fallback for previews when the hosted function cannot be reached.
	const brain = useRef<Brain | null>(null)
	const writingTimer = useRef(0)
	const [chatSessionId, setChatSessionId] = useState('')
	// Loads when the pointer nears the portrait, then stays: the coin's back is still in view while it flips away.
	const [avatarWanted, setAvatarWanted] = useState(false)
	// Round 4b: the title turns to chrome once it has written itself in. Before that it is plain white, which is what the page's first
	// paint (and Lighthouse's LCP) sees: chrome is text painted through a clipped background, which Lighthouse counts much later.
	const [lit, setLit] = useState(false)
	const [heroSettled, setHeroSettled] = useState(false)
	const [wordIndex, setWordIndex] = useState(0)
	useEffect(() => {
		if (!lit && !reducedMotion()) return
		let alive = true
		whenHeroSettled().then(() => { if (alive) setHeroSettled(true) })
		return () => { alive = false }
	}, [lit])
	const canPreview = interactive && heroSettled


	// Prefetch the 3D twin as soon as a desktop visitor moves after boot (no delay — coin flip must not show an empty back).
	useEffect(() => {
		if (!desktop || avatarWanted) return
		let alive = true
		const go = () => { window.removeEventListener('pointermove', go); if (alive) setAvatarWanted(true) }
		whenBooted().then(() => { if (alive) window.addEventListener('pointermove', go, { passive: true }) })
		return () => { alive = false; window.removeEventListener('pointermove', go) }
	}, [desktop, avatarWanted])

	// Round 4b: follow-up questions after an answer (from his own facts, so on the preview only), the box's state, a copied answer
	const [follow, setFollow] = useState<string[]>(FIRST_QUESTIONS)
	// what this conversation has already asked, so the follow-up questions never repeat it
	const asked = useRef(new Set<string>())
	const [boxFocus, setBoxFocus] = useState(false)
	const [boxTall, setBoxTall] = useState(false)
	const [copied, setCopied] = useState(-1)
	const logRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLTextAreaElement>(null)

	// Initialize chat session ID when chat is first opened
	useEffect(() => {
		if (chatOpen && !chatSessionId) {
			const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
			setChatSessionId(sessionId)
			analytics.trackChatEvent('chat_opened', { sessionId })
		}
	}, [chatOpen, chatSessionId])

	const scrollMessages = () => {
		setTimeout(() => {
			const log = logRef.current
			if (log) log.scrollTo({ top: log.scrollHeight, behavior: reducedMotion() ? 'auto' : 'smooth' })
		}, 60)
	}

	// The box grows from a pill into a card while you write more than a line, and back when it's sent.
	const fitBox = () => {
		const el = inputRef.current
		if (!el) return
		el.style.height = 'auto'
		const h = Math.min(el.scrollHeight, 96)
		el.style.height = `${h}px`
		setBoxTall(h > 30)
	}

	// One exchange, as in Version B: the message flies to the phone in his hand, it buzzes, he reads it, types for as long as the answer
	// takes, the answer flies back, he looks up and nods.
	const sendMessage = async (given?: string) => {
		const text = (given ?? currentMessage).trim()
		if (!text || isLoading) return

		const userMessage = { role: 'user', content: text }
		const newMessages = [...chatMessages, userMessage]
		setChatMessages(newMessages)
		setCurrentMessage('')
		setFollow([])
		rememberQuestion(asked.current, text)
		requestAnimationFrame(fitBox)
		setIsLoading(true)
		scrollMessages()
		window.clearTimeout(writingTimer.current)
		avatar.send({ t: 'writing', on: false })
		if (isLiveSite) {
			analytics.trackChatEvent('message_sent', { messageLength: text.length, sessionId: chatSessionId })
			saveChatMessage({ role: 'user', content: text, sessionId: chatSessionId })
		}

		// the bubble is on the page next frame; then the spark runs from it to the phone
		await wait(40)
		await beam.fly(1, 560)
		avatar.send({ t: 'heard' })
		setStatus('reading…')
		// he reads it: longer messages take longer
		if (!reducedMotion()) await wait(clamp(320 + text.length * 22, 420, 1500))
		avatar.send({ t: 'typing', on: true })
		setTyping(true)
		setStatus('typing…')
		scrollMessages()

		let parts: string[]
		let kind = 'answer'
		let topic = ''
		const started = performance.now()
		const live = await liveReply(newMessages)
		if (live) {
			parts = [live]
			if (isLiveSite) {
				analytics.trackChatEvent('ai_response_received', { responseLength: live.length, sessionId: chatSessionId })
				saveChatMessage({ role: 'assistant', content: live, sessionId: chatSessionId })
			}
		} else if (isLiveSite) {
			const content = "Sorry, I'm having trouble connecting right now. Try again in a moment."
			parts = [content]
			saveChatMessage({ role: 'assistant', content, sessionId: chatSessionId })
		} else {
			brain.current ||= new Brain()
			const r = brain.current.reply(text)
			parts = r.parts
			kind = r.kind
			topic = r.topic
		}

		// a long answer comes as two messages, each with its own typing
		let shown: Message[] = newMessages
		for (let i = 0; i < parts.length; i++) {
			const typingFor = clamp(parts[i].length * 20, 650, 3000)
			const passed = i === 0 ? performance.now() - started : 0
			if (!reducedMotion() && typingFor > passed) await wait(typingFor - passed)
			shown = [...shown, { role: 'assistant', content: parts[i], meet: i === parts.length - 1 && WANTS_CALL.test(text) }]
			setChatMessages(shown)
			setTyping(false)
			scrollMessages()
			await wait(40)
			beam.fly(-1, 520)
			// the words stream in; a second part waits for the first to finish, with its own typing
			if (i < parts.length - 1 && !reducedMotion()) {
				await wait(streamMs(parts[i]))
				setTyping(true)
				scrollMessages()
				await wait(320)
			}
		}
		setTyping(false)
		setStatus('online')
		avatar.send({ t: 'typing', on: false })
		avatar.send({ t: 'answered', kind })
		setIsLoading(false)
		// follow-ups under every answer, live or preview: related to what was just said, never one already asked
		setFollow(nextQuestions(text, parts.join(' '), asked.current))
		if (isDesktop()) window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 30)
	}

	const copyAnswer = async (i: number, text: string) => {
		try {
			await navigator.clipboard.writeText(text)
			setCopied(i)
			window.setTimeout(() => setCopied((c) => (c === i ? -1 : c)), 1600)
		} catch {}
	}

	// The line of light starts from the newest message (or the typing dots, or the greeting).
	useEffect(() => {
		if (!chatOpen) return
		const id = window.setTimeout(() => {
			const log = logRef.current
			const rows = log ? [...log.querySelectorAll<HTMLElement>('.tc-msg')] : []
			const last = rows[rows.length - 1]
			beam.aim(last?.querySelector<HTMLElement>('.tc-pill, .tc-text, .dots') ?? log?.querySelector<HTMLElement>('.tc-hello-q') ?? null)
		}, 30)
		return () => window.clearTimeout(id)
	}, [chatMessages, typing, chatOpen, desktop])

	// Escape closes the chat; opening it on a desktop puts the cursor in the box once the coin has turned.
	useEffect(() => {
		if (!chatOpen) return
		const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setChatOpen(false) }
		window.addEventListener('keydown', onKey)
		const t = desktop ? window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 750) : 0
		return () => { window.removeEventListener('keydown', onKey); window.clearTimeout(t) }
	}, [chatOpen, desktop])

	// The chat closed: he lowers the phone.
	useEffect(() => {
		if (!chatOpen) avatar.send({ t: 'closed' })
	}, [chatOpen])

	useMotion(sectionRef, () => {
		const section = sectionRef.current!
		const q = gsap.utils.selector(section)
		const tl = gsap.timeline({ paused: true })

		const titleWord = q('.title-word')[0] as HTMLElement | undefined
		if (titleWord) tl.add(writeIn(titleWord, { duration: 1.05, scrollTrigger: false }), 0)

		const split = SplitText.create(q('.subtitle'), { type: 'lines', mask: 'lines', aria: 'none' })
		tl.from(split.lines, { yPercent: 110, duration: 1, stagger: 0.08, onComplete: () => split.revert() }, 0.85)

		const buttons = q('.cta-row .button')
		gsap.set(buttons, { transition: 'none' })
		tl.from(buttons, { y: 24, autoAlpha: 0, duration: 0.9, stagger: 0.09, clearProps: 'transform,opacity,visibility,transition' }, 1.1)

		tl.fromTo(q('.portrait-ring circle'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.7, ease: 'power2.inOut' }, 0)
		tl.to(q('.portrait-ring'), { autoAlpha: 0, duration: 0.8 }, 1.7)
		tl.from(q('.hero-photo'), { scale: 1.14, duration: 2.1 }, 0)

		let alive = true
		let loop: gsap.core.Tween | undefined
		let loopStarted = false
		const startWordLoop = () => {
			if (!alive || loopStarted || !titleWord || reducedMotion()) return
			loopStarted = true
			setWordIndex(0)
			let i = 0
			const swap = () => {
				if (!alive || !titleWord) return
				i = (i + 1) % HERO_WORDS.length
				gsap.to(titleWord, {
					autoAlpha: 0,
					y: -8,
					duration: 0.12,
					ease: 'power2.in',
					onComplete: () => {
						if (!alive || !titleWord) return
						titleWord.textContent = HERO_WORDS[i]
						setWordIndex(i)
						gsap.fromTo(titleWord, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.16, ease: 'power2.out' })
					},
				})
			}
			// First swap right as the hero settles — don’t wait for a long beat.
			loop = gsap.delayedCall(0.2, function tick() {
				swap()
				if (alive) loop = gsap.delayedCall(1.7, tick)
			})
		}
		// The words start turning only once the signature's particles have settled into the portrait (the client,
		// 2026-11-16): before that the visitor is watching the particles and would miss "Manuel" and the first words.
		tl.eventCallback('onComplete', () => {
			if (alive) setLit(true)
		})
		whenHeroSettled().then(startWordLoop)
		whenBooted().then(() => { if (alive) tl.play() })

		if (isDesktop()) {
			const leave = { trigger: section, start: 'top top', end: 'bottom top', scrub: true }
			gsap.to(q('.hero-visual'), { y: 70, scale: 0.95, ease: 'none', scrollTrigger: leave })
			gsap.to(q('.hero-copy'), { y: -36, opacity: 0.2, ease: 'none', scrollTrigger: leave })
		}

		const untilt = pointerTilt(q('.hero-visual')[0], q('.coin-tilt')[0], 6)
		return () => {
			alive = false
			loop?.kill()
			untilt()
		}
	}, [desktop])

	// The sheet stops the page scrolling behind it on small screens.
	useEffect(() => {
		if (desktop || !chatOpen) return
		stopScroll()
		document.documentElement.classList.add('sheet-open')
		return () => {
			resumeScroll()
			document.documentElement.classList.remove('sheet-open')
		}
	}, [chatOpen, desktop])


	// The circle holds only him; the conversation is a glass panel facing him.
	const avatarStage = (
		<div className="chat-avatar">
			{/* lit: his lights come on as the coin turns to his side, and go out again when it turns back */}
			{(avatarWanted || chatOpen) && (
				<AvatarFrame on={chatOpen || avatarWanted || (desktop && photoHovered)} lit={!desktop || chatOpen || photoHovered} />
			)}
		</div>
	)

	const chatPanel = (
		<>
			<header className="tc-head">
				<span className={`tc-dot${status !== 'online' ? ' is-busy' : ''}`} aria-hidden="true" />
				<span className="tc-name">Manuel <em>AI twin</em></span>
				<span className="tc-state" aria-live="polite">{status}</span>
				{desktop && <button type="button" className="tc-close" onClick={() => { setChatOpen(false); setPhotoHovered(false) }} aria-label="Close chat"><X size={16} /></button>}
			</header>

			{meet && (
				<MeetingPicker
					onClose={() => setMeet(false)}
					onBooked={(when, email) => {
						setChatMessages((list) => [...list, { role: 'assistant', content: `Done. I sent Manuel your request for ${when}. He'll e-mail ${email} to confirm and send the link.` }])
						scrollMessages()
					}}
				/>
			)}

			<div className="tc-log" ref={logRef} data-lenis-prevent>
				{chatMessages.length === 0 && (
					<div className="tc-hello">
						<p className="tc-hello-q">Ask me anything.</p>
						<p className="tc-hello-sub">Hey, I'm Manuel! Well — my AI twin. I know my ventures, projects, and story inside out.</p>
					</div>
				)}
				{chatMessages.map((m, i) =>
					m.role === 'user' ? (
						<div key={i} className="tc-msg user">
							<p className="tc-pill">{m.content}</p>
						</div>
					) : (
						<div key={i} className="tc-msg assistant">
							<span className="tc-label">Manuel</span>
							<p className="tc-text"><Streamed text={m.content} /></p>
							{m.meet && (
								<button type="button" className="tc-book" style={{ animationDelay: `${streamMs(m.content)}ms` }} onClick={() => setMeet(true)}>
									<Calendar size={14} />Book a call with Manuel
								</button>
							)}
							<div className="tc-tools" style={{ animationDelay: `${streamMs(m.content) - 250}ms` }}>
								<button type="button" className="tc-tool" onClick={() => copyAnswer(i, m.content)} aria-label={copied === i ? 'Copied' : 'Copy answer'}>
									{copied === i ? <Check size={14} /> : <Copy size={14} />}
								</button>
							</div>
						</div>
					)
				)}
				{typing && (
					<div className="tc-msg assistant is-typing">
						<span className="tc-label">Manuel</span>
						<span className="sr-only">Manuel is typing</span>
						<span className="dots" aria-hidden="true"><i /><i /><i /></span>
					</div>
				)}
			</div>

			{!isLoading && (
				<div className="tc-chips">
					<button type="button" className="tc-chip is-meet" onClick={() => setMeet(true)}><Calendar size={13} />Book a call</button>
					{follow.map((q) => (
						<button key={q} type="button" className="tc-chip" onClick={() => sendMessage(q)}>{q}</button>
					))}
				</div>
			)}

			<div className={`tc-box${boxFocus ? ' is-focus' : ''}${currentMessage.trim() ? ' is-filled' : ''}${boxTall ? ' is-tall' : ''}`}>
				<textarea
					ref={inputRef}
					rows={1}
					className="tc-input"
					placeholder="Message Manuel's AI twin…"
					aria-label="Message Manuel's AI twin"
					value={currentMessage}
					onChange={(e) => {
						setCurrentMessage(e.target.value)
						fitBox()
						// while you write he waits on the phone, half looking at it; stop for a while and he looks back up
						const on = e.target.value.trim().length > 0
						avatar.send({ t: 'writing', on })
						window.clearTimeout(writingTimer.current)
						if (on) writingTimer.current = window.setTimeout(() => avatar.send({ t: 'writing', on: false }), 3000)
					}}
					onFocus={() => { setBoxFocus(true); avatar.send({ t: 'focus', on: true }) }}
					onBlur={() => { setBoxFocus(false); avatar.send({ t: 'writing', on: false }); avatar.send({ t: 'focus', on: false }) }}
					onKeyDown={(e) => {
						if (e.key === 'Enter' && !e.shiftKey) {
							e.preventDefault()
							sendMessage()
						}
					}}
					disabled={isLoading}
				/>
				<button className="tc-send" onClick={() => sendMessage()} disabled={isLoading || !currentMessage.trim()} aria-label="Send message">
					<ArrowUp size={16} stroke={2.2} />
				</button>
			</div>
		</>
	)

	const appRoot = document.querySelector('.app')

	return (
		<section id="about" ref={sectionRef} className={`section hero tone-1${lit ? ' is-lit' : ''}${chatOpen && desktop ? ' is-chatting' : ''}`}>
			<ChatBeam open={chatOpen} />
			<div className="container hero-wrap">
				<div className="hero-copy">
					<p className={`title-anchor${wordIndex === 0 ? ' is-all' : ''}`} aria-hidden="true">
						{MANUEL_LETTERS.map((letter, i) => (
							<span
								key={letter}
								className={`title-anchor-letter${wordIndex === 0 || wordIndex - 1 === i ? ' is-on' : ''}`}
							>
								{letter}
							</span>
						))}
					</p>
					<h1 className="title">
						<span className="write title-word">{HERO_WORDS[0]}</span>
					</h1>
					<p className="subtitle">
						I’m Manuel — 20, from Mexico City, studying data science at UT Austin. I like building things people actually use.
					</p>
					<div className="cta-row">
						<button
							className="button primary"
							onClick={() => {
								analytics.trackEvent('resume_button_click', { event_category: 'navigation', event_label: 'resume_section' })
								scrollTo('resume')
							}}
						>
							See Resume
						</button>
						<button
							className="button"
							onClick={() => {
								analytics.trackEvent('contact_button_click', { event_category: 'navigation', event_label: 'contact_section' })
								scrollTo('contact')
							}}
						>
							Get in Touch
						</button>
					</div>
				</div>

				<div className="hero-visual" onPointerEnter={() => { if (desktop) setAvatarWanted(true) }}>
					<div className="portrait-stack">
					<div
						className={`photo-wrap ${chatOpen && desktop ? 'chat-open' : ''}${photoHovered && canPreview && desktop ? ' photo-hovered' : ''}${interactive ? ' is-chat-target' : ''}`}
						role={interactive ? 'button' : undefined}
						tabIndex={interactive ? 0 : undefined}
						aria-label={interactive ? (chatOpen ? 'Close chat' : "Chat with Manuel's AI twin") : undefined}
						onMouseEnter={() => {
							if (!desktop) return
							setAvatarWanted(true)
							if (canPreview) setPhotoHovered(true)
						}}
						onMouseLeave={() => setPhotoHovered(false)}
						onClick={() => {
							if (!interactive) return
							setAvatarWanted(true)
							// clicking "Click to talk" is the activation: his suit flashes and the lines run before the chat opens
							if (!chatOpen) avatar.send({ t: 'surge' })
							setChatOpen((open) => !open)
						}}
						onKeyDown={(e) => {
							if (!interactive) return
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault()
								setAvatarWanted(true)
								if (!chatOpen) avatar.send({ t: 'surge' })
								setChatOpen((open) => !open)
							}
						}}
					>
						<svg className="portrait-ring" viewBox="0 0 100 100" aria-hidden="true">
							<circle cx="50" cy="50" r="49.6" pathLength={1} />
						</svg>
						<div className="coin-tilt">
							<div className="coin-inner">
								<div className="coin-front">
									<img
										src="/portrait.webp"
										alt="Portrait of Manuel Peña Morros"
										className="hero-photo"
										width={480}
										height={480}
										decoding="async"
										loading="eager"
										{...{ fetchpriority: 'high' }}
									/>
								</div>
								{desktop && (
									<div className="coin-back">
										{avatarStage}
										{/* what a click here does, said plainly (the client, 2026-11-16) */}
										<span className="coin-hint" aria-hidden="true"><MessageCircle size={14} />Click to talk</span>
									</div>
								)}
							</div>
						</div>
					</div>

						<ChatInvite heroReady={lit || reducedMotion()} open={chatOpen || (desktop && photoHovered && canPreview)} onOpen={(toMeet) => { setAvatarWanted(true); setChatOpen(true); setMeet(!!toMeet) }} />
					</div>

					{desktop && (
						<div className={`twin-chat${chatOpen ? ' is-open' : ''}`} role="dialog" aria-label="Chat with Manuel's AI twin" {...(chatOpen ? {} : { inert: '', 'aria-hidden': true })}>
							{chatPanel}
						</div>
					)}


				</div>
			</div>

			{!desktop && chatOpen && appRoot && createPortal(
				<div className="chat-sheet-wrap" onClick={() => setChatOpen(false)}>
					<div className="chat-sheet" role="dialog" aria-modal="true" aria-label="Chat with Manuel's AI twin" onClick={(e) => e.stopPropagation()}>
						<button className="chat-sheet-close" onClick={() => setChatOpen(false)} aria-label="Close chat">
							<X size={18} />
						</button>
						<div className="tc-stage">{avatarStage}</div>
						<div className="twin-chat in-sheet is-open">{chatPanel}</div>
					</div>
				</div>,
				appRoot
			)}
		</section>
	)
})
