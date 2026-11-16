import { useEffect, useRef, useState } from 'react'
import { whenBooted, whenHeroSettled } from '../motion'
import './chat-invite.css'

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
  const [still, setStill] = useState(false)
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
    const receive = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.source !== frame.current?.contentWindow || !event.data?.avatar) return
      if (event.data.t === 'ready') {
        frame.current?.contentWindow?.postMessage({ t: 'run', on: false }, location.origin)
        frame.current?.contentWindow?.postMessage({ t: 'theme', light: !!document.querySelector('.app.color-mode') }, location.origin)
        setReady(true)
      }
      if (event.data.t === 'nogl') setStill(true)
    }
    window.addEventListener('message', receive)
    return () => window.removeEventListener('message', receive)
  }, [loaded])

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
    <div onPointerEnter={() => setHeld(true)} onPointerLeave={() => setHeld(false)} className={`chat-invite${shown ? ' is-shown' : ''}${ready && released ? ' is-ready' : ''}${still ? ' is-still' : ''}${open ? ' is-open' : ''}`} aria-hidden={open || !shown || undefined} {...(open || !shown ? { inert: '' } : {})}>
      <button ref={button} type="button" className="invite-peek" onPointerEnter={() => duck(true)} onPointerLeave={() => duck(false)} onClick={() => onOpen(false)} aria-label="Chat with Manuel's AI twin" aria-expanded={open}>
        <span className="invite-fx is-back" aria-hidden="true"><i className="fx-halo" /><i className="fx-ring" /><i className="fx-ring two" /></span>
        <span className="invite-character" aria-hidden="true">
          {loaded && !still && <iframe ref={frame} src="/avatar.html?invite" title="Manuel peeking over the portrait" tabIndex={-1} />}
          {still && <img src="/avatar-3d.webp" alt="" />}
        </span>
        <span className="invite-fx is-front" aria-hidden="true"><i className="fx-scan" /><i className="fx-corner tl" /><i className="fx-corner tr" /><i className="fx-corner bl" /><i className="fx-corner br" /></span>
      </button>
      <button type="button" className="invite-thought" onPointerEnter={() => duck(true)} onPointerLeave={() => duck(false)} onClick={() => onOpen(LINES[line].meet)} aria-label={LINES[line].meet ? 'Book a call with Manuel' : "Open chat with Manuel's AI twin"}>
        <span className="invite-label">
          <i className="invite-live" aria-hidden="true" />
          <span className="invite-line" key={line}>{LINES[line].text}</span>
          <span className="invite-arrow" aria-hidden="true">↗</span>
        </span>
      </button>
    </div>
  )
}
