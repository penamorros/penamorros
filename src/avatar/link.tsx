// The chat's side of the 3D avatar (round 4). The avatar runs in its own small page (avatar.html, src/avatar/main.ts) inside the chat
// circle; this tells it what the chat is doing, passes it the pointer so he can follow it from anywhere on the page, and keeps where his
// phone is, so the line of light (ChatBeam) can run between a message and the phone. Without a real GPU, or with reduced motion, the old
// avatar picture stays and the chat works the same.
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type ToAvatar =
	| { t: 'focus'; on: boolean }
	| { t: 'writing'; on: boolean }
	| { t: 'heard' }
	| { t: 'typing'; on: boolean }
	| { t: 'answered'; kind: string }
	| { t: 'closed' }
	| { t: 'run'; on: boolean }
	| { t: 'theme'; light: boolean }

// On Netlify's free plan every served HTML page gets the "Powered by Netlify" badge, fixed to its bottom-right corner, the avatar's own page
// included. The page's real badge stays where it is; this one only duplicated it inside the circle. The frame now runs this far below the
// circle (he is framed in its top part, tier.ts), so that corner lies outside the round clip: the badge (216×92 at most) clears a 220 px
// circle and a 480 px one alike.
const AVATAR_PAD = 100

let frame: HTMLIFrameElement | null = null
let phone: { x: number; y: number } | null = null
let ready = false

export const avatar = {
	send(m: ToAvatar) {
		if (frame?.contentWindow && ready) frame.contentWindow.postMessage(m, location.origin)
	},
	/** The phone's place on the page, in CSS pixels, if he's there. */
	phoneOnPage() {
		if (!frame || !phone || !ready) return null
		const r = frame.getBoundingClientRect()
		if (!r.width) return null
		return { x: r.left + (phone.x / frame.clientWidth) * r.width, y: r.top + (phone.y / frame.clientHeight) * r.height }
	},
}

/** The avatar in its circle (or the phone's chat sheet). `on`: the chat side is showing, so he should be drawing. */
export function AvatarFrame({ on }: { on: boolean }) {
	const ref = useRef<HTMLIFrameElement>(null)
	const [state, setState] = useState<'loading' | 'ready' | 'still'>('loading')

	useEffect(() => {
		const el = ref.current
		if (!el) return
		frame = el
		const onMessage = (e: MessageEvent) => {
			if (e.source !== el.contentWindow || !e.data?.avatar) return
			if (e.data.t === 'ready') {
				ready = true
				setState('ready')
				el.contentWindow?.postMessage({ t: 'theme', light: !!document.querySelector('.app.color-mode') }, location.origin)
			}
			else if (e.data.t === 'nogl') setState('still')
			else if (e.data.t === 'phone') phone = { x: e.data.x, y: e.data.y }
		}
		window.addEventListener('message', onMessage)
		// He follows the pointer wherever it is on the page, as in Version B; one message per frame at most.
		let raf = 0, px = 0, py = 0
		const onPointer = (e: PointerEvent) => {
			px = e.clientX
			py = e.clientY
			if (raf) return
			raf = requestAnimationFrame(() => {
				raf = 0
				if (!ready || !el.contentWindow) return
				const r = el.getBoundingClientRect()
				if (!r.width) return
				el.contentWindow.postMessage({ t: 'pointer', x: ((px - r.left) / r.width) * el.clientWidth, y: ((py - r.top) / r.height) * el.clientHeight }, location.origin)
			})
		}
		window.addEventListener('pointermove', onPointer, { passive: true })
		return () => {
			window.removeEventListener('message', onMessage)
			window.removeEventListener('pointermove', onPointer)
			cancelAnimationFrame(raf)
			if (frame === el) { frame = null; ready = false; phone = null }
		}
	}, [])

	// Drawing only while the chat side shows (the coin's back, or the phone's sheet). A short grace lets the coin finish turning away.
	useEffect(() => {
		if (state !== 'ready') return
		if (on) { avatar.send({ t: 'run', on: true }); return }
		const t = window.setTimeout(() => avatar.send({ t: 'run', on: false }), 900)
		return () => window.clearTimeout(t)
	}, [on, state])

	return (
		<div className={`avatar-3d is-${state}`}>
			{/* a still of this same 3D avatar (round 4c: was the old 554 KB photo, which showed for 3–4 s and looked like someone else) */}
			<img src="/avatar-3d.webp" alt="" className="avatar-gif avatar-still" decoding="async" />
			<iframe ref={ref} src={`/avatar.html?pad=${AVATAR_PAD}`} title="Manuel's AI twin" aria-hidden="true" tabIndex={-1} className="avatar-frame" style={{ height: `calc(100% + ${AVATAR_PAD}px)` }} />
		</div>
	)
}

// ---------- the line of light between a message and his phone (Version B's beam)

let target: HTMLElement | null = null
let flow = { t: -1, dir: 1, ms: 700, start: 0 }
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const beam = {
	/** The message the line starts from: the newest one in the chat. */
	aim(el: HTMLElement | null) { target = el },
	/** A spark runs along the line: to the phone (1) or from it (-1). Resolves when it arrives. */
	fly(dir: 1 | -1, ms: number) {
		if (reduced() || !avatar.phoneOnPage()) return Promise.resolve()
		flow = { t: 0, dir, ms, start: performance.now() }
		return new Promise<void>((r) => window.setTimeout(r, ms))
	},
}

/** Drawn over the page while the chat is open. Writes the path only when it changes. */
export function ChatBeam({ open }: { open: boolean }) {
	const line = useRef<SVGPathElement>(null)
	const spark = useRef<SVGPathElement>(null)
	useEffect(() => {
		if (!open) { target = null; return }
		let raf = 0, drawn = ''
		const frameFn = () => {
			raf = requestAnimationFrame(frameFn)
			const l = line.current, s = spark.current
			if (!l || !s) return
			const p = avatar.phoneOnPage()
			const el = target && target.isConnected ? target : null
			let d = ''
			if (p && el) {
				const r = el.getBoundingClientRect()
				const y1 = r.top + Math.min(11, r.height / 2)
				if (r.width && p.x > r.right + 12) {
					// Round 4b, desktop: the panel faces him from the left. From the right end of the message's first line, across to his phone.
					const x1 = r.right + 6
					const reach = Math.max(36, (p.x - x1) * 0.45)
					d = `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${(x1 + reach).toFixed(1)} ${y1.toFixed(1)}, ${(p.x - reach).toFixed(1)} ${(p.y + 24).toFixed(1)}, ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
				} else if (r.width && y1 > p.y + 8) {
					// the phone's sheet: he is above the chat. From the left edge of the message's first line, out round the text and up into the
					// phone, so it never crosses a message
					const x1 = r.left - 4
					const out = Math.max(8, x1 - 34)
					d = `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${out.toFixed(1)} ${y1.toFixed(1)}, ${out.toFixed(1)} ${(p.y + 60).toFixed(1)}, ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
				}
			}
			if (d !== drawn) {
				drawn = d
				l.setAttribute('d', d)
				s.setAttribute('d', d)
			}
			if (flow.t >= 0 && d) {
				const len = l.getTotalLength()
				const seg = Math.min(110, len * 0.3)
				const f = Math.min(1, (performance.now() - flow.start) / flow.ms)
				const e = f * f * (3 - 2 * f)
				const head = flow.dir > 0 ? e * (len + seg) : (1 - e) * (len + seg)
				s.style.strokeDasharray = `${seg} ${len + seg * 2}`
				s.style.strokeDashoffset = `${seg - head}`
				s.style.opacity = '1'
				if (f >= 1) { flow.t = -1; s.style.opacity = '0' }
			} else if (flow.t < 0) s.style.opacity = '0'
		}
		raf = requestAnimationFrame(frameFn)
		return () => cancelAnimationFrame(raf)
	}, [open])
	return createPortal(
		<svg className={`chat-beam${open ? ' is-on' : ''}`} aria-hidden="true">
			<path ref={line} className="chat-beam-line" fill="none" />
			<path ref={spark} className="chat-beam-spark" fill="none" />
		</svg>,
		document.body,
	)
}
