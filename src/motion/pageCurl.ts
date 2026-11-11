// A page that curls away like paper (round 4, Article Mentions). The outgoing page, copied, is cut into vertical strips, each one hinged to the
// one before it, so the chain can bend. A fold line sweeps across; past it every strip turns a little more, wrapping the page round a small
// roll that travels over it, with light on the part facing up and shade where it turns away. Under it the next page is already in place.
// CSS 3D only: the article stays real HTML underneath, and no picture of it is taken.
export function curlAway(host: HTMLElement, page: HTMLElement, dir: 1 | -1, { duration = 1150, strips = 18 } = {}) {
	const W = page.offsetWidth, H = page.offsetHeight
	if (!W || !H) return Promise.resolve()
	const w = W / strips
	const fromRight = dir > 0 // forward: the page lifts at its right edge and rolls to the left, as a book's page does
	const overlay = document.createElement('div')
	overlay.className = 'page-curl'
	overlay.setAttribute('aria-hidden', 'true')
	// placed over the page where it is now, in the host's own box (the track under it may be moving)
	const hr = host.getBoundingClientRect(), pr = page.getBoundingClientRect()
	overlay.style.cssText = `position:absolute;left:${pr.left - hr.left}px;top:${pr.top - hr.top}px;width:${W}px;height:${H}px;perspective:${W * 2.4}px;pointer-events:none;z-index:5;`
	const parts: { el: HTMLElement; shade: HTMLElement; backShade: HTMLElement; paper: HTMLElement; back: HTMLElement }[] = []
	let parent: HTMLElement = overlay
	for (let k = 0; k < strips; k++) {
		// k counts from the spine (the edge that stays) towards the edge that lifts
		const i = fromRight ? k : strips - 1 - k
		const strip = document.createElement('div')
		strip.style.cssText = `position:absolute;top:0;width:${w + 0.6}px;height:${H}px;transform-style:preserve-3d;transform-origin:${fromRight ? '0' : '100%'} 50%;${k === 0 ? (fromRight ? 'left:0' : `left:${W - w}px`) : fromRight ? `left:${w}px` : `left:${-w}px`};`
		const paper = document.createElement('div')
		// the card itself is see-through glass; the sheet that curls is opaque paper, or the next page would show through it
		paper.className = 'page-curl-front'
		paper.style.cssText = `position:absolute;inset:0;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden;`
		const copy = page.cloneNode(true) as HTMLElement
		// full size whatever the strip's width: the card's own max-width: 100% would shrink it to the strip and collapse its columns
		copy.style.cssText = `position:absolute;left:${-i * w}px;top:0;width:${W}px;min-width:${W}px;max-width:none;height:${H}px;margin:0;transform:none;opacity:1;visibility:visible;`
		paper.appendChild(copy)
		const shade = document.createElement('div')
		shade.style.cssText = 'position:absolute;inset:0;background:#000;opacity:0;'
		paper.appendChild(shade)
		// the back of the sheet: plain paper, a little lighter than the print
		const back = document.createElement('div')
		back.className = 'page-curl-back'
		back.style.cssText = 'position:absolute;inset:0;transform:rotateY(180deg);backface-visibility:hidden;-webkit-backface-visibility:hidden;'
		const backShade = document.createElement('div')
		backShade.style.cssText = 'position:absolute;inset:0;background:#000;opacity:0;'
		back.appendChild(backShade)
		strip.append(paper, back)
		parent.appendChild(strip)
		parts.push({ el: strip, shade, backShade, paper, back })
		parent = strip
	}
	host.appendChild(overlay)

	const R = Math.max(40, W * 0.15) // the roll's radius: wide enough to read as a curve of paper
	const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
	const bend = (s: number) => Math.max(0, Math.min(Math.PI, s / R)) // how far the paper has turned, s past the fold
	return new Promise<void>((resolve) => {
		const t0 = performance.now()
		const frame = () => {
			const p = Math.min(1, (performance.now() - t0) / duration)
			const e = ease(p)
			// the fold starts at the lifting edge and travels past the spine, by the length the roll needs
			const fold = W - e * (W + Math.PI * R * 1.05)
			let turned = 0
			for (let k = 0; k < parts.length; k++) {
				const a0 = bend(k * w - fold), a1 = bend((k + 1) * w - fold)
				const rel = a1 - turned // each strip turns relative to the one before it
				turned = a1
				const mid = (a0 + a1) / 2
				parts[k].el.style.transform = `rotateY(${(fromRight ? -1 : 1) * rel}rad)`
				// light while it faces up, shade as it turns over
				parts[k].shade.style.opacity = String(Math.max(0, Math.sin(mid)) * 0.5)
				// the back: darkest deep in the curve, lightest where it lies back over facing up
				parts[k].backShade.style.opacity = String(Math.max(0, Math.sin(mid)) * 0.55)
				// once a strip has turned right over it would lie face down on the new page: it fades out instead, so the sheet peels away
				// (on the leaves, not the hinge: opacity on a 3D parent would flatten the chain)
				const gone = String(mid > 2.2 ? Math.max(0, 1 - (mid - 2.2) / 0.7) : 1)
				parts[k].paper.style.opacity = gone
				parts[k].back.style.opacity = gone
			}
			// near the end the sheet is gone: let it fade rather than pop
			overlay.style.opacity = String(p > 0.86 ? 1 - (p - 0.86) / 0.14 : 1)
			if (p < 1) requestAnimationFrame(frame)
			else { overlay.remove(); resolve() }
		}
		requestAnimationFrame(frame)
	})
}
