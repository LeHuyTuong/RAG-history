// ---------- HTTP layer ----------
export { default as apiClient } from './http/apiClient';
export { default as mockClient } from './http/mockClient';
export { unwrap, unwrapPage, unwrapResult, extractErrorMessage } from './http/response';

// ---------- Endpoints ----------
export { default as ENDPOINTS } from './endpoints';

// ---------- Domain services ----------
export { default as authService } from './common/authService';
export { default as dashboardService } from './admin/dashboardService';
export { default as postService } from './common/postService';
export { default as locationService } from './common/locationService';
export { default as personService } from './common/personService';
export { default as eventService } from './common/eventService';
export { default as periodService } from './common/periodService';
export { default as sourceService } from './common/sourceService';
export { default as tagService } from './common/tagService';
export { default as metadataService } from './common/metadataService';
export { default as memberService } from './admin/memberService';
export { default as participationService } from './admin/participationService';
export { default as engagementService } from './admin/engagementService';
export { default as ragService } from './common/ragService';
export { default as aiService } from './common/aiService';
export { default as hubService } from './admin/hubService';
export { default as settingsService } from './admin/settingsService';

export { API_ENDPOINTS } from './legacy';