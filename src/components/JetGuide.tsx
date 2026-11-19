import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../motion'
import './jet-guide.css'

// The jetpack guide (the client, 2026-11-18): once the hero is scrolled past, his twin takes off from the portrait on his
// jetpack and comes down the page with you. At each section he hovers in the margin beside it and says something about
// what is on screen; a click asks his AI twin exactly that. At My Skills he flies into the game and becomes the player;
// scroll on and he comes back out and carries on to the end of the page. Nobody steers him here: he flies himself.

type Line = { text: string; ask?: string; meet?: boolean }
// side: which bottom corner he hovers in for that section — he crosses the page from one to the other as you go
type Station = { id: string; lines: Line[]; y: number; side?: 'left' | 'right' }

const STATIONS: Station[] = [
	{ id: 'values', side: 'right', y: 0.5, lines: [
		{ text: 'These are the values I work by', ask: 'What are your core values, and where do they come from?' },
		{ text: 'Ask me which one is hardest', ask: 'Which of your core values is the hardest for you to live by?' },
	] },
	{ id: 'skills', y: 0.5, lines: [{ text: 'Fly with me: every skill is 1% off Lumina Labs' }] },
	{ id: 'resume', side: 'left', y: 0.46, lines: [
		{ text: 'Ask me what I built at TV Azteca', ask: 'What did you build at TV Azteca?' },
		{ text: 'How Lumina Labs got to $15K a month', ask: 'How did Lumina Labs grow to $15,000 in monthly revenue?' },
		{ text: 'What I did at UnifAI', ask: 'What did you work on at UnifAI?' },
	] },
	{ id: 'projects', side: 'right', y: 0.5, lines: [
		{ text: 'Want the story behind a project?', ask: 'Tell me the story behind your projects. Which one are you proudest of?' },
		{ text: 'Ask me how I build fast', ask: 'How do you build and ship products so fast?' },
	] },
	{ id: 'articles', side: 'left', y: 0.5, lines: [
		{ text: 'Ask me about Aventuras en Salud', ask: 'What is Aventuras en Salud, and what was your part in it?' },
	] },
	{ id: 'contact', side: 'right', y: 0.44, lines: [
		{ text: 'Book a call with me', meet: true },
		{ text: 'Or ask me anything', ask: '' },
	] },
]

// what he says on the hero, by the portrait, before he takes off (the same lines the twin there used to say)
const HERO_LINES: Line[] = [
	{ text: 'Ask me anything', ask: '' },
	{ text: 'Book a call with me', meet: true },
	{ text: 'Curious? Let’s chat', ask: '' },
]

// What is on screen, item by item (the client, 2026-11-18: "every single thing shown on screen, he suggests something"):
// within a section, the item nearest the middle of the screen gives him his lines. A click asks the AI twin exactly that.
const FOCUS: Record<string, Line[]> = {
	// résumé entries (#resume-<id>)
	education1: [
		{ text: 'Ask me about my IB years at ASF', ask: 'What was the IB Diploma Programme at The American School Foundation like for you?' },
		{ text: 'Growing up in Mexico City', ask: 'How did growing up in Mexico City shape you?' },
	],
	education2: [
		{ text: 'Why I study Data Science at UT', ask: 'Why did you choose Data Science at UT Austin?' },
		{ text: 'Ask me why I transferred', ask: 'Why did you transfer from Tulane to UT Austin?' },
	],
	work1: [
		{ text: 'What I built at TV Azteca', ask: 'What did you build at TV Azteca?' },
		{ text: 'How I made it 40% faster', ask: 'How did your Lighthouse tool at TV Azteca improve efficiency by 40%?' },
	],
	work2: [
		{ text: 'What was my role at UnifAI?', ask: 'What was your role at UnifAI?' },
		{ text: 'Ask me about AI agents', ask: 'What did you learn building AI agent solutions at UnifAI?' },
	],
	luminalabs: [
		{ text: 'What Lumina Labs actually does', ask: 'What does Lumina Labs do, in simple terms?' },
		{ text: 'How we got to $15K a month', ask: 'How did Lumina Labs grow to $15,000 in monthly revenue?' },
		{ text: 'Try Lumina on the App Store', ask: 'How can I try the Lumina Labs app?' },
	],
	leadership: [
		{ text: 'Why I started Diaita in high school', ask: 'Why did you start Diaita, and what did it do?' },
		{ text: 'Ask me about the Diaita Foundation', ask: 'What did the Diaita Foundation do with the revenue?' },
	],
	journey: [
		{ text: 'Mexico City, New York, Austin…', ask: 'Walk me through your journey: Mexico City, New York, New Orleans and Austin.' },
	],
	pdf: [
		{ text: 'Want the one-page version?', ask: 'Can you summarize your résumé in a few lines?' },
	],
	// projects (by title)
	'TV Azteca Digital Metrics': [
		{ text: 'How the metrics dashboard works', ask: 'How does your TV Azteca Digital Metrics dashboard work?' },
	],
	'Unif-AI Business Platform': [
		{ text: 'Ask me about the Unif-AI platform', ask: 'What is the Unif-AI Business Platform and what was your part?' },
	],
	'Health Education Platform': [
		{ text: 'Who the health app is for', ask: 'Who is your Health Education Platform for, and what does it do?' },
	],
	// articles (by position in the carousel)
	'article-0': [{ text: 'What CHIC Magazine wrote', ask: 'What did CHIC Magazine write about Aventuras en Salud?' }],
	'article-1': [{ text: 'Aventuras en Salud on TV Azteca', ask: 'Tell me about Aventuras en Salud and the TV Azteca feature.' }],
	'article-2': [{ text: 'What El Sol de Toluca wrote', ask: 'What did El Sol de Toluca write about Aventuras en Salud?' }],
	'article-3': [{ text: 'What the foundation launched', ask: 'What did the foundation launch with Aventuras en Salud?' }],
	// core values (by name)
	'Hard Work': [{ text: 'Ask me what hard work looks like for me', ask: 'What does hard work look like in your daily life?' }],
	'Clean Code': [{ text: 'Why clean code matters to me', ask: 'Why does clean code matter to you?' }],
	Teamwork: [{ text: 'A team I loved working with', ask: 'Tell me about a team you loved working with.' }],
	Excellence: [{ text: 'Where I push for excellence', ask: 'Where do you push yourself hardest for excellence?' }],
	Innovation: [{ text: 'The most inventive thing I’ve built', ask: 'What is the most innovative thing you have built?' }],
	Growth: [{ text: 'How I’ve grown the most', ask: 'What experience made you grow the most?' }],
}

// which item is on show in a section right now, as a FOCUS key
function focusKey(section: string): string | null {
	const mid = innerHeight * 0.5
	const near = (els: Element[]) => {
		let best: Element | null = null, d = Infinity
		for (const el of els) {
			const r = el.getBoundingClientRect()
			if (!r.height || r.bottom < 0 || r.top > innerHeight) continue
			const dd = Math.abs((r.top + r.bottom) / 2 - mid)
			if (dd < d) { d = dd; best = el }
		}
		return best
	}
	if (section === 'values') return document.querySelector('#values .value-caption-item.active h3')?.textContent?.trim() || null
	if (section === 'resume') {
		// desktop: a timeline, one card open at a time — the open card is the one on show
		const open = document.querySelector('#resume .timeline-card-entry.is-active')
		if (open) {
			const t = open.textContent || ''
			const hit = [['American School', 'education1'], ['Texas', 'education2'], ['TV Azteca', 'work1'], ['UnifAI', 'work2'], ['Lumina', 'luminalabs'], ['Diaita', 'leadership']].find(([w]) => t.includes(w))
			if (hit) return hit[1]
		}
		const el = near([...document.querySelectorAll('#resume .resume-entry, #resume .journey-map-card, #resume .resume-dl-wrap')])
		if (!el) return null
		if (el.classList.contains('journey-map-card')) return 'journey'
		if (el.classList.contains('resume-dl-wrap')) return 'pdf'
		return el.id.replace(/^resume-/, '')
	}
	if (section === 'projects') {
		// the ring turns: the project facing you is the widest one on screen
		let best: Element | null = null, w = 0
		for (const el of document.querySelectorAll('#projects .project-item')) { const r = el.getBoundingClientRect(); if (r.width > w && r.bottom > 0 && r.top < innerHeight) { w = r.width; best = el } }
		return best?.querySelector('.project-title')?.textContent?.trim() || null
	}
	if (section === 'articles') {
		const all = [...document.querySelectorAll('#articles .carousel-indicator')]
		const i = all.findIndex((el) => el.classList.contains('active'))
		return i >= 0 ? `article-${i}` : null
	}
	return null
}

const ok = () =>
	typeof window !== 'undefined' &&
	window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 960px)').matches &&
	!prefersReducedMotion()

/** The fairy (the client, 2026-11-18): when the guide runs, he is also the character by the portrait on the hero, in
 *  place of the small 3D twin, and takes off from there. ChatInvite asks this to know whether to load its own twin. */
export const fairyActive = ok

export default function JetGuide() {
	const [enabled] = useState(ok)
	const rootRef = useRef<HTMLDivElement>(null)
	const sheetA = useRef<HTMLSpanElement>(null)
	const sheetB = useRef<HTMLSpanElement>(null)
	const flames = useRef<(HTMLElement | null)[]>([])
	const [station, setStation] = useState<Station | null>(null)
	const [line, setLine] = useState(0)
	const [shown, setShown] = useState(false)
	const [say, setSay] = useState(false)
	const [focus, setFocus] = useState<string | null>(null)
	// hover with a grace period: he bobs under a still pointer, and a plain :hover flickered on and off with every bob
	const [hover, setHover] = useState(false)
	const hoverOff = useRef(0)
	const stationRef = useRef<Station | null>(null)
	stationRef.current = station

	// which section he is guiding, from the scroll position
	useEffect(() => {
		if (!enabled) return
		let raf = 0
		const pick = () => {
			raf = 0
			const hero = document.getElementById('about')
			const heroOut = !hero || hero.getBoundingClientRect().bottom < innerHeight * 0.45
			if (!heroOut) { setStation(null); return }
			let best: Station | null = null
			for (const st of STATIONS) {
				const el = document.getElementById(st.id)
				if (!el) continue
				const r = el.getBoundingClientRect()
				if (r.top < innerHeight * 0.6 && r.bottom > innerHeight * 0.3) best = st
			}
			// between two sections he stays with the last one
			setStation((cur) => best ?? cur)
		}
		const onScroll = () => { if (!raf) raf = requestAnimationFrame(pick) }
		pick()
		window.addEventListener('scroll', onScroll, { passive: true })
		window.addEventListener('resize', onScroll)
		return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf) }
	}, [enabled])

	useEffect(() => {
		if (!enabled) return
		// an item has to stay on show for a moment before he talks about it: the projects ring spins round once on
		// arrival, and he was firing a line for every project that swept past
		let cand: string | null = null, since = 0
		const id = window.setInterval(() => {
			const st = stationRef.current
			const raw = st ? focusKey(st.id) : null
			// remembered with its section, so a résumé item can never speak over the projects
			const k = st && raw && FOCUS[raw] ? `${st.id}|${raw}` : null
			const now = performance.now()
			if (k !== cand) { cand = k; since = now }
			// a quarter second is enough to know what you are looking at — except the projects ring, which spins on arrival
			const settle = st?.id === 'projects' ? 500 : 110
			if (now - since >= settle || k === null) setFocus((cur) => (cur === k ? cur : k))
		}, 90)
		return () => window.clearInterval(id)
	}, [enabled])

	// a new section, or a new item on show in it: his first line, and the lines take turns while it is there
	useEffect(() => {
		setLine(0)
		setSay(false)
		if (station?.id === 'skills') return
		// quick: the line is up almost as soon as the thing it is about is on screen
		const show = window.setTimeout(() => setSay(true), 0)
		const turn = window.setInterval(() => setLine((i) => i + 1), 3500)
		return () => { window.clearTimeout(show); window.clearInterval(turn) }
	}, [station, focus])

	// the flight: a spring toward where he should be, thrust from the jetpack when he climbs, a lean into his motion,
	// a slow hover bob, and his 8-frame hover loop dissolving frame to frame
	useEffect(() => {
		if (!enabled) return
		const root = rootRef.current!
		const html = document.documentElement
		html.classList.add('jet-guide-on', 'jet-fairy')
		let x = -200, y = -200, vx = 0, vy = 0, thrust = 0, tilt = 0, raf = 0, last = performance.now(), visible = false, inGame = false
		// 0: facing you (the front loop), 1: in profile (the game's loop); in between, the turn
		let turn = 0, mode = ''
		// his first appearance: he takes off from behind the portrait and flies up to his place, instead of popping in
		let launched = false
		// facing you, the nozzles are behind him: the jets show where you would really see them, coming out from under
		// his seat between his legs. The body never turns (the client: "same figure across, only the head") — so the
		// jets stay put, and only his head turns to profile for the game.
		const FRONT = [[0.42, 0.541], [0.534, 0.551]], SIDE = FRONT
		// white mode has its own renders of him: white suit, ink lines (as the 3D twin wears it in white mode)
		const setMode = (m0: string) => {
			const light = !!document.querySelector('.app.color-mode')
			const m = m0 + (light ? '-light' : '')
			if (m === mode || !sheetA.current || !sheetB.current) return
			mode = m
			const url = light
				? (m0 === 'turn' ? '/fairy-turn-light.webp' : m0 === 'side' ? '/fairy-game-light.webp' : '/fairy-front-light.webp')
				: (m0 === 'turn' ? '/fairy-turn-2.webp' : m0 === 'side' ? '/fairy-game-2.webp' : '/fairy-front-2.webp')
			for (const el of [sheetA.current, sheetB.current]) { el.style.backgroundImage = `url('${url}')`; el.style.backgroundSize = m === 'turn' ? '600% 100%' : '800% 100%' }
		}
		const target = () => {
			const st = stationRef.current
			// on the hero: hovering by the portrait, where the small twin used to peek in
			if (!st) {
				const inv = document.querySelector('.chat-invite')?.getBoundingClientRect()
				return inv && inv.width ? { x: inv.left + inv.width * 0.5, y: inv.top + inv.height * 0.42, home: true } : { x: innerWidth - 140, y: -260, home: true }
			}
			if (st.id === 'skills') {
				const area = document.querySelector('.flappy-game-area')?.getBoundingClientRect()
				const bird = document.querySelector('.flappy-bird.is-jet')?.getBoundingClientRect()
				if (area && bird && area.top < innerHeight * 0.35 && area.bottom > innerHeight * 0.7) return { x: bird.left + bird.width / 2, y: bird.top + bird.height / 2, game: true, side: true }
			}
			// always the bottom-right corner, facing you (the client, 2026-11-18)
			// the left corner only where the page has a margin wide enough for him and his words (the content is ~1200px
			// wide and the nav rail sits on the left); on narrower screens he keeps to the right so he never covers anything
			// (tried on a 1512px laptop: his words landed on the résumé and article cards, so it takes ~380px of margin)
			// the bottom-right, where he never covers the content — but never parked: he drifts about his spot in a slow,
			// looping wander, like someone actually holding a hover (the client: "not fixed, stuck, it needs movement")
			const ts = performance.now() / 1000
			// and while the page moves he travels with it: he trails the scroll a little (dips as you go down, rises as you
			// go up) and weaves side to side in a smooth zig-zag that grows with the speed, then settles when you stop
			const sp = Math.min(1, Math.abs(scrollV) / 1600)
			return {
				x: innerWidth - 110 + Math.sin(ts * 0.31) * 22 + Math.sin(ts * 0.77 + 1.3) * 6 + Math.sin(ts * 2.6) * 70 * sp,
				y: innerHeight - 172 + Math.sin(ts * 0.43 + 0.6) * 14 + Math.sin(ts * 1.1) * 4 + Math.max(-60, Math.min(60, scrollV * 0.035)),
			}
		}
		// how fast the page is scrolling (px/s, smoothed) — he travels with it
		let scrollV = 0, lastSY = window.scrollY, nearT = 0, lastSt: string | undefined = undefined
		const frame = (now: number) => {
			const dt = Math.min(0.05, (now - last) / 1000)
			last = now
			{
				// how fast the page's content actually moves on screen — not the scroll position: in a pinned section (the
				// résumé's slides, the values wheel) scrolling turns the slides while the section stays put, and he should stay
				// calm there instead of zig-zagging on every slide (the client, 2026-11-19)
				const el = stationRef.current ? document.getElementById(stationRef.current.id) : null
				const sy = el ? -el.getBoundingClientRect().top : window.scrollY
				const step = Math.min(0.05, Math.max(0.001, (now - last) / 1000 || 0.016))
				if (stationRef.current?.id !== lastSt) { lastSt = stationRef.current?.id; lastSY = sy }
				scrollV += ((sy - lastSY) / step - scrollV) * 0.12
				lastSY = sy
			}
			const t = target()
			// critically damped spring, a little looser vertically so climbs and drops read
			// a soft, critically damped spring — he glides in a smooth arc to wherever he is going, no snapping; a little
			// looser vertically, so long trips curve (he rises and settles) instead of running along a straight line
			const k = 3.6, kv = 3.0
			vx += ((t.x - x) * k * k - vx * 2 * k) * dt
			vy += ((t.y - y) * kv * kv - vy * 2 * kv) * dt
			x += vx * dt
			y += vy * dt
			const bob = Math.sin(now / 520) * 4 * (1 - Math.min(1, Math.abs(vy) / 400))
			// the jetpack: firing while he climbs or holds height against gravity, idling as he drops
			// a hover needs thrust: the flame is always lit and never cuts out — it grows smoothly as he climbs and
			// shrinks smoothly as he drops, without switching between states
			const want = Math.max(0.5, Math.min(1, 0.72 - vy / 700))
			thrust += (want - thrust) * Math.min(1, dt * 2.2)
			tilt += (Math.max(-9, Math.min(9, vx * 0.02)) - tilt) * Math.min(1, dt * 5)
			root.style.transform = `translate3d(${x.toFixed(1)}px, ${(y + bob).toFixed(1)}px, 0) rotate(${tilt.toFixed(2)}deg)`
			flames.current.forEach((f, i) => {
				if (!f) return
				// a steady jet, the same as in the game: always lit, one slow, slight breath in length
				// and it rides up and down a touch, like a real jet holding a hover — slight, never static
				const sec = now / 1000
				const n = Math.sin(sec * 2.2 + i * 1.7)
				const dy = Math.sin(sec * 3.1 + i * 0.9) * 2.2
				f.style.transform = `translate(-50%, ${dy.toFixed(2)}px) scale(${(0.95 + thrust * 0.1).toFixed(3)}, ${(0.5 + thrust * 0.5 + n * 0.04).toFixed(3)})`
			})
			// he turns to profile only to fly into the game, and back to face you when he leaves it
			const wantSide = 'side' in t && t.side ? 1 : 0
			turn += (wantSide - turn) * Math.min(1, dt * 3.2)
			if (Math.abs(turn - wantSide) < 0.01) turn = wantSide
			if (sheetA.current && sheetB.current) {
				if (turn > 0 && turn < 1) {
					setMode('turn')
					// (only the head turns between these frames, so blending them stays clean)
					const tf = turn * 5, ti = Math.floor(tf)
					sheetA.current.style.backgroundPosition = `${(ti / 5) * 100}% 0`
					sheetB.current.style.backgroundPosition = `${(Math.min(5, ti + 1) / 5) * 100}% 0`
					sheetB.current.style.opacity = (tf - ti).toFixed(3)
				} else {
					// one still pose: blending the leg-kick frames into each other ghosted his legs and boots (the
					// "glitching"); his hover motion comes from the flight itself — the bob, the lean, the jets
					setMode(turn === 1 ? 'side' : 'front')
					sheetA.current.style.backgroundPosition = '0% 0'
					sheetB.current.style.opacity = '0'
				}
			}
			flames.current.forEach((f, i) => {
				if (!f) return
				f.style.left = `${(FRONT[i][0] + (SIDE[i][0] - FRONT[i][0]) * turn) * 100}%`
				f.style.top = `${(FRONT[i][1] + (SIDE[i][1] - FRONT[i][1]) * turn) * 100}%`
			})
			// hand-offs: once he is near the game's player he lands on it (it moves, so he snaps the last few pixels) and the
			// game shows its own; he stays locked to it while he is in there
			const isGame = 'game' in t && !!t.game
			// Into the game without a seam: as he nears the game's figure he eases onto it (no snap — the old 46px snap was the
			// jump you saw) and finishes turning his head; only when he sits exactly on it, head in profile, does the game's
			// own figure take over. While in there he stays locked to it, so coming out starts from exactly where it is.
			const dGame = Math.hypot(t.x - x, t.y - y)
			if (isGame && inGame) { x = t.x; y = t.y; vx = 0; vy = 0 }
			else if (isGame && dGame < 160) {
				// the pull tightens the longer he is close, so he catches the moving figure instead of trailing it
				nearT += dt
				const pull = 1 - Math.exp(-dt * (9 + nearT * 60))
				x += (t.x - x) * pull; y += (t.y - y) * pull; vx *= 0.8; vy *= 0.8
				turn += (1 - turn) * Math.min(1, dt * 7)
				tilt *= 0.85
			}
			if (!isGame || dGame >= 160) nearT = 0
			const nowInGame = !!(isGame && (inGame || (dGame < 4 && turn > 0.97)))
			if (nowInGame !== inGame) {
				inGame = nowInGame
				html.classList.toggle('jet-in-game', inGame)
				// the hand-off is a cut, not a cross-fade: both figures stand on the same spot, so for that moment no fading
				root.style.transition = 'none'
				window.setTimeout(() => { root.style.transition = '' }, 250)
			}
			// on the hero he shows once the portrait has settled, and steps aside while the chat is open over it
			const inv = document.querySelector('.chat-invite')
			const atHome = 'home' in t && !!t.home
			const homeReady = !!inv && inv.classList.contains('is-shown') && !inv.classList.contains('is-open')
			if (!launched) {
				if (atHome && !homeReady) {
					// waiting behind the portrait's middle, out of sight, for the hero to settle
					const pr = document.querySelector('.photo-wrap')?.getBoundingClientRect()
					if (pr && pr.width) { x = pr.left + pr.width * 0.55; y = pr.top + pr.height * 0.62; vx = 0; vy = -60 }
				} else launched = true
			}
			const nowVisible = !inGame && (!atHome || homeReady)
			root.classList.toggle('is-home', atHome)
			// on the hero his words go to his right — unless the line would run off the screen there, then to his left
			const sayEl = root.querySelector<HTMLElement>('.jg-say')
			// he speaks toward the middle of the page: to his left in the right-hand corner, to his right in the left-hand
			// corner, and to his right by the portrait unless the line would run off the screen
			if (sayEl) root.classList.toggle('say-left', atHome ? x + 58 + sayEl.offsetWidth > innerWidth - 20 : !('left' in t && t.left))
			if (nowVisible !== visible) { visible = nowVisible; setShown(visible); html.classList.toggle('jet-guide-flying', visible) }
			raf = requestAnimationFrame(frame)
		}
		// start at the portrait twin
		const t0 = target(); x = t0.x; y = t0.y
		raf = requestAnimationFrame(frame)
		return () => { cancelAnimationFrame(raf); html.classList.remove('jet-guide-on', 'jet-in-game', 'jet-guide-flying') }
	}, [enabled])

	if (!enabled) return null
	const fk = focus && station && focus.startsWith(station.id + '|') ? focus.slice(station.id.length + 1) : null
	const lines = station ? (fk ? FOCUS[fk] : station.lines) : HERO_LINES
	const ln = lines.length ? lines[line % lines.length] : null
	const act = () => {
		if (!ln) { window.dispatchEvent(new CustomEvent('chat:open', { detail: {} })); return }
		window.dispatchEvent(new CustomEvent('chat:open', { detail: ln.meet ? { meet: true } : { ask: ln.ask || undefined } }))
	}
	return (
		<div ref={rootRef} className={`jet-guide${shown ? ' is-shown' : ''}`}>
			<button type="button" className={`jg-body${hover ? ' is-hover' : ''}`} onClick={act} aria-label={ln ? ln.text : "Chat with Manuel's AI twin"}
				onPointerEnter={() => { window.clearTimeout(hoverOff.current); setHover(true) }}
				onPointerLeave={() => { window.clearTimeout(hoverOff.current); hoverOff.current = window.setTimeout(() => setHover(false), 350) }}>
				<span className="jg-wrap" aria-hidden="true">
					{[[0.42, 0.541], [0.534, 0.551]].map(([fx, fy], i) => (
						<i key={i} ref={(el) => { flames.current[i] = el }} className="jet-flame" style={{ left: `${fx * 100}%`, top: `${fy * 100}%` }}>
							<b className="jf-glow" /><b className="jf-body" /><b className="jf-core" /><b className="jf-mach" /><b className="jf-mach" /><b className="jf-mach" />
						</i>
					))}
					<i className="jg-aura" aria-hidden="true" />
					<span ref={sheetA} className="jg-sheet" />
					<span ref={sheetB} className="jg-sheet is-next" />
				</span>
			</button>
			{ln && say && shown && (
				<button type="button" className="jg-say" onClick={act} key={`${station?.id ?? 'hero'}-${focus ?? ''}-${line}`}>
					<i className="jg-live" aria-hidden="true" />
					<span>{ln.text}</span>
					{(ln.ask !== undefined || ln.meet) && <span className="jg-arrow" aria-hidden="true">↗</span>}
				</button>
			)}
		</div>
	)
}
