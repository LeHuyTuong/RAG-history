// Tự động generate các endpoints
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const API_ENDPOINTS = {
  PERIOD_COLORS: `${BASE_URL}/api/period_colors.json`,
  ADMIN_AI: `${BASE_URL}/api/admin_ai.json`,
  USER_ARTICLE_DETAIL: `${BASE_URL}/api/user_article_detail.json`,
  ADMIN_METADATA: `${BASE_URL}/api/admin_metadata.json`,
  ADMIN_ARTICLES: `${BASE_URL}/api/admin_articles.json`,
  USER_CHARACTER_DETAIL: `${BASE_URL}/api/user_character_detail.json`,
  ADMIN_LOCATIONS: `${BASE_URL}/api/admin_locations.json`,
  ADMIN_CHARACTERS: `${BASE_URL}/api/admin_characters.json`,
  DASHBOARD: `${BASE_URL}/api/dashboard.json`,
  USER_EVENT_DETAIL: `${BASE_URL}/api/user_event_detail.json`,
  ADMIN_EVENTS: `${BASE_URL}/api/admin_events.json`,
  USER_LOCATION_DETAIL: `${BASE_URL}/api/user_location_detail.json`,
  LOCATION_TYPE_COLORS: `${BASE_URL}/api/location_type_colors.json`,
  ADMIN_MEMBERS: `${BASE_URL}/api/admin_members.json`,
  ADMIN_METADATA_CATEGORY_DETAIL: `${BASE_URL}/api/admin_metadata_category_detail.json`,
  TAG_COLORS: `${BASE_URL}/api/tag_colors.json`,
  USER_PERIOD_DETAIL: `${BASE_URL}/api/user_period_detail.json`,
  ADMIN_TAG_CATEGORIES: `${BASE_URL}/api/admin_tag_categories.json`,
  USER_RECORD_DETAIL: `${BASE_URL}/api/user_record_detail.json`,
  ADMIN_RECORDS: `${BASE_URL}/api/admin_records.json`,
  ADMIN_SETTINGS: `${BASE_URL}/api/admin_settings.json`,
  USER_ARTICLES: `${BASE_URL}/api/user_articles.json`,
  USER_CHARACTERS: `${BASE_URL}/api/user_characters.json`,
  USER_EVENTS: `${BASE_URL}/api/user_events.json`,
  USER_HOME: `${BASE_URL}/api/user_home.json`,
  USER_LOCATIONS: `${BASE_URL}/api/user_locations.json`,
  USER_PERIODS: `${BASE_URL}/api/user_periods.json`,
  USER_PROFILE_HISTORY: `${BASE_URL}/api/user_profile_history.json`,
  USER_RECORDS: `${BASE_URL}/api/user_records.json`
};
