import { useEffect, useRef } from 'react'
import { isTouch, prefersReducedMotion } from './index'

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`

// Cells of the page's 80 px grid lift softly near the pointer, on top of the plain CSS grid.
// A click on the background sends a ring of light out through the cells (round 3).
const FRAG = `precision mediump float;
uniform vec2 res;uniform vec2 mouse;uniform float glow;uniform vec3 ink;uniform float scale;uniform vec2 rip;uniform float ript;
void main(){
	vec2 px=vec2(gl_FragCoord.x,res.y-gl_FragCoord.y)/scale;
	vec2 cell=floor(px/80.);
	vec2 centre=(cell+.5)*80.;
	float d=distance(centre,mouse);
	float lift=1.-smoothstep(0.,280.,d);
	lift=lift*lift;
	vec2 f=abs(fract(px/80.)-.5)*2.;
	float edge=smoothstep(.97,1.,max(f.x,f.y));
	float a=(lift*.075+edge*lift*.28)*glow;
	if(ript>=0.){
		float R=ript*760.;
		float w=exp(-pow((distance(centre,rip)-R)/85.,2.))*(1.-smoothstep(.2,1.45,ript));
		a+=w*(.07+edge*.4);
	}
	gl_FragColor=vec4(ink*a,a);
}`

/** Calm pointer light on the background grid. No GPU, a touch screen or reduced motion: the plain CSS grid stays. */
export default function GridField({ light }: { light: boolean }) {
	const ref = useRef<HTMLCanvasElement>(null)
	const lightRef = useRef(light)
	const kick = useRef<() => void>(() => {})

	useEffect(() => {
		lightRef.current = light
		kick.current()
	}, [light])

	useEffect(() => {
		const canvas = ref.current
		if (!canvas || isTouch() || prefersReducedMotion()) return
		const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' })
		if (!gl) return
		const info = gl.getExtension('WEBGL_debug_renderer_info')
		if (info && /swiftshader|llvmpipe|software/i.test(String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)))) return

		const shader = (type: number, src: string) => {
			const s = gl.createShader(type)!
			gl.shaderSource(s, src)
			gl.compileShader(s)
			return s
		}
		const program = gl.createProgram()!
		gl.attachShader(program, shader(gl.VERTEX_SHADER, VERT))
		gl.attachShader(program, shader(gl.FRAGMENT_SHADER, FRAG))
		gl.linkProgram(program)
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return
		gl.useProgram(program)
		gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
		const loc = gl.getAttribLocation(program, 'p')
		gl.enableVertexAttribArray(loc)
		gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
		const u = {
			res: gl.getUniformLocation(program, 'res'),
			mouse: gl.getUniformLocation(program, 'mouse'),
			glow: gl.getUniformLocation(program, 'glow'),
			ink: gl.getUniformLocation(program, 'ink'),
			scale: gl.getUniformLocation(program, 'scale'),
			rip: gl.getUniformLocation(program, 'rip'),
			ript: gl.getUniformLocation(program, 'ript'),
		}
		let rippleAt = -1, rippleX = 0, rippleY = 0

		const scale = Math.min(window.devicePixelRatio || 1, 1.5)
		const resize = () => {
			canvas.width = Math.round(window.innerWidth * scale)
			canvas.height = Math.round(window.innerHeight * scale)
			gl.viewport(0, 0, canvas.width, canvas.height)
			gl.uniform2f(u.res, canvas.width, canvas.height)
			gl.uniform1f(u.scale, scale)
			kick.current()
		}

		const target = { x: -999, y: -999, glow: 0 }
		const now = { x: -999, y: -999, glow: 0 }
		let raf = 0
		let idleFrames = 0

		// Draws only while something moves; a still pointer costs nothing.
		const frame = () => {
			now.x += (target.x - now.x) * 0.12
			now.y += (target.y - now.y) * 0.12
			now.glow += (target.glow - now.glow) * 0.07
			gl.uniform2f(u.mouse, now.x, now.y)
			gl.uniform1f(u.glow, now.glow)
			// round 4b: cool ink, to sit on the blue-black ground (src/premium.css)
			if (lightRef.current) gl.uniform3f(u.ink, 0.05, 0.09, 0.2)
			else gl.uniform3f(u.ink, 0.84, 0.9, 1)
			const rt = rippleAt < 0 ? -1 : (performance.now() - rippleAt) / 1000
			if (rt > 1.5) rippleAt = -1
			gl.uniform2f(u.rip, rippleX, rippleY)
			gl.uniform1f(u.ript, rippleAt < 0 ? -1 : rt)
			gl.clearColor(0, 0, 0, 0)
			gl.clear(gl.COLOR_BUFFER_BIT)
			gl.drawArrays(gl.TRIANGLES, 0, 3)
			const moving = rippleAt >= 0 || Math.abs(target.x - now.x) + Math.abs(target.y - now.y) > 0.5 || Math.abs(target.glow - now.glow) > 0.004
			idleFrames = moving ? 0 : idleFrames + 1
			raf = idleFrames > 4 ? 0 : requestAnimationFrame(frame)
		}
		const wake = () => {
			idleFrames = 0
			if (!raf) raf = requestAnimationFrame(frame)
		}
		kick.current = wake

		const move = (e: PointerEvent) => {
			if (now.glow < 0.01) { now.x = e.clientX; now.y = e.clientY }
			target.x = e.clientX
			target.y = e.clientY
			target.glow = 1
			wake()
		}
		const leave = () => { target.glow = 0; wake() }
		// only on the background: a click on something that does something stays about that thing
		const press = (e: PointerEvent) => {
			if (e.button !== 0) return
			const t = e.target as Element | null
			if (t?.closest?.('a, button, input, textarea, select, label, [role="button"], .flappy-game-area, .projects-carousel, .articles-carousel, .business-card, .coin-tilt, .values-visual, .journey-map, .chat-sheet')) return
			rippleAt = performance.now()
			rippleX = e.clientX
			rippleY = e.clientY
			wake()
		}

		resize()
		window.addEventListener('resize', resize)
		window.addEventListener('pointermove', move, { passive: true })
		window.addEventListener('pointerdown', press, { passive: true })
		document.documentElement.addEventListener('pointerleave', leave)
		return () => {
			cancelAnimationFrame(raf)
			kick.current = () => {}
			window.removeEventListener('resize', resize)
			window.removeEventListener('pointermove', move)
			window.removeEventListener('pointerdown', press)
			document.documentElement.removeEventListener('pointerleave', leave)
		}
	}, [])

	return <canvas ref={ref} className="grid-field" aria-hidden="true" />
}
