import { describe, it, expect } from 'vitest';
import { getRelationLabel } from './relationUtils';

describe('relationUtils', () => {
  describe('getRelationLabel', () => {
    it('should handle null or undefined values', () => {
      expect(getRelationLabel(null)).toBe('Liên kết');
      expect(getRelationLabel(undefined)).toBe('Liên kết');
    });

    it('should handle empty strings or spaces', () => {
      expect(getRelationLabel('')).toBe('Liên kết');
      expect(getRelationLabel('   ')).toBe('Liên kết');
    });

    it('should correctly map standard english role enums', () => {
      expect(getRelationLabel('KING')).toBe('Vua');
      expect(getRelationLabel('COMMANDER')).toBe('Chỉ huy');
      expect(getRelationLabel('REBEL_LEADER')).toBe('Thủ lĩnh khởi nghĩa');
    });

    it('should correctly map location relation enums', () => {
      expect(getRelationLabel('HAPPENED_AT')).toBe('Diễn ra tại');
      expect(getRelationLabel('BIRTH_PLACE')).toBe('Nơi sinh');
    });

    it('should handle case insensitivity and extra spaces', () => {
      expect(getRelationLabel('  king  ')).toBe('Vua');
      expect(getRelationLabel('commander')).toBe('Chỉ huy');
    });

    it('should return the original string if it already contains Vietnamese characters', () => {
      expect(getRelationLabel('Vị vua')).toBe('Vị vua');
      expect(getRelationLabel('Tướng quân')).toBe('Tướng quân');
    });

    it('should return the original string if it is an unknown English word without mapping', () => {
      expect(getRelationLabel('UNKNOWN_ROLE')).toBe('UNKNOWN_ROLE');
    });
  });
});
