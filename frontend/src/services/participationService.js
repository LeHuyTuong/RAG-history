import apiClient from './http/apiClient';
import { unwrap, unwrapPage } from './http/response';
import { ENDPOINTS } from './endpoints';

const participationService = {
    async filter(params = {}) {
        const res = await apiClient.get(ENDPOINTS.ADMIN.PARTICIPATIONS, { params });
        return unwrapPage(res);
    },

    async getById(id) {
        const res = await apiClient.get(ENDPOINTS.ADMIN.PARTICIPATIONS_BY_ID(id));
        return unwrap(res);
    },

    async create(payload) {
        const res = await apiClient.post(ENDPOINTS.ADMIN.PARTICIPATIONS, payload);
        return unwrap(res);
    },

    async update(id, payload) {
        const res = await apiClient.put(ENDPOINTS.ADMIN.PARTICIPATIONS_BY_ID(id), payload);
        return unwrap(res);
    },

    async delete(id) {
        const res = await apiClient.delete(ENDPOINTS.ADMIN.PARTICIPATIONS_BY_ID(id));
        return unwrap(res);
    },
};

export default participationService;