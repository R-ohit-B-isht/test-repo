import { GEMINI_KEY_SLOT } from '../config.js';

// Thin Gemini client (Adapter over the REST API). Browser-side, bring your own
// key. Every call is a real request; errors surface as-is — no canned replies.

const BASE = 'https://generativelanguage.googleapis.com/v1beta';

export const keyStore = {
  get: () => localStorage.getItem(GEMINI_KEY_SLOT) || '',
  set: (k) => (k ? localStorage.setItem(GEMINI_KEY_SLOT, k.trim()) : localStorage.removeItem(GEMINI_KEY_SLOT)),
};

export class GeminiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

const errorText = async (res) => {
  try {
    const j = await res.json();
    return j.error?.message || res.statusText;
  } catch {
    return res.statusText;
  }
};

const firstText = (data) => data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';

// Asks for JSON matching `schema`; returns the parsed object.
export async function generateJson({ key, model, system, user, schema, signal }) {
  if (!key) throw new GeminiError('No API key. Paste one from aistudio.google.com/app/apikey.', 0);
  const res = await fetch(`${BASE}/models/${model}:generateContent`, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0.4 },
    }),
  });
  if (!res.ok) throw new GeminiError(await errorText(res), res.status);
  const data = await res.json();
  const block = data.promptFeedback?.blockReason;
  if (block) throw new GeminiError(`Gemini blocked the prompt (${block}).`, 200);
  const text = firstText(data);
  if (!text) throw new GeminiError(`Empty reply (${data.candidates?.[0]?.finishReason || 'no candidates'}).`, 200);
  try {
    return JSON.parse(text);
  } catch {
    throw new GeminiError('Gemini returned something that is not JSON.', 200);
  }
}
