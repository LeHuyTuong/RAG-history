import apiClient from './http/apiClient';
import { unwrap, unwrapPage } from './http/response';
import { ENDPOINTS } from './endpoints';

const engagementService = {
    async getPending(params = {}) {
        const res = await apiClient.get(ENDPOINTS.ADMIN.ENGAGEMENTS_PENDING, { params });
        return unwrapPage(res);
    },

    async moderate(id, payload) {
        const res = await apiClient.put(ENDPOINTS.ADMIN.ENGAGEMENTS_MODERATE(id), payload);
        return unwrap(res);
    },
};

export default engagementService;