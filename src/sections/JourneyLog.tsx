import React from 'react'
import { timelineData } from '../content'
import { CITIES } from '../journeyMap'
import { FIGURE, SHORT, TYPE, coords, distanceKm } from '../journeyLog'

// The Resume's "Journey Log". The same card, organised: who and where, numbered points with his figures picked out, one row of facts, and the globe with the leg just flown. Only his data from content.ts.

export type Entry = (typeof timelineData)[number]

export const pad2 = (n: number) => String(n).padStart(2, '0')
export const orgOf = (e: Entry) => (e.subtitle.includes('|') ? e.subtitle.split('|')[0].trim() : '')
export const cityOf = (e: Entry) => CITIES[e.city]?.name ?? (e.subtitle.split('|').pop() || '').trim()
export const shortOf = (e: Entry) => SHORT[e.id] ?? e.title

/** His figures ($2.5M, 1,000+, 40%) in bright mono, so a line is read by its result. */
export function Figures({ text }: { text: string }) {
	const out: React.ReactNode[] = []
	let last = 0
	for (const m of text.matchAll(FIGURE)) {
		const i = m.index ?? 0
		if (i > last) out.push(text.slice(last, i))
		out.push(<b key={i} className="tl-fig" data-fig={m[0]}>{m[0]}</b>)
		last = i + m[0].length
	}
	if (last < text.length) out.push(text.slice(last))
	return <>{out}</>
}

export function Facts({ entry }: { entry: Entry }) {
	return (
		<dl className="tl-facts">
			<div><dt>Period</dt><dd>{entry.period}</dd></div>
			<div><dt>Type</dt><dd>{TYPE[entry.type] ?? entry.type}</dd></div>
			<div><dt>Location</dt><dd>{cityOf(entry)}<small>{coords(entry.city)}</small></dd></div>
		</dl>
	)
}

export function Points({ items }: { items: string[] }) {
	return (
		<ol className={`tl-points${items.length === 1 ? ' is-one' : ''}`}>
			{items.map((a, k) => (
				<li key={a}>
					<span className="tl-n" aria-hidden="true">{pad2(k + 1)}</span>
					<span className="tl-t"><Figures text={a} /></span>
				</li>
			))}
		</ol>
	)
}

/** Under the globe: the leg it just drew (timeline order), or the city and its coordinates where there is no leg. */
export function Leg({ index }: { index: number }) {
	const here = timelineData[index].city
	const from = index > 0 ? timelineData[index - 1].city : ''
	if (!from || from === here) {
		return <p className="tl-leg"><b>{here.toUpperCase()}</b><span>{coords(here)}</span></p>
	}
	return <p className="tl-leg"><b>{from.toUpperCase()} → {here.toUpperCase()}</b><span>{distanceKm(from, here).toLocaleString('en-US')} km</span></p>
}
