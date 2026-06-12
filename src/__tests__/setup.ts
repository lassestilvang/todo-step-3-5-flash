/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
import { vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';

// Setup localStorage mock for jsdom
beforeEach(() => {
  const storage: Record<string, string> = {};
  const localStorageMock = {
    getItem: vi.fn((key: string) => storage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key];
    }),
    clear: vi.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
    }),
    get length() {
      return Object.keys(storage).length;
    },
    key: vi.fn((index: number) => Object.keys(storage)[index] ?? null),
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
});

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
  const mockDb = require('./mocks/better-sqlite3.ts');
  if (mockDb.default && typeof mockDb.default.reset === 'function') {
    mockDb.default.reset();
  }
});