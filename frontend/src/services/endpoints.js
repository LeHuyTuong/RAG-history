const API_V1 = '/api/v1';

export const ENDPOINTS = {
    // ---------- Auth ----------
    AUTH: {
        LOGIN: `${API_V1}/auth/login`,
        REGISTER: `${API_V1}/auth/register`,
        REFRESH: `${API_V1}/auth/refresh`,
        LOGOUT: `${API_V1}/auth/logout`,
        ME: `${API_V1}/auth/me`,
    },

    // ---------- Dashboard (Admin) ----------
    DASHBOARD: `${API_V1}/dashboard`,

    // ---------- Public entities ----------
    PUBLIC: {
        ENGAGEMENTS: `${API_V1}/engagements`,
    },

    // ---------- Admin entities ----------
    ADMIN: {
        POSTS: `${API_V1}/admin/posts`,
        POSTS_BY_ID: (id) => `${API_V1}/admin/posts/${id}`,

        LOCATIONS: `${API_V1}/admin/locations`,
        LOCATIONS_BY_ID: (id) => `${API_V1}/admin/locations/${id}`,

        PERSONS: `${API_V1}/admin/persons`,
        PERSONS_BY_ID: (id) => `${API_V1}/admin/persons/${id}`,

        EVENTS: `${API_V1}/admin/events`,
        EVENTS_BY_ID: (id) => `${API_V1}/admin/events/${id}`,

        PERIODS: `${API_V1}/admin/periods`,
        PERIODS_BY_ID: (id) => `${API_V1}/admin/periods/${id}`,

        SOURCES: `${API_V1}/admin/sources`,
        SOURCES_BY_ID: (id) => `${API_V1}/admin/sources/${id}`,

        TAGS: `${API_V1}/admin/tags`,
        TAGS_BY_ID: (id) => `${API_V1}/admin/tags/${id}`,

        PARTICIPATIONS: `${API_V1}/admin/participations`,
        PARTICIPATIONS_BY_ID: (id) => `${API_V1}/admin/participations/${id}`,

        MEMBERS: `${API_V1}/admin/members`,
        MEMBERS_BY_ID: (id) => `${API_V1}/admin/members/${id}`,

        ENGAGEMENTS_PENDING: `${API_V1}/admin/engagements/pending`,
        ENGAGEMENTS_MODERATE: (id) => `${API_V1}/admin/engagements/${id}/moderate`,
    },

    // ---------- Member (current user) ----------
    MEMBER: {
        ME: `${API_V1}/auth/me`,
        ME_HISTORY: `${API_V1}/members/me/history`,
    },

    // ---------- AI / RAG ----------
    RAG: {
        // JSON, full-answer endpoint
        CHAT: import.meta.env.VITE_RAG_CHAT_URL || `${API_V1}/rag/chat`,
        SUGGEST_QUESTIONS: `${API_V1}/rag/suggest-questions`,
        // SSE streaming endpoint
        CHAT_STREAM:
            import.meta.env.VITE_RAG_CHAT_STREAM_URL ||
            `${API_V1}/rag/chat/stream`,
        // Admin AI re-index / sync control
        SYNC: `${API_V1}/admin/ai/sync`,
        AI_STATS: `${API_V1}/admin/ai/stats`,
    },

    // ---------- System settings ----------
    SETTINGS: {
        BASE: `${API_V1}/admin/settings`,
        BY_KEY: (key) => `${API_V1}/admin/settings/${encodeURIComponent(key)}`,
        RAG_LOGS: `${API_V1}/admin/settings/rag-logs`,
    },

};

export default ENDPOINTS;