import { memo, useEffect, useRef, useState } from 'react'
import { Code, Download, Mail, Rotate } from '../icons'
import { analytics } from '../services/analytics'
import { gsap, isTouch, pointerTilt, prefersReducedMotion, useMotion, writeIn } from '../motion'
import SignatureCanvas, { type SignatureHandle } from '../motion/SignatureCanvas'

const EMAIL = 'penamorrosm@gmail.com'
const INK: [number, number, number] = [44, 44, 44]

export default memo(function Contact() {
	const sectionRef = useRef<HTMLElement>(null)
	const signatureRef = useRef<SignatureHandle>(null)
	const backSignatureRef = useRef<SignatureHandle>(null)
	// Round 4: the card is a real card, with thickness, and it turns over to a back with his signature and links.
	const [turned, setTurned] = useState(false)
	const peeked = useRef(false)

	useEffect(() => {
		backSignatureRef.current?.setProgress(1)
		if (prefersReducedMotion()) signatureRef.current?.setProgress(1)
	}, [])
	const turn = () => { peeked.current = true; setTurned((t) => !t) }

	useMotion(sectionRef, () => {
		const section = sectionRef.current!
		const q = gsap.utils.selector(section)
		writeIn(q('.write')[0])

		const card = q('.business-card')[0] as HTMLElement
		const arrive = { trigger: card, start: 'top 82%', once: true }
		gsap.from(card, { y: 70, rotationX: 14, autoAlpha: 0, duration: 1.5, scrollTrigger: arrive })
		gsap.from(q('.business-card-top > *, .business-card-quote, .contact-item'), { y: 14, autoAlpha: 0, duration: 0.9, stagger: 0.07, delay: 0.35, scrollTrigger: arrive })

		// The signature is the last thing written on the page.
		const ink = { p: 0 }
		gsap.to(ink, {
			p: 1,
			duration: 2.2,
			delay: 0.8,
			ease: 'power1.inOut',
			scrollTrigger: arrive,
			onUpdate: () => signatureRef.current?.setProgress(ink.p),
			// once signed, it peeks round its edge, so people see it has another side
			onComplete: () => {
				if (peeked.current || isTouch()) return
				peeked.current = true
				// a CSS animation, not a tween: an inline transform left behind would override the turn
				window.setTimeout(() => { card.classList.add('is-peek'); window.setTimeout(() => card.classList.remove('is-peek'), 1700) }, 500)
			},
		})

		const container = q('.business-card-container')[0] as HTMLElement
		return pointerTilt(container, card, 7, (x, y) => {
			card.style.setProperty('--sx', `${x * 100}%`)
			card.style.setProperty('--sy', `${y * 100}%`)
		})
	})

	return (
		<section id="contact" ref={sectionRef} className="section alt tone-1 tone-sep">
			<div className="container">
				<h2><span className="write">Contact Card</span></h2>
				<div className="business-card-container">
					<div
						className={`business-card is-3d${turned ? ' is-turned' : ''}`}
						onClick={(e) => { if (!(e.target as Element).closest('a, button')) turn() }}
					>
						<div className="bc-flip">
							{[1, 2, 3].map((k) => <i key={k} className="bc-edge" aria-hidden="true" style={{ ['--z' as string]: `${-k}px` }} />)}
							<div className="bc-face bc-front" {...(turned ? { inert: '', 'aria-hidden': true } : {})}>
								<div className="business-card-background">
									<div className="business-card-quote">
										"My biggest goal isn't just to be happy — it's to make others happy along the way."
									</div>
								</div>

								<div className="business-card-content">
									<div className="business-card-top">
										<div className="business-card-profile">
											<img
												src="/iniciativa-propone-enfoque-integral-educacion.png"
												alt="Manuel Peña Morros"
												className="business-card-photo"
												loading="lazy"
												decoding="async"
											/>
										</div>
										<div className="business-card-info">
											<h3 className="business-card-name">Manuel Peña Morros</h3>
											<p className="business-card-title">Entrepreneur & Developer</p>
											<p className="business-card-location">Austin, TX</p>
										</div>
									</div>

									<div className="business-card-contact">
										<EmailRow />
										<a
											className="contact-item"
											href="https://github.com/penamorros"
											target="_blank"
											rel="noopener noreferrer"
											onClick={() => analytics.trackContactAttempt('github')}
										>
											<Code className="contact-icon" />
											<span>github.com/penamorros</span>
										</a>
									</div>

									<div className="business-card-signature">
										<SignatureCanvas ref={signatureRef} ink={INK} className="signature-img" label="Manuel Peña Morros signature" />
									</div>
								</div>

								<button type="button" className="bc-turn" onClick={turn} aria-label="Turn the card over">
									<Rotate size={14} />
									<span>Turn over</span>
								</button>
							</div>
							<div className="bc-face bc-back" {...(turned ? {} : { inert: '', 'aria-hidden': true })}>
								<div className="bc-back-inner">
									<SignatureCanvas ref={backSignatureRef} ink={INK} className="bc-back-signature" label="Manuel Peña Morros signature" />
									<p className="bc-back-name">Manuel Peña Morros</p>
									<p className="bc-back-role">Founder &amp; CEO, Lumina Labs · Austin, TX</p>
									<div className="bc-back-links">
										<a href={`mailto:${EMAIL}`} onClick={() => analytics.trackContactAttempt('email')}><Mail size={15} /><span>Email</span></a>
										<a href="https://github.com/penamorros" target="_blank" rel="noopener noreferrer" onClick={() => analytics.trackContactAttempt('github')}><Code size={15} /><span>GitHub</span></a>
										<a href="/resume.pdf" download="Manuel_Pena_Morros_Resume.pdf"><Download size={15} /><span>Résumé</span></a>
									</div>
								</div>
								<button type="button" className="bc-turn" onClick={turn} aria-label="Turn the card back">
									<Rotate size={14} />
									<span>Turn back</span>
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	)
})

// On a computer a click copies the address; on a phone it opens the mail app.
function EmailRow() {
	const [copied, setCopied] = useState(false)

	return (
		<a
			className="contact-item"
			href={`mailto:${EMAIL}`}
			onClick={(e) => {
				analytics.trackContactAttempt('email')
				if (isTouch() || !navigator.clipboard) return
				e.preventDefault()
				navigator.clipboard.writeText(EMAIL).then(() => {
					setCopied(true)
					window.setTimeout(() => setCopied(false), 1800)
				}).catch(() => { window.location.href = `mailto:${EMAIL}` })
			}}
		>
			<Mail className="contact-icon" />
			<span>{EMAIL}</span>
			<span className={`contact-copied${copied ? ' on' : ''}`} aria-live="polite">{copied ? 'Copied' : ''}</span>
		</a>
	)
}
