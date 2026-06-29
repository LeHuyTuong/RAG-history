import apiClient from '../http/apiClient';
import { unwrap } from '../http/response';
import { ENDPOINTS } from '../endpoints';

const ACCESS_TOKEN_KEY = 'accessToken';

const authHeaders = () => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const ragService = {
    async chat(payload) {
        const res = await apiClient.post(ENDPOINTS.RAG.CHAT, payload);
        return unwrap(res);
    },

    chatStream(payload, handlers = {}) {
        const url = `${apiClient.defaults.baseURL || ''}${ENDPOINTS.RAG.CHAT_STREAM}`;
        const controller = new AbortController();
        const { onToken, onCitations, onDone, onError } = handlers;

        (async () => {
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'text/event-stream',
                        ...authHeaders(),
                    },
                    body: JSON.stringify(payload),
                    signal: controller.signal,
                });

                if (!res.ok || !res.body) {
                    const text = await res.text().catch(() => '');
                    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
                }

                const reader = res.body.getReader();
                const decoder = new TextDecoder('utf-8');
                let buffer = '';

                const dispatchEvent = (eventName, dataText) => {
                    try {
                        const parsed = JSON.parse(dataText);
                        if (eventName === 'token' && onToken) onToken(parsed.text ?? parsed.delta ?? '');
                        else if (eventName === 'citations' && onCitations) onCitations(parsed);
                        else if (eventName === 'done' && onDone) onDone(parsed);
                        else if (eventName === 'error' && onError) onError(new Error(parsed.message || 'Stream error'));
                    } catch (e) {
                        if (onToken) onToken(dataText);
                    }
                };

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });

                    let sepIndex;
                    while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
                        const rawEvent = buffer.slice(0, sepIndex);
                        buffer = buffer.slice(sepIndex + 2);
                        let eventName = 'message';
                        const dataLines = [];
                        for (const line of rawEvent.split('\n')) {
                            if (line.startsWith('event:')) eventName = line.slice(6).trim();
                            else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
                        }
                        if (dataLines.length) {
                            dispatchEvent(eventName, dataLines.join('\n'));
                        }
                    }
                }

                if (onDone) onDone();
            } catch (err) {
                if (err.name !== 'AbortError' && onError) onError(err);
            }
        })();

        return () => controller.abort();
    },

    async syncIndex() {
        const res = await apiClient.post(ENDPOINTS.RAG.SYNC);
        return unwrap(res);
    },

    async getStats() {
        const res = await apiClient.get(ENDPOINTS.RAG.AI_STATS);
        return unwrap(res);
    },
};

export default ragService;