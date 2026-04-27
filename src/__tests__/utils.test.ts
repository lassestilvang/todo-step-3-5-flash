import { describe, it, expect } from 'vitest';

import { formatDuration, debounce, cn } from '@/lib/utils';

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
      // tailwind-merge should handle conflicts
    });
  });
});
