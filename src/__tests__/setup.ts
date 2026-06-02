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

  const SCHEMAS: Record<string, Record<string, unknown>> = {
    tasks: {
      status: 'pending',
      priority: 'none',
      estimate_minutes: 0,
      actual_minutes: 0,
      description: '',
      parent_id: null,
      due_date: null,
      deadline: null,
      recurrence: null,
      recurrence_rule: null,
      completed_at: null,
    },
    lists: {
      color: '#3b82f6',
      icon: '📋',
      is_magic: 0,
      parent_id: null,
      order_index: 0,
    },
    labels: {
      color: '#3b82f6',
      icon: null,
    },
    subtasks: {
      completed: 0,
      order_index: 0,
    },
    reminders: {
      sent: 0,
    },
  };

  function buildRow(table: string, cols: string[], binds: unknown[]): Record<string, unknown> {
    const row: Record<string, unknown> = {
      id: binds[cols.indexOf('id')] ?? Math.random().toString(36).substring(7),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...(SCHEMAS[table] || {}),
    };
    cols.forEach((col, i) => {
      if (binds[i] !== undefined) {
        row[col] = binds[i];
      }
    });
    return row;
  }

  // --------------------------------------------------------------------------
  // Statement
  // --------------------------------------------------------------------------

  class Statement {
    sql: string;
    binds: unknown[] = [];
    changes: number = 0;

    constructor(
      public db: MockDatabase,
      sql: string
    ) {
      this.sql = sql;
    }

    bind(...params: unknown[]) {
      this.binds = params;
      return this;
    }

    run(...params: unknown[]) {
      if (params.length > 0) this.binds = params;
      this._execInternal();
      return this.db._run(this);
    }

    get(...params: unknown[]) {
      if (params.length > 0) this.binds = params;
      return this.db._get(this);
    }

    all(...params: unknown[]) {
      if (params.length > 0) this.binds = params;
      return this.db._all(this);
    }

    columns() {
      return this.db._columns(this);
    }

    // --- internals ---------------------------------------------------------

    _execInternal() {
      const sqlUpper = this.sql.toUpperCase();
      const m = this.sql.trimStart().toUpperCase();
      const table = this.tableName() ?? '';
      let rows = this.db.rows.get(table) ?? [];

      if (m.startsWith('DELETE')) {
        const clauses = this.whereClauses(0);
        const initialLength = rows.length;
        if (clauses.length === 0 && !sqlUpper.includes('WHERE')) {
          rows = [];
        } else {
          rows = rows.filter((r) => {
            const matches = clauses.every((p) => {
              const rowVal = r[p.col];
              if (p.op === '!=') return rowVal !== p.val;
              return rowVal === p.val;
            });
            if (matches && table === 'tasks') {
              // Cascade delete subtasks
              const subtasks = this.db.rows.get('subtasks') ?? [];
              this.db.rows.set('subtasks', subtasks.filter(s => s.task_id !== r.id));
            }
            return !matches;
          });
        }
        this.changes = initialLength - rows.length;
      } else if (m.startsWith('UPDATE')) {
        const whereIdx = sqlUpper.indexOf('WHERE');
        const setSql = whereIdx === -1 ? this.sql : this.sql.substring(0, whereIdx);
        const setBindCount = (setSql.match(/\?/g) || []).length;

        const setClauses = this.setClauses(0);
        const whereClauses = this.whereClauses(setBindCount);

        const setMap = Object.fromEntries(setClauses.map((s) => [s.col, s.val]));
        let updateCount = 0;

        rows = rows.map((r) => {
          const matches = whereClauses.length === 0 || whereClauses.every((p) => {
            const rowVal = r[p.col];
            if (p.op === '!=') return rowVal !== p.val;
            return rowVal === p.val;
          });
          if (matches) {
            updateCount++;
            const updatedRow = { ...r, ...setMap };
            if (setMap.status === 'completed' && !r.completed_at) {
              updatedRow.completed_at = new Date().toISOString();
            }
            return updatedRow;
          }
          return r;
        });
        this.changes = updateCount;
      } else {
        const insertCols = this.insertCols();
        if (table === 'labels' && insertCols.includes('name')) {
          const nameIdx = insertCols.indexOf('name');
          const nameVal = this.binds[nameIdx];
          if (rows.some(r => r.name === nameVal)) {
            throw new Error('UNIQUE constraint failed: labels.name');
          }
        }
        rows = [...rows, buildRow(table, insertCols, this.binds)];
        this.changes = 1;
      }
      this.db.rows.set(table, rows);
    }

    tableName(): string | undefined {
      const m = this.sql.match(/(?:FROM|INTO|UPDATE|DELETE\s+FROM)\s+(\w+)/i);
      return m?.[1];
    }

    insertCols(): string[] {
      const m: RegExpMatchArray | null = this.sql.match(/\(([^)]+)\)\s*VALUES/i);
      if (!m || !m[1]) return [];
      return m[1].split(',').map((raw) => raw.trim());
    }

    whereClauses(startBindIdx: number): { col: string; op: string; val: unknown }[] {
      const m: RegExpMatchArray | null = this.sql.match(
        // @ts-expect-error -- 's' (dotAll) flag requires ES2018; ts target raised to ES2020
        /\bWHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/is
      );
      if (!m || !m[1]) return [];
      let bindCount = startBindIdx;
      return m[1].split(/\s+AND\s+/i).map((part) => {
        const match = part.match(/(\w+)\s*(!=|<=|>=|IS NOT|IS|<|>|=)\s*(.+)/i);
        if (!match) return null;
        const col = match[1]!.trim();
        const op = match[2]!.toUpperCase();
        const valStr = match[3]!.trim();

        let val: unknown = valStr;
        if (valStr === '?') {
          val = this.binds[bindCount++];
        } else if (valStr.startsWith("'") && valStr.endsWith("'")) {
          val = valStr.substring(1, valStr.length - 1);
        } else if (op === 'IS' || op === 'IS NOT') {
          val = op + ' ' + valStr.toUpperCase();
        } else {
          val = isNaN(Number(valStr)) ? valStr : Number(valStr);
        }
        return { col, op, val };
      }).filter((c): c is { col: string; op: string; val: unknown } => c !== null);
    }

    setClauses(startBindIdx: number): { col: string; val: unknown }[] {
      const m: RegExpMatchArray | null = this.sql.match(
        // @ts-expect-error -- 's' (dotAll) flag requires ES2018; ts target raised to ES2020
        /SET\s+(.+?)(?:\s+WHERE|$)/is
      );
      if (!m || !m[1]) return [];
      let bindCount = startBindIdx;
      return m[1].split(',').map((part) => {
        const [col, valStr] = part.split('=').map((s) => s!.trim());
        let val: unknown = valStr;
        if (valStr === '?') {
          val = this.binds[bindCount++];
        } else if (valStr !== undefined) {
          if (valStr.startsWith("'") && valStr.endsWith("'")) {
            val = valStr.substring(1, valStr.length - 1);
          } else {
            val = isNaN(Number(valStr)) ? valStr : Number(valStr);
          }
        }
        return { col: col!, val };
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
    close() {
      this.rows.clear();
    }

    // --- internals used by Statement ----------------------------------------

    _run(_stmt: Statement) {
      return { changes: _stmt.changes, lastInsertRowid: ++this.nextId };
    }

    _get(stmt: Statement) {
      return this._all(stmt)[0] ?? null;
    }

    _all(stmt: Statement) {
      const table: string = (stmt as Statement).tableName() ?? '';
      let rows = (table ? this.rows.get(table) ?? [] : []).map((r) => ({ ...r }));

      const sqlUpper = stmt.sql.toUpperCase();

      // Handle JOINs (specifically for labels)
      if (sqlUpper.includes('JOIN') && sqlUpper.includes('TASK_LABELS')) {
        const binds = stmt.binds;
        const taskId = binds.length > 0 ? binds[0] : null;
        const taskLabels = (this.rows.get('task_labels') ?? []).filter((tl) => !taskId || tl.task_id === taskId);
        const labelIds = taskLabels.map((tl) => tl.label_id);
        const allLabels = this.rows.get('labels') ?? [];
        rows = allLabels.filter((l) => labelIds.includes(l.id));
        
        // Return task_id if specifically requested
        if (sqlUpper.includes('TL.TASK_ID')) {
           rows = rows.map(l => {
             const tl = taskLabels.find(x => x.label_id === l.id);
             return { ...l, task_id: tl?.task_id };
           });
        }
      } else if (sqlUpper.includes('WHERE')) {
        // Special case for complex OR logic in Today view
        if (sqlUpper.includes(' OR ')) {
           const binds = stmt.binds;
           rows = rows.filter(r => {
             const due = r.due_date;
             const dead = r.deadline;
             // Expecting 4 binds: todayStart, todayEnd, todayStart, todayEnd
             const start = binds[0] as string;
             const end = binds[1] as string;
             const matchDue = due && due >= start && due < end;
             const matchDead = dead && dead >= start && dead < end;
             
             let match = matchDue || matchDead;
             if (sqlUpper.includes('STATUS') && sqlUpper.includes('COMPLETED')) {
               match = match && r.status !== 'completed';
             }
             return match;
           });
        } else {
          const clauses = stmt.whereClauses(0);
          rows = rows.filter((r) => {
            return clauses.every((c) => {
              const rowVal = r[c.col];
              if (c.op === 'IS' && c.val === 'IS NULL') return rowVal === null || rowVal === undefined;
              if (c.op === 'IS NOT' && c.val === 'IS NOT NULL') return rowVal !== null && rowVal !== undefined;
              if (c.op === '>=') return (rowVal as any) >= (c.val as any);
              if (c.op === '<') return (rowVal as any) < (c.val as any);
              if (c.op === '>') return (rowVal as any) > (c.val as any);
              if (c.op === '<=') return (rowVal as any) <= (c.val as any);
              if (c.op === '!=') return rowVal !== c.val;
              return rowVal === c.val;
            });
          });
        }
      }

      if (sqlUpper.includes('ORDER BY')) {
        const m = stmt.sql.match(/ORDER BY\s+(\w+)(?:\s+(ASC|DESC))?/i);
        if (m) {
          const col = m[1]!;
          const desc = m[2]?.toUpperCase() === 'DESC';
          rows.sort((a, b) => {
            const valA = a[col];
            const valB = b[col];
            if (valA === undefined || valA === null) return 1;
            if (valB === undefined || valB === null) return -1;
            if (valA === valB) return 0;
            const res = (valA as any) < (valB as any) ? -1 : 1;
            return desc ? -res : res;
          });
        }
      }

      return rows.map((r) => {
        // Keep nulls but filter out undefined
        return Object.fromEntries(Object.entries(r).filter(([, v]) => v !== undefined));
      });
    }

    _columns(_stmt: Statement) {
      const table: string = (_stmt as Statement).tableName() ?? '';
      const rows: Record<string, unknown>[] = this.rows.get(table) ?? [];
      if (!rows.length || !rows[0]) return [];
      return Object.keys(rows[0]!).map((name) => ({
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
