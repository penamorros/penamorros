import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Check, HandFinger, Keyboard } from '../icons'
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

const gapTopFor = (index: number) => 15 + (index % 3) * 20
const endOfCourse = FIRST_PIPE + skills.length * PIPE_GAP + 50

export default memo(function SkillsGame() {
	const [gameStarted, setGameStarted] = useState(false)
	const [gameOver, setGameOver] = useState(false)
	const [collected, setCollected] = useState<ReadonlySet<number>>(new Set())
	const [touch] = useState(isTouch)

	const sectionRef = useRef<HTMLElement>(null)
	const areaRef = useRef<HTMLDivElement>(null)
	const birdRef = useRef<HTMLDivElement>(null)
	const pipesRef = useRef<HTMLDivElement>(null)

	// The loop works on refs so a frame never re-renders React.
	const sim = useRef({ pos: 40, vel: 0, offset: 0, birdX: 200, height: 600, inView: false })
	const collectedRef = useRef(new Set<number>())
	const mode = useRef<'demo' | 'play' | 'over'>('demo')
	const raf = useRef(0)

	const paint = useCallback(() => {
		const s = sim.current
		if (birdRef.current) birdRef.current.style.transform = `translate3d(0, ${(s.pos / 100) * s.height}px, 0) rotate(${Math.max(-18, Math.min(30, s.vel * 3))}deg)`
		if (pipesRef.current) pipesRef.current.style.transform = `translate3d(${-s.offset}px, 0, 0)`
	}, [])

	const reset = useCallback(() => {
		Object.assign(sim.current, { pos: 40, vel: 0, offset: 0 })
		collectedRef.current = new Set()
		setCollected(new Set())
		paint()
	}, [paint])

	const endGame = useCallback(() => {
		mode.current = 'over'
		setGameOver(true)
	}, [])

	const step = useCallback(() => {
		const s = sim.current
		s.vel += GRAVITY
		s.pos = Math.max(CEILING, Math.min(FLOOR, s.pos + s.vel * FALL_SCALE))
		if (s.pos >= FLOOR || s.pos <= CEILING) {
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
			mode.current = 'demo'
			setGameOver(false)
			setGameStarted(false)
			reset()
			startLoop()
			return
		}
		if (mode.current === 'demo') {
			mode.current = 'play'
			setGameStarted(true)
			reset()
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
	const stripNames = skills.map((s) => s.name)

	return (
		<section id="skills" ref={sectionRef} className="section tone-2 tone-sep skills-flappy-section">
			<div className="container">
				<h2><span className="write">My Skills</span></h2>
				<div className="flappy-game-wrapper">
					{!gameStarted && !gameOver && (
						<div className="flappy-instructions">
							<div className="instructions-content">
								<h3>{touch ? 'Tap to Play!' : 'Press SPACEBAR to Play!'}</h3>
								<p>{touch ? 'Tap to make the bird fly up' : 'Use SPACEBAR to make the bird fly up'}</p>
								<p>Collect all {skills.length} skills by flying through the pipes</p>
								<div className="spacebar-hint">
									{touch ? <HandFinger size={18} /> : <Keyboard size={18} />}
									{touch ? 'TAP' : 'SPACE'}
								</div>
							</div>
						</div>
					)}

					{gameOver && (
						<div className="flappy-game-over">
							<div className="game-over-content">
								<h3>{collectedSkillsCount === skills.length ? 'All Skills Collected!' : 'Game Over!'}</h3>
								<p className="flappy-final">{collectedSkillsCount} / {skills.length} skills</p>
								<button className="flappy-btn-restart" onClick={jumpBird}>
									{touch ? 'Tap to Restart' : 'Press SPACEBAR to Restart'}
								</button>
							</div>
						</div>
					)}

					{gameStarted && !gameOver && (
						<div className="flappy-counter" aria-live="polite">{collectedSkillsCount} / {skills.length}</div>
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
