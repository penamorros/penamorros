// The particle flight's WebGL, shared by the worker (src/motion/intro.worker.ts) and the main-thread fallback in
// src/motion/intro.ts. Plain WebGL 1, the whole flight in the vertex shader. Positions are kept relative to the
// signature (uSig) and to the hero circle (uBox), which are only measured at the handover.

export const F = 11 // floats per particle: src 2, dst 2, colour 3, delay, flight, random, bend

const VERT = `
attribute vec2 aSrc, aDst;
attribute vec3 aCol;
attribute vec4 aTim;
uniform float uT, uDpr, uSizeA, uSizeB, uAlpha, uScroll;
uniform vec2 uRes;
uniform vec4 uSig, uBox;
varying vec3 vCol;
varying float vA;
float ease(float x) { return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) * 0.5; }
void main() {
	vec2 s = uSig.xy + aSrc * uSig.zw;
	vec2 d = uBox.xy + aDst * uBox.zw - vec2(0.0, uScroll);
	vec2 dir = d - s;
	float len = max(length(dir), 1.0);
	// a curve out to one side, most of them bowing upwards like thrown sparks
	vec2 c = (s + d) * 0.5 + vec2(-dir.y, dir.x) / len * aTim.w * len - vec2(0.0, len * 0.12);
	float p = clamp((uT - aTim.x) / aTim.y, 0.0, 1.0);
	float e = ease(p);
	vec2 q = mix(mix(s, c, e), mix(c, d, e), e);
	float fly = sin(3.14159 * e);
	q += vec2(sin(aTim.z * 61.0 + uT * 5.0), cos(aTim.z * 47.0 + uT * 4.3)) * 7.0 * fly;
	vec2 clip = q / uRes * 2.0 - 1.0;
	gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
	gl_PointSize = mix(uSizeA, uSizeB, smoothstep(0.0, 1.0, e)) * uDpr * (0.85 + 0.3 * aTim.z) * (1.0 + 0.7 * fly);
	vCol = mix(vec3(1.0), aCol, smoothstep(0.4, 1.0, e)) + vec3(0.25, 0.22, 0.18) * fly;
	vA = uAlpha;
}`

const FRAG = `
precision mediump float;
varying vec3 vCol;
varying float vA;
void main() {
	float d = length(gl_PointCoord - 0.5) * 2.0;
	if (d > 1.0) discard;
	float a = (1.0 - smoothstep(0.4, 1.0, d)) * vA;
	gl_FragColor = vec4(vCol * a, a);
}`

export type Rects = { sig: [number, number, number, number]; box: [number, number, number, number]; sizeA: number; sizeB: number }
export type IntroGL = {
	setRects(r: Rects): void
	draw(t: number, alpha: number, scroll: number): void
	dispose(): void
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** Builds the renderer; null without WebGL, 'software' on a software renderer (it would draw the flight on the CPU). */
export async function createIntroGL(canvas: HTMLCanvasElement | OffscreenCanvas, W: number, H: number, dpr: number, data: Float32Array, n: number): Promise<IntroGL | 'software' | null> {
	canvas.width = Math.round(W * dpr)
	canvas.height = Math.round(H * dpr)
	const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false }) as WebGLRenderingContext | null
	if (!gl) return null
	const lose = () => gl.getExtension('WEBGL_lose_context')?.loseContext()
	const info = gl.getExtension('WEBGL_debug_renderer_info')
	if (info && /swiftshader|llvmpipe|software|basic render/i.test(String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)))) { lose(); return 'software' }
	await wait(0)

	const shader = (type: number, code: string) => {
		const sh = gl.createShader(type)!
		gl.shaderSource(sh, code)
		gl.compileShader(sh)
		return sh
	}
	const vs = shader(gl.VERTEX_SHADER, VERT), fs = shader(gl.FRAGMENT_SHADER, FRAG)
	const prog = gl.createProgram()!
	gl.attachShader(prog, vs)
	gl.attachShader(prog, fs)
	gl.linkProgram(prog)
	// where the browser can, the compile runs in parallel: wait for it instead of blocking on it
	const par = gl.getExtension('KHR_parallel_shader_compile')
	if (par) while (!gl.getProgramParameter(prog, par.COMPLETION_STATUS_KHR)) await wait(16)
	if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { lose(); return null }
	await wait(0)

	gl.useProgram(prog)
	gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
	gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
	const attr = (name: string, size: number, offset: number) => {
		const loc = gl.getAttribLocation(prog, name)
		if (loc < 0) return
		gl.enableVertexAttribArray(loc)
		gl.vertexAttribPointer(loc, size, gl.FLOAT, false, F * 4, offset * 4)
	}
	attr('aSrc', 2, 0); attr('aDst', 2, 2); attr('aCol', 3, 4); attr('aTim', 4, 7)
	const u = (name: string) => gl.getUniformLocation(prog, name)
	const uT = u('uT'), uAlpha = u('uAlpha'), uScroll = u('uScroll'), uSig = u('uSig'), uBox = u('uBox'), uSizeA = u('uSizeA'), uSizeB = u('uSizeB')
	gl.uniform2f(u('uRes'), W, H)
	gl.uniform1f(u('uDpr'), dpr)
	gl.uniform4f(uSig, 0, 0, 1, 1)
	gl.uniform4f(uBox, 0, 0, 1, 1)
	gl.viewport(0, 0, canvas.width, canvas.height)
	gl.disable(gl.DEPTH_TEST)
	gl.enable(gl.BLEND)
	gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
	gl.clearColor(0, 0, 0, 0)
	const draw = (t: number, alpha: number, scroll: number) => {
		gl.uniform1f(uT, t)
		gl.uniform1f(uAlpha, alpha)
		gl.uniform1f(uScroll, scroll)
		gl.clear(gl.COLOR_BUFFER_BIT)
		gl.drawArrays(gl.POINTS, 0, n)
	}
	await wait(0)
	// drawn once, invisible, so the handover frame has nothing left to build
	draw(0, 0, 0)
	return {
		setRects(r) {
			gl.uniform4f(uSig, ...r.sig)
			gl.uniform4f(uBox, ...r.box)
			gl.uniform1f(uSizeA, r.sizeA)
			gl.uniform1f(uSizeB, r.sizeB)
		},
		draw,
		dispose: lose,
	}
}
