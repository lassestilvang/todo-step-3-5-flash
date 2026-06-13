import { describe, it, expect } from 'vitest';

import { formatDuration, formatDate, toDate, debounce, cn } from '@/lib/utils';

describe('utils', () => {
  describe('formatDuration', () => {
    it('formats minutes correctly', () => {
      expect(formatDuration(0)).toBe('0m');
      expect(formatDuration(30)).toBe('30m');
      expect(formatDuration(60)).toBe('1h');
      expect(formatDuration(90)).toBe('1h 30m');
      expect(formatDuration(120)).toBe('2h');
      expect(formatDuration(150)).toBe('2h 30m');
    });

    it('handles negative and null/undefined as 0m', () => {
      expect(formatDuration(-1)).toBe('0m');
      expect(formatDuration(NaN)).toBe('0m');
    });
  });

  describe('formatDate', () => {
    it('formats a Date object', () => {
      const result = formatDate(new Date('2024-06-15'));
      expect(result).toBe('Jun 15, 2024');
    });

    it('formats a string date', () => {
      const result = formatDate('2024-12-25');
      expect(result).toBe('Dec 25, 2024');
    });

    it('returns empty string for null', () => {
      expect(formatDate(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
      expect(formatDate(undefined)).toBe('');
    });
  });

  describe('toDate', () => {
    it('converts ISO string to Date', () => {
      const result = toDate('2024-06-15T00:00:00Z');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
    });

    it('returns undefined for null', () => {
      expect(toDate(null)).toBeUndefined();
    });

    it('returns undefined for undefined', () => {
      expect(toDate(undefined)).toBeUndefined();
    });

    it('returns undefined for invalid date', () => {
      expect(toDate('not-a-date')).toBeUndefined();
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      let callCount = 0;
      const fn = () => callCount++;
      const debounced = debounce(fn, 50);

      debounced();
      debounced();
      debounced();

      expect(callCount).toBe(0);

      await new Promise((r) => setTimeout(r, 100));

      expect(callCount).toBe(1);
    });

    it('should cancel pending calls', async () => {
      let callCount = 0;
      const fn = () => callCount++;
      const debounced = debounce(fn, 50);

      debounced();
      debounced.cancel();

      await new Promise((r) => setTimeout(r, 100));

      expect(callCount).toBe(0);
    });
  });

  describe('cn', () => {
    it('merges classnames correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('handles conditional classes', () => {
      expect(cn('foo', true && 'bar', false && 'baz')).toBe('foo bar');
    });

    it('handles tailwind conflicts', () => {
      expect(cn('px-2 py-4', 'py-1')).toBe('px-2 py-1');
    });
  });
});
