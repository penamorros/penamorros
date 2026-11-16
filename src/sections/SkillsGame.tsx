import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Check, Copy, HandFinger, Keyboard } from '../icons'
import { skills } from '../content'
import { gsap, isTouch, prefersReducedMotion, useMotion, writeIn } from '../motion'

const GRAVITY = 0.5
const FALL_SCALE = 0.3
const JUMP = -8
const SCROLL_SPEED = 2
const FLOOR = 85
const CEILING = 5
const FIRST_PIPE = 400
const PIPE_GAP = 200
const GAP_SIZE = 70
const STEP_MS = 1000 / 60
// A fair start (the client, 2026-11-16: "I always lose at the start"): the first pipe is a little further off, and for
// the first second and a half the bird keeps itself in the air, so nobody loses while still finding the key.
const RUNWAY = 160
const GRACE_STEPS = 90

const gapTopFor = (index: number) => 15 + (index % 3) * 20
const endOfCourse = FIRST_PIPE + skills.length * PIPE_GAP + 50
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
	const sim = useRef({ pos: 40, vel: 0, offset: 0, birdX: 200, height: 600, inView: false, age: 0 })
	const collectedRef = useRef(new Set<number>())
	const mode = useRef<'demo' | 'play' | 'over'>('demo')
	const raf = useRef(0)
	const overAt = useRef(0)

	const paint = useCallback(() => {
		const s = sim.current
		if (birdRef.current) birdRef.current.style.transform = `translate3d(0, ${(s.pos / 100) * s.height}px, 0) rotate(${Math.max(-18, Math.min(30, s.vel * 3))}deg)`
		if (pipesRef.current) pipesRef.current.style.transform = `translate3d(${-s.offset}px, 0, 0)`
	}, [])

	const reset = useCallback(() => {
		Object.assign(sim.current, { pos: 40, vel: 0, offset: 0, age: 0 })
		collectedRef.current = new Set()
		setCollected(new Set())
		setCopied(false)
		setBurst(null)
		paint()
	}, [paint])

	const endGame = useCallback(() => {
		mode.current = 'over'
		overAt.current = performance.now()
		setCodeTag(randomTag())
		setGameOver(true)
	}, [])

	const step = useCallback(() => {
		const s = sim.current
		s.age++
		s.vel += GRAVITY
		// in the opening moments he flaps for himself before he can sink
		if (s.age < GRACE_STEPS && s.pos > 52 && s.vel > 0) s.vel = JUMP * 0.8
		s.pos = Math.max(CEILING, Math.min(FLOOR, s.pos + s.vel * FALL_SCALE))
		// the top of the sky is only a ceiling: tapping too eagerly bumps it, it doesn't end the game
		if (s.pos <= CEILING && s.vel < 0) s.vel = 0
		if (s.pos >= FLOOR) {
			endGame()
			return
		}

		s.offset += SCROLL_SPEED
		for (let index = 0; index < skills.length; index++) {
			if (collectedRef.current.has(index)) continue
			const pipeScreenX = FIRST_PIPE + index * PIPE_GAP - s.offset
			const gapPosition = gapTopFor(index)
			const gapTop = gapPosition - 15
			const gapBottom = gapPosition + GAP_SIZE + 15
			const birdTop = s.pos
			const birdBottom = s.pos + 12
			const isAtPipe = Math.abs(pipeScreenX - s.birdX) < 80
			const isInGap = birdTop >= gapTop && birdBottom <= gapBottom

			if (isAtPipe && isInGap) {
				collectedRef.current.add(index)
				setCollected(new Set(collectedRef.current))
				setBurst({ n: collectedRef.current.size, top: s.pos, name: skills[index].name })
				break
			}
			if (pipeScreenX < s.birdX - 70 && (birdTop < gapTop || birdBottom > gapBottom)) {
				endGame()
				break
			}
		}

		if (s.offset + s.birdX >= endOfCourse - 50 && collectedRef.current.size === skills.length) endGame()
	}, [endGame])

	// While nobody plays, the bird flies itself through the gaps so the section looks alive.
	const demoStep = useCallback(() => {
		const s = sim.current
		s.vel += GRAVITY
		s.pos += s.vel * FALL_SCALE
		s.offset += SCROLL_SPEED
		if (s.offset + s.birdX > endOfCourse + 200) s.offset = 0
		const next = Math.max(0, Math.ceil((s.offset + s.birdX - 60 - FIRST_PIPE) / PIPE_GAP))
		const aim = gapTopFor(next % skills.length) + GAP_SIZE / 2 - 6
		if (s.pos > aim && s.vel >= 0) s.vel = JUMP * 0.8
	}, [])

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

	const jumpBird = useCallback(() => {
		if (mode.current === 'over') {
			if (performance.now() - overAt.current < RESTART_HOLD_MS) return
			setGameOver(false)
		}
		// The press that starts (or restarts) a game is also its first flap: the bird lifts instead of dropping
		// straight to the floor while the player is still finding the key.
		if (mode.current !== 'play') {
			mode.current = 'play'
			setGameStarted(true)
			reset()
			sim.current.vel = JUMP
			sim.current.offset = -RUNWAY
			startLoop()
			return
		}
		sim.current.vel = JUMP
	}, [reset, startLoop])

	useEffect(() => {
		const area = areaRef.current
		if (!area) return
		const measure = () => {
			sim.current.birdX = area.clientWidth * 0.2
			sim.current.height = area.clientHeight
			paint()
		}
		measure()
		const ro = new ResizeObserver(measure)
		ro.observe(area)
		return () => ro.disconnect()
	}, [paint])

	useEffect(() => {
		const section = sectionRef.current
		if (!section) return
		const io = new IntersectionObserver(([e]) => {
			sim.current.inView = e.isIntersecting
			if (e.isIntersecting) startLoop()
		}, { threshold: 0.1 })
		io.observe(section)
		return () => {
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
			if ((e.code === 'Space' || e.key === ' ') && !isTyping && sim.current.inView) {
				e.preventDefault()
				jumpBird()
			}
		}
		window.addEventListener('keydown', handleKeyPress)
		return () => window.removeEventListener('keydown', handleKeyPress)
	}, [jumpBird])

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
				<h2><span className="write">My Skills</span></h2>
				<div className="flappy-game-wrapper">
					{!gameStarted && !gameOver && (
						<div className="flappy-instructions">
							<div className="instructions-content">
								<h3>Collect my skills</h3>
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
									{touch ? 'TAP TO FLY' : 'SPACE TO FLY'}
								</div>
							</div>
						</div>
					)}

					{gameOver && (
						<div className={`flappy-game-over${collectedSkillsCount ? ' has-coupon' : ''}`}>
							<div className="game-over-content">
								<h3>{collectedSkillsCount === skills.length ? 'All Skills Collected!' : collectedSkillsCount ? `${collectedSkillsCount} / ${skills.length} skills collected` : 'Game Over!'}</h3>
								<p className="flappy-final">
									{collectedSkillsCount ? 'Your reward' : `0 / ${skills.length} skills · each one is 1% off Lumina Labs`}
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
								<button className="flappy-btn-restart" onClick={jumpBird}>
									{collectedSkillsCount === skills.length
										? (touch ? 'Tap to play again' : 'Press SPACEBAR to play again')
										: collectedSkillsCount
											? (touch ? 'Tap to try for more' : 'Press SPACEBAR to try for more')
											: (touch ? 'Tap to Restart' : 'Press SPACEBAR to Restart')}
								</button>
							</div>
						</div>
					)}



					<div
						className="flappy-game-area"
						ref={areaRef}
						onClick={jumpBird}
					>
						<div className="flappy-sky">
							<div className="flappy-cloud cloud-1"></div>
							<div className="flappy-cloud cloud-2"></div>
							<div className="flappy-cloud cloud-3"></div>

							<div ref={birdRef} className={`flappy-bird ${gameOver ? 'crashed' : ''}`}>
								<img
									src="/iniciativa-propone-enfoque-integral-educacion.png"
									alt="Manuel"
									className="flappy-bird-face"
									loading="lazy"
									decoding="async"
								/>
								<div className="flappy-wings">
									<div className="wing wing-left"></div>
									<div className="wing wing-right"></div>
								</div>
							</div>

							{burst && gameStarted && !gameOver && (
								<div key={burst.n} className="flappy-burst" style={{ top: `${burst.top}%` }} aria-hidden="true">
									<span className="burst-ring"></span>
									<span className="burst-text">{burst.name}<small>+1% off</small></span>
								</div>
							)}

							<div className="pipes-container" ref={pipesRef}>
								{skills.map((skill, index) => {
									const SkillIcon = skill.icon
									const isCollected = collected.has(index)
									const gapPosition = gapTopFor(index)

									return (
										<div
											key={skill.id}
											className={`flappy-pipe ${isCollected ? 'collected' : ''}`}
											style={{ left: `${FIRST_PIPE + index * PIPE_GAP}px` }}
										>
											<div className="pipe-segment pipe-top" style={{ height: `${gapPosition}%` }}>
												<div className="pipe-cap"></div>
												<div className="pipe-body">
													<div className="pipe-skill-icon">
														<SkillIcon size={24} />
													</div>
												</div>
											</div>

											<div className="pipe-gap" style={{ top: `${gapPosition}%`, height: `${GAP_SIZE}%` }}>
												<div
													className="gap-label"
													style={{
														top: gapPosition + GAP_SIZE > 80 ? '20%' : '50%',
														transform: gapPosition + GAP_SIZE > 80 ? 'translate(-50%, 0)' : 'translate(-50%, -50%)'
													}}
												>
													{skill.name}
												</div>
											</div>

											<div className="pipe-segment pipe-bottom" style={{ top: `${gapPosition + GAP_SIZE}%` }}>
												<div className="pipe-body">
													<div className="pipe-skill-icon">
														<SkillIcon size={24} />
													</div>
												</div>
												<div className="pipe-cap"></div>
											</div>

											{isCollected && (
												<div className="pipe-collected-effect" style={{ top: `${gapPosition + GAP_SIZE / 2}%` }}>
													<div className="collected-check"><Check size={20} /></div>
												</div>
											)}
										</div>
									)
								})}

								<div className="flappy-flag" style={{ left: `${endOfCourse}px` }}>
									<div className="flag-pole"></div>
									<div className="flag-banner">
										<div className="flag-text">FINISH</div>
									</div>
								</div>
							</div>

							<div className="flappy-ground"></div>

							{/* The tally sits on the ground strip, under the floor line, so it never covers a gap. */}
							{gameStarted && !gameOver && (
								<div className="flappy-tally" role="status">
									<span className="tally-skills"><b key={collectedSkillsCount}>{collectedSkillsCount}</b> / {skills.length} skills</span>
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
