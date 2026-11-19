// A title in real calligraphy (the client, 2026-11-19: "every title in calligraphy, real this time, with an animation; the hero unique").
// The words are outlines of two script typefaces (src/scriptTitles.ts, made by scripts/script-titles.py): Pinyon Script for the
// section titles, Monsieur La Doulaise for his name in the hero. The first time a title comes into view the pen writes it: each
// letter is traced in outline, left to right, and the ink fills in just behind the pen. The real words stay in the page for search
// engines and screen readers.
import { useEffect, useId, useRef, useState } from 'react'
import { SCRIPT } from '../scriptTitles'

type Props = {
	text: string
	/** letter size, in em of the surrounding text */
	scale?: number
	/** start only when told (the hero waits for its opening); otherwise when it comes into view */
	go?: boolean
	className?: string
}

export default function ScriptTitle({ text, scale = 1.75, go, className = '' }: Props) {
	const s = SCRIPT[text]
	const ref = useRef<HTMLSpanElement>(null)
	const [seen, setSeen] = useState(false)
	const id = useId().replace(/:/g, '')

	useEffect(() => {
		if (go !== undefined) return
		const el = ref.current
		if (!el) return
		const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect() } }, { rootMargin: '0px 0px -18% 0px' })
		io.observe(el)
		return () => io.disconnect()
	}, [go])

	if (!s) return <>{text}</>
	const on = go ?? seen
	const hero = s.k === 'hero'
	return (
		<span ref={ref} className={`script-title${hero ? ' is-hero' : ''}${on ? ' is-written' : ''} ${className}`} style={{ ['--n' as string]: s.g.length }}>
			<span className="script-sr">{text}</span>
			<svg viewBox={`${s.x} ${s.y} ${s.w} ${s.h}`} style={{ height: `${(s.h / 100) * scale}em`, width: `${(s.w / 100) * scale}em` }} aria-hidden="true" focusable="false">
				<defs>
					{/* solid ink on top, going to a quiet blue in the lower part of the letters, as the site's titles always did */}
					<linearGradient id={`sg${id}`} x1="0" y1={s.y} x2="0" y2={s.y + s.h} gradientUnits="userSpaceOnUse">
						<stop offset="0.35" className="sg-top" />
						<stop offset="1" className="sg-bottom" />
					</linearGradient>
				</defs>
				<g className="script-ink">
					{s.g.map((d, i) => (
						<path key={i} d={d} pathLength={1} style={{ ['--i' as string]: i, fill: `url(#sg${id})` }} />
					))}
				</g>
			</svg>
		</span>
	)
}
