import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

export type SignatureHandle = { setProgress: (p: number) => void }

const SOFT = 0.03

/**
 * Replays the signature from /signature-map.webp: red says when a pixel is drawn, green how much ink it has.
 * Only the inked pixels are touched each frame, so it stays cheap.
 */
export default forwardRef<SignatureHandle, { ink: [number, number, number]; className?: string; label: string }>(
	function SignatureCanvas({ ink, className, label }, ref) {
		const canvasRef = useRef<HTMLCanvasElement>(null)
		const progress = useRef(0)
		const draw = useRef<((p: number) => void) | null>(null)

		useImperativeHandle(ref, () => ({
			setProgress(p: number) {
				progress.current = p
				draw.current?.(p)
			},
		}), [])

		useEffect(() => {
			const canvas = canvasRef.current
			if (!canvas) return
			let cancelled = false
			const img = new Image()
			img.src = '/signature-map.webp'
			img.onload = () => {
				if (cancelled) return
				const w = img.naturalWidth, h = img.naturalHeight
				canvas.width = w
				canvas.height = h
				const ctx = canvas.getContext('2d', { willReadFrequently: true })
				if (!ctx) return
				ctx.drawImage(img, 0, 0)
				const map = ctx.getImageData(0, 0, w, h).data
				const out = ctx.createImageData(w, h)
				const px = out.data
				const index: number[] = [], when: number[] = [], cover: number[] = []
				for (let i = 0; i < map.length; i += 4) {
					if (map[i + 1] < 4) continue
					index.push(i)
					when.push(map[i] / 255)
					cover.push(map[i + 1])
					px[i] = ink[0]; px[i + 1] = ink[1]; px[i + 2] = ink[2]
				}
				draw.current = (p: number) => {
					const edge = p * (1 + SOFT)
					for (let k = 0; k < index.length; k++) {
						const a = (edge - when[k]) / SOFT
						px[index[k] + 3] = a <= 0 ? 0 : a >= 1 ? cover[k] : cover[k] * a
					}
					ctx.putImageData(out, 0, 0)
				}
				draw.current(progress.current)
			}
			return () => { cancelled = true }
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [])

		return <canvas ref={canvasRef} className={className} role="img" aria-label={label} />
	}
)
