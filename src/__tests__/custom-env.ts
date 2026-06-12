import { vi } from 'vitest';

// Mock better-sqlite3
vi.mock('better-sqlite3', () => ({
  __esModule: true,
  default: {
    prepare(sql: string) {
      return {
        sql,
        binds: [] as never[],
        bind(...params: never[]) {
          this.binds = params;
          return this;
        },
        run(...params: never[]) {
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

export {};