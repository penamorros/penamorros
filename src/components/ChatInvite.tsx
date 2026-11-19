import { useEffect, useRef, useState } from 'react'
import { whenBooted, whenHeroSettled } from '../motion'
import './chat-invite.css'
import { fairyActive } from './JetGuide'

// What he says from over the portrait, in turn. The line on show decides where a click goes.
const LINES = [
  { text: 'Ask me anything', meet: false },
  { text: 'Book a call with me', meet: true },
  { text: 'Curious? Let’s chat', meet: false },
]

export default function ChatInvite({ open, onOpen, heroReady }: { open: boolean; onOpen: (meet?: boolean) => void; heroReady: boolean }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [ready, setReady] = useState(false)
  // with the jetpack fairy on the page, he is the character here: no 3D twin of our own to load
  const [fairy] = useState(fairyActive)
  const [still, setStill] = useState(fairy)
  const [released, setReleased] = useState(false)
  const shown = released && (ready || still)
  const [line, setLine] = useState(0)
  // the line holds still while the pointer is on him or on the pill, so the words never change under a click
  const [held, setHeld] = useState(false)
  useEffect(() => {
    if (!shown || open || held) return
    const id = window.setInterval(() => setLine((i) => (i + 1) % LINES.length), 3800)
    return () => window.clearInterval(id)
  }, [shown, open, held])
  // Each new line is his: as it lands he gives a small nod and his suit pulses once (src/avatar/main.ts, 'line').
  // Not for the first line, which arrives with him.
  const firstLine = useRef(true)
  useEffect(() => {
    if (firstLine.current) { firstLine.current = false; return }
    frame.current?.contentWindow?.postMessage({ t: 'line' }, location.origin)
  }, [line])
  const duck = (on: boolean) => {
    if (!window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches) return
    frame.current?.contentWindow?.postMessage({ t: 'duck', on }, location.origin)
  }

  useEffect(() => {
    let alive = true
    whenBooted().then(() => { if (alive) setLoaded(true) })
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (!heroReady) return
    let alive = true
    whenHeroSettled().then(() => {
      if (alive) setReleased(true)
    })
    return () => { alive = false }
  }, [heroReady])

  useEffect(() => {
    if (!loaded) return
    let gotReady = false
    const receive = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.source !== frame.current?.contentWindow || !event.data?.avatar) return
      if (event.data.t === 'ready') {
        gotReady = true
        frame.current?.contentWindow?.postMessage({ t: 'run', on: false }, location.origin)
        frame.current?.contentWindow?.postMessage({ t: 'theme', light: !!document.querySelector('.app.color-mode') }, location.origin)
        setStill(false)
        ;(window as any).__avatarDiag = event.data.diag
        setReady(true)
      }
      if (event.data.t === 'nogl') { (window as any).__avatarErr = event.data.err || 'nogl'; setStill(true) }
    }
    window.addEventListener('message', receive)
    // Safari can hang the WebGL boot with no message — show the still so the peek is never blank.
    // the picture covers the gap while he loads; it no longer ends the attempt (see the frame below)
    const fallback = window.setTimeout(() => { if (!gotReady) setStill(true) }, 6000)
    return () => {
      window.removeEventListener('message', receive)
      window.clearTimeout(fallback)
    }
  }, [loaded])

  // The pointer, in his frame's pixels, so he can turn his head to it while it is on him (src/avatar/main.ts).
  useEffect(() => {
    if (!ready) return
    let raf = 0, px = 0, py = 0
    const onPointer = (e: PointerEvent) => {
      px = e.clientX; py = e.clientY
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const el = frame.current
        const r = el?.getBoundingClientRect()
        if (!el || !r || !r.width) return
        el.contentWindow?.postMessage({ t: 'pointer', x: ((px - r.left) / r.width) * el.clientWidth, y: ((py - r.top) / r.height) * el.clientHeight }, location.origin)
      })
    }
    window.addEventListener('pointermove', onPointer, { passive: true })
    return () => { window.removeEventListener('pointermove', onPointer); cancelAnimationFrame(raf) }
  }, [ready])

  useEffect(() => {
    if (!ready || !button.current) return
    let visible = false
    const sync = () => frame.current?.contentWindow?.postMessage({ t: 'run', on: visible && released && !open && !document.hidden }, location.origin)
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync() })
    observer.observe(button.current)
    document.addEventListener('visibilitychange', sync)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync) }
  }, [ready, released, open])

  return (
    <div onPointerEnter={() => setHeld(true)} onPointerLeave={() => setHeld(false)} className={`chat-invite${fairy ? ' is-fairy' : ''}${shown ? ' is-shown' : ''}${ready && released ? ' is-ready' : ''}${still ? ' is-still' : ''}${open ? ' is-open' : ''}`} aria-hidden={open || !shown || undefined} {...(open || !shown ? { inert: '' } : {})}>
      <button ref={button} type="button" className="invite-peek" onPointerEnter={() => duck(true)} onPointerLeave={() => duck(false)} onClick={() => onOpen(false)} aria-label="Chat with Manuel's AI twin" aria-expanded={open}>
        <span className="invite-fx is-back" aria-hidden="true"><i className="fx-halo" /><i className="fx-ring" /><i className="fx-ring two" /></span>
        <span className="invite-character" aria-hidden="true">
          {loaded && !fairy && <iframe ref={frame} src="/avatar.html?invite" title="Manuel peeking over the portrait" tabIndex={-1} />}
          {still && !fairy && <img src="/avatar-3d.webp" alt="" />}
        </span>
        <span className="invite-fx is-front" aria-hidden="true"><i className="fx-scan" /><i className="fx-corner tl" /><i className="fx-corner tr" /><i className="fx-corner bl" /><i className="fx-corner br" /></span>
      </button>
      <button type="button" className="invite-thought" onPointerEnter={() => duck(true)} onPointerLeave={() => duck(false)} onClick={() => onOpen(LINES[line].meet)} aria-label={LINES[line].meet ? 'Book a call with Manuel' : "Open chat with Manuel's AI twin"}>
        <span className="invite-label">
          <i className="invite-live" aria-hidden="true" />
          {/* the arrow rides inside the line, so when a narrow screen wraps it, it follows the last word */}
          <span className="invite-line" key={line}>{LINES[line].text}<span className="invite-arrow" aria-hidden="true">↗</span></span>
        </span>
      </button>
    </div>
  )
}
