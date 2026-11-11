// Analytics and the chat database only run on the real site, so local runs and client previews never touch live data.
export const isLiveSite = /(^|\.)manuel\.solutions$/.test(window.location.hostname)

type ChatLogEntry = { role: 'user' | 'assistant'; content: string; sessionId: string }

// Firebase is large, so it loads only when a real chat message needs saving. A failed save must not break the chat.
export async function saveChatMessage({ role, content, sessionId }: { role: string; content: string; sessionId: string }) {
	if (!isLiveSite) return
	try {
		const { chatService } = await import('./services/chatService')
		await chatService.saveMessage({ role, content, sessionId } as ChatLogEntry)
	} catch {
		// the conversation carries on without the log
	}
}
