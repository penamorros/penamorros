import { useEffect, useRef } from 'react'
import { isTouch } from '../motion'

function el(id: string, css: string, parent: HTMLElement) {
	const node = document.createElement('div')
	node.id = id
	node.style.cssText = css
	parent.appendChild(node)
	return node
}

// Snappy custom cursor: dot tracks the pointer instantly, ring eases behind it.
// No ink trail / scan line — those were the main source of lag.
export default function Cursor({ colorMode }: { colorMode: boolean }) {
	const inkRef = useRef(colorMode ? '0, 0, 0' : '255, 255, 255')
	inkRef.current = colorMode ? '0, 0, 0' : '255, 255, 255'

	useEffect(() => {
		if (isTouch()) return

		const inkRGB = () => inkRef.current
		const box = el('techy-cursor-container', 'position:fixed;inset:0;pointer-events:none;z-index:9999;', document.body)
		const place = 'position:fixed;left:0;top:0;pointer-events:none;will-change:transform;transition:none;'
		const dot = el('techy-cursor-dot', `${place}width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;background:rgb(${inkRGB()});z-index:10000;`, box)
		const ring = el('techy-cursor-ring', `${place}width:48px;height:48px;margin:-24px 0 0 -24px;border-radius:50%;border:1.5px solid rgba(${inkRGB()},.3);z-index:9999;`, box)

		let rx = -100, ry = -100, tx = -100, ty = -100
		let hover = 0, hoverTo = 0, seen = false, raf = 0

		const paint = () => {
			const rgb = inkRGB()
			dot.style.background = `rgb(${rgb})`
			ring.style.borderColor = `rgba(${rgb},${0.3 + hover * 0.2})`
		}

		const frame = () => {
			rx += (tx - rx) * 0.4
			ry += (ty - ry) * 0.4
			hover += (hoverTo - hover) * 0.28

			dot.style.transform = `translate3d(${tx}px,${ty}px,0) scale(${1 + hover * 0.55})`
			ring.style.transform = `translate3d(${rx}px,${ry}px,0) scale(${1 + hover * 0.45})`
			ring.style.opacity = String(0.7 + hover * 0.3)
			paint()

			const travelling = Math.abs(tx - rx) + Math.abs(ty - ry) > 0.4
			const settled = !travelling && Math.abs(hoverTo - hover) < 0.01
			raf = settled ? 0 : requestAnimationFrame(frame)
		}

		const move = (e: PointerEvent) => {
			if (!seen) {
				seen = true
				rx = e.clientX
				ry = e.clientY
			}
			tx = e.clientX
			ty = e.clientY
			hoverTo = (e.target as Element)?.closest?.('a, button, .button, .card, .nav-item, .project-link, .timeline-point') ? 1 : 0
			if (!raf) raf = requestAnimationFrame(frame)
		}

		window.addEventListener('pointermove', move, { passive: true })
		document.body.style.cursor = 'none'
		paint()

		return () => {
			window.removeEventListener('pointermove', move)
			cancelAnimationFrame(raf)
			box.remove()
			document.body.style.cursor = ''
		}
	}, [])

	useEffect(() => {
		const rgb = inkRef.current
		const dot = document.getElementById('techy-cursor-dot')
		const ring = document.getElementById('techy-cursor-ring')
		if (dot) dot.style.background = `rgb(${rgb})`
		if (ring) ring.style.borderColor = `rgba(${rgb},0.3)`
	}, [colorMode])

	return null
}
