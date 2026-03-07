import { api } from './axios';

// Strip base64 image data from history to keep request body small.
// Data URIs in screenshots can be several MB — this replaces them with a placeholder.
function sanitizeHistory(history) {
  return history.map((msg) => ({
    ...msg,
    content: typeof msg.content === 'string'
      ? msg.content.replace(/data:[^;]+;base64,[A-Za-z0-9+/=]{100,}/g, '[screenshot]')
      : msg.content,
  }));
}

export async function sendMessage(message, history = []) {
  const { data } = await api.post('/chat', { message, history: sanitizeHistory(history) });
  return data;
}
