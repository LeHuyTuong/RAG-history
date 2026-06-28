import apiClient from './http/apiClient';
import { unwrap, unwrapPage } from './http/response';
import { ENDPOINTS } from './endpoints';

const personService = {
    async filter(params = {}) {
        const res = await apiClient.get(ENDPOINTS.ADMIN.PERSONS, { params });
        return unwrapPage(res);
    },

    async getById(id) {
        const res = await apiClient.get(ENDPOINTS.ADMIN.PERSONS_BY_ID(id));
        return unwrap(res);
    },

    async create(payload) {
        const res = await apiClient.post(ENDPOINTS.ADMIN.PERSONS, payload);
        return unwrap(res);
    },

    async update(id, payload) {
        const res = await apiClient.put(ENDPOINTS.ADMIN.PERSONS_BY_ID(id), payload);
        return unwrap(res);
    },

    async delete(id) {
        const res = await apiClient.delete(ENDPOINTS.ADMIN.PERSONS_BY_ID(id));
        return unwrap(res);
    },

    async listAll(params = { size: 500 }) {
        const res = await apiClient.get(ENDPOINTS.ADMIN.PERSONS, { params });
        return unwrapPage(res).items;
    },
};

export default personService;