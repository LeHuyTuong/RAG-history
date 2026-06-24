import mockClient from './http/mockClient';

const settingsService = {
    async list() {
        const res = await mockClient.get('/api/admin_settings.json');
        return res.data?.parameters || [];
    },

    async getByKey(key) {
        const res = await mockClient.get('/api/admin_settings.json');
        const list = res.data?.parameters || [];
        const item = list.find(p => p.key === key);
        return item || null;
    },

    async upsert({ key, value, description }) {
        console.log('Mock settingsService.upsert:', { key, value, description });
        return { key, value, description };
    },

    async delete(key) {
        console.log('Mock settingsService.delete:', key);
        return { success: true };
    },
};

export default settingsService;