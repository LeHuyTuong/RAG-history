import apiClient from '../http/apiClient';
import { unwrap, unwrapPage } from '../http/response';
import { ENDPOINTS } from '../endpoints';
import { mapPost } from '../responseMappers';

const postService = {
    async filter(params = {}) {
        const res = await apiClient.get(ENDPOINTS.ADMIN.POSTS, { params: { sort: 'id,desc', ...params } });
        const page = unwrapPage(res);
        if (params.status) {
            page.items = page.items.filter(p => p.status === params.status || p.status === undefined);
            page.total = page.items.length;
        }
        return { ...page, items: (page.items || []).map(mapPost) };
    },

    async getById(id) {
        const res = await apiClient.get(ENDPOINTS.ADMIN.POSTS_BY_ID(id));
        const data = unwrap(res);
        return mapPost(data);
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
        const res = await apiClient.get(ENDPOINTS.ADMIN.POSTS, { params: { sort: 'id,desc', ...params } });
        let items = unwrapPage(res).items;
        if (params.status) {
            items = items.filter(p => p.status === params.status || p.status === undefined);
        }
        return (items || []).map(mapPost);
    },
};

export default postService;
