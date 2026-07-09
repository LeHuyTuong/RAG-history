import apiClient from '../http/apiClient';
import mockClient from '../http/mockClient';
import { ENDPOINTS } from '../endpoints';
import { unwrap } from '../http/response';

const MANAGED_SETTING_KEYS = new Set(['rag.llm_model', 'ui.logo_url', 'ui.background_url']);
const LOCAL_SETTINGS_KEY = 'history_rag_basic_settings';

const normalizeSetting = (setting) => ({
    id: setting.id,
    key: setting.key,
    value: setting.value ?? '',
    description: setting.description || setting.desc || '',
    updatedAt: setting.updatedAt,
});

const getMockSettings = async () => {
    const res = await mockClient.get(ENDPOINTS.MOCK.ADMIN_SETTINGS);
    return (res.data?.parameters || [])
        .map(normalizeSetting)
        .filter(setting => MANAGED_SETTING_KEYS.has(setting.key));
};

const getLocalSettings = () => {
    try {
        return JSON.parse(localStorage.getItem(LOCAL_SETTINGS_KEY) || '[]')
            .map(normalizeSetting)
            .filter(setting => MANAGED_SETTING_KEYS.has(setting.key));
    } catch {
        return [];
    }
};

const saveLocalSetting = (setting) => {
    if (!MANAGED_SETTING_KEYS.has(setting.key)) return normalizeSetting(setting);

    const settings = getLocalSettings();
    const normalized = normalizeSetting(setting);
    const index = settings.findIndex(item => item.key === normalized.key);

    if (index >= 0) {
        settings[index] = normalized;
    } else {
        settings.push(normalized);
    }

    localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(settings));
    return normalized;
};

const mergeSettings = (baseSettings, overrideSettings) => {
    const filteredBaseSettings = baseSettings
        .map(normalizeSetting)
        .filter(setting => MANAGED_SETTING_KEYS.has(setting.key));
    const byKey = new Map(filteredBaseSettings.map(item => [item.key, item]));
    overrideSettings.forEach(item => byKey.set(item.key, normalizeSetting(item)));
    return Array.from(byKey.values());
};

const settingsService = {
    async list() {
        try {
            const res = await apiClient.get(ENDPOINTS.SETTINGS.BASE);
            return mergeSettings(unwrap(res) || [], getLocalSettings());
        } catch (error) {
            console.warn('Fallback to mock settings:', error?.message || error);
            return mergeSettings(await getMockSettings(), getLocalSettings());
        }
    },

    async getByKey(key) {
        try {
            const res = await apiClient.get(ENDPOINTS.SETTINGS.BY_KEY(key));
            return normalizeSetting(unwrap(res));
        } catch (error) {
            console.warn(`Fallback to mock setting ${key}:`, error?.message || error);
            const list = mergeSettings(await getMockSettings(), getLocalSettings());
            return list.find(p => p.key === key) || null;
        }
    },

    async upsert({ key, value, description }) {
        if (!MANAGED_SETTING_KEYS.has(key)) {
            throw new Error(`Unsupported setting key: ${key}`);
        }

        try {
            const res = await apiClient.put(ENDPOINTS.SETTINGS.BY_KEY(key), {
                key,
                value,
                description,
            });
            return normalizeSetting(unwrap(res));
        } catch (error) {
            console.warn(`Fallback to local setting ${key}:`, error?.message || error);
            return saveLocalSetting({ key, value, description });
        }
    },
};

export default settingsService;
