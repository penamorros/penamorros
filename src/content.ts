import {
	Award, Briefcase, Cloud, Code, Cpu, Database, FileText, FolderOpen, GitBranch, Globe, GraduationCap, Heart,
	Home, Layers, Lightbulb, Mail, Palette, Rocket, Server, Smartphone, Sparkles, Target, Terminal, Users, Zap,
} from './icons'

export const sections = [
	{ id: 'about', label: 'Home', icon: Home },
	{ id: 'values', label: 'Values', icon: Heart },
	{ id: 'skills', label: 'Skills', icon: Zap },
	{ id: 'resume', label: 'Resume', icon: FileText },
	{ id: 'projects', label: 'Projects', icon: FolderOpen },
	{ id: 'articles', label: 'Articles', icon: FileText },
	{ id: 'contact', label: 'Contact', icon: Mail },
]

export const projects = [
	{
		id: 'project2',
		title: 'TV Azteca Digital Metrics',
		description: 'Digital analytics dashboard with real-time metrics, performance tracking, and data visualization for media analytics.',
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

export const CHAT_SYSTEM_PROMPT = `You are Manuel Peña-Morros's AI avatar on his portfolio website. Speak in first person as Manuel. Be enthusiastic, energetic, and personable — like a young founder genuinely excited to talk about what he's building. Keep it concise (2–4 sentences unless more detail is requested).

TONE:
- Sound like Manuel, not a generic assistant. NEVER say things like "How can I assist you today?", "As an AI language model", or "I am a language model".
- Greet people with energy, e.g. "Hey! Great to have you here — I'm Manuel. Ask me anything about Lumina Labs, my projects, or my journey!"
- Show genuine passion when talking about Lumina Labs, bodybuilding, and building products. It's okay to use an exclamation point or two, but don't overdo it.

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

CONTACT: Austin, TX · github.com/penamorros · penamorros.com
Keep responses conversational, as if chatting with someone who visited the portfolio.`

export const articles = [
	{
		id: 'article1',
		title: 'Javier Smiley and Manuel Peña-Morros Lead "Aventuras en Salud"',
		publication: 'CHIC Magazine',
		date: 'February 2024',
		description: 'Two young visionaries are reshaping children\'s health education through a foundation that inspires healthy habits and positive lifestyle change across Mexico.',
		link: 'https://www.chicmagazine.com.mx/personajes/javier-smiley-y-manuel-pena-morros-al-frente-de-aventuras-en-salud',
		category: 'Health & Leadership',
		readTime: '5 min read',
		image: '/articles/chic.png'
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

export const values = [
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

export const skills = [
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

export const timelineData = [
{
	id: 'education1',
	city: 'mex',
	period: 'Class of 2024',
	title: 'The American School Foundation A.C.',
	subtitle: 'Mexico City',
	icon: GraduationCap,
	type: 'education',
	logo: '/logo-asf.webp',
	achievements: [
		'Diploma Programme (DP) - International Baccalaureate'
	]
},
{
	id: 'education2',
	city: 'atx',
	period: 'Class of 2029',
	title: 'The University of Texas at Austin',
	subtitle: 'Austin, TX',
	icon: GraduationCap,
	type: 'education',
	logo: '/ut-austin-logo.png',
	achievements: [
		'Data Science major'
	]
},
{
	id: 'work1',
	city: 'mex',
	period: 'July 2024 - July 2025',
	title: 'IT Intern',
	subtitle: 'TV Azteca | México City',
	icon: Briefcase,
	type: 'work',
	logo: '/logo-tvazteca.webp',
	achievements: [
		'Developed Python-based web application for Google Lighthouse metrics',
		'Monitored weekly performance for 600+ internal and competition URLs',
		'Improved efficiency by 40% with automated deployment in AWS'
	]
},
{
	id: 'work2',
	city: 'nyc',
	period: 'June 2025 - August 2025',
	title: 'Frontend Intern',
	subtitle: 'UnifAI | New York City',
	icon: Briefcase,
	type: 'work',
	logo: '/logo-unifai.webp',
	achievements: [
		'Developed frontend components for web applications',
		'Implemented responsive design and user interface improvements',
		'Collaborated with backend team for seamless integration'
	]
},
{
	id: 'luminalabs',
	city: 'nola',
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
	]
},
{
	id: 'leadership',
	city: 'mex',
	period: 'May 2022 - May 2024',
	title: 'Chief Executive Officer',
	subtitle: 'Diaita | Mexico City',
	icon: Users,
	type: 'leadership',
	logo: '/logo-diaita.webp',
	achievements: [
		'Developed health and wellness app transforming obesity and diabetes fight',
		'Achieved 1,000+ downloads on Google Play and browser',
		'Generated $3,000 USD revenue serving 500+ clients'
	]
}
]

export const athleticsStagePhotos = [
	{ src: '/athlete-1.webp', caption: 'INBA México National Qualifier', size: 'small', slider: true },
	{ src: '/athlete-2.webp', caption: 'Mr. México Amateur — 2nd Place', size: 'tall', slider: false },
	{ src: '/athlete-3.webp', caption: 'Miss & Mister Natural México', size: 'tall', slider: false },
] as const

export const athleticsFederations = [
	{ src: '/fed-inba-global.png', name: 'INBA Global' },
	{ src: '/fed-wabba.png', name: 'WABBA International' },
	{ src: '/fed-fitnessmania.png', name: 'Fitnessmania' },
	{ src: '/fed-nabba.png', name: 'NABBA' },
]

export const athleticsDocs = [
	{ href: '/diploma-1.png', preview: '/diploma-1.png', label: 'Recognition 2022' },
	{ href: '/diploma-2.png', preview: '/diploma-2.png', label: 'Youth Award 2023' },
	{ href: '/diploma-3.png', preview: '/diploma-3.png', label: 'Recognition 2023' },
	{ href: '/inba-fitnessmania.pdf', preview: '/pdf-preview-inba.png', label: 'INBA — Fitnessmania' },
	{ href: '/zone-labs-certification.pdf', preview: '/pdf-preview-zonelabs.png', label: 'Dr. Sears Zone Labs' },
]

