import { useEffect, useMemo, useState } from 'react'
import { Calendar, Check, ChevronLeft, X } from '../icons'
import { MEETING_TZ, SLOT_MIN, calendarFile, openDays, requestMeeting, takenSlots } from '../meetings'
import './meeting.css'

type Props = { onClose: () => void; onBooked: (when: string, email: string) => void }

const dayName = (d: Date) => d.toLocaleDateString('en-US', { timeZone: MEETING_TZ, weekday: 'short' })
const dayNumber = (d: Date) => d.toLocaleDateString('en-US', { timeZone: MEETING_TZ, day: 'numeric' })
const monthName = (d: Date) => d.toLocaleDateString('en-US', { timeZone: MEETING_TZ, month: 'short' })
const timeOf = (d: Date) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
const fullWhen = (d: Date) => `${d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })} · ${timeOf(d)}`

/** Pick a day, pick a half hour, leave a name and an e-mail. Lives inside the chat panel, in its glass and its type. */
export default function MeetingPicker({ onClose, onBooked }: Props) {
	const [taken, setTaken] = useState<ReadonlySet<string> | null>(null)
	const [dayKey, setDayKey] = useState('')
	const [slot, setSlot] = useState<Date | null>(null)
	const [form, setForm] = useState({ name: '', email: '', topic: '' })
	const [state, setState] = useState<'pick' | 'sending' | 'done' | 'failed'>('pick')

	useEffect(() => {
		let alive = true
		takenSlots().then((set) => { if (alive) setTaken(set) })
		return () => { alive = false }
	}, [])

	const days = useMemo(() => (taken ? openDays(taken) : []), [taken])
	const day = days.find((d) => d.key === dayKey) ?? days[0]
	const zone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, ' '), [])
	const valid = form.name.trim().length > 1 && /^\S+@\S+\.\S+$/.test(form.email.trim())

	const submit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!slot || !valid || state === 'sending') return
		setState('sending')
		const ok = await requestMeeting({ slot: slot.toISOString(), name: form.name.trim(), email: form.email.trim(), topic: form.topic.trim() })
		setState(ok ? 'done' : 'failed')
		if (ok) onBooked(fullWhen(slot), form.email.trim())
	}

	return (
		<div className="mt" data-lenis-prevent>
			<div className="mt-top">
				{slot && state !== 'done'
					? <button type="button" className="mt-icon" onClick={() => { setSlot(null); setState('pick') }} aria-label="Back to times"><ChevronLeft size={16} /></button>
					: <span className="mt-icon is-still" aria-hidden="true"><Calendar size={15} /></span>}
				<div className="mt-title">
					<strong>{state === 'done' ? 'Request sent' : 'Book a call'}</strong>
					<span>{SLOT_MIN} min · video call</span>
				</div>
				<button type="button" className="mt-icon" onClick={onClose} aria-label="Back to the chat"><X size={15} /></button>
			</div>

			{state === 'done' && slot ? (
				<div className="mt-done">
					<span className="mt-check" aria-hidden="true"><Check size={22} /></span>
					<p className="mt-when">{fullWhen(slot)}</p>
					<p className="mt-note">Manuel will e-mail <b>{form.email.trim()}</b> to confirm and send the link.</p>
					<div className="mt-actions">
						<a className="mt-btn is-ghost" href={calendarFile(slot)} download="call-with-manuel.ics">Add to calendar</a>
						<button type="button" className="mt-btn" onClick={onClose}>Back to chat</button>
					</div>
				</div>
			) : slot ? (
				<form className="mt-form" onSubmit={submit}>
					<p className="mt-when">{fullWhen(slot)}</p>
					<label className="mt-field"><span>Name</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" required autoFocus /></label>
					<label className="mt-field"><span>E-mail</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" required /></label>
					<label className="mt-field"><span>About <i>optional</i></span><input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} maxLength={140} /></label>
					{state === 'failed' && <p className="mt-error" role="alert">That didn’t go through. Try again in a moment.</p>}
					<button type="submit" className="mt-btn is-wide" disabled={!valid || state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Request this time'}</button>
				</form>
			) : !taken ? (
				<p className="mt-empty">Checking his week…</p>
			) : !day ? (
				<p className="mt-empty">No open times in the next two weeks. Ask in the chat and Manuel will find one.</p>
			) : (
				<>
					<div className="mt-days" role="tablist" aria-label="Day">
						{days.map((d) => (
							<button key={d.key} type="button" role="tab" aria-selected={d.key === day.key} className={`mt-day${d.key === day.key ? ' is-on' : ''}`} onClick={() => setDayKey(d.key)}>
								<span>{dayName(d.date)}</span>
								<b>{dayNumber(d.date)}</b>
								<i>{monthName(d.date)}</i>
							</button>
						))}
					</div>
					<div className="mt-slots" key={day.key}>
						{day.slots.map((s, i) => (
							<button key={s.toISOString()} type="button" className="mt-slot" style={{ animationDelay: `${i * 18}ms` }} onClick={() => setSlot(s)}>{timeOf(s)}</button>
						))}
					</div>
					<p className="mt-zone">Times shown in your time zone · {zone}</p>
				</>
			)}
		</div>
	)
}
