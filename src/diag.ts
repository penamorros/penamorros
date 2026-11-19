/* Opened with ?diag=1 only. v4: why the 3D twin and the chat come up in Chrome but not in Safari.
   It inspects what the page actually ended up with — the WebGL it can get, what the avatar frame reported, what the
   chat panel does when it is opened — and prints it large enough to read in a screenshot. */
const W = window as any
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function runDiag() {
	const box = document.createElement('pre')
	box.style.cssText = 'position:fixed;left:14px;top:14px;z-index:99999;margin:0;background:#000;color:#4cff4c;font:700 14px/1.45 ui-monospace,SFMono-Regular,monospace;padding:14px 18px;border:2px solid #4cff4c;border-radius:10px;white-space:pre;pointer-events:none;max-width:76vw'
	const lines: string[] = ['DIAG v4 — looking…']
	const draw = () => { box.textContent = lines.join('\n') }
	draw()
	document.body.appendChild(box)

	// catch what the avatar frame says from here on
	const said: string[] = []
	addEventListener('message', (e: MessageEvent) => { if ((e.data as any)?.avatar) said.push(String((e.data as any).t)) })

	for (let i = 0; i < 100 && W.__bootActive && !W.__bootExited; i++) await sleep(100)
	await sleep(2500)

	const ua = navigator.userAgent
	lines[0] = `DIAG v4  ${/safari/i.test(ua) && !/chrome|crios|edg/i.test(ua) ? 'SAFARI' : 'OTHER'}`

	// 0. the athletics page lays its medals out differently here than in Chrome: report where they actually land
	if (location.pathname.replace(/\/$/, '') === '/athletics') {
		const box = (e: Element | null) => { if (!e) return 'missing'; const b = e.getBoundingClientRect(); return `${Math.round(b.left)},${Math.round(b.top)} ${Math.round(b.width)}x${Math.round(b.height)}` }
		lines.push(`view ${innerWidth}x${innerHeight} dpr${devicePixelRatio}`)
		lines.push(`content ${box(document.querySelector('.athletics-content'))}`)
		lines.push(`section ${box(document.querySelector('.athletics-section'))}`)
		lines.push(`main    ${box(document.querySelector('.main'))}`)
		for (const m of document.querySelectorAll('.athletics-medal')) {
			const cls = (m.className.match(/--([a-z-]+)/) || [])[1] || '?'
			const b = m.getBoundingClientRect()
			lines.push(`${cls.padEnd(10)} left=${getComputedStyle(m).left} mid=${Math.round(b.left + b.width / 2)} w=${Math.round(b.width)}`)
		}
		lines.push(`trophy  ${box(document.querySelector('.athletics-trophy-wrap'))}`)
		lines.push('', 'done — screenshot this')
		draw()
		return
	}

	// 1. the WebGL the page can actually get
	let gl2 = 'no', gl1 = 'no', renderer = '-', dbg = 'no'
	try {
		const c = document.createElement('canvas')
		const a = c.getContext('webgl2') as WebGL2RenderingContext | null
		gl2 = a ? 'yes' : 'no'
		const b = (a || c.getContext('webgl')) as WebGLRenderingContext | null
		gl1 = b ? 'yes' : 'no'
		const ext = b?.getExtension('WEBGL_debug_renderer_info')
		dbg = ext ? 'yes' : 'no'
		if (ext && b) renderer = String(b.getParameter((ext as any).UNMASKED_RENDERER_WEBGL)).slice(0, 26)
	} catch (e) { renderer = 'threw' }
	lines.push(`webgl2=${gl2} webgl=${gl1} dbgext=${dbg}`)
	lines.push(`renderer=${renderer}`)

	// 2. what the little twin ended up as
	const inv = document.querySelector('.chat-invite')
	lines.push(`invite class=${(inv?.className || 'MISSING').replace('chat-invite', '').trim() || '(none)'}`)
	lines.push(`invite iframe=${!!document.querySelector('.invite-character iframe')} img=${!!document.querySelector('.invite-character img')}`)
	lines.push(`frame said: ${said.join(',') || '(nothing yet)'}`)
	draw()

	// 2b. the words in his speech pill went missing in Safari — what is hiding them?
	const line = document.querySelector('.invite-line') as HTMLElement | null
	if (!line) lines.push('pill text: NOT IN DOM')
	else {
		const cs = getComputedStyle(line)
		const r = line.getBoundingClientRect()
		lines.push(`pill "${(line.textContent || '').slice(0, 14)}" ${Math.round(r.width)}x${Math.round(r.height)}`)
		lines.push(`  op=${cs.opacity} fill=${cs.webkitTextFillColor || cs.color} anim=${cs.animationName}/${cs.animationPlayState}`)
	}

	// 2c. what the 3D frame itself reports (set by src/avatar/main.ts)
	const d = W.__avatarDiag
	if (!d) lines.push(`twin diag: none (err=${W.__avatarErr || '-'})`)
	else {
		lines.push(`twin gl2=${d.gl2} glErr=${d.err} progs=${d.progs} vary=${d.vary}`)
		lines.push(`armour ${d.armour ? `${d.armour.w}x${d.armour.h} R=${d.armour.r} G=${d.armour.g} B=${d.armour.b}` : 'NOT BUILT'}`)
	}
	draw()

	// 3. open the chat the way a visitor does
	dispatchEvent(new CustomEvent('chat:open', { detail: { meet: false } }))
	await sleep(2600)
	const chat = document.querySelector('.twin-chat') as HTMLElement | null
	if (!chat) lines.push('chat panel: NOT IN DOM')
	else {
		const r = chat.getBoundingClientRect()
		const cs = getComputedStyle(chat)
		lines.push(`chat ${Math.round(r.width)}x${Math.round(r.height)} op=${cs.opacity} vis=${cs.visibility}`)
	}
	const coin = document.querySelector('.coin-inner') as HTMLElement | null
	lines.push(`coin=${coin ? getComputedStyle(coin).transform.slice(0, 34) : 'none'}`)
	lines.push(`chat avatar frame=${!!document.querySelector('.chat-avatar iframe')}`)
	draw()

	// 4. can the chat reach its brain?
	try {
		const res = await fetch('/.netlify/functions/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ model: 'gpt-5.6-terra', messages: [{ role: 'user', content: 'say hi' }], max_tokens: 10 }),
		})
		const txt = (await res.text()).replace(/\s+/g, ' ').slice(0, 44)
		lines.push(`chat api ${res.status}: ${txt}`)
	} catch (e: any) {
		lines.push(`chat api THREW: ${String(e?.message).slice(0, 40)}`)
	}

	lines.push(`errors=${(W.__errs || []).length}`)
	for (const e of (W.__errs || []).slice(0, 4)) lines.push(` ! ${String(e).slice(0, 64)}`)
	lines.push('', 'done — screenshot this')
	draw()
}
