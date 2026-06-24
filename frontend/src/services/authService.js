import apiClient from './http/apiClient';
import { unwrap } from './http/response';
import { ENDPOINTS } from './endpoints';

const authService = {
    async login(credentials) {
        const res = await apiClient.post(ENDPOINTS.AUTH.LOGIN, credentials);
        return unwrap(res);
    },

    async register(payload) {
        const res = await apiClient.post(ENDPOINTS.AUTH.REGISTER, payload);
        return unwrap(res);
    },

    async logout() {
        const res = await apiClient.post(ENDPOINTS.AUTH.LOGOUT);
        return unwrap(res);
    },

    async getMe() {
        const res = await apiClient.get(ENDPOINTS.AUTH.ME);
        return unwrap(res);
    },
};

export default authService;