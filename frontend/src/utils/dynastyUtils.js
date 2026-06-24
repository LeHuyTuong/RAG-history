export const DYNASTY_TYPES = Object.freeze({
  HONG_BANG: 'HONG_BANG',
  AU_LAC: 'AU_LAC',
  BAC_THUOC: 'BAC_THUOC',
  HAI_BA_TRUNG: 'HAI_BA_TRUNG',
  TIEN_LY: 'TIEN_LY',
  NGO: 'NGO',
  DINH: 'DINH',
  TIEN_LE: 'TIEN_LE',
  LY: 'LY',
  TRAN: 'TRAN',
  HO: 'HO',
  HAU_LE: 'HAU_LE',
  TAY_SON: 'TAY_SON',
  NGUYEN: 'NGUYEN',
  UNKNOWN: 'UNKNOWN'
});

const DYNASTY_LABELS = Object.freeze({
  [DYNASTY_TYPES.HONG_BANG]: 'Hồng Bàng',
  [DYNASTY_TYPES.AU_LAC]: 'Âu Lạc',
  [DYNASTY_TYPES.BAC_THUOC]: 'Bắc thuộc',
  [DYNASTY_TYPES.HAI_BA_TRUNG]: 'Hai Bà Trưng',
  [DYNASTY_TYPES.TIEN_LY]: 'Tiền Lý',
  [DYNASTY_TYPES.NGO]: 'Nhà Ngô',
  [DYNASTY_TYPES.DINH]: 'Nhà Đinh',
  [DYNASTY_TYPES.TIEN_LE]: 'Nhà Tiền Lê',
  [DYNASTY_TYPES.LY]: 'Nhà Lý',
  [DYNASTY_TYPES.TRAN]: 'Nhà Trần',
  [DYNASTY_TYPES.HO]: 'Nhà Hồ',
  [DYNASTY_TYPES.HAU_LE]: 'Nhà Hậu Lê',
  [DYNASTY_TYPES.TAY_SON]: 'Nhà Tây Sơn',
  [DYNASTY_TYPES.NGUYEN]: 'Nhà Nguyễn',
  [DYNASTY_TYPES.UNKNOWN]: 'Chưa rõ / Khác'
});


export const getDynastyLabel = (type) => {
  if (!type) return 'Chưa rõ / Khác';
  const normalized = type.toUpperCase().trim();
  return DYNASTY_LABELS[normalized] || type;
};

export const getDynastyOptions = () => {
  return Object.keys(DYNASTY_LABELS).map((key) => ({
    value: key,
    label: DYNASTY_LABELS[key]
  }));
};
