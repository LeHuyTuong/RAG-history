export const LOCATION_TYPES = Object.freeze({
  CITY: 'CITY',
  PROVINCE: 'PROVINCE',
  BATTLEFIELD: 'BATTLEFIELD',
  CAPITAL: 'CAPITAL',
  TEMPLE: 'TEMPLE',
  REGION: 'REGION',
  CITADEL: 'CITADEL',
  MOUNTAIN: 'MOUNTAIN',
  PALACE: 'PALACE',
  BASE: 'BASE',
});

const LOCATION_TYPE_LABELS = Object.freeze({
  [LOCATION_TYPES.CITY]: 'Thành phố',
  [LOCATION_TYPES.PROVINCE]: 'Tỉnh thành / Địa phương',
  [LOCATION_TYPES.BATTLEFIELD]: 'Chiến trường / Ải',
  [LOCATION_TYPES.CAPITAL]: 'Kinh đô / Cố đô',
  [LOCATION_TYPES.TEMPLE]: 'Di tích tôn giáo / Đền chùa',
  [LOCATION_TYPES.REGION]: 'Vùng / Khu vực',
  [LOCATION_TYPES.CITADEL]: 'Thành cổ / Thành quách',
  [LOCATION_TYPES.MOUNTAIN]: 'Núi / Dãy núi',
  [LOCATION_TYPES.PALACE]: 'Cung điện / Cung thành',
  [LOCATION_TYPES.BASE]: 'Căn cứ địa / Chiến khu',
});

const LOCATION_TYPE_STYLES = Object.freeze({
  [LOCATION_TYPES.CITY]: 'bg-sky-50 text-sky-700 border-sky-200',
  [LOCATION_TYPES.PROVINCE]: 'bg-teal-50 text-teal-700 border-teal-200',
  [LOCATION_TYPES.BATTLEFIELD]: 'bg-rose-50 text-rose-700 border-rose-200',
  [LOCATION_TYPES.CAPITAL]: 'bg-amber-50 text-amber-700 border-amber-200',
  [LOCATION_TYPES.TEMPLE]: 'bg-purple-50 text-purple-700 border-purple-200',
  [LOCATION_TYPES.REGION]: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  [LOCATION_TYPES.CITADEL]: 'bg-stone-50 text-stone-700 border-stone-200',
  [LOCATION_TYPES.MOUNTAIN]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [LOCATION_TYPES.PALACE]: 'bg-orange-50 text-orange-700 border-orange-200',
  [LOCATION_TYPES.BASE]: 'bg-red-50 text-red-700 border-red-200',
});

const LOCATION_TYPE_ICONS = Object.freeze({
  [LOCATION_TYPES.CITY]: 'location_city',
  [LOCATION_TYPES.PROVINCE]: 'map',
  [LOCATION_TYPES.BATTLEFIELD]: 'swords',
  [LOCATION_TYPES.CAPITAL]: 'fort',
  [LOCATION_TYPES.TEMPLE]: 'gavel',
  [LOCATION_TYPES.REGION]: 'explore',
  [LOCATION_TYPES.CITADEL]: 'castle',
  [LOCATION_TYPES.MOUNTAIN]: 'landscape',
  [LOCATION_TYPES.PALACE]: 'account_balance',
  [LOCATION_TYPES.BASE]: 'shield',
});

export const getLocationLabel = (type) => {
  if (!type) return 'Không xác định';
  const normalized = type.toUpperCase().trim();
  return LOCATION_TYPE_LABELS[normalized] || `Khác (${type})`;
};

export const getLocationStyle = (type) => {
  if (!type) return 'bg-gray-50 text-gray-600 border-gray-200';
  const normalized = type.toUpperCase().trim();
  return LOCATION_TYPE_STYLES[normalized] || 'bg-gray-50 text-gray-600 border-gray-200';
};

export const getLocationIcon = (type) => {
  if (!type) return 'location_on';
  const normalized = type.toUpperCase().trim();
  return LOCATION_TYPE_ICONS[normalized] || 'location_on';
};

export const getLocationTypeOptions = () => {
  return Object.keys(LOCATION_TYPE_LABELS).map((key) => ({
    value: key,
    label: LOCATION_TYPE_LABELS[key],
  }));
};
