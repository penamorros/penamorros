// The AI twin's server side: forwards the conversation to OpenAI with the key kept on the server.
// Built so a visitor always gets an answer: the history is trimmed, the reply has room to finish, and a failed or
// empty reply is retried (once more on the same model, then on a fallback model) before anything is reported back.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (statusCode, body) => ({ statusCode, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const redact = (s) => String(s || '').replace(/sk-[a-zA-Z0-9_-]+/g, '[REDACTED]');

const DEFAULT_MODEL = 'gpt-5.6-terra';
const FALLBACK_MODEL = 'gpt-5-mini';
const MAX_HISTORY = 24; // messages kept after the system prompt
const MAX_CHARS = 4000; // per message
const BUDGET_MS = 9000; // Netlify stops a function at 10 s

async function ask(apiKey, body, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), Math.max(1500, timeoutMs));
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    let data = null;
    try { data = await res.json(); } catch { /* not JSON */ }
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    return { ok: false, status: e?.name === 'AbortError' ? 504 : 502, data: { error: { message: e?.message || 'network error' } } };
  } finally {
    clearTimeout(timer);
  }
}

const textOf = (data) => {
  const c = data?.choices?.[0]?.message?.content;
  return typeof c === 'string' ? c.trim() : '';
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return json(500, { error: 'Service configuration error', message: 'Set OPENAI_API_KEY in the Netlify environment variables.' });

  let req;
  try { req = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid JSON in request body' }); }
  const { messages, model = DEFAULT_MODEL, max_tokens = 500 } = req;
  if (!Array.isArray(messages) || !messages.length) return json(400, { error: 'Messages array is required' });

  // keep the system prompt, then only the most recent turns, each of a sane size and a known role
  const clean = messages
    .filter((m) => m && typeof m.content === 'string' && ['system', 'user', 'assistant'].includes(m.role))
    .map((m) => ({ role: m.role, content: m.content.slice(0, m.role === 'system' ? 20000 : MAX_CHARS) }));
  const system = clean.filter((m) => m.role === 'system').slice(0, 1);
  let turns = clean.filter((m) => m.role !== 'system').slice(-MAX_HISTORY);
  while (turns.length && turns[0].role !== 'user') turns = turns.slice(1); // a conversation starts with the visitor
  if (!turns.length) return json(400, { error: 'No user message' });
  const convo = [...system, ...turns];

  const started = Date.now();
  const left = () => BUDGET_MS - (Date.now() - started);
  const tokens = Math.min(2000, Math.max(500, Number(max_tokens) || 500));

  // attempt 1: the chosen model; attempt 2: same model with more room; attempt 3: the fallback model
  const attempts = [
    { model, max_completion_tokens: tokens },
    { model, max_completion_tokens: tokens * 2 },
    { model: FALLBACK_MODEL, max_completion_tokens: tokens * 2 },
  ];
  let last = null;
  for (const a of attempts) {
    if (left() < 1500) break;
    const r = await ask(apiKey, { ...a, messages: convo }, left() - 300);
    last = r;
    const text = r.ok ? textOf(r.data) : '';
    if (text) return json(200, r.data);
    // a bad request (other than an unknown model) will fail the same way again
    const msg = r.data?.error?.message || '';
    if (r.status === 400 && !/model/i.test(msg)) break;
    if (r.status === 401 || r.status === 403) break;
  }
  const status = last && !last.ok ? last.status : 502;
  return json(status || 502, { error: 'API request failed', message: redact(last?.data?.error?.message || 'Empty reply') });
};
