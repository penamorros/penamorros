import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import './site.css'
import './motion.css'
import './responsive.css'
import './type.css'
import './touches.css'
import './chat.css'
import './premium.css'
import './resume-log.css'
import './safari.css' // last: it undoes the two things Safari cannot do at speed
import { startIntro } from './motion/intro'

const container = document.getElementById('root')!
createRoot(container).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
)

// ?diag=1 — the browser benchmarks itself and prints the result (src/diag.ts)
if (/[?&]diag/.test(location.search)) import('./diag').then((m) => m.runDiag())

// The signature's ink flies into the hero's circle once the page is there (index.html wrote the signature).
startIntro()
