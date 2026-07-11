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
    },

    // ---------- Mock JSON fixtures (under public/api) ----------
    MOCK: {
        ADMIN_METADATA: '/api/admin_metadata.json',
        ADMIN_TAG_COLORS: '/api/admin_tag_colors.json',
        ADMIN_AI: '/api/admin_ai.json',
        ADMIN_MEMBERS: '/api/admin_members.json',
        ADMIN_EVENTS: '/api/admin_events.json',
        ADMIN_CHARACTERS: '/api/admin_characters.json',
        ADMIN_LOCATIONS: '/api/admin_locations.json',
        ADMIN_SETTINGS: '/api/admin_settings.json',
        DASHBOARD: '/api/dashboard.json',
        PERIOD_COLORS: '/api/period_colors.json',
        TAG_COLORS: '/api/tag_colors.json',
        LOCATION_TYPE_COLORS: '/api/location_type_colors.json',
        USER_HOME: '/api/user_home.json',
        USER_PROFILE_HISTORY: '/api/user_profile_history.json',
        USER_ARTICLES: '/api/user_articles.json',
        USER_ARTICLE_DETAIL: (id) => `/api/user_article_detail.json`,
        USER_CHARACTERS: '/api/user_characters.json',
        USER_CHARACTER_DETAIL: (id) => `/api/user_character_detail.json`,
        USER_EVENTS: '/api/user_events.json',
        USER_EVENT_DETAIL: (id) => `/api/user_event_detail.json`,
        USER_LOCATIONS: '/api/user_locations.json',
        USER_LOCATION_DETAIL: (id) => `/api/user_location_detail.json`,
        USER_PERIODS: '/api/user_periods.json',
        USER_PERIOD_DETAIL: (id) => `/api/user_period_detail.json`,
        USER_RECORDS: '/api/user_records.json',
        USER_RECORD_DETAIL: (id) => `/api/user_record_detail.json`,
    },
};

export default ENDPOINTS;