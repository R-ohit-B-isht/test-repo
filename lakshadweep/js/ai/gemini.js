// Thin client for the Gemini REST API (generateContent with a JSON response
// schema). No SDK: one fetch, one parsed object. Errors are normalised to a
// small set of kinds the UI can speak to.
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
export const MODEL = 'gemini-flash-lite-latest';

export class GeminiError extends Error {
  constructor(kind, message) {
    super(message);
    this.kind = kind; // nokey | auth | quota | blocked | network | api | malformed
  }
}

const KIND_BY_STATUS = { 400: 'auth', 401: 'auth', 403: 'auth', 429: 'quota' };

function kindFor(status, body) {
  const reason = body?.error?.details?.find((d) => d.reason)?.reason;
  if (reason === 'API_KEY_INVALID') return 'auth';
  if (status === 400 && body?.error?.message && !/api key/i.test(body.error.message)) return 'api';
  return KIND_BY_STATUS[status] || 'api';
}

async function post(key, body, signal) {
  try {
    return await fetch(`${ENDPOINT}/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(body),
      signal,
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new GeminiError('network', 'Could not reach Gemini. Check the connection.');
  }
}

function textOf(data) {
  const cand = data?.candidates?.[0];
  if (!cand) {
    const why = data?.promptFeedback?.blockReason;
    throw new GeminiError(why ? 'blocked' : 'malformed', why ? `Blocked: ${why}` : 'Empty reply from Gemini.');
  }
  const text = (cand.content?.parts || []).map((p) => p.text || '').join('');
  if (!text) throw new GeminiError('malformed', `Gemini stopped early (${cand.finishReason || 'no text'}).`);
  return text;
}

// system + user text in, object matching `schema` out.
export async function generateJson({ key, system, user, schema, signal, temperature = 0.2 }) {
  if (!key) throw new GeminiError('nokey', 'Add your Gemini key first.');
  const res = await post(key, {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature },
  }, signal);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.error?.message || `Gemini returned ${res.status}.`;
    throw new GeminiError(kindFor(res.status, data), msg);
  }
  try {
    return JSON.parse(textOf(data));
  } catch (e) {
    if (e instanceof GeminiError) throw e;
    throw new GeminiError('malformed', 'Gemini replied with something that was not JSON.');
  }
}
