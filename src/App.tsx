import React, { useEffect, useState, useRef } from 'react'
import { Sun, Moon, Briefcase, GraduationCap, Zap, MessageCircle, X, Send, Target, Code, Users, Award, Lightbulb, Rocket, Bot, ChevronLeft, ChevronRight, Home, Heart, FileText, Mail, FolderOpen } from 'lucide-react'

const sections = [
	{ id: 'about', label: 'Home', icon: Home },
	{ id: 'values', label: 'Values', icon: Heart },
	{ id: 'resume', label: 'Resume', icon: FileText },
	{ id: 'projects', label: 'Projects', icon: FolderOpen },
	{ id: 'articles', label: 'Articles', icon: FileText },
	{ id: 'contact', label: 'Contact', icon: Mail },
]

const projects = [
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
		id: 'project2',
		title: 'TV Azteca Digital Metrics',
		description: 'Digital analytics dashboard with real-time metrics, performance tracking, and data visualization for media analytics. • Login: User / Test',
		technologies: ['React', 'Firebase', 'Chart.js', 'Google Sheets API', 'Real-time Analytics'],
		image: '/project2.jpg',
		link: 'https://aztecadigitalmetrics.netlify.app/',
		github: 'https://github.com/penamorros/dashtva'
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

export default function App() {
	const [menuOpen, setMenuOpen] = useState<boolean>(false)
	const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
	const [colorMode, setColorMode] = useState<boolean>(false)
	const [active, setActive] = useState<string>('about')
	const [wheelSpinning, setWheelSpinning] = useState<boolean>(false)
	const [selectedValue, setSelectedValue] = useState<string | null>(null)
	const [showIntro, setShowIntro] = useState<boolean>(() => {
		// Only show intro if it hasn't been shown in this session
		const hasShownIntro = sessionStorage.getItem('hasShownIntro')
		return !hasShownIntro
	})
	const [chatOpen, setChatOpen] = useState<boolean>(false)
	const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string}>>([])
	const [currentMessage, setCurrentMessage] = useState<string>('')
	const [isLoading, setIsLoading] = useState<boolean>(false)
	const [hoveredValue, setHoveredValue] = useState<string | null>(null)
	const [scrollProgress, setScrollProgress] = useState<number>(0)
	const [headerPosition, setHeaderPosition] = useState<number>(2)
	const [currentProjectIndex, setCurrentProjectIndex] = useState<number>(0)
	const [rotationAngle, setRotationAngle] = useState<number>(0)

	useEffect(() => {
		// Hide intro after 4 seconds and mark as shown
		if (showIntro) {
			const timer = setTimeout(() => {
				setShowIntro(false)
				sessionStorage.setItem('hasShownIntro', 'true')
			}, 4000)
			
			return () => clearTimeout(timer)
		}
	}, [showIntro])


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
		return () => observer.disconnect()
	}, [])

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			setMousePos({ x: e.clientX, y: e.clientY })
		}
		window.addEventListener('mousemove', handleMouseMove)
		return () => window.removeEventListener('mousemove', handleMouseMove)
	}, [])


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

		try {
			const apiKey = (import.meta as any).env.VITE_OPENAI_API_KEY
			console.log('🔑 API Key loaded:', apiKey ? 'Yes' : 'No')
			
			if (!apiKey) {
				throw new Error('OpenAI API key not found in environment variables')
			}

			console.log('📤 Making request to OpenAI API...')
			
			const response = await fetch('https://api.openai.com/v1/chat/completions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${apiKey}`
				},
				body: JSON.stringify({
					model: 'gpt-3.5-turbo',
					messages: [
						{
							role: 'system',
							content: 'You are Manuel Peña-Morros, a full-stack engineer passionate about building scalable systems and elegant user experiences. You enjoy solving complex problems with clean, data-driven solutions and intuitive design. You are friendly, professional, and genuinely enthusiastic about technology, thriving in environments that combine creativity with engineering precision. Currently studying Computer Science at Tulane University (Dean\'s List, Fall 2025) after graduating from The American School Foundation\'s International Baccalaureate program in Mexico City, you bring both analytical rigor and creative vision to your work. At TV Azteca, you engineered a Python-based automation system that collects and monitors weekly Lighthouse performance metrics for over 600 URLs (HTML and AMP), boosting efficiency by 40% through automation, while developing link-tracking tools and digital dashboards in React to visualize over 2,000 real-time events. At UnifAI in New York, you focused on the frontend, creating responsive UIs with React, TypeScript, and TailwindCSS, implementing real-time charts and drill-down features, and delivering a UI refactor that improved engagement by 25%. As founder and CEO of Diaita, a wellness startup addressing obesity and diabetes in Mexico, you led product design and strategy, collaborated with nutrition pioneer Barry Sears, achieved 1,000+ downloads and $3,000 USD in revenue, and helped 500 clients build sustainable health habits. Keep responses conversational and concise, as if you\'re chatting with someone who visited your portfolio.'
						},
						...newMessages
					],
					max_tokens: 150,
					temperature: 0.7
				})
			})

			const data = await response.json()
			console.log('📥 OpenAI Response:', data)
			
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${data.error?.message || 'Unknown error'}`)
			}
			
			if (data.choices && data.choices[0]) {
				const aiMessage = { role: 'assistant', content: data.choices[0].message.content }
				setChatMessages([...newMessages, aiMessage])
				
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
			setChatMessages([...newMessages, errorMessage])
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className={`app ${colorMode ? 'color-mode' : ''}`}>
			{showIntro && (
				<div className="intro-overlay">
					<img src="/signature-intro.gif" alt="Signature animation" className="intro-signature" onError={(e) => {
						console.error('Failed to load intro GIF');
						setShowIntro(false);
					}} />
				</div>
			)}
			
			{/* Left Side Navigation */}
			<nav className="left-nav">
				{/* Logo */}
				<button 
					className="nav-logo" 
					onClick={() => scrollTo('about')}
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
							onClick={() => scrollTo(section.id)}
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
					onClick={() => setColorMode(!colorMode)}
					aria-label="Toggle theme"
				>
					{colorMode ? <Sun size={20} /> : <Moon size={20} />}
				</button>
			</nav>

			
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
					animation: fadeOut 0.5s ease-out 3.5s forwards;
				}
				
				@keyframes fadeOut {
					to {
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
				}
				
				@font-face {
					font-family: 'Organical';
					src: url('/ORGANICAL PERSONAL USE.ttf') format('truetype');
					font-weight: normal;
					font-style: normal;
				}

				@font-face {
					font-family: 'OrangeAvenue';
					src: url('/OrangeAvenueDEMO-Regular.otf') format('opentype');
					font-weight: normal;
					font-style: normal;
				}

				@font-face {
					font-family: 'Dumbledor';
					src: url('/Dumbledor-Regular.ttf') format('truetype');
					font-weight: normal;
					font-style: normal;
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
					font-family: 'Futura', sans-serif;
					font-size: clamp(2.5rem, 5vw, 4rem);
					font-weight: normal;
					line-height: 1.1;
					margin-bottom: 1.5rem;
					color: #ffffff;
					animation: fadeInUp 0.8s ease-out;
					letter-spacing: 0.02em;
					min-height: 1.2em;
					text-shadow: 0 0 30px rgba(255, 255, 255, 0.4);
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
				
				.coin-front,
				.coin-back {
					position: absolute;
					width: 100%;
					height: 100%;
					border-radius: 50%;
					backface-visibility: hidden;
					border: 1px solid #ffffff;
					box-shadow: 0 20px 60px rgba(255, 255, 255, 0.1);
					overflow: hidden;
					transform: rotateY(0deg);
				}
				
				.coin-front {
					background: transparent;
					animation: portraitGlow 4s ease-in-out infinite alternate;
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
					font-family: 'Futura', sans-serif;
					font-size: 3.5rem;
					font-weight: normal;
					margin-bottom: 3rem;
					text-align: center;
					color: #ffffff;
					text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
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
					font-size: 1.5rem;
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

				/* Responsive design */
				@media (max-width: 768px) {
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
				.articles-grid {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
					gap: 2rem;
					margin-top: 3rem;
					max-width: 1200px;
					margin-left: auto;
					margin-right: auto;
				}

				.article-card {
					background: rgba(255, 255, 255, 0.03);
					backdrop-filter: blur(10px);
					-webkit-backdrop-filter: blur(10px);
					border: 1px solid rgba(255, 255, 255, 0.1);
					border-radius: 20px;
					padding: 0;
					position: relative;
					overflow: hidden;
					transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
					transform-style: preserve-3d;
					animation: articleSlideIn 0.8s ease-out forwards;
					opacity: 0;
					transform: translateY(50px);
				}

				.article-image-container {
					position: relative;
					width: 100%;
					height: 300px;
					overflow: hidden;
					border-radius: 20px 20px 0 0;
				}

				.article-image {
					width: 100%;
					height: 100%;
					object-fit: cover;
					object-position: center top;
					transition: transform 0.6s ease;
					display: block;
				}

				.article-overlay {
					position: absolute;
					top: 0;
					left: 0;
					right: 0;
					bottom: 0;
					background: linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.1) 100%);
					opacity: 0.7;
					transition: opacity 0.3s ease;
				}

				.article-card:hover .article-image {
					transform: scale(1.05);
				}

				.article-card:hover .article-overlay {
					opacity: 0.5;
				}

				@keyframes articleSlideIn {
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}

				.article-card::before {
					content: '';
					position: absolute;
					top: 0;
					left: 0;
					right: 0;
					bottom: 0;
					background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
					opacity: 0;
					transition: opacity 0.3s ease;
					border-radius: 20px;
				}

				.article-card:hover::before {
					opacity: 1;
				}

				.article-card:hover {
					background: rgba(255, 255, 255, 0.05);
					border-color: rgba(255, 255, 255, 0.2);
					transform: 
						translateY(-15px) 
						translateZ(20px) 
						rotateX(5deg) 
						rotateY(2deg) 
						scale(1.02);
					box-shadow: 
						0 20px 40px rgba(0, 0, 0, 0.3),
						0 0 0 1px rgba(255, 255, 255, 0.1);
				}

				.article-header {
					display: flex;
					justify-content: space-between;
					align-items: flex-start;
					margin-bottom: 1.5rem;
					padding: 0 2rem;
					padding-top: 2rem;
				}

				.article-category {
					background: rgba(255, 255, 255, 0.1);
					color: #ffffff;
					padding: 0.5rem 1rem;
					border-radius: 20px;
					font-size: 0.8rem;
					font-weight: 600;
					text-transform: uppercase;
					letter-spacing: 0.5px;
					border: 1px solid rgba(255, 255, 255, 0.2);
				}

				.article-meta {
					display: flex;
					flex-direction: column;
					align-items: flex-end;
					gap: 0.25rem;
				}

				.article-date {
					color: #888;
					font-size: 0.8rem;
					font-weight: 500;
				}

				.article-read-time {
					color: #666;
					font-size: 0.7rem;
				}

				.article-content {
					margin-bottom: 2rem;
					padding: 0 2rem;
				}

				.article-title {
					font-size: 1.4rem;
					font-weight: 700;
					color: #ffffff;
					margin-bottom: 0.5rem;
					line-height: 1.3;
				}

				.article-publication {
					color: #888;
					font-size: 0.9rem;
					font-weight: 500;
					margin-bottom: 1rem;
				}

				.article-description {
					color: #ccc;
					font-size: 0.95rem;
					line-height: 1.6;
					margin: 0;
				}

				.article-footer {
					display: flex;
					justify-content: flex-end;
					padding: 0 2rem 2rem 2rem;
				}

				.article-link {
					color: #ffffff;
					text-decoration: none;
					font-weight: 600;
					font-size: 0.9rem;
					transition: all 0.3s ease;
					display: flex;
					align-items: center;
					gap: 0.5rem;
					cursor: pointer;
					position: relative;
					z-index: 10;
				}

				.article-link:hover {
					color: rgba(255, 255, 255, 0.8);
					transform: translateX(5px);
					text-decoration: underline;
				}

				.article-link:active {
					transform: translateX(2px);
				}

				/* Light mode adjustments for articles */
				.app.color-mode .article-card {
					background: rgba(0, 0, 0, 0.03);
					backdrop-filter: blur(10px);
					-webkit-backdrop-filter: blur(10px);
					border: 1px solid rgba(0, 0, 0, 0.15);
				}

				.app.color-mode .article-card::before {
					background: linear-gradient(135deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.05) 100%);
				}

				.app.color-mode .article-card:hover {
					background: rgba(0, 0, 0, 0.06);
					border-color: rgba(0, 0, 0, 0.25);
				}

				.app.color-mode .article-title {
					color: #000000;
				}

				.app.color-mode .article-description {
					color: #333;
				}

				.app.color-mode .article-date {
					color: #666;
				}

				.app.color-mode .article-read-time {
					color: #888;
				}

				.app.color-mode .article-publication {
					color: #666;
				}

				.app.color-mode .article-category {
					background: rgba(0, 0, 0, 0.1);
					color: #000000;
					border: 1px solid rgba(0, 0, 0, 0.2);
				}

				.app.color-mode .article-link {
					color: #000000;
				}

				.app.color-mode .article-link:hover {
					color: rgba(0, 0, 0, 0.8);
				}

				/* Responsive design for articles */
				@media (max-width: 768px) {
					.articles-grid {
						grid-template-columns: 1fr;
						gap: 1.5rem;
						margin-top: 2rem;
					}

					.article-image-container {
						height: 200px;
					}

					.article-title {
						font-size: 1.2rem;
					}

					.article-header {
						flex-direction: column;
						gap: 1rem;
						align-items: flex-start;
						padding: 0 1.5rem;
						padding-top: 1.5rem;
					}

					.article-content {
						padding: 0 1.5rem;
					}

					.article-footer {
						padding: 0 1.5rem 1.5rem 1.5rem;
					}

					.article-meta {
						align-items: flex-start;
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
				
				@media (max-width: 768px) {
					.left-nav {
						left: 1rem;
						padding: 0.75rem 0.4rem;
						gap: 0.5rem;
					}
					
					.nav-logo {
						width: 45px;
						height: 45px;
						padding: 0.6rem;
						font-size: 1.3rem;
					}
					
					.nav-theme-toggle {
						width: 45px;
						height: 45px;
						padding: 0.6rem;
					}
					
					.nav-item {
						width: 45px;
						height: 45px;
						padding: 0.6rem;
					}
					
					.section h2 {
						font-size: 2.8rem;
					}
					
					.values-content h2 {
						font-size: 2.8rem;
						text-align: center;
					}
					
					.experience-section h2 {
						font-size: 2.5rem;
					}
					
					.values-container {
						grid-template-columns: 1fr;
						gap: 3rem;
						text-align: center;
					}
					
					.values-visual {
						height: 500px;
					}
					
					.values-image {
						width: 300px;
						height: 300px;
					}
					
					.pixel-trace-container {
						width: 300px;
						height: 300px;
					}
					
					.values-circle {
						width: 400px;
						height: 400px;
						border-color: rgba(0, 0, 0, 0.2);
						background: rgba(0, 0, 0, 0.02);
						box-shadow: 
							inset 0 0 20px rgba(0, 0, 0, 0.1),
							0 0 40px rgba(0, 0, 0, 0.05),
							0 0 80px rgba(0, 0, 0, 0.02);
					}
					
					.value-icon {
						width: 40px;
						height: 40px;
					}

					.value-label {
						font-size: 0.8rem;
					}
					
					.hero-wrap {
						grid-template-columns: 1fr;
						gap: 3rem;
						text-align: center;
					}
					
					.hero-visual {
						height: 500px;
						padding: 1rem;
						text-align: center;
					}
					
					.photo-wrap {
						background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.02) 0%, transparent 50%),
									radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.01) 0%, transparent 50%);
						animation: portraitGlowStatic 4s ease-in-out infinite alternate;
						width: 340px;
						height: 340px;
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
						top: 0;
						left: 0;
						width: 100%;
						height: 100%;
					}
					
					.chat-toggle {
						top: 60px;
						right: -220px;
						width: 40px;
						height: 40px;
						padding: 0.5rem;
					}
					
					.thinking-bubbles {
						top: 40px;
						right: -112px;
					}
					
					.chat-toggle-text {
						top: 70px;
						right: -250px;
						font-size: 0.6rem;
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
						width: 250px;
						height: 250px;
					}
					
					.chat-messages {
						max-height: none;
					}
					
					.avatar-gif {
						width: 90px;
						height: 90px;
					}
					
					.chat-message {
						font-size: 0.7rem;
					}
					
					.chat-input {
						font-size: 0.7rem;
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
			`}</style>


			<main className="main">
				<section id="about" className="section hero reveal tone-1">
					<div className="container hero-wrap">
						<div style={{ textAlign: 'left' }}>
							<h1 className="title">Entrepreneur. Innovator. Visionary.</h1>
							<p className="subtitle">
								I build and scale businesses from concept to market — turning ideas into profitable ventures.
							</p>
							<div className="cta-row">
								<button className="button primary" onClick={() => scrollTo('resume')}>See Resume</button>
								<button className="button" onClick={() => scrollTo('contact')}>Get in Touch</button>
							</div>
						</div>
						<div className="hero-visual">
							<div className="orbit orbit-a" aria-hidden></div>
							<div className="orbit orbit-b" aria-hidden></div>
							<div className={`photo-wrap ${chatOpen ? 'chat-open' : ''}`}>
								<div className="coin-inner">
									<div className="coin-front">
										<img
											src="/Diseno-sin-titulo-97.png"
											alt="Portrait of Manuel Peña Morros"
											className="hero-photo"
											decoding="async"
											loading="eager"
										/>
									</div>
									<div className="coin-back">
										<div className="coin-back-content">
											{/* 3D Avatar - Fixed at top */}
											<div className="chat-avatar">
												<img 
													src="/b5d45f39-8e44-4be3-a96d-f6d5a7d75eee.mp4 (1).gif" 
													alt="Manuel Peña Morros 3D Avatar" 
													className="avatar-gif"
												/>
											</div>
											
											{/* Chat Interface - Below avatar */}
											<div className="chat-interface">
												{chatMessages.length === 0 && (
													<div className="chat-welcome">
														Hello! I'm Manuel's AI avatar. I can tell you about my professional background, projects, and experience. What would you like to know? 🤖
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
														onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
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


				<section id="resume" className="section reveal tone-2 tone-sep">
					<div className="container">
						<h2>Resume</h2>
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
												<iframe
													width="100%"
													height="120"
													className="project-video"
													src="https://www.youtube.com/embed/fSpEoc4jweE?autoplay=1&loop=1&playlist=fSpEoc4jweE&mute=1"
													title="YouTube video player"
													frameBorder="0"
													allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
													allowFullScreen
													style={{
														borderRadius: '15px',
														border: 'none'
													}}
												></iframe>
											) : (
												<video 
													autoPlay
													muted
													loop
													playsInline
													width="100%" 
													height="120"
													className="project-video"
													onClick={() => {
														// Open video in fullscreen/modal
														const video = document.createElement('video');
														video.src = index === 0 ? '/bb.mp4' : index === 1 ? '/1.mov' : '/1.mov';
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
													<source src={index === 0 ? '/bb.mp4' : index === 1 ? '/1.mov' : '/1.mov'} type="video/mp4" />
													Your browser does not support the video tag.
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
														<a href={project.link} className="project-link" target="_blank" rel="noopener noreferrer">
															Live Demo
														</a>
														<a href={project.github} className="project-link" target="_blank" rel="noopener noreferrer">
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
					</div>
				</section>

				{/* Articles Section */}
				<section id="articles" className="section reveal tone-1 tone-sep">
					<div className="container">
						<h2>Article Mentions</h2>
						<div className="articles-grid">
							{articles.map((article, index) => (
								<ArticleCard key={article.id} article={article} index={index} />
							))}
						</div>
					</div>
				</section>

				<section id="contact" className="section alt reveal tone-1 tone-sep">
					<div className="container">
						<h2>Contact Card</h2>
						<BusinessCard />
					</div>
				</section>
			</main>

			<footer className="site-footer">
				<div className="container">
					<p className="muted">© {new Date().getFullYear()} Manuel Peña Morros. All rights reserved.</p>
				</div>
			</footer>
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
		<div className="article-card" style={{ animationDelay: `${index * 0.2}s` }}>
			<div className="article-image-container">
				<img src={article.image} alt={article.title} className="article-image" />
				<div className="article-overlay"></div>
			</div>
			<div className="article-header">
				<div className="article-category">{article.category}</div>
				<div className="article-meta">
					<span className="article-date">{article.date}</span>
					<span className="article-read-time">{article.readTime}</span>
				</div>
			</div>
			<div className="article-content">
				<h3 className="article-title">{article.title}</h3>
				<p className="article-publication">{article.publication}</p>
				<p className="article-description">{article.description}</p>
			</div>
			<div className="article-footer">
				<a 
					href={article.link} 
					className="article-link" 
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
					Read Article →
				</a>
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
						<div className="contact-item">
							<Mail className="contact-icon" />
							<span>penamorrosm@gmail.com</span>
						</div>
						<div className="contact-item">
							<MessageCircle className="contact-icon" />
							<span>linkedin.com/in/manuelpenamorros</span>
						</div>
						<div className="contact-item">
							<Code className="contact-icon" />
							<span>github.com/penamorros</span>
						</div>
					</div>
					
					{/* Signature */}
					<div className="business-card-signature">
						<img src="/Gradient-Icon-Map-Navigation-App-Logo-500-x-150-px.png" alt="Manuel Peña Morros signature" className="signature-img" />
					</div>
				</div>
			</div>
		</div>
	)
}

function Signature() {
	return (
		<img src="/Gradient-Icon-Map-Navigation-App-Logo-500-x-150-px.png" alt="Manuel Peña-Morros signature" className="signature-img" />
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
						// Start playing when video becomes visible
						if (!hasPlayed) {
							video.play()
							setHasPlayed(true)
						}
					} else {
						setIsVisible(false)
						// Pause when video is not visible
						video.pause()
					}
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
			muted
			playsInline
			preload="auto"
			style={getFilterStyle()}
		/>
	)
}

// Logo component for SVG logos with dark/light mode support
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
	const [activeIndex, setActiveIndex] = useState(0)
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
				'/Tulane-University-Logo.png',
				'/pena-morros-main-min.png'
			]
		},
		{
			id: 'education2',
			period: 'Class of 2029',
			title: 'Tulane University',
			subtitle: 'New Orleans',
			icon: GraduationCap,
			type: 'education',
			logo: '/tulane.svg',
			achievements: [
				'Computer Science major',
				'Dean\'s List Fall 2025'
			],
			images: [
				'/Tulane-University-Logo.png',
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
				'Developed Python-based web application for Lighthouse metrics monitoring',
				'Monitored weekly performance for 600+ internal and competition URLs',
				'Improved efficiency by 40% with automated deployment in AWS'
			],
			images: [
				'/pena-morros-main-min.png',
				'/lg-logo.png',
				'/Tulane-University-Logo.png'
			]
		},
		{
			id: 'work2',
			period: '2024 - Present',
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
				'/Tulane-University-Logo.png'
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
				'/Tulane-University-Logo.png',
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
