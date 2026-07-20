import { describe, it, expect } from 'vitest';
import { generateSlug, stripHtml } from './stringUtils';

describe('stringUtils', () => {
  describe('generateSlug', () => {
    it('should generate a valid slug from standard text', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
    });

    it('should handle Vietnamese diacritics', () => {
      expect(generateSlug('Cộng hòa Xã hội Chủ nghĩa Việt Nam')).toBe('cong-hoa-xa-hoi-chu-nghia-viet-nam');
    });

    it('should handle special characters and multiple spaces', () => {
      expect(generateSlug('  Hello   @World!  ')).toBe('hello-world');
    });

    it('should handle empty or null values', () => {
      expect(generateSlug(null)).toBe('');
      expect(generateSlug('')).toBe('');
      expect(generateSlug(undefined)).toBe('');
    });
  });

  describe('stripHtml', () => {
    it('should strip HTML tags from string', () => {
      expect(stripHtml('<p>Hello <b>World</b></p>')).toBe('Hello World');
    });

    it('should handle empty or null values', () => {
      expect(stripHtml(null)).toBe('');
      expect(stripHtml('')).toBe('');
      expect(stripHtml(undefined)).toBe('');
    });
    
    it('should handle plain text without HTML', () => {
      expect(stripHtml('Plain text')).toBe('Plain text');
    });
  });
});
