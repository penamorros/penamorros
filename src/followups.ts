// The questions offered under each of the twin's answers (the client, 2026-11-16: "so the user can click and click
// without typing"). Every one of them can be answered from the facts in CHAT_SYSTEM_PROMPT (src/content.ts) — when a
// fact is added or removed there, keep this list in step. The picker remembers what has been asked in this
// conversation, so nothing is offered twice, and it always leaves one door open to a different subject.

const BANK: Record<string, string[]> = {
	lumina: ['What is Lumina Labs?', 'Who uses Lumina Labs?', 'How much is Lumina worth?', "What's Lumina's revenue?", 'Is there an app I can download?', 'Is the technology patented?'],
	education: ['What are you studying?', 'What classes are you taking?', 'Where did you study before UT?', 'Where did you go to high school?'],
	work: ['Where have you worked?', 'What did you do at TV Azteca?', 'What did you do at UnifAI?'],
	diaita: ['What was Diaita?', 'How many people used Diaita?', 'Who did you work with at Diaita?'],
	athletics: ['Have you won any competitions?', 'Which federations do you compete in?', 'Any certifications?'],
	skills: ["What's your tech stack?", 'What projects have you built?'],
	next: ["What's next for you?", 'Are you getting into acting?', 'How old are you?'],
	contact: ['Can I book a call with you?', 'How can I reach you?'],
}

// Which subject a question-and-answer is about. First match in this order wins on a tie.
const SIGNS: Record<string, RegExp> = {
	lumina: /lumina|facial|dermatolog|clinic|valuation|mrr|patent|app store/i,
	education: /stud(y|ying|ied)|class(es)?|course|major|ut austin|university|tulane|school|degree|baccalaureate/i,
	work: /intern|azteca|unifai|worked|experience|job|lighthouse|dashboard/i,
	diaita: /diaita|wellness|nutrition|barry sears|health app/i,
	athletics: /bodybuild|inba|wabba|nabba|fitnessmania|medal|troph|competition|compete|zone labs|athlet/i,
	skills: /stack|react|typescript|python|skills?|projects?|built|aws|tensorflow/i,
	next: /next|acting|casting|future|plans?|\bage\b|years old/i,
	contact: /call|meet|reach|contact|e-?mail|hire|book/i,
}
const ORDER = Object.keys(BANK)
const key = (q: string) => q.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

export const FIRST_QUESTIONS = ['What is Lumina Labs?', 'What are you studying?', 'Have you won any competitions?']

/**
 * Three questions to offer after an answer: up to two more on the same subject, then one from the next subject that
 * still has something unasked. `asked` is this conversation's memory — the caller adds each sent message to it.
 */
export function nextQuestions(question: string, answer: string, asked: Set<string>): string[] {
	const text = `${question} ${answer}`
	const scores = ORDER.map((topic) => (text.match(new RegExp(SIGNS[topic].source, 'gi')) || []).length)
	const best = scores.indexOf(Math.max(...scores))
	const topic = scores[best] > 0 ? ORDER[best] : ORDER[0]
	const fresh = (list: string[]) => list.filter((q) => !asked.has(key(q)))
	const picks = fresh(BANK[topic]).slice(0, 2)
	// then walk the other subjects, starting after this one, one question each
	for (let step = 1; step < ORDER.length && picks.length < 3; step++) {
		const other = fresh(BANK[ORDER[(ORDER.indexOf(topic) + step) % ORDER.length]])
		if (other.length) picks.push(other[0])
	}
	return picks
}

export const rememberQuestion = (asked: Set<string>, q: string) => { asked.add(key(q)) }
