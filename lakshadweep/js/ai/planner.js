// Facade: prompt in, validated suggestions out. The UI never touches the
// client, the prompt builders or the validator directly.
import { keyStore } from './key.js';
import { generateJson, MODEL } from './gemini.js';
import { RESPONSE_SCHEMA } from './schema.js';
import { systemPrompt, userPrompt } from './context.js';
import { validateChanges } from './validate.js';
import { computeBudget } from '../budget.js';

export async function propose(state, prompt, signal) {
  const budget = computeBudget(state);
  const reply = await generateJson({
    key: keyStore.get(),
    system: systemPrompt(state),
    user: userPrompt(state, budget, prompt),
    schema: RESPONSE_SCHEMA,
    signal,
  });
  return {
    model: MODEL,
    summary: String(reply?.summary || '').slice(0, 120),
    changes: validateChanges(reply?.changes, state),
  };
}
