import mockClient from '../http/mockClient';
import { unwrap, unwrapPage } from '../http/response';
import { ENDPOINTS } from '../endpoints';

import tagService from './tagService';
import periodService from './periodService';

const metadataService = {
    async fetchOverview() {
        const [tagsPage, periodsPage, tagColorsRes, periodColorsRes] = await Promise.allSettled([
            tagService.filter({ size: 500 }),
            periodService.filter({ size: 500 }),
            mockClient.get(ENDPOINTS.MOCK.TAG_COLORS),
            mockClient.get(ENDPOINTS.MOCK.PERIOD_COLORS),
        ]);

        const tags = tagsPage.status === 'fulfilled' ? tagsPage.value.items : [];
        const periods = periodsPage.status === 'fulfilled' ? periodsPage.value.items : [];
        const tagColors = tagColorsRes.status === 'fulfilled' ? tagColorsRes.value.data : {};
        const periodColors = periodColorsRes.status === 'fulfilled' ? periodColorsRes.value.data : {};

        return { tags, periods, tagColors, periodColors };
    },

    async fetchColors() {
        const [tagColorsRes, periodColorsRes] = await Promise.allSettled([
            mockClient.get(ENDPOINTS.MOCK.TAG_COLORS),
            mockClient.get(ENDPOINTS.MOCK.PERIOD_COLORS),
        ]);

        return {
            tagColors: tagColorsRes.status === 'fulfilled' ? tagColorsRes.value.data : {},
            periodColors: periodColorsRes.status === 'fulfilled' ? periodColorsRes.value.data : {},
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