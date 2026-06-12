// Mock for better-sqlite3
// This is used in test environments where native bindings are not available

const tables: Record<string, any[]> = {
  lists: [],
  tasks: [],
  task_labels: [],
  labels: [],
  subtasks: [],
  reminders: [],
  attachments: [],
  task_changes: [],
  schema_migrations: []
};

let idCounter = 0;
function generateId() {
  return `mock-${++idCounter}`;
}

const globalBinds: any[] = [];

function toComparableValue(val: any): any {
  if (val instanceof Date) {
    return val.toISOString();
  }
  return val;
}

class MockStatement {
  binds: any[] = [];
  sql: string;

  constructor(sql: string) {
    this.sql = sql;
  }

  bind(...params: any[]) {
    this.binds = params;
    globalBinds.length = 0;
    globalBinds.push(...params);
    return this;
  }

  run() {
    const params = Array.prototype.slice.call(arguments);
    if (params.length > 0) {
      this.binds = params;
      globalBinds.length = 0;
      globalBinds.push(...params);
    }
    const sqlUpper = this.sql.trim().toUpperCase();

    if (sqlUpper.startsWith('DELETE')) return this.handleDelete();
    if (sqlUpper.startsWith('INSERT')) return this.handleInsert();
    if (sqlUpper.startsWith('UPDATE')) return this.handleUpdate();
    return { changes: 0 };
  }

  handleDelete() {
    const tableMatch = this.sql.match(/DELETE\s+FROM\s+(\w+)/i);
    if (!tableMatch) return { changes: 0 };
    const table = tableMatch[1];
    const whereMatch = this.sql.match(/WHERE\s+([\s\S]+)/i);
    const initialLen = tables[table]?.length || 0;

    if (table === 'tasks' && whereMatch && whereMatch[1].includes('id')) {
      const filterVal = globalBinds[0];
      tables[table] = (tables[table] || []).filter((r: any) => r.id !== filterVal);
      const subtaskInitialLen = tables.subtasks?.length || 0;
      tables.subtasks = (tables.subtasks || []).filter((s: any) => s.task_id !== filterVal);
      return { changes: initialLen - (tables[table]?.length || 0) + (subtaskInitialLen - (tables.subtasks?.length || 0)) };
    }

    if (whereMatch && globalBinds.length > 0) {
      const filterSql = whereMatch[1];
      if (filterSql.includes(' AND ')) {
        const conditions = filterSql.split(/\s+AND\s+/i);
        const filters: Record<string, any> = {};
        conditions.forEach((cond, idx) => {
          const eqMatch = cond.match(/(\w+)\s*=\s*\?/);
          if (eqMatch && idx < globalBinds.length) {
            filters[eqMatch[1]] = globalBinds[idx];
          }
        });
        const beforeLen = (tables[table] || []).length;
        // Check if this is a DELETE statement (sqlUpper is defined in run() context)
        // For DELETE, we want to REMOVE rows that match the conditions
        // For SELECT (in all()), we want to KEEP rows that match the conditions
        const isDelete = this.sql.toUpperCase().startsWith('DELETE');
        tables[table] = (tables[table] || []).filter((r: any) => {
          const matches = Object.entries(filters).every(([col, val]) => r[col] === val);
          return isDelete ? !matches : matches;
        });
        return { changes: beforeLen - (tables[table]?.length || 0) };
      }
      const singleWhereMatch = filterSql.match(/(\w+)\s*=\s*\?/i);
      if (singleWhereMatch) {
        const filterCol = singleWhereMatch[1];
        const beforeLen = (tables[table] || []).length;
        tables[table] = (tables[table] || []).filter((r: any) => r[filterCol] !== globalBinds[0]);
        return { changes: beforeLen - (tables[table]?.length || 0) };
      }
    }

    if (!whereMatch) {
      const changes = tables[table]?.length || 0;
      tables[table] = [];
      return { changes };
    }
    return { changes: 0 };
  }

  // Helper to reset state between tests
  static reset() {
    for (const table of Object.keys(tables)) {
      tables[table] = [];
    }
    idCounter = 0;
    globalBinds.length = 0;
  }

  handleInsert() {
    const insertMatch = this.sql.match(/INSERT\s+(OR\s+IGNORE\s+)?INTO\s+(\w+)/i);
    if (!insertMatch || this.binds.length === 0) return { changes: 0 };
    const table = insertMatch[2];
    const columnsStr = this.sql.match(/INTO\s+\w+\s*\(([\s\S]*?)\)\s*VALUES/i)?.[1];
    const cols = columnsStr ? columnsStr.replace(/\s+/g, ' ').split(',').map(c => c.trim()).filter(c => c) : [];

    const row: any = {};
    cols.forEach((c, i) => { if (i < this.binds.length) row[c] = this.binds[i]; });
    if (!row.id) row.id = generateId();
    if (!tables[table]) tables[table] = [];

    // Convert Date objects to ISO strings
    Object.keys(row).forEach(k => {
      if (row[k] instanceof Date) row[k] = row[k].toISOString();
    });

    if (table === 'lists' || table === 'tasks' || table === 'subtasks' || table === 'reminders') {
      if (row.order_index === undefined) row.order_index = 0;
      if (row.status === undefined) row.status = 'pending';
      if (row.priority === undefined) row.priority = 'none';
      if (row.sent === undefined) row.sent = 0;
      if (row.completed === undefined) row.completed = 0;
    }
    if (table === 'lists') { if (row.is_magic === undefined) row.is_magic = 0; }
    if (table === 'tasks' || table === 'subtasks') {
      if (row.estimate_minutes === undefined) row.estimate_minutes = 0;
      if (row.actual_minutes === undefined) row.actual_minutes = 0;
    }

    // Ensure numeric fields are numbers for reminders
    if (table === 'reminders') {
      if (typeof row.sent === 'string') row.sent = parseInt(row.sent, 10);
    }

    if (insertMatch[1]) {
      const existing = tables[table].find((r: any) => cols.every(c => r[c] === row[c]));
      if (existing) return { changes: 0, lastInsertRowid: row.id };
    }

    const uniqueCols = this.getUniqueColumns(table);
    for (const col of uniqueCols) {
      if (row[col] !== undefined) {
        const existing = tables[table].find((r: any) => r[col] === row[col]);
        if (existing) throw new Error(`UNIQUE constraint failed: ${col}`);
      }
    }

    tables[table].push(row);
    return { changes: 1, lastInsertRowid: row.id };
  }

  getUniqueColumns(table: string): string[] {
    if (table === 'labels') return ['name'];
    return [];
  }

  handleUpdate() {
    const updateMatch = this.sql.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)\s+WHERE\s+(.+)/i);
    if (!updateMatch) return { changes: 0 };
    const table = updateMatch[1];
    const setClause = updateMatch[2];
    const whereClause = updateMatch[3];
    const rows = tables[table] || [];
    const now = new Date().toISOString();

    const updates: Record<string, any> = {};
    const setParts = setClause.split(/,\s*/);
    for (const part of setParts) {
      const match = part.match(/(\w+)\s*=\s*(.+)/);
      if (match) {
        const col = match[1];
        let val: any = match[2].trim();
        if (val.toUpperCase() === 'CURRENT_TIMESTAMP') val = now;
        else if (val.startsWith('?')) {
          const bindIdx = this.getBindIndexForSet(setParts, col);
          val = this.binds[bindIdx] ?? null;
          if (val instanceof Date) val = val.toISOString();
        } else {
          // Handle literal values
          if (val === '1') val = 1;
          else if (val === '0') val = 0;
          else if (!isNaN(Number(val)) && val !== '') val = Number(val);
        }
        // Ensure numeric columns are stored as numbers
        if (col === 'sent' && typeof val === 'string') val = parseInt(val, 10);
        updates[col] = val;
      }
    }

    const whereMatch = whereClause.match(/(\w+)\s*=\s*\?$/);
    const whereCol = whereMatch?.[1];
    const whereVal = whereMatch ? this.binds[this.binds.length - 1] : null;

    let changes = 0;
    rows.forEach((row: any) => {
      if (whereCol && row[whereCol] === whereVal) {
        Object.assign(row, updates);
        changes++;
      }
    });
    return { changes };
  }

  getBindIndexForSet(setParts: string[], col: string): number {
    let idx = 0;
    for (const part of setParts) {
      const match = part.match(/(\w+)\s*=\s*\??/);
      if (match) { if (match[1] === col) return idx; idx++; }
    }
    return idx;
  }

  get(...params: any[]) {
    const allResult = this.all(...params);
    return Array.isArray(allResult) && allResult.length > 0 ? allResult[0] : null;
  }

  all(...params: any[]) {
    const sqlUpper = this.sql.toUpperCase();
    if (params.length > 0) { this.binds = params; }
    globalBinds.length = 0;
    globalBinds.push(...this.binds);

    const tableMatch = this.sql.match(/FROM\s+(\w+)/i);
    if (!tableMatch) return [];

    if (sqlUpper.includes('JOIN')) {
      if (sqlUpper.includes('TASK_LABELS') && sqlUpper.includes('JOIN LABELS')) return this.handleLabelsJoin();
      return this.handleJoin();
    }
    let rows = tables[this.sql.match(/FROM\s+(\w+)/i)?.[1] || ''] || [];

    // Match WHERE clause - stop at ORDER, LIMIT, or end of string (not inside parentheses)
    const whereClauseMatch = this.sql.match(/WHERE\s+([\s\S]+?)(?=\s+ORDER\s+BY|\s+LIMIT|$)/i);
    if (whereClauseMatch) {
      const whereClause = whereClauseMatch[1];
      rows = rows.filter((r: any) => this.evaluateWhere(r, whereClause));
    }

    const orderMatch = this.sql.match(/ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?/);
    if (orderMatch) {
      const col = orderMatch[1];
      const desc = orderMatch[2]?.toUpperCase() === 'DESC';
      rows.sort((a, b) => {
        if (a[col] < b[col]) return desc ? 1 : -1;
        if (a[col] > b[col]) return desc ? -1 : 1;
        return 0;
      });
    }
    return rows;
  }

  handleLabelsJoin(): any[] {
    const whereMatch = this.sql.match(/WHERE\s+tl\.task_id\s*=\s*\?/);
    if (whereMatch && globalBinds.length > 0) {
      const taskId = globalBinds[0];
      const taskLabels = (tables['task_labels'] || []).filter((tl: any) => tl.task_id === taskId);
      return taskLabels.map((tl: any) => {
        const label = (tables['labels'] || []).find((l: any) => l.id === tl.label_id);
        return label ? { ...label } : null;
      }).filter((r: any) => r !== null);
    }
    const result: any[] = [];
    for (const tl of tables['task_labels'] || []) {
      const label = (tables['labels'] || []).find((l: any) => l.id === tl.label_id);
      if (label) result.push({ task_id: tl.task_id, id: label.id, name: label.name, color: label.color, icon: label.icon, created_at: label.created_at });
    }
    return result;
  }

  handleJoin(): any[] { return []; }

  evaluateWhere(row: any, whereSql: string): boolean {
    // Check for OR first since it may contain AND conditions within groups
    if (whereSql.includes(' OR ') || /\sOR\s/.test(whereSql)) return this.evaluateOrCondition(row, whereSql);
    if (whereSql.includes(' AND ')) return this.evaluateAndCondition(row, whereSql);

    const statusMatch = whereSql.match(/status\s*!=\s*'([^']+)'/);
    if (statusMatch && row.status === statusMatch[1]) return false;

    const simpleEqMatch = whereSql.match(/^(\w+)\s*=\s*\?$/);
    if (simpleEqMatch) return row[simpleEqMatch[1]] === this.binds[0];

    const inMatch = whereSql.match(/(\w+)\s+IN\s*\(([\s\S]*)\)/);
    if (inMatch) {
      const placeholderCount = (inMatch[2].match(/\?/g) || []).length;
      if (this.binds.length >= placeholderCount) return this.binds.slice(0, placeholderCount).includes(row[inMatch[1]]);
    }

    const sentEqMatch = whereSql.match(/sent\s*=\s*(\d+)/);
    if (sentEqMatch) return parseInt(row.sent) === parseInt(sentEqMatch[1]);

    const remindAtMatch = whereSql.match(/remind_at\s*<=\s*\?/);
    if (remindAtMatch && this.binds.length > 0) return toComparableValue(row.remind_at) <= toComparableValue(this.binds[0]);
    return true;
  }

  evaluateOrCondition(row: any, whereSql: string): boolean {
    // Match patterns like "(due_date IS NOT NULL AND due_date >= ? AND due_date < ?) OR (deadline IS NOT NULL AND deadline >= ? AND deadline < ?)"
    // Use a more robust regex to match the groups
    const groups = whereSql.match(/\(([^)]+)\)/g);
    if (groups && groups.length >= 2 && this.binds.length >= 4) {
      // First group may have extra opening paren due to double parentheses in SQL
      let firstGroupSql = groups[0].slice(1); // Remove one opening parenthesis
      if (firstGroupSql.startsWith('(')) firstGroupSql = firstGroupSql.slice(1); // Remove second if present
      firstGroupSql = firstGroupSql.slice(0, -1); // Remove closing paren
      let secondGroupSql = groups[1].slice(1, -1); // Remove parentheses

      if (firstGroupSql.includes('BETWEEN')) {
        const firstOk = this.evaluateBetweenGroup(row, firstGroupSql, 0, 2);
        const secondOk = this.evaluateBetweenGroup(row, secondGroupSql, 2, 4);
        return firstOk || secondOk;
      }
      const firstOk = this.evaluateWhereGroup(row, firstGroupSql, 0, 2);
      const secondOk = this.evaluateWhereGroup(row, secondGroupSql, 2, 4);
      return firstOk || secondOk;
    }
    return false;
  }

  evaluateAndCondition(row: any, whereSql: string): boolean {
    const trimmedWhere = whereSql.trim();
    // Use [\s\S] to match any character including newlines
    // Pattern: ((group1)\nOR (group2))\nAND rest
    // The SQL structure is: ((group1) OR (group2)) followed by newline and AND rest
    const outerMatch = trimmedWhere.match(/\(\(([\s\S]+?)\)\s+OR\s+\(([\s\S]+?)\)\)\s*\n*\s*AND\s+([\s\S]+)/);
    if (outerMatch) {
      const orSql = `(${outerMatch[1]}) OR (${outerMatch[2]})`;
      const orResult = this.evaluateOrCondition(row, orSql);
      const statusMatch = outerMatch[3].match(/status\s*!=\s*'([^']+)'/);
      return orResult && (!statusMatch || row.status !== statusMatch[1]);
    }

    const parenAndMatch = whereSql.match(/\(([^)]+)\)\s+AND\s+(.+)/);
    if (parenAndMatch) {
      const parenOk = this.evaluateParenthesizedCondition(row, parenAndMatch[1]);
      const statusMatch = parenAndMatch[2].match(/status\s*!=\s*'([^']+)'/);
      const andOk = !statusMatch || row.status !== statusMatch[1];
      return parenOk && andOk;
    }

    // Handle simple AND conditions like "sent = 0 AND remind_at <= ?"
    if (whereSql.includes(' AND ')) {
      // Split on AND that may be followed by newline
      const conditions = whereSql.split(/\s+AND\s+/);
      for (const cond of conditions) {
        const trimmed = cond.trim();
        const eqMatch = trimmed.match(/(\w+)\s*=\s*(\d+)/);
        if (eqMatch) {
          const col = eqMatch[1];
          const val = parseInt(eqMatch[2], 10);
          if (row[col] !== val) return false;
        }
        const neMatch = trimmed.match(/(\w+)\s*!=\s*'([^']+)'/);
        if (neMatch) {
          if (row[neMatch[1]] === neMatch[2]) return false;
        }
        const lteMatch = trimmed.match(/(\w+)\s*<=\s*\?/);
        if (lteMatch && this.binds.length > 0) {
          const col = lteMatch[1];
          if (toComparableValue(row[col]) > toComparableValue(this.binds[0])) return false;
        }
        const ltMatch = trimmed.match(/(\w+)\s*<\s*\?/);
        if (ltMatch && this.binds.length > 0) {
          const col = ltMatch[1];
          if (toComparableValue(row[col]) >= toComparableValue(this.binds[0])) return false;
        }
      }
      return true;
    }

    // Handle simple AND conditions like "sent = 0 AND remind_at <= ?"
    if (whereSql.includes(' AND ')) {
      // Split on AND that may be followed by newline
      const conditions = whereSql.split(/\s+AND\s+/);
      for (const cond of conditions) {
        const trimmed = cond.trim();
        const eqMatch = trimmed.match(/(\w+)\s*=\s*(\d+)/);
        if (eqMatch) {
          const col = eqMatch[1];
          const val = parseInt(eqMatch[2], 10);
          if (row[col] !== val) return false;
        }
        const neMatch = trimmed.match(/(\w+)\s*!=\s*'([^']+)'/);
        if (neMatch) {
          if (row[neMatch[1]] === neMatch[2]) return false;
        }
        const lteMatch = trimmed.match(/(\w+)\s*<=\s*\?/);
        if (lteMatch && this.binds.length > 0) {
          const col = lteMatch[1];
          if (toComparableValue(row[col]) > toComparableValue(this.binds[0])) return false;
        }
        const ltMatch = trimmed.match(/(\w+)\s*<\s*\?/);
        if (ltMatch && this.binds.length > 0) {
          const col = ltMatch[1];
          if (toComparableValue(row[col]) >= toComparableValue(this.binds[0])) return false;
        }
      }
      return true;
    }

    if (/\sOR\s/.test(whereSql) && !trimmedWhere.match(/\)\s+AND\s+/)) return this.evaluateOrCondition(row, whereSql);
    return true;
  }

  evaluateParenthesizedCondition(row: any, cond: string): boolean {
    if (cond.includes('deadline IS NOT NULL') && cond.includes('deadline < ?')) {
      if (!row.deadline) return false;
      return toComparableValue(row.deadline) < toComparableValue(this.binds[0]);
    }
    if (cond.includes('due_date IS NOT NULL')) {
      if (!row.due_date) return false;
      const dueDate = toComparableValue(row.due_date);
      return dueDate >= toComparableValue(this.binds[0]) && dueDate <= toComparableValue(this.binds[1]);
    }
    return true;
  }

  evaluateWhereGroup(row: any, groupSql: string, bindStart: number): boolean {
    const isNotNullMatch = groupSql.match(/(\w+)\s+IS\s+NOT\s+NULL/);
    if (!isNotNullMatch) return false;
    const col = isNotNullMatch[1];
    if (!row[col]) return false;

    // Match BETWEEN first (since it uses two placeholders)
    const betweenMatch = groupSql.match(/(\w+)\s+BETWEEN\s+\?\s+AND\s+\?/);
    if (betweenMatch) {
      const col = betweenMatch[1];
      if (!row[col]) return false;
      const val1 = toComparableValue(this.binds[bindStart]);
      const val2 = toComparableValue(this.binds[bindStart + 1]);
      const rowVal = toComparableValue(row[col]);
      return rowVal >= val1 && rowVal <= val2;
    }

    // Match comparison operators - order matters: <= and >= before < and >
    const compMatches = [...groupSql.matchAll(/(\w+)\s*(<=|>=|<|>)\s*\?/g)];
    if (compMatches.length < 2) return false;

    for (let i = 0; i < compMatches.length; i++) {
      const [, compCol, op] = compMatches[i];
      const val = toComparableValue(this.binds[bindStart + i]);
      const rowVal = toComparableValue(row[compCol]);

      if (op === '>=') { if (!(rowVal >= val)) return false; }
      else if (op === '<=') { if (!(rowVal <= val)) return false; }
      else if (op === '<') { if (!(rowVal < val)) return false; }
      else if (op === '>') { if (!(rowVal > val)) return false; }
    }
    return true;
  }

  evaluateBetweenGroup(row: any, groupSql: string, bindStart: number): boolean {
    const isNotNullMatch = groupSql.match(/(\w+)\s+IS\s+NOT\s+NULL/);
    if (!isNotNullMatch) return false;
    const col = isNotNullMatch[1];
    if (!row[col]) return false;

    const betweenMatch = groupSql.match(/(\w+)\s+BETWEEN\s+\?\s+AND\s+\?/);
    if (!betweenMatch) return false;

    return toComparableValue(row[col]) >= toComparableValue(this.binds[bindStart]) &&
           toComparableValue(row[col]) <= toComparableValue(this.binds[bindStart + 1]);
  }
}

const mockDbInstance = {
  prepare(sql: string) { return new MockStatement(sql); },
  exec() { return { changes: 0 }; },
  pragma() { return {}; },
  reset() {
    for (const table of Object.keys(tables)) {
      tables[table] = [];
    }
    idCounter = 0;
    globalBinds.length = 0;
  },
};

export default mockDbInstance;