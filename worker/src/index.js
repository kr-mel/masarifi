// مصاريفي AI — Cloudflare Worker (Groq). Holds the API key server-side; the app
// POSTs { message, summary, history } and gets back { reply }.
const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

// Robust language guess: any Latin letters => English, else Arabic.
const langOf = t => /[A-Za-z]/.test(t || '') ? 'en' : 'ar';

function systemPrompt(summary, isContinuing) {
  return [
    `LANGUAGE RULE (most important): detect the language of the user's LAST message and reply EXCLUSIVELY in it. Arabic → Arabic, English → English. Never switch language mid-conversation.`,
    `You are "مساعد مصاريفي", a warm, concise personal-finance assistant inside an Arabic expense-tracker app. You help the user understand their spending and save money. Keep replies short (2–5 sentences) unless they ask for detail.`,
    `Use ONLY the numbers in the DATA block below. NEVER invent figures. If the data lacks the answer, say so briefly and suggest logging more expenses. Amounts are in the user's currency.`,
    `Give specific, actionable advice tied to their real categories/amounts — no generic platitudes, no medical/legal claims, no investment guarantees.`,
    isContinuing ? `This is a continuing conversation: do NOT greet again; answer directly.` : ``,
    `\n--- DATA (current month) ---\n${summary || '(no data provided)'}\n--- END DATA ---`
  ].filter(Boolean).join('\n\n');
}

const json = (obj, status, cors) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...cors } });

async function callGroq(key, body) {
  return fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify(body)
  });
}

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return new Response('POST only', { status: 405, headers: cors });

    let data;
    try { data = await request.json(); } catch { return json({ reply: 'bad request' }, 400, cors); }
    const message = String(data.message || '').slice(0, 2000);
    const summary = String(data.summary || '').slice(0, 4000);
    const history = Array.isArray(data.history) ? data.history.slice(-8) : [];
    const lang = langOf(message);
    if (!message) return json({ reply: '' }, 200, cors);

    const messages = [{ role: 'system', content: systemPrompt(summary, history.length > 0) }];
    for (const h of history) {
      if (h && h.role && h.text) messages.push({ role: h.role === 'user' ? 'user' : 'assistant', content: String(h.text).slice(0, 2000) });
    }
    messages.push({ role: 'user', content: message });

    const body = { model: MODEL, messages, temperature: 0.6, max_tokens: 1024 };

    const keys = (env.GROQ_API_KEYS || env.GROQ_API_KEY || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!keys.length) return json({ reply: lang === 'ar' ? 'المساعد غير مهيّأ بعد.' : 'Assistant not configured.' }, 200, cors);

    const start = Math.floor(Math.random() * keys.length);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[(start + i) % keys.length];
      let r;
      try { r = await callGroq(key, body); } catch { continue; }
      if (r.status === 429 || r.status >= 500 || !r.ok) continue;      // rate-limit / busy → fail over
      const j = await r.json().catch(() => null);
      const text = j?.choices?.[0]?.message?.content?.trim();
      if (text) return json({ reply: text }, 200, cors);
    }
    return json({ reply: lang === 'ar' ? 'المساعد مشغول حالياً، جرّب بعد دقيقة 🙏' : 'The assistant is busy, try again in a minute 🙏' }, 200, cors);
  }
};
