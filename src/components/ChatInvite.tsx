import { useEffect, useRef, useState } from 'react'
import { whenBooted, whenHeroSettled } from '../motion'
import './chat-invite.css'

export default function ChatInvite({ open, onOpen, heroReady }: { open: boolean; onOpen: () => void; heroReady: boolean }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [ready, setReady] = useState(false)
  const [still, setStill] = useState(false)
  const [released, setReleased] = useState(false)
  const shown = released && (ready || still)
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
    <div className={`chat-invite${shown ? ' is-shown' : ''}${ready && released ? ' is-ready' : ''}${still ? ' is-still' : ''}${open ? ' is-open' : ''}`} aria-hidden={open || !shown || undefined} {...(open || !shown ? { inert: '' } : {})}>
      <button ref={button} type="button" className="invite-peek" onPointerEnter={() => duck(true)} onPointerLeave={() => duck(false)} onClick={onOpen} aria-label="Chat with Manuel's AI twin" aria-expanded={open}>
        <span className="invite-character" aria-hidden="true">
          {loaded && !still && <iframe ref={frame} src="/avatar.html?invite" title="Manuel peeking over the portrait" tabIndex={-1} />}
          {still && <img src="/avatar-3d.webp" alt="" />}
        </span>
      </button>
      <button type="button" className="invite-thought" onClick={onOpen} aria-label="Open chat with Manuel's AI twin">
        <span className="invite-label">Let’s chat <span aria-hidden="true">↗</span></span>
        <span className="invite-dots" aria-hidden="true"><i /><i /></span>
      </button>
    </div>
  )
}
