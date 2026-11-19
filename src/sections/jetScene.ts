// The skills run's world (the client, 2026-11-18: "make it incredible, sophisticated, not AI-looking"): a night city
// in depth, drawn once into tiles and scrolled at different speeds — sky and stars, a far skyline in haze, nearer towers
// with lit windows and aviation lights, a fog band, and a wet rooftop that the run happens over. Light theme: the same
// city at dusk. Every tile is seamless, so the run can be any length; each frame is a few drawImage calls.

type Palette = {
	sky: [string, string, string]
	glow: string
	far: string
	farWin: string
	mid: string
	midEdge: string
	win: string[]
	fog: string
	ground: [string, string]
	lip: string
	light: string
	stars: number
}

const NIGHT: Palette = {
	sky: ['#03050b', '#070c1a', '#101a33'],
	glow: 'rgba(70, 110, 200, .22)',
	far: '#0b1222',
	farWin: 'rgba(120, 150, 220, .22)',
	mid: '#070b15',
	midEdge: 'rgba(120, 160, 255, .16)',
	win: ['rgba(255, 196, 120, .62)', 'rgba(255, 214, 160, .4)', 'rgba(140, 180, 255, .45)', 'rgba(255, 180, 100, .25)'],
	fog: 'rgba(40, 60, 110, .32)',
	ground: ['#0a0e17', '#040609'],
	lip: 'rgba(140, 170, 230, .28)',
	light: 'rgba(255, 170, 90, .9)',
	stars: 0.55,
}
const DUSK: Palette = {
	sky: ['#c9d5ea', '#dfe6f2', '#f3ede6'],
	glow: 'rgba(255, 190, 140, .25)',
	far: '#b7c3d8',
	farWin: 'rgba(255, 255, 255, .35)',
	mid: '#8f9db6',
	midEdge: 'rgba(255, 255, 255, .25)',
	win: ['rgba(255, 236, 200, .75)', 'rgba(255, 255, 255, .5)', 'rgba(255, 220, 170, .55)', 'rgba(230, 240, 255, .45)'],
	fog: 'rgba(240, 236, 232, .45)',
	ground: ['#9aa6bb', '#7d8aa1'],
	lip: 'rgba(255, 255, 255, .55)',
	light: 'rgba(255, 150, 70, .85)',
	stars: 0,
}

// a small seeded random, so the city is the same every visit
function rng(seed: number) {
	return () => {
		seed |= 0; seed = (seed + 0x6d2b79f5) | 0
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

type Layer = { tile: HTMLCanvasElement; speed: number; y: number }

export function createJetScene(canvas: HTMLCanvasElement) {
	const ctx = canvas.getContext('2d')!
	let W = 0, H = 0, ground = 0, dpr = 1
	let layers: Layer[] = []
	let sky: HTMLCanvasElement | null = null
	let beacons: { x: number; y: number; ph: number; speed: number }[] = []
	let pal = NIGHT

	const tileOf = (w: number, h: number) => {
		const c = document.createElement('canvas')
		c.width = Math.ceil(w * dpr); c.height = Math.ceil(h * dpr)
		const g = c.getContext('2d')!
		g.scale(dpr, dpr)
		return { c, g }
	}

	// a run of buildings across a seamless tile: each is drawn again one tile to the left if it crosses the edge
	function skyline(tw: number, th: number, seed: number, o: { minH: number; maxH: number; minW: number; maxW: number; gap: number; color: string; edge?: string; win?: string[]; winP: number; winSize: [number, number]; antenna: number; beacons?: { list: typeof beacons; speed: number; yOff: number } }) {
		const { c, g } = tileOf(tw, th)
		const r = rng(seed)
		let x = 0
		while (x < tw) {
			const w = o.minW + r() * (o.maxW - o.minW)
			const h = o.minH + Math.pow(r(), 1.6) * (o.maxH - o.minH)
			const top = th - h
			for (const dx of [0, -tw]) {
				const bx = x + dx
				if (bx + w < 0 || bx > tw) continue
				g.fillStyle = o.color
				g.fillRect(bx, top, w, h)
				// stepped crowns on some towers, plant boxes on the roofs of others
				if (r() < 0.35) { const sw = w * (0.4 + r() * 0.3); g.fillRect(bx + (w - sw) / 2, top - h * 0.06, sw, h * 0.06 + 1) }
				else if (r() < 0.5) { for (let k = 0; k < 3; k++) { const uw = 4 + r() * 9; g.fillRect(bx + 4 + r() * (w - uw - 8), top - 3 - r() * 4, uw, 8) } }
				// each face shaded: catching the city's glow up top, falling into shadow toward the street
				const shade = g.createLinearGradient(0, top, 0, th)
				shade.addColorStop(0, o.edge ? o.edge.replace(/[\d.]+\)$/, '0.07)') : 'rgba(255,255,255,0.02)'); shade.addColorStop(1, 'rgba(0, 0, 0, 0.32)')
				g.fillStyle = shade; g.fillRect(bx, top, w, h)
				if (o.edge) { g.fillStyle = o.edge; g.fillRect(bx, top, 1.2, h) }
				if (o.win) {
					const [ww, wh] = o.winSize
					// no two buildings alike: some nearly dark, some busy, an office tint on a few, a whole lit floor now and then
					const lit = Math.min(0.85, o.winP * (0.12 + r() * 1.5))
					const tint = r() < 0.22 ? o.win[2] : null
					const colGap = ww * (1.8 + r() * 0.8), rowGap = wh * (2 + r() * 0.6)
					for (let wy = top + 8 + r() * 6; wy < th - 8; wy += rowGap) {
						const floor = r() < 0.06
						const rowLit = floor ? 0.95 : lit * (0.5 + r())
						for (let wx = bx + 4 + r() * 3; wx < bx + w - ww - 3; wx += colGap) {
							if (r() > rowLit) continue
							g.fillStyle = tint || o.win[Math.floor(r() * o.win.length)]
							g.fillRect(wx, wy, ww, wh)
						}
					}
				}
				if (r() < o.antenna) {
					g.fillStyle = o.color
					const ax = bx + w * (0.3 + r() * 0.4)
					const ah = 14 + r() * 34
					g.fillRect(ax, top - ah, 1.6, ah)
					if (o.beacons) o.beacons.list.push({ x: ax + 0.8 + dx, y: top - ah + o.beacons.yOff, ph: r() * 6.28, speed: o.beacons.speed })
				}
			}
			x += w + o.gap * r()
		}
		return c
	}

	function build() {
		const light = !!document.querySelector('.app.color-mode')
		pal = light ? DUSK : NIGHT
		dpr = Math.min(2, window.devicePixelRatio || 1)
		canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr)
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
		beacons = []

		// the sky: a deep gradient, the city's glow along the horizon, a scatter of faint stars
		const s = tileOf(W, H)
		const grad = s.g.createLinearGradient(0, 0, 0, ground)
		grad.addColorStop(0, pal.sky[0]); grad.addColorStop(0.6, pal.sky[1]); grad.addColorStop(1, pal.sky[2])
		s.g.fillStyle = grad; s.g.fillRect(0, 0, W, H)
		const hg = s.g.createRadialGradient(W * 0.55, ground, 0, W * 0.55, ground, W * 0.75)
		hg.addColorStop(0, pal.glow); hg.addColorStop(1, 'transparent')
		s.g.fillStyle = hg; s.g.fillRect(0, 0, W, H)
		if (pal.stars) {
			const r = rng(7)
			for (let i = 0; i < 140; i++) {
				const a = Math.pow(r(), 3) * pal.stars
				s.g.fillStyle = `rgba(210, 225, 255, ${a.toFixed(3)})`
				const sz = r() < 0.08 ? 1.6 : 1
				s.g.fillRect(r() * W, r() * ground * 0.62, sz, sz)
			}
		}
		sky = s.c

		const TW = Math.max(1400, W * 1.4)
		const farH = ground * 0.62, midH = ground * 0.8
		const far = skyline(TW, farH, 11, { minH: farH * 0.18, maxH: farH * 0.86, minW: 26, maxW: 70, gap: 8, color: pal.far, win: [pal.farWin], winP: 0.18, winSize: [1.6, 1.6], antenna: 0.12 })
		const midBeacons: typeof beacons = []
		const mid = skyline(TW * 1.3, midH, 23, { minH: midH * 0.22, maxH: midH * 0.92, minW: 46, maxW: 120, gap: 26, color: pal.mid, edge: pal.midEdge, win: pal.win, winP: 0.34, winSize: [2.6, 3.4], antenna: 0.3, beacons: { list: midBeacons, speed: 0.2, yOff: 0 } })
		beacons = midBeacons.map((b) => ({ ...b, y: b.y + (ground - midH) }))

		// a band of fog where the far city meets the near one
		const fog = tileOf(W, ground)
		const fg = fog.g.createLinearGradient(0, ground * 0.45, 0, ground)
		fg.addColorStop(0, 'transparent'); fg.addColorStop(0.7, pal.fog); fg.addColorStop(1, pal.fog)
		fog.g.fillStyle = fg; fog.g.fillRect(0, 0, W, ground)

		// the rooftop he flies over: wet, a lit lip along its edge, little amber lights at intervals, panel seams
		const gw = 640, gh = H - ground
		const gr = tileOf(gw, gh)
		const gg = gr.g.createLinearGradient(0, 0, 0, gh)
		gg.addColorStop(0, pal.ground[0]); gg.addColorStop(1, pal.ground[1])
		gr.g.fillStyle = gg; gr.g.fillRect(0, 0, gw, gh)
		gr.g.fillStyle = pal.lip; gr.g.fillRect(0, 0, gw, 1.5)
		for (let x = 0; x < gw; x += 160) {
			gr.g.fillStyle = 'rgba(255, 255, 255, .05)'; gr.g.fillRect(x, 2, 1, gh)
			const lg = gr.g.createRadialGradient(x + 80, 5, 0, x + 80, 5, 26)
			lg.addColorStop(0, pal.light); lg.addColorStop(0.15, 'rgba(255, 160, 80, .35)'); lg.addColorStop(1, 'transparent')
			gr.g.fillStyle = lg; gr.g.fillRect(x + 50, 0, 60, 30)
		}
		// a soft sheen of reflection on the wet surface
		const sh = gr.g.createLinearGradient(0, 0, 0, gh)
		sh.addColorStop(0, 'rgba(120, 160, 240, .10)'); sh.addColorStop(0.35, 'transparent')
		gr.g.fillStyle = sh; gr.g.fillRect(0, 0, gw, gh)

		layers = [
			{ tile: far, speed: 0.06, y: ground - farH },
			{ tile: fog.c, speed: -1, y: 0 },
			{ tile: mid, speed: 0.2, y: ground - midH },
			{ tile: gr.c, speed: 1, y: ground },
		]
	}

	function tileDraw(l: Layer, offset: number) {
		const tw = l.tile.width / dpr, th = l.tile.height / dpr
		if (l.speed < 0) { ctx.drawImage(l.tile, 0, l.y, tw, th); return }
		let x = -((offset * l.speed) % tw)
		if (x > 0) x -= tw
		for (; x < W; x += tw) ctx.drawImage(l.tile, x, l.y, tw, th)
	}

	return {
		resize(w: number, h: number, groundY: number) {
			W = w; H = h; ground = groundY
			if (W > 0 && H > 0) build()
		},
		rebuild() { if (W > 0) build() },
		draw(offset: number, t: number) {
			if (!sky) return
			ctx.drawImage(sky, 0, 0, W, H)
			tileDraw(layers[0], offset)
			tileDraw(layers[1], offset)
			tileDraw(layers[2], offset)
			// aviation lights on the masts: a slow red blink, each on its own beat
			const midTile = layers[2].tile.width / dpr
			for (const b of beacons) {
				const on = Math.sin(t * 2.2 + b.ph) > 0.55
				if (!on) continue
				let x = b.x - ((offset * b.speed) % midTile)
				while (x < -10) x += midTile
				for (; x < W + 10; x += midTile) {
					const g = ctx.createRadialGradient(x, b.y, 0, x, b.y, 7)
					g.addColorStop(0, 'rgba(255, 80, 70, .95)'); g.addColorStop(0.3, 'rgba(255, 60, 50, .4)'); g.addColorStop(1, 'transparent')
					ctx.fillStyle = g
					ctx.fillRect(x - 7, b.y - 7, 14, 14)
				}
			}
			tileDraw(layers[3], offset)
		},
	}
}
