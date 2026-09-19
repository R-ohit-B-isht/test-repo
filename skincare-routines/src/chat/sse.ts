import type { ChatEvent } from './types';

/** Parses a `text/event-stream` body into typed events. Frames are `event: <name>\ndata: <json>\n\n`. */
export async function* readSse(body: ReadableStream<Uint8Array>, signal: AbortSignal): AsyncGenerator<ChatEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (!signal.aborted) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let cut = buffer.indexOf('\n\n');
      while (cut >= 0) {
        const frame = parseFrame(buffer.slice(0, cut));
        buffer = buffer.slice(cut + 2);
        if (frame) yield frame;
        cut = buffer.indexOf('\n\n');
      }
    }
  } finally {
    reader.cancel().catch(() => undefined);
  }
}

function parseFrame(raw: string): ChatEvent | null {
  let event = 'message';
  const data: string[] = [];
  for (const line of raw.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
  }
  if (!data.length) return null;
  try {
    return { event, data: JSON.parse(data.join('\n')) } as ChatEvent;
  } catch {
    return null;
  }
}
