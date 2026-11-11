// The Resume's "Journey Log". Only his
// own data from content.ts: where each entry happened, when, and what kind it was. Coordinates are the cities the globe already uses.

export const LATLON: Record<string, { lat: number; lon: number }> = {
	mex: { lat: 19.43, lon: -99.13 },
	atx: { lat: 30.27, lon: -97.74 },
	nola: { lat: 29.95, lon: -90.07 },
	nyc: { lat: 40.71, lon: -74.01 },
}

/** Short names for the timeline's nodes and the years strip. */
export const SHORT: Record<string, string> = {
	education1: 'American School',
	education2: 'UT Austin',
	work1: 'TV Azteca',
	work2: 'UnifAI',
	luminalabs: 'Lumina Labs',
	leadership: 'Diaita',
}

export const TYPE: Record<string, string> = { education: 'Education', work: 'Experience', leadership: 'Leadership' }

export const coords = (key: string) => {
	const c = LATLON[key]
	if (!c) return ''
	return `${Math.abs(c.lat).toFixed(2)}° ${c.lat >= 0 ? 'N' : 'S'} · ${Math.abs(c.lon).toFixed(2)}° ${c.lon >= 0 ? 'E' : 'W'}`
}

/** Great-circle distance in km, rounded to the nearest 10. */
export function distanceKm(a: string, b: string) {
	const p = LATLON[a], q = LATLON[b]
	if (!p || !q) return 0
	const r = Math.PI / 180
	const dLat = (q.lat - p.lat) * r, dLon = (q.lon - p.lon) * r
	const h = Math.sin(dLat / 2) ** 2 + Math.cos(p.lat * r) * Math.cos(q.lat * r) * Math.sin(dLon / 2) ** 2
	return Math.round((2 * 6371 * Math.asin(Math.sqrt(h))) / 10) * 10
}

/** The figures in a line of his achievements: money, counts, percentages. */
export const FIGURE = /(\$\d[\d,]*(?:\.\d+)?[MKB]?|\d[\d,]*(?:\.\d+)?(?:\+|%)|\b\d+\b(?= \w))/g

/** Rolls a figure's text up from zero, keeping its prefix, separators, decimals and suffix. */
export function countText(text: string, f: number) {
	const m = text.match(/^(\D*)([\d,]*\.?\d+)(.*)$/)
	if (!m) return text
	const [, pre, num, post] = m
	const decimals = num.includes('.') ? num.split('.')[1].length : 0
	const value = Number(num.replace(/,/g, '')) * f
	let out = value.toFixed(decimals)
	if (num.includes(',')) out = Number(out).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
	return pre + out + post
}
