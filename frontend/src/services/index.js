// ---------- HTTP layer ----------
export { default as apiClient } from './http/apiClient';
export { default as mockClient } from './http/mockClient';
export { unwrap, unwrapPage, unwrapResult, extractErrorMessage } from './http/response';

// ---------- Endpoints ----------
export { default as ENDPOINTS } from './endpoints';

// ---------- Domain services ----------
export { default as authService } from './authService';
export { default as dashboardService } from './dashboardService';
export { default as postService } from './postService';
export { default as locationService } from './locationService';
export { default as personService } from './personService';
export { default as eventService } from './eventService';
export { default as periodService } from './periodService';
export { default as sourceService } from './sourceService';
export { default as tagService } from './tagService';
export { default as metadataService } from './metadataService';
export { default as memberService } from './memberService';
export { default as participationService } from './participationService';
export { default as engagementService } from './engagementService';
export { default as ragService } from './ragService';
export { default as aiService } from './aiService';
export { default as hubService } from './hubService';
export { default as settingsService } from './settingsService';

export { API_ENDPOINTS } from './legacy';