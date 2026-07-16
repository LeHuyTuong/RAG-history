import apiClient from '../http/apiClient';
import { unwrap, unwrapPage } from '../http/response';
import { ENDPOINTS } from '../endpoints';

const periodService = {
    async filter(params = {}) {
        const res = await apiClient.get(ENDPOINTS.ADMIN.PERIODS, { params: { sort: 'id,desc', ...params } });
        const page = unwrapPage(res);
        if (params.status) {
            page.items = page.items.filter(p => p.status === params.status);
            page.total = page.items.length;
        }
        return page;
    },

    async getById(id) {
        const res = await apiClient.get(ENDPOINTS.ADMIN.PERIODS_BY_ID(id));
        return unwrap(res);
    },

    async create(payload) {
        const res = await apiClient.post(ENDPOINTS.ADMIN.PERIODS, payload);
        return unwrap(res);
    },

    async update(id, payload) {
        const res = await apiClient.put(ENDPOINTS.ADMIN.PERIODS_BY_ID(id), payload);
        return unwrap(res);
    },

    async delete(id) {
        const res = await apiClient.delete(ENDPOINTS.ADMIN.PERIODS_BY_ID(id));
        return unwrap(res);
    },

    async listAll(params = { size: 500 }) {
        const res = await apiClient.get(ENDPOINTS.ADMIN.PERIODS, { params: { sort: 'id,desc', ...params } });
        let items = unwrapPage(res).items;
        if (params.status) {
            items = items.filter(p => p.status === params.status);
        }
        return items;
    },
};

export default periodService;
