import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Check, Copy, HandFinger, Keyboard } from '../icons'
import { skills } from '../content'
import { gsap, isTouch, prefersReducedMotion, useMotion, writeIn } from '../motion'
import { createJetScene } from './jetScene'
import ScriptTitle from '../components/ScriptTitle'

// ---- Jetpack run (the client, 2026-11-18: "like the Joyride game: collect the skills and don't lose at all") ----
// Hold Space / the mouse / a finger to fire the jetpack and climb; let go and he drops. Nothing kills him: the skills
// float through the course as chips, and every one he flies into is 1% off Lumina Labs. The run ends at the finish.
const FALL_SCALE = 0.3
const SCROLL_SPEED = 3
const STEP_MS = 1000 / 60
const THRUST = 0.42
const JET_GRAVITY = 0.3
const MAX_UP = -4.2
const MAX_DOWN = 5
// the first chip is a little way off, so the opening moments are only for finding the key
const FIRST_ORB = 520
const ORB_GAP = 230
// a deterministic, flowing line of heights (in % of the sky, chip centres): it rises and falls like a course, so
// catching them all takes steering, but every one is reachable from the last
const orbY = (i: number) => {
	const wave = Math.sin(i * 0.74 + 0.4) * 0.62 + Math.sin(i * 1.91 + 1.3) * 0.38
	return Math.round(48 + wave * 30)
}
const endOfCourse = FIRST_ORB + (skills.length - 1) * ORB_GAP + 340
// his body, as a share of the bird box (the upright render, flames excluded), for catching chips
const BODY = { top: -0.33, bottom: 1.52, left: 0.12, right: 0.88 }
// the picture: an 8-frame loop of him hovering (legs kicking, head turning), rendered from the 3D twin
const SHEET_FRAMES = 8
const WRAP_H = 1.9
const WRAP_ASPECT = 204 / 420
const SPARKS = 26

// The client, 2026-11-16: every skill collected is 1% off Lumina Labs, handed over as a coupon when the game ends.
// The code is only a label here — it has to exist on the Lumina Labs side for it to take anything off.
// Each finished run gets its own code: LUM-<five random characters>-<percent>, e.g. LUM-K7Q4X-12. The characters skip
// the look-alikes (0/O, 1/I/L). It is still only generated here in the page — nothing checks it yet.
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const randomTag = () => Array.from(crypto.getRandomValues(new Uint8Array(5)), (n) => CODE_CHARS[n % CODE_CHARS.length]).join('')
const couponCode = (tag: string, count: number) => `LUM-${tag}-${String(count).padStart(2, '0')}`
// A crash while still tapping must not dismiss the coupon before it has been seen.
const RESTART_HOLD_MS = 900

export default memo(function SkillsGame() {
	const [gameStarted, setGameStarted] = useState(false)
	const [gameOver, setGameOver] = useState(false)
	const [collected, setCollected] = useState<ReadonlySet<number>>(new Set())
	const [touch] = useState(isTouch)
	const [copied, setCopied] = useState(false)
	const [codeTag, setCodeTag] = useState(randomTag)
	// The "+1%" that flies off the bird each time a skill is collected: which one, and how high the bird was.
	const [burst, setBurst] = useState<{ n: number; top: number; name: string } | null>(null)

	const sectionRef = useRef<HTMLElement>(null)
	const areaRef = useRef<HTMLDivElement>(null)
	const birdRef = useRef<HTMLDivElement>(null)
	const pipesRef = useRef<HTMLDivElement>(null)

	// The loop works on refs so a frame never re-renders React.
	const sim = useRef({ pos: 40, vel: 0, offset: 0, birdX: 200, birdW: 90, birdH: 90, height: 600, ground: 540, floor: 70, ceiling: 8, inView: false, gameOn: false, age: 0, thrust: 0, tilt: 0, through: false })
	// exhaust sparks: a small fixed pool, moved by the loop, never re-rendered
	const sparks = useRef(Array.from({ length: SPARKS }, () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1 })))
	const sparkEls = useRef<(HTMLElement | null)[]>([])
	const flameEls = useRef<(HTMLElement | null)[]>([])
	const glowRef = useRef<HTMLDivElement>(null)
	const orbEls = useRef<(HTMLElement | null)[]>([])
	// the finish is a sheet of bubble gum across the sky: he pushes into it, it stretches round him, thins, and pops,
	// then wobbles itself out behind him (paint draws it every frame from where he is)
	const gumRef = useRef<SVGPathElement>(null)
	const gumHi = useRef<SVGPathElement>(null)
	const gum = useRef({ popAt: -1, push: 0, cy: 0 })
	const collectedRef = useRef(new Set<number>())
	const mode = useRef<'demo' | 'play' | 'over'>('demo')
	const raf = useRef(0)
	const overAt = useRef(0)
	// the jetpack is on while the button / Space / a finger is held; `firing` is what the flames show
	const holding = useRef(false)
	const firing = useRef(false)

	// Where the four nozzles are, as a share of the picture (two on the pack, one under each boot).
	// where the jetpack's two nozzles are, as a share of the picture
	// the same figure as the guide: facing you, the jets coming from under his seat
	const NOZZLES = [[0.42, 0.541], [0.534, 0.551]] as const
	const bgRef = useRef<HTMLCanvasElement>(null)
	const scene = useRef<ReturnType<typeof createJetScene> | null>(null)
	const sheetRef = useRef<HTMLSpanElement>(null)
	const sheetNextRef = useRef<HTMLSpanElement>(null)

	const paint = useCallback(() => {
		const s = sim.current
		const bird = birdRef.current
		const now = performance.now() / 1000
		if (bird) {
			bird.style.transform = `translate3d(0, ${(s.pos / 100) * s.height}px, 0) rotate(${s.tilt.toFixed(2)}deg)`
		}
		// his hover loop: slow (a full cycle every 2.3 s) and blended — each frame dissolves into the next, so the kick of
		// his legs and the turn of his head read as one motion, never as a stepping jitter (the client: "he shakes a lot")
		if (sheetRef.current && sheetNextRef.current) {
			// one still pose, as the guide: blending the kick frames ghosted his legs (SHEET_FRAMES kept for the sheet's layout)
			if (sheetRef.current.style.backgroundPosition !== '0% 0px') sheetRef.current.style.backgroundPosition = '0% 0'
			sheetNextRef.current.style.opacity = '0'
			void SHEET_FRAMES
		}
		scene.current?.draw(s.offset, now)
		drawGum(now)
		// the flames: idle they are a pilot light, held they grow to full length; each flickers on its own
		flameEls.current.forEach((f, i) => {
			if (!f) return
			// a steady jet (the client: "it blinks, it must be continuous"): always lit, only one slow, slight breath in length
			const n = Math.sin(now * 2.2 + i * 1.7)
			const len = 0.5 + s.thrust * 0.5 + n * 0.02
			const wid = 0.95 + s.thrust * 0.1
			const dy = Math.sin(now * 3.1 + i * 0.9) * 2.2
			f.style.transform = `translate(-50%, ${dy.toFixed(2)}px) scale(${wid.toFixed(3)}, ${Math.max(0.12, len + Math.sin(now * 2.2 + i * 1.7) * 0.02).toFixed(3)})`
			f.style.opacity = '1'
		})
		// the jetpack's light on the ground, when he is low and firing
		if (glowRef.current) {
			const body = (s.pos / 100) * s.height + BODY.bottom * s.birdH
			const near = Math.max(0, 1 - (s.ground - body) / 220)
			glowRef.current.style.opacity = (near * (0.25 + s.thrust * 0.75)).toFixed(3)
			glowRef.current.style.transform = `translate3d(${s.birdX + s.birdW * 0.42}px, 0, 0) translateX(-50%) scaleX(${(0.7 + near * 0.6).toFixed(3)})`
		}
		sparks.current.forEach((p, i) => {
			const el = sparkEls.current[i]
			if (!el) return
			if (p.life <= 0) { if (el.style.opacity !== '0') el.style.opacity = '0'; return }
			const k = p.life / p.max
			el.style.opacity = (k * 0.9).toFixed(2)
			el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) scale(${(0.4 + k * 0.8).toFixed(2)})`
		})
		if (pipesRef.current) pipesRef.current.style.transform = `translate3d(${-s.offset}px, 0, 0)`
	}, [])

	// The gum membrane: a strip from the top mast to the bottom one. Before he reaches it, it sways a little. When his
	// body touches it, it bulges ahead of him — a bell shape the height of him — and gets thinner the further it
	// stretches; past the stretch limit it pops: the bulge snaps back, overshoots and wobbles out, damped.
	function drawGum(now: number) {
		const s = sim.current, g = gum.current
		const path = gumRef.current, hi = gumHi.current
		if (!path || !hi) return
		const gx = endOfCourse - s.offset
		const topY = 54, botY = Math.max(topY + 40, s.ground - 54)
		if (gx < -200 || gx > (areaRef.current?.clientWidth ?? 2000) + 200) { if (path.getAttribute('d')) { path.setAttribute('d', ''); hi.setAttribute('d', '') } return }
		const top = (s.pos / 100) * s.height
		const cy = top + ((BODY.top + BODY.bottom) / 2) * s.birdH
		const front = s.birdX + BODY.right * s.birdW
		const w = s.birdH * 1.05
		const LIMIT = s.birdW * 1.5
		let disp = 0, thin = 0
		if (gx > front + 260) g.popAt = -1
		if (g.popAt < 0) {
			const push = front - gx
			if (push > 0) {
				if (push > LIMIT) { g.popAt = now; g.push = LIMIT; g.cy = cy; burstGum() }
				else { disp = push; thin = push / LIMIT; g.cy = cy }
			}
		}
		if (g.popAt >= 0) {
			// snapped back: a damped wobble round the rest line, strongest where he broke through
			const t = now - g.popAt
			disp = -g.push * 0.55 * Math.exp(-t * 3.4) * Math.cos(t * 17)
		}
		const centre = g.popAt >= 0 ? g.cy : cy
		const sway = (y: number) => Math.sin(now * 1.6 + y * 0.018) * 2.2
		const N = 48, L: string[] = [], R: string[] = [], H: string[] = []
		for (let k = 0; k <= N; k++) {
			const y = topY + ((botY - topY) * k) / N
			const bell = Math.exp(-(((y - centre) / w) ** 2))
			// when it pops the wobble runs wider than the bulge did
			const shape = g.popAt >= 0 ? Math.exp(-(((y - centre) / (w * 2.2)) ** 2)) : bell
			const x = gx + sway(y) + disp * shape
			// thick, chewy gum at rest; stretched round him it thins to a film
			const half = 6.5 * (1 - 0.85 * thin * bell) + 0.6
			L.push(`${(x - half).toFixed(1)},${y.toFixed(1)}`)
			R.unshift(`${(x + half).toFixed(1)},${y.toFixed(1)}`)
			H.push(`${(x - half * 0.2).toFixed(1)},${y.toFixed(1)}`)
		}
		path.setAttribute('d', `M${L.join('L')}L${R.join('L')}Z`)
		hi.setAttribute('d', `M${H.join('L')}`)
		path.parentElement?.classList.toggle('is-stretched', thin > 0.05 && g.popAt < 0)
	}
	// the pop: he jiggles through, a soft flash and a few flecks of gum fly off; the run goes on, the coupon a beat later
	function burstGum() {
		const area = areaRef.current
		if (!area) return
		area.classList.remove('is-portal')
		void area.offsetWidth
		area.classList.add('is-portal')
		window.setTimeout(() => area.classList.remove('is-portal'), 900)
	}

	const reset = useCallback(() => {
		Object.assign(sim.current, { pos: 45, vel: 0, offset: 0, age: 0, thrust: 0, tilt: 0, through: false })
		gum.current.popAt = -1
		areaRef.current?.classList.remove('is-portal')
		sparks.current.forEach((p) => { p.life = 0 })
		collectedRef.current = new Set()
		setCollected(new Set())
		setCopied(false)
		setBurst(null)
		paint()
	}, [paint])

	const endGame = useCallback(() => {
		mode.current = 'over'
		holding.current = false
		overAt.current = performance.now()
		setCodeTag(randomTag())
		setGameOver(true)
	}, [])

	// One step of flight, for play and for the demo alike: thrust or gravity, the smoothed flame and lean, the sparks.
	const fly = useCallback((up: boolean) => {
		const s = sim.current
		s.vel = Math.max(MAX_UP, Math.min(MAX_DOWN, s.vel + (up ? -THRUST : JET_GRAVITY)))
		s.pos = Math.max(s.ceiling, Math.min(s.floor, s.pos + s.vel * FALL_SCALE))
		if ((s.pos <= s.ceiling && s.vel < 0) || (s.pos >= s.floor && s.vel > 0)) s.vel = 0
		// the flame takes a moment to come up to full and to die back, like a real burner
		s.thrust += ((up ? 1 : 0) - s.thrust) * (up ? 0.09 : 0.05)
		// he leans back a little into a climb and forward into a drop, smoothly
		s.tilt += (Math.max(-4, Math.min(5, s.vel * 1)) - s.tilt) * 0.06
		s.offset += SCROLL_SPEED
		// exhaust: while firing, sparks leave the nozzles, fall away and are left behind by the run
		if (s.thrust > 0.35 && s.age % 2 === 0) {
			const p = sparks.current.find((q) => q.life <= 0)
			if (p) {
				const [nx, ny] = NOZZLES[(s.age >> 1) % NOZZLES.length]
				const wrapH = s.birdH * WRAP_H, wrapW = wrapH * WRAP_ASPECT
				const wrapLeft = s.birdX + s.birdW / 2 - wrapW / 2, wrapTop = (s.pos / 100) * s.height + s.birdH / 2 - wrapH * 0.45
				p.x = wrapLeft + nx * wrapW + (Math.random() - 0.5) * 4
				p.y = wrapTop + ny * wrapH + s.thrust * wrapH * 0.22
				p.vx = -SCROLL_SPEED * (0.6 + Math.random() * 0.6)
				p.vy = 1.6 + Math.random() * 2.2
				p.max = p.life = 18 + Math.random() * 16
			}
		}
		for (const p of sparks.current) {
			if (p.life <= 0) continue
			p.life--
			p.x += p.vx
			p.y += p.vy
			p.vy *= 0.96
			if (p.y > s.ground - 2) { p.y = s.ground - 2; p.vy *= -0.3; p.vx -= 0.6 }
		}
		s.age++
	}, [])

	const step = useCallback(() => {
		const s = sim.current
		// in the first moments the jetpack holds him level by itself, while the key is still being found
		fly(holding.current || (s.age < 70 && s.pos > 45))
		firing.current = s.thrust > 0.5
		const top = (s.pos / 100) * s.height
		const bt = top + BODY.top * s.birdH, bb = top + BODY.bottom * s.birdH
		const bl = s.birdX + BODY.left * s.birdW, br = s.birdX + BODY.right * s.birdW
		for (let i = 0; i < skills.length; i++) {
			if (collectedRef.current.has(i)) continue
			const ox = FIRST_ORB + i * ORB_GAP - s.offset
			if (ox < bl - 60) continue
			if (ox > br + 60) break
			const oy = (orbY(i) / 100) * s.height
			// a generous catch: anywhere on him, or just grazing the chip
			if (ox > bl - 26 && ox < br + 26 && oy > bt - 26 && oy < bb + 26) {
				collectedRef.current.add(i)
				setCollected(new Set(collectedRef.current))
				setBurst({ n: collectedRef.current.size, top: orbY(i), name: skills[i].name })
			}
		}
		// the finish: he flies on through the gum sheet without stopping (drawGum pops it); the coupon comes a beat after
		if (!s.through && gum.current.popAt >= 0 && endOfCourse - s.offset < s.birdX + s.birdW) {
			s.through = true
			window.setTimeout(() => { if (mode.current === 'play') endGame() }, 1000)
		}
	}, [endGame, fly])

	// While nobody plays, he flies the course himself, after each chip in turn, so the section looks alive.
	const demoStep = useCallback(() => {
		const s = sim.current
		if (s.offset + s.birdX > endOfCourse) s.offset = -FIRST_ORB + s.birdX + 120
		const next = Math.max(0, Math.ceil((s.offset + s.birdX - FIRST_ORB) / ORB_GAP))
		const aim = orbY(Math.min(next, skills.length - 1))
		const mid = s.pos + ((BODY.top + BODY.bottom) / 2) * (s.birdH / s.height) * 100
		fly(mid + s.vel * 2.2 > aim)
	}, [fly])

	const startLoop = useCallback(() => {
		if (raf.current) return
		let last = performance.now()
		let bank = 0
		const frame = (now: number) => {
			raf.current = 0
			const playing = mode.current === 'play'
			if (!playing && (mode.current === 'over' || !sim.current.inView || prefersReducedMotion())) return
			bank += Math.min(100, now - last)
			last = now
			while (bank >= STEP_MS) {
				if (mode.current === 'play') step()
				else if (mode.current === 'demo') demoStep()
				bank -= STEP_MS
			}
			paint()
			raf.current = requestAnimationFrame(frame)
		}
		raf.current = requestAnimationFrame(frame)
	}, [step, demoStep, paint])

	// Starts (or restarts) a run. The jetpack carries him for the first moments, so he never drops straight away.
	const startGame = useCallback(() => {
		if (mode.current === 'over') {
			if (performance.now() - overAt.current < RESTART_HOLD_MS) return false
			setGameOver(false)
		}
		if (mode.current === 'play') return true
		mode.current = 'play'
		setGameStarted(true)
		reset()
		sim.current.vel = MAX_UP * 0.4
		startLoop()
		return true
	}, [reset, startLoop])
	const press = useCallback(() => { if (startGame()) holding.current = true }, [startGame])
	const release = useCallback(() => { holding.current = false }, [])

	useEffect(() => {
		const area = areaRef.current
		if (!area) return
		const measure = () => {
			const s = sim.current
			s.birdX = area.clientWidth * 0.2
			s.height = area.clientHeight
			const bird = birdRef.current, ground = area.querySelector<HTMLElement>('.flappy-ground')
			if (bird) { s.birdW = bird.offsetWidth; s.birdH = bird.offsetHeight }
			s.ground = ground ? ground.offsetTop : s.height - 60
			// his boots touch the ground at the floor, and his head the top at the ceiling
			s.floor = ((s.ground - BODY.bottom * s.birdH + 2) / s.height) * 100
			if (glowRef.current) glowRef.current.style.top = `${s.ground - 16}px`
			area.style.setProperty('--jet-ground', `${Math.max(0, s.height - s.ground)}px`)
			area.style.setProperty('--gate-h', `${Math.max(0, s.ground - 108 - 46)}px`)
			if (bgRef.current) {
				if (!scene.current) scene.current = createJetScene(bgRef.current)
				scene.current.resize(area.clientWidth, area.clientHeight, s.ground)
			}
			s.ceiling = ((-BODY.top * s.birdH + 6) / s.height) * 100
			paint()
		}
		measure()
		const app = document.querySelector('.app')
		const mo = app ? new MutationObserver(() => { scene.current?.rebuild(); paint() }) : null
		if (app && mo) mo.observe(app, { attributes: true, attributeFilter: ['class'] })
		const ro = new ResizeObserver(measure)
		ro.observe(area)
		return () => { ro.disconnect(); mo?.disconnect() }
	}, [paint])

	useEffect(() => {
		const section = sectionRef.current
		if (!section) return
		const io = new IntersectionObserver(([e]) => {
			sim.current.inView = e.isIntersecting
			if (e.isIntersecting) startLoop()
		}, { threshold: 0.1 })
		io.observe(section)
		// Space belongs to the game only while the game itself is mostly on screen; everywhere else it moves the page one
		// section, smoothly (motion/index.ts). Before, the game took Space as soon as a sliver of the section showed, and
		// the page's own Space scroll fought the smooth scrolling: the jumps.
		const area = areaRef.current
		const html = document.documentElement
		const claim = area ? new IntersectionObserver(([e]) => { sim.current.gameOn = e.intersectionRatio >= 0.6; html.classList.toggle('space-for-game', sim.current.gameOn) }, { threshold: [0, 0.6, 1] }) : null
		if (area && claim) claim.observe(area)
		return () => {
			claim?.disconnect()
			html.classList.remove('space-for-game')
			io.disconnect()
			cancelAnimationFrame(raf.current)
			raf.current = 0
		}
	}, [startLoop])

	// Space only plays the game while the game is on screen; elsewhere it scrolls the page as usual.
	useEffect(() => {
		const handleKeyPress = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement
			const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
			// on the coupon, Space presses the copy button like any button
			if (target.closest?.('.flappy-coupon, .coupon-store')) return
			if ((e.code === 'Space' || e.key === ' ') && !isTyping && sim.current.gameOn) {
				e.preventDefault()
				if (!e.repeat) press()
			}
		}
		const handleKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space' || e.key === ' ') release() }
		window.addEventListener('keydown', handleKeyPress)
		window.addEventListener('keyup', handleKeyUp)
		window.addEventListener('blur', release)
		return () => {
			window.removeEventListener('keydown', handleKeyPress)
			window.removeEventListener('keyup', handleKeyUp)
			window.removeEventListener('blur', release)
		}
	}, [press, release])

	useMotion(sectionRef, () => {
		const q = gsap.utils.selector(sectionRef.current)
		writeIn(q('.write')[0])
		const arrive = { trigger: q('.flappy-game-wrapper')[0], start: 'top 82%', once: true }
		gsap.fromTo(q('.flappy-game-area'), { clipPath: 'inset(0% 48% 0% 48% round 16px)' }, { clipPath: 'inset(0% 0% 0% 0% round 16px)', duration: 1.5, scrollTrigger: arrive, clearProps: 'clipPath' })
		gsap.from(q('.flappy-instructions'), { autoAlpha: 0, y: 24, duration: 1, delay: 0.55, scrollTrigger: arrive })
		gsap.from(q('.skills-strip'), { autoAlpha: 0, y: 18, duration: 1, delay: 0.35, scrollTrigger: { trigger: q('.skills-strip')[0], start: 'top 95%', once: true } })
	})

	const collectedSkillsCount = collected.size
	const code = couponCode(codeTag, collectedSkillsCount)
	const copyCode = useCallback(() => {
		const done = () => setCopied(true)
		if (navigator.clipboard?.writeText) navigator.clipboard.writeText(code).then(done, () => {})
	}, [code])
	const stripNames = skills.map((s) => s.name)

	return (
		<section id="skills" ref={sectionRef} className="section tone-2 tone-sep skills-flappy-section">
			<div className="container">
				<h2><ScriptTitle text="My Skills" /></h2>
				<div className="flappy-game-wrapper">
					{!gameStarted && !gameOver && (
						<div className="flappy-instructions">
							<div className="instructions-content">
								<h3>Fly through my skills</h3>
								<div className="flappy-coupon mini" role="img" aria-label={`Up to ${skills.length}% off Lumina Labs: 1% for every skill you collect`}>
									<div className="coupon-stub">
										<span className="coupon-upto">up to</span>
										<span className="coupon-pct">{skills.length}<small>%</small></span>
										<span className="coupon-off">off</span>
									</div>
									<div className="coupon-body">
										<span className="coupon-brand">
											<img src="/lumina-app-icon.png" alt="" loading="lazy" decoding="async" />
											Lumina Labs
										</span>
										<span className="coupon-note">1% off per skill</span>
									</div>
								</div>
								<div className="spacebar-hint">
									{touch ? <HandFinger size={18} /> : <Keyboard size={18} />}
									{touch ? 'HOLD TO FLY' : 'HOLD SPACE TO FLY'}
								</div>
							</div>
						</div>
					)}

					{gameOver && (
						<div className={`flappy-game-over${collectedSkillsCount ? ' has-coupon' : ''}`}>
							<div className="game-over-content">
								<h3>{collectedSkillsCount === skills.length ? 'All Skills Collected!' : collectedSkillsCount ? `${collectedSkillsCount} / ${skills.length} skills collected` : 'Run complete'}</h3>
								<p className="flappy-final">
									{collectedSkillsCount ? 'Your reward' : `Fly into the skills · each one is 1% off Lumina Labs`}
								</p>
								{collectedSkillsCount > 0 && (
									<div className={`flappy-coupon${copied ? ' is-torn' : ''}`} role="group" aria-label={`${collectedSkillsCount}% off Lumina Labs, code ${code}`}>
										<div className="coupon-stub">
											<span className="coupon-pct">{collectedSkillsCount}<small>%</small></span>
											<span className="coupon-off">off</span>
											<span className="coupon-serial">Nº {String(collectedSkillsCount).padStart(4, '0')}</span>
										</div>
										<div className="coupon-body">
											<span className="coupon-brand">
												<img src="/lumina-app-icon.png" alt="" loading="lazy" decoding="async" />
												Lumina Labs
											</span>
											<button type="button" className={`coupon-code${copied ? ' copied' : ''}`} onClick={copyCode} aria-label={`Copy code ${code}`}>
												<span>{code}</span>
												{copied ? <Check size={16} /> : <Copy size={16} />}
											</button>
											<span className="coupon-note" aria-live="polite">{copied ? 'Copied to clipboard' : '1% per skill · click to copy'}</span>
										</div>
									</div>
								)}
								{collectedSkillsCount > 0 && (
									<a className="coupon-store" href="https://apps.apple.com/us/app/lumina-labs/id6758263196" target="_blank" rel="noopener noreferrer" aria-label="Get Lumina Labs on the App Store">
										<span>Use it in the app</span>
										<img src="/app-store-badge.png" alt="Download on the App Store" loading="lazy" decoding="async" />
									</a>
								)}
								<button className="flappy-btn-restart" onClick={() => startGame()}>
									{collectedSkillsCount === skills.length
										? (touch ? 'Tap to play again' : 'Hold SPACE to play again')
										: collectedSkillsCount
											? (touch ? 'Tap to try for more' : 'Hold SPACE to try for more')
											: (touch ? 'Tap to fly again' : 'Hold SPACE to fly again')}
								</button>
							</div>
						</div>
					)}



					<div
						className="flappy-game-area"
						ref={areaRef}
						onPointerDown={(e) => { if (e.button === 0) { e.preventDefault(); press() } }}
						onPointerUp={release}
						onPointerLeave={release}
						onPointerCancel={release}
						onContextMenu={(e) => e.preventDefault()}
					>
						<div className="flappy-sky">
							<div className="flappy-cloud cloud-1"></div>
							<div className="flappy-cloud cloud-2"></div>
							<div className="flappy-cloud cloud-3"></div>

							{/* the city, drawn on a canvas in layers (jetScene.ts) */}
							<canvas ref={bgRef} className="jet-bg" aria-hidden="true" />

							{/* His AI twin, sitting into the jetpack the way you would on a real one, hovering: an 8-frame loop rendered
							    from the same 3D twin. The two flames under the pack's nozzles are drawn and driven here (paint). */}
							<div ref={birdRef} className={`flappy-bird is-jet${gameOver ? ' is-done' : ''}`}>
								<span className="flappy-twin-wrap" aria-hidden="true">
									{NOZZLES.map(([x, y], i) => (
										<i key={i} ref={(el) => { flameEls.current[i] = el }} className="jet-flame" style={{ left: `${x * 100}%`, top: `${y * 100}%` }}>
											<b className="jf-glow" /><b className="jf-body" /><b className="jf-core" /><b className="jf-mach" /><b className="jf-mach" /><b className="jf-mach" />
										</i>
									))}
									<i className="jet-pack-light" />
									<span ref={sheetRef} className="flappy-twin" />
									<span ref={sheetNextRef} className="flappy-twin is-next" />
								</span>
							</div>

							{/* exhaust sparks, and the jetpack's light on the ground under him */}
							<div className="jet-sparks" aria-hidden="true">
								{Array.from({ length: SPARKS }, (_, i) => <i key={i} ref={(el) => { sparkEls.current[i] = el }} />)}
							</div>
							<div ref={glowRef} className="jet-ground-glow" aria-hidden="true" />

							{burst && gameStarted && !gameOver && (
								<div key={burst.n} className="flappy-burst" style={{ top: `${burst.top}%` }} aria-hidden="true">
									<span className="burst-ring"></span>
									<span className="burst-text">{burst.name}<small>+1% off</small></span>
								</div>
							)}

							{/* the course: a chip for every skill, flowing up and down; fly into one to take it */}
							<div className="pipes-container jet-course" ref={pipesRef}>
								{skills.map((skill, index) => {
									const SkillIcon = skill.icon
									return (
										<div
											key={skill.id}
											ref={(el) => { orbEls.current[index] = el }}
											className={`skill-orb${collected.has(index) ? ' is-taken' : ''}`}
											style={{ left: `${FIRST_ORB + index * ORB_GAP}px`, top: `${orbY(index)}%` }}
										>
											<span className="orb-chip"><SkillIcon size={22} /></span>
											<span className="orb-name">{skill.name}</span>
										</div>
									)
								})}

								{/* the finish: a gate of light across the whole sky, between two masts */}
								<div className="finish-gate" style={{ left: `${endOfCourse}px` }} aria-hidden="true">
									<i className="fg-mast is-top" /><i className="fg-mast is-bottom" />
									<span className="fg-label">Finish</span>
								</div>
							</div>

							<svg className="gum-sheet" aria-hidden="true">
								<defs>
									<linearGradient id="gum-fill" x1="0" y1="0" x2="0" y2="1">
										<stop offset="0" stopColor="#ffb3d9" /><stop offset=".5" stopColor="#c9b6ff" /><stop offset="1" stopColor="#8fc4ff" />
									</linearGradient>
								</defs>
								<path ref={gumRef} className="gum-body" />
								<path ref={gumHi} className="gum-hi" />
							</svg>
							<div className="flappy-ground"></div>
							<i className="jet-vignette" aria-hidden="true" />
							<i className="jet-grain" aria-hidden="true" />

							{/* The tally: top centre, big and easy to read while flying (the client, 2026-11-23). */}
							{gameStarted && !gameOver && (
								<div className="flappy-tally is-top" role="status" aria-label={`${collectedSkillsCount} of ${skills.length} skills collected, ${collectedSkillsCount}% off Lumina Labs`}>
									<span className="tally-skills"><b key={collectedSkillsCount}>{collectedSkillsCount}</b><i>/ {skills.length}</i></span>
									<span className="tally-bar" aria-hidden="true"><em style={{ transform: `scaleX(${collectedSkillsCount / skills.length})` }} /></span>
									<span className="tally-off">{collectedSkillsCount}% off Lumina Labs</span>
								</div>
							)}
						</div>
					</div>
				</div>

				<div className="skills-strip" aria-label={`Skills: ${stripNames.join(', ')}`}>
					<div className="skills-strip-track" aria-hidden="true">
						{[0, 1].map((copy) => stripNames.map((name) => <span key={`${copy}-${name}`}>{name}</span>))}
					</div>
				</div>
			</div>
		</section>
	)
})
