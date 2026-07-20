import { describe, it, expect } from 'vitest';
import { validatePasswordStrength } from './validation';

describe('Password Validation', () => {
  it('should reject passwords shorter than 6 characters', () => {
    expect(validatePasswordStrength('Ab1@')).toBe(false);
  });

  it('should reject passwords without uppercase letter', () => {
    expect(validatePasswordStrength('ab12345@')).toBe(false);
  });

  it('should reject passwords without lowercase letter', () => {
    expect(validatePasswordStrength('AB12345@')).toBe(false);
  });

  it('should reject passwords without a number', () => {
    expect(validatePasswordStrength('Abcdefg@')).toBe(false);
  });

  it('should reject passwords without a special character', () => {
    expect(validatePasswordStrength('Abcdef123')).toBe(false);
  });

  it('should accept valid strong passwords', () => {
    expect(validatePasswordStrength('StrongPass123!')).toBe(true);
    expect(validatePasswordStrength('L0ngP@ssw0rd')).toBe(true);
  });
});
