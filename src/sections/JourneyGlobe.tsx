import { memo, useEffect, useRef, useState } from 'react'
import { CITIES } from '../journeyMap'
import { timelineData } from '../content'
import type { GlobeApi } from '../globe/globe'
import JourneyMap from './JourneyMap'
import { LATLON } from '../journeyLog'

// The Resume's map, round 4: a 3D globe (src/globe/globe.ts) that turns to each entry's city and draws the route leg by leg. Until three.js has
// loaded, and for good without a real GPU or with reduced motion, the flat dotted map from round 3 shows instead (same cities, same clicks).

const LEFT: Record<string, boolean> = { atx: true, nyc: true } // labels on the left of their dot, so neighbours never collide

export default memo(function JourneyGlobe({ active, onSelect }: { active: number; onSelect?: (i: number) => void }) {
	const wrap = useRef<HTMLElement>(null)
	const canvas = useRef<HTMLCanvasElement>(null)
	const api = useRef<GlobeApi | null>(null)
	const activeRef = useRef(active)
	const [ready, setReady] = useState(false)
	const [labels, setLabels] = useState<Record<string, { x: number; y: number; front: number } | null>>({})
	activeRef.current = active

	useEffect(() => {
		const el = wrap.current, cv = canvas.current
		if (!el || !cv || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
		let gone = false
		const near = new IntersectionObserver(async ([e]) => {
			if (!e.isIntersecting) return
			near.disconnect()
			const { createGlobe } = await import('../globe/globe')
			if (gone) return
			const g = await createGlobe(cv, Object.entries(LATLON).map(([key, v]) => ({ key, ...v })), timelineData.map((t) => t.city)).catch(() => null)
			if (!g || gone) { g?.dispose(); return }
			api.current = g
			g.setLight(!!document.querySelector('.app.color-mode'))
			g.onLabels(setLabels)
			g.setActive(activeRef.current, false)
			setReady(true)
		}, { rootMargin: '700px 0px' })
		near.observe(el)
		// draws only while on screen
		const seen = new IntersectionObserver(([e]) => api.current?.setVisible(e.isIntersecting))
		seen.observe(el)
		const ro = new ResizeObserver(() => api.current?.resize())
		ro.observe(cv)
		// follows the theme toggle
		const app = document.querySelector('.app')
		const mo = new MutationObserver(() => api.current?.setLight(!!app?.classList.contains('color-mode')))
		if (app) mo.observe(app, { attributes: true, attributeFilter: ['class'] })
		return () => {
			gone = true
			near.disconnect(); seen.disconnect(); ro.disconnect(); mo.disconnect()
			api.current?.dispose()
			api.current = null
		}
	}, [])

	useEffect(() => { api.current?.setActive(active, true) }, [active])

	const here = timelineData[active].city
	const been = new Set(timelineData.slice(0, active + 1).map((e) => e.city))
	const pick = (key: string) => {
		if (!onSelect) return
		const idx = timelineData.map((e, i) => (e.city === key ? i : -1)).filter((i) => i >= 0)
		if (!idx.length || idx.includes(active)) return
		onSelect(idx.reduce((best, i) => (Math.abs(i - active) < Math.abs(best - active) || (Math.abs(i - active) === Math.abs(best - active) && i > best) ? i : best), idx[0]))
	}

	return (
		<figure ref={wrap} className={`journey-globe${ready ? ' is-ready' : ''}`} aria-label={`Map: ${CITIES[here].name}`}>
			<div className="journey-globe-flat"><JourneyMap active={active} onSelect={onSelect} /></div>
			<canvas
				ref={canvas}
				className="journey-globe-canvas"
				aria-hidden="true"
				onClick={(e) => {
					const r = e.currentTarget.getBoundingClientRect()
					const key = api.current?.pick(e.clientX - r.left, e.clientY - r.top)
					if (key) pick(key)
				}}
			/>
			{ready && (
				<div className="journey-globe-labels" aria-hidden="true">
					{Object.keys(LATLON).map((k) => {
						const p = labels[k]
						if (!p) return null
						return (
							<span
								key={k}
								className={`jg-label${k === here ? ' is-here' : been.has(k) ? ' is-been' : ''}${LEFT[k] ? ' is-left' : ''}`}
								style={{ transform: `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`, opacity: Math.min(1, (p.front - 0.12) * 4) }}
								onClick={() => pick(k)}
							>
								<i className="jg-text">{CITIES[k].name.toUpperCase()}</i>
							</span>
						)
					})}
				</div>
			)}
		</figure>
	)
})
