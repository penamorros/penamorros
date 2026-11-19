import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis'
import { useLayoutEffect, useSyncExternalStore, type RefObject } from 'react'

gsap.registerPlugin(ScrollTrigger, SplitText)
gsap.defaults({ ease: 'expo.out' })

export { gsap, ScrollTrigger, SplitText }

// The test scripts in tools/ read pin positions from here.
window.__ST = ScrollTrigger

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
export const isTouch = () => window.matchMedia('(hover: none), (pointer: coarse)').matches
/** Safari's trackpad + stepped Lenis fights itself and feels frozen; keep free scroll there. */
export const isSafari = () => /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || /applewebkit/i.test(navigator.userAgent) && !/chrome|crios|fxios|edg/i.test(navigator.userAgent)

if (isSafari()) document.documentElement.classList.add('is-safari')

const DESKTOP = '(min-width: 1025px)'
export const isDesktop = () => window.matchMedia(DESKTOP).matches

/** True on the wide layout with the rail and the pinned sections. Re-renders on crossing the line. */
export function useDesktop() {
	return useSyncExternalStore(
		(cb) => {
			const mq = window.matchMedia(DESKTOP)
			mq.addEventListener('change', cb)
			return () => mq.removeEventListener('change', cb)
		},
		() => window.matchMedia(DESKTOP).matches
	)
}

/** Runs GSAP setup before paint and reverts it on unmount or when deps change. */
export function useMotion(scope: RefObject<HTMLElement | null>, setup: (ctx: gsap.Context) => void | (() => void), deps: unknown[] = []) {
	useLayoutEffect(() => {
		if (prefersReducedMotion()) return
		const ctx = gsap.context((self) => setup(self), scope.current ?? undefined)
		return () => ctx.revert()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps)
}

// ---------- the loader hands over here

let bootResolve: () => void
const bootDone = new Promise<void>((r) => { bootResolve = r })
if (window.__bootActive && !window.__bootExited) window.addEventListener('boot:exit', () => bootResolve(), { once: true })
else bootResolve!()

/** Resolves as the loading screen starts to leave, or at once when there was none. */
export const whenBooted = () => bootDone

/**
 * Resolves only after the signature particles have finished and the hero portrait
 * has fully faded in — not at boot:exit (which fires when the flight starts).
 */
export const whenHeroSettled = () =>
	whenBooted().then(
		() =>
			new Promise<void>((resolve) => {
				const ready = () => {
					const intro = window.__intro
					// No particle flight (skipped / failed): portrait is already there.
					if (!window.__introTook) return true
					return intro?.state === 'done'
				}
				if (ready()) return resolve()
				let tick = 0
				// Safari sometimes leaves the particle flight unfinished, and everything that waits on this — the hero
				// words, the peeking twin, the hover preview — would then never start at all. Hard cap it.
				const cap = window.setTimeout(() => { window.clearInterval(tick); resolve() }, 4000)
				tick = window.setInterval(() => {
					if (!ready()) return
					window.clearInterval(tick)
					window.clearTimeout(cap)
					// Beat after 'done' so the photo opacity settle is visible.
					window.setTimeout(resolve, 280)
				}, 50)
			}),
	)

// ---------- smooth scroll

let lenis: Lenis | null = null

export function startSmoothScroll() {
	if (lenis || isTouch() || prefersReducedMotion()) return () => {}
	// Round 5 (the client, 2026-11-16: "never let the user slide down ... every time they slide they don't cut off mid
	// section ... automatically do it but smoothly"): the wheel and trackpad no longer move the page freely. Each scroll
	// gesture carries the page one stop on — the next section, or the next value / resume entry inside a pinned one.
	// Safari gets exactly the same stepping as Chrome (the client, 2026-11-16). It was given free scroll while its
	// frame rate was capped at 30; with that gone the stepper is fine there.
	let onWheel: (data: { deltaX: number; deltaY: number; event: Event }) => boolean = () => true
	const instance = new Lenis({
		autoRaf: false,
		lerp: 0.085,
		wheelMultiplier: 0.9,
		virtualScroll: (data) => onWheel(data),
	})
	lenis = instance
	window.__lenis = instance
	instance.on('scroll', ScrollTrigger.update)
	const stepper = stepScroll(instance)
	onWheel = stepper.wheel
	const unsettle = settleAfterScroll(instance)
	// Arrows and Page keys step like the wheel. The other scroll keys stay native; a glide still running would pull
	// the page back, so it ends where it is. (Space is left alone: the skills game uses it.)
	const keys = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'Spacebar'])
	const stepKeys: Record<string, number> = { ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1 }
	const onKey = (e: KeyboardEvent) => {
		const target = e.target as Element | null
		if (!keys.has(e.key) || target?.closest?.('input, textarea, select, [contenteditable], [data-lenis-prevent]')) return
		if (e.altKey || e.ctrlKey || e.metaKey || e.repeat && (e.key === ' ' || e.key === 'Spacebar')) { if (e.repeat && (e.key === ' ' || e.key === 'Spacebar') && !document.documentElement.classList.contains('space-for-game')) e.preventDefault(); return }
		// Space steps a section like the arrows (Shift+Space back) — except while the skills game is on screen: it is the
		// game's jetpack there (SkillsGame sets space-for-game)
		const isSpace = e.key === ' ' || e.key === 'Spacebar'
		if (isSpace && document.documentElement.classList.contains('space-for-game')) return
		if (isSpace && target?.closest?.('button, a, [role="button"]')) return
		const dir = isSpace ? (e.shiftKey ? -1 : 1) : stepKeys[e.key]
		lastWheel.at = 0 // keys scroll where they're told: no settling after them
		if (dir && !instance.isStopped) {
			e.preventDefault()
			stepper.step(dir)
			return
		}
		if (instance.isScrolling) instance.scrollTo(instance.scroll, { immediate: true, force: true })
	}
	window.addEventListener('keydown', onKey, { capture: true })
	// Nothing scrolls behind the loading screen.
	if (window.__bootActive && !window.__bootExited) {
		instance.stop()
		window.addEventListener('boot:exit', () => {
			instance.start()
			// the lock is off: measure the page as it really is
			instance.resize()
			ScrollTrigger.refresh()
		}, { once: true })
	}
	const tick = (time: number) => instance.raf(time * 1000)
	gsap.ticker.add(tick)
	gsap.ticker.lagSmoothing(0)
	return () => {
		window.removeEventListener('keydown', onKey, { capture: true })
		unsettle()
		gsap.ticker.remove(tick)
		instance.destroy()
		lenis = null
		window.__lenis = undefined
	}
}

// The pinned sections and how many stops each has (values, resume entries).
const PINS: Record<string, number> = { values: 6, resume: 6 }
// Pinned sections the wheel still scrolls freely through, as it did before the stepping (the client, 2026-11-16:
// "the core values scrolling transition should be exactly as before"): weighted scroll, then a settle onto a value.
const FREE_PINS = ['values']
// When the wheel or trackpad last moved the page freely, and which way. Steps and keys reset it.
const lastWheel = { at: 0, dir: 1, settling: false }

/** True where the wheel moves the page itself: inside a free pin, or at its edge heading in. */
function inFreePin(y: number, dir: number) {
	for (const id of FREE_PINS) {
		const st = ScrollTrigger.getById(id)
		if (!st) continue
		if (dir > 0 ? y >= st.start - 2 && y < st.end - 2 : y > st.start + 2 && y <= st.end + 2) return true
	}
	return false
}

/** After a free scroll comes to rest: inside a free pin, ease onto the next value; outside, onto the nearest stop. */
function settleAfterScroll(instance: Lenis) {
	let timer = 0
	const easeTo = (to: number) => {
		if (Math.abs(to - instance.scroll) < 4) return
		lastWheel.settling = true
		instance.scrollTo(to, { duration: 0.7, easing: (t: number) => 1 - Math.pow(1 - t, 3), onComplete: () => { lastWheel.settling = false } })
		window.setTimeout(() => { lastWheel.settling = false }, 950)
	}
	const pick = (stops: number[], y: number, d: number, keep: number) => {
		const ahead = d > 0 ? stops.find((s) => s > y + 2) : [...stops].reverse().find((s) => s < y - 2)
		const behind = d > 0 ? [...stops].reverse().find((s) => s <= y + 2) : stops.find((s) => s >= y - 2)
		if (ahead === undefined || behind === undefined) return ahead ?? behind
		const gap = Math.abs(ahead - behind) || 1
		return Math.abs(y - behind) < gap * keep ? behind : ahead
	}
	const settle = () => {
		if (lastWheel.settling || instance.isStopped || performance.now() - lastWheel.at > 1500) return
		const y = instance.scroll
		const d = lastWheel.dir || 1
		for (const id of FREE_PINS) {
			const st = ScrollTrigger.getById(id)
			if (!st || y <= st.start + 2 || y >= st.end - 2) continue
			const n = PINS[id], len = st.end - st.start
			const to = pick([st.start, ...Array.from({ length: n }, (_, i) => st.start + ((i + 0.5) / n) * len), st.end], y, d, 0.2)
			if (to !== undefined) easeTo(to)
			return
		}
		const to = pick(scrollStops(), y, d, 0.22)
		if (to !== undefined) easeTo(to)
	}
	const onScroll = () => {
		window.clearTimeout(timer)
		if (!lastWheel.settling) timer = window.setTimeout(settle, 160)
	}
	instance.on('scroll', onScroll)
	return () => window.clearTimeout(timer)
}

// Main page sections, in page order.
const SECTION_IDS = ['about', 'values', 'skills', 'resume', 'projects', 'articles', 'contact'] as const

/**
 * Every place the page may rest, top to bottom:
 * - a pinned section: where its pin starts (first value / entry), then the middle of each later one;
 * - a section that fits the screen: its top (centred when it is only a little taller than the screen);
 * - a taller section: its top, then each `[data-snap]` block inside it (or screen-sized steps when it has none);
 * - the very end of the page, so the footer is reachable.
 */
function scrollStops(): number[] {
	const vh = window.innerHeight
	const max = Math.max(0, document.documentElement.scrollHeight - vh)
	const raw: number[] = []
	// The home page's sections by id; on any other page (athletics), whatever <section>s it has, in order.
	const home = SECTION_IDS.some((id) => document.getElementById(id))
	const targets: Array<{ id: string; el: HTMLElement | null }> = home
		? SECTION_IDS.map((id) => ({ id, el: document.getElementById(id) }))
		: Array.from(document.querySelectorAll<HTMLElement>('main section')).map((el) => ({ id: '', el }))
	// Off the home page, short sections travel together: as many as fit one screen make one stop, centred, so a strip
	// like the federations never gets a stop of its own that crops the stage under it.
	if (!home) {
		const list = targets.filter((t) => t.el).map((t) => ({ top: t.el!.getBoundingClientRect().top + window.scrollY, h: t.el!.offsetHeight }))
		for (let i = 0; i < list.length; ) {
			let h = list[i].h
			let j = i + 1
			while (j < list.length && h + list[j].h <= vh) h += list[j++].h
			raw.push(h < vh ? list[i].top - (vh - h) / 2 : list[i].top)
			i = j
		}
	}
	for (const { id, el } of home ? targets : []) {
		const st = id ? ScrollTrigger.getById(id) : undefined
		if (st) {
			const n = PINS[id] ?? 1
			raw.push(st.start)
			for (let i = 1; i < n; i++) raw.push(st.start + ((i + 0.5) / n) * (st.end - st.start))
			continue
		}
		if (!el) continue
		const top = el.getBoundingClientRect().top + window.scrollY
		const h = el.offsetHeight
		if (h <= vh) raw.push(top)
		else if (h <= vh * 1.15) raw.push(top + (h - vh) / 2)
		else {
			raw.push(top)
			const marks = el.querySelectorAll<HTMLElement>('[data-snap]')
			if (marks.length) marks.forEach((m) => raw.push(m.getBoundingClientRect().top + window.scrollY - vh * 0.05))
			else for (let y = top + vh * 0.85; y < top + h - vh * 0.5; y += vh * 0.85) raw.push(Math.min(y, top + h - vh))
		}
	}
	raw.push(max)
	const stops: number[] = []
	for (const y of raw.map((v) => Math.round(Math.max(0, Math.min(max, v)))).sort((a, b) => a - b)) {
		// two stops almost on top of each other would make a scroll that seems to do nothing
		if (stops.length && y - stops[stops.length - 1] < 90) {
			if (y === max) stops[stops.length - 1] = max
			continue
		}
		stops.push(y)
	}
	return stops
}

/** One scroll gesture = one stop. Returns the wheel filter for Lenis and a `step` for the keys. */
function stepScroll(instance: Lenis) {
	let busyUntil = 0 // a step is gliding until then: nothing else may start
	let lastAt = 0
	let samples: number[] = [] // recent wheel strengths, to tell a fresh push from a trackpad's fading coast
	let spent = false // this gesture already took its step; it must fade (or pause) before another may start
	let peak = 0
	// The client, 2026-11-16: "once reached the end of the page and users want to scroll up, make it free so it's not
	// very slow". From the first time the bottom is reached, scrolling up is plain smooth scroll: no stops, no settle.
	let seenEnd = false
	let coasting = false // the swipe that made the last step is still fading: it may not also scroll a free pin

	const mean = (list: number[], n: number) => {
		const tail = list.slice(-n)
		return tail.reduce((sum, v) => sum + v, 0) / (tail.length || 1)
	}

	const step = (dir: number) => {
		const now = performance.now()
		if (now < busyUntil) return
		const from = instance.scroll
		const stops = scrollStops()
		const next = dir > 0 ? stops.find((s) => s > from + 4) : [...stops].reverse().find((s) => s < from - 4)
		if (next === undefined) return
		const dist = Math.abs(next - from)
		const duration = Math.max(0.65, Math.min(1.1, 0.45 + (dist / window.innerHeight) * 0.55))
		// a touch before the glide has fully come to rest, the next push may already start
		busyUntil = now + duration * 1000 - 120
		lastWheel.at = 0 // a step lands on its stop: nothing to settle
		// Leaves at once (no ease-in, so the page answers the hand straight away) and settles softly.
		instance.scrollTo(next, { duration, easing: (t: number) => 1 - Math.pow(1 - t, 4) })
	}

	const wheel = (data: { deltaX: number; deltaY: number; event: Event }) => {
		const e = data.event
		// Leave to Lenis: touch, pinch-zoom, sideways swipes, anything that scrolls by itself, and a locked page.
		if (e.type !== 'wheel' || (e as WheelEvent).ctrlKey || instance.isStopped) return true
		if (Math.abs(data.deltaX) > Math.abs(data.deltaY)) return true
		if (e.composedPath().some((n) => n instanceof HTMLElement && (n.hasAttribute('data-lenis-prevent') || n.hasAttribute('data-lenis-prevent-wheel') || n.hasAttribute('data-lenis-prevent-vertical')))) return true
		const now = performance.now()
		if (now - lastAt > 200) { samples = []; spent = false; coasting = false; peak = 0 } // the wheel was quiet: a new gesture
		lastAt = now
		const abs = Math.abs(data.deltaY)
		const dir = Math.sign(data.deltaY)
		samples.push(abs)
		if (samples.length > 150) samples.shift()
		// One swipe sends events for a second or more (fingers, then the coast), however long the fingers stay down.
		// It gets one step. The next needs the swipe to have faded first, and then a push that is getting stronger —
		// the coast only fades — so a single swipe can never carry the page past more than one stop.
		let fresh = false
		if (spent) {
			peak = Math.max(peak, abs)
			if (mean(samples, 4) < peak * 0.45) spent = false
		} else {
			const recent = mean(samples, 10)
			fresh = recent >= 2 && recent >= mean(samples, 70)
		}
		if (instance.scroll >= instance.limit - 4) seenEnd = true
		if (seenEnd && dir < 0) {
			busyUntil = 0
			lastWheel.at = 0
			spent = true
			peak = Math.max(peak, abs)
			return true
		}
		const gliding = now < busyUntil

		// Core values: the page scrolls under the hand as it always did (weighted, capped, slower through the pin).
		if (!gliding && dir && inFreePin(instance.scroll, dir) && !(coasting && !fresh)) {
			// the last of a swipe's coast must not knock the settle off its way to a value
			if (lastWheel.settling && !fresh) {
				if (e.cancelable) e.preventDefault()
				return false
			}
			coasting = false
			// ...and the swipe that scrolled it must fade before it can also step the page on past the pin
			spent = true
			peak = Math.max(peak, abs)
			lastWheel.at = now
			lastWheel.dir = dir
			const max = Math.max(110, window.innerHeight * 0.16)
			data.deltaY = Math.max(-max, Math.min(max, data.deltaY)) * 0.72
			return true
		}

		if (e.cancelable) e.preventDefault()
		if (gliding || !fresh) return false
		spent = true
		peak = abs
		coasting = true
		step(dir)
		return false
	}

	return { wheel, step }
}

export const stopScroll = () => lenis?.stop()
export const resumeScroll = () => lenis?.start()

/** Goes to a section. A pinned section starts where its pin starts, wherever it is now. */
export function scrollToSection(id: string) {
	const el = document.getElementById(id)
	if (!el) return
	const pin = ScrollTrigger.getById(id)
	const top = pin ? pin.start : el.getBoundingClientRect().top + window.scrollY
	if (lenis) lenis.scrollTo(top, { duration: 1.4, force: true, easing: (t: number) => 1 - Math.pow(1 - t, 4) })
	else window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
}

// ---------- reveals

type WriteVars = { duration?: number; delay?: number; scrollTrigger?: ScrollTrigger.Vars | false }

/** Script text writes itself in, left to right. The element needs the `.write` class (see motion.css). */
export function writeIn(el: Element | undefined, { duration = 1.25, delay = 0, scrollTrigger }: WriteVars = {}) {
	// a title written in calligraphy (ScriptTitle) writes itself: nothing to do
	if (!el) return gsap.timeline()
	const node = el as HTMLElement
	const state = { p: -14 }
	node.style.setProperty('--p', '-14%')
	node.classList.add('write-on')
	const tl = gsap.timeline({
		delay,
		scrollTrigger: scrollTrigger === false ? undefined : (scrollTrigger ?? { trigger: node, start: 'top 86%', once: true }),
	})
	tl.to(state, {
		p: 114,
		duration,
		ease: 'power2.inOut',
		onStart: () => node.dispatchEvent(new Event('write:start', { bubbles: true })),
		onUpdate: () => node.style.setProperty('--p', `${state.p}%`),
		onComplete: () => {
			node.classList.remove('write-on')
			node.style.removeProperty('--p')
			// its hand mark draws now (src/motion/marks.tsx)
			node.dispatchEvent(new Event('write:done', { bubbles: true }))
		},
	}, 0)
	return tl
}

/** Hover a written heading and it writes itself again (round 3). Fine pointers only; at most once every few seconds. */
export function rewriteOnHover(root: Document | HTMLElement = document) {
	if (isTouch() || prefersReducedMotion()) return () => {}
	const last = new WeakMap<Element, number>()
	const over = (e: Event) => {
		const node = (e.target as Element | null)?.closest?.('.write') as HTMLElement | null
		if (!node || node.classList.contains('write-on')) return
		const now = performance.now()
		if (now - (last.get(node) ?? -1e9) < 2600) return
		last.set(node, now)
		const state = { p: -14 }
		node.classList.add('write-on')
		node.dispatchEvent(new Event('write:start', { bubbles: true }))
		gsap.to(state, {
			p: 114,
			duration: 0.95,
			ease: 'power2.inOut',
			onUpdate: () => node.style.setProperty('--p', `${state.p}%`),
			onComplete: () => {
				node.classList.remove('write-on')
				node.style.removeProperty('--p')
				node.dispatchEvent(new Event('write:done', { bubbles: true }))
			},
		})
	}
	root.addEventListener('pointerover', over)
	return () => root.removeEventListener('pointerover', over)
}

/** A soft pull towards the pointer on buttons. Uses the CSS translate property, so it never fights a transform. */
export function magnetic(selector: string, { strength = 0.22, max = 7 } = {}) {
	if (isTouch() || prefersReducedMotion()) return () => {}
	let el: HTMLElement | null = null
	let x = 0, y = 0, tx = 0, ty = 0, raf = 0
	const frame = () => {
		x += (tx - x) * 0.2
		y += (ty - y) * 0.2
		const home = tx === 0 && ty === 0 && Math.abs(x) + Math.abs(y) < 0.05
		if (el) el.style.translate = home ? '' : `${x.toFixed(2)}px ${y.toFixed(2)}px`
		if (home) { el = null; raf = 0; return }
		raf = requestAnimationFrame(frame)
	}
	const wake = () => { if (!raf) raf = requestAnimationFrame(frame) }
	const move = (e: PointerEvent) => {
		const hit = (e.target as Element | null)?.closest?.(selector) as HTMLElement | null
		if (!hit) { tx = 0; ty = 0; if (el) wake(); return }
		if (hit !== el) {
			if (el) el.style.translate = ''
			el = hit
			x = 0; y = 0
		}
		// the box already includes the pull, so take it out
		const b = el.getBoundingClientRect()
		const dx = e.clientX - (b.left - x + b.width / 2), dy = e.clientY - (b.top - y + b.height / 2)
		tx = Math.max(-max, Math.min(max, dx * strength))
		ty = Math.max(-max, Math.min(max, dy * strength))
		wake()
	}
	window.addEventListener('pointermove', move, { passive: true })
	return () => {
		window.removeEventListener('pointermove', move)
		cancelAnimationFrame(raf)
		if (el) el.style.translate = ''
	}
}

/** Cards marked data-tilt lean towards the pointer, with a soft light (--gx, --gy) for a sheen. */
export function tiltCards(selector = '[data-tilt]') {
	if (isTouch() || prefersReducedMotion()) return () => {}
	const tilts = new WeakMap<Element, { rx: (v: number) => void; ry: (v: number) => void }>()
	let el: HTMLElement | null = null
	const get = (node: HTMLElement) => {
		let t = tilts.get(node)
		if (!t) {
			gsap.set(node, { transformPerspective: 800 })
			t = { rx: gsap.quickTo(node, 'rotationX', { duration: 0.7, ease: 'power3' }), ry: gsap.quickTo(node, 'rotationY', { duration: 0.7, ease: 'power3' }) }
			tilts.set(node, t)
		}
		return t
	}
	const move = (e: PointerEvent) => {
		const hit = (e.target as Element | null)?.closest?.(selector) as HTMLElement | null
		if (el && hit !== el) { const t = get(el); t.rx(0); t.ry(0); el.classList.remove('is-tilting') }
		el = hit
		if (!el) return
		const max = Number(el.dataset.tilt) || 6
		const b = el.getBoundingClientRect()
		const px = (e.clientX - b.left) / b.width, py = (e.clientY - b.top) / b.height
		const t = get(el)
		t.ry((px - 0.5) * max * 2)
		t.rx(-(py - 0.5) * max * 2)
		el.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`)
		el.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`)
		el.classList.add('is-tilting')
	}
	window.addEventListener('pointermove', move, { passive: true })
	return () => window.removeEventListener('pointermove', move)
}

/** Plain text rises in, line by line, from a mask. Re-splits itself when the width or the font changes. */
export function riseLines(el: Element, { delay = 0, trigger = true, stagger = 0.08 }: { delay?: number; trigger?: boolean; stagger?: number } = {}) {
	return SplitText.create(el, {
		type: 'lines',
		mask: 'lines',
		aria: 'none',
		autoSplit: true,
		onSplit: (self) =>
			gsap.from(self.lines, {
				yPercent: 110,
				duration: 1.1,
				delay,
				stagger,
				scrollTrigger: trigger ? { trigger: el, start: 'top 90%', once: true } : undefined,
			}),
	})
}

/** A picture opens from a wipe and settles, then drifts inside its frame with scroll. */
export function revealFrame(frame: Element, inner: Element | null, { drift = 7, from = 'inset(100% 0% 0% 0%)', delay = 0 }: { drift?: number; from?: string; delay?: number } = {}) {
	gsap.fromTo(frame, { clipPath: from }, {
		clipPath: 'inset(0% 0% 0% 0%)',
		duration: 1.4,
		delay,
		scrollTrigger: { trigger: frame, start: 'top 88%', once: true },
		clearProps: 'clipPath',
	})
	if (!inner) return
	gsap.set(inner, { scale: 1 + (drift * 2) / 100 })
	gsap.fromTo(inner, { yPercent: -drift }, {
		yPercent: drift,
		ease: 'none',
		scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true },
	})
}

/** Tabler line icons draw themselves in. */
export function drawIcons(root: Element, { delay = 0, stagger = 0.04, scrollTrigger }: { delay?: number; stagger?: number; scrollTrigger?: ScrollTrigger.Vars } = {}) {
	const lines = root.querySelectorAll('svg path, svg circle, svg rect, svg line, svg polyline')
	lines.forEach((p) => p.setAttribute('pathLength', '1'))
	return gsap.fromTo(lines, { strokeDasharray: 1, strokeDashoffset: 1 }, {
		strokeDashoffset: 0,
		duration: 1.1,
		delay,
		stagger,
		ease: 'power2.inOut',
		scrollTrigger,
		clearProps: 'strokeDasharray,strokeDashoffset',
	})
}

/** Tilts an element towards the pointer. Returns the cleanup. */
export function pointerTilt(area: HTMLElement, target: Element, max = 5, onMove?: (x: number, y: number) => void) {
	if (isTouch()) return () => {}
	const rx = gsap.quickTo(target, 'rotationX', { duration: 0.9, ease: 'power3' })
	const ry = gsap.quickTo(target, 'rotationY', { duration: 0.9, ease: 'power3' })
	const move = (e: PointerEvent) => {
		const b = area.getBoundingClientRect()
		const x = (e.clientX - b.left) / b.width - 0.5
		const y = (e.clientY - b.top) / b.height - 0.5
		ry(x * max * 2)
		rx(-y * max * 2)
		onMove?.(x + 0.5, y + 0.5)
	}
	const leave = () => { rx(0); ry(0) }
	area.addEventListener('pointermove', move)
	area.addEventListener('pointerleave', leave)
	return () => {
		area.removeEventListener('pointermove', move)
		area.removeEventListener('pointerleave', leave)
	}
}

declare global {
	interface Window {
		__bootActive?: boolean
		__bootExited?: boolean
		__introTook?: boolean
		__intro?: { state: string; count: number; t: number; worker: boolean }
		__lenis?: Lenis
		__ST?: typeof ScrollTrigger
	}
}
