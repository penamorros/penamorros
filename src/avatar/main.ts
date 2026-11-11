// The AI twin's body in the chat circle (round 4, the client: "replace this with the 3D avatar you created, and keep the lines and movements
// when sending and not sending a message"). Version B's avatar (penamorros-story/src/app.ts), running in its own small page inside the
// circle: he breathes, shifts his weight, glances at his phone now and then, follows the pointer and blinks; when someone writes he lifts the
// phone, types, and looks up and nods when the answer is out. The chat on the main page tells him what is happening by postMessage, and he
// tells it where his phone is, for the line of light between a message and the phone.
import { detectTier, hasRealGPU, inviteMode, peekMode, useFrame } from './gl/tier'

type FromChat =
	| { t: 'focus'; on: boolean }
	| { t: 'writing'; on: boolean }
	| { t: 'heard' }
	| { t: 'typing'; on: boolean }
	| { t: 'answered'; kind: string }
	| { t: 'closed' }
	| { t: 'pointer'; x: number; y: number }
	| { t: 'run'; on: boolean }
	| { t: 'wave'; on: boolean }
	| { t: 'duck'; on: boolean }
	| { t: 'theme'; light: boolean }

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const tell = (m: Record<string, unknown>) => window.parent.postMessage({ avatar: true, ...m }, location.origin)
const rad = (d: number) => (d * Math.PI) / 180
const ease = (x: number) => x * x * (3 - 2 * x)
const bootParams = new URLSearchParams(location.search)
let inviteElapsed = 0
let duckTarget = 0
const bootWave = bootParams.has('wave') || peekMode

useFrame()
// ?solo boots it outside the chat, for the test tools
const solo = bootParams.has('solo')
if ((window.parent === window && !solo) || !hasRealGPU() || reduced) tell({ t: 'nogl' })
else boot().catch((e) => { console.error(e); tell({ t: 'nogl' }) })

async function boot() {
	const tier = detectTier()
	// Peek CTA is a ~70px circle: stay on the lite path so we don't fight the main chat twin for GPU.
	if (peekMode) { tier.lite = true; tier.maxDpr = 1.25 }
	const worker = new Worker(new URL('./gl/worker.ts', import.meta.url), { type: 'module' })
	const unpacked = new Promise<{ head: any; hair: any; body: any }>((res, rej) => {
		const got: any = {}
		worker.onmessage = (e) => {
			const m = e.data
			if (m.t === 'error') rej(new Error(m.message))
			else if (m.t === 'done') res(got)
			else if (m.t !== 'bytes') got[m.t] = m.data
		}
		worker.onerror = (e) => rej(new Error(e.message))
	})
	// He stands further away here than in Version B's hero, so fewer hair strands look the same.
	worker.postMessage({ strands: peekMode ? 500 : tier.lite ? 900 : 2400, lite: tier.lite || peekMode })

	const { animateInvite, configureInvite } = await import('./gl/invite')
	const [{ Stage }, { shared }, { yieldToMain }, { Spring }, { loadTexture }, { spot }, { glassU }, { bodyU }, { phoneU }] = await Promise.all([
		import('./gl/stage'), import('./gl/head'), import('./gl/decode'), import('./gl/spring'), import('./gl/textures'), import('./gl/reveal'), import('./gl/glasses'), import('./gl/body'), import('./gl/phone'),
	])
	const canvas = document.getElementById('gl') as HTMLCanvasElement
	const stage = new Stage(canvas, tier)
	// The circle is small, so it can afford to draw at 1.5× the
	// screen's pixels (2× at most): edges, hair and the glasses' rim stay clean even on a 1× screen. A little more fill, so the dark suit reads
	// as cloth beside the rim light rather than as a silhouette.
	stage.dpr = Math.min(2, Math.max(1, devicePixelRatio || 1) * (tier.lite ? 1.25 : 1.5))
	const applyTheme = (light: boolean) => {
		bodyU.uLight.value = light ? 1 : 0
		if (!peekMode && !inviteMode) {
			stage.key.intensity = light ? 1.55 : 1.6
			stage.fill.intensity = light ? 0.5 : 0.32
			stage.rimL.intensity = light ? 3.6 : 5.6
			stage.rimR.intensity = light ? 3.9 : 5.8
			stage.key.color.set(light ? 0xfff6ea : 0xf3f5ff)
			stage.fill.color.set(light ? 0xe8eef8 : 0xdfe6ff)
			return
		}
		stage.key.intensity = light ? 1.7 : 1.6
		stage.fill.intensity = inviteMode ? 0.65 : light ? 0.42 : 0.32
		stage.rimL.intensity = inviteMode ? 2.2 : light ? 4.4 : 5.6
		stage.rimR.intensity = inviteMode ? 2.4 : light ? 4.8 : 5.8
		stage.key.color.set(light ? 0xfff6ea : 0xf3f5ff)
		stage.fill.color.set(light ? 0xe8eef8 : 0xdfe6ff)
	}
	applyTheme(bootParams.has('light'))
	const [data, map] = await Promise.all([unpacked, loadTexture(tier.lite ? '/head/albedo-1k.webp' : '/head/albedo-2k.webp')])
	worker.terminate()
	await yieldToMain()
	stage.place({ head: data.head, hair: data.hair, body: data.body, map })
	if (inviteMode) await configureInvite(stage)
	await yieldToMain()
	await stage.warm()

	// Fully there, glasses on; Version B's cursor reveal (the armour under a spotlight) stays off in the chat.
	shared.uReveal.value = 1
	shared.uStrip.value = 1
	spot.uPower.value = 0
	const rig = stage.rig

	const pointer = { x: 0, y: 0 }
	const REST_YAW = rad(-13), REST_PITCH = rad(-3.5)
	const yaw = new Spring(0.85, 0.9, 0.2, REST_YAW), pitch = new Spring(0.85, 0.9, 0.2, REST_PITCH)
	const duckMotion = new Spring(0.8, 1, 0)
	const eyeY = new Spring(3.2, 0.82, 1.4), eyeP = new Spring(3.2, 0.82, 1.4)
	let followGain = 0
	let blinkAt = 2.2, blinkT = -1, blinkDouble = false
	const act = {
		mix: 0, want: 0, screen: 0, screenWant: 0, ping: 0, typing: false, focus: false, inChat: false, writing: false,
		tapR: 0, nextTap: 0, buzz: 0, look: 0, lookWant: 0, nextGlance: 5 + Math.random() * 4, glanceEnd: 0, nod: 0, lowerAt: 0,
		wave: 0, waveWant: 0,
	}
	// Peek CTA: just look toward the visitor — no wave gags.
	if (bootWave || peekMode) act.lookWant = 0.42
	let glanceAllowed = !(bootWave || peekMode || inviteMode)

	// The same hooks as Version B's chat, word for word.
	const hooks = {
		focus(on: boolean) {
			act.focus = on
			if (act.typing) return
			act.want = on ? Math.max(act.want, 0.28) : act.inChat ? act.want : 0
			act.screenWant = on ? Math.max(act.screenWant, 0.45) : act.inChat ? act.screenWant : 0
			act.lowerAt = 0
		},
		writing(on: boolean) {
			act.writing = on
			if (act.typing) return
			act.lookWant = on ? 0.55 : 0
			act.want = on ? Math.max(act.want, 0.42) : act.focus ? Math.max(act.inChat ? act.want : 0, 0.28) : act.want
			act.screenWant = on ? Math.max(act.screenWant, 0.7) : act.screenWant
			if (on) act.lowerAt = 0
		},
		heard() {
			act.inChat = true
			act.ping = 1
			act.buzz = 1
			act.want = 1
			act.lookWant = 1
			act.screenWant = 1
			act.lowerAt = 0
			glanceAllowed = false
			act.waveWant = 0
		},
		typing(on: boolean) { act.typing = on },
		answered(kind: string) {
			act.ping = 1
			act.lookWant = 0
			act.nod = 1
			act.want = kind === 'bye' ? 0.3 : kind === 'answer' || kind === 'unknown' ? 0.72 : 0.55
			act.screenWant = 0.7
			const hold = kind === 'bye' ? 800 : kind === 'thanks' ? 2600 : kind === 'ok' || kind === 'praise' || kind === 'laugh' ? 4500 : 9000
			act.lowerAt = performance.now() + hold
		},
		closed() {
			act.inChat = false
			act.want = 0
			act.lookWant = 0
			act.screenWant = 0
			act.lowerAt = 0
			glanceAllowed = true
		},
		wave(on: boolean) {
			act.waveWant = on ? 1 : 0
			if (on) {
				glanceAllowed = false
				act.lookWant = Math.max(act.lookWant, 0.2)
			} else if (!act.inChat) {
				glanceAllowed = true
			}
		},
	}

	let lastPhone = ''
	window.addEventListener('message', (e: MessageEvent<FromChat>) => {
		if (e.origin !== location.origin || !e.data || typeof e.data !== 'object') return
		const m = e.data
		switch (m.t) {
			case 'focus': hooks.focus(m.on); break
			case 'writing': hooks.writing(m.on); break
			case 'heard': hooks.heard(); break
			case 'typing': hooks.typing(m.on); break
			case 'answered': hooks.answered(m.kind); break
			case 'closed': hooks.closed(); break
			case 'wave': hooks.wave(m.on); break
			case 'duck': if (inviteMode) duckTarget = m.on ? 1 : 0; break
			case 'theme': applyTheme(!!m.light); break
			case 'run': stage.setRunning(m.on); if (m.on) lastPhone = ''; break
			case 'pointer': {
				// the page's pointer, in this frame's pixels: he follows it even when it is outside the circle
				const W = innerWidth, H = innerHeight
				pointer.x = Math.max(-1, Math.min(1, (m.x - stage.cx) / (Math.max(W, 320) * 1.6)))
				pointer.y = Math.max(-1, Math.min(1, (m.y - (stage.cy - 0.07 * stage.k)) / (Math.max(H, 320) * 1.6)))
				break
			}
		}
	})

	stage.onFrame.push((t, dt) => {
		const now = performance.now()
		if (act.lowerAt && now > act.lowerAt && !act.typing) {
			act.lowerAt = 0
			act.want = act.focus ? 0.28 : 0
			act.screenWant = act.focus ? 0.45 : 0
			glanceAllowed = true
		}
		// Now and then he checks his phone. Nobody stands completely still.
		if (glanceAllowed && !act.focus && t > act.nextGlance && followGain > 0.9) {
			act.nextGlance = t + 9 + Math.random() * 8
			act.glanceEnd = t + 1.5
			act.ping = Math.max(act.ping, 0.55)
		}
		const glancing = glanceAllowed && t < act.glanceEnd
		const wantNow = glancing ? Math.max(act.want, 0.12) : act.want
		act.mix += (wantNow - act.mix) * (1 - Math.exp(-dt * (wantNow > act.mix ? 3.1 : 2.3)))
		act.look += ((glancing ? 0.42 : act.lookWant) - act.look) * (1 - Math.exp(-dt * 4.2))
		act.screen += ((glancing ? 0.5 : act.screenWant) - act.screen) * (1 - Math.exp(-dt * 6))
		act.wave += (act.waveWant - act.wave) * (1 - Math.exp(-dt * 3.4))
		act.ping *= Math.exp(-dt * 2.4)
		act.buzz *= Math.exp(-dt * 6.5)
		act.nod *= Math.exp(-dt * 2.2)
		followGain = Math.min(1, followGain + dt / 1.2)
		const m = ease(Math.min(1, act.mix))
		const w = ease(Math.min(1, act.wave))
		phoneU.uPhoneOn.value = Math.max(act.screen, 0.2)
		phoneU.uPing.value = act.ping
		glassU.uHud.value = 1 + act.look * 0.9
		glassU.uOn.value = 1

		// ---- body ----
		rig.setMix(m)
		stage.setPhoneMix(m)
		const still = 1 - m * 0.65
		const breath = Math.sin(t * 1.05)
		rig.add('spine01', 1, 0, 0, -0.55 * breath)
		rig.add('spine03', 1, 0, 0, 0.25 * breath)
		rig.add('clavicle.R', 0, 0, 1, -0.5 * breath)
		rig.add('clavicle.L', 0, 0, 1, 0.5 * breath * (1 - w))
		const sway = Math.sin(t * 0.29) + 0.5 * Math.sin(t * 0.47 + 1)
		rig.add('root', 0, 0, 1, 0.55 * sway * still * (1 - w * 0.7))
		rig.add('spine04', 0, 0, 1, -0.55 * sway * still * (1 - w * 0.7))
		rig.add('spine02', 0, 1, 0, 0.6 * Math.sin(t * 0.23 + 2) * still)
		stage.phone.group.visible = !inviteMode
		rig.add('upperarm01.L', 1, 0, 0, 0.8 * Math.sin(t * 0.41 + 1) * still)
		rig.add('lowerarm01.L', 1, 0, 0, 0.9 * Math.sin(t * 0.37) * still)
		rig.add('lowerarm01.R', 1, 0, 0, 0.7 * Math.sin(t * 0.53 + 2))
		rig.add('wrist.R', 0, 0, 1, 0.7 * Math.sin(t * 0.71))
		// A buzz in his hand when a message lands.
		if (act.buzz > 0.02) rig.add('wrist.R', 0, 0, 1, Math.sin(t * 180) * 1.1 * act.buzz)
		// Thumbs, one and then the other, not in a rhythm.
		if (act.typing && t > act.nextTap) {
			act.tapR = 1
			act.nextTap = t + 0.1 + Math.random() * 0.17
		}
		act.tapR *= Math.exp(-dt * 18)
		if (m > 0.5) rig.tap('R', (act.tapR - 0.25) * (m - 0.5) * 2)

		if (inviteMode) {
			const duckAmount = Math.max(0, Math.min(1, duckMotion.update(dt, duckTarget)))
			if (!duckTarget && duckAmount < 0.02) inviteElapsed += dt
			animateInvite(stage, inviteElapsed, duckAmount)
		}

		// ---- head and eyes ----
		const idleY = Math.sin(t * 0.37) * rad(1.4) + Math.sin(t * 0.17 + 2) * rad(0.9)
		const idleP = Math.sin(t * 0.53 + 1) * rad(0.5)
		const look = act.look
		const away = 1 - look * 0.85
		const toYaw = (REST_YAW + (pointer.x * rad(16) + idleY) * followGain) * away + rad(4) * look
		const toPitch = (REST_PITCH + (pointer.y * rad(6) + idleP) * followGain) * away + rad(15) * look + rad(5) * Math.sin(act.nod * Math.PI) * act.nod
		const y = yaw.update(dt, toYaw), p = pitch.update(dt, toPitch)
		const ey = eyeY.update(dt, (pointer.x * rad(14) * followGain) * away)
		const ep = eyeP.update(dt, (pointer.y * rad(8) * followGain) * away + rad(17) * look)
		if (blinkT < 0 && t > blinkAt) { blinkT = t; blinkDouble = Math.random() < 0.18 }
		let b = 0
		if (blinkT >= 0) {
			const k = t - blinkT
			b = k < 0.07 ? k / 0.07 : k < 0.24 ? 1 - (k - 0.07) / 0.17 : 0
			if (k >= 0.24) {
				if (blinkDouble) { blinkDouble = false; blinkT = t + 0.08 } else { blinkT = -1; blinkAt = t + 2.4 + Math.random() * 3.6 }
			}
		}
		stage.head.setPose(y, p, ey, ep)
		stage.head.setBlink(b * 0.92)
		bodyU.uTime.value = t
		glassU.uTime.value = t
		glassU.uLook.value.set(-pointer.x * 0.016 * away, pointer.y * 0.03 * away + look * 0.03)
		stage.rimL.position.x = -1.25 - pointer.x * 0.28
		stage.rimR.position.x = 1.25 - pointer.x * 0.28
		stage.head.strandU.uL0.value.x = stage.rimL.position.x
		stage.head.strandU.uL1.value.x = stage.rimR.position.x
	})
	// After the frame is drawn the phone's place on screen is known: the chat's line of light ends there.
	stage.onFrame.push(() => {
		const px = `${Math.round(stage.phonePx.x)},${Math.round(stage.phonePx.y)}`
		if (px === lastPhone) return
		lastPhone = px
		tell({ t: 'phone', x: stage.phonePx.x, y: stage.phonePx.y })
	})

	stage.start()
	// The first frames are drawn before the circle shows him, so he never pops in half built.
	requestAnimationFrame(() => requestAnimationFrame(() => tell({ t: 'ready' })))
	;(window as any).__avatar = { stage, act, hooks }
}
