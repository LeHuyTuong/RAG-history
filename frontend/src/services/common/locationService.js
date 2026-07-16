import apiClient from '../http/apiClient';
import { unwrap, unwrapPage } from '../http/response';
import { ENDPOINTS } from '../endpoints';

const locationService = {
    async filter(params = {}) {
        const res = await apiClient.get(ENDPOINTS.ADMIN.LOCATIONS, { params: { sort: 'id,desc', ...params } });
        const page = unwrapPage(res);
        if (params.status) {
            page.items = page.items.filter(p => p.status === params.status || p.status === undefined);
            page.total = page.items.length;
        }
        return page;
    },

    async getById(id) {
        const res = await apiClient.get(ENDPOINTS.ADMIN.LOCATIONS_BY_ID(id));
        return unwrap(res);
    },

    async create(payload) {
        const res = await apiClient.post(ENDPOINTS.ADMIN.LOCATIONS, payload);
        return unwrap(res);
    },

    async update(id, payload) {
        const res = await apiClient.put(ENDPOINTS.ADMIN.LOCATIONS_BY_ID(id), payload);
        return unwrap(res);
    },

    async delete(id) {
        const res = await apiClient.delete(ENDPOINTS.ADMIN.LOCATIONS_BY_ID(id));
        return unwrap(res);
    },

    async listAll(params = { size: 500 }) {
        const res = await apiClient.get(ENDPOINTS.ADMIN.LOCATIONS, { params: { sort: 'id,desc', ...params } });
        let items = unwrapPage(res).items;
        if (params.status) {
            items = items.filter(p => p.status === params.status || p.status === undefined);
        }
        return items;
    },
};

export default locationService;
