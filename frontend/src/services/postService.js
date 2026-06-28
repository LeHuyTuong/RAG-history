import apiClient from './http/apiClient';
import { unwrap, unwrapPage } from './http/response';
import { ENDPOINTS } from './endpoints';

const postService = {
    async filter(params = {}) {
        const res = await apiClient.get(ENDPOINTS.ADMIN.POSTS, { params });
        return unwrapPage(res);
    },

    async getById(id) {
        const res = await apiClient.get(ENDPOINTS.ADMIN.POSTS_BY_ID(id));
        return unwrap(res);
    },

    async create(payload) {
        const res = await apiClient.post(ENDPOINTS.ADMIN.POSTS, payload);
        return unwrap(res);
    },


    async update(payload) {
        if (!payload || payload.id == null) {
            throw new Error('postService.update: payload.id is required');
        }
        const res = await apiClient.put(ENDPOINTS.ADMIN.POSTS, payload);
        return unwrap(res);
    },

    async delete(id) {
        const res = await apiClient.delete(ENDPOINTS.ADMIN.POSTS_BY_ID(id));
        return unwrap(res);
    },

    async listAll(params = { size: 500 }) {
        const res = await apiClient.get(ENDPOINTS.ADMIN.POSTS, { params });
        return unwrapPage(res).items;
    },
};

export default postService;