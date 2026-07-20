// Lightweight response mappers to normalize API responses on the client
import { resolveImageUrl } from '../utils/imageUtils';

export function deriveYearsFromText(text) {
  if (!text || typeof text !== 'string') return { startYear: null, endYear: null };
  const range = text.match(/([12]\d{3})(?:\s*[-–—]\s*([12]\d{3}))?/);
  if (!range) return { startYear: null, endYear: null };
  return { startYear: parseInt(range[1], 10), endYear: range[2] ? parseInt(range[2], 10) : parseInt(range[1], 10) };
}

export function mapPost(raw = {}) {
  if (!raw) return raw;
  const content = raw.content || raw.body || '';
  const hasYears = raw.startYear != null || raw.endYear != null || raw.start_year != null || raw.end_year != null;
  const { startYear, endYear } = hasYears
    ? { startYear: raw.startYear ?? raw.start_year ?? null, endYear: raw.endYear ?? raw.end_year ?? null }
    : deriveYearsFromText(typeof content === 'string' ? content : (content[0]?.text || ''));

  return {
    ...raw,
    startYear: startYear ?? null,
    endYear: endYear ?? null,
    tags: raw.tags || raw.postTags || [],
    imageUrl: resolveImageUrl(raw.imageUrl || raw.thumbnailUrl || raw.thumbnail_url || raw.cover || null),
    status: raw.status || raw.postStatus || 'PUBLISHED',
  };
}

export function mapEvent(raw = {}) {
  if (!raw) return raw;
  const { startYear, endYear } = raw.startYear || raw.endYear ? { startYear: raw.startYear, endYear: raw.endYear } : deriveYearsFromText(raw.description || raw.content || '');
  return { ...raw, startYear: startYear ?? null, endYear: endYear ?? null, imageUrl: resolveImageUrl(raw.imageUrl || raw.image_url || null) };
}

export function mapLocation(raw = {}) {
  if (!raw) return raw;
  return {
    ...raw,
    status: raw.status || 'ACTIVE',
    dynasty: raw.dynasty || null,
    imageUrl: resolveImageUrl(raw.imageUrl || raw.image_url || null),
  };
}

export function mapPerson(raw = {}) {
  if (!raw) return raw;
  return {
    ...raw,
    status: raw.status || 'ACTIVE',
    imageUrl: resolveImageUrl(raw.imageUrl || raw.image_url || null),
  };
}

export default { deriveYearsFromText, mapPost, mapEvent, mapLocation, mapPerson };
