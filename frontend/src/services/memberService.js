import mockClient from './http/mockClient';
import apiClient from './http/apiClient';
import { unwrap } from './http/response';
import { ENDPOINTS } from './endpoints';

const memberService = {
    async filter(params = {}) {
        const res = await mockClient.get('/api/admin_members.json');
        const list = res.data?.members || [];
        return {
            items: list,
            meta: { total: list.length }
        };
    },

    async getById(id) {
        const res = await mockClient.get('/api/admin_members.json');
        const list = res.data?.members || [];
        const member = list.find(m => String(m.id) === String(id));
        return member || null;
    },

    async create(payload) {
        console.log('Mock memberService.create:', payload);
        return { id: `MB-${Date.now()}`, ...payload };
    },

    async update(id, payload) {
        console.log('Mock memberService.update:', id, payload);
        return { id, ...payload };
    },

    async delete(id) {
        console.log('Mock memberService.delete:', id);
        return { success: true };
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