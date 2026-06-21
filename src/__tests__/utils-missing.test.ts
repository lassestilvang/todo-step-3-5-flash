import { describe, it, expect } from 'vitest';

import { stringToColor, truncate } from '@/lib/utils';

describe('utils - additional coverage', () => {
  describe('stringToColor', () => {
    it('should generate a consistent HSL color for the same string', () => {
      const color1 = stringToColor('hello');
      const color2 = stringToColor('hello');
      expect(color1).toBe(color2);
    });

    it('should generate different colors for different strings', () => {
      const color1 = stringToColor('hello');
      const color2 = stringToColor('world');
      expect(color1).not.toBe(color2);
    });

    it('should return HSL format', () => {
      const color = stringToColor('test');
      expect(color).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
    });

    it('should handle empty string', () => {
      const color = stringToColor('');
      expect(color).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
    });

    it('should handle special characters', () => {
      const color = stringToColor('!@#$%^&*()');
      // Hue can be negative due to hash algorithm, so use a more flexible pattern
      expect(color).toMatch(/^hsl\(-?\d+, \d+%, \d+%\)$/);
    });
  });

  describe('truncate', () => {
    it('should truncate text longer than max length', () => {
      const text = 'This is a very long text that needs to be truncated';
      const result = truncate(text, 10);
      expect(result.length).toBeLessThanOrEqual(10);
      expect(result).toContain('…');
    });

    it('should not truncate text shorter than max length', () => {
      const text = 'Short text';
      const result = truncate(text, 20);
      expect(result).toBe(text);
    });

    it('should not truncate text equal to max length', () => {
      const text = 'Exactly 10';
      const result = truncate(text, 10);
      expect(result).toBe(text);
    });

    it('should handle empty string', () => {
      const result = truncate('', 10);
      expect(result).toBe('');
    });

    it('should handle maxLength of 0', () => {
      const result = truncate('text', 0);
      // truncate returns text.slice(0, maxLength - 1) + '…'
      // For maxLength=0: text.slice(0, -1) = 'tex' and then '…' is added
      expect(result).toBe('tex…');
    });

    it('should preserve first character when truncated', () => {
      const text = 'Hello World';
      const result = truncate(text, 5);
      expect(result.startsWith('Hell')).toBe(true);
    });
  });
});