import apiClient from '../http/apiClient';

const settingsService = {
    async list() {
        try {
            const res = await apiClient.get('/api/v1/admin/settings');
            return res.data?.data || [];
        } catch (e) {
            console.error('Failed to load settings from API:', e);
            return [];
        }
    },

    async getByKey(key) {
        const list = await this.list();
        return list.find(p => p.key === key) || null;
    },

    async upsert({ key, value, description }) {
        try {
            const payload = { key, value, description };
            const res = await apiClient.put(`/api/v1/admin/settings/${encodeURIComponent(key)}`, payload);
            return res.data?.data || payload;
        } catch (e) {
            console.error('Failed to save settings to API:', e);
            return { key, value, description };
        }
    },

    async delete(key) {
        try {
            await apiClient.delete(`/api/v1/admin/settings/${key}`);
            return { success: true };
        } catch (e) {
            console.error('Failed to delete setting from API:', e);
            return { success: false };
        }
    },

    async getRagLogs(params = {}) {
        try {
            const res = await apiClient.get('/api/v1/admin/settings/rag-logs', { params });
            return res.data?.data || [];
        } catch (e) {
            console.error('Failed to load RAG query logs from API:', e);
            return [];
        }
    },
};

export default settingsService;
