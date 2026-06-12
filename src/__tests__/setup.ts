import { vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock better-sqlite3
vi.mock('better-sqlite3', () => ({
  __esModule: true,
  default: {
    prepare(sql: string) {
      return {
        sql,
        binds: [] as any[],
        bind(...params: any[]) {
          this.binds = params;
          return this;
        },
        run(...params: any[]) {
          if (params.length > 0) this.binds = params;
          return { changes: 1, lastInsertRowid: 'mock-id' };
        },
        get() { return null; },
        all() { return []; }
      };
    },
    exec() { return { changes: 0 }; },
    pragma() { return {}; }
  }
}));

// Reset modules before each test
beforeEach(() => {
  vi.resetModules();
});

// Reset the mock database state between tests
afterEach(() => {
  // Clear the db instance so it gets recreated
  try {
    // Reset the mock database state
    const mockDb = require('@/__tests__/mocks/better-sqlite3.ts');
    if (mockDb.default && typeof mockDb.default.reset === 'function') {
      mockDb.default.reset();
    }
    // Reset the db-init module
    delete require.cache[require.resolve('@/lib/db-init')];
    // Reset the db module
    delete require.cache[require.resolve('@/lib/db')];
  } catch {
    // Ignore if module not found
  }
});