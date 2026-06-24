import apiClient from './http/apiClient';
import { unwrap } from './http/response';
import { ENDPOINTS } from './endpoints';

const dashboardService = {
    async getDashboard() {
        const res = await apiClient.get(ENDPOINTS.DASHBOARD);
        return unwrap(res);
    },
};

export default dashboardService;