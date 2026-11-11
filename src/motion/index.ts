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
				const tick = window.setInterval(() => {
					if (!ready()) return
					window.clearInterval(tick)
					// Beat after 'done' so the photo opacity settle is visible.
					window.setTimeout(resolve, 280)
				}, 50)
			}),
	)

// ---------- smooth scroll

let lenis: Lenis | null = null

export function startSmoothScroll() {
	if (lenis || isTouch() || prefersReducedMotion()) return () => {}
	// Round 4 (the client, 2026-11-08: "if they scroll too fast, the experience is a bit truncated"): a little more weight,
	// a cap on how far one input can throw the page, slower going through the pinned sections, and a settle onto the
	// nearest value or entry when the scroll stops inside one.
	const instance = new Lenis({
		autoRaf: false,
		lerp: 0.085,
		wheelMultiplier: 0.9,
		virtualScroll: (data) => {
			lastWheel.at = performance.now()
			if (data.deltaY) lastWheel.dir = Math.sign(data.deltaY)
			const max = Math.max(110, window.innerHeight * 0.16)
			data.deltaY = Math.max(-max, Math.min(max, data.deltaY))
			if (inPin(instance.scroll)) data.deltaY *= 0.72
			return true
		},
	})
	lenis = instance
	window.__lenis = instance
	instance.on('scroll', ScrollTrigger.update)
	const unsettle = settleInPins(instance)
	// Keys scroll natively; a glide still running from the wheel would pull the page back, so it ends where it is.
	const keys = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'Spacebar'])
	const onKey = (e: KeyboardEvent) => {
		if (!keys.has(e.key) || (e.target as Element | null)?.closest?.('input, textarea, select, [contenteditable]')) return
		lastWheel.at = 0 // keys scroll where they're told: no settling after them
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
// When the wheel or trackpad last moved the page, and which way. Keys reset it.
const lastWheel = { at: 0, dir: 1 }

function inPin(y: number) {
	for (const id in PINS) {
		const st = ScrollTrigger.getById(id)
		if (st && y > st.start + 2 && y < st.end - 2) return true
	}
	return false
}

/**
 * When a wheel or trackpad scroll comes to rest inside a pinned section, it eases onto a stop (the pin's ends or an
 * item's middle): the next one in the direction it was going, unless the one just passed is very close.
 */
function settleInPins(instance: Lenis) {
	let timer = 0, settling = false
	const settle = () => {
		if (settling || instance.isStopped || performance.now() - lastWheel.at > 1500) return
		const y = instance.scroll
		for (const id in PINS) {
			const st = ScrollTrigger.getById(id)
			if (!st || y <= st.start + 2 || y >= st.end - 2) continue
			const n = PINS[id], len = st.end - st.start
			const stops = [st.start, ...Array.from({ length: n }, (_, i) => st.start + ((i + 0.5) / n) * len), st.end]
			const d = lastWheel.dir
			const ahead = d > 0 ? stops.find((s) => s > y + 2) : [...stops].reverse().find((s) => s < y - 2)
			const behind = d > 0 ? [...stops].reverse().find((s) => s <= y + 2) : stops.find((s) => s >= y - 2)
			if (ahead === undefined || behind === undefined) return
			const gap = Math.abs(ahead - behind) || 1
			const to = Math.abs(y - behind) < gap * 0.2 ? behind : ahead
			if (Math.abs(to - y) < 4) return
			settling = true
			instance.scrollTo(to, { duration: 0.65, easing: (t: number) => 1 - Math.pow(1 - t, 3), onComplete: () => { settling = false } })
			window.setTimeout(() => { settling = false }, 900)
			return
		}
	}
	const onScroll = () => {
		window.clearTimeout(timer)
		if (!settling) timer = window.setTimeout(settle, 170)
	}
	instance.on('scroll', onScroll)
	return () => window.clearTimeout(timer)
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
export function writeIn(el: Element, { duration = 1.25, delay = 0, scrollTrigger }: WriteVars = {}) {
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
