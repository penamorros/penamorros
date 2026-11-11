import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight } from '../icons'
import { articles } from '../content'
import { gsap, prefersReducedMotion, useDesktop, useMotion, writeIn } from '../motion'
import { curlAway } from '../motion/pageCurl'

type Article = (typeof articles)[number]

export default memo(function Articles() {
	const sectionRef = useRef<HTMLElement>(null)
	const trackRef = useRef<HTMLDivElement>(null)
	const clipRef = useRef<HTMLDivElement>(null)
	const desktop = useDesktop()
	const [current, setCurrent] = useState(0)
	const previous = useRef(0)

	const wide = () => window.matchMedia('(min-width: 701px)').matches

	useMotion(sectionRef, () => {
		const section = sectionRef.current!
		const q = gsap.utils.selector(section)
		writeIn(q('.write')[0])
		const arrive = { trigger: q('.articles-carousel-wrapper')[0], start: 'top 80%', once: true }
		gsap.from(q('.articles-carousel'), { y: 44, autoAlpha: 0, duration: 1.3, scrollTrigger: arrive })
		const first = q('.newspaper-card')[0] as Element
		gsap.from(first.querySelectorAll('.newspaper-divider, .newspaper-divider-small'), { scaleX: 0, transformOrigin: 'left center', duration: 1.5, ease: 'power2.inOut', stagger: 0.1, delay: 0.3, scrollTrigger: arrive })
		gsap.from(first.querySelector('.newspaper-image-wrapper'), { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.4, delay: 0.3, scrollTrigger: arrive, clearProps: 'clipPath' })
		gsap.from(first.querySelectorAll('.newspaper-headline, .newspaper-byline, .newspaper-body-text, .newspaper-continued'), { y: 20, autoAlpha: 0, duration: 1, stagger: 0.09, delay: 0.45, scrollTrigger: arrive })
	}, [desktop])

	// Turns the page (round 4): the old page curls away like paper (src/motion/pageCurl.ts) and the next one is under it, its picture and
	// words coming up as it shows.
	useLayoutEffect(() => {
		const track = trackRef.current
		if (!track || !wide()) {
			if (track) track.style.transform = ''
			previous.current = current
			return
		}
		const from = previous.current
		previous.current = current
		if (from === current) return
		const cards = track.children
		const dir = current > from ? 1 : -1
		if (prefersReducedMotion()) {
			gsap.set(track, { xPercent: -current * 100 })
			return
		}
		const incoming = cards[current]
		const outgoing = cards[from] as HTMLElement
		// the copy of the old page is laid over it first, then the track jumps to the new one underneath
		if (clipRef.current) curlAway(clipRef.current, outgoing, dir as 1 | -1)
		gsap.set(track, { xPercent: -current * 100 })
		const tl = gsap.timeline({ delay: 0.25 })
		tl.fromTo(incoming.querySelector('.newspaper-image-wrapper'), { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, clearProps: 'clipPath' }, 0.1)
		tl.fromTo(incoming.querySelectorAll('.newspaper-divider, .newspaper-divider-small'), { scaleX: 0, transformOrigin: 'left center' }, { scaleX: 1, duration: 1.1, stagger: 0.08, ease: 'power2.inOut', clearProps: 'transform,transformOrigin' }, 0.05)
		tl.fromTo(incoming.querySelectorAll('.newspaper-headline, .newspaper-byline, .newspaper-body-text, .newspaper-continued'), { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.85, stagger: 0.07, clearProps: 'transform,opacity,visibility' }, 0.15)
		return () => { tl.progress(1).kill() }
	}, [current])

	// Phones swipe natively; the dots follow.
	useEffect(() => {
		const clip = clipRef.current
		const track = trackRef.current
		if (!clip || !track) return
		const onScroll = () => {
			if (wide()) return
			setCurrent(Math.max(0, Math.min(articles.length - 1, Math.round(clip.scrollLeft / clip.clientWidth))))
		}
		clip.addEventListener('scroll', onScroll, { passive: true })

		// Wider screens: a horizontal drag turns the page too.
		let startX = 0, down = false
		const pd = (e: PointerEvent) => {
			if (!wide() || (e.target as Element).closest('a')) return
			startX = e.clientX
			down = true
		}
		const pu = (e: PointerEvent) => {
			if (!down) return
			down = false
			const dx = e.clientX - startX
			if (Math.abs(dx) > 60) setCurrent((c) => Math.max(0, Math.min(articles.length - 1, c - Math.sign(dx))))
		}
		clip.addEventListener('pointerdown', pd)
		window.addEventListener('pointerup', pu)
		return () => {
			clip.removeEventListener('scroll', onScroll)
			clip.removeEventListener('pointerdown', pd)
			window.removeEventListener('pointerup', pu)
		}
	}, [])

	const show = (index: number) => {
		if (wide()) {
			setCurrent(index)
			return
		}
		clipRef.current?.scrollTo({ left: index * clipRef.current.clientWidth, behavior: 'smooth' })
	}

	const nextArticle = () => show(current + 1 >= articles.length ? 0 : current + 1)
	const prevArticle = () => show(current - 1 < 0 ? articles.length - 1 : current - 1)

	return (
		<section id="articles" ref={sectionRef} className="section tone-1 tone-sep">
			<div className="container">
				<h2><span className="write">Article Mentions</span></h2>
				<div className="articles-carousel-wrapper">
					<div className="articles-carousel" ref={clipRef}>
						<div className="articles-container" ref={trackRef}>
							{articles.map((article) => (
								<ArticleCard key={article.id} article={article} />
							))}
						</div>
					</div>
					<button className="carousel-arrows carousel-prev" onClick={prevArticle} aria-label="Previous article">
						<ChevronLeft size={24} />
					</button>
					<button className="carousel-arrows carousel-next" onClick={nextArticle} aria-label="Next article">
						<ChevronRight size={24} />
					</button>
					<div className="carousel-indicators">
						{articles.map((article, index) => (
							<button
								key={article.id}
								className={`carousel-indicator ${current === index ? 'active' : ''}`}
								aria-label={`Show ${article.publication}`}
								onClick={() => show(index)}
							/>
						))}
					</div>
				</div>
			</div>
		</section>
	)
})

function ArticleCard({ article }: { article: Article }) {
	return (
		<div className="newspaper-card">
			<div className="newspaper-header">
				<div className="newspaper-masthead">
					<div className="newspaper-name">{article.publication}</div>
					<div className="newspaper-date">{article.date}</div>
				</div>
				<div className="newspaper-divider"></div>
			</div>

			<div className="newspaper-body">
				<div className="newspaper-column newspaper-image-column">
					<div className="newspaper-image-wrapper">
						<img src={article.image} alt={article.title} className="newspaper-image" loading="lazy" decoding="async" />
						<div className="newspaper-image-caption">{article.category}</div>
					</div>
				</div>

				<div className="newspaper-column newspaper-text-column">
					<div className="newspaper-headline">{article.title}</div>
					<div className="newspaper-byline">
						<span className="newspaper-section">{article.category}</span>
						<span className="newspaper-separator">•</span>
						<span className="newspaper-read-time">{article.readTime}</span>
					</div>
					<div className="newspaper-divider-small"></div>
					<div className="newspaper-body-text">{article.description}</div>
					{article.link !== '#' && (
						<div className="newspaper-continued">
							<a href={article.link} className="newspaper-link" target="_blank" rel="noopener noreferrer">
								Continue Reading <ArrowRight size={14} />
							</a>
						</div>
					)}
				</div>
			</div>

			<div className="newspaper-footer">
				<div className="newspaper-divider"></div>
			</div>
		</div>
	)
}
