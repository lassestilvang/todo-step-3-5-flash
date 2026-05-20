import { vi } from 'vitest';

/**
 * In-memory better-sqlite3 mock for test environments where the native
 * add-on cannot be loaded (e.g. Bun's test runner).
 *
 * Must be hoisted before any test-file import that loads @/lib/db.
 */
vi.mock('better-sqlite3', () => {
  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  function buildRow(cols: string[], binds: unknown[]): Record<string, unknown> {
    const row: Record<string, unknown> = {};
    cols.forEach((col, i) => {
      row[col] = binds[i] ?? null;
    });
    return row;
  }

  // --------------------------------------------------------------------------
  // Statement
  // --------------------------------------------------------------------------

  class Statement {
    sql: string;
    binds: unknown[] = [];

    constructor(
      public db: MockDatabase,
      sql: string,
    ) {
      this.sql = sql;
    }

    bind(...params: unknown[]) {
      this.binds = params;
      return this;
    }

    run() {
      return this.db._run(this);
    }

    get() {
      return this.db._get(this);
    }

    all() {
      return this.db._all(this);
    }

    columns() {
      return this.db._columns(this);
    }

    // --- internals ---------------------------------------------------------

    _execInternal() {
      const m = this.sql.trimStart().toUpperCase();
      const table = this.tableName() ?? '';
      let rows = this.db.rows.get(table) ?? [];

      if (m.startsWith('DELETE')) {
        rows = rows.filter((r) => !this.whereClauses().some((p) => r[p.col] !== p.val));
      } else if (m.startsWith('UPDATE')) {
        const setMap = Object.fromEntries(this.setClauses().map((s) => [s.col, s.val]));
        rows = rows.map((r) =>
          this.whereClauses().every((p) => r[p.col] === p.val) ? { ...r, ...setMap } : r
        );
      } else {
        rows = [...rows, buildRow(this.insertCols(), this.binds)];
      }
      this.db.rows.set(table, rows);
    }

    private tableName(): string | undefined {
      const m = this.sql.match(/(?:FROM|INTO|UPDATE|DELETE\s+FROM)\s+(\w+)/i);
      return m?.[1];
    }

    private insertCols(): string[] {
      const m: RegExpMatchArray | null = this.sql.match(/\(([^)]+)\)\s*VALUES/i);
      if (!m) return [];
      return m[1].split(',').map((raw) => raw.trim());
    }

    private whereClauses(): { col: string; val: unknown }[] {
      const m: RegExpMatchArray | null = this.sql.match(
        // @ts-expect-error -- 's' (dotAll) flag requires ES2018; ts target raised to ES2020
        /\bWHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/is
      );
      if (!m) return [];
      return m[1].split(/\s+AND\s+/i).map((part) => {
        const [col, val] = part.split('=').map((s) => s!.trim());
        return { col, val: isNaN(Number(val)) ? val : Number(val) };
      });
    }

    private setClauses(): { col: string; val: unknown }[] {
      const m: RegExpMatchArray | null = this.sql.match(
        // @ts-expect-error -- 's' (dotAll) flag requires ES2018; ts target raised to ES2020
        /SET\s+(.+?)(?:\s+WHERE|$)/is
      );
      if (!m) return [];
      return m[1].split(',').map((part) => {
        const [col, val] = part.split('=').map((s) => s!.trim());
        return { col, val: isNaN(Number(val)) ? val : Number(val) };
      });
    }
  }

  // --------------------------------------------------------------------------
  // MockDatabase
  // --------------------------------------------------------------------------

  class MockDatabase {
    rows = new Map<string, Record<string, unknown>[]>();
    nextId = 1;
    pragmas: Record<string, unknown> = {};

    pragma(instruction: string) {
      const [key, val] = instruction.split('=').map((s) => s.trim());
      if (val !== undefined) this.pragmas[key!] = val;
    }

    exec(sql: string) {
      for (const stmt of sql
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean)) {
        new Statement(this, stmt)._execInternal();
      }
    }

    prepare(sql: string) {
      return new Statement(this, sql);
    }

    parallelize(fn: (db: MockDatabase) => void) {
      fn(this);
    }

    function(_name: string, _fn: (..._args: unknown[]) => unknown) {}
    close() {}

    // --- internals used by Statement ----------------------------------------

    _run(_stmt: Statement) {
      return { changes: 1, lastInsertRowid: ++this.nextId };
    }

    _get(stmt: Statement) {
      return this._all(stmt)[0] ?? null;
    }

    _all(stmt: Statement) {
      const table: string = (stmt as any).tableName() ?? '';
      const rows = (table ? this.rows.get(table) ?? [] : []).map(
        (r: Record<string, unknown>) =>
          Object.fromEntries(
            Object.entries(r).filter(([, v]) => v !== null && v !== undefined)
          )
      );
      return rows;
    }

    _columns(_stmt: Statement) {
      const table: string = (_stmt as any).tableName() ?? '';
      const rows: Record<string, unknown>[] = this.rows.get(table) ?? [];
      if (!rows.length) return [];
      return Object.keys(rows[0]).map((name) => ({
        cid: 0,
        name,
        type: '',
        notnull: 0,
        dflt_value: null,
        pk: 0,
      }));
    }
  }

  return { default: MockDatabase };
});

import '@testing-library/jest-dom';
