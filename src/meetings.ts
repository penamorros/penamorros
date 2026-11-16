// Booking a call (the client, 2026-11-16). No calendar is connected: the open times are worked out from his class
// timetable below, and a request is saved (and e-mailed through a Netlify form) on the real site. He confirms by e-mail.
//
// TO UPDATE EACH SEMESTER: edit CLASSES. Times are minutes after midnight, Austin time. 1 = Monday … 5 = Friday.
import { isLiveSite } from './site-env'

export const MEETING_TZ = 'America/Chicago'
export const SLOT_MIN = 30
const DAY_START = 10 * 60 // 10:00 am
const DAY_END = 18 * 60 // 6:00 pm
const LEAD_HOURS = 12 // nothing sooner than this
const DAYS_SHOWN = 10 // weekdays ahead
const at = (h: number, m = 0) => h * 60 + m

// Fall 2026 (from his MyUT course schedule)
const CLASSES: Record<number, Array<[number, number]>> = {
	1: [[at(10), at(11)], [at(12), at(13)], [at(16), at(17)]], // M 305G · MUS 307 · UGS 303
	2: [[at(11), at(12)], [at(12, 30), at(14)]], // UGS 303 · C S 303E
	3: [[at(10), at(11)], [at(12), at(13)], [at(16), at(17)]],
	4: [[at(12, 30), at(14)], [at(16), at(17)], [at(17), at(18)]], // C S 303E · M 305G · MUS 307
	5: [[at(10), at(11)], [at(12), at(13)]],
}

const zoneFmt = new Intl.DateTimeFormat('en-US', { timeZone: MEETING_TZ, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })
function inZone(date: Date) {
	const p: Record<string, number> = {}
	for (const part of zoneFmt.formatToParts(date)) if (part.type !== 'literal') p[part.type] = Number(part.value)
	return p as { year: number; month: number; day: number; hour: number; minute: number }
}
/** The instant when it is that wall-clock time in Austin (daylight saving included). */
function austin(year: number, month: number, day: number, minutes: number) {
	const guess = Date.UTC(year, month - 1, day, 0, minutes)
	const p = inZone(new Date(guess))
	return new Date(guess - (Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - guess))
}

export type MeetingDay = { key: string; date: Date; slots: Date[] }

/** The next weekdays that still have an open half hour, given the slots already taken (ISO strings). */
export function openDays(taken: ReadonlySet<string>, now = new Date()): MeetingDay[] {
	const today = inZone(now)
	const earliest = now.getTime() + LEAD_HOURS * 3600_000
	const days: MeetingDay[] = []
	for (let i = 0, seen = 0; seen < DAYS_SHOWN && i < 40; i++) {
		const cal = new Date(Date.UTC(today.year, today.month - 1, today.day + i))
		const weekday = cal.getUTCDay()
		if (weekday === 0 || weekday === 6) continue
		seen++
		const [y, m, d] = [cal.getUTCFullYear(), cal.getUTCMonth() + 1, cal.getUTCDate()]
		const slots: Date[] = []
		for (let t = DAY_START; t + SLOT_MIN <= DAY_END; t += SLOT_MIN) {
			if ((CLASSES[weekday] ?? []).some(([a, b]) => t < b && t + SLOT_MIN > a)) continue
			const when = austin(y, m, d, t)
			if (when.getTime() < earliest || taken.has(when.toISOString())) continue
			slots.push(when)
		}
		if (slots.length) days.push({ key: `${y}-${m}-${d}`, date: austin(y, m, d, 12 * 60), slots })
	}
	return days
}

export type Booking = { slot: string; name: string; email: string; topic: string }

// Off the real site (local runs, previews) nothing is stored anywhere: the request only lives in this tab.
const local = new Set<string>()

export async function takenSlots(): Promise<Set<string>> {
	if (!isLiveSite) return new Set(local)
	try {
		const [{ db }, { collection, getDocs, query, where }] = await Promise.all([import('./firebase'), import('firebase/firestore')])
		// only the times live in this collection — never who booked them
		const snap = await getDocs(query(collection(db, 'meetingSlots'), where('slot', '>=', new Date().toISOString())))
		return new Set([...local, ...snap.docs.map((doc) => String(doc.data().slot))])
	} catch {
		return new Set(local)
	}
}

export async function requestMeeting(booking: Booking): Promise<boolean> {
	local.add(booking.slot)
	if (!isLiveSite) return true
	try {
		const [{ db }, { addDoc, collection, serverTimestamp }] = await Promise.all([import('./firebase'), import('firebase/firestore')])
		await addDoc(collection(db, 'meetings'), { ...booking, createdAt: serverTimestamp() })
		await addDoc(collection(db, 'meetingSlots'), { slot: booking.slot })
		// Netlify Forms e-mails him the request (the hidden "meeting" form in index.html registers it).
		const when = new Date(booking.slot).toLocaleString('en-US', { timeZone: MEETING_TZ, dateStyle: 'full', timeStyle: 'short' })
		fetch('/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({ 'form-name': 'meeting', ...booking, when: `${when} (Austin)` }).toString(),
		}).catch(() => {})
		return true
	} catch {
		local.delete(booking.slot)
		return false
	}
}

/** A calendar file for the visitor's own calendar. */
export function calendarFile(slot: Date) {
	const stamp = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, '')
	const end = new Date(slot.getTime() + SLOT_MIN * 60_000)
	const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//penamorros//meeting//EN', 'BEGIN:VEVENT', `UID:${stamp(slot)}@penamorros`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(slot)}`, `DTEND:${stamp(end)}`, 'SUMMARY:Call with Manuel Peña-Morros', 'DESCRIPTION:Requested on his site. Manuel will e-mail the call link.', 'STATUS:TENTATIVE', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n')
	return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`
}
