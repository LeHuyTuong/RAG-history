import { unwrap, unwrapPage } from '../http/response';
import { ENDPOINTS } from '../endpoints';

import tagService from './tagService';
import periodService from './periodService';

const metadataService = {
    async fetchOverview() {
        const [tagsPage, periodsPage] = await Promise.allSettled([
            tagService.filter({ size: 500 }),
            periodService.filter({ size: 500 })
        ]);

        const tags = tagsPage.status === 'fulfilled' ? tagsPage.value.items : [];
        const periods = periodsPage.status === 'fulfilled' ? periodsPage.value.items : [];
        const tagColors = {};
        const periodColors = {};

        return { tags, periods, tagColors, periodColors };
    },

    async fetchColors() {
        return {
            tagColors: {},
            periodColors: {},
        };
    },

    async listTags(params = { size: 500 }) {
        const res = await tagService.filter(params);
        return res.items;
    },

    async listPeriods(params = { size: 500 }) {
        const res = await periodService.filter(params);
        return res.items;
    },
};

export default metadataService;
