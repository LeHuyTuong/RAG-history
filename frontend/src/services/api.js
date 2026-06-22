// Tự động generate các endpoints hoặc trỏ đến API thật
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const API_ENDPOINTS = {
  // --- Admin APIs (Đã implement backend) ---
  DASHBOARD: `/api/v1/dashboard`,
  ADMIN_ARTICLES: `/api/v1/admin/posts`, // Map "Articles" frontend to "Posts" backend
  ADMIN_LOCATIONS: `/api/v1/admin/locations`,
  ADMIN_SOURCES: `/api/v1/admin/sources`,
  ADMIN_MEMBERS: `/api/v1/admin/members`,
  ADMIN_TAG_CATEGORIES: `/api/v1/admin/tags`,
  ADMIN_CHARACTERS: `/api/v1/admin/persons`,
  ADMIN_PERIODS: `/api/v1/admin/periods`,
  ADMIN_ENGAGEMENTS: `/api/v1/admin/engagements`,

  // --- Các APIs đang dùng mock (.json) ---
  PERIOD_COLORS: `/api/period_colors.json`,
  ADMIN_AI: `/api/admin_ai.json`,
  USER_ARTICLE_DETAIL: `/api/user_article_detail.json`,
  ADMIN_METADATA: `/api/admin_metadata.json`,
  USER_CHARACTER_DETAIL: `/api/user_character_detail.json`,
  USER_EVENT_DETAIL: `/api/user_event_detail.json`,
  ADMIN_EVENTS: `/api/v1/admin/events`,
  USER_LOCATION_DETAIL: `/api/user_location_detail.json`,
  LOCATION_TYPE_COLORS: `/api/location_type_colors.json`,
  ADMIN_METADATA_CATEGORY_DETAIL: `/api/admin_metadata_category_detail.json`,
  TAG_COLORS: `/api/tag_colors.json`,
  USER_PERIOD_DETAIL: `/api/user_period_detail.json`,
  USER_RECORD_DETAIL: `/api/user_record_detail.json`,
  ADMIN_RECORDS: `/api/admin_records.json`,
  ADMIN_SETTINGS: `/api/admin_settings.json`,
  USER_ARTICLES: `/api/user_articles.json`,
  USER_CHARACTERS: `/api/user_characters.json`,
  USER_EVENTS: `/api/user_events.json`,
  USER_HOME: `/api/user_home.json`,
  USER_LOCATIONS: `/api/user_locations.json`,
  USER_PERIODS: `/api/user_periods.json`,
  USER_PROFILE_HISTORY: `/api/user_profile_history.json`,
  USER_RECORDS: `/api/user_records.json`,
  RAG_CHAT: import.meta.env.VITE_RAG_CHAT_URL || '/api/v1/rag/chat'
};
