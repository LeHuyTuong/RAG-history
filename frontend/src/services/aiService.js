import apiClient from './http/apiClient';
import { unwrap } from './http/response';
import { ENDPOINTS } from './endpoints';

const aiService = {

    async syncIndex() {
        const res = await apiClient.post(ENDPOINTS.RAG.SYNC);
        return unwrap(res);
    },

    async getStats() {
        const res = await apiClient.get(ENDPOINTS.RAG.AI_STATS);
        return unwrap(res);
    },

    async getIngestHistory() {
        const url = `${ENDPOINTS.RAG.AI_STATS}`.replace(
            /\/stats$/,
            '/ingest-history'
        );
        try {
            const res = await apiClient.get(url);
            return unwrap(res);
        } catch (err) {
            const res = await apiClient.get(ENDPOINTS.RAG.AI_STATS);
            return unwrap(res);
        }
    },
};

export default aiService;