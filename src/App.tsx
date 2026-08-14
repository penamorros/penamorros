 import React, { useEffect, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Sun, Moon, Briefcase, GraduationCap, Zap, MessageCircle, X, Send, Target, Code, Users, Award, Lightbulb, Rocket, Bot, ChevronLeft, ChevronRight, Home, Heart, FileText, Mail, FolderOpen, Database, Server, Palette, Terminal, Globe, Smartphone, Layers, Cpu, GitBranch, Cloud, Sparkles, TrendingUp, Shield, Eye, Activity } from 'lucide-react'
import { chatService } from './services/chatService'
import { analytics } from './services/analytics'
import AdminPage from './AdminPage'

const sections = [
	{ id: 'about', label: 'Home', icon: Home },
	{ id: 'values', label: 'Values', icon: Heart },
	{ id: 'skills', label: 'Skills', icon: Zap },
	{ id: 'resume', label: 'Resume', icon: FileText },
	{ id: 'projects', label: 'Projects', icon: FolderOpen },
	{ id: 'articles', label: 'Articles', icon: FileText },
	{ id: 'contact', label: 'Contact', icon: Mail },
]

const projects = [
	{
		id: 'project2',
		title: 'TV Azteca Digital Metrics',
		description: 'Digital analytics dashboard with real-time metrics, performance tracking, and data visualization for media analytics. • Login: User / Test',
		technologies: ['React', 'Firebase', 'Chart.js', 'Google Sheets API', 'Real-time Analytics'],
		image: '/project2.jpg',
		link: 'https://aztecadigitalmetrics.netlify.app/',
		github: 'https://github.com/penamorros/dashtva'
	},
	{
		id: 'project1',
		title: 'Unif-AI Business Platform',
		description: 'AI-powered business transformation platform with document analysis and smart insights for companies of all sizes.',
		technologies: ['React', 'AI/ML', 'Document Analysis', 'Business Intelligence', 'Netlify'],
		image: '/project1.jpg',
		link: 'https://unif-ai.netlify.app/',
		github: 'https://github.com/penamorros/unif-ai'
	},
	{
		id: 'project3',
		title: 'Health Education Platform',
		description: 'Comprehensive health app with nutrition tracking, exercise monitoring, and educational resources for underserved communities.',
		technologies: ['React', 'Django', 'PostgreSQL', 'Chart.js', 'Python', 'TypeScript'],
		image: '/project3.jpg',
		link: 'https://chart-app-demo.netlify.app/',
		github: 'https://github.com/penamorros/chart-app-front'
	}
]

const CHAT_SYSTEM_PROMPT = `You are Manuel Peña-Morros's AI avatar on his portfolio website. Speak in first person as Manuel. Be friendly, professional, and concise (2–4 sentences unless more detail is requested).

CRITICAL RULES:
- ONLY use facts from this profile. NEVER invent employers, dates, awards, GPAs, or achievements.
- If unsure, say you don't have that detail and suggest checking the resume or contacting Manuel directly.
- Do NOT mention Columbia University or New York as future plans unless the user specifically asks about Columbia, New York, transferring, or where you want to go next. If asked, say you transferred from Tulane to UT Austin for Data Science, and your dream is to transfer to Columbia University School of General Studies (GS) in Fall 2027 to be in New York.

EDUCATION:
- The American School Foundation A.C., Mexico City — Class of 2024, International Baccalaureate (DP)
- The University of Texas at Austin — Class of 2029, Data Science major. Transferred from Tulane University (previously Computer Science at Tulane).

EXPERIENCE:
- Founder & CEO, Lumina Labs (New Orleans, LA) — Jan 2025–Present: AI-powered facial analysis platform; $2.5M valuation (CitiBank); $15K MRR; 1,000+ analyses; white-labeled SaaS across 5 dermatology clinics in Mexico; Apple App Store app; patent pending.
- IT Intern, TV Azteca (Mexico City) — July 2024–July 2025: Python Lighthouse automation for 600+ URLs (40% efficiency gain); React dashboards for 2,000+ real-time events; AWS deployment.
- Frontend Intern, UnifAI (New York City) — June 2025–August 2025: React, TypeScript, TailwindCSS; real-time charts; UI refactor improved engagement 25%.
- CEO, Diaita (Mexico City) — May 2022–May 2024: Health/wellness app; 1,000+ downloads; $3,000 USD revenue; 500+ clients; collaborated with nutrition pioneer Barry Sears.

PROJECTS:
- TV Azteca Digital Metrics — React/Firebase analytics dashboard (aztecadigitalmetrics.netlify.app)
- Unif-AI Business Platform — AI business transformation platform (unif-ai.netlify.app)
- Health Education Platform (Diaita) — nutrition, exercise, and education app
- Lumina Labs — flagship AI venture (see above)

SKILLS: React, TypeScript, JavaScript, Python, Node.js, PostgreSQL, AWS, TensorFlow, React Native, Figma, and more.

CONTACT: New Orleans, LA · github.com/penamorros · penamorros.com

Keep responses conversational, as if chatting with someone who visited the portfolio.`

const articles = [
	{
		id: 'article1',
		title: 'Javier Smiley and Manuel Peña-Morros Lead "Aventuras en Salud"',
		publication: 'CHIC Magazine',
		date: 'February 2024',
		description: 'Two young visionaries are reshaping children\'s health education through a foundation that inspires healthy habits and positive lifestyle change across Mexico.',
		link: 'https://www.chicmagazine.com.mx/personajes/javier-smiley-y-manuel-pena-morros-al-frente-de-aventuras-en-salud',
		category: 'Health & Leadership',
		readTime: '5 min read',
		image: '/END (3).png'
	},
	{
		id: 'article2',
		title: 'Aventuras en Salud: Manuel Peña and Javier Smiley',
		publication: 'TV Azteca',
		date: 'January 2024',
		description: 'A new generation of leaders is transforming health awareness through multimedia education, connecting hospitals, schools, and families with fun, interactive learning.',
		link: 'https://www.tvazteca.com/aventuras-salud-manuel-pena-javier-smiley',
		category: 'Media & Education',
		readTime: '6 min read',
		image: '/END (2).png'
	},
	{
		id: 'article3',
		title: 'Manuel Peña-Morros and Javier Smiley: Revolutionizing the Future of Children\'s Health',
		publication: 'El Sol de Toluca',
		date: 'December 2023',
		description: 'Their initiative, Aventuras en Salud, blends creativity and science to make health education accessible, engaging, and transformative for the next generation.',
		link: 'https://oem.com.mx/elsoldetoluca/gossip/manuel-pena-morros-y-javier-smiley-dos-jovenes-revolucionando-el-futuro-de-la-salud-infantil-en-toluca-13019690',
		category: 'Innovation & Impact',
		readTime: '7 min read',
		image: '/END.png'
	},
	{
		id: 'article4',
		title: 'Foundation Launches "Aventuras en Salud" to Promote Healthy Habits Among Children',
		publication: 'Heraldo Estado de México',
		date: 'February 2024',
		description: 'Created by the Diaita Foundation, this manual and educational program aims to teach kids aged 6–12 about wellness, nutrition, and physical activity through interactive experiences.',
		link: '#',
		category: 'Public Health',
		readTime: '4 min read',
		image: '/END (1).png'
	}
]

const values = [
	{ 
		id: 'hardwork', 
		icon: Target, 
		label: 'Hard Work', 
		description: 'I believe in putting in the effort and dedication required to achieve exceptional results. Success comes from consistent commitment and going the extra mile.',
		color: '#ec4899',
		position: { top: '10%', left: '50%' } 
	},
	{ 
		id: 'coding', 
		icon: Code, 
		label: 'Clean Code', 
		description: 'Writing maintainable, readable, and efficient code is fundamental to building scalable systems that stand the test of time.',
		color: '#10b981',
		position: { top: '25%', right: '10%' } 
	},
	{ 
		id: 'teamwork', 
		icon: Users, 
		label: 'Teamwork', 
		description: 'Collaboration and mutual support create stronger solutions. I thrive in environments where diverse perspectives come together.',
		color: '#3b82f6',
		position: { bottom: '25%', right: '10%' } 
	},
	{ 
		id: 'excellence', 
		icon: Award, 
		label: 'Excellence', 
		description: 'Striving for the highest standards in everything I do, continuously improving and delivering quality that exceeds expectations.',
		color: '#f59e0b',
		position: { bottom: '10%', left: '50%' } 
	},
	{ 
		id: 'innovation', 
		icon: Lightbulb, 
		label: 'Innovation', 
		description: 'Embracing new ideas and creative solutions to solve complex problems and drive meaningful change in technology.',
		color: '#8b5cf6',
		position: { bottom: '25%', left: '10%' } 
	},
	{ 
		id: 'growth', 
		icon: Rocket, 
		label: 'Growth', 
		description: 'Continuous learning and personal development are essential. I\'m always seeking new challenges and opportunities to expand my skills.',
		color: '#06b6d4',
		position: { top: '25%', left: '10%' } 
	},
]

const skills = [
	// Frontend
	{ id: 'react', name: 'React', category: 'Frontend', icon: Code, color: '#61dafb' },
	{ id: 'javascript', name: 'JavaScript', category: 'Frontend', icon: Code, color: '#f7df1e' },
	{ id: 'typescript', name: 'TypeScript', category: 'Frontend', icon: Code, color: '#3178c6' },
	{ id: 'html', name: 'HTML', category: 'Frontend', icon: Globe, color: '#e34f26' },
	{ id: 'css', name: 'CSS', category: 'Frontend', icon: Palette, color: '#1572b6' },
	{ id: 'tailwind', name: 'Tailwind CSS', category: 'Frontend', icon: Layers, color: '#06b6d4' },
	{ id: 'nextjs', name: 'Next.js', category: 'Frontend', icon: Rocket, color: '#000000' },
	{ id: 'react-native', name: 'React Native', category: 'Frontend', icon: Smartphone, color: '#61dafb' },
	
	// Backend
	{ id: 'node', name: 'Node.js', category: 'Backend', icon: Server, color: '#339933' },
	{ id: 'express', name: 'Express', category: 'Backend', icon: Server, color: '#000000' },
	{ id: 'rest-api', name: 'REST API', category: 'Backend', icon: Globe, color: '#ff6b6b' },
	{ id: 'sql', name: 'SQL', category: 'Backend', icon: Database, color: '#336791' },
	{ id: 'postgres', name: 'PostgreSQL', category: 'Backend', icon: Database, color: '#336791' },
	{ id: 'supabase', name: 'Supabase', category: 'Backend', icon: Database, color: '#3ecf8e' },
	{ id: 'python', name: 'Python', category: 'Backend', icon: Cpu, color: '#3776ab' },
	{ id: 'csharp', name: 'C#', category: 'Backend', icon: Cpu, color: '#239120' },
	
	// Tools & Platforms
	{ id: 'git', name: 'Git', category: 'Tools', icon: GitBranch, color: '#f05032' },
	{ id: 'github', name: 'GitHub', category: 'Tools', icon: GitBranch, color: '#181717' },
	{ id: 'linux', name: 'Linux', category: 'Tools', icon: Terminal, color: '#fcc624' },
	{ id: 'vercel', name: 'Vercel', category: 'Tools', icon: Cloud, color: '#000000' },
	{ id: 'netlify', name: 'Netlify', category: 'Tools', icon: Cloud, color: '#00c7b7' },
	{ id: 'wordpress', name: 'WordPress', category: 'Tools', icon: Globe, color: '#21759b' },
	
	// Design
	{ id: 'figma', name: 'Figma', category: 'Design', icon: Palette, color: '#f24e1e' },
	{ id: 'ux-ui', name: 'UX/UI Design', category: 'Design', icon: Palette, color: '#ff6b6b' },
	{ id: 'wireframe', name: 'Wireframing', category: 'Design', icon: Layers, color: '#8b5cf6' },
]

export default function App() {
	const isAthleticsPage = window.location.pathname.replace(/\/$/, '') === '/athletics'

	const [menuOpen, setMenuOpen] = useState<boolean>(false)
	const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
	const [colorMode, setColorMode] = useState<boolean>(false)
	const [active, setActive] = useState<string>('about')
	const [wheelSpinning, setWheelSpinning] = useState<boolean>(false)
	const [selectedValue, setSelectedValue] = useState<string | null>(null)
	const [showIntro, setShowIntro] = useState<boolean>(() => {
		if (window.location.pathname.replace(/\/$/, '') === '/athletics') return false
		return !sessionStorage.getItem('hasShownIntro')
	})
	const introGifSrc = useRef(`/signature-intro.gif?t=${Date.now()}`)
	const [photoHovered, setPhotoHovered] = useState<boolean>(false)
	const [heroInteractReady, setHeroInteractReady] = useState<boolean>(() => {
		if (window.location.pathname.replace(/\/$/, '') === '/athletics') return true
		return !!sessionStorage.getItem('hasShownIntro')
	})
	const [chatOpen, setChatOpen] = useState<boolean>(false)
	const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string}>>([])
	const [currentMessage, setCurrentMessage] = useState<string>('')
	const [isLoading, setIsLoading] = useState<boolean>(false)
	const [chatSessionId, setChatSessionId] = useState<string>('')
	const [hoveredValue, setHoveredValue] = useState<string | null>(null)
	const [scrollProgress, setScrollProgress] = useState<number>(0)
	const [headerPosition, setHeaderPosition] = useState<number>(2)
	const [currentProjectIndex, setCurrentProjectIndex] = useState<number>(1)
	const [currentArticleIndex, setCurrentArticleIndex] = useState<number>(0)
	const [currentSkillIndex, setCurrentSkillIndex] = useState<number>(0)
	const [rotationAngle, setRotationAngle] = useState<number>(-120)
	const [selectedSkill, setSelectedSkill] = useState<string | null>(null)
	const [birdPosition, setBirdPosition] = useState<number>(40) // Vertical position percentage
	const [birdVelocity, setBirdVelocity] = useState<number>(0) // Vertical velocity
	const [gameStarted, setGameStarted] = useState<boolean>(false)
	const [gameOver, setGameOver] = useState<boolean>(false)
	const [collectedSkillsCount, setCollectedSkillsCount] = useState<number>(0)
	const [scrollOffset, setScrollOffset] = useState<number>(0)
	const birdPositionRef = useRef<number>(40)
	const collectedSkillsSet = useRef<Set<number>>(new Set())
	const lastCountRef = useRef<number>(0)

	useEffect(() => {
		// Hide intro after GIF completes - wait longer to ensure full animation plays
		if (showIntro) {
			// Preload critical images in the background while signature animation plays
			const imagesToPreload = [
				'/Diseno-sin-titulo-97.png'
			]
			
			imagesToPreload.forEach(src => {
				const img = new Image()
				img.src = src
			})
			
			// Wait for GIF to load and complete (typically 3-5 seconds for signature animations)
			// Add extra time to ensure signature is fully visible at the end
			const timer = setTimeout(() => {
				setShowIntro(false)
				sessionStorage.setItem('hasShownIntro', 'true')
			}, 6000) // Increased to 6 seconds to ensure completion
			
			return () => clearTimeout(timer)
		}
	}, [showIntro])

	useEffect(() => {
		if (!showIntro) {
			setPhotoHovered(false)
			setHeroInteractReady(true)
		}
	}, [showIntro])

	useEffect(() => {
		if (!showIntro || isAthleticsPage) return

		window.scrollTo(0, 0)
		const preventScroll = (e: Event) => e.preventDefault()
		const previousOverflow = document.body.style.overflow
		document.body.style.overflow = 'hidden'
		document.documentElement.style.overflow = 'hidden'
		window.addEventListener('wheel', preventScroll, { passive: false })
		window.addEventListener('touchmove', preventScroll, { passive: false })

		return () => {
			document.body.style.overflow = previousOverflow
			document.documentElement.style.overflow = ''
			window.removeEventListener('wheel', preventScroll)
			window.removeEventListener('touchmove', preventScroll)
		}
	}, [showIntro, isAthleticsPage])

	// Block zooming (pinch, ctrl/cmd+wheel, keyboard shortcuts) on the athletics page
	useEffect(() => {
		if (!isAthleticsPage) return

		const viewport = document.querySelector('meta[name="viewport"]')
		const previousViewport = viewport?.getAttribute('content') ?? null
		viewport?.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')

		const preventWheelZoom = (e: WheelEvent) => {
			if (e.ctrlKey || e.metaKey) e.preventDefault()
		}
		const preventKeyZoom = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
				e.preventDefault()
			}
		}
		const preventGesture = (e: Event) => e.preventDefault()
		const preventPinch = (e: TouchEvent) => {
			if (e.touches.length > 1) e.preventDefault()
		}

		window.addEventListener('wheel', preventWheelZoom, { passive: false })
		window.addEventListener('keydown', preventKeyZoom)
		document.addEventListener('gesturestart', preventGesture)
		document.addEventListener('gesturechange', preventGesture)
		document.addEventListener('touchmove', preventPinch, { passive: false })

		return () => {
			if (previousViewport) viewport?.setAttribute('content', previousViewport)
			window.removeEventListener('wheel', preventWheelZoom)
			window.removeEventListener('keydown', preventKeyZoom)
			document.removeEventListener('gesturestart', preventGesture)
			document.removeEventListener('gesturechange', preventGesture)
			document.removeEventListener('touchmove', preventPinch)
		}
	}, [isAthleticsPage])

	// Initialize chat session ID when chat is first opened
	useEffect(() => {
		if (chatOpen && !chatSessionId) {
			const sessionId = chatService.generateSessionId()
			setChatSessionId(sessionId)
			console.log('🆔 New chat session started:', sessionId)
			analytics.trackChatEvent('chat_opened', { sessionId })
		}
	}, [chatOpen, chatSessionId])

	// Initialize Google Analytics
	useEffect(() => {
		analytics.initialize()
		analytics.trackPageView(window.location.pathname)
	}, [])

	// Track section changes
	useEffect(() => {
		if (active) {
			analytics.trackSectionNavigation(active)
		}
	}, [active])

	// Track time on page
	useEffect(() => {
		const startTime = Date.now()
		return () => {
			const timeSpent = (Date.now() - startTime) / 1000 // Convert to seconds
			analytics.trackTimeOnPage(timeSpent)
		}
	}, [])


	useEffect(() => {
		let lastActiveSection = active
		
		const handler = () => {
			const scrollMiddle = window.scrollY + window.innerHeight / 3
			for (const s of sections) {
				const el = document.getElementById(s.id)
				if (!el) continue
				const { top, height } = el.getBoundingClientRect()
				const y = top + window.scrollY
				if (scrollMiddle >= y && scrollMiddle < y + height) {
					// Trigger subtle glow effect when section changes
					if (lastActiveSection !== s.id) {
						triggerGlowEffect(el)
						lastActiveSection = s.id
					}
					setActive(s.id)
					break
				}
			}
			
			// Calculate scroll progress
			const scrollTop = window.scrollY
			const docHeight = document.documentElement.scrollHeight - window.innerHeight
			const progress = Math.min(scrollTop / docHeight, 1)
			setScrollProgress(progress)
			
			// Update header position based on scroll
			const maxScroll = window.innerHeight * 0.5 // Move down by 50% of viewport height
			const headerOffset = Math.min(scrollTop * 0.3, maxScroll) // Move at 30% of scroll speed
			setHeaderPosition(2 + headerOffset / 16) // Convert px to rem
		}
		window.addEventListener('scroll', handler, { passive: true })
		handler()
		return () => window.removeEventListener('scroll', handler)
	}, [active, colorMode])

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						entry.target.classList.add('in')
						observer.unobserve(entry.target)
					}
				}
			},
			{ threshold: 0.2 }
		)
		for (const s of sections) {
			const el = document.getElementById(s.id)
			if (el) observer.observe(el)
		}
		// Also observe skills section
		const skillsSection = document.getElementById('skills')
		if (skillsSection) observer.observe(skillsSection)
		return () => observer.disconnect()
	}, [])

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			setMousePos({ x: e.clientX, y: e.clientY })
		}
		window.addEventListener('mousemove', handleMouseMove)
		return () => window.removeEventListener('mousemove', handleMouseMove)
	}, [])

	useEffect(() => {
		const videos = document.querySelectorAll('video[data-autoplay-on-visible]')
		if (!videos.length) return
		const obs = new IntersectionObserver((entries) => {
			entries.forEach(e => {
				const v = e.target as HTMLVideoElement
				if (e.isIntersecting) {
					v.muted = true
					const p = v.play()
					if (p !== undefined) p.catch(() => {})
				} else {
					v.pause()
				}
			})
		}, { threshold: 0.3 })
		videos.forEach(v => obs.observe(v))
		return () => obs.disconnect()
	}, [])

	// Elegant Minimalist Techy Cursor 2026
	useEffect(() => {
		const cursorContainer = document.createElement('div')
		cursorContainer.id = 'techy-cursor-container'
		cursorContainer.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			pointer-events: none;
			z-index: 9999;
		`
		document.body.appendChild(cursorContainer)

		// Minimal core dot - larger size
		const cursorDot = document.createElement('div')
		cursorDot.id = 'techy-cursor-dot'
		cursorDot.style.cssText = `
			position: fixed;
			width: 8px;
			height: 8px;
			border-radius: 50%;
			background: ${colorMode ? '#000000' : '#ffffff'};
			transform: translate(-50%, -50%);
			pointer-events: none;
			z-index: 10000;
			transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
		`
		cursorContainer.appendChild(cursorDot)

		// Elegant outer ring - larger and more visible
		const cursorRing = document.createElement('div')
		cursorRing.id = 'techy-cursor-ring'
		cursorRing.style.cssText = `
			position: fixed;
			width: 48px;
			height: 48px;
			border-radius: 50%;
			border: 1.5px solid ${colorMode ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.4)'};
			transform: translate(-50%, -50%);
			pointer-events: none;
			z-index: 9999;
			transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
		`
		cursorContainer.appendChild(cursorRing)

		// Subtle scan line effect - larger
		const scanLine = document.createElement('div')
		scanLine.id = 'techy-scan-line'
		scanLine.style.cssText = `
			position: fixed;
			width: 1.5px;
			height: 32px;
			background: linear-gradient(to bottom, 
				${colorMode ? 'rgba(0, 0, 0, 0)' : 'rgba(255, 255, 255, 0)'}, 
				${colorMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)'}, 
				${colorMode ? 'rgba(0, 0, 0, 0)' : 'rgba(255, 255, 255, 0)'});
			transform: translate(-50%, -50%);
			pointer-events: none;
			z-index: 9998;
			opacity: 0.6;
		`
		cursorContainer.appendChild(scanLine)

		// Minimal particle trail - only 3-5 particles
		const particles: Array<{el: HTMLElement, x: number, y: number, life: number}> = []
		const maxParticles = 4

		let currentX = 0
		let currentY = 0
		let targetX = 0
		let targetY = 0
		let isHovering = false
		let scanAngle = 0

		const handleMouseMove = (e: MouseEvent) => {
			targetX = e.clientX
			targetY = e.clientY
			
			const target = e.target as HTMLElement
			isHovering = target.tagName === 'A' || 
						target.tagName === 'BUTTON' || 
						target.closest('a, button, .button, .card, .nav-item, .project-link, .timeline-point') !== null
		}

		const animate = () => {
			// Smooth easing
			currentX += (targetX - currentX) * 0.18
			currentY += (targetY - currentY) * 0.18

			const ringSize = isHovering ? 72 : 48
			const dotScale = isHovering ? 1.6 : 1
			const ringOpacity = isHovering ? 0.6 : 0.4

			// Update core dot
			cursorDot.style.left = `${currentX}px`
			cursorDot.style.top = `${currentY}px`
			cursorDot.style.transform = `translate(-50%, -50%) scale(${dotScale})`

			// Update ring
			cursorRing.style.left = `${currentX}px`
			cursorRing.style.top = `${currentY}px`
			cursorRing.style.width = `${ringSize}px`
			cursorRing.style.height = `${ringSize}px`
			cursorRing.style.opacity = ringOpacity.toString()
			cursorRing.style.borderColor = isHovering 
				? (colorMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.5)')
				: (colorMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.3)')

			// Update scan line - subtle rotation
			scanAngle += 2
			scanLine.style.left = `${currentX}px`
			scanLine.style.top = `${currentY}px`
			scanLine.style.transform = `translate(-50%, -50%) rotate(${scanAngle}deg)`
			scanLine.style.opacity = isHovering ? '0.7' : '0.5'

			// Create minimal particles - only occasionally
			if (particles.length < maxParticles && Math.random() > 0.85) {
				const particle = document.createElement('div')
				const size = 2.5 + Math.random() * 1.5
				const color = colorMode ? '#000000' : '#ffffff'
				particle.style.cssText = `
					position: fixed;
					width: ${size}px;
					height: ${size}px;
					background: ${color};
					border-radius: 50%;
					left: ${currentX}px;
					top: ${currentY}px;
					transform: translate(-50%, -50%);
					pointer-events: none;
					opacity: 0.7;
					z-index: 9997;
				`
				cursorContainer.appendChild(particle)
				particles.push({
					el: particle,
					x: currentX,
					y: currentY,
					life: 1
				})
			}

			// Update particles - subtle fade
			particles.forEach((p, i) => {
				p.life -= 0.03
				if (p.life <= 0) {
					p.el.remove()
					particles.splice(i, 1)
				} else {
					// Gentle drift
					const offsetX = (currentX - p.x) * 0.15
					const offsetY = (currentY - p.y) * 0.15
					p.x += offsetX
					p.y += offsetY
					p.el.style.left = `${p.x}px`
					p.el.style.top = `${p.y}px`
					p.el.style.opacity = (p.life * 0.6).toString()
					const scale = 0.4 + p.life * 0.6
					p.el.style.transform = `translate(-50%, -50%) scale(${scale})`
				}
			})

			requestAnimationFrame(animate)
		}

		window.addEventListener('mousemove', handleMouseMove)
		animate()
		document.body.style.cursor = 'none'

		return () => {
			window.removeEventListener('mousemove', handleMouseMove)
			cursorContainer.remove()
			document.body.style.cursor = ''
		}
	}, [colorMode])


	const triggerParticleEffect = (x: number, y: number) => {
		// Create subtle floating particles
		const particleContainer = document.createElement('div')
		particleContainer.style.position = 'fixed'
		particleContainer.style.left = `${x}px`
		particleContainer.style.top = `${y}px`
		particleContainer.style.pointerEvents = 'none'
		particleContainer.style.zIndex = '1000'
		document.body.appendChild(particleContainer)

		// Create 8-12 subtle particles
		const particleCount = Math.floor(Math.random() * 5) + 8
		for (let i = 0; i < particleCount; i++) {
			const particle = document.createElement('div')
			const size = Math.random() * 4 + 2 // 2-6px
			const color = colorMode ? '#000000' : '#ffffff'
			const opacity = Math.random() * 0.6 + 0.2 // 0.2-0.8
			
			particle.style.position = 'absolute'
			particle.style.width = `${size}px`
			particle.style.height = `${size}px`
			particle.style.backgroundColor = color
			particle.style.borderRadius = '50%'
			particle.style.opacity = opacity.toString()
			particle.style.left = `${Math.random() * 40 - 20}px`
			particle.style.top = `${Math.random() * 40 - 20}px`
			
			// Animate particle
			const angle = Math.random() * Math.PI * 2
			const distance = Math.random() * 60 + 20
			const duration = Math.random() * 1000 + 1500
			
			particle.animate([
				{ 
					transform: 'translate(0, 0) scale(0)', 
					opacity: opacity 
				},
				{ 
					transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(1)`, 
					opacity: opacity 
				},
				{ 
					transform: `translate(${Math.cos(angle) * distance * 1.5}px, ${Math.sin(angle) * distance * 1.5}px) scale(0)`, 
					opacity: 0 
				}
			], {
				duration: duration,
				easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
			})
			
			particleContainer.appendChild(particle)
		}

		// Remove container after animation
		setTimeout(() => {
			if (particleContainer.parentNode) {
				particleContainer.parentNode.removeChild(particleContainer)
			}
		}, 3000)
	}

	const triggerGlowEffect = (element: HTMLElement) => {
		// Add subtle glow effect to the target section
		const originalBoxShadow = element.style.boxShadow
		const glowColor = colorMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)'
		
		element.style.transition = 'box-shadow 0.6s ease-out'
		element.style.boxShadow = `0 0 30px ${glowColor}, 0 0 60px ${glowColor}`
		
		setTimeout(() => {
			element.style.boxShadow = originalBoxShadow
		}, 1000)
	}

	const scrollTo = (id: string) => {
		const el = document.getElementById(id)
		if (el) {
			setMenuOpen(false)
			el.scrollIntoView({ behavior: 'smooth', block: 'start' })
		}
	}

	const navigateToSection = (id: string) => {
		scrollTo(id)
	}

	const navigateHome = () => {
		if (isAthleticsPage) {
			window.location.href = '/'
		} else {
			scrollTo('about')
		}
	}

	const nextProject = () => {
		setCurrentProjectIndex((prev) => {
			const next = prev + 1
			return next >= projects.length ? 0 : next
		})
		setRotationAngle((prev) => prev - 120)
	}

	const prevProject = () => {
		setCurrentProjectIndex((prev) => {
			const prevIndex = prev - 1
			return prevIndex < 0 ? projects.length - 1 : prevIndex
		})
		setRotationAngle((prev) => prev + 120)
	}

	const nextArticle = () => {
		setCurrentArticleIndex((prev) => {
			const next = prev + 1
			return next >= articles.length ? 0 : next
		})
	}

	const prevArticle = () => {
		setCurrentArticleIndex((prev) => {
			const prevIndex = prev - 1
			return prevIndex < 0 ? articles.length - 1 : prevIndex
		})
	}

	const nextSkill = () => {
		setCurrentSkillIndex((prev) => {
			const next = prev + 1
			return next >= skills.length ? 0 : next
		})
		setSelectedSkill(null)
	}

	const prevSkill = () => {
		setCurrentSkillIndex((prev) => {
			const prevIndex = prev - 1
			return prevIndex < 0 ? skills.length - 1 : prevIndex
		})
		setSelectedSkill(null)
	}

	const selectSkill = (skillId: string) => {
		setSelectedSkill(skillId)
	}

	// Flappy Bird Game Functions
	const jumpBird = useCallback(() => {
		if (!gameStarted && !gameOver) {
			setGameStarted(true)
		}
		if (gameStarted && !gameOver) {
			setBirdVelocity(-8) // Jump up
		}
		if (gameOver) {
			// Reset game
			setGameStarted(false)
			setGameOver(false)
			setBirdPosition(40)
			birdPositionRef.current = 40
			setBirdVelocity(0)
			setCollectedSkillsCount(0)
			collectedSkillsSet.current = new Set()
			lastCountRef.current = 0
			setScrollOffset(0)
			setCurrentSkillIndex(0)
		}
	}, [gameStarted, gameOver])

	// Update refs when state changes
	useEffect(() => {
		birdPositionRef.current = birdPosition
	}, [birdPosition])

	// Sync collected skills count from ref
	useEffect(() => {
		const checkCount = () => {
			const currentCount = collectedSkillsSet.current.size
			if (currentCount !== lastCountRef.current) {
				lastCountRef.current = currentCount
				setCollectedSkillsCount(currentCount)
			}
		}
		
		const interval = setInterval(checkCount, 50) // Check every 50ms
		return () => clearInterval(interval)
	}, [gameStarted])


	// Game loop - gravity and movement
	useEffect(() => {
		if (!gameStarted || gameOver) return

		const gameLoop = setInterval(() => {
			// Apply gravity and update bird
			setBirdVelocity(prev => {
				const newVel = prev + 0.5
				setBirdPosition(prevPos => {
					const newPos = prevPos + (newVel * 0.3)
					const minPos = 5
					const maxPos = 85
					const clampedPos = Math.max(minPos, Math.min(maxPos, newPos))
					
					// Check collision with ground or ceiling
					if (clampedPos >= maxPos || clampedPos <= minPos) {
						setGameOver(true)
					}
					
					birdPositionRef.current = clampedPos
					return clampedPos
				})
				return newVel
			})

			// Auto-scroll pipes and check collisions
			setScrollOffset(prev => {
				const newOffset = prev + 2
				const birdX = 200 // Bird's X position (20% of 1000px = 200px)
				const currentBirdPos = birdPositionRef.current
				
				// Check each pipe for collision/collection
				for (let index = 0; index < skills.length; index++) {
					const skill = skills[index]
					
					// Skip if already collected
					if (collectedSkillsSet.current.has(index)) continue
					
					const pipeX = 400 + (index * 200)
					const pipeScreenX = pipeX - newOffset
					const gapPosition = 15 + (index % 3) * 20
					const gapSize = 70
					
					// Calculate gap boundaries with very generous tolerance
					const gapTop = gapPosition - 15
					const gapBottom = gapPosition + gapSize + 15
					const birdTop = currentBirdPos
					const birdBottom = currentBirdPos + 12
					
					// Collection check: bird is at pipe position AND in gap
					const distanceFromPipe = Math.abs(pipeScreenX - birdX)
					const isAtPipe = distanceFromPipe < 80
					const isInGap = birdTop >= gapTop && birdBottom <= gapBottom
					
					if (isAtPipe && isInGap) {
						// Collect the skill immediately
						if (!collectedSkillsSet.current.has(index)) {
							collectedSkillsSet.current.add(index)
							const newCount = collectedSkillsSet.current.size
							lastCountRef.current = newCount
							console.log(`✅ Collected skill ${index}: ${skill.name}, New count: ${newCount}`)
							// Update state immediately
							setCollectedSkillsCount(newCount)
							setCurrentSkillIndex(index)
							break // Exit loop after collecting
						}
					}
					
					// Collision check: bird passed pipe but wasn't in gap
					if (pipeScreenX < birdX - 70) {
						if (birdTop < gapTop || birdBottom > gapBottom) {
							setGameOver(true)
							break
						}
					}
				}
				
				// Check if reached end flag
				const endFlagX = 400 + (skills.length * 200) + 50
				if (newOffset + birdX >= endFlagX - 50) {
					if (collectedSkillsSet.current.size === skills.length) {
						setGameOver(true)
					}
				}
				
				return newOffset
			})
		}, 16) // ~60fps

		return () => clearInterval(gameLoop)
	}, [gameStarted, gameOver, skills])

	// Keyboard controls
	useEffect(() => {
		const handleKeyPress = (e: KeyboardEvent) => {
			// Don't prevent spacebar if user is typing in an input, textarea, or contenteditable element
			const target = e.target as HTMLElement
			const isTyping = target.tagName === 'INPUT' || 
			                 target.tagName === 'TEXTAREA' || 
			                 target.isContentEditable
			
			if ((e.code === 'Space' || e.key === ' ') && !isTyping) {
				e.preventDefault()
				jumpBird()
			}
		}

		window.addEventListener('keydown', handleKeyPress)
		return () => window.removeEventListener('keydown', handleKeyPress)
	}, [jumpBird])

	const sendMessage = async () => {
		if (!currentMessage.trim() || isLoading) return

		const userMessage = { role: 'user', content: currentMessage }
		const newMessages = [...chatMessages, userMessage]
		setChatMessages(newMessages)
		setCurrentMessage('')
		setIsLoading(true)
		
		// Auto-scroll to bottom after a short delay
		setTimeout(() => {
			const messagesContainer = document.querySelector('.chat-messages')
			if (messagesContainer) {
				messagesContainer.scrollTop = messagesContainer.scrollHeight
			}
		}, 100)

		// Track chat message sent
		analytics.trackChatEvent('message_sent', { 
			messageLength: currentMessage.length,
			sessionId: chatSessionId 
		})

		// Save user message to Firebase (non-blocking)
		chatService.saveMessage({
			role: 'user',
			content: currentMessage,
			sessionId: chatSessionId
		}).then(() => {
			console.log('💾 User message saved to Firebase')
		}).catch((error) => {
			console.error('❌ Error saving user message to Firebase:', error)
		})

		try {
			// Always use Netlify Function - API key is NEVER exposed to client
			const functionUrl = '/.netlify/functions/chat'
			
			const response = await fetch(functionUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					model: 'gpt-3.5-turbo',
					messages: [
						{
							role: 'system',
							content: CHAT_SYSTEM_PROMPT
						},
						...newMessages
					],
					max_tokens: 200,
					temperature: 0.4
				})
			})

			// Check if response has content before parsing JSON
			const responseText = await response.text()
			if (!responseText) {
				throw new Error('Empty response from function. Make sure you\'re running with "netlify dev" or the function is deployed.')
			}
			
			let data: any
			try {
				data = JSON.parse(responseText)
			} catch (parseError) {
				throw new Error(`Invalid response from function`)
			}
			
			if (!response.ok) {
				// Try to extract a more helpful error message
				const errorMsg = data?.message || data?.error?.message || data?.error || `HTTP ${response.status}: Unknown error`
				throw new Error(errorMsg)
			}
			
			if (data.choices && data.choices[0]) {
				const aiMessage = { role: 'assistant', content: data.choices[0].message.content }
				const finalMessages = [...newMessages, aiMessage]
				setChatMessages(finalMessages)
				
				// Track AI response received
				analytics.trackChatEvent('ai_response_received', {
					responseLength: data.choices[0].message.content.length,
					sessionId: chatSessionId
				})

				// Save AI response to Firebase (non-blocking)
				chatService.saveMessage({
					role: 'assistant',
					content: data.choices[0].message.content,
					sessionId: chatSessionId
				}).then(() => {
					console.log('💾 AI response saved to Firebase')
				}).catch((error) => {
					console.error('❌ Error saving AI response to Firebase:', error)
				})
				
				// Auto-scroll to bottom when AI responds
				setTimeout(() => {
					const messagesContainer = document.querySelector('.chat-messages')
					if (messagesContainer) {
						messagesContainer.scrollTop = messagesContainer.scrollHeight
					}
				}, 100)
			} else {
				throw new Error('No response from AI')
			}
		} catch (error) {
			console.error('❌ Error sending message:', error)
			const errorMessage = { 
				role: 'assistant', 
				content: `Sorry, I'm having trouble connecting right now. Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
			}
			const finalMessages = [...newMessages, errorMessage]
			setChatMessages(finalMessages)
			
			// Save error message to Firebase (non-blocking)
			chatService.saveMessage({
				role: 'assistant',
				content: errorMessage.content,
				sessionId: chatSessionId
			}).then(() => {
				console.log('💾 Error message saved to Firebase')
			}).catch((firebaseError) => {
				console.error('❌ Error saving error message to Firebase:', firebaseError)
			})
		} finally {
			setIsLoading(false)
		}
	}

	// Check if admin mode is requested
	const urlParams = new URLSearchParams(window.location.search)
	const isAdminMode = urlParams.get('admin') === 'true'

	// If admin mode, show admin page
	if (isAdminMode) {
		return <AdminPage />
	}

	return (
		<div className={`app ${colorMode ? 'color-mode' : ''}${isAthleticsPage ? ' athletics-page' : ''}`}>
			{!isAthleticsPage && !showIntro && createPortal(
				<>
					<div className="page-edge-line-wrap top" aria-hidden="true">
						<div className="page-edge-line" />
					</div>
					<div className="page-edge-line-wrap bottom" aria-hidden="true">
						<div className="page-edge-line" />
					</div>
				</>,
				document.body
			)}

			{showIntro && !isAthleticsPage && (
				<div className="intro-overlay">
					<img 
						src={introGifSrc.current}
						alt="Signature animation" 
						className="intro-signature" 
						onError={() => setShowIntro(false)}
					/>
				</div>
			)}
			
			{isAthleticsPage ? (
				<AthleticsHomeButton />
			) : (
			<nav className="left-nav">
				{/* Logo */}
				<button 
					className="nav-logo" 
					onClick={navigateHome}
					aria-label="Home"
				>
					m
				</button>
				
				{/* Divider */}
				<div className="nav-divider"></div>
				
				{/* Section Navigation */}
				{sections.map(section => {
					const IconComponent = section.icon
					return (
						<button
							key={section.id}
							className={`nav-item ${active === section.id ? 'active' : ''}`}
							onClick={() => navigateToSection(section.id)}
							aria-label={section.label}
						>
							<IconComponent size={20} />
						</button>
					)
				})}
				
				{/* Divider */}
				<div className="nav-divider"></div>
				
				{/* Theme Toggle */}
				<button 
					className="nav-theme-toggle" 
					onClick={() => {
						analytics.trackEvent('theme_toggle', {
							event_category: 'ui',
							event_label: colorMode ? 'light_mode' : 'dark_mode'
						})
						setColorMode(!colorMode)
					}}
					aria-label="Toggle theme"
				>
					{colorMode ? <Sun size={20} /> : <Moon size={20} />}
				</button>
			</nav>
			)}

			
			<style>{`
				* {
					margin: 0;
					padding: 0;
					box-sizing: border-box;
				}
				
				html {
					transform: none;
					transform-origin: center center;
				}
				
				body {
					font-family: Arial, sans-serif;
					line-height: 1.6;
					color: #ffffff;
					background-color: #000000;
					overflow-x: hidden;
					transition: color 0.5s ease, background-color 0.5s ease;
					margin: 0;
					padding: 0;
					text-align: left;
				}

				/* Elegant Minimalist Techy Cursor 2026 */
				#techy-cursor-container {
					position: fixed;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					pointer-events: none;
					z-index: 9999;
				}

				#techy-cursor-dot {
					position: fixed;
					width: 8px;
					height: 8px;
					border-radius: 50%;
					background: #ffffff;
					transform: translate(-50%, -50%);
					pointer-events: none;
					z-index: 10000;
					transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
				}

				.app.color-mode #techy-cursor-dot {
					background: #000000;
				}

				#techy-cursor-ring {
					position: fixed;
					width: 48px;
					height: 48px;
					border-radius: 50%;
					border: 1.5px solid rgba(255, 255, 255, 0.4);
					transform: translate(-50%, -50%);
					pointer-events: none;
					z-index: 9999;
					transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
				}

				.app.color-mode #techy-cursor-ring {
					border-color: rgba(0, 0, 0, 0.25);
				}

				#techy-scan-line {
					position: fixed;
					width: 1.5px;
					height: 32px;
					background: linear-gradient(to bottom, 
						rgba(255, 255, 255, 0), 
						rgba(255, 255, 255, 0.5), 
						rgba(255, 255, 255, 0));
					transform: translate(-50%, -50%);
					pointer-events: none;
					z-index: 9998;
					opacity: 0.6;
					transition: opacity 0.3s ease;
				}

				.app.color-mode #techy-scan-line {
					background: linear-gradient(to bottom, 
						rgba(0, 0, 0, 0), 
						rgba(0, 0, 0, 0.5), 
						rgba(0, 0, 0, 0));
				}

				/* Hide cursor on touch devices */
				@media (hover: none) and (pointer: coarse) {
					#techy-cursor-container {
						display: none;
					}
					body {
						cursor: auto !important;
					}
				}

				.scroll-progress {
					position: fixed;
					top: 0;
					left: 0;
					width: 100%;
					height: 3px;
					background: rgba(255, 255, 255, 0.1);
					z-index: 9999;
					transition: opacity 0.3s ease;
				}

				.scroll-progress-bar {
					height: 100%;
					background: linear-gradient(90deg, #ec4899, #3b82f6, #10b981);
					width: 0%;
					transition: width 0.1s ease-out;
					box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
				}

				.app.color-mode .scroll-progress {
					background: rgba(0, 0, 0, 0.1);
				}

				.app.color-mode .scroll-progress-bar {
					background: linear-gradient(90deg, #ec4899, #3b82f6, #10b981);
					box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
				}
				
				.app::after {
					content: '';
					position: fixed;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					background-image: 
						linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
						linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
						radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
						radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
					background-size: 
						80px 80px,
						80px 80px,
						300px 300px,
						300px 300px;
					background-position: 
						0 0,
						0 0,
						0 0,
						150px 150px;
					z-index: 2;
					pointer-events: none;
				}
				
				/* Intro Animation Overlay */
				.intro-overlay {
					position: fixed;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					background-color: #000000;
					z-index: 10000;
					display: flex;
					align-items: center;
					justify-content: center;
					opacity: 1;
					pointer-events: none;
					animation: fadeOut 0.5s ease-out 5.5s forwards;
				}
				
				@keyframes fadeOut {
					0% {
						opacity: 1;
					}
					100% {
						opacity: 0;
						pointer-events: none;
					}
				}
				
				.intro-signature {
					max-width: 80%;
					max-height: 80vh;
					width: auto;
					height: auto;
					object-fit: contain;
					opacity: 1;
					animation: signatureShow 5.5s ease-in-out forwards;
				}
				
				@keyframes signatureShow {
					0% {
						opacity: 0;
						transform: scale(0.9);
					}
					5% {
						opacity: 1;
						transform: scale(1);
					}
					95% {
						opacity: 1;
						transform: scale(1);
					}
					100% {
						opacity: 0;
						transform: scale(0.95);
					}
				}
				
				@font-face {
					font-family: 'Organical';
					src: url('/ORGANICAL PERSONAL USE.ttf') format('truetype');
					font-weight: normal;
					font-style: normal;
					font-display: swap;
				}

				@font-face {
					font-family: 'OrangeAvenue';
					src: url('/OrangeAvenueDEMO-Regular.otf') format('opentype');
					font-weight: normal;
					font-style: normal;
					font-display: swap;
				}

				@font-face {
					font-family: 'Dumbledor';
					src: url('/Dumbledor-Regular.ttf') format('truetype');
					font-weight: normal;
					font-style: normal;
					font-display: swap;
				}
				
				.app {
					min-height: 100vh;
					transition: background-color 0.5s ease;
					position: relative;
					transform: none;
					transform-origin: center center;
				}
				
				.app::before {
					display: none;
				}
				
				
				
				/* White mode styles */
				.app.color-mode {
					background-color: #ffffff;
					color: #000000;
				}
				
				.app.color-mode::after {
					background-image: 
						linear-gradient(rgba(0, 0, 0, 0.08) 1px, transparent 1px),
						linear-gradient(90deg, rgba(0, 0, 0, 0.08) 1px, transparent 1px),
						radial-gradient(circle at 25% 25%, rgba(0, 0, 0, 0.05) 0%, transparent 50%),
						radial-gradient(circle at 75% 75%, rgba(0, 0, 0, 0.05) 0%, transparent 50%);
				}
				
				.app.color-mode::before {
					display: none;
				}
				
				.app.color-mode * {
					color: #000000;
					border-color: #000000;
				}
				
				
				
				.app.color-mode .signature-img {
					filter: invert(0) brightness(0.5) contrast(1);
				}
				
				.app.color-mode .color-toggle {
					background: #ffffff;
					border-color: #000000;
					color: #000000;
				}
				
				.app.color-mode .color-toggle:hover {
					background: rgba(0, 0, 0, 0.1);
					border-color: #000000;
					color: #000000;
				}
				
				
				.app.color-mode .button {
					background: #ffffff;
					border-color: #000000;
					color: #000000;
				}
				
				.app.color-mode .button:hover {
					background: #000000;
					color: #ffffff;
				}
				
				.app.color-mode .button.primary {
					background: #000000;
					color: #ffffff;
					border-color: #000000;
				}
				
				.app.color-mode .button.primary:hover {
					background: #ffffff;
					color: #000000;
				}
				
				.app.color-mode .coin-front,
				.app.color-mode .coin-back {
					border-color: #000000;
					box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
					background: transparent;
				}
				
				.app.color-mode .photo-wrap {
					animation: portraitGlowLight 4s ease-in-out infinite alternate;
					box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
				}
				
				.app.color-mode .coin-front {
					animation: portraitGlowLight 4s ease-in-out infinite alternate;
				}
				
				.app.color-mode .resume-item,
				.app.color-mode .card,
				.app.color-mode .skills li,
				.app.color-mode .video-card,
				.app.color-mode .tag {
					background: #ffffff;
					border-color: #000000;
				}
				
				.app.color-mode .card:hover {
					background: #ffffff;
					box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
				}
				
				.app.color-mode .skills li:hover {
					background: #ffffff;
					box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
				}
				
				.app.color-mode .tone-sep {
					border-top-color: #000000;
					box-shadow: 0 0 20px rgba(0, 0, 0, 0.3), 0 0 40px rgba(0, 0, 0, 0.2);
				}
				
				.app.color-mode .site-footer {
					border-top-color: #000000;
				}
				
				.app.color-mode .section {
					background: transparent;
				}
				
				.app.color-mode .alt {
					background: transparent;
				}
				
				.container {
					max-width: 1200px;
					margin: 0 auto;
					padding: 0 2rem;
					transform: none;
					transform-origin: center center;
				}
				
				
				/* Ice-light-blue animated top page line */
				@keyframes ice-line-flow {
					0%, 100% {
						background-position: 0% 50%;
						opacity: 0.82;
					}
					50% {
						background-position: 100% 50%;
						opacity: 1;
					}
				}

				.page-edge-line-wrap {
					position: fixed;
					left: 0;
					right: 0;
					height: 3px;
					overflow: hidden;
					z-index: 9998;
					pointer-events: none;
				}

				.page-edge-line-wrap.top {
					top: 0;
				}

				.page-edge-line-wrap.bottom {
					bottom: 0;
				}

				.page-edge-line {
					width: 100%;
					height: 3px;
					background: linear-gradient(
						90deg,
						rgba(14, 165, 233, 0.35) 0%,
						rgba(56, 189, 248, 0.55) 18%,
						rgba(125, 211, 252, 0.72) 36%,
						rgba(56, 189, 248, 0.85) 50%,
						rgba(125, 211, 252, 0.72) 64%,
						rgba(56, 189, 248, 0.55) 82%,
						rgba(14, 165, 233, 0.35) 100%
					);
					background-size: 200% 100%;
					animation: ice-line-flow 16s ease-in-out infinite;
					box-shadow:
						inset 0 -1px 0 rgba(14, 165, 233, 0.5),
						inset 0 1px 0 rgba(125, 211, 252, 0.35);
				}

				.title {
					animation: fadeInUp 0.8s ease-out;
				}

				/* Left Side Navigation */
				.left-nav {
					position: fixed;
					left: 2rem;
					top: 50%;
					transform: translateY(-50%);
					z-index: 1000;
					display: flex;
					flex-direction: column;
					gap: 0.5rem;
					background: rgba(255, 255, 255, 0.05);
					backdrop-filter: blur(20px);
					-webkit-backdrop-filter: blur(20px);
					border: 1px solid rgba(255, 255, 255, 0.1);
					border-radius: 25px;
					padding: 1rem 0.5rem;
					box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
				}
				
				.nav-logo {
					background: transparent;
					border: none;
					color: rgba(255, 255, 255, 0.9);
					padding: 0.75rem;
					border-radius: 50%;
					cursor: pointer;
					transition: all 0.3s ease;
					width: 50px;
					height: 50px;
					display: flex;
					align-items: center;
					justify-content: center;
					font-family: 'Organical', sans-serif;
					font-size: 1.5rem;
					font-weight: bold;
					margin-bottom: 0.5rem;
					-webkit-text-stroke: 0.3px rgba(186, 230, 253, 0.25);
					paint-order: stroke fill;
					text-shadow: 0 0 6px rgba(125, 211, 252, 0.12);
				}
				
				.nav-logo:hover {
					color: #ffffff;
					background: rgba(255, 255, 255, 0.1);
					transform: scale(1.1);
				}
				
				.nav-divider {
					width: 30px;
					height: 1px;
					background: rgba(255, 255, 255, 0.2);
					margin: 0.5rem auto;
				}
				
				.nav-theme-toggle {
					background: transparent;
					border: none;
					color: rgba(255, 255, 255, 0.7);
					padding: 0.75rem;
					border-radius: 50%;
					cursor: pointer;
					transition: all 0.3s ease;
					width: 50px;
					height: 50px;
					display: flex;
					align-items: center;
					justify-content: center;
					margin-top: 0.5rem;
				}
				
				.nav-theme-toggle:hover {
					color: #ffffff;
					background: rgba(255, 255, 255, 0.1);
					transform: scale(1.1);
				}
				
				.nav-item {
					background: transparent;
					border: none;
					color: rgba(255, 255, 255, 0.7);
					padding: 0.75rem;
					border-radius: 50%;
					cursor: pointer;
					transition: all 0.3s ease;
					width: 50px;
					height: 50px;
					display: flex;
					align-items: center;
					justify-content: center;
					position: relative;
				}
				
				.nav-item:hover {
					color: #ffffff;
					background: rgba(255, 255, 255, 0.1);
					transform: scale(1.1);
				}
				
				.nav-item.active {
					color: #ffffff;
					background: rgba(255, 255, 255, 0.15);
					box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
				}
				
				.nav-item.active::after {
					content: '';
					position: absolute;
					left: -8px;
					top: 50%;
					transform: translateY(-50%);
					width: 3px;
					height: 20px;
					background: #ffffff;
					border-radius: 2px;
				}

				/* Color toggle button - Fixed position */
				.color-toggle {
					position: fixed;
					right: 2rem;
					top: 2rem;
					background: none;
					border: 1px solid #ffffff;
					color: #ffffff;
					padding: 0.5rem;
					border-radius: 50%;
					cursor: pointer;
					font-size: 1.25rem;
					transition: all 0.3s;
					z-index: 1000;
					width: 40px;
					height: 40px;
					display: flex;
					align-items: center;
					justify-content: center;
				}
				
				.color-toggle:hover {
					background: rgba(255, 255, 255, 0.1);
				}
				
				.app.color-mode .color-toggle {
					border-color: #000000;
					color: #000000;
				}
				
				.app.color-mode .color-toggle:hover {
					background: rgba(0, 0, 0, 0.1);
				}
				
				.app.color-mode .left-nav {
					background: rgba(255, 255, 255, 0.1);
					border-color: rgba(0, 0, 0, 0.1);
				}
				
				.app.color-mode .nav-item {
					color: rgba(0, 0, 0, 0.7);
				}
				
				.app.color-mode .nav-item:hover {
					color: #000000;
					background: rgba(0, 0, 0, 0.1);
				}
				
				.app.color-mode .nav-item.active {
					color: #000000;
					background: rgba(0, 0, 0, 0.15);
					box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
				}
				
				.app.color-mode .nav-item.active::after {
					background: #000000;
				}
				
				.app.color-mode .nav-logo {
					color: rgba(0, 0, 0, 0.9);
				}
				
				.app.color-mode .nav-logo:hover {
					color: #000000;
					background: rgba(0, 0, 0, 0.1);
				}
				
				.app.color-mode .nav-divider {
					background: rgba(0, 0, 0, 0.2);
				}
				
				.app.color-mode .nav-theme-toggle {
					color: rgba(0, 0, 0, 0.7);
				}
				
				.app.color-mode .nav-theme-toggle:hover {
					color: #000000;
					background: rgba(0, 0, 0, 0.1);
				}
				
				/* Enhanced Hero Section */
				.hero {
					min-height: auto;
					display: flex;
					align-items: center;
					padding-top: 6rem;
					padding-bottom: 4rem;
					position: relative;
					overflow: visible;
				}
				
				.hero::before {
					display: none;
				}
				
				@keyframes gradientShift {
					0%, 100% { transform: translate(0, 0) rotate(0deg); }
					33% { transform: translate(5%, -5%) rotate(120deg); }
					66% { transform: translate(-5%, 5%) rotate(240deg); }
				}
				
				.hero-wrap {
					position: relative;
					z-index: 1;
					display: grid;
					grid-template-columns: 1fr 1fr;
					gap: 4rem;
					align-items: center;
					justify-items: stretch;
					width: 100%;
				}
				
				.hero-wrap,
				.section,
				.main,
				.container {
					position: relative;
					z-index: 10;
					transform: none;
					transform-origin: center center;
				}
				
				.title {
					font-family: 'Pacifico', cursive;
					font-size: clamp(2.5rem, 5vw, 4rem);
					font-weight: normal;
					line-height: 1.1;
					margin-bottom: 1.5rem;
					color: #ffffff;
					letter-spacing: 0.02em;
					min-height: 1.2em;
				}
				
				
				
				@keyframes fadeInUp {
					from {
						opacity: 0;
						transform: translateY(30px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}
				
				.subtitle {
					font-family: Arial, sans-serif;
					font-size: 1.25rem;
					color: #ffffff;
					margin-bottom: 2.5rem;
					line-height: 1.7;
					animation: fadeInUp 0.8s ease-out 0.2s backwards;
					letter-spacing: 0.02em;
					text-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
				}
				
				
				.cta-row {
					display: flex;
					gap: 1rem;
					flex-wrap: wrap;
					animation: fadeInUp 0.8s ease-out 0.4s backwards;
				}
				
				.button {
					padding: 0.875rem 2rem;
					border: 2px solid #ffffff;
					background: #000000;
					color: #ffffff;
					font-weight: 600;
					font-size: 1rem;
					cursor: pointer;
					border-radius: 12px;
					transition: all 0.3s;
					text-decoration: none;
					display: inline-block;
				}
				
				.button:hover {
					background: #ffffff;
					color: #000000;
					transform: translateY(-2px);
				}
				
				.button.primary {
					background: #ffffff;
					border: 2px solid #ffffff;
					color: #000000;
				}
				
				.button.primary:hover {
					background: #000000;
					color: #ffffff;
					transform: translateY(-2px);
				}
				
				/* Enhanced Hero Visual */
				.hero-visual {
					position: relative;
					height: 600px;
					display: flex;
					align-items: center;
					justify-content: center;
					animation: fadeIn 1s ease-out 0.6s backwards;
					padding: 2rem;
					text-align: center;
				}
				
				@keyframes fadeIn {
					from { opacity: 0; }
					to { opacity: 1; }
				}
				
				.photo-wrap {
					background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.02) 0%, transparent 50%),
								radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.01) 0%, transparent 50%);
					position: relative;
					z-index: 3;
					width: 480px;
					height: 480px;
					border-radius: 50%;
					perspective: 1000px;
					cursor: pointer;
					animation: portraitGlowStatic 4s ease-in-out infinite alternate;
					margin: 0 auto;
					transform: none;
					transform-origin: center center;
					transition: transform 0.3s ease;
				}
				
				.photo-wrap:hover {
					transform: scale(1.02);
				}
				
				/* Minimal tech ring on hero circle */
				.photo-wrap::before {
					content: '';
					position: absolute;
					inset: -3px;
					border-radius: 50%;
					padding: 3px;
					background: linear-gradient(
						0deg,
						transparent 0%,
						transparent 45%,
						rgba(255, 255, 255, 0.8) 47.5%,
						rgba(255, 255, 255, 1) 50%,
						rgba(255, 255, 255, 0.8) 52.5%,
						transparent 55%,
						transparent 100%
					);
					-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
					-webkit-mask-composite: xor;
					mask-composite: exclude;
					animation: techLineRotate 4s linear infinite;
					z-index: -1;
					pointer-events: none;
				}

				.app.color-mode .photo-wrap::before {
					background: linear-gradient(
						0deg,
						transparent 0%,
						transparent 45%,
						rgba(0, 0, 0, 0.8) 47.5%,
						rgba(0, 0, 0, 1) 50%,
						rgba(0, 0, 0, 0.8) 52.5%,
						transparent 55%,
						transparent 100%
					);
				}

				@keyframes techLineRotate {
					0% { transform: rotate(0deg); }
					100% { transform: rotate(360deg); }
				}
				
				@keyframes portraitGlowStatic {
					0% {
						box-shadow: 
							0 0 30px rgba(255, 255, 255, 0.1),
							0 0 60px rgba(255, 255, 255, 0.05),
							0 0 90px rgba(255, 255, 255, 0.03);
					}
					100% {
						box-shadow: 
							0 0 40px rgba(255, 255, 255, 0.15),
							0 0 80px rgba(255, 255, 255, 0.08),
							0 0 120px rgba(255, 255, 255, 0.05);
					}
				}
				
				.coin-inner {
					position: relative;
					width: 100%;
					height: 100%;
					transition: transform 0.8s;
					transform-style: preserve-3d;
					transform: rotateY(0deg);
				}
				
				.photo-wrap.chat-open .coin-inner {
					transform: rotateY(180deg);
				}
				
				.photo-wrap.photo-hovered:not(.chat-open) .coin-inner {
					transform: rotateY(180deg);
				}
				
				.coin-front,
				.coin-back {
					position: absolute;
					width: 100%;
					height: 100%;
					border-radius: 50%;
					-webkit-backface-visibility: hidden;
					backface-visibility: hidden;
					border: 2px solid rgba(255, 255, 255, 0.3);
					overflow: hidden;
					transform: rotateY(0deg);
				}
				
				.app.color-mode .coin-front,
				.app.color-mode .coin-back {
					border: 2px solid rgba(0, 0, 0, 0.3);
				}
				
				.coin-front {
					background: transparent;
					-webkit-backface-visibility: hidden;
					backface-visibility: hidden;
				}
				
				@keyframes portraitGlow {
					0% {
						box-shadow: 
							0 20px 60px rgba(255, 255, 255, 0.1),
							0 0 20px rgba(255, 255, 255, 0.3),
							0 0 40px rgba(255, 255, 255, 0.2),
							0 0 60px rgba(255, 255, 255, 0.1),
							0 0 80px rgba(255, 255, 255, 0.05);
					}
					100% {
						box-shadow: 
							0 20px 60px rgba(255, 255, 255, 0.15),
							0 0 30px rgba(255, 255, 255, 0.4),
							0 0 60px rgba(255, 255, 255, 0.3),
							0 0 90px rgba(255, 255, 255, 0.2),
							0 0 120px rgba(255, 255, 255, 0.1);
					}
				}
				
				@keyframes portraitGlowLight {
					0% {
						box-shadow: 
							0 20px 60px rgba(0, 0, 0, 0.1),
							0 0 20px rgba(0, 0, 0, 0.2),
							0 0 40px rgba(0, 0, 0, 0.1),
							0 0 60px rgba(0, 0, 0, 0.05);
					}
					100% {
						box-shadow: 
							0 20px 60px rgba(0, 0, 0, 0.15),
							0 0 30px rgba(0, 0, 0, 0.3),
							0 0 60px rgba(0, 0, 0, 0.15),
							0 0 90px rgba(0, 0, 0, 0.08);
					}
				}
				
				
				
				.coin-back {
					background: transparent;
					transform: rotateY(180deg);
					display: flex;
					align-items: center;
					justify-content: center;
					padding: 2.5rem;
				}
				
				.coin-back-content {
					text-align: center;
					color: #ffffff;
					width: 100%;
					max-width: 100%;
				}
				
				.coin-back-content h3 {
					font-size: 1.5rem;
					margin: 0 0 1rem 0;
					font-weight: 700;
					text-align: center;
				}
				
				.coin-back-content p {
					font-size: 1rem;
					line-height: 1.6;
					margin: 0;
					text-align: center;
				}
				
				.hero-photo {
					width: 100%;
					height: 100%;
					object-fit: contain;
					object-position: center center;
					background: transparent;
					transform: none;
					transform-origin: center center;
					opacity: 0;
					animation: fadeInImage 0.5s ease-in 0.1s forwards;
				}
				
				@keyframes fadeInImage {
					from {
						opacity: 0;
					}
					to {
						opacity: 1;
					}
				}

				.message-icon-overlay {
					position: absolute;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
					width: 60px;
					height: 60px;
					background: rgba(255, 255, 255, 0.9);
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					color: #000000;
					box-shadow: 
						0 8px 25px rgba(0, 0, 0, 0.3),
						0 0 0 3px rgba(255, 255, 255, 0.8);
					backdrop-filter: blur(10px);
					transition: all 0.3s ease;
					z-index: 10;
					animation: messageIconFloat 3s ease-in-out infinite;
				}

				.message-icon-overlay:hover {
					transform: translate(-50%, -50%) scale(1.1);
					box-shadow: 
						0 12px 35px rgba(0, 0, 0, 0.4),
						0 0 0 4px rgba(255, 255, 255, 0.9);
				}

				@keyframes messageIconFloat {
					0%, 100% {
						transform: translate(-50%, -50%) translateY(0px);
					}
					50% {
						transform: translate(-50%, -50%) translateY(-5px);
					}
				}

				.app.color-mode .message-icon-overlay {
					background: rgba(0, 0, 0, 0.9);
					color: #ffffff;
					box-shadow: 
						0 8px 25px rgba(0, 0, 0, 0.3),
						0 0 0 3px rgba(0, 0, 0, 0.8);
				}

				.app.color-mode .message-icon-overlay:hover {
					box-shadow: 
						0 12px 35px rgba(0, 0, 0, 0.4),
						0 0 0 4px rgba(0, 0, 0, 0.9);
				}
				
				.orbit { display: none !important; }
				
				
				/* Chat Bubble Styles */
				.chat-bubble-container {
					position: absolute;
					top: -80px;
					left: 50%;
					transform: translateX(-50%);
					z-index: 100;
				}
				
				.chat-bubble {
					position: relative;
					width: 300px;
					height: 300px;
					background: rgba(0, 0, 0, 0.95);
					border: 2px solid #ffffff;
					border-radius: 50%;
					backdrop-filter: blur(10px);
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					box-shadow: 0 20px 60px rgba(255, 255, 255, 0.2);
					animation: bubbleFloat 3s ease-in-out infinite;
				}
				
				@keyframes bubbleFloat {
					0%, 100% { transform: translateY(0px); }
					50% { transform: translateY(-10px); }
				}
				
				.chat-bubble::before {
					content: '';
					position: absolute;
					bottom: -15px;
					left: 50%;
					transform: translateX(-50%);
					width: 0;
					height: 0;
					border-left: 15px solid transparent;
					border-right: 15px solid transparent;
					border-top: 15px solid #ffffff;
				}
				
				.chat-bubble::after {
					content: '';
					position: absolute;
					bottom: -12px;
					left: 50%;
					transform: translateX(-50%);
					width: 0;
					height: 0;
					border-left: 12px solid transparent;
					border-right: 12px solid transparent;
					border-top: 12px solid rgba(0, 0, 0, 0.95);
				}
				
				.chat-toggle {
					position: absolute;
					top: 20px;
					right: -180px;
					background: rgba(0, 0, 0, 0.9);
					border: 2px solid #ffffff;
					color: #ffffff;
					padding: 0.75rem;
					border-radius: 50%;
					cursor: pointer;
					transition: all 0.3s;
					z-index: 101;
					width: 50px;
					height: 50px;
					display: flex;
					align-items: center;
					justify-content: center;
					box-shadow: 0 4px 20px rgba(255, 255, 255, 0.4);
					animation: heartbeat 2s ease-in-out infinite;
				}
				
				@keyframes heartbeat {
					0% {
						transform: scale(1);
						box-shadow: 0 4px 20px rgba(255, 255, 255, 0.4);
					}
					14% {
						transform: scale(1.1);
						box-shadow: 0 6px 25px rgba(255, 255, 255, 0.6);
					}
					28% {
						transform: scale(1);
						box-shadow: 0 4px 20px rgba(255, 255, 255, 0.4);
					}
					42% {
						transform: scale(1.1);
						box-shadow: 0 6px 25px rgba(255, 255, 255, 0.6);
					}
					70% {
						transform: scale(1);
						box-shadow: 0 4px 20px rgba(255, 255, 255, 0.4);
					}
					100% {
						transform: scale(1);
						box-shadow: 0 4px 20px rgba(255, 255, 255, 0.4);
					}
				}
				
				.chat-toggle:hover {
					background: rgba(255, 255, 255, 0.1);
					animation: none;
					transform: scale(1.2);
					box-shadow: 0 8px 30px rgba(255, 255, 255, 0.8);
				}
				
				.chat-toggle-text {
					position: absolute;
					top: 30px;
					right: -280px;
					background: rgba(0, 0, 0, 0.8);
					color: #ffffff;
					padding: 0.3rem 0.6rem;
					border-radius: 8px;
					font-size: 0.7rem;
					white-space: nowrap;
					border: 1px solid rgba(255, 255, 255, 0.3);
					box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
					z-index: 102;
					pointer-events: none;
					opacity: 1;
				}
				
				.chat-notification {
					position: absolute;
					top: -5px;
					right: -5px;
					background: #ff4444;
					color: #ffffff;
					border-radius: 50%;
					width: 20px;
					height: 20px;
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 0.7rem;
					font-weight: bold;
					border: 2px solid #ffffff;
					box-shadow: 0 2px 8px rgba(255, 68, 68, 0.4);
					z-index: 103;
					animation: pulse 2s ease-in-out infinite;
				}
				
				@keyframes pulse {
					0% {
						transform: scale(1);
						box-shadow: 0 2px 8px rgba(255, 68, 68, 0.4);
					}
					50% {
						transform: scale(1.1);
						box-shadow: 0 4px 12px rgba(255, 68, 68, 0.6);
					}
					100% {
						transform: scale(1);
						box-shadow: 0 2px 8px rgba(255, 68, 68, 0.4);
					}
				}
				
				/* Chat Bubble Container - Updated for new positioning */
				.chat-bubble-container {
					position: absolute;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					z-index: 100;
					pointer-events: none;
				}
				
				.chat-bubble-container > * {
					pointer-events: all;
				}
				
				/* Thinking Bubbles */
				.thinking-bubbles {
					position: absolute;
					top: 60px;
					right: -142px;
					z-index: 100;
				}
				
				.bubble {
					position: absolute;
					background: rgba(255, 255, 255, 0.9);
					border-radius: 50%;
					animation: bubbleFloat 2s ease-in-out infinite, bubblePulse 3s ease-in-out infinite;
					box-shadow: 0 2px 8px rgba(255, 255, 255, 0.3);
					border: 1px solid rgba(255, 255, 255, 0.4);
				}
				
				@keyframes bubblePulse {
					0%, 100% {
						box-shadow: 0 2px 8px rgba(255, 255, 255, 0.3);
					}
					50% {
						box-shadow: 0 4px 12px rgba(255, 255, 255, 0.5);
					}
				}
				
				.bubble-1 {
					width: 8px;
					height: 8px;
					top: 10;
					left: 0;
					animation-delay: 0s;
				}
				
				.bubble-2 {
					width: 7px;
					height: 7px;
					top: 12px;
					left: -8px;
					animation-delay: 0.2s;
				}
				
				.bubble-3 {
					width: 6px;
					height: 6px;
					top: 24px;
					left: -16px;
					animation-delay: 0.4s;
				}
				
				.bubble-4 {
					width: 5px;
					height: 5px;
					top: 36px;
					left: -24px;
					animation-delay: 0.6s;
				}
				
				.bubble-5 {
					width: 4px;
					height: 4px;
					top: 48px;
					left: -32px;
					animation-delay: 0.8s;
				}
				
				.bubble-6 {
					width: 3px;
					height: 3px;
					top: 60px;
					left: -40px;
					animation-delay: 1s;
				}
				
				@keyframes bubbleFloat {
					0%, 100% {
						transform: translateY(0px) scale(1) rotate(0deg);
						opacity: 0.7;
					}
					25% {
						transform: translateY(-3px) scale(1.05) rotate(2deg);
						opacity: 0.9;
					}
					50% {
						transform: translateY(-6px) scale(1.1) rotate(0deg);
						opacity: 1;
					}
					75% {
						transform: translateY(-3px) scale(1.05) rotate(-2deg);
						opacity: 0.9;
					}
				}
				
				.chat-interface {
					width: 70%;
					height: 100%;
					display: flex;
					flex-direction: column;
					align-items: flex-start;
					justify-content: flex-end;
					padding: 0.1rem;
					text-align: left;
					gap: 0.1rem;
					margin-left: 4rem;
					margin-top: 12rem;
				}
				
				.chat-avatar {
					position: absolute;
					top: 1rem;
					left: 50%;
					transform: translateX(-50%);
					display: flex;
					justify-content: center;
					flex-shrink: 0;
					width: 100%;
					z-index: 10;
				}
				
				.avatar-gif {
					width: 820px;
					height: 220px;
					object-fit: contain;
					border-radius: 50%;
				}
				
				
				.chat-messages {
					flex: 1;
					width: 100%;
					overflow-y: auto;
					display: flex;
					flex-direction: column;
					gap: 0;
					min-height: 0;
					max-height: 8.4rem;
					padding: 0;
					align-items: stretch;
				}
				
				.chat-message {
					font-size: 0.9rem;
					line-height: 1.4;
					padding: 0;
					border-radius: 0;
					max-width: 100%;
					word-wrap: break-word;
					flex-shrink: 0;
					margin: 0;
					border: none;
					vertical-align: top;
					background: none;
					color: #ffffff;
				}
				
				.chat-message.user {
					background: none;
					align-self: flex-start;
					margin-left: 0;
					text-align: left;
					width: 100%;
					color: #ff6b6b;
				}
				
				.chat-message.assistant {
					background: none;
					align-self: flex-start;
					margin-right: 0;
					text-align: left;
					width: 100%;
					color: #4dabf7;
				}
				
				.chat-input-container {
					display: flex;
					width: 100%;
					gap: 0.2rem;
					align-items: center;
					flex-shrink: 0;
					padding: 0 0.1rem;
				}
				
				.chat-input {
					flex: 1;
					background: rgba(255, 255, 255, 0.1);
					border: 1px solid rgba(255, 255, 255, 0.3);
					border-radius: 8px;
					padding: 0.25rem 0.4rem;
					color: #ffffff;
					font-size: 0.65rem;
					outline: none;
					min-height: 24px;
				}
				
				.chat-input::placeholder {
					color: rgba(255, 255, 255, 0.6);
				}
				
				.chat-send {
					background: none;
					border: 1px solid #ffffff;
					color: #ffffff;
					padding: 0.25rem;
					border-radius: 50%;
					cursor: pointer;
					transition: all 0.3s;
					display: flex;
					align-items: center;
					justify-content: center;
					min-width: 24px;
					min-height: 24px;
					flex-shrink: 0;
				}
				
				.chat-send:hover {
					background: rgba(255, 255, 255, 0.1);
				}
				
				.chat-send:disabled {
					opacity: 0.5;
					cursor: not-allowed;
				}
				
				.chat-welcome {
					font-size: 0.9rem;
					color: rgba(255, 255, 255, 0.8);
					margin-bottom: 1rem;
					line-height: 1.5;
				}

				.chat-welcome-cta {
					display: block;
					margin-top: 0.35rem;
					font-weight: 800;
					font-size: 0.95rem;
					color: #ffffff;
					letter-spacing: 0.01em;
				}

				.app.color-mode .chat-welcome-cta {
					color: #000000;
				}
				
				.app.color-mode .chat-bubble {
					background: rgba(255, 255, 255, 0.95);
					border-color: #000000;
					color: #000000;
				}
				
				.app.color-mode .chat-bubble::after {
					border-top-color: rgba(255, 255, 255, 0.95);
				}
				
				.app.color-mode .chat-toggle {
					background: rgba(255, 255, 255, 0.8);
					border-color: #000000;
					color: #000000;
					box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
				}
				
				.app.color-mode .chat-toggle {
					animation: heartbeatLight 2s ease-in-out infinite;
				}
				
				@keyframes heartbeatLight {
					0% {
						transform: scale(1);
						box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
					}
					14% {
						transform: scale(1.1);
						box-shadow: 0 6px 25px rgba(0, 0, 0, 0.6);
					}
					28% {
						transform: scale(1);
						box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
					}
					42% {
						transform: scale(1.1);
						box-shadow: 0 6px 25px rgba(0, 0, 0, 0.6);
					}
					70% {
						transform: scale(1);
						box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
					}
					100% {
						transform: scale(1);
						box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
					}
				}
				
				.app.color-mode .chat-toggle:hover {
					background: rgba(0, 0, 0, 0.1);
					animation: none;
					transform: scale(1.2);
					box-shadow: 0 8px 30px rgba(0, 0, 0, 0.8);
				}
				
				.app.color-mode .chat-message.user {
					background: rgba(0, 0, 0, 0.1);
				}
				
				.app.color-mode .chat-message.assistant {
					background: rgba(0, 0, 0, 0.05);
				}
				
				.app.color-mode .chat-input {
					background: rgba(0, 0, 0, 0.1);
					border-color: rgba(0, 0, 0, 0.3);
					color: #000000;
				}
				
				.app.color-mode .chat-input::placeholder {
					color: rgba(0, 0, 0, 0.6);
				}
				
				.app.color-mode .chat-send {
					border-color: #000000;
					color: #000000;
				}
				
				.app.color-mode .chat-send:hover {
					background: rgba(0, 0, 0, 0.1);
				}
				
				.app.color-mode .chat-welcome {
					color: rgba(0, 0, 0, 0.8);
				}
				
				.app.color-mode .browser-frame {
					background: #f5f5f5;
					border-bottom-color: #e0e0e0;
				}
				
				.app.color-mode .browser-title {
					color: #000000;
				}
				
				.app.color-mode .bubble {
					background: rgba(0, 0, 0, 0.8);
					box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
					border: 1px solid rgba(0, 0, 0, 0.4);
				}
				
				.app.color-mode .chat-toggle-text {
					background: rgba(255, 255, 255, 0.9);
					color: #000000;
					border: 1px solid rgba(0, 0, 0, 0.3);
				}
				
				.app.color-mode .bubble {
					animation: bubbleFloat 2s ease-in-out infinite, bubblePulseDark 3s ease-in-out infinite;
				}
				
				@keyframes bubblePulseDark {
					0%, 100% {
						box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
					}
					50% {
						box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
					}
				}
				
				@keyframes spin {
					from { transform: rotate(0deg); }
					to { transform: rotate(360deg); }
				}
				
				.orbit-a {
					width: 580px;
					height: 580px;
					border-color: #ffffff;
				}
				
				.orbit-b {
					width: 680px;
					height: 680px;
					border-color: #ffffff;
				}
				
				.orbit::before,
				.orbit::after {
					content: '';
					position: absolute;
					width: 12px;
					height: 12px;
					border-radius: 50%;
					background: #ffffff;
					box-shadow: 0 0 16px rgba(255, 255, 255, 0.5);
				}
				
				.orbit-a::before {
					top: 0;
					left: 50%;
					transform: translateX(-50%);
				}
				
				.orbit-b::after {
					bottom: 0;
					right: 50%;
					transform: translateX(50%);
				}
				
				/* Floating particles */
				.hero::after {
					display: none;
				}
				
				@keyframes particles {
					0%, 100% { background-position: 0% 0%; }
					50% { background-position: 100% 100%; }
				}
				
				/* Other Sections */
				.section {
					padding: 6rem 0;
					opacity: 0;
					transform: translateY(30px);
					transition: all 0.8s ease-out;
					background: transparent;
				}
				
				.section.in {
					opacity: 1;
					transform: translateY(0);
				}
				
				.section h2 {
					font-family: 'Pacifico', cursive;
					font-size: 3.5rem;
					font-weight: normal;
					margin-bottom: 3rem;
					text-align: center;
					color: #ffffff;
				}
				
				.alt {
					background: transparent;
				}

				/* Restore original large spacing for Projects section */
				#projects h2 {
					margin-bottom: 14rem;
				}
				
				.tone-sep {
					border-top: 1px solid #ffffff;
					box-shadow: 0 0 20px rgba(255, 255, 255, 0.3), 0 0 40px rgba(255, 255, 255, 0.2);
				}
				
				/* Resume */
				.experience-grid {
					display: grid;
					grid-template-columns: 1fr;
					gap: 4rem;
					max-width: 1000px;
					margin: 0 auto;
				}
				
				.experience-section {
					position: relative;
				}
				
				.section-icon {
					font-size: 3rem;
					margin-bottom: 1rem;
					text-align: center;
					display: flex;
					justify-content: center;
					color: #ffffff;
				}
				
				.app.color-mode .section-icon {
					color: #000000;
				}
				
				.experience-section h2 {
					font-size: 3rem;
					font-weight: 700;
					margin-bottom: 2rem;
					text-align: center;
					color: #ffffff;
				}
				
				.timeline {
					position: relative;
					padding-left: 2rem;
				}
				
				.timeline::before {
					content: '';
					position: absolute;
					left: 0;
					top: 0;
					bottom: 0;
					width: 2px;
					background: linear-gradient(to bottom, 
						rgba(255, 255, 255, 0) 0%,
						rgba(255, 255, 255, 0.5) 10%,
						rgba(255, 255, 255, 0.5) 90%,
						rgba(255, 255, 255, 0) 100%);
				}
				
				.app.color-mode .timeline::before {
					background: linear-gradient(to bottom, 
						rgba(0, 0, 0, 0) 0%,
						rgba(0, 0, 0, 0.3) 10%,
						rgba(0, 0, 0, 0.3) 90%,
						rgba(0, 0, 0, 0) 100%);
				}
				
				.timeline-item {
					position: relative;
					margin-bottom: 3rem;
				}
				
				.timeline-item:last-child {
					margin-bottom: 0;
				}
				
				.timeline-marker {
					position: absolute;
					left: -2.5rem;
					top: 0.5rem;
					width: 12px;
					height: 12px;
					border-radius: 50%;
					background: #ffffff;
					box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.2);
					z-index: 1;
				}
				
				.app.color-mode .timeline-marker {
					background: #000000;
					box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.15);
				}
				
				.timeline-content {
					padding: 1.5rem 2rem;
					background: rgba(255, 255, 255, 0.03);
					border: 1px solid rgba(255, 255, 255, 0.1);
					border-radius: 12px;
					transition: all 0.3s;
				}
				
				.app.color-mode .timeline-content {
					background: rgba(0, 0, 0, 0.03);
					border: 1px solid rgba(0, 0, 0, 0.15);
				}
				
				.timeline-content:hover {
					background: rgba(255, 255, 255, 0.05);
					border-color: rgba(255, 255, 255, 0.2);
					transform: translateX(8px);
				}
				
				.app.color-mode .timeline-content:hover {
					background: rgba(0, 0, 0, 0.06);
					border-color: rgba(0, 0, 0, 0.25);
				}
				
				.timeline-content h3 {
					font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
					font-size: 1.5rem;
					margin-bottom: 0.5rem;
					color: #ffffff;
				}
				
				.education-header {
					display: flex;
					justify-content: space-between;
					align-items: flex-start;
					gap: 2rem;
				}
				
				.experience-header {
					display: flex;
					justify-content: space-between;
					align-items: flex-start;
					gap: 2rem;
				}
				
				.company-logo {
					width: 60px;
					height: 60px;
					display: flex;
					align-items: center;
					justify-content: center;
					flex-shrink: 0;
				}
				
				.logo-placeholder {
					width: 100%;
					height: 100%;
					background: rgba(255, 255, 255, 0.1);
					border: 1px solid rgba(255, 255, 255, 0.2);
					border-radius: 8px;
					display: flex;
					align-items: center;
					justify-content: center;
					font-weight: bold;
					font-size: 1.2rem;
					color: #ffffff;
				}
				
				.app.color-mode .logo-placeholder {
					background: rgba(0, 0, 0, 0.1);
					border-color: rgba(0, 0, 0, 0.2);
					color: #000000;
				}
				
				.university-logo {
					width: 120px;
					height: 60px;
					object-fit: contain;
					flex-shrink: 0;
					background: white;
					padding: 0.5rem;
					border-radius: 8px;
				}
				
				.app.color-mode .university-logo {
					background: white;
					filter: none;
				}
				
				.company {
					font-size: 1.1rem;
					color: #ffffff;
					font-weight: 600;
					margin-bottom: 0.25rem;
					opacity: 0.9;
				}
				
				.resume {
					max-width: 800px;
					margin: 0 auto 2rem;
				}
				
				.resume-item {
					margin-bottom: 2.5rem;
					padding: 2rem;
					background: #000000;
					border-radius: 12px;
					border: 1px solid #ffffff;
				}
				
				.resume-item h3 {
					font-size: 1.5rem;
					margin-bottom: 0.5rem;
					color: #ffffff;
				}
				
				.muted {
					color: rgba(255, 255, 255, 0.6);
					margin-bottom: 1rem;
					font-size: 0.95rem;
				}
				
				.timeline-content ul {
					list-style: none;
					padding-left: 0;
					margin-top: 1rem;
				}
				
				.timeline-content li {
					padding-left: 1.5rem;
					position: relative;
					margin-bottom: 0.75rem;
					color: rgba(255, 255, 255, 0.85);
					line-height: 1.6;
				}
				
				.timeline-content li::before {
					content: '▹';
					position: absolute;
					left: 0;
					color: #ffffff;
					font-weight: bold;
				}
				
				.resume-item ul {
					list-style: none;
					padding-left: 0;
				}
				
				.resume-item li {
					padding-left: 1.5rem;
					position: relative;
					margin-bottom: 0.75rem;
					color: #ffffff;
				}
				
				.resume-item li::before {
					content: '→';
					position: absolute;
					left: 0;
					color: #ffffff;
				}
				
				/* Projects */
				.cards {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
					gap: 2rem;
				}
				
				.card {
					padding: 2rem;
					background: #000000;
					border: 1px solid #ffffff;
					border-radius: 12px;
					transition: all 0.3s;
					display: flex;
					flex-direction: column;
					height: 100%;
				}
				
				.card:hover {
					background: #000000;
					border-color: #ffffff;
					transform: translateY(-4px);
					box-shadow: 0 8px 24px rgba(255, 255, 255, 0.2);
				}
				
				.card-header {
					display: flex;
					justify-content: space-between;
					align-items: flex-start;
					margin-bottom: 1rem;
					gap: 1rem;
				}
				
				.card h3 {
					font-size: 1.5rem;
					margin: 0;
					color: #ffffff;
					flex: 1;
				}
				
				.status-badge {
					padding: 0.25rem 0.75rem;
					border-radius: 20px;
					font-size: 0.75rem;
					font-weight: 600;
					text-transform: uppercase;
					letter-spacing: 0.5px;
					flex-shrink: 0;
				}
				
				.status-badge.production {
					background: rgba(34, 197, 94, 0.2);
					color: #22c55e;
					border: 1px solid rgba(34, 197, 94, 0.3);
				}
				
				.status-badge.open-source {
					background: rgba(59, 130, 246, 0.2);
					color: #3b82f6;
					border: 1px solid rgba(59, 130, 246, 0.3);
				}
				
				.card p {
					color: #ffffff;
					margin-bottom: 1.5rem;
					flex: 1;
					line-height: 1.6;
				}
				
				.card-footer {
					margin-top: auto;
					padding-top: 1rem;
				}
				
				.card-link {
					color: #ffffff;
					text-decoration: none;
					font-weight: 600;
					transition: all 0.3s;
					display: inline-flex;
					align-items: center;
					gap: 0.5rem;
				}
				
				.card-link:hover {
					color: rgba(255, 255, 255, 0.8);
					transform: translateX(4px);
				}
				
				.tags {
					display: flex;
					gap: 0.5rem;
					flex-wrap: wrap;
				}
				
				.tag {
					padding: 0.375rem 0.875rem;
					background: #000000;
					color: #ffffff;
					font-size: 0.875rem;
					border-radius: 6px;
					border: 1px solid #ffffff;
				}
				
				/* Skills */
				.skills-grid {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
					gap: 2rem;
					max-width: 1200px;
					margin: 0 auto;
				}
				
				.skill-category {
					background: #000000;
					border: 1px solid #ffffff;
					border-radius: 12px;
					padding: 2rem;
					transition: all 0.3s;
				}
				
				.skill-category:hover {
					background: #000000;
					border-color: #ffffff;
					transform: translateY(-4px);
					box-shadow: 0 8px 24px rgba(255, 255, 255, 0.2);
				}
				
				.skill-category-header {
					display: flex;
					align-items: center;
					gap: 1rem;
					margin-bottom: 1.5rem;
				}
				
				.skill-category-header h3 {
					font-size: 1.25rem;
					font-weight: 600;
					color: #ffffff;
					margin: 0;
				}
				
				.skill-items {
					display: flex;
					flex-wrap: wrap;
					gap: 0.75rem;
				}
				
				.skill-item {
					padding: 0.5rem 1rem;
					background: rgba(255, 255, 255, 0.05);
					border: 1px solid rgba(255, 255, 255, 0.1);
					border-radius: 20px;
					color: #ffffff;
					font-size: 0.875rem;
					font-weight: 500;
					transition: all 0.3s;
				}
				
				.skill-item:hover {
					background: rgba(255, 255, 255, 0.1);
					border-color: rgba(255, 255, 255, 0.2);
					transform: translateY(-2px);
				}
				
				/* Timeline Styles */
				.timeline-container {
					max-width: 1200px;
					margin: 0 auto;
					padding: 4rem 0;
				}
				
				.timeline-wrapper {
					position: relative;
					margin-bottom: 4rem;
				}
				
				.timeline-track {
					position: relative;
					height: 120px;
					display: flex;
					align-items: center;
				}
				
				.timeline-line {
					position: absolute;
					top: 50%;
					left: 0;
					right: 0;
					height: 2px;
					background: linear-gradient(90deg,
						rgba(255, 255, 255, 0.1) 0%,
						rgba(255, 255, 255, 0.3) 25%,
						rgba(255, 255, 255, 0.5) 50%,
						rgba(255, 255, 255, 0.3) 75%,
						rgba(255, 255, 255, 0.1) 100%
					);
					transform: translateY(-50%);
					box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
				}

				.timeline-indicator {
					position: absolute;
					top: 50%;
					left: 0;
					width: 8px;
					height: 8px;
					background: rgba(255, 255, 255, 0.8);
					border-radius: 50%;
					transform: translate(-50%, -50%);
					transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1);
					box-shadow: 
						0 0 15px rgba(255, 255, 255, 0.6),
						0 0 30px rgba(255, 255, 255, 0.3);
					z-index: 3;
					animation: indicatorPulse 2s ease-in-out infinite;
				}

				@keyframes indicatorPulse {
					0%, 100% {
						transform: translate(-50%, -50%) scale(1);
						box-shadow: 
							0 0 15px rgba(255, 255, 255, 0.6),
							0 0 30px rgba(255, 255, 255, 0.3);
					}
					50% {
						transform: translate(-50%, -50%) scale(1.2);
						box-shadow: 
							0 0 20px rgba(255, 255, 255, 0.8),
							0 0 40px rgba(255, 255, 255, 0.5);
					}
				}
				
				.timeline-point {
					position: absolute;
					top: 50%;
					transform: translate(-50%, -50%);
					cursor: pointer;
					z-index: 2;
					opacity: 0;
					transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
				}
				
				.timeline-point.visible {
					opacity: 1;
					animation: timelinePointAppear 0.8s ease-out forwards;
				}
				
				.timeline-point.active {
					transform: translate(-50%, -50%) scale(1.2);
				}

				.timeline-point-inner {
					width: 60px;
					height: 60px;
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					color: #ffffff;
					background: rgba(255, 255, 255, 0.1);
					border: 3px solid rgba(255, 255, 255, 0.2);
					transition: all 0.3s ease;
					position: relative;
					z-index: 2;
				}
				
				.timeline-point-glow {
					position: absolute;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
					width: 80px;
					height: 80px;
					border-radius: 50%;
					background: rgba(255, 255, 255, 0.2);
					opacity: 0;
					transition: all 0.3s ease;
					z-index: 1;
				}
				
				.timeline-point:hover .timeline-point-glow,
				.timeline-point.active .timeline-point-glow {
					opacity: 0.3;
					transform: translate(-50%, -50%) scale(1.5);
					box-shadow: 0 0 30px currentColor;
				}
				
				.timeline-point:hover .timeline-point-inner,
				.timeline-point.active .timeline-point-inner {
					border-color: rgba(255, 255, 255, 0.5);
					box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
				}
				
				@keyframes timelinePointAppear {
					0% {
						opacity: 0;
						transform: translate(-50%, -50%) scale(0);
					}
					50% {
						opacity: 0.8;
						transform: translate(-50%, -50%) scale(1.1);
					}
					100% {
						opacity: 1;
						transform: translate(-50%, -50%) scale(1);
					}
				}
				
				.timeline-content {
					margin-top: 3rem;
					perspective: 1000px;
					perspective-origin: center center;
					background: transparent;
					border: none;
					padding: 0;
					touch-action: pan-x;
				}
				
				.timeline-card {
					background: rgba(255, 255, 255, 0.05);
					backdrop-filter: blur(10px);
					border: 1px solid rgba(255, 255, 255, 0.1);
					border-radius: 20px;
					padding: 2.5rem;
					backdrop-filter: blur(15px);
					transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
					max-width: 800px;
					margin: 0 auto;
					transform-style: preserve-3d;
					position: relative;
					animation: cardFloat 6s ease-in-out infinite;
					user-select: none;
					-webkit-user-select: none;
					-moz-user-select: none;
					-ms-user-select: none;
				}
				
				@keyframes cardFloat {
					0%, 100% {
						transform: 
							translateY(0px) 
							translateZ(0px) 
							rotateX(0deg) 
							rotateY(0deg);
					}
					25% {
						transform: 
							translateY(-8px) 
							translateZ(5px) 
							rotateX(2deg) 
							rotateY(1deg);
					}
					50% {
						transform: 
							translateY(-5px) 
							translateZ(10px) 
							rotateX(1deg) 
							rotateY(-1deg);
					}
					75% {
						transform: 
							translateY(-12px) 
							translateZ(8px) 
							rotateX(-1deg) 
							rotateY(2deg);
					}
				}
				
				
				.timeline-card:hover {
					background: rgba(255, 255, 255, 0.1);
					border-color: rgba(255, 255, 255, 0.2);
					transform: 
						translateY(-25px) 
						translateZ(30px) 
						rotateX(8deg) 
						rotateY(5deg) 
						scale(1.02);
				}
				
				
				.timeline-card:active {
					transform: 
						translateY(-10px) 
						translateZ(10px) 
						rotateX(2deg) 
						rotateY(1deg) 
						scale(0.98);
				}
				
				.timeline-card-header {
					display: flex;
					align-items: center;
					gap: 1.5rem;
					margin-bottom: 2rem;
				}
				
				.timeline-card-icon {
					width: 60px;
					height: 60px;
					border-radius: 16px;
					display: flex;
					align-items: center;
					justify-content: center;
					color: #ffffff;
					flex-shrink: 0;
				}
				
				.timeline-title-row {
					display: flex;
					align-items: center;
					gap: 1rem;
				}
				
				.timeline-point-logo {
					width: 40px;
					height: 40px;
				}
				
				.timeline-point-logo .organization-logo {
					width: 100%;
					height: 100%;
					object-fit: contain;
					filter: brightness(0) invert(1);
				}
				
				.timeline-card-logo {
					width: 48px;
					height: 48px;
				}
				
				.timeline-card-logo .organization-logo {
					width: 100%;
					height: 100%;
					object-fit: contain;
					filter: brightness(0) invert(1);
				}
				
				.timeline-card-info h3 {
					font-family: Arial, sans-serif;
					font-size: 1.75rem;
					font-weight: 700;
					color: #ffffff;
					margin: 0 0 0.5rem 0;
				}
				
				.timeline-card-subtitle {
					font-family: Arial, sans-serif;
					font-size: 1.125rem;
					color: rgba(255, 255, 255, 0.8);
					margin: 0 0 0.25rem 0;
					font-weight: 500;
				}
				
				.timeline-card-period {
					font-family: Arial, sans-serif;
					font-size: 0.875rem;
					color: rgba(255, 255, 255, 0.6);
					margin: 0;
					font-weight: 400;
				}
				
				.timeline-achievements {
					list-style: none;
					padding: 0;
					margin: 0;
				}
				
				.timeline-achievements li {
					padding: 0.75rem 0;
					color: rgba(255, 255, 255, 0.9);
					border-bottom: 1px solid rgba(255, 255, 255, 0.05);
					position: relative;
					padding-left: 1.5rem;
					opacity: 0;
					animation: achievementAppear 0.6s ease-out forwards;
				}
				
				.timeline-achievements li:last-child {
					border-bottom: none;
				}
				
				.timeline-achievements li::before {
					content: '→';
					position: absolute;
					left: 0;
					color: rgba(255, 255, 255, 0.5);
					font-weight: bold;
				}
				
				@keyframes achievementAppear {
					0% {
						opacity: 0;
						transform: translateX(-20px);
					}
					100% {
						opacity: 1;
						transform: translateX(0);
					}
				}
				
				.timeline-navigation {
					display: flex;
					justify-content: center;
					gap: 1rem;
					margin-top: 2rem;
				}
				
				.timeline-nav-btn {
					width: 12px;
					height: 12px;
					border-radius: 50%;
					border: none;
					cursor: pointer;
					transition: all 0.3s ease;
					opacity: 0.3;
					background: rgba(255, 255, 255, 0.3);
				}
				
				.timeline-nav-btn:hover,
				.timeline-nav-btn.active {
					opacity: 1;
					transform: scale(1.3);
					box-shadow: 0 0 15px currentColor;
				}
				
				.app.color-mode .timeline-line {
					background: linear-gradient(90deg,
						rgba(0, 0, 0, 0.1) 0%,
						rgba(0, 0, 0, 0.3) 25%,
						rgba(0, 0, 0, 0.5) 50%,
						rgba(0, 0, 0, 0.3) 75%,
						rgba(0, 0, 0, 0.1) 100%
					);
					box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
				}

				.app.color-mode .timeline-indicator {
					background: rgba(0, 0, 0, 0.8);
					box-shadow: 
						0 0 15px rgba(0, 0, 0, 0.6),
						0 0 30px rgba(0, 0, 0, 0.3);
				}

				.app.color-mode .timeline-indicator {
					animation: indicatorPulseLight 2s ease-in-out infinite;
				}

				@keyframes indicatorPulseLight {
					0%, 100% {
						transform: translate(-50%, -50%) scale(1);
						box-shadow: 
							0 0 15px rgba(0, 0, 0, 0.6),
							0 0 30px rgba(0, 0, 0, 0.3);
					}
					50% {
						transform: translate(-50%, -50%) scale(1.2);
						box-shadow: 
							0 0 20px rgba(0, 0, 0, 0.8),
							0 0 40px rgba(0, 0, 0, 0.5);
					}
				}
				
				.app.color-mode .timeline-point-inner {
					border-color: rgba(0, 0, 0, 0.2);
					color: #000000;
					background: rgba(0, 0, 0, 0.1);
				}

				.app.color-mode .timeline-point-glow {
					background: rgba(0, 0, 0, 0.2);
				}
				
				.app.color-mode .timeline-content {
					background: transparent;
					border: none;
					padding: 0;
				}
				
				.app.color-mode .timeline-card {
					background: rgba(0, 0, 0, 0.05);
					border: 1px solid rgba(0, 0, 0, 0.1);
					backdrop-filter: blur(10px);
				}
				
				.app.color-mode .timeline-card:hover {
					background: rgba(0, 0, 0, 0.1);
					border-color: rgba(0, 0, 0, 0.2);
				}
				
				.app.color-mode .timeline-card-info h3 {
					color: #000000;
				}
				
				.app.color-mode .timeline-point-logo .organization-logo {
					filter: brightness(0) invert(0);
				}
				
				.app.color-mode .timeline-card-logo .organization-logo {
					filter: brightness(0) invert(0);
				}
				
				.app.color-mode .timeline-card-subtitle {
					color: rgba(0, 0, 0, 0.8);
				}
				
				.app.color-mode .timeline-card-period {
					color: rgba(0, 0, 0, 0.6);
				}
				
				.app.color-mode .timeline-achievements li {
					color: rgba(0, 0, 0, 0.9);
					border-bottom-color: rgba(0, 0, 0, 0.05);
				}
				
				.app.color-mode .timeline-achievements li::before {
					color: rgba(0, 0, 0, 0.5);
				}

				.app.color-mode .timeline-card-icon {
					color: #000000;
					background: rgba(0, 0, 0, 0.1);
					border: 1px solid rgba(0, 0, 0, 0.2);
				}

				.app.color-mode .timeline-nav-btn {
					background: rgba(0, 0, 0, 0.3);
				}
				
				/* Timeline Image Carousel */
				.timeline-image-carousel {
					margin-bottom: 2rem;
				}
				
				.carousel-container {
					position: relative;
					display: flex;
					align-items: center;
					justify-content: center;
					gap: 1rem;
					margin-bottom: 1rem;
				}
				
				.carousel-image {
					width: 200px;
					height: 150px;
					border-radius: 12px;
					overflow: hidden;
					border: 2px solid rgba(255, 255, 255, 0.1);
					box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
					transition: all 0.3s ease;
					cursor: pointer;
				}
				
				.carousel-image:hover {
					transform: scale(1.05);
					box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
				}
				
				.carousel-image img {
					width: 100%;
					height: 100%;
					object-fit: cover;
					transition: transform 0.3s ease;
				}
				
				.carousel-arrow {
					width: 40px;
					height: 40px;
					border-radius: 50%;
					border: 1px solid rgba(255, 255, 255, 0.2);
					background: rgba(0, 0, 0, 0.6);
					color: #ffffff;
					display: flex;
					align-items: center;
					justify-content: center;
					cursor: pointer;
					transition: all 0.3s ease;
					backdrop-filter: blur(10px);
				}
				
				.carousel-arrow:hover {
					background: rgba(255, 255, 255, 0.1);
					border-color: rgba(255, 255, 255, 0.3);
					transform: scale(1.1);
				}
				
				.carousel-arrow:active {
					transform: scale(0.95);
				}
				
				.carousel-indicators {
					display: flex;
					justify-content: center;
					gap: 0.5rem;
				}
				
				.carousel-dot {
					width: 8px;
					height: 8px;
					border-radius: 50%;
					border: none;
					background: rgba(255, 255, 255, 0.3);
					cursor: pointer;
					transition: all 0.3s ease;
				}
				
				.carousel-dot.active {
					background: rgba(255, 255, 255, 0.8);
					transform: scale(1.2);
				}
				
				.carousel-dot:hover {
					background: rgba(255, 255, 255, 0.6);
				}
				
				.app.color-mode .carousel-image {
					border-color: rgba(0, 0, 0, 0.1);
					box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
				}
				
				.app.color-mode .carousel-image:hover {
					box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
				}
				
				.app.color-mode .carousel-arrow {
					background: rgba(255, 255, 255, 0.8);
					color: #000000;
					border-color: rgba(0, 0, 0, 0.2);
				}
				
				.app.color-mode .carousel-arrow:hover {
					background: rgba(255, 255, 255, 0.9);
					border-color: rgba(0, 0, 0, 0.3);
				}
				
				.app.color-mode .carousel-dot {
					background: rgba(0, 0, 0, 0.3);
				}
				
				.app.color-mode .carousel-dot.active {
					background: rgba(0, 0, 0, 0.8);
				}
				
				.app.color-mode .carousel-dot:hover {
					background: rgba(0, 0, 0, 0.6);
				}
				
				/* Image Modal */
				.image-modal {
					position: fixed;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					background: rgba(0, 0, 0, 0.9);
					display: flex;
					align-items: center;
					justify-content: center;
					z-index: 1000;
					backdrop-filter: blur(10px);
					animation: modalFadeIn 0.3s ease-out;
				}
				
				.image-modal-content {
					position: relative;
					max-width: 90vw;
					max-height: 90vh;
					background: rgba(0, 0, 0, 0.8);
					border-radius: 20px;
					padding: 2rem;
					border: 1px solid rgba(255, 255, 255, 0.1);
					box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
					animation: modalSlideIn 0.3s ease-out;
				}
				
				.image-modal-close {
					position: absolute;
					top: 1rem;
					right: 1rem;
					width: 40px;
					height: 40px;
					border-radius: 50%;
					border: 1px solid rgba(255, 255, 255, 0.2);
					background: rgba(0, 0, 0, 0.6);
					color: #ffffff;
					display: flex;
					align-items: center;
					justify-content: center;
					cursor: pointer;
					transition: all 0.3s ease;
					backdrop-filter: blur(10px);
					z-index: 1001;
				}
				
				.image-modal-close:hover {
					background: rgba(255, 255, 255, 0.1);
					border-color: rgba(255, 255, 255, 0.3);
					transform: scale(1.1);
				}
				
				.image-modal-image {
					max-width: 100%;
					max-height: 80vh;
					object-fit: contain;
					border-radius: 12px;
					box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
				}
				
				@keyframes modalFadeIn {
					from {
						opacity: 0;
					}
					to {
						opacity: 1;
					}
				}
				
				@keyframes modalSlideIn {
					from {
						opacity: 0;
						transform: scale(0.8) translateY(20px);
					}
					to {
						opacity: 1;
						transform: scale(1) translateY(0);
					}
				}
				
				.app.color-mode .image-modal {
					background: rgba(255, 255, 255, 0.9);
				}
				
				.app.color-mode .image-modal-content {
					background: rgba(255, 255, 255, 0.95);
					border-color: rgba(0, 0, 0, 0.1);
				}
				
				.app.color-mode .image-modal-close {
					background: rgba(255, 255, 255, 0.8);
					color: #000000;
					border-color: rgba(0, 0, 0, 0.2);
				}
				
				.app.color-mode .image-modal-close:hover {
					background: rgba(255, 255, 255, 0.9);
					border-color: rgba(0, 0, 0, 0.3);
				}
				
				/* Contact */
				.contact {
					display: flex;
					flex-direction: column;
					align-items: center;
					gap: 2rem;
					margin-top: 2rem;
					margin-bottom: 3rem;
				}

				.contact-photo-container {
					position: relative;
					width: 250px;
					height: 250px;
					border-radius: 50%;
					overflow: hidden;
					border: 3px solid rgba(255, 255, 255, 0.2);
					box-shadow: 0 20px 60px rgba(255, 255, 255, 0.1);
				}

				.contact-photo {
					width: 100%;
					height: 100%;
					object-fit: cover;
					object-position: 75% 10%;
				}

				.contact-buttons {
					display: flex;
					gap: 1rem;
					justify-content: center;
					flex-wrap: wrap;
				}

				.app.color-mode .contact-photo-container {
					border-color: rgba(0, 0, 0, 0.2);
					box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
				}

				/* Business Card */
				.business-card-container {
					display: flex;
					justify-content: center;
					align-items: center;
					min-height: 400px;
					margin: 2rem 0;
					perspective: 1200px;
					perspective-origin: center center;
				}

				.business-card {
					position: relative;
					width: 600px;
					height: 350px;
					background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
					border-radius: 20px;
					box-shadow: 
						0 20px 60px rgba(0, 0, 0, 0.15),
						0 0 0 1px rgba(255, 255, 255, 0.1);
					overflow: hidden;
					background-image: url('/image.png');
					background-size: cover;
					background-position: center;
					background-repeat: no-repeat;
					transform-style: preserve-3d;
					transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
					animation: businessCardFloat 8s ease-in-out infinite;
					cursor: pointer;
				}

				@keyframes businessCardFloat {
					0% {
						transform: 
							translateY(0px) 
							translateZ(0px) 
							rotateX(0deg) 
							rotateY(0deg);
					}
					25% {
						transform: 
							translateY(-10px) 
							translateZ(8px) 
							rotateX(2deg) 
							rotateY(1deg);
					}
					50% {
						transform: 
							translateY(-6px) 
							translateZ(12px) 
							rotateX(1deg) 
							rotateY(-1deg);
					}
					75% {
						transform: 
							translateY(-14px) 
							translateZ(10px) 
							rotateX(-1deg) 
							rotateY(2deg);
					}
					100% {
						transform: 
							translateY(0px) 
							translateZ(0px) 
							rotateX(0deg) 
							rotateY(0deg);
					}
				}

				.business-card:hover {
					transform: 
						translateY(-30px) 
						translateZ(40px) 
						rotateX(10deg) 
						rotateY(8deg) 
						scale(1.03);
					box-shadow: 
						0 40px 100px rgba(0, 0, 0, 0.25),
						0 0 0 1px rgba(255, 255, 255, 0.2);
				}

				.business-card:active {
					transform: 
						translateY(-15px) 
						translateZ(15px) 
						rotateX(3deg) 
						rotateY(2deg) 
						scale(0.98);
				}

				.business-card-background {
					position: absolute;
					top: 0;
					left: 0;
					right: 0;
					bottom: 0;
					display: flex;
					align-items: center;
					justify-content: center;
					z-index: 1;
				}

				.business-card-quote {
					font-size: 1.2rem;
					font-weight: 300;
					color: rgba(0, 0, 0, 0.6);
					text-align: center;
					font-style: italic;
					line-height: 1.4;
					max-width: 80%;
				}

				.business-card-content {
					position: relative;
					z-index: 2;
					height: 100%;
					padding: 2rem;
					display: flex;
					flex-direction: column;
					justify-content: space-between;
					transform-style: preserve-3d;
				}

				.business-card-top {
					display: flex;
					align-items: flex-start;
					gap: 1.5rem;
				}

				.business-card-profile {
					width: 80px;
					height: 80px;
					border-radius: 50%;
					overflow: hidden;
					flex-shrink: 0;
					border: 3px solid rgba(255, 255, 255, 0.8);
					box-shadow: 
						0 8px 25px rgba(0, 0, 0, 0.15),
						0 0 0 1px rgba(255, 255, 255, 0.3);
					transform: translateZ(10px);
					transition: transform 0.3s ease;
				}

				.business-card:hover .business-card-profile {
					transform: translateZ(20px) scale(1.05);
					box-shadow: 
						0 12px 35px rgba(0, 0, 0, 0.2),
						0 0 0 1px rgba(255, 255, 255, 0.4);
				}

				.business-card-photo {
					width: 100%;
					height: 100%;
					object-fit: cover;
					object-position: center;
				}

				.business-card-info {
					flex: 1;
				}

				.business-card-name {
					font-size: 1.8rem;
					font-weight: 700;
					color: #2c2c2c;
					margin: 0 0 0.5rem 0;
					line-height: 1.2;
					transform: translateZ(5px);
					transition: transform 0.3s ease;
					text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
				}

				.business-card:hover .business-card-name {
					transform: translateZ(15px);
					text-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
				}

				.business-card-title {
					font-size: 1rem;
					font-weight: 400;
					color: #666;
					margin: 0 0 0.25rem 0;
				}

				.business-card-location {
					font-size: 0.9rem;
					font-weight: 400;
					color: #666;
					margin: 0;
				}

				.business-card-contact {
					display: flex;
					flex-direction: column;
					gap: 0.75rem;
					margin-top: 1rem;
				}

				.contact-item {
					display: flex;
					align-items: center;
					gap: 0.75rem;
					font-size: 0.9rem;
					color: #555;
					transform: translateZ(3px);
					transition: transform 0.3s ease;
				}

				.business-card:hover .contact-item {
					transform: translateZ(8px);
				}

				.contact-icon {
					width: 16px;
					height: 16px;
					color: #666;
					flex-shrink: 0;
				}

				.business-card-signature {
					position: absolute;
					bottom: 1.5rem;
					right: 2rem;
					width: 200px;
					height: 80px;
					transform: translateZ(5px);
					transition: transform 0.3s ease;
				}

				.business-card-signature .signature-img {
					width: 100%;
					height: 100%;
					object-fit: contain;
					opacity: 0.8;
					filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
				}

				.business-card:hover .business-card-signature {
					transform: translateZ(15px) scale(1.05);
				}

				.business-card:hover .business-card-signature .signature-img {
					filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
				}

				/* Dark mode adjustments */
				.app.color-mode .business-card {
					background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
					background-image: url('/image.png');
					background-size: cover;
					background-position: center;
					background-repeat: no-repeat;
				}

				.app.color-mode .business-card-quote {
					color: rgba(0, 0, 0, 0.6);
				}

				.app.color-mode .business-card-name {
					color: #2c2c2c;
				}

				.app.color-mode .business-card-title,
				.app.color-mode .business-card-location {
					color: #666;
				}

				.app.color-mode .contact-item {
					color: #555;
				}

				.app.color-mode .contact-icon {
					color: #666;
				}

				/* Responsive design - Desktop only (overridden by mobile/tablet styles above) */
				@media (max-width: 768px) and (min-width: 1025px) {
					.business-card {
						width: 90%;
						max-width: 500px;
						height: 300px;
					}

					.business-card-content {
						padding: 1.5rem;
					}

					.business-card-quote {
						font-size: 1.2rem;
					}

					.business-card-name {
						font-size: 1.5rem;
					}

					.business-card-profile {
						width: 60px;
						height: 60px;
					}
				}

				/* Articles Section */
				.articles-carousel-wrapper {
					position: relative;
					margin-top: 3rem;
					max-width: 1200px;
					width: 100%;
					margin-left: auto;
					margin-right: auto;
					padding: 0 80px;
				}

				.articles-carousel-wrapper .carousel-arrows {
					position: absolute;
					top: 50%;
					transform: translateY(-50%);
					z-index: 20;
				}

				.articles-carousel-wrapper .carousel-prev {
					left: 10px;
				}

				.articles-carousel-wrapper .carousel-next {
					right: 10px;
				}

				.articles-carousel-wrapper .carousel-indicators {
					margin-top: 2rem;
					margin-bottom: 0;
				}

				.articles-carousel {
					position: relative;
					overflow: hidden;
					width: 100%;
				}

				.articles-container {
					display: flex;
					transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
					will-change: transform;
					width: 100%;
					height: 100%;
				}

				/* Newspaper Card Styles - Dark Mode (Default) */
				.newspaper-card {
					background: rgba(20, 20, 25, 0.95);
					border: 3px solid rgba(255, 255, 255, 0.2);
					box-shadow: 
						0 10px 30px rgba(0, 0, 0, 0.5),
						inset 0 0 0 1px rgba(255, 255, 255, 0.05);
					flex: 0 0 100%;
					width: 100%;
					max-width: 100%;
					min-width: 0;
					margin-right: 0;
					padding: 2rem;
					position: relative;
					transition: all 0.4s ease;
					font-family: 'Georgia', 'Times New Roman', serif;
					backdrop-filter: blur(10px);
					-webkit-backdrop-filter: blur(10px);
					box-sizing: border-box;
					overflow: visible;
				}

				.articles-container .newspaper-card:last-child {
					margin-right: 0;
				}

				.newspaper-card:hover {
					box-shadow: 
						0 15px 40px rgba(0, 0, 0, 0.6),
						inset 0 0 0 1px rgba(255, 255, 255, 0.1);
					border-color: rgba(255, 255, 255, 0.3);
					transform: translateY(-5px);
				}

				/* Newspaper Header */
				.newspaper-header {
					margin-bottom: 1.5rem;
				}

				.newspaper-masthead {
					display: flex;
					justify-content: space-between;
					align-items: baseline;
					margin-bottom: 0.75rem;
				}

				.newspaper-name {
					font-size: 2.5rem;
					font-weight: 900;
					color: #ffffff;
					letter-spacing: -1px;
					text-transform: uppercase;
					font-family: 'Times New Roman', serif;
					line-height: 1;
				}

				.newspaper-date {
					font-size: 0.9rem;
					color: rgba(255, 255, 255, 0.7);
					font-weight: 500;
					text-transform: uppercase;
					letter-spacing: 1px;
				}

				.newspaper-divider {
					height: 3px;
					background: rgba(255, 255, 255, 0.3);
					margin: 0.5rem 0;
				}

				.newspaper-divider-small {
					height: 1px;
					background: rgba(255, 255, 255, 0.2);
					margin: 1rem 0;
				}

				/* Newspaper Body - Two Column Layout */
				.newspaper-body {
					display: grid;
					grid-template-columns: 1fr 1.5fr;
					gap: 2rem;
					margin-bottom: 1.5rem;
					width: 100%;
					max-width: 100%;
					box-sizing: border-box;
				}

				.newspaper-column {
					display: flex;
					flex-direction: column;
					min-width: 0;
					overflow: hidden;
				}

				/* Image Column */
				.newspaper-image-wrapper {
					position: relative;
					border: 2px solid rgba(255, 255, 255, 0.3);
					padding: 0.5rem;
					background: #1a1a1a;
				}

				.newspaper-image {
					width: 100%;
					height: auto;
					display: block;
					object-fit: cover;
					border: none;
					background: #ffffff;
				}

				.newspaper-image-caption {
					font-size: 0.75rem;
					color: rgba(255, 255, 255, 0.6);
					font-style: italic;
					margin-top: 0.5rem;
					text-align: center;
					text-transform: uppercase;
					letter-spacing: 0.5px;
				}

				/* Text Column */
				.newspaper-headline {
					font-size: 2rem;
					font-weight: 900;
					color: #ffffff;
					line-height: 1.2;
					margin-bottom: 0.75rem;
					text-transform: uppercase;
					letter-spacing: -0.5px;
					font-family: 'Times New Roman', serif;
				}

				.newspaper-byline {
					display: flex;
					align-items: center;
					gap: 0.5rem;
					font-size: 0.85rem;
					color: rgba(255, 255, 255, 0.7);
					margin-bottom: 0.5rem;
					text-transform: uppercase;
					letter-spacing: 0.5px;
				}

				.newspaper-section {
					font-weight: 700;
					color: #ffffff;
				}

				.newspaper-separator {
					color: rgba(255, 255, 255, 0.5);
				}

				.newspaper-read-time {
					color: rgba(255, 255, 255, 0.6);
				}

				.newspaper-body-text {
					font-size: 1rem;
					line-height: 1.8;
					color: rgba(255, 255, 255, 0.9);
					text-align: justify;
					margin-bottom: 1rem;
				}

				.newspaper-continued {
					margin-top: auto;
					padding-top: 1rem;
				}

				.newspaper-link {
					color: #ffffff;
					text-decoration: none;
					font-weight: 700;
					font-size: 0.9rem;
					text-transform: uppercase;
					letter-spacing: 1px;
					border-bottom: 2px solid rgba(255, 255, 255, 0.5);
					transition: all 0.3s ease;
					display: inline-block;
				}

				.newspaper-link:hover {
					color: rgba(255, 255, 255, 0.8);
					border-bottom-color: rgba(255, 255, 255, 0.8);
					transform: translateX(5px);
				}

				.newspaper-footer {
					margin-top: 1rem;
				}

				/* Light Mode Adjustments for Newspaper */
				.app.color-mode .newspaper-card {
					background: #faf9f6;
					border-color: #1a1a1a;
					box-shadow: 
						0 10px 30px rgba(0, 0, 0, 0.2),
						inset 0 0 0 1px rgba(255, 255, 255, 0.1);
				}

				.app.color-mode .newspaper-card:hover {
					box-shadow: 
						0 15px 40px rgba(0, 0, 0, 0.3),
						inset 0 0 0 1px rgba(255, 255, 255, 0.1);
					border-color: #1a1a1a;
				}

				.app.color-mode .newspaper-name {
					color: #1a1a1a;
				}

				.app.color-mode .newspaper-date {
					color: #666;
				}

				.app.color-mode .newspaper-divider {
					background: #1a1a1a;
				}

				.app.color-mode .newspaper-divider-small {
					background: #ccc;
				}

				.app.color-mode .newspaper-image-wrapper {
					border-color: #1a1a1a;
					background: #fff;
				}

				.app.color-mode .newspaper-image {
					border-color: #ddd;
				}

				.app.color-mode .newspaper-image-caption {
					color: #666;
				}

				.app.color-mode .newspaper-headline {
					color: #1a1a1a;
				}

				.app.color-mode .newspaper-byline {
					color: #666;
				}

				.app.color-mode .newspaper-section {
					color: #1a1a1a;
				}

				.app.color-mode .newspaper-separator {
					color: #999;
				}

				.app.color-mode .newspaper-read-time {
					color: #888;
				}

				.app.color-mode .newspaper-body-text {
					color: #333;
				}

				.app.color-mode .newspaper-link {
					color: #1a1a1a;
					border-bottom-color: #1a1a1a;
				}

				.app.color-mode .newspaper-link:hover {
					color: #666;
					border-bottom-color: #666;
				}

				/* Responsive design for newspaper */
				@media (max-width: 768px) {
					.articles-carousel-wrapper {
						padding: 0 60px;
						margin-top: 2rem;
					}

					.articles-carousel-wrapper .carousel-prev {
						left: 5px;
					}

					.articles-carousel-wrapper .carousel-next {
						right: 5px;
					}

					.newspaper-card {
						margin-right: 0;
						padding: 1.5rem;
					}

					.newspaper-name {
						font-size: 1.8rem;
					}

					.newspaper-body {
						grid-template-columns: 1fr;
						gap: 1.5rem;
					}

					.newspaper-headline {
						font-size: 1.5rem;
					}

					.newspaper-masthead {
						flex-direction: column;
						align-items: flex-start;
						gap: 0.5rem;
					}

					.newspaper-date {
						font-size: 0.8rem;
					}
				}
				
				/* Projects Section */
				.projects-carousel-wrapper {
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					gap: 3rem;
					margin: 0;
					min-height: 100vh;
					position: relative;
					transform: scale(0.8);
					transform-origin: center center;
				}

				.projects-carousel {
					position: relative;
					width: 100%;
					max-width: 500px;
					height: 500px;
					margin: 0 auto;
					perspective: 1200px;
					display: flex;
					align-items: center;
					justify-content: center;
				}

				.projects-container {
					position: relative;
					width: 100%;
					height: 100%;
					transform-style: preserve-3d;
					transition: transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
					display: flex;
					align-items: center;
					justify-content: center;
				}

				.project-item {
					position: absolute;
					width: 320px;
					display: flex;
					flex-direction: column;
					align-items: center;
					transform-origin: center center;
				}

				.project-item:nth-child(1) {
					transform: rotateY(0deg) translateZ(220px);
				}

				.project-item:nth-child(2) {
					transform: rotateY(120deg) translateZ(220px);
				}

				.project-item:nth-child(3) {
					transform: rotateY(240deg) translateZ(220px);
				}

				.project-video {
					width: 100%;
					height: 120px;
					border-radius: 12px;
					margin-bottom: 1.5rem;
					cursor: pointer;
					box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
					object-fit: cover;
				}

				.project-card {
					width: 100%;
					height: 580px;
					padding: 2.5rem;
					display: flex;
					flex-direction: column;
					justify-content: flex-start;
					align-items: center;
					text-align: center;
					background: #1a1a1a;
					border: 1px solid #333333;
					border-radius: 20px;
					box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
					gap: 1.5rem;
					position: relative;
					overflow: hidden;
					transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
				}

				.project-card::before {
					content: '';
					position: absolute;
					top: 0;
					left: 0;
					right: 0;
					bottom: 0;
					background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%);
					opacity: 0;
					transition: opacity 0.3s ease;
					border-radius: 20px;
				}

				.project-card:hover::before {
					opacity: 1;
				}

				.project-card:hover {
					background: #2a2a2a;
					border-color: #444444;
					transform: 
						translateY(-25px) 
						translateZ(30px) 
						rotateX(8deg) 
						rotateY(5deg) 
						scale(1.02);
				}

				.project-video-container {
					width: 100%;
					height: 120px;
					border-radius: 12px;
					overflow: hidden;
					margin-bottom: 1.5rem;
					box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
					position: relative;
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					display: flex;
					align-items: center;
					justify-content: center;
				}
				
				.project-video-mini {
					width: 100%;
					height: 100%;
					object-fit: cover;
					border-radius: 12px;
					background: #000;
				}
				
				.video-placeholder {
					width: 100%;
					height: 100%;
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					border-radius: 12px;
					cursor: pointer;
					transition: all 0.3s ease;
				}
				
				.video-placeholder:hover {
					transform: scale(1.02);
					box-shadow: 0 15px 40px rgba(102, 126, 234, 0.4);
				}
				
				.play-icon {
					font-size: 3rem;
					color: white;
					margin-bottom: 0.5rem;
					text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
				}
				
				.video-label {
					color: white;
					font-size: 0.9rem;
					font-weight: 500;
					text-shadow: 0 1px 5px rgba(0, 0, 0, 0.3);
				}
				
				.project-image {
					width: 80px;
					height: 80px;
					border-radius: 50%;
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					display: flex;
					align-items: center;
					justify-content: center;
					margin-bottom: 1.5rem;
					font-size: 2rem;
					color: white;
					box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
				}

				.project-title {
					font-size: 1.5rem;
					font-weight: bold;
					margin-bottom: 1.5rem;
					color: #ffffff;
					line-height: 1.3;
				}

				.project-description {
					font-size: 0.9rem;
					color: rgba(255, 255, 255, 0.8);
					line-height: 1.6;
					margin-bottom: 2rem;
					max-width: 280px;
				}

				.project-technologies {
					display: flex;
					flex-wrap: wrap;
					gap: 0.5rem;
					justify-content: center;
					margin-bottom: 2rem;
				}

				.tech-tag {
					background: rgba(255, 255, 255, 0.1);
					color: rgba(255, 255, 255, 0.9);
					padding: 0.3rem 0.8rem;
					border-radius: 15px;
					font-size: 0.8rem;
					border: 1px solid rgba(255, 255, 255, 0.2);
				}

				.project-links {
					display: flex;
					gap: 1rem;
					justify-content: center;
					margin-top: 1rem;
					position: relative;
					z-index: 10;
				}

				.project-link {
					background: rgba(255, 255, 255, 0.1);
					color: rgba(255, 255, 255, 0.9);
					padding: 0.5rem 1rem;
					border-radius: 25px;
					text-decoration: none;
					font-size: 0.9rem;
					border: 1px solid rgba(255, 255, 255, 0.2);
					transition: all 0.3s ease;
					position: relative;
					z-index: 11;
					pointer-events: auto;
				}

				.project-link:hover {
					background: rgba(255, 255, 255, 0.2);
					transform: translateY(-2px);
					box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
					z-index: 12;
				}

				.carousel-arrows {
					position: absolute;
					top: 50%;
					transform: translateY(-50%);
					background: rgba(255, 255, 255, 0.1);
					border: 1px solid rgba(255, 255, 255, 0.2);
					color: rgba(255, 255, 255, 0.9);
					width: 50px;
					height: 50px;
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					cursor: pointer;
					transition: all 0.3s ease;
					backdrop-filter: blur(10px);
					z-index: 10;
				}

				.carousel-arrows:hover {
					background: rgba(255, 255, 255, 0.2);
					box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
					transform: translateY(-50%) scale(1.1);
				}

				.carousel-prev {
					left: -80px;
				}

				.carousel-next {
					right: -80px;
				}

				.carousel-indicators {
					display: flex;
					justify-content: center;
					gap: 0.5rem;
					margin-top: 12rem;
				}

				.carousel-indicator {
					width: 12px;
					height: 12px;
					border-radius: 50%;
					background: rgba(255, 255, 255, 0.3);
					cursor: pointer;
					transition: all 0.3s ease;
				}

				.carousel-indicator.active {
					background: rgba(255, 255, 255, 0.9);
					transform: scale(1.2);
				}

				.app.color-mode .projects-carousel {
					background: rgba(0, 0, 0, 0.05);
					border-color: rgba(0, 0, 0, 0.1);
				}

				.app.color-mode .project-card {
					background: #f5f5f5;
					border: 1px solid #e0e0e0;
				}

				.app.color-mode .project-card::before {
					background: linear-gradient(135deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.05) 100%);
				}

				.app.color-mode .project-card:hover {
					background: #e8e8e8;
					border-color: #d0d0d0;
				}

				.app.color-mode .project-title {
					color: #000000;
				}

				.app.color-mode .project-description {
					color: rgba(0, 0, 0, 0.8);
				}

				.app.color-mode .tech-tag {
					background: rgba(0, 0, 0, 0.1);
					color: rgba(0, 0, 0, 0.9);
					border-color: rgba(0, 0, 0, 0.2);
				}

				.app.color-mode .project-link {
					background: rgba(0, 0, 0, 0.1);
					color: rgba(0, 0, 0, 0.9);
					border-color: rgba(0, 0, 0, 0.2);
					position: relative;
					z-index: 11;
					pointer-events: auto;
				}

				.app.color-mode .project-link:hover {
					background: rgba(0, 0, 0, 0.2);
					z-index: 12;
				}

				.app.color-mode .carousel-arrows {
					background: rgba(0, 0, 0, 0.1);
					border-color: rgba(0, 0, 0, 0.2);
					color: rgba(0, 0, 0, 0.9);
				}

				.app.color-mode .carousel-arrows:hover {
					background: rgba(0, 0, 0, 0.2);
				}

				.app.color-mode .carousel-indicator {
					background: rgba(0, 0, 0, 0.3);
				}

				.app.color-mode .carousel-indicator.active {
					background: rgba(0, 0, 0, 0.9);
				}
				
				/* Featured Video */
				/* Values Section */
				.video-preview-container {
					display: flex;
					justify-content: center;
					margin-top: 3rem;
				}
				
				.video-preview-card {
					background: rgba(255, 255, 255, 0.05);
					border: 1px solid rgba(255, 255, 255, 0.1);
					border-radius: 16px;
					padding: 2rem;
					max-width: 800px;
					width: 100%;
					text-align: center;
				}
				
				.video-preview-card h3 {
					font-size: 1.8rem;
					margin-bottom: 1.5rem;
					color: #ffffff;
				}
				
				.video-wrapper {
					position: relative;
					border-radius: 12px;
					overflow: hidden;
					margin-bottom: 1.5rem;
					box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
				}
				
				.project-video {
					width: 100%;
					height: auto;
					display: block;
					border-radius: 12px;
				}
				
				.video-overlay {
					position: absolute;
					top: 0;
					left: 0;
					right: 0;
					bottom: 0;
					background: rgba(0, 0, 0, 0.3);
					display: flex;
					align-items: center;
					justify-content: center;
					opacity: 0;
					transition: opacity 0.3s ease;
					border-radius: 12px;
				}
				
				.video-wrapper:hover .video-overlay {
					opacity: 1;
				}
				
				.play-button {
					width: 60px;
					height: 60px;
					background: rgba(255, 255, 255, 0.9);
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 24px;
					color: #000;
					cursor: pointer;
					transition: transform 0.3s ease;
				}
				
				.play-button:hover {
					transform: scale(1.1);
				}
				
				.video-description {
					color: rgba(255, 255, 255, 0.8);
					font-size: 1.1rem;
					line-height: 1.6;
				}

				.values-section {
					padding: 6rem 0;
					position: relative;
					overflow: hidden;
				}
				
				.values-container {
					display: flex;
					justify-content: center;
					align-items: center;
					max-width: 1200px;
					margin: 0 auto;
					padding: 0 2rem;
					margin-top: -2rem;
				}
				
				.pixel-trace-container {
					position: relative;
					width: 400px;
					height: 400px;
					margin: 0 auto;
				}
				
				.pixel-grid {
					position: relative;
					width: 100%;
					height: 100%;
					background: #000000;
					border-radius: 50%;
					overflow: hidden;
				}
				
				.pixel-block {
					position: absolute;
					width: 4px;
					height: 4px;
					transition: background-color 0.1s ease-in-out;
				}
				
				.app.color-mode .pixel-grid {
					background: #ffffff;
				}
				
				.values-content h2 {
					font-size: 3.5rem;
					font-weight: 700;
					margin-bottom: 2rem;
					color: #ffffff;
					text-align: left;
				}
				
				.values-content p {
					font-size: 1.25rem;
					color: #ffffff;
					line-height: 1.7;
					margin-bottom: 2rem;
				}
				
				.values-content .video-card {
					width: 100%;
					max-width: none;
					margin: 0;
				}
				
				.values-content .video-wrap {
					aspect-ratio: 16 / 9;
					height: auto;
				}
				
				.values-visual {
					position: relative;
					height: 600px;
					display: flex;
					align-items: center;
					justify-content: center;
				}
				
				.animation-container {
					position: relative;
					width: 400px;
					height: 400px;
					border-radius: 50%;
					overflow: hidden;
					z-index: 2;
					border: 3px solid #ffffff;
					box-shadow: 0 20px 60px rgba(255, 255, 255, 0.2);
				}
				
				.values-animation {
					width: 100%;
					height: 100%;
					object-fit: cover;
					object-position: center;
					display: block;
				}
				
				.values-circle {
					position: absolute;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
					width: 500px;
					height: 500px;
					border: 2px solid rgba(255, 255, 255, 0.2);
					border-radius: 50%;
					z-index: 1;
					background: rgba(255, 255, 255, 0.02);
					backdrop-filter: blur(8px);
					box-shadow: 
						inset 0 0 20px rgba(255, 255, 255, 0.1),
						0 0 40px rgba(255, 255, 255, 0.05),
						0 0 80px rgba(255, 255, 255, 0.02);
				}
				
				.value-item {
					position: absolute;
					top: 50%;
					left: 50%;
					transform-origin: 0 0;
					z-index: 3;
					opacity: 1;
					transition: opacity 0.5s ease-in-out;
				}
				
				.value-item.visible {
					opacity: 1;
				}
				
				.value-icon {
					width: 50px;
					height: 50px;
					background: rgba(255, 255, 255, 0.1);
					border: 2px solid #ffffff;
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					backdrop-filter: blur(10px);
					opacity: 1;
					animation: iconPulse 3s ease-in-out infinite;
					cursor: pointer;
					transition: all 0.3s ease;
					position: relative;
					z-index: 10;
					transform-style: preserve-3d;
				}

				.value-icon:hover,
				.value-icon.selected {
					transform: scale(1.2);
					box-shadow: 0 0 30px currentColor;
					z-index: 20;
				}

				.value-icon:hover svg,
				.value-icon.selected svg {
					animation: iconFlip360 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
				}

				@keyframes iconFlip360 {
					0% {
						transform: rotateY(0deg);
					}
					50% {
						transform: rotateY(180deg);
					}
					100% {
						transform: rotateY(360deg);
					}
				}

				.value-icon.hardwork:hover {
					border-color: #ec4899;
					color: #ec4899;
					background: rgba(236, 72, 153, 0.3);
				}

				.value-icon.coding:hover {
					border-color: #10b981;
					color: #10b981;
					background: rgba(16, 185, 129, 0.3);
				}

				.value-icon.teamwork:hover {
					border-color: #3b82f6;
					color: #3b82f6;
					background: rgba(59, 130, 246, 0.3);
				}

				.value-icon.excellence:hover {
					border-color: #f59e0b;
					color: #f59e0b;
					background: rgba(245, 158, 11, 0.3);
				}

				.value-icon.innovation:hover {
					border-color: #8b5cf6;
					color: #8b5cf6;
					background: rgba(139, 92, 246, 0.3);
				}

				.value-icon.growth:hover {
					border-color: #06b6d4;
					color: #06b6d4;
					background: rgba(6, 182, 212, 0.3);
				}

				.value-tooltip {
					position: absolute;
					top: -100px;
					left: 50%;
					transform: translateX(-50%);
					background: rgba(0, 0, 0, 0.95);
					color: #ffffff;
					padding: 1rem 1.5rem;
					border-radius: 12px;
					font-size: 0.875rem;
					font-weight: 500;
					white-space: normal;
					opacity: 0;
					pointer-events: none;
					transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
					z-index: 30;
					backdrop-filter: blur(10px);
					border: 1px solid rgba(255, 255, 255, 0.2);
					max-width: 300px;
					text-align: center;
					line-height: 1.4;
					box-shadow: 
						0 8px 25px rgba(0, 0, 0, 0.3),
						0 0 0 1px rgba(255, 255, 255, 0.1);
				}

				.app.color-mode .value-tooltip {
					background: rgba(255, 255, 255, 0.95);
					color: #000000;
					border: 1px solid rgba(0, 0, 0, 0.2);
				}

				.value-icon:hover .value-tooltip {
					opacity: 1;
					transform: translateX(-50%) translateY(-5px);
				}

				.tooltip-title {
					font-weight: 700;
					font-size: 1rem;
					margin-bottom: 0.5rem;
					color: #ffffff;
				}

				.tooltip-description {
					font-size: 0.8rem;
					line-height: 1.3;
					color: rgba(255, 255, 255, 0.9);
				}

				.app.color-mode .tooltip-title {
					color: #000000;
				}

				.app.color-mode .tooltip-description {
					color: rgba(0, 0, 0, 0.8);
				}

				/* Flappy Bird Skills Section Styles */
				.skills-flappy-section {
					padding: 6rem 0;
					position: relative;
					background: transparent;
				}

				.flappy-game-wrapper {
					max-width: 1200px;
					width: 100%;
					margin: 3rem auto 0;
					position: relative;
				}

				/* Instructions */
				.flappy-instructions {
					position: absolute;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
					z-index: 100;
					background: rgba(0, 0, 0, 0.9);
					border: 4px solid #4CAF50;
					border-radius: 16px;
					padding: 2rem 3rem;
					text-align: center;
					backdrop-filter: blur(10px);
				}

				.instructions-content h3 {
					font-size: 2rem;
					color: #4CAF50;
					margin: 0 0 1rem 0;
					text-transform: uppercase;
					font-weight: 900;
				}

				.instructions-content p {
					color: #ffffff;
					font-size: 1.1rem;
					margin: 0.5rem 0;
				}

				.spacebar-hint {
					margin-top: 1.5rem;
					font-size: 1.5rem;
					color: #FFD700;
					font-weight: 700;
					background: rgba(255, 215, 0, 0.2);
					padding: 1rem 2rem;
					border-radius: 8px;
					border: 2px solid #FFD700;
					display: inline-block;
				}

				/* Game Over Screen */
				.flappy-game-over {
					position: absolute;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
					z-index: 100;
					background: rgba(0, 0, 0, 0.95);
					border: 4px solid #FFD700;
					border-radius: 16px;
					padding: 2rem 3rem;
					text-align: center;
					backdrop-filter: blur(10px);
				}

				.game-over-content h3 {
					font-size: 2.5rem;
					color: #FFD700;
					margin: 0 0 1rem 0;
					text-transform: uppercase;
					font-weight: 900;
				}

				.game-over-content p {
					color: #ffffff;
					font-size: 1.2rem;
					margin: 0.5rem 0;
				}

				.flappy-btn-restart {
					margin-top: 1.5rem;
					background: #4CAF50;
					border: 3px solid #2E7D32;
					color: white;
					padding: 1rem 2rem;
					font-size: 1rem;
					font-weight: 700;
					text-transform: uppercase;
					cursor: pointer;
					border-radius: 8px;
					transition: all 0.3s ease;
				}

				.flappy-btn-restart:hover {
					background: #66BB6A;
					transform: scale(1.05);
				}

				/* Game Area */
				.flappy-game-area {
					position: relative;
					background: #000000;
					border: 4px solid #4A90E2;
					border-radius: 12px;
					padding: 0;
					min-height: 600px;
					overflow: visible;
					box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
					user-select: none;
				}

				/* Sky Background */
				.flappy-sky {
					position: relative;
					width: 100%;
					height: 100%;
					min-height: 600px;
					background: #000000;
					overflow: hidden;
				}

				/* Clouds */
				.flappy-cloud {
					position: absolute;
					background: rgba(255, 255, 255, 0.8);
					border-radius: 50px;
					opacity: 0.7;
					animation: cloudFloat 20s infinite linear;
				}

				.cloud-1 {
					width: 80px;
					height: 40px;
					top: 10%;
					left: 10%;
					animation-duration: 25s;
				}

				.cloud-2 {
					width: 100px;
					height: 50px;
					top: 20%;
					left: 50%;
					animation-duration: 30s;
				}

				.cloud-3 {
					width: 60px;
					height: 30px;
					top: 5%;
					left: 80%;
					animation-duration: 20s;
				}

				@keyframes cloudFloat {
					from { transform: translateX(-100px); }
					to { transform: translateX(calc(100vw + 100px)); }
				}

				/* Flappy Bird Character */
				.flappy-bird {
					position: absolute;
					width: 60px;
					height: 60px;
					z-index: 20;
					transition: transform 0.1s ease;
					animation: birdFlap 0.3s infinite;
				}

				.flappy-bird.crashed {
					animation: birdCrash 0.5s ease forwards;
				}

				@keyframes birdCrash {
					0% { transform: rotate(0deg); }
					100% { transform: rotate(90deg) translateY(100px); }
				}

				.flappy-bird-face {
					width: 100%;
					height: 100%;
					object-fit: cover;
					border-radius: 50%;
					border: 3px solid #FFD700;
					box-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
					position: relative;
					z-index: 2;
				}

				.flappy-wings {
					position: absolute;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
					width: 100%;
					height: 100%;
					z-index: 1;
				}

				.wing {
					position: absolute;
					width: 20px;
					height: 15px;
					background: rgba(255, 215, 0, 0.6);
					border-radius: 50%;
					top: 50%;
					transform: translateY(-50%);
				}

				.wing-left {
					left: -10px;
					animation: wingFlapLeft 0.3s infinite;
				}

				.wing-right {
					right: -10px;
					animation: wingFlapRight 0.3s infinite;
				}

				@keyframes birdFlap {
					0%, 100% { transform: rotate(-5deg); }
					50% { transform: rotate(5deg); }
				}

				@keyframes wingFlapLeft {
					0%, 100% { transform: translateY(-50%) rotate(-20deg); }
					50% { transform: translateY(-50%) rotate(20deg); }
				}

				@keyframes wingFlapRight {
					0%, 100% { transform: translateY(-50%) rotate(20deg); }
					50% { transform: translateY(-50%) rotate(-20deg); }
				}

				/* Pipes Container */
				.pipes-container {
					position: absolute;
					width: 100%;
					height: 100%;
					top: 0;
					left: 0;
					overflow: visible;
				}

				/* Pipes (Skills) */
				.flappy-pipe {
					position: absolute;
					width: 80px;
					height: 100%;
					z-index: 10;
					pointer-events: none;
					cursor: default;
				}

				.pipe-segment {
					position: absolute;
					width: 100%;
					left: 0;
					pointer-events: none;
					background: linear-gradient(to right, #4CAF50 0%, #45a049 50%, #4CAF50 100%);
					border-left: 4px solid #2E7D32;
					border-right: 4px solid #2E7D32;
					display: flex;
					flex-direction: column;
				}

				.pipe-top {
					top: 0;
				}

				.pipe-bottom {
					bottom: 60px;
				}

				.pipe-cap {
					width: 100%;
					height: 30px;
					background: linear-gradient(to right, #66BB6A 0%, #4CAF50 50%, #66BB6A 100%);
					border-left: 4px solid #2E7D32;
					border-right: 4px solid #2E7D32;
					border-top: 4px solid #2E7D32;
					border-radius: 8px 8px 0 0;
					box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.3);
					flex-shrink: 0;
				}

				.pipe-bottom .pipe-cap {
					border-radius: 0 0 8px 8px;
					border-top: none;
					border-bottom: 4px solid #2E7D32;
					box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
					order: 2;
				}

				.pipe-body {
					flex: 1;
					min-height: 50px;
					background: repeating-linear-gradient(
						90deg,
						#4CAF50 0px,
						#4CAF50 10px,
						#45a049 10px,
						#45a049 20px
					);
					display: flex;
					align-items: center;
					justify-content: center;
					position: relative;
				}

				.pipe-bottom .pipe-body {
					order: 1;
				}

				.pipe-gap {
					position: absolute;
					width: 100%;
					left: 0;
					z-index: 15;
					display: flex;
					align-items: center;
					justify-content: center;
					pointer-events: none;
					cursor: default;
				}

				.gap-label {
					background: rgba(255, 255, 255, 0.98);
					color: #1B5E20;
					padding: 0.6rem 1.2rem;
					border-radius: 10px;
					font-size: 0.95rem;
					font-weight: 900;
					text-transform: uppercase;
					border: 3px solid #2E7D32;
					box-shadow: 0 0 15px rgba(255, 255, 255, 1), 0 4px 10px rgba(0, 0, 0, 0.3);
					white-space: nowrap;
					position: absolute;
					left: 50%;
					z-index: 30;
					letter-spacing: 1px;
					text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
					min-width: max-content;
					pointer-events: none;
				}

				.pipe-skill-icon {
					width: 40px;
					height: 40px;
					background: rgba(255, 255, 255, 0.9);
					border-radius: 8px;
					display: flex;
					align-items: center;
					justify-content: center;
					color: var(--skill-color);
					border: 2px solid var(--skill-color);
					box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
				}

				.flappy-pipe.current {
					animation: pipePulse 1s infinite;
				}

				.flappy-pipe.collected {
					opacity: 0.5;
					filter: grayscale(50%);
				}

				.pipe-collected-effect {
					position: absolute;
					left: 50%;
					transform: translateX(-50%) translateY(-50%);
					width: 60px;
					height: 60px;
					display: flex;
					align-items: center;
					justify-content: center;
					z-index: 25;
					pointer-events: none;
				}

				.collected-check {
					width: 40px;
					height: 40px;
					background: #4CAF50;
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					color: white;
					font-size: 24px;
					font-weight: 900;
					box-shadow: 0 0 20px rgba(76, 175, 80, 0.8);
					animation: checkPop 0.5s ease;
				}

				@keyframes pipePulse {
					0%, 100% { transform: scaleX(1); }
					50% { transform: scaleX(1.05); }
				}

				@keyframes checkPop {
					0% { transform: scale(0); }
					50% { transform: scale(1.2); }
					100% { transform: scale(1); }
				}

				/* Ground */
				.flappy-ground {
					position: absolute;
					bottom: 0;
					left: 0;
					width: 100%;
					height: 60px;
					background: linear-gradient(to bottom, #8B4513 0%, #654321 100%);
					border-top: 4px solid #5D4037;
					z-index: 5;
				}

				.flappy-ground::before {
					content: '';
					position: absolute;
					top: 0;
					left: 0;
					width: 100%;
					height: 10px;
					background: repeating-linear-gradient(
						90deg,
						#8B4513 0px,
						#8B4513 20px,
						#654321 20px,
						#654321 40px
					);
				}

				/* Skill Info Card */
				.flappy-skill-info {
					position: absolute;
					bottom: 2rem;
					left: 50%;
					transform: translateX(-50%);
					width: 90%;
					max-width: 500px;
					z-index: 50;
				}

				.flappy-skill-card {
					background: rgba(0, 0, 0, 0.95);
					border: 3px solid #4CAF50;
					border-radius: 16px;
					padding: 1.5rem 2rem;
					display: flex;
					align-items: center;
					gap: 1.5rem;
					backdrop-filter: blur(10px);
					box-shadow: 0 10px 30px rgba(76, 175, 80, 0.5);
					transition: all 0.3s ease;
				}

				.flappy-skill-card.collected {
					border-color: #FFD700;
					box-shadow: 0 10px 30px rgba(255, 215, 0, 0.5);
				}

				.flappy-skill-icon {
					width: 60px;
					height: 60px;
					background: rgba(76, 175, 80, 0.2);
					border-radius: 12px;
					display: flex;
					align-items: center;
					justify-content: center;
					border: 2px solid #4CAF50;
					color: #4CAF50;
					flex-shrink: 0;
				}

				.flappy-skill-card.collected .flappy-skill-icon {
					background: rgba(255, 215, 0, 0.2);
					border-color: #FFD700;
					color: #FFD700;
				}

				.flappy-skill-details {
					flex: 1;
				}

				.flappy-skill-name {
					font-size: 1.5rem;
					font-weight: 900;
					color: #4CAF50;
					margin: 0 0 0.5rem 0;
					text-transform: uppercase;
				}

				.flappy-skill-category {
					font-size: 0.9rem;
					color: rgba(255, 255, 255, 0.7);
					font-weight: 600;
					text-transform: uppercase;
					display: block;
					margin-bottom: 0.5rem;
				}

				.flappy-skill-description {
					font-size: 0.95rem;
					color: rgba(255, 255, 255, 0.9);
					font-weight: 600;
					margin-top: 0.5rem;
				}

				.flappy-skill-card.collected .flappy-skill-name {
					color: #FFD700;
				}

				.flappy-skill-card.collected .flappy-skill-description {
					color: #FFD700;
				}

				/* Score Display */
				.flappy-score {
					position: absolute;
					top: 2rem;
					right: 2rem;
					z-index: 50;
					background: rgba(0, 0, 0, 0.8);
					border: 3px solid #4CAF50;
					border-radius: 12px;
					padding: 1rem 1.5rem;
					backdrop-filter: blur(10px);
				}

				.score-item {
					display: flex;
					flex-direction: column;
					align-items: center;
					gap: 0.5rem;
				}

				.score-label {
					font-size: 0.9rem;
					color: #4CAF50;
					font-weight: 700;
					text-transform: uppercase;
					letter-spacing: 1px;
				}

				.score-value {
					font-size: 2rem;
					color: #FFD700;
					font-weight: 900;
					font-family: 'Courier New', monospace;
				}

				/* End Flag */
				.flappy-flag {
					position: absolute;
					bottom: 60px;
					z-index: 15;
				}

				.flag-pole {
					width: 8px;
					height: 200px;
					background: #8B4513;
					border: 2px solid #654321;
					position: relative;
				}

				.flag-banner {
					position: absolute;
					top: 0;
					left: 8px;
					width: 120px;
					height: 80px;
					background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
					border: 3px solid #FF8C00;
					clip-path: polygon(0 0, 100% 0, 100% 70%, 0 100%);
					display: flex;
					align-items: center;
					justify-content: center;
					box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
					animation: flagWave 2s ease-in-out infinite;
				}

				.flag-text {
					font-size: 1.2rem;
					font-weight: 900;
					color: #000000;
					text-transform: uppercase;
					letter-spacing: 2px;
					transform: rotate(-5deg);
				}

				@keyframes flagWave {
					0%, 100% { transform: rotateY(0deg); }
					50% { transform: rotateY(10deg); }
				}

				/* Light Mode */
				.app.color-mode .skills-flappy-section {
					background: transparent;
				}

				.app.color-mode .flappy-game-area {
					background: #ffffff;
					border-color: #4CAF50;
				}

				.app.color-mode .flappy-sky {
					background: #ffffff;
				}

				.app.color-mode .flappy-skill-card {
					background: rgba(255, 255, 255, 0.98);
				}

				.app.color-mode .flappy-instructions {
					background: rgba(255, 255, 255, 0.95);
					border-color: #4CAF50;
				}

				.app.color-mode .instructions-content p {
					color: #000000;
				}

				.app.color-mode .spacebar-hint {
					color: #000000;
					background: rgba(0, 0, 0, 0.1);
					border-color: #000000;
				}

				.app.color-mode .flappy-game-over {
					background: rgba(255, 255, 255, 0.95);
					border-color: #FFD700;
				}

				.app.color-mode .game-over-content p {
					color: #000000;
				}

				.app.color-mode .pipe-skill-icon {
					background: rgba(255, 255, 255, 0.95);
					border: 2px solid var(--skill-color);
					color: var(--skill-color);
					box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
				}

				.app.color-mode .pipe-skill-icon svg {
					color: var(--skill-color);
					fill: var(--skill-color);
				}

				/* Responsive */
				@media (max-width: 768px) {
					.flappy-game-area {
						min-height: 400px;
					}

					.flappy-bird {
						width: 40px;
						height: 40px;
					}

					.flappy-pipe {
						width: 60px;
					}

					.flappy-controls {
						flex-direction: column;
					}

					.flappy-btn {
						width: 100%;
					}
				}

				/* Game Style Skill Card */
				.skill-game-card {
					flex: 0 0 100%;
					width: 100%;
					max-width: 100%;
					min-width: 0;
					margin-right: 0;
					padding: 2rem;
					position: relative;
					cursor: pointer;
					box-sizing: border-box;
				}

				.skill-game-card-inner {
					background: rgba(20, 20, 25, 0.95);
					border: 3px solid rgba(255, 255, 255, 0.2);
					border-radius: 24px;
					padding: 2rem;
					display: grid;
					grid-template-columns: 250px 1fr;
					gap: 2rem;
					position: relative;
					overflow: hidden;
					transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
					backdrop-filter: blur(10px);
					-webkit-backdrop-filter: blur(10px);
				}

				.skill-game-card.active .skill-game-card-inner {
					border-color: var(--skill-color);
					box-shadow: 
						0 0 30px rgba(var(--skill-color-rgb, 97, 218, 251), 0.3),
						0 10px 40px rgba(0, 0, 0, 0.4);
					transform: scale(1.02);
				}

				.skill-game-card.selected .skill-game-card-inner {
					border-color: var(--skill-color);
					box-shadow: 
						0 0 50px rgba(var(--skill-color-rgb, 97, 218, 251), 0.5),
						0 15px 50px rgba(0, 0, 0, 0.5);
					animation: skillPulse 0.6s ease;
				}

				/* Profile Section */
				.skill-profile-section {
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					gap: 1rem;
				}

				.skill-profile-image-wrapper {
					position: relative;
					width: 180px;
					height: 180px;
					border-radius: 50%;
					overflow: hidden;
					border: 4px solid var(--skill-color);
					box-shadow: 0 0 30px rgba(var(--skill-color-rgb, 97, 218, 251), 0.4);
					transition: all 0.4s ease;
				}

				.skill-game-card.active .skill-profile-image-wrapper {
					transform: scale(1.05);
					box-shadow: 0 0 40px rgba(var(--skill-color-rgb, 97, 218, 251), 0.6);
				}

				.skill-profile-image {
					width: 100%;
					height: 100%;
					object-fit: cover;
					display: block;
				}

				.skill-profile-glow {
					position: absolute;
					top: -50%;
					left: -50%;
					width: 200%;
					height: 200%;
					background: radial-gradient(circle, var(--skill-color) 0%, transparent 70%);
					opacity: 0.3;
					animation: skillGlowRotate 3s linear infinite;
				}

				.skill-profile-name {
					font-size: 1.5rem;
					font-weight: 900;
					color: #ffffff;
					text-transform: uppercase;
					letter-spacing: 2px;
				}

				.skill-profile-level {
					font-size: 0.9rem;
					color: var(--skill-color);
					font-weight: 700;
					text-transform: uppercase;
					letter-spacing: 1px;
					padding: 0.5rem 1rem;
					background: rgba(var(--skill-color-rgb, 97, 218, 251), 0.1);
					border-radius: 20px;
					border: 1px solid var(--skill-color);
				}

				/* Skill Card Section */
				.skill-card-section {
					display: flex;
					flex-direction: column;
					justify-content: space-between;
					gap: 1.5rem;
				}

				.skill-card-header {
					display: flex;
					align-items: center;
					gap: 1.5rem;
				}

				.skill-card-icon-wrapper {
					width: 80px;
					height: 80px;
					border-radius: 16px;
					display: flex;
					align-items: center;
					justify-content: center;
					background: rgba(var(--skill-color-rgb, 97, 218, 251), 0.2);
					color: var(--skill-color);
					border: 2px solid var(--skill-color);
					transition: all 0.3s ease;
				}

				.skill-game-card.active .skill-card-icon-wrapper {
					background: var(--skill-color);
					color: #ffffff;
					transform: rotate(5deg) scale(1.1);
				}

				.skill-card-info {
					flex: 1;
				}

				.skill-card-name {
					font-size: 2rem;
					font-weight: 900;
					color: #ffffff;
					margin: 0 0 0.5rem 0;
					text-transform: uppercase;
					letter-spacing: 1px;
				}

				.skill-card-category {
					font-size: 0.9rem;
					color: var(--skill-color);
					font-weight: 600;
					text-transform: uppercase;
					letter-spacing: 1px;
				}

				.skill-card-stats {
					display: flex;
					flex-direction: column;
					gap: 1rem;
				}

				.skill-stat {
					display: flex;
					flex-direction: column;
					gap: 0.5rem;
				}

				.skill-stat-label {
					font-size: 0.85rem;
					color: rgba(255, 255, 255, 0.7);
					font-weight: 600;
					text-transform: uppercase;
					letter-spacing: 0.5px;
				}

				.skill-stat-bar {
					height: 8px;
					background: rgba(255, 255, 255, 0.1);
					border-radius: 4px;
					overflow: hidden;
					position: relative;
				}

				.skill-stat-fill {
					height: 100%;
					background: linear-gradient(90deg, var(--skill-color), rgba(var(--skill-color-rgb, 97, 218, 251), 0.6));
					border-radius: 4px;
					transition: width 0.6s ease;
					box-shadow: 0 0 10px var(--skill-color);
				}

				/* Skill Card Effect */
				.skill-card-effect {
					position: absolute;
					top: 0;
					left: 0;
					right: 0;
					bottom: 0;
					pointer-events: none;
					overflow: hidden;
					border-radius: 24px;
				}

				.skill-effect-particles {
					position: absolute;
					width: 100%;
					height: 100%;
				}

				.skill-particle {
					position: absolute;
					width: 8px;
					height: 8px;
					background: var(--skill-color);
					border-radius: 50%;
					animation: skillParticleFloat 1.5s ease-out forwards;
					box-shadow: 0 0 10px var(--skill-color);
				}

				.skill-effect-text {
					position: absolute;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
					font-size: 3rem;
					font-weight: 900;
					color: var(--skill-color);
					text-transform: uppercase;
					letter-spacing: 4px;
					text-shadow: 0 0 20px var(--skill-color);
					animation: skillTextPulse 0.6s ease;
				}

				/* Animations */
				@keyframes skillPulse {
					0%, 100% { transform: scale(1); }
					50% { transform: scale(1.05); }
				}

				@keyframes skillGlowRotate {
					from { transform: rotate(0deg); }
					to { transform: rotate(360deg); }
				}

				@keyframes skillParticleFloat {
					0% {
						opacity: 1;
						transform: translate(-50%, -50%) translate(0, 0) scale(1);
					}
					100% {
						opacity: 0;
						transform: translate(-50%, -50%) translate(var(--tx, 0), var(--ty, -100px)) scale(0);
					}
				}

				@keyframes skillTextPulse {
					0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
					50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
					100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
				}

				/* Light Mode Adjustments */
				.app.color-mode .skill-game-card-inner {
					background: #faf9f6;
					border-color: rgba(0, 0, 0, 0.2);
				}

				.app.color-mode .skill-profile-name,
				.app.color-mode .skill-card-name {
					color: #1a1a1a;
				}

				.app.color-mode .skill-stat-label {
					color: rgba(0, 0, 0, 0.7);
				}

				.app.color-mode .skill-stat-bar {
					background: rgba(0, 0, 0, 0.1);
				}

				/* Responsive */
				@media (max-width: 960px) {
					.skills-game-wrapper {
						padding: 0 60px;
					}

					.skill-game-card-inner {
						grid-template-columns: 1fr;
						gap: 1.5rem;
					}

					.skill-profile-image-wrapper {
						width: 120px;
						height: 120px;
					}

					.skill-card-name {
						font-size: 1.5rem;
					}

					.skill-effect-text {
						font-size: 2rem;
					}
				}

				@media (max-width: 720px) {
					.skills-section {
						padding: 4rem 0;
					}

					.skills-grid {
						gap: 0.75rem;
					}

					.skill-card {
						width: 100px;
					}

					.skills-category-title {
						font-size: 1.25rem;
					}

					.skill-icon-wrapper {
						width: 40px;
						height: 40px;
					}

					.skill-name {
						font-size: 0.8rem;
					}
				}


				
				@keyframes fadeInOnOrbit {
					0% { opacity: 0; }
					90% { opacity: 0; }
					100% { opacity: 1; }
				}
				
				@keyframes orbit {
					0% {
						transform: translate(-50%, -50%) rotate(0deg) translateX(250px) rotate(0deg);
					}
					100% {
						transform: translate(-50%, -50%) rotate(360deg) translateX(250px) rotate(-360deg);
					}
				}




				@keyframes iconPulse {
					0%, 100% {
						box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.3);
					}
					50% {
						box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
					}
				}
				
				.video-section { padding: 4rem 0; }
				.video-card { 
					position: relative; 
					border: 1px solid #ffffff; 
					border-radius: 16px; 
					overflow: hidden; 
					background: #000000; 
					box-shadow: 0 10px 30px rgba(255, 255, 255, 0.1);
					width: 50%;
					margin: 0 auto;
				}
				.video-wrap { position: relative; aspect-ratio: 16 / 9; }
				.video-frame { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
				.video-card::after { display: none; }
				
				.animation-gif {
					width: 100%;
					height: 100%;
					object-fit: cover;
					object-position: center;
					display: block;
				}
				
				/* Browser Window Frame */
				.browser-frame {
					position: relative;
					background: #2d2d2d;
					border-radius: 12px 12px 0 0;
					padding: 0.75rem 1rem;
					display: flex;
					align-items: center;
					gap: 0.75rem;
					border-bottom: 1px solid #404040;
				}
				
				.browser-controls {
					display: flex;
					gap: 0.5rem;
				}
				
				.browser-dot {
					width: 12px;
					height: 12px;
					border-radius: 50%;
				}
				
				.browser-dot.red {
					background: #ff5f57;
				}
				
				.browser-dot.yellow {
					background: #ffbd2e;
				}
				
				.browser-dot.green {
					background: #28ca42;
				}
				
				.browser-title {
					flex: 1;
					text-align: center;
					color: #ffffff;
					font-size: 0.8rem;
					font-weight: 500;
					opacity: 0.8;
				}
				
				/* Footer */
				.site-footer {
					padding: 2rem 0;
					border-top: 1px solid #ffffff;
					text-align: center;
				}
				
				/* Responsive */
				@media (max-width: 1024px) {
					.chat-toggle {
						top: 70px;
						right: -220px;
					}
					
					.thinking-bubbles {
						top: 50px;
						right: -132px;
					}
					
					.chat-toggle-text {
						top: 100px;
						right: -270px;
						font-size: 0.65rem;
					}
				}
				
				/* Desktop-only message - hidden by default */
				.desktop-only-message {
					display: none;
				}
				
				/* Mobile and Tablet: Hide all sections except contact */
				@media (max-width: 1024px) {
					/* Hide intro overlay on mobile */
					.intro-overlay {
						display: none !important;
					}
					
					/* Hide scroll progress on mobile */
					.scroll-progress {
						display: none !important;
					}
					
					/* Hide chat interface on mobile */
					.chat-bubble-container {
						display: none !important;
					}
					
					/* Hide navigation on mobile */
					.left-nav {
						display: none !important;
					}
					
					.color-toggle {
						display: none !important;
					}
					
					/* Hide all sections except contact */
					.section:not(#contact) {
						display: none !important;
					}
					
					/* Hide footer on mobile */
					.site-footer {
						display: none !important;
					}
					
					/* Show desktop-only message */
					.desktop-only-message {
						display: block !important;
						text-align: center;
						padding: 3rem 2.5rem;
						background: rgba(255, 255, 255, 0.05);
						border: 1px solid rgba(255, 255, 255, 0.1);
						border-radius: 12px;
						margin: 2rem auto 3rem auto;
						max-width: 90%;
					}
					
					.desktop-only-message h3 {
						font-size: clamp(1.5rem, 4vw, 2rem);
						margin-bottom: 1.5rem;
						color: #ffffff;
						line-height: 1.3;
					}
					
					.desktop-only-message p {
						font-size: clamp(1rem, 2.5vw, 1.2rem);
						color: rgba(255, 255, 255, 0.8);
						line-height: 1.7;
					}
					
					.app.color-mode .desktop-only-message {
						background: rgba(0, 0, 0, 0.05);
						border-color: rgba(0, 0, 0, 0.1);
					}
					
					.app.color-mode .desktop-only-message h3 {
						color: #000000;
					}
					
					.app.color-mode .desktop-only-message p {
						color: rgba(0, 0, 0, 0.8);
					}
					
					/* Ensure contact section is visible and centered */
					#contact {
						display: flex !important;
						align-items: center;
						justify-content: center;
						min-height: 100vh;
						padding: 2rem 0;
					}
					
					#contact .container {
						width: 100%;
						max-width: 100%;
						padding: 0 1.5rem;
					}
					
					#contact h2 {
						text-align: center;
						margin-bottom: 3rem;
						font-size: clamp(2rem, 5vw, 2.5rem);
						line-height: 1.2;
					}
					
					.business-card-container {
						display: flex;
						justify-content: center;
						align-items: center;
						width: 100%;
						padding: 1rem;
					}
					
					.business-card {
						width: 100%;
						max-width: 300px;
						height: auto;
						min-height: 175px;
					}
					
					.business-card-content {
						padding: 1.25rem 1rem !important;
						gap: 1rem;
						display: flex;
						flex-direction: column;
						justify-content: space-between;
					}
					
					.business-card-top {
						gap: 1rem !important;
						margin-bottom: 0.75rem;
					}
					
					.business-card-profile {
						width: 50px !important;
						height: 50px !important;
						flex-shrink: 0;
					}
					
					.business-card-name {
						font-size: 1.2rem !important;
						margin-bottom: 0.4rem !important;
						line-height: 1.2;
					}
					
					.business-card-title {
						font-size: 0.7rem !important;
						margin-bottom: 0.25rem !important;
						line-height: 1.3;
					}
					
					.business-card-location {
						font-size: 0.65rem !important;
						line-height: 1.3;
					}
					
					.business-card-contact {
						gap: 0.6rem !important;
						margin-top: 1rem !important;
					}
					
					.contact-item {
						gap: 0.5rem !important;
						font-size: 0.65rem !important;
						padding: 0.25rem 0;
						cursor: pointer;
						line-height: 1.4;
					}
					
					.contact-icon {
						width: 12px !important;
						height: 12px !important;
						flex-shrink: 0;
					}
					
					.business-card-signature {
						bottom: 1rem !important;
						right: 1rem !important;
						width: 100px !important;
						height: 40px !important;
					}
					
					.business-card-quote {
						font-size: 0.75rem !important;
					}
					
					/* Mobile only - smaller quote text */
				@media (max-width: 768px) {
						.business-card-quote {
							font-size: 0.7rem !important;
						}
					}
					
					/* Original mobile styles continue below */
					.left-nav {
						left: 0.5rem;
						padding: 0.5rem 0.3rem;
						gap: 0.3rem;
					}
					
					.nav-logo {
						width: 40px;
						height: 40px;
						padding: 0.5rem;
						font-size: 1.1rem;
					}
					
					.nav-theme-toggle {
						width: 40px;
						height: 40px;
						padding: 0.5rem;
					}
					
					.nav-item {
						width: 40px;
						height: 40px;
						padding: 0.5rem;
					}
					
					.section h2 {
						font-size: 2.2rem;
						line-height: 1.2;
					}
					
					.values-content h2 {
						font-size: 2.2rem;
						text-align: center;
						line-height: 1.2;
					}
					
					.experience-section h2 {
						font-size: 2rem;
						line-height: 1.2;
					}
					
					.values-container {
						grid-template-columns: 1fr;
						gap: 2rem;
						text-align: center;
						padding: 0 1rem;
					}
					
					.values-visual {
						height: 400px;
						margin: 2rem 0;
					}
					
					.values-image {
						width: 250px;
						height: 250px;
					}
					
					.pixel-trace-container {
						width: 250px;
						height: 250px;
					}
					
					.values-circle {
						width: 300px;
						height: 300px;
						border-color: rgba(0, 0, 0, 0.2);
						background: rgba(0, 0, 0, 0.02);
						box-shadow: 
							inset 0 0 20px rgba(0, 0, 0, 0.1),
							0 0 40px rgba(0, 0, 0, 0.05),
							0 0 80px rgba(0, 0, 0, 0.02);
					}
					
					.value-icon {
						width: 35px;
						height: 35px;
					}

					.value-label {
						font-size: 0.75rem;
					}
					
					.hero-wrap {
						grid-template-columns: 1fr;
						gap: 2rem;
						text-align: center;
						padding: 0 1rem;
					}
					
					.hero-wrap > div:first-child {
						margin-left: 0 !important;
					}
					
					.hero-visual {
						height: 400px;
						padding: 1rem;
						text-align: center;
					}
					
					.photo-wrap {
						background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.02) 0%, transparent 50%),
									radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.01) 0%, transparent 50%);
						animation: portraitGlowStatic 4s ease-in-out infinite alternate;
						width: 280px;
						height: 280px;
						margin: 0 auto;
					}
					
					.cta-row {
						justify-content: center;
					}
					
					.timeline {
						padding-left: 1.5rem;
					}
					
					.timeline-marker {
						left: -2rem;
					}
					
					.timeline-content {
						padding: 1.25rem 1.5rem;
					}
					
					.chat-bubble-container {
						position: fixed;
						top: 0;
						left: 0;
						width: 100vw;
						height: 100vh;
						z-index: 1000;
					}
					
					.chat-toggle {
						position: fixed;
						top: 20px;
						right: 20px;
						width: 50px;
						height: 50px;
						padding: 0.75rem;
						z-index: 1001;
					}
					
					.thinking-bubbles {
						top: 15px;
						right: 15px;
					}
					
					.chat-toggle-text {
						display: none;
					}
					
					.bubble-1 {
						width: 6px;
						height: 6px;
					}
					
					.bubble-2 {
						width: 5px;
						height: 5px;
						top: 10px;
						left: -6px;
					}
					
					.bubble-3 {
						width: 4px;
						height: 4px;
						top: 20px;
						left: -12px;
					}
					
					.bubble-4 {
						width: 3px;
						height: 3px;
						top: 30px;
						left: -18px;
					}
					
					.bubble-5 {
						width: 3px;
						height: 3px;
						top: 40px;
						left: -24px;
					}
					
					.bubble-6 {
						width: 2px;
						height: 2px;
						top: 50px;
						left: -30px;
					}
					
					.chat-bubble {
						width: 90vw;
						height: 80vh;
						max-width: 400px;
						max-height: 600px;
						border-radius: 20px;
					}
					
					.chat-messages {
						max-height: 60vh;
						padding: 1rem;
					}
					
					.avatar-gif {
						width: 60px;
						height: 60px;
					}
					
					.chat-message {
						font-size: 0.9rem;
						line-height: 1.4;
						margin-bottom: 0.5rem;
					}
					
					.chat-input {
						font-size: 1rem;
						padding: 0.75rem;
					}
					
					.chat-send {
						padding: 0.75rem;
					}
					
					.container {
						width: 95%;
						padding: 0 1rem;
					}
					
					.section {
						padding: 3rem 0;
					}
					
					.hero {
						padding: 2rem 0;
					}
					
					.title {
						font-size: 2.5rem;
						line-height: 1.2;
					}
					
					.subtitle {
						font-size: 1.1rem;
						line-height: 1.4;
					}
					
					.button {
						padding: 0.75rem 1.5rem;
						font-size: 1rem;
					}
					
					.cta-row {
						flex-direction: column;
						gap: 1rem;
						align-items: center;
					}
					
					.chat-welcome {
						font-size: 0.8rem;
					}
					
					/* Projects Tablet */
					.projects-carousel {
						max-width: 400px;
						height: 400px;
					}
					
					.project-item {
						width: 280px;
					}
					
					.project-card {
						width: 100%;
						height: 440px;
						padding: 2rem;
					}
					
					.project-item:nth-child(1) {
						transform: rotateY(0deg) translateZ(180px);
					}

					.project-item:nth-child(2) {
						transform: rotateY(120deg) translateZ(180px);
					}

					.project-item:nth-child(3) {
						transform: rotateY(240deg) translateZ(180px);
					}
					
					.project-title {
						font-size: 1.3rem;
					}
					
					.project-description {
						font-size: 0.85rem;
					}
					
					.carousel-arrows {
						width: 40px;
						height: 40px;
					}
					
					.carousel-prev {
						left: -60px;
					}
					
					.carousel-next {
						right: -60px;
					}
				}
				
				@media (max-width: 480px) {
					.left-nav {
						left: 0.25rem;
						padding: 0.25rem 0.2rem;
						gap: 0.2rem;
					}
					
					.nav-logo {
						width: 35px;
						height: 35px;
						padding: 0.4rem;
						font-size: 1rem;
					}
					
					.nav-theme-toggle {
						width: 35px;
						height: 35px;
						padding: 0.4rem;
					}
					
					.nav-item {
						width: 35px;
						height: 35px;
						padding: 0.4rem;
					}
					
					.container {
						width: 98%;
						padding: 0 0.5rem;
					}
					
					.section h2 {
						font-size: 1.8rem;
						line-height: 1.2;
					}
					
					.title {
						font-size: 2rem;
						line-height: 1.2;
					}
					
					.subtitle {
						font-size: 1rem;
						line-height: 1.4;
					}
					
					.hero-visual {
						height: 300px;
					}
					
					.photo-wrap {
						width: 220px;
						height: 220px;
					}
					
					.values-visual {
						height: 300px;
					}
					
					.values-image {
						width: 200px;
						height: 200px;
					}
					
					.values-circle {
						width: 250px;
						height: 250px;
					}
					
					.chat-bubble {
						width: 95vw;
						height: 85vh;
						border-radius: 15px;
					}
					
					.chat-toggle {
						width: 45px;
						height: 45px;
						padding: 0.6rem;
					}
					
					.nav-logo {
						width: 40px;
						height: 40px;
						padding: 0.5rem;
						font-size: 1.1rem;
					}
					
					.nav-theme-toggle {
						width: 40px;
						height: 40px;
						padding: 0.5rem;
					}
					
					.nav-item {
						width: 40px;
						height: 40px;
						padding: 0.5rem;
					}
					
					.chat-toggle {
						top: 50px;
						right: -150px;
						width: 35px;
						height: 35px;
						padding: 0.4rem;
					}
					
					.thinking-bubbles {
						top: 25px;
						right: -62px;
					}
					
					.chat-toggle-text {
						top: 60px;
						right: -220px;
						font-size: 0.55rem;
					}
					
					.bubble-1 {
						width: 5px;
						height: 5px;
					}
					
					.bubble-2 {
						width: 4px;
						height: 4px;
						top: 8px;
						left: -5px;
					}
					
					.bubble-3 {
						width: 3px;
						height: 3px;
						top: 16px;
						left: -10px;
					}
					
					.bubble-4 {
						width: 3px;
						height: 3px;
						top: 24px;
						left: -15px;
					}
					
					.bubble-5 {
						width: 2px;
						height: 2px;
						top: 32px;
						left: -20px;
					}
					
					.bubble-6 {
						width: 2px;
						height: 2px;
						top: 40px;
						left: -25px;
					}
					
					.chat-bubble {
						width: 220px;
						height: 220px;
					}
					
					.chat-messages {
						max-height: none;
					}
					
					.chat-message {
						font-size: 0.65rem;
					}
					
					.chat-input {
						font-size: 0.65rem;
					}
					
					.chat-welcome {
						font-size: 0.75rem;
					}
					
					.avatar-gif {
						width: 70px;
						height: 70px;
					}
					
					/* Projects Mobile */
					.projects-carousel {
						max-width: 320px;
						height: 320px;
					}
					
					.project-item {
						width: 240px;
					}
					
					.project-card {
						width: 100%;
						height: 380px;
						padding: 1.5rem;
					}
					
					.project-item:nth-child(1) {
						transform: rotateY(0deg) translateZ(140px);
					}

					.project-item:nth-child(2) {
						transform: rotateY(120deg) translateZ(140px);
					}

					.project-item:nth-child(3) {
						transform: rotateY(240deg) translateZ(140px);
					}
					
					.project-title {
						font-size: 1.1rem;
					}
					
					.project-description {
						font-size: 0.8rem;
					}
					
					.project-image {
						width: 60px;
						height: 60px;
						font-size: 1.5rem;
					}
					
					.carousel-arrows {
						width: 35px;
						height: 35px;
					}
					
					.carousel-prev {
						left: -50px;
					}
					
					.carousel-next {
						right: -50px;
					}
				}
				
				/* Tablet Optimizations (iPad: 768px - 1024px) */
				@media (min-width: 768px) and (max-width: 1024px) {
					/* Improve touch targets - minimum 44x44px for iOS */
					.button, .nav-link, .theme-toggle, .chat-send, .chat-toggle {
						min-width: 44px;
						min-height: 44px;
						padding: 12px 16px;
					}
					
					/* Better spacing for tablet */
					.container {
						width: min(90%, 900px);
						padding: 0 2rem;
					}
					
					.section {
						padding: 4rem 0;
					}
					
					.hero {
						padding-top: 4rem;
						padding-bottom: 4rem;
					}
					
					/* Improved chat interface for tablet */
					.chat-interface {
						width: 75%;
						margin-left: 3rem;
						margin-top: 10rem;
						padding: 1rem;
						gap: 0.75rem;
					}
					
					.chat-messages {
						max-height: 12rem;
						padding: 0.5rem;
						gap: 0.5rem;
					}
					
					.chat-message {
						font-size: 1rem;
						line-height: 1.5;
						padding: 0.5rem 0;
					}
					
					.chat-input-container {
						gap: 0.5rem;
						padding: 0.5rem 0;
					}
					
					.chat-input {
						font-size: 1rem;
						padding: 0.75rem 1rem;
						min-height: 44px;
						border-radius: 12px;
					}
					
					.chat-send {
						min-width: 44px;
						min-height: 44px;
						padding: 0.75rem;
						border-radius: 50%;
					}
					
					.chat-welcome {
						font-size: 1rem;
						margin-bottom: 1rem;
						padding: 0.5rem;
					}
					
					.avatar-gif {
						width: 600px;
						height: 160px;
					}
					
					/* Better text sizing */
					.title {
						font-size: clamp(32px, 5vw, 40px);
						line-height: 1.2;
					}
					
					.subtitle {
						font-size: clamp(16px, 2.5vw, 20px);
						line-height: 1.5;
					}
					
					.section h2 {
						font-size: clamp(28px, 4vw, 36px);
						line-height: 1.3;
					}
					
					/* Improved navigation */
					.left-nav {
						left: 1rem;
						padding: 0.75rem 0.5rem;
						gap: 0.5rem;
					}
					
					.nav-item, .nav-theme-toggle, .nav-logo {
						width: 48px;
						height: 48px;
						padding: 0.75rem;
					}
					
					/* Better card spacing */
					.cards {
						grid-template-columns: repeat(2, minmax(0, 1fr));
						gap: 1.5rem;
					}
					
					.card {
						padding: 1.5rem;
					}
					
					/* Improved timeline */
					.timeline-card {
						padding: 2rem;
						max-width: 700px;
					}
					
					.timeline-content {
						padding: 1.5rem 2rem;
					}
					
					/* Better project carousel */
					.projects-carousel {
						max-width: 500px;
						height: 500px;
					}
					
					.project-item {
						width: 320px;
					}
					
					.project-card {
						padding: 2rem;
						height: 420px;
					}
					
					/* Improved chat bubble positioning */
					.chat-toggle {
						top: 1.5rem;
						right: 1.5rem;
						width: 56px;
						height: 56px;
						padding: 1rem;
					}
					
					.chat-bubble {
						width: 500px;
						height: 600px;
						max-width: 90vw;
						max-height: 85vh;
					}
					
					/* Better touch scrolling */
					.chat-messages,
					.timeline-content,
					.card {
						-webkit-overflow-scrolling: touch;
						overscroll-behavior: contain;
					}
					
					/* Improved spacing for values section */
					.values-container {
						grid-template-columns: repeat(2, minmax(0, 1fr));
						gap: 2rem;
						padding: 0 2rem;
					}
					
					.values-visual {
						min-height: 450px;
						margin: 3rem 0;
					}
					
					/* Better button spacing */
					.cta-row {
						gap: 1rem;
						flex-wrap: wrap;
					}
					
					.button {
						padding: 0.875rem 1.5rem;
						font-size: 1rem;
						min-height: 44px;
					}
					
					/* Improved hero visual */
					.hero-visual {
						height: clamp(400px, 50vh, 500px);
					}
					
					.orbit-a {
						width: 320px;
						height: 320px;
					}
					
					.orbit-b {
						width: 440px;
						height: 440px;
					}
					
					/* Better grid layouts */
					.grid-2 {
						grid-template-columns: 1fr;
						gap: 3rem;
					}
					
					.skills {
						grid-template-columns: repeat(2, minmax(0, 1fr));
						gap: 1rem;
					}
					
					/* Improved footer */
					.site-footer {
						padding: 3rem 0;
					}
					
					/* Better touch interactions */
					* {
						touch-action: manipulation;
					}
					
					/* Prevent text selection on interactive elements */
					.button, .nav-link, .chat-send, .chat-toggle {
						-webkit-user-select: none;
						user-select: none;
						-webkit-tap-highlight-color: rgba(96, 165, 250, 0.2);
					}
					
					/* Improved input focus states for tablet */
					.chat-input:focus {
						outline: 2px solid var(--brand);
						outline-offset: 2px;
					}
				}

				/* ====== LUMINA LABS (inside projects) ====== */
				/* Resume download icon */
				.resume-dl-wrap {
					position: relative;
					display: inline-block;
					margin-left: 0.4rem;
					vertical-align: middle;
				}
				.resume-dl {
					display: inline-flex;
					align-items: center;
					justify-content: center;
					color: rgba(255,255,255,0.7);
					text-decoration: none;
					transition: color 0.2s;
				}
				.resume-dl:hover { color: #fff; }
				.resume-dl svg {
					filter: drop-shadow(0 0 0.5px currentColor);
				}
				.app.color-mode .resume-dl { color: rgba(0,0,0,0.65); }
				.app.color-mode .resume-dl:hover { color: #000; }
				.resume-dl-tip-cursor {
					position: fixed;
					z-index: 10001;
					pointer-events: none;
					font-family: Arial, sans-serif;
					font-size: 0.72rem;
					font-weight: 800;
					letter-spacing: 0.05em;
					text-transform: uppercase;
					white-space: nowrap;
					padding: 5px 10px;
					border-radius: 5px;
					background: rgba(20, 20, 20, 0.92);
					border: 1px solid rgba(255,255,255,0.2);
					color: #fff;
					box-shadow: 0 4px 16px rgba(0,0,0,0.35);
				}
				.app.color-mode .resume-dl-tip-cursor {
					background: rgba(255,255,255,0.96);
					border-color: rgba(0,0,0,0.15);
					color: #000;
					box-shadow: 0 4px 16px rgba(0,0,0,0.12);
				}

				.athletics-main { min-height: 100vh; }
				.athletics-section { min-height: 100vh; padding: 0; background: transparent; overflow: visible; }
				.athletics-content {
					min-height: 100vh;
					width: 100%;
					background: transparent;
					position: relative;
					overflow: visible;
				}

				.athletics-section {
					opacity: 1;
					transform: none;
				}

				.athletics-showcase {
					position: absolute;
					inset: 0;
					overflow: hidden;
					pointer-events: none;
					z-index: 2;
				}

				.athletics-medal {
					position: absolute;
					top: -6vh;
					height: 67vh;
					transform: translateX(-50%);
					overflow: visible;
					pointer-events: auto;
				}

				.athletics-medal:hover .athletics-medal-img {
					transform: scale(1.035);
				}

				.athletics-medal-tooltip {
					position: absolute;
					top: calc(100% + 1rem);
					left: 50%;
					transform: translateX(-50%) translateY(6px);
					white-space: nowrap;
					padding: 0.55rem 1.1rem;
					background: rgba(8, 8, 8, 0.92);
					border: 1px solid rgba(125, 211, 252, 0.35);
					border-radius: 999px;
					font-size: 0.82rem;
					letter-spacing: 0.04em;
					color: rgba(255, 255, 255, 0.9);
					opacity: 0;
					transition: opacity 0.3s ease, transform 0.3s ease;
					pointer-events: none;
					z-index: 10;
				}

				.athletics-medal:hover .athletics-medal-tooltip {
					opacity: 1;
					transform: translateX(-50%) translateY(0);
				}

				.athletics-medal--far-left { left: 17%; }
				.athletics-medal--mid-left { left: 32%; }
				.athletics-medal--mid-right { left: 68%; }
				.athletics-medal--far-right { left: 83%; }

				.athletics-medal--mid-left,
				.athletics-medal--mid-right {
					top: -20vh;
				}

				.athletics-medal-inner {
					height: 100%;
					transform-origin: top center;
					opacity: 0;
					animation: medal-grow-from-top 2.6s cubic-bezier(0.33, 1, 0.68, 1) forwards;
				}

				@keyframes medal-grow-from-top {
					0% {
						opacity: 0;
						clip-path: inset(0 0 100% 0);
					}
					100% {
						opacity: 1;
						clip-path: inset(0 0 0 0);
					}
				}

				.athletics-medal-img {
					height: 100%;
					width: auto;
					display: block;
					transition: transform 0.4s ease;
					transform-origin: bottom center;
				}

				.athletics-trophy-stage {
					position: absolute;
					left: 50%;
					bottom: 8vh;
					transform: translateX(-50%);
					overflow: visible;
					pointer-events: auto;
				}

				.athletics-trophy-stage:hover .athletics-trophy-img {
					transform: scale(1.03);
				}

				.athletics-trophy-stage:hover .athletics-medal-tooltip {
					opacity: 1;
					transform: translateX(-50%) translateY(0);
				}

				.athletics-trophy-wrap {
					position: relative;
					width: min(46vw, 520px);
					height: min(46vw, 520px);
				}

				.athletics-trophy-img {
					width: 100%;
					height: 100%;
					object-fit: contain;
					display: block;
					transition: transform 0.4s ease;
					transform-origin: bottom center;
				}

				/* ---- Athletics: below-the-fold sections ---- */
				.athletics-label {
					font-size: 0.8rem;
					font-weight: 700;
					letter-spacing: 0.45em;
					text-transform: uppercase;
					text-align: center;
					color: rgba(255, 255, 255, 0.45);
					margin: 0 0 clamp(1.5rem, 3.5vh, 3rem);
				}

				.athletics-stage-section {
					position: relative;
					padding: clamp(2.5rem, 6vh, 4.5rem) clamp(2rem, 5vw, 5rem);
					background: transparent;
				}

				.athletics-stage-gallery {
					display: flex;
					align-items: flex-end;
					justify-content: center;
					gap: clamp(2.5rem, 6vw, 7rem);
				}

				.athletics-stage-item {
					position: relative;
					margin: 0;
					display: flex;
					flex-direction: column;
					align-items: center;
					gap: 1rem;
					opacity: 0;
					transform: translateX(-32px);
					transition: opacity 1.6s ease-out, transform 1.6s ease-out;
				}

				.athletics-stage-item--slider {
					transform: translateX(72vw);
					opacity: 1;
					transition: transform 3.2s cubic-bezier(0.3, 0.6, 0.15, 1);
					z-index: 2;
				}

				.athletics-stage-gallery.in .athletics-stage-item {
					opacity: 1;
					transform: translateX(0);
				}

				.athletics-stage-item:hover .athletics-medal-tooltip {
					opacity: 1;
					transform: translateX(-50%) translateY(0);
				}

				.athletics-stage-item .athletics-medal-tooltip {
					top: auto;
					bottom: -0.6rem;
				}

				/* ---- Athletics: federations marquee ---- */
				.athletics-federations {
					position: relative;
					padding: clamp(1.5rem, 4vh, 3rem) 0;
					background: transparent;
				}

				.athletics-fed-track {
					overflow: hidden;
					width: 100%;
				}

				.athletics-fed-scroll {
					display: flex;
					align-items: center;
					width: max-content;
					will-change: transform;
					animation: athletics-fed-marquee 32s linear infinite;
				}

				.athletics-fed-scroll:hover {
					animation-play-state: paused;
				}

				@keyframes athletics-fed-marquee {
					0% { transform: translateX(0); }
					100% { transform: translateX(calc(-100% / 3)); }
				}

				.athletics-fed-item {
					flex: 0 0 auto;
					display: flex;
					align-items: center;
					justify-content: center;
					padding: 0 clamp(2.5rem, 5vw, 5rem);
					opacity: 0.7;
					transition: opacity 0.3s ease;
				}

				.athletics-fed-item:hover {
					opacity: 1;
				}

				.athletics-fed-item img {
					height: clamp(40px, 5vw, 60px);
					width: auto;
					object-fit: contain;
					display: block;
				}

				.athletics-stage-spotlight {
					position: absolute;
					left: 50%;
					bottom: 1.6rem;
					width: 130%;
					height: 34%;
					transform: translateX(-50%);
					background: radial-gradient(ellipse at center bottom, rgba(255, 255, 255, 0.13) 0%, rgba(255, 255, 255, 0.04) 40%, transparent 70%);
					pointer-events: none;
				}

				.athletics-stage-photo {
					width: auto;
					object-fit: contain;
					display: block;
					filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.65));
					transition: transform 0.5s ease;
				}

				.athletics-stage-photo--tall {
					height: clamp(300px, 56vh, 560px);
				}

				.athletics-stage-photo--small {
					height: clamp(220px, 40vh, 400px);
				}

				.athletics-stage-item:hover .athletics-stage-photo {
					transform: scale(1.03);
				}

				.athletics-recognitions {
					position: relative;
					padding: clamp(2.5rem, 6vh, 4.5rem) clamp(2rem, 5vw, 5rem) clamp(4rem, 9vh, 7rem);
					background: transparent;
				}

				.athletics-docs-grid {
					display: grid;
					grid-template-columns: repeat(5, minmax(0, 1fr));
					gap: clamp(1rem, 2vw, 2rem);
					max-width: 1400px;
					margin: 0 auto;
					align-items: start;
				}

				.athletics-doc-card {
					display: flex;
					flex-direction: column;
					gap: 0.75rem;
					text-decoration: none;
					transition: transform 0.35s ease;
				}

				.athletics-doc-card:hover {
					transform: translateY(-6px);
				}

				.athletics-doc-card img {
					width: 100%;
					height: auto;
					display: block;
					border-radius: 8px;
					box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
					border: 1px solid rgba(255, 255, 255, 0.12);
					background: #ffffff;
				}

				.athletics-doc-card span {
					font-size: 0.72rem;
					letter-spacing: 0.12em;
					text-transform: uppercase;
					color: rgba(255, 255, 255, 0.55);
					text-align: center;
					line-height: 1.5;
				}

				.athletics-mobile-gate {
					display: none;
				}

				@media (max-width: 1024px) {
					.athletics-mobile-gate {
						display: flex;
						align-items: center;
						justify-content: center;
						min-height: 100vh;
						padding: 2rem;
					}
					.athletics-mobile-gate .desktop-only-message {
						display: block !important;
						text-align: center;
						padding: 3rem 2.5rem;
						background: rgba(255, 255, 255, 0.05);
						border: 1px solid rgba(255, 255, 255, 0.1);
						border-radius: 12px;
						max-width: 90%;
					}
					.athletics-mobile-gate .desktop-only-message h3 {
						font-size: clamp(1.5rem, 4vw, 2rem);
						margin-bottom: 1.5rem;
						color: #ffffff;
						line-height: 1.3;
					}
					.athletics-mobile-gate .desktop-only-message p {
						font-size: clamp(1rem, 2.5vw, 1.2rem);
						color: rgba(255, 255, 255, 0.8);
						line-height: 1.7;
					}
					.athletics-section,
					.athletics-stage-section,
					.athletics-recognitions,
					.athletics-federations,
					.athletics-home-nav {
						display: none !important;
					}
				}

				.athletics-home-nav {
					position: fixed;
					left: 2rem;
					top: 2rem;
					z-index: 1000;
				}

				@property --fire-angle {
					syntax: '<angle>';
					initial-value: 0deg;
					inherits: false;
				}

				@keyframes fire-border-spin {
					to { --fire-angle: 360deg; }
				}

				.athletics-home-badge {
					position: relative;
					isolation: isolate;
					background: rgba(255, 255, 255, 0.05);
					backdrop-filter: blur(20px);
					-webkit-backdrop-filter: blur(20px);
					border: none;
					border-radius: 999px;
					box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
					color: rgba(255, 255, 255, 0.9);
					padding: 0.35rem 1.05rem 0.35rem 0.35rem;
					cursor: pointer;
					transition: all 0.3s ease;
					height: 50px;
					display: inline-flex;
					align-items: center;
					gap: 0.55rem;
				}
				.athletics-home-badge::after {
					content: '';
					position: absolute;
					inset: -1px;
					border-radius: inherit;
					padding: 2px;
					background: conic-gradient(
						from var(--fire-angle),
						#ff1a00 0deg,
						#ff5500 45deg,
						#ffaa00 90deg,
						#ff0055 135deg,
						#c026d3 180deg,
						#6366f1 225deg,
						#0ea5e9 270deg,
						#ff1a00 360deg
					);
					-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
					-webkit-mask-composite: xor;
					mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
					mask-composite: exclude;
					animation: fire-border-spin 8s linear infinite;
					pointer-events: none;
					opacity: 0.85;
					z-index: 0;
					filter: saturate(1.35) brightness(1.05);
				}
				.athletics-home-m {
					width: 38px;
					height: 38px;
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					font-family: 'Organical', sans-serif;
					font-size: 1.35rem;
					font-weight: bold;
					flex-shrink: 0;
					position: relative;
					z-index: 1;
					background: rgba(255, 255, 255, 0.06);
				}
				.athletics-home-title {
					font-family: 'Pacifico', cursive;
					font-size: 1.05rem;
					font-weight: normal;
					color: rgba(255, 255, 255, 0.95);
					letter-spacing: 0.1em;
					line-height: 1;
					position: relative;
					z-index: 1;
					padding-right: 0.1rem;
				}
				.athletics-home-badge:hover {
					background: rgba(255, 255, 255, 0.1);
					transform: scale(1.04);
				}
				.app.color-mode .athletics-home-badge {
					background: rgba(0, 0, 0, 0.05);
					color: rgba(0, 0, 0, 0.9);
				}
				.app.color-mode .athletics-home-title {
					color: rgba(0, 0, 0, 0.9);
				}
				.app.color-mode .athletics-home-badge:hover {
					background: rgba(0, 0, 0, 0.08);
				}
				.athletics-home-tip {
					position: fixed;
					z-index: 10001;
					pointer-events: none;
					font-family: Arial, sans-serif;
					font-size: 0.72rem;
					font-weight: 800;
					letter-spacing: 0.04em;
					text-transform: uppercase;
					white-space: nowrap;
					padding: 5px 10px;
					border-radius: 5px;
					background: rgba(20, 20, 20, 0.92);
					border: 1px solid rgba(255,255,255,0.2);
					color: #fff;
					box-shadow: 0 4px 16px rgba(0,0,0,0.35);
				}
				.app.color-mode .athletics-home-tip {
					background: rgba(255,255,255,0.96);
					border-color: rgba(0,0,0,0.15);
					color: #000;
				}

				.ll-sep { height: 1px; background: #333; margin: 2rem 0; }
				.app.color-mode .ll-sep { background: #e0e0e0; }

				.ll-head { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.2rem; }
				.ll-icon { width: 56px; height: 56px; border-radius: 13px; object-fit: cover; }
				.ll-head > div { display: flex; flex-direction: column; }
				.ll-name { font-family: Arial,sans-serif; font-size: 1.6rem; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
				.app.color-mode .ll-name { color: #000; }
				.ll-sub { font-size: 0.85rem; color: rgba(255,255,255,0.5); }
				.app.color-mode .ll-sub { color: rgba(0,0,0,0.5); }
				.ll-tag {
					font-size: 9px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
					padding: 4px 10px; border-radius: 6px; margin-left: auto; white-space: nowrap;
					background: #1a1a1a; color: #fff; border: 1px solid #333;
				}
				.app.color-mode .ll-tag { background: #f5f5f5; color: #000; border-color: #e0e0e0; }

				.ll-row { display: grid; grid-template-columns: 1.1fr 1fr; gap: 1rem; margin-bottom: 1rem; align-items: start; }
				.ll-video { width: 100%; border-radius: 12px; display: block; background: #1a1a1a; }

				.ll-kpis { display: grid; grid-template-columns: repeat(2,1fr); gap: 0.5rem; margin-bottom: 0.6rem; }
				.ll-kpi {
					text-align: center; padding: 0.6rem 0.3rem; border-radius: 12px;
					background: #1a1a1a; border: 1px solid #333; transition: all 0.3s;
				}
				.ll-kpi:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
				.app.color-mode .ll-kpi { background: #f5f5f5; border-color: #e0e0e0; }
				.app.color-mode .ll-kpi:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
				.ll-kpi-n { display: block; font-size: 1.1rem; font-weight: 800; color: #fff; }
				.app.color-mode .ll-kpi-n { color: #000; }
				.ll-kpi-l { font-size: 0.6rem; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 500; }
				.app.color-mode .ll-kpi-l { color: rgba(0,0,0,0.5); }

				.ll-body { font-size: 0.8rem; line-height: 1.55; color: rgba(255,255,255,0.8); margin-bottom: 0.6rem; }
				.app.color-mode .ll-body { color: rgba(0,0,0,0.8); }

				.ll-chips { display: flex; flex-wrap: wrap; gap: 5px; }
				.ll-chip {
					font-size: 0.875rem; padding: 0.375rem 0.875rem; border-radius: 6px; font-weight: 500;
					background: #1a1a1a; color: #fff; border: 1px solid #333;
				}
				.app.color-mode .ll-chip { background: #f5f5f5; color: #000; border-color: #e0e0e0; }

				.ll-press {
					display: flex; align-items: center; gap: 1rem;
					margin: 1rem 0; padding: 0.6rem 1rem;
					background: #1a1a1a; border: 1px solid #333; border-radius: 12px;
				}
				.app.color-mode .ll-press { background: #f5f5f5; border-color: #e0e0e0; }
				.ll-press-label {
					font-size: 0.65rem; font-weight: 600; text-transform: uppercase;
					letter-spacing: 0.1em; color: rgba(255,255,255,0.4);
					white-space: nowrap; flex-shrink: 0;
				}
				.app.color-mode .ll-press-label { color: rgba(0,0,0,0.4); }
				.ll-press-track { overflow: hidden; flex: 1; }
				.ll-press-scroll {
					display: flex; align-items: center; width: max-content;
					will-change: transform; animation: llM 30s linear infinite;
				}
				.ll-press-scroll:hover { animation-play-state: paused; }
				@keyframes llM { 0%{transform:translateX(0)} 100%{transform:translateX(calc(-100%/3))} }
				.ll-pi {
					flex: 0 0 auto; display: flex; align-items: center; padding: 0 1.4rem;
					text-decoration: none; transition: opacity 0.3s;
				}
				.ll-pl { height: 18px; width: auto; object-fit: contain; display: block; filter: brightness(0) invert(1); }
				.app.color-mode .ll-pl { filter: brightness(0); }

				.ll-screens {
					display: grid; grid-template-columns: repeat(10, 1fr); gap: 0.6rem;
					overflow: hidden;
				}
				.ll-sc {
					width: 100%; height: auto; aspect-ratio: 9/19.5;
					border-radius: 10px;
					display: block; object-fit: cover;
					background: #1a1a1a; border: 1px solid #333;
				}
				.app.color-mode .ll-sc { background: #f5f5f5; border-color: #e0e0e0; }

				@media (max-width: 1280px) { .ll-row { grid-template-columns: 1fr; } }
			`}</style>


			<main className="main">
				{isAthleticsPage ? (
					<>
					<div className="athletics-mobile-gate">
						<div className="desktop-only-message">
							<h3>Desktop View Required</h3>
							<p>This website is optimized for desktop viewing. Please visit on a desktop or laptop computer for the full experience.</p>
						</div>
					</div>
					<section className="section athletics-section">
						<div className="athletics-content" aria-label="Athletics">
							<AthleticsShowcase />
						</div>
					</section>
					<AthleticsFederations />
					<AthleticsStageGallery />
					<AthleticsRecognitions />
					</>
				) : (
				<>
				<section id="about" className="section hero reveal tone-1">
					<div className="container hero-wrap">
						<div style={{ textAlign: 'left', marginLeft: '2cm' }}>
							<h1 className="title">Entrepreneur. Innovator. Visionary.</h1>
							<p className="subtitle">
								I build and scale businesses from concept to market — turning ideas into profitable ventures.
							</p>
							<div className="cta-row">
								<button 
									className="button primary" 
									onClick={() => {
										analytics.trackEvent('resume_button_click', {
											event_category: 'navigation',
											event_label: 'resume_section'
										})
										scrollTo('resume')
									}}
								>
									See Resume
								</button>
								<button 
									className="button" 
									onClick={() => {
										analytics.trackEvent('contact_button_click', {
											event_category: 'navigation',
											event_label: 'contact_section'
										})
										scrollTo('contact')
									}}
								>
									Get in Touch
								</button>
							</div>
						</div>
						<div className="hero-visual">
							<div className="orbit orbit-a" aria-hidden></div>
							<div className="orbit orbit-b" aria-hidden></div>
							<div
								className={`photo-wrap ${chatOpen ? 'chat-open' : ''}${photoHovered && heroInteractReady ? ' photo-hovered' : ''}`}
								onMouseEnter={() => heroInteractReady && setPhotoHovered(true)}
								onMouseLeave={() => setPhotoHovered(false)}
							>
								<div className="coin-inner">
									<div className="coin-front">
										<img
											src="/Diseno-sin-titulo-97.png"
											alt="Portrait of Manuel Peña Morros"
											className="hero-photo"
											decoding="async"
											loading="eager"
											fetchPriority="high"
										/>
									</div>
									<div className="coin-back">
										<div className="coin-back-content">
											{/* 3D Avatar - Fixed at top */}
											<div className="chat-avatar">
												<img 
													src="/logo_ph.png%20%282%29.gif" 
													alt="Manuel Peña Morros 3D Avatar" 
													className="avatar-gif"
													loading="lazy"
													decoding="async"
												/>
											</div>
											
											{/* Chat Interface - Below avatar */}
											<div className="chat-interface">
												{chatMessages.length === 0 && (
													<div className="chat-welcome">
														Hello! I'm Manuel's AI avatar. I know my resume, projects, and experience inside out.
														<span className="chat-welcome-cta">Ask me anything.</span>
													</div>
												)}
												
												<div className="chat-messages">
													{chatMessages.map((message, index) => (
														<div key={index} className={`chat-message ${message.role}`}>
															{message.content}
														</div>
													))}
													{isLoading && (
														<div className="chat-message assistant">
															Thinking...
														</div>
													)}
												</div>
												
												<div className="chat-input-container">
													<input
														type="text"
														className="chat-input"
														placeholder="Type a message..."
														value={currentMessage}
														onChange={(e) => setCurrentMessage(e.target.value)}
														onKeyDown={(e) => {
															if (e.key === 'Enter' && !e.shiftKey) {
																e.preventDefault();
																sendMessage();
															}
														}}
														disabled={isLoading}
													/>
													<button 
														className="chat-send" 
														onClick={sendMessage}
														disabled={isLoading || !currentMessage.trim()}
													>
														<Send size={14} />
													</button>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
							
							{/* Chat Toggle Button with Thinking Bubbles */}
							<div className="chat-bubble-container">
								<button 
									className="chat-toggle" 
									onClick={() => setChatOpen(!chatOpen)}
									aria-label="Toggle chat"
								>
									{chatOpen ? <X size={16} /> : <MessageCircle size={16} />}
									<div className="chat-notification">1</div>
								</button>
								
								{/* Thinking Bubbles */}
								<div className="thinking-bubbles">
									<div className="bubble bubble-1"></div>
									<div className="bubble bubble-2"></div>
									<div className="bubble bubble-3"></div>
									<div className="bubble bubble-4"></div>
									<div className="bubble bubble-5"></div>
									<div className="bubble bubble-6"></div>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Values Section */}
				<section id="values" className="section reveal tone-1 tone-sep values-section">
					<div className="container">
						<h2>Core Values</h2>
					</div>
					<div className="values-container">
						<div className="values-visual">
							<div className="animation-container">
								<AnimatedGif selectedValue={hoveredValue} />
							</div>
							<div className="values-circle"></div>
							{values.map((value, index) => (
								<div 
									key={value.id} 
									className="value-item visible"
									style={{
										transform: `translate(-50%, -50%) rotate(${index * 60}deg) translateX(250px) rotate(${-index * 60}deg)`
									}}
								>
									<div 
										className={`value-icon ${value.id}`}
										onMouseEnter={() => setHoveredValue(value.id)}
										onMouseLeave={() => setHoveredValue(null)}
									>
										<value.icon size={24} />
										<div className="value-tooltip">
											<div className="tooltip-title">{value.label}</div>
											<div className="tooltip-description">{value.description}</div>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</section>

				{/* Skills Section - Flappy Bird Style */}
				<section id="skills" className="section reveal tone-2 tone-sep skills-flappy-section">
					<div className="container">
						<h2>My Skills</h2>
						<div className="flappy-game-wrapper">
							{/* Instructions */}
							{!gameStarted && !gameOver && (
								<div className="flappy-instructions">
									<div className="instructions-content">
										<h3>Press SPACEBAR to Play!</h3>
										<p>Use SPACEBAR to make the bird fly up</p>
										<p>Collect all {skills.length} skills by flying through the pipes</p>
										<div className="spacebar-hint">⌨️ SPACE</div>
									</div>
								</div>
							)}

							{/* Game Over Screen */}
							{gameOver && (
								<div className="flappy-game-over">
									<div className="game-over-content">
										<h3>{collectedSkillsCount === skills.length ? '🎉 All Skills Collected!' : 'Game Over!'}</h3>
										<button className="flappy-btn-restart" onClick={jumpBird}>
											Press SPACEBAR to Restart
										</button>
									</div>
								</div>
							)}

							{/* Flappy Bird Game Area */}
							<div className="flappy-game-area" onClick={jumpBird} style={{ cursor: 'pointer' }}>
								{/* Sky Background */}
								<div className="flappy-sky">
									{/* Clouds */}
									<div className="flappy-cloud cloud-1"></div>
									<div className="flappy-cloud cloud-2"></div>
									<div className="flappy-cloud cloud-3"></div>

									{/* Bird Character (Profile) */}
									<div className={`flappy-bird ${gameOver ? 'crashed' : ''}`} style={{ 
										top: `${birdPosition}%`,
										left: '20%',
										transform: `rotate(${Math.min(30, birdVelocity * 3)}deg)`
									}}>
										<img 
											src="/iniciativa-propone-enfoque-integral-educacion.png" 
											alt="Manuel" 
											className="flappy-bird-face"
											loading="lazy"
											decoding="async"
										/>
										<div className="flappy-wings">
											<div className="wing wing-left"></div>
											<div className="wing wing-right"></div>
										</div>
									</div>

									{/* Skills as Pipes/Bars */}
									<div className="pipes-container" style={{
										transform: `translateX(${-scrollOffset}px)`
									}}>
										{skills.map((skill, index) => {
												const SkillIcon = skill.icon
											const isCollected = collectedSkillsSet.current.has(index)
											
											// Calculate pipe position (spaced 200px apart for easier gameplay)
											const pipePosition = 400 + (index * 200)
											const gapPosition = 15 + (index % 3) * 20 // Gap position varies (15-55%)
											const gapSize = 70 // Much larger gap size for easier passage
											
											// Only render pipes near viewport - wider range to prevent cutoffs
											const viewportLeft = scrollOffset - 300
											const viewportRight = scrollOffset + 1200
											if (pipePosition < viewportLeft || pipePosition > viewportRight) {
												return null
											}
											
												return (
													<div
														key={skill.id}
													className={`flappy-pipe ${isCollected ? 'collected' : ''}`}
														style={{
														left: `${pipePosition}px`,
														'--skill-color': skill.color,
														'--gap-top': `${gapPosition}%`,
														'--gap-size': `${gapSize}%`
														} as React.CSSProperties}
													>
													{/* Top Pipe */}
													<div className="pipe-segment pipe-top" style={{
														height: `${gapPosition}%`
													} as React.CSSProperties}>
														<div className="pipe-cap"></div>
														<div className="pipe-body">
															<div className="pipe-skill-icon">
																<SkillIcon size={32} />
															</div>
														</div>
													</div>

													{/* Gap (where bird flies through) */}
													<div className="pipe-gap" style={{
														top: `${gapPosition}%`,
														height: `${gapSize}%`
													} as React.CSSProperties}>
														<div className="gap-label" style={{
															top: gapPosition + gapSize > 80 ? '20%' : '50%',
															transform: gapPosition + gapSize > 80 ? 'translate(-50%, 0)' : 'translate(-50%, -50%)'
														} as React.CSSProperties}>{skill.name}</div>
													</div>

													{/* Bottom Pipe */}
													<div className="pipe-segment pipe-bottom" style={{
														top: `${gapPosition + gapSize}%`,
														bottom: '60px'
													} as React.CSSProperties}>
														<div className="pipe-body">
															<div className="pipe-skill-icon">
																<SkillIcon size={32} />
															</div>
														</div>
														<div className="pipe-cap"></div>
													</div>

													{/* Collection Effect */}
													{isCollected && (
														<div className="pipe-collected-effect" style={{
															top: `${gapPosition + gapSize / 2}%`
														} as React.CSSProperties}>
															<div className="collected-check">✓</div>
														</div>
													)}
									</div>
								)
							})}

										{/* End Flag */}
										<div className="flappy-flag" style={{
											left: `${400 + (skills.length * 200) + 50}px`
										}}>
											<div className="flag-pole"></div>
											<div className="flag-banner">
												<div className="flag-text">FINISH</div>
											</div>
										</div>
									</div>

									{/* Ground */}
									<div className="flappy-ground"></div>
								</div>

							</div>
						</div>
					</div>
				</section>

				<section id="resume" className="section reveal tone-2 tone-sep">
					<div className="container">
						<h2>Resume<ResumeDownloadLink /></h2>
						<TimelineComponent />
								</div>
				</section>

				<section id="projects" className="section reveal tone-1 tone-sep">
				<div className="container">
					<h2>Projects</h2>
						<div className="projects-carousel-wrapper">
							<div className="projects-carousel">
								<div 
									className="projects-container"
									style={{ transform: `rotateY(${rotationAngle}deg)` }}
								>
									{projects.map((project, index) => (
										<div key={project.id} className="project-item">
											{index === 2 ? (
												<img
													src="/diaita-preview.png"
													alt="Health Education Platform"
													width="100%"
													height="120"
													className="project-video"
													style={{ borderRadius: '15px', objectFit: 'cover' }}
													loading="lazy"
												/>
											) : (
												<video 
													muted
													loop
													playsInline
													width="100%" 
													height="120"
													data-autoplay-on-visible
													className="project-video"
													onClick={() => {
														const video = document.createElement('video');
														video.src = index === 0 ? '/1.mov' : '/bb.mp4';
														video.controls = true;
														video.style.width = '80vw';
														video.style.height = 'auto';
														video.style.maxWidth = '800px';
														
														const modal = document.createElement('div');
														modal.style.position = 'fixed';
														modal.style.top = '0';
														modal.style.left = '0';
														modal.style.width = '100%';
														modal.style.height = '100%';
														modal.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
														modal.style.display = 'flex';
														modal.style.alignItems = 'center';
														modal.style.justifyContent = 'center';
														modal.style.zIndex = '9999';
														modal.style.cursor = 'pointer';
														
														modal.appendChild(video);
														document.body.appendChild(modal);
														
														modal.onclick = () => {
															document.body.removeChild(modal);
														};
														
														video.play();
													}}
												>
													<source src={index === 0 ? '/1.mov' : '/bb.mp4'} type="video/mp4" />
												</video>
											)}
											<div className="project-card">
												<h3 className="project-title">{project.title}</h3>
												<p className="project-description">{project.description}</p>
												<div className="project-technologies">
													{project.technologies.map((tech, techIndex) => (
														<span key={techIndex} className="tech-tag">{tech}</span>
													))}
												</div>
												{project.title !== 'Health Education Platform' && (
													<div className="project-links">
														<a 
															href={project.link} 
															className="project-link" 
															target="_blank" 
															rel="noopener noreferrer"
															onClick={() => {
																analytics.trackProjectView(project.title)
																analytics.trackEvent('project_demo_click', {
																	event_category: 'projects',
																	event_label: project.title,
																	project_url: project.link
																})
															}}
														>
															Live Demo
														</a>
														<a 
															href={project.github} 
															className="project-link" 
															target="_blank" 
															rel="noopener noreferrer"
															onClick={() => {
																analytics.trackEvent('project_github_click', {
																	event_category: 'projects',
																	event_label: project.title,
																	github_url: project.github
																})
															}}
														>
															GitHub
														</a>
													</div>
												)}
											</div>
										</div>
									))}
								</div>
								<button className="carousel-arrows carousel-prev" onClick={prevProject}>
									<ChevronLeft size={24} />
								</button>
								<button className="carousel-arrows carousel-next" onClick={nextProject}>
									<ChevronRight size={24} />
								</button>
							</div>
							<div className="carousel-indicators">
								{projects.map((_, index) => (
									<button
										key={index}
										className={`carousel-indicator ${currentProjectIndex === index ? 'active' : ''}`}
										onClick={() => {
											setCurrentProjectIndex(index)
											setRotationAngle(index * -120)
										}}
									/>
								))}
							</div>
					</div>

						<div className="ll-sep"></div>

						<div className="ll-head">
							<img src="/lumina-app-icon.png" alt="Lumina Labs" className="ll-icon" />
							<div><span className="ll-name">Lumina Labs</span><span className="ll-sub">Available on the App Store</span></div>
						</div>

						<div className="ll-row">
							<video controls muted playsInline preload="auto" className="ll-video" data-autoplay-on-visible><source src="/lumina-demo.mp4" type="video/mp4" /></video>
							<div>
								<div className="ll-kpis">
									<div className="ll-kpi"><span className="ll-kpi-n">$2.5M</span><span className="ll-kpi-l">Valuation</span></div>
									<div className="ll-kpi"><span className="ll-kpi-n">$15K</span><span className="ll-kpi-l">MRR</span></div>
									<div className="ll-kpi"><span className="ll-kpi-n">1,000+</span><span className="ll-kpi-l">Analyses</span></div>
									<div className="ll-kpi"><span className="ll-kpi-n">5</span><span className="ll-kpi-l">Clinics</span></div>
								</div>
								<p className="ll-body">Personalized aesthetic recommendations through proprietary computer vision. White-labeled SaaS across five dermatology clinics in Mexico. Patent pending.</p>
								<div className="ll-chips">{['Computer Vision','React Native','Python','TensorFlow','AWS','PostgreSQL'].map(t=>(<span key={t} className="ll-chip">{t}</span>))}</div>
							</div>
						</div>

						<div className="ll-press">
							<span className="ll-press-label">Featured In</span>
							<div className="ll-press-track"><div className="ll-press-scroll">
								{Array.from({length:3},(_,s)=>[
									{i:'/press-el_universal_white.png',n:'El Universal',u:'https://www.eluniversal.com.mx/de-ultima/la-inteligencia-artificial-y-la-alta-tecnologia-tambien-cuidan-tu-cabello/'},
									{i:'/press-skinsational_white.png',n:'Skinsational',u:'https://skinsational.com.mx/el-futuro-del-cuidado-capilar-ya-esta-aqui-la-era-de-tratar-el-pelo-como-piel/'},
									{i:'/press-luxperience_white.png',n:'Luxperience',u:'https://luxperience.mx/2026/03/francisco-iglesias-haircare-ciencia-real-para-el-cuidado-capilar/'},
									{i:'/press-the_editorial_mexico_white.png',n:'The Editorial',u:'https://theeditorialmexico.com/el-futuro-del-haircare-francisco-iglesias/'},
									{i:'/press-quien_white.png',n:'Quién',u:''}
								].map((p,j)=>{const k=s*5+j;return p.u?(<a key={k} href={p.u} target="_blank" rel="noopener noreferrer" className="ll-pi"><img src={p.i} alt={p.n} className="ll-pl"/></a>):(<span key={k} className="ll-pi"><img src={p.i} alt={p.n} className="ll-pl"/></span>)})).flat()}
							</div></div>
						</div>

						<div className="ll-screens">
							{[1,2,3,4,5,6,7,8,9,10].map(n=>(
								<img key={n} src={`/ll-${n}.jpg`} alt={`Lumina Labs screenshot ${n}`} className="ll-sc" loading="lazy" />
							))}
						</div>
					</div>
				</section>

				{/* Articles Section */}
				<section id="articles" className="section reveal tone-1 tone-sep">
					<div className="container">
						<h2>Article Mentions</h2>
						<div className="articles-carousel-wrapper">
							<div className="articles-carousel">
								<div 
									className="articles-container"
									style={{ transform: `translateX(-${currentArticleIndex * 100}%)` }}
								>
							{articles.map((article, index) => (
								<ArticleCard key={article.id} article={article} index={index} />
							))}
								</div>
							</div>
							<button className="carousel-arrows carousel-prev" onClick={prevArticle}>
								<ChevronLeft size={24} />
							</button>
							<button className="carousel-arrows carousel-next" onClick={nextArticle}>
								<ChevronRight size={24} />
							</button>
							<div className="carousel-indicators">
								{articles.map((_, index) => (
									<button
										key={index}
										className={`carousel-indicator ${currentArticleIndex === index ? 'active' : ''}`}
										onClick={() => setCurrentArticleIndex(index)}
									/>
								))}
							</div>
						</div>
					</div>
				</section>

				<section id="contact" className="section alt reveal tone-1 tone-sep">
					<div className="container">
						<div className="desktop-only-message">
							<h3>Desktop View Required</h3>
							<p>This website is optimized for desktop viewing. Please visit on a desktop or laptop computer for the full experience.</p>
						</div>
						<h2>Contact Card</h2>
						<BusinessCard />
					</div>
				</section>
				</>
				)}
			</main>

			{!isAthleticsPage && (
			<footer className="site-footer">
				<div className="container">
					<p className="muted">© {new Date().getFullYear()} Manuel Peña Morros. All rights reserved.</p>
				</div>
			</footer>
			)}
		</div>
	)
}

function ProjectCard({ title, description, tags, status, link }: { 
	title: string; 
	description: string; 
	tags: string[];
	status: string;
	link: string;
}) {
	return (
		<div className="card">
			<div className="card-header">
			<h3>{title}</h3>
				<span className={`status-badge ${status.toLowerCase().replace(' ', '-')}`}>
					{status}
				</span>
			</div>
			<p>{description}</p>
			<div className="tags">
				{tags.map(t => (
					<span key={t} className="tag">{t}</span>
				))}
			</div>
			<div className="card-footer">
				<a href={link} target="_blank" rel="noreferrer" className="card-link">
					View Project →
				</a>
			</div>
		</div>
	)
}

function ArticleCard({ article, index }: { article: any, index: number }) {
	return (
		<div className="newspaper-card">
			{/* Newspaper Header */}
			<div className="newspaper-header">
				<div className="newspaper-masthead">
					<div className="newspaper-name">{article.publication}</div>
					<div className="newspaper-date">{article.date}</div>
			</div>
				<div className="newspaper-divider"></div>
				</div>

			{/* Main Content Area */}
			<div className="newspaper-body">
				{/* Left Column - Image */}
				<div className="newspaper-column newspaper-image-column">
					<div className="newspaper-image-wrapper">
						<img src={article.image} alt={article.title} className="newspaper-image" loading="lazy" decoding="async" />
						<div className="newspaper-image-caption">{article.category}</div>
			</div>
			</div>

				{/* Right Column - Article */}
				<div className="newspaper-column newspaper-text-column">
					<div className="newspaper-headline">{article.title}</div>
					<div className="newspaper-byline">
						<span className="newspaper-section">{article.category}</span>
						<span className="newspaper-separator">•</span>
						<span className="newspaper-read-time">{article.readTime}</span>
					</div>
					<div className="newspaper-divider-small"></div>
					<div className="newspaper-body-text">
						{article.description}
					</div>
					<div className="newspaper-continued">
				<a 
					href={article.link} 
							className="newspaper-link" 
					target="_blank" 
					rel="noopener noreferrer"
					onClick={(e) => {
						if (article.link === '#') {
							e.preventDefault();
							alert('Article link not available yet');
						} else {
							console.log('Opening article:', article.link);
							window.open(article.link, '_blank');
						}
					}}
				>
							Continue Reading →
						</a>
					</div>
				</div>
			</div>

			{/* Newspaper Footer */}
			<div className="newspaper-footer">
				<div className="newspaper-divider"></div>
			</div>
		</div>
	)
}

function BusinessCard() {
	return (
		<div className="business-card-container">
			<div className="business-card">
				{/* Background with quote */}
				<div className="business-card-background">
					<div className="business-card-quote">
						"Innovation doesn't wait. Neither do I."
					</div>
				</div>
				
				{/* Card content */}
				<div className="business-card-content">
					{/* Top section with profile and info */}
					<div className="business-card-top">
						<div className="business-card-profile">
							<img 
								src="/iniciativa-propone-enfoque-integral-educacion.png" 
								alt="Manuel Peña Morros" 
								className="business-card-photo"
								loading="lazy"
								decoding="async"
							/>
						</div>
						<div className="business-card-info">
							<h3 className="business-card-name">Manuel Peña Morros</h3>
							<p className="business-card-title">Entrepreneur & Developer</p>
							<p className="business-card-location">New Orleans, LA</p>
						</div>
					</div>
					
					{/* Contact information */}
					<div className="business-card-contact">
						<div 
							className="contact-item"
							onClick={() => {
								analytics.trackContactAttempt('email')
								window.open('mailto:penamorrosm@gmail.com', '_blank')
							}}
							style={{ cursor: 'pointer' }}
						>
							<Mail className="contact-icon" />
							<span>penamorrosm@gmail.com</span>
						</div>
						<div 
							className="contact-item"
							onClick={() => {
								analytics.trackContactAttempt('linkedin')
								window.open('https://linkedin.com/in/manuelpenamorros', '_blank')
							}}
							style={{ cursor: 'pointer' }}
						>
							<MessageCircle className="contact-icon" />
							<span>linkedin.com/in/manuelpenamorros</span>
						</div>
						<div 
							className="contact-item"
							onClick={() => {
								analytics.trackContactAttempt('github')
								window.open('https://github.com/penamorros', '_blank')
							}}
							style={{ cursor: 'pointer' }}
						>
							<Code className="contact-icon" />
							<span>github.com/penamorros</span>
						</div>
					</div>
					
					{/* Signature */}
					<div className="business-card-signature">
						<img src="/Gradient-Icon-Map-Navigation-App-Logo-500-x-150-px.png" alt="Manuel Peña Morros signature" className="signature-img" loading="lazy" decoding="async" />
					</div>
				</div>
			</div>
		</div>
	)
}

function Signature() {
	return (
		<img src="/Gradient-Icon-Map-Navigation-App-Logo-500-x-150-px.png" alt="Manuel Peña-Morros signature" className="signature-img" loading="lazy" decoding="async" />
	)
}

function PixelatedImage() {
	const [isVisible, setIsVisible] = useState(false)
	const [pixels, setPixels] = useState<Array<{x: number, y: number, color: string, revealed: boolean}>>([])
	const [animationComplete, setAnimationComplete] = useState(false)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const imageRef = useRef<HTMLImageElement>(null)

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						setIsVisible(true)
					}
				})
			},
			{ threshold: 0.3 }
		)

		const container = document.querySelector('.values-visual')
		if (container) {
			observer.observe(container)
		}

		return () => {
			if (container) {
				observer.unobserve(container)
			}
		}
	}, [])

	useEffect(() => {
		if (!isVisible || !canvasRef.current || !imageRef.current) return

		const canvas = canvasRef.current
		const ctx = canvas.getContext('2d')
		const img = imageRef.current

		if (!ctx) return

		// Set canvas size
		canvas.width = 400
		canvas.height = 400

		// Draw image to canvas
		ctx.drawImage(img, 0, 0, 400, 400)

		// Get image data
		const imageData = ctx.getImageData(0, 0, 400, 400)
		const data = imageData.data

		// Create pixel grid with smaller pixels for better quality
		const pixelSize = 4
		const cols = Math.floor(400 / pixelSize)
		const rows = Math.floor(400 / pixelSize)
		
		const pixelArray: Array<{x: number, y: number, color: string, revealed: boolean}> = []

		for (let row = 0; row < rows; row++) {
			for (let col = 0; col < cols; col++) {
				// Sample color from center of each pixel block
				const x = col * pixelSize + Math.floor(pixelSize / 2)
				const y = row * pixelSize + Math.floor(pixelSize / 2)
				
				if (x < 400 && y < 400) {
					const index = (y * 400 + x) * 4
					const r = data[index]
					const g = data[index + 1]
					const b = data[index + 2]
					const a = data[index + 3]
					
					const color = `rgba(${r}, ${g}, ${b}, ${a / 255})`
					
					pixelArray.push({
						x: col * pixelSize,
						y: row * pixelSize,
						color,
						revealed: false
					})
				}
			}
		}

		setPixels(pixelArray)

		// Animate pixel reveal - ensure all pixels are revealed
		const totalPixels = pixelArray.length
		let revealedCount = 0
		
		const revealInterval = setInterval(() => {
			if (revealedCount >= totalPixels) {
				clearInterval(revealInterval)
				setAnimationComplete(true)
				return
			}

			// Reveal pixels in batches - mix random and sequential for complete coverage
			const pixelsToReveal = Math.min(100, totalPixels - revealedCount)
			const indicesToReveal: number[] = []
			
			// First, try to get random pixels
			const randomCount = Math.floor(pixelsToReveal * 0.7) // 70% random
			let attempts = 0
			const maxAttempts = randomCount * 5
			
			while (indicesToReveal.length < randomCount && attempts < maxAttempts) {
				const randomIndex = Math.floor(Math.random() * totalPixels)
				if (!pixelArray[randomIndex].revealed && !indicesToReveal.includes(randomIndex)) {
					indicesToReveal.push(randomIndex)
				}
				attempts++
			}

			// Fill remaining slots sequentially to ensure complete coverage
			for (let i = 0; i < totalPixels && indicesToReveal.length < pixelsToReveal; i++) {
				if (!pixelArray[i].revealed && !indicesToReveal.includes(i)) {
					indicesToReveal.push(i)
				}
			}

			// Update pixels
			setPixels(prevPixels => 
				prevPixels.map((pixel, index) => 
					indicesToReveal.includes(index) 
						? { ...pixel, revealed: true }
						: pixel
				)
			)

			revealedCount += indicesToReveal.length
		}, 20) // 20ms interval for smoother animation

		return () => clearInterval(revealInterval)
	}, [isVisible])

	return (
		<div className="pixel-trace-container">
			<img 
				ref={imageRef}
				src="/pena-morros-main-min.png" 
				alt="Manuel Peña Morros" 
				className="values-image"
				style={{ display: 'none' }}
				onLoad={() => {
					// Image loaded, ready for pixelation
				}}
			/>
			<canvas ref={canvasRef} style={{ display: 'none' }} />
			<div className="pixel-grid">
				{pixels.map((pixel, index) => (
					<div
						key={index}
						className="pixel-block"
						style={{
							left: pixel.x,
							top: pixel.y,
							backgroundColor: pixel.revealed ? pixel.color : 'transparent',
							transition: 'background-color 0.1s ease-in-out'
						}}
					/>
				))}
			</div>
		</div>
	)
}


function AnimatedGif({ selectedValue }: { selectedValue: string | null }) {
	const videoRef = useRef<HTMLVideoElement>(null)
	const [isVisible, setIsVisible] = useState(false)
	const [hasPlayed, setHasPlayed] = useState(false)

	useEffect(() => {
		const video = videoRef.current
		if (!video) return

		// Set slow motion (0.4x speed)
		video.playbackRate = 0.4

		// Create intersection observer to detect when video is visible
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						setIsVisible(true)
						if (!hasPlayed) {
							const p = video.play()
							if (p !== undefined) p.catch(() => {
								video.muted = true
								video.play().catch(() => {})
							})
							setHasPlayed(true)
						}
					}
					// Remove the pause behavior - let video continue playing once started
				})
			},
			{ threshold: 0.5 } // Video must be 50% visible
		)

		observer.observe(video)

		// Stop the video when it ends
		video.addEventListener('ended', () => {
			video.pause()
		})

		return () => {
			observer.disconnect()
		}
	}, [hasPlayed])

	// Apply color filter based on selected value
	const getFilterStyle = () => {
		if (!selectedValue) return {}
		
		const valueColors: { [key: string]: string } = {
			hardwork: '#ec4899',
			coding: '#059669',
			teamwork: '#2563eb',
			excellence: '#d97706',
			innovation: '#7c3aed',
			growth: '#0891b2'
		}
		
		const color = valueColors[selectedValue]
		if (!color) return {}
		
		return {
			filter: `hue-rotate(${getHueRotation(color)}deg) saturate(1.2) brightness(1.1)`,
			transition: 'filter 0.5s ease'
		}
	}

	// Convert hex color to hue rotation
	const getHueRotation = (hex: string) => {
		const colorMap: { [key: string]: number } = {
			'#ec4899': 320,  // pink
			'#059669': 120,  // green
			'#2563eb': 240,  // blue
			'#d97706': 45,   // orange
			'#7c3aed': 270,  // purple
			'#0891b2': 180   // cyan
		}
		return colorMap[hex] || 0
	}

	return (
		<video 
			ref={videoRef}
			src="/Illus.mp4"
			className="values-animation"
			autoPlay
			muted
			playsInline
			preload="auto"
			style={getFilterStyle()}
		/>
	)
}

// Logo component for SVG logos with dark/light mode support
function AthleticsMedal({
	src,
	position,
	delay,
	label,
}: {
	src: string
	position: 'far-left' | 'mid-left' | 'mid-right' | 'far-right'
	delay: number
	label: string
}) {
	return (
		<div className={`athletics-medal athletics-medal--${position}`}>
			<div className="athletics-medal-inner" style={{ animationDelay: `${delay}s` }}>
				<img src={src} alt={label} className="athletics-medal-img" loading="eager" decoding="async" />
			</div>
			<div className="athletics-medal-tooltip">{label}</div>
		</div>
	)
}

function AthleticsShowcase() {
	return (
		<div className="athletics-showcase">
			<AthleticsMedal src="/medal-1.png" position="far-left" delay={0} label="My gold — Campeón, Fitnessmania INBA México" />
			<AthleticsMedal src="/medal-2.png" position="mid-left" delay={0.3} label="My silver — Subcampeón, INBA México Selectivo" />
			<AthleticsTrophy />
			<AthleticsMedal src="/medal-3.png" position="mid-right" delay={0.45} label="My bronze — Tercer Lugar, INBA México Selectivo" />
			<AthleticsMedal src="/medal-4.png" position="far-right" delay={0.15} label="My Pro INBA Elite medal — Natural Bodybuilding" />
		</div>
	)
}

function AthleticsTrophy() {
	return (
		<div className="athletics-trophy-stage">
			<div className="athletics-trophy-wrap">
				<img
					src="/trophy.png"
					alt="My trophy — 2° Lugar, Mr. México Amateur"
					className="athletics-trophy-img"
					loading="eager"
					decoding="async"
				/>
			</div>
			<div className="athletics-medal-tooltip">My trophy — 2° Lugar, Mr. México Amateur (WABBA)</div>
		</div>
	)
}

const athleticsStagePhotos = [
	{ src: '/athlete-1.png', caption: 'INBA México Selectivo', size: 'small', slider: true },
	{ src: '/athlete-2.png', caption: 'Mr. México Amateur — 2° Lugar', size: 'tall', slider: false },
	{ src: '/athlete-3.png', caption: 'Miss & Mister Natural México', size: 'tall', slider: false },
] as const

function AthleticsStageGallery() {
	const galleryRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const el = galleryRef.current
		if (!el) return
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						entry.target.classList.add('in')
						observer.unobserve(entry.target)
					}
				}
			},
			{ threshold: 0.3 }
		)
		observer.observe(el)
		return () => observer.disconnect()
	}, [])

	let fadeIndex = 0
	return (
		<section className="athletics-stage-section" aria-label="Competition photos">
			<p className="athletics-label">On Stage</p>
			<div ref={galleryRef} className="athletics-stage-gallery">
				{athleticsStagePhotos.map((photo) => {
					const delay = photo.slider ? 0 : 2.4 + fadeIndex++ * 0.5
					return (
						<figure
							key={photo.src}
							className={`athletics-stage-item ${photo.slider ? 'athletics-stage-item--slider' : ''}`}
							style={{ transitionDelay: `${delay}s` }}
						>
							<div className="athletics-stage-spotlight" aria-hidden="true" />
							<img
								src={photo.src}
								alt={photo.caption}
								className={`athletics-stage-photo athletics-stage-photo--${photo.size}`}
								loading="lazy"
								decoding="async"
							/>
							<div className="athletics-medal-tooltip">{photo.caption}</div>
						</figure>
					)
				})}
			</div>
		</section>
	)
}

const athleticsFederations = [
	{ src: '/fed-inba-global.png', name: 'INBA Global' },
	{ src: '/fed-wabba.png', name: 'WABBA International' },
	{ src: '/fed-fitnessmania.png', name: 'Fitnessmania' },
	{ src: '/fed-nabba.png', name: 'NABBA' },
]

function AthleticsFederations() {
	return (
		<section className="athletics-federations" aria-label="Federations">
			<div className="athletics-fed-track">
				<div className="athletics-fed-scroll">
					{Array.from({ length: 3 }, (_, s) =>
						athleticsFederations.map((f, j) => (
							<span key={`${s}-${j}`} className="athletics-fed-item">
								<img src={f.src} alt={f.name} loading="lazy" decoding="async" />
							</span>
						))
					).flat()}
				</div>
			</div>
		</section>
	)
}

const athleticsDocs = [
	{ href: '/diploma-1.png', preview: '/diploma-1.png', label: 'Reconocimiento 2022' },
	{ href: '/diploma-2.png', preview: '/diploma-2.png', label: 'Premio Juvenil 2023' },
	{ href: '/diploma-3.png', preview: '/diploma-3.png', label: 'Reconocimiento 2023' },
	{ href: '/inba-fitnessmania.pdf', preview: '/pdf-preview-inba.png', label: 'INBA — Fitnessmania' },
	{ href: '/zone-labs-certification.pdf', preview: '/pdf-preview-zonelabs.png', label: 'Dr. Sears Zone Labs' },
]

function AthleticsRecognitions() {
	return (
		<section className="athletics-recognitions" aria-label="Recognitions and certifications">
			<p className="athletics-label">Recognitions</p>
			<div className="athletics-docs-grid">
				{athleticsDocs.map((d) => (
					<a key={d.href} href={d.href} target="_blank" rel="noopener noreferrer" className="athletics-doc-card">
						<img src={d.preview} alt={d.label} loading="lazy" decoding="async" />
						<span>{d.label}</span>
					</a>
				))}
			</div>
		</section>
	)
}

function AthleticsHomeButton() {
	const [hovering, setHovering] = useState(false)
	const [pos, setPos] = useState({ x: 0, y: 0 })

	return (
		<>
			<nav className="athletics-home-nav">
				<button
					className="athletics-home-badge"
					onClick={() => { window.location.href = '/' }}
					onMouseEnter={() => setHovering(true)}
					onMouseLeave={() => setHovering(false)}
					onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
					aria-label="Return to main page"
				>
					<span className="athletics-home-m">m</span>
					<span className="athletics-home-title">Athletics</span>
				</button>
			</nav>
			{hovering && (
				<span
					className="athletics-home-tip"
					style={{ left: pos.x + 18, top: pos.y - 14 }}
				>
					Return to main page
				</span>
			)}
		</>
	)
}

function ResumeDownloadLink() {
	const [hovering, setHovering] = useState(false)
	const [pos, setPos] = useState({ x: 0, y: 0 })

	return (
		<>
			<span
				className="resume-dl-wrap"
				onMouseEnter={() => setHovering(true)}
				onMouseLeave={() => setHovering(false)}
				onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
			>
				<a
					href="/resume.pdf"
					download="Manuel_Pena_Morros_Resume.pdf"
					className="resume-dl"
					aria-label="Download Resume"
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
						<polyline points="7 10 12 15 17 10" />
						<line x1="12" y1="15" x2="12" y2="3" />
					</svg>
				</a>
			</span>
			{hovering && (
				<span
					className="resume-dl-tip-cursor"
					style={{ left: pos.x + 18, top: pos.y - 14 }}
				>
					Download
				</span>
			)}
		</>
	)
}

function Logo({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
	return (
		<div className={`logo-container ${className}`}>
			<img 
				src={src} 
				alt={alt}
				className="organization-logo"
			/>
		</div>
	)
}

function TimelineComponent() {
	const [activeIndex, setActiveIndex] = useState(1)
	const [isVisible, setIsVisible] = useState(false)
	const [isScrolling, setIsScrolling] = useState(false)
	const [canScroll, setCanScroll] = useState(true)
	const [imageIndex, setImageIndex] = useState(0)
	const [expandedImage, setExpandedImage] = useState<string | null>(null)
	const timelineRef = useRef<HTMLDivElement>(null)
	const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const [touchStart, setTouchStart] = useState<number | null>(null)
	const [touchEnd, setTouchEnd] = useState<number | null>(null)

	const timelineData = [
		{
			id: 'education1',
			period: 'Class of 2024',
			title: 'The American School Foundation A.C.',
			subtitle: 'Mexico City',
			icon: GraduationCap,
			type: 'education',
			logo: '/asf.svg',
			achievements: [
				'Diploma Programme (DP) - International Baccalaureate'
			],
			images: [
				'/lg-logo.png',
				'/ut-austin-logo.png',
				'/pena-morros-main-min.png'
			]
		},
		{
			id: 'education2',
			period: 'Class of 2029',
			title: 'The University of Texas at Austin',
			subtitle: 'Austin, TX',
			icon: GraduationCap,
			type: 'education',
			logo: '/ut-austin-logo.png',
			achievements: [
				'Data Science major'
			],
			images: [
				'/ut-austin-logo.png',
				'/lg-logo.png',
				'/pena-morros-main-min.png'
			]
		},
		{
			id: 'work1',
			period: 'July 2024 - July 2025',
			title: 'IT Intern',
			subtitle: 'TV Azteca | México City',
			icon: Briefcase,
			type: 'work',
			logo: '/tvazteca.svg',
			achievements: [
				'Developed Python-based web application for Google Lighthouse metrics',
				'Monitored weekly performance for 600+ internal and competition URLs',
				'Improved efficiency by 40% with automated deployment in AWS'
			],
			images: [
				'/pena-morros-main-min.png',
				'/lg-logo.png',
				'/ut-austin-logo.png'
			]
		},
		{
			id: 'work2',
			period: 'June 2025 - August 2025',
			title: 'Frontend Intern',
			subtitle: 'UnifAI | New York City',
			icon: Briefcase,
			type: 'work',
			logo: '/unifai.svg',
			achievements: [
				'Developed frontend components for web applications',
				'Implemented responsive design and user interface improvements',
				'Collaborated with backend team for seamless integration'
			],
			images: [
				'/lg-logo.png',
				'/pena-morros-main-min.png',
				'/ut-austin-logo.png'
			]
		},
		{
			id: 'luminalabs',
			period: 'Jan 2025 – Present',
			title: 'Founder & CEO',
			subtitle: 'Lumina Labs | New Orleans, LA',
			icon: Sparkles,
			type: 'work',
			logo: '/lumina-shape-sm.png',
			achievements: [
				'Founded AI-powered facial analysis platform serving 5 dermatology clinics in Mexico',
				'Secured $2.5M valuation from CitiBank; initiated patent for core technology',
				'Grew to $15,000 MRR via white-labeled SaaS deployment, 1,000+ analyses completed',
				'Launched consumer application on the Apple App Store'
			],
			images: [
				'/lumina-mockup-phones.png',
				'/lumina-hero-composition.png',
				'/lumina-labs-logo.png'
			]
		},
		{
			id: 'leadership',
			period: 'May 2022 - May 2024',
			title: 'Chief Executive Officer',
			subtitle: 'Diaita | Mexico City',
			icon: Users,
			type: 'leadership',
			logo: '/diaita (4).svg',
			achievements: [
				'Developed health and wellness app transforming obesity and diabetes fight',
				'Achieved 1,000+ downloads on Google Play and browser',
				'Generated $3,000 USD revenue serving 500+ clients'
			],
			images: [
				'/ut-austin-logo.png',
				'/lg-logo.png',
				'/pena-morros-main-min.png'
			]
		}
	]

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						setIsVisible(true)
					}
				})
			},
			{ threshold: 0.3 }
		)

		if (timelineRef.current) {
			observer.observe(timelineRef.current)
		}

		return () => observer.disconnect()
	}, [])

	useEffect(() => {
		const handleTouchStart = (e: TouchEvent) => {
			setTouchEnd(null)
			setTouchStart(e.targetTouches[0].clientX)
		}

		const handleTouchMove = (e: TouchEvent) => {
			setTouchEnd(e.targetTouches[0].clientX)
		}

		const handleTouchEnd = () => {
			if (!touchStart || !touchEnd) return
			
			const distance = touchStart - touchEnd
			const isLeftSwipe = distance > 50
			const isRightSwipe = distance < -50

			if (isLeftSwipe && canScroll) {
				setActiveIndex(prev => Math.min(timelineData.length - 1, prev + 1))
				setIsScrolling(true)
				setCanScroll(false)
				setTimeout(() => {
					setIsScrolling(false)
					setCanScroll(true)
				}, 800)
			}
			if (isRightSwipe && canScroll) {
				setActiveIndex(prev => Math.max(0, prev - 1))
				setIsScrolling(true)
				setCanScroll(false)
				setTimeout(() => {
					setIsScrolling(false)
					setCanScroll(true)
				}, 800)
			}
		}

		const timelineElement = timelineRef.current
		if (timelineElement) {
			timelineElement.addEventListener('touchstart', handleTouchStart, { passive: true })
			timelineElement.addEventListener('touchmove', handleTouchMove, { passive: true })
			timelineElement.addEventListener('touchend', handleTouchEnd, { passive: true })
		}

		return () => {
			if (timelineElement) {
				timelineElement.removeEventListener('touchstart', handleTouchStart)
				timelineElement.removeEventListener('touchmove', handleTouchMove)
				timelineElement.removeEventListener('touchend', handleTouchEnd)
			}
		}
	}, [isVisible, canScroll, timelineData.length, touchStart, touchEnd])

	return (
		<div className="timeline-container" ref={timelineRef}>
			<div className="timeline-wrapper">
				<div className="timeline-track">
					<div className="timeline-line"></div>
					<div 
						className="timeline-indicator"
						style={{
							left: `${(activeIndex / (timelineData.length - 1)) * 100}%`
						}}
					></div>
					{timelineData.map((item, index) => (
						<div
							key={item.id}
							className={`timeline-point ${isVisible ? 'visible' : ''} ${activeIndex === index ? 'active' : ''}`}
							style={{
								left: `${(index / (timelineData.length - 1)) * 100}%`,
								animationDelay: `${index * 0.2}s`
							}}
							onClick={() => setActiveIndex(index)}
						>
							<div className="timeline-point-inner">
								{item.logo ? (
									<Logo 
										src={item.logo} 
										alt={`${item.title} logo`}
										className="timeline-point-logo"
									/>
								) : (
									<item.icon size={20} />
								)}
							</div>
							<div className="timeline-point-glow"></div>
						</div>
					))}
				</div>
			</div>

			<div className="timeline-content">
				<div className="timeline-card">
					<div className="timeline-card-header">
						<div className="timeline-card-icon">
							{timelineData[activeIndex].logo ? (
								<Logo 
									src={timelineData[activeIndex].logo} 
									alt={`${timelineData[activeIndex].title} logo`}
									className="timeline-card-logo"
								/>
							) : (
								React.createElement(timelineData[activeIndex].icon, { size: 24 })
							)}
						</div>
						<div className="timeline-card-info">
							<h3>{timelineData[activeIndex].title}</h3>
							<p className="timeline-card-subtitle">{timelineData[activeIndex].subtitle}</p>
							<p className="timeline-card-period">{timelineData[activeIndex].period}</p>
						</div>
					</div>
					<div className="timeline-card-body">
						<ul className="timeline-achievements">
							{timelineData[activeIndex].achievements.map((achievement, index) => (
								<li key={index} style={{ animationDelay: `${index * 0.1}s` }}>
									{achievement}
								</li>
							))}
						</ul>
					</div>
				</div>
			</div>

			<div className="timeline-navigation">
				{timelineData.map((_, index) => (
					<button
						key={index}
						className={`timeline-nav-btn ${activeIndex === index ? 'active' : ''}`}
						onClick={() => setActiveIndex(index)}
					/>
				))}
			</div>
			
			{/* Expanded Image Modal */}
			{expandedImage && (
				<div className="image-modal" onClick={() => setExpandedImage(null)}>
					<div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
						<button 
							className="image-modal-close"
							onClick={() => setExpandedImage(null)}
						>
							<X size={24} />
						</button>
						<img 
							src={expandedImage} 
							alt="Expanded timeline image"
							className="image-modal-image"
						/>
					</div>
				</div>
			)}
		</div>
	)
}
