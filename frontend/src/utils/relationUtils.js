const PARTICIPATION_ROLE_LABELS = Object.freeze({
  KING: 'Vua',
  QUEEN: 'Hoàng hậu',
  PRINCE: 'Hoàng tử',
  PRINCESS: 'Công chúa',
  COMMANDER: 'Chỉ huy',
  GENERAL: 'Tướng',
  STRATEGIST: 'Quân sư',
  OFFICIAL: 'Quan lại',
  DIPLOMAT: 'Ngoại giao',
  SOLDIER: 'Binh sĩ',
  REBEL_LEADER: 'Thủ lĩnh khởi nghĩa',
  ALLY: 'Đồng minh',
  OPPONENT: 'Đối thủ',
  WITNESS: 'Nhân chứng',
  HISTORIAN: 'Sử gia',
  LEADER: 'Lãnh đạo',
  FOUNDER: 'Người sáng lập',
  REFERENCE: 'Nhân vật tham chiếu',
  KEY_FIGURE: 'Nhân vật then chốt'
});

const EVENT_LOCATION_RELATION_LABELS = Object.freeze({
  HAPPENED_AT: 'Diễn ra tại',
  BATTLEFIELD: 'Chiến trường',
  CAPITAL: 'Kinh đô / Cố đô',
  BIRTH_PLACE: 'Nơi sinh',
  DEATH_PLACE: 'Nơi mất',
  BASE: 'Căn cứ',
  CENTERED_AT: 'Trung tâm tại',
  RELATED_TO: 'Liên quan đến',
  ADMIN_CENTER: 'Trung tâm hành chính',
  BIRTHPLACE: 'Nơi sinh',
  DEATHPLACE: 'Nơi mất'
});

const RELATION_LABELS = Object.freeze({
  ...PARTICIPATION_ROLE_LABELS,
  ...EVENT_LOCATION_RELATION_LABELS,
  LIEN_KET: 'Liên kết',
  THAM_GIA: 'Tham gia',
  DIA_DANH_LIEN_QUAN: 'Địa danh liên quan'
});

const VIETNAMESE_CHAR_PATTERN = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

export const getRelationLabel = (value) => {
  if (value == null) return 'Liên kết';
  const trimmed = String(value).trim();
  if (!trimmed) return 'Liên kết';

  const enumKey = trimmed.toUpperCase().replace(/\s+/g, '_');
  if (RELATION_LABELS[enumKey]) return RELATION_LABELS[enumKey];

  if (VIETNAMESE_CHAR_PATTERN.test(trimmed)) return trimmed;

  const normalizedKey = trimmed
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, '_');

  if (RELATION_LABELS[normalizedKey]) return RELATION_LABELS[normalizedKey];

  return trimmed;
};

export { PARTICIPATION_ROLE_LABELS, EVENT_LOCATION_RELATION_LABELS, RELATION_LABELS };
