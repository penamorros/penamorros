import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	// Local previews use the existing hosted function and its server-side key.
	server: {
		proxy: {
			'/.netlify/functions/chat': { target: 'https://manuel.solutions', changeOrigin: true, secure: true },
		},
	},
	esbuild: {
		pure: ['console.log'],
	},
	// avatar.html: the AI twin's 3D body, loaded into the chat circle only when the chat is wanted (src/avatar/main.ts)
	build: {
		rollupOptions: { input: { main: resolve(__dirname, 'index.html'), avatar: resolve(__dirname, 'avatar.html') } },
	},
	worker: { format: 'es' },
})
