import { memo, useEffect, useMemo, useRef } from 'react'
import { CITIES, DOTS } from '../journeyMap'
import { timelineData } from '../content'
import { gsap, prefersReducedMotion } from '../motion'

// The map from Version B, brought into the Resume (round 3, the client: "I like the map idea, maybe integrate it
// into the previous version somehow"). His four cities on a dotted map of Mexico and the US; as the resume steps
// from one entry to the next, the route draws itself between their cities with a spark, and the city of the
// entry in view lights up. Clicking a city opens the entry there.

const STEPS = 40
// His part of the map: Mexico City to New York, with room for the labels.
const VIEW = '104 24 346 286'
const cityOf = (i: number) => timelineData[i].city

type Seg = { d: string; pts: { x: number; y: number }[] }

function bow(a: { x: number; y: number }, b: { x: number; y: number }) {
	const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy)
	let nx = -dy / d, ny = dx / d
	if (ny > 0) { nx = -nx; ny = -ny } // bowed north, like a flight
	const k = Math.min(60, d * 0.28)
	const cx = mx + nx * k, cy = my + ny * k
	const pts = Array.from({ length: STEPS + 1 }, (_, i) => {
		const t = i / STEPS, u = 1 - t
		return { x: u * u * a.x + 2 * u * t * cx + t * t * b.x, y: u * u * a.y + 2 * u * t * cy + t * t * b.y }
	})
	return { d: `M${a.x} ${a.y} Q${cx} ${cy} ${b.x} ${b.y}`, pts }
}

// Labels sit where they can't run into a neighbour.
const LABEL: Record<string, { x: number; anchor: 'start' | 'end' }> = {
	mex: { x: 12, anchor: 'start' },
	atx: { x: -12, anchor: 'end' },
	nola: { x: 12, anchor: 'start' },
	nyc: { x: -12, anchor: 'end' },
}

export default memo(function JourneyMap({ active, onSelect }: { active: number; onSelect?: (i: number) => void }) {
	const svgRef = useRef<SVGSVGElement>(null)
	const prev = useRef(-1)
	const segs = useMemo<Seg[]>(() => timelineData.slice(1).map((e, i) => bow(CITIES[cityOf(i)], CITIES[e.city])), [])

	useEffect(() => {
		const svg = svgRef.current
		if (!svg) return
		const routes = svg.querySelectorAll<SVGPathElement>('.jm-route')
		const spark = svg.querySelector<SVGCircleElement>('.jm-spark')!
		const from = prev.current
		prev.current = active
		const still = prefersReducedMotion() || from < 0
		routes.forEach((path, s) => {
			const on = s < active
			gsap.killTweensOf(path)
			// the newest leg draws itself; the others are set at once
			if (!still && on && s === active - 1 && from < active) return
			gsap.set(path, { strokeDashoffset: on ? 0 : 1 })
		})
		gsap.killTweensOf(spark)
		if (still || active === 0 || from >= active) {
			gsap.set(spark, { opacity: 0 })
			return
		}
		const s = active - 1, path = routes[s], pts = segs[s].pts
		const p = { t: 0 }
		gsap.set(path, { strokeDashoffset: 1 })
		gsap.set(spark, { opacity: 1 })
		gsap.to(p, {
			t: 1, duration: 1.1, ease: 'power2.inOut',
			onUpdate: () => {
				path.style.strokeDashoffset = String(1 - p.t)
				const q = pts[Math.round(p.t * STEPS)]
				spark.setAttribute('cx', String(q.x))
				spark.setAttribute('cy', String(q.y))
			},
			onComplete: () => { gsap.to(spark, { opacity: 0, duration: 0.4 }) },
		})
		return () => { gsap.killTweensOf(p) }
	}, [active, segs])

	const here = cityOf(active)
	const been = new Set(timelineData.slice(0, active + 1).map((e) => e.city))
	const pick = (c: string) => {
		if (!onSelect) return
		// the entry at that city closest to the one in view, later ones first
		const idx = timelineData.map((e, i) => (e.city === c ? i : -1)).filter((i) => i >= 0)
		if (!idx.length || idx.includes(active)) return
		onSelect(idx.reduce((best, i) => (Math.abs(i - active) < Math.abs(best - active) || (Math.abs(i - active) === Math.abs(best - active) && i > best) ? i : best), idx[0]))
	}

	return (
		<figure className="journey-map" aria-label={`Map: ${CITIES[here].name}`}>
			<svg ref={svgRef} viewBox={VIEW} aria-hidden="true">
				<path className="jm-dots" d={DOTS} />
				{segs.map((s, i) => <path key={`g${i}`} className="jm-ghost" d={s.d} />)}
				{segs.map((s, i) => <path key={`r${i}`} className="jm-route" d={s.d} pathLength={1} />)}
				{Object.entries(CITIES).map(([k, c]) => (
					<g
						key={k}
						className={`jm-city${been.has(k) ? ' is-been' : ''}${k === here ? ' is-here' : ''}`}
						transform={`translate(${c.x} ${c.y})`}
						onClick={() => pick(k)}
					>
						<circle className="jm-hit" r={16} />
						<circle className="jm-ring" r={11} />
						<circle className="jm-c" r={4.6} />
						<text x={LABEL[k].x} y={4} textAnchor={LABEL[k].anchor}>{c.name.toUpperCase()}</text>
					</g>
				))}
				<circle className="jm-spark" r={3.6} />
			</svg>
		</figure>
	)
})
