import apiClient from '../http/apiClient';
import { unwrap, unwrapPage } from '../http/response';
import { ENDPOINTS } from '../endpoints';

const memberService = {
    async filter(params = {}) {
        const res = await apiClient.get('/api/v1/admin/members', { params: { sort: 'id,desc', ...params } });
        return unwrapPage(res);
    },

    async getById(id) {
        const res = await apiClient.get(`/api/v1/admin/members/${id}`);
        return unwrap(res);
    },

    async create(payload) {
        const res = await apiClient.post('/api/v1/admin/members', payload);
        return unwrap(res);
    },

    async update(id, payload) {
        const res = await apiClient.put(`/api/v1/admin/members/${id}`, payload);
        return unwrap(res);
    },

    async delete(id) {
        const res = await apiClient.delete(`/api/v1/admin/members/${id}`);
        return unwrap(res);
    },

    async getMe() {
        const res = await apiClient.get(ENDPOINTS.MEMBER.ME);
        return unwrap(res);
    },

    async getMyHistory() {
        const res = await apiClient.get(ENDPOINTS.MEMBER.ME_HISTORY);
        return unwrap(res);
    },
};

export default memberService;
