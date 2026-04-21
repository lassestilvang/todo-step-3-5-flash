import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

let db: ReturnType<typeof Database>;

if (process.env.NODE_ENV === 'test') {
  db = new Database(':memory:');
} else {
  const dbDir = path.resolve(process.cwd(), process.env.DATABASE_PATH || 'data');
  const dbPath = path.join(dbDir, 'task-planner.db');

  // Ensure data directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL'); // Enable WAL for better concurrency
  db.pragma('foreign_keys = ON');
}

export { db };

// Initialize database schema
export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS lists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#3b82f6',
      icon TEXT NOT NULL DEFAULT '📋',
      is_magic INTEGER DEFAULT 0,
      parent_id TEXT,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES lists(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      list_id TEXT NOT NULL,
      parent_id TEXT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      due_date DATETIME,
      deadline DATETIME,
      estimate_minutes INTEGER DEFAULT 0,
      actual_minutes INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      priority TEXT NOT NULL DEFAULT 'none',
      recurrence TEXT,
      recurrence_rule TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS labels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL,
      icon TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS task_labels (
      task_id TEXT NOT NULL,
      label_id TEXT NOT NULL,
      PRIMARY KEY (task_id, label_id),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS subtasks (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      title TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      type TEXT NOT NULL,
      size INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      remind_at DATETIME NOT NULL,
      sent INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS task_changes (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      field TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      changed_by TEXT,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks(list_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
    CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
    CREATE INDEX IF NOT EXISTS idx_reminders_remind_at ON reminders(remind_at);
    CREATE INDEX IF NOT EXISTS idx_reminders_sent ON reminders(sent);
    CREATE INDEX IF NOT EXISTS idx_changes_task_id ON task_changes(task_id);
  `);
}

// Helper to convert SQLite row to object with dates
export function rowToObj(row: unknown): Record<string, unknown> | null {
  if (!row || typeof row !== 'object') return null;
  const obj = { ...(row as Record<string, unknown>) };
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    if (typeof val === 'string' && (key.endsWith("_at") || key.includes("Date"))) {
      const d = new Date(val);
      obj[key] = isNaN(d.getTime()) ? null : d;
    }
  });
  return obj;
}

// Generate UUID
export function generateId() {
  return crypto.randomUUID();
}

// Migrations
export const migrations = [
  {
    version: 1,
    name: "initial",
    up: initializeDatabase,
  },
];

export function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const rows = db.prepare("SELECT version FROM schema_migrations").all() as Array<{ version: number }>;
  const applied = new Set(rows.map((row) => row.version));

  for (const migration of migrations) {
    if (!applied.has(migration.version)) {
      console.log(`Applying migration ${migration.version}: ${migration.name}`);
      migration.up();
      db.prepare("INSERT INTO schema_migrations (version, name) VALUES (?, ?)").run(
        migration.version,
        migration.name
      );
    }
  }
}

// Run migrations
runMigrations();

// ==================== LISTS ====================

export interface ListRow {
  id: string;
  name: string;
  color: string;
  icon: string;
  is_magic: number;
  parent_id: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export function getAllLists(): ListRow[] {
  return db.prepare(`
    SELECT * FROM lists ORDER BY order_index
  `).all() as ListRow[];
}

export function getListById(id: string): ListRow | null {
  return rowToObj(
    db.prepare("SELECT * FROM lists WHERE id = ?").get(id)
  ) as ListRow | null;
}

export function createList(data: {
  name: string;
  color: string;
  icon: string;
  parent_id?: string;
  order?: number;
  id?: string;
}): ListRow {
  const id = data.id ?? generateId();
  db.prepare(`
    INSERT INTO lists (id, name, color, icon, parent_id, order_index)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, data.name, data.color, data.icon, data.parent_id ?? null, data.order ?? 0);
  return getListById(id)!;
}

export function updateList(id: string, data: Partial<{
  name: string;
  color: string;
  icon: string;
  parent_id: string;
  order: number;
}>): ListRow | null {
  const updates: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) {
    updates.push("name = ?");
    values.push(data.name);
  }
  if (data.color !== undefined) {
    updates.push("color = ?");
    values.push(data.color);
  }
  if (data.icon !== undefined) {
    updates.push("icon = ?");
    values.push(data.icon);
  }
  if (data.parent_id !== undefined) {
    updates.push("parent_id = ?");
    values.push(data.parent_id);
  }
  if (data.order !== undefined) {
    updates.push("order_index = ?");
    values.push(data.order);
  }

  if (updates.length === 0) return getListById(id);

  values.push(id);
  db.prepare(`UPDATE lists SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values);
  return getListById(id)!;
}

export function deleteList(id: string): boolean {
  const result = db.prepare("DELETE FROM lists WHERE id = ?").run(id);
  return result.changes > 0;
}

// Ensure Inbox exists
export function ensureInboxExists() {
  const inbox = getListById("inbox");
  if (!inbox) {
    createList({
      id: "inbox",
      name: "Inbox",
      color: "#3b82f6",
      icon: "📥",
      order: 0,
    });
  }
}

// ==================== TASKS ====================

export interface TaskRow {
  id: string;
  list_id: string;
  parent_id: string | null;
  title: string;
  description: string;
  due_date: string | null;
  deadline: string | null;
  estimate_minutes: number;
  actual_minutes: number;
  status: string;
  priority: string;
  recurrence: string | null;
  recurrence_rule: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export function getAllTasks(): TaskRow[] {
  return db.prepare("SELECT * FROM tasks").all() as TaskRow[];
}

export function getTaskById(id: string): (TaskRow & { labels: LabelRow[]; subtasks: SubtaskRow[] }) | null {
  const task = rowToObj(
    db.prepare("SELECT * FROM tasks WHERE id = ?").get(id)
  ) as TaskRow | null;

  if (!task) return null;

  // Get labels
  const labels = db.prepare(`
    SELECT l.* FROM task_labels tl
    JOIN labels l ON tl.label_id = l.id
    WHERE tl.task_id = ?
  `).all(id) as LabelRow[];

  // Get subtasks
  const subtasks = db.prepare(`
    SELECT * FROM subtasks WHERE task_id = ? ORDER BY order_index
  `).all(id) as SubtaskRow[];

  return { ...task, labels, subtasks };
}

export function getTasksByListId(listId: string): (TaskRow & { labels: LabelRow[]; subtasks: SubtaskRow[] })[] {
  const tasks = db.prepare("SELECT * FROM tasks WHERE list_id = ? ORDER BY created_at DESC").all(listId) as TaskRow[];
  return tasks.map((task) => {
    const labels = db.prepare(`
      SELECT l.* FROM task_labels tl
      JOIN labels l ON tl.label_id = l.id
      WHERE tl.task_id = ?
    `).all(task.id) as LabelRow[];

    const subtasks = db.prepare(`
      SELECT * FROM subtasks WHERE task_id = ? ORDER BY order_index
    `).all(task.id) as SubtaskRow[];

    return { ...task, labels, subtasks };
  });
}

export function getOverdueTasks(): (TaskRow & { labels: LabelRow[]; subtasks: SubtaskRow[] })[] {
  const now = new Date().toISOString();
  const tasks = db.prepare(`
    SELECT * FROM tasks
    WHERE (deadline IS NOT NULL AND deadline < ?)
    AND status != 'completed'
  `).all(now) as TaskRow[];
  return tasks.map((task) => {
    const labels = db.prepare(`
      SELECT l.* FROM task_labels tl
      JOIN labels l ON tl.label_id = l.id
      WHERE tl.task_id = ?
    `).all(task.id) as LabelRow[];

    const subtasks = db.prepare(`
      SELECT * FROM subtasks WHERE task_id = ? ORDER BY order_index
    `).all(task.id) as SubtaskRow[];

    return { ...task, labels, subtasks };
  });
}

export function getTasksDueToday(): (TaskRow & { labels: LabelRow[]; subtasks: SubtaskRow[] })[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tasks = db.prepare(`
    SELECT * FROM tasks
    WHERE (due_date IS NOT NULL AND due_date >= ? AND due_date < ?)
    OR (deadline IS NOT NULL AND deadline >= ? AND deadline < ?)
  `).all(today.toISOString(), tomorrow.toISOString(), today.toISOString(), tomorrow.toISOString()) as TaskRow[];

  return tasks.map((task) => {
    const labels = db.prepare(`
      SELECT l.* FROM task_labels tl
      JOIN labels l ON tl.label_id = l.id
      WHERE tl.task_id = ?
    `).all(task.id) as LabelRow[];

    const subtasks = db.prepare(`
      SELECT * FROM subtasks WHERE task_id = ? ORDER BY order_index
    `).all(task.id) as SubtaskRow[];

    return { ...task, labels, subtasks };
  });
}

export function getTasksDueInNextDays(days: number): (TaskRow & { labels: LabelRow[]; subtasks: SubtaskRow[] })[] {
  const now = new Date();
  const future = new Date(now);
  future.setDate(future.getDate() + days);
  future.setHours(23, 59, 59, 999);

  const tasks = db.prepare(`
    SELECT * FROM tasks
    WHERE ((due_date IS NOT NULL AND due_date BETWEEN ? AND ?)
    OR (deadline IS NOT NULL AND deadline BETWEEN ? AND ?))
    AND status != 'completed'
    ORDER BY due_date ASC, deadline ASC
  `).all(now.toISOString(), future.toISOString(), now.toISOString(), future.toISOString()) as TaskRow[];

  const uniqueTasks = Array.from(new Map(tasks.map(t => [t.id, t])).values());

  return uniqueTasks.map((task) => {
    const labels = db.prepare(`
      SELECT l.* FROM task_labels tl
      JOIN labels l ON tl.label_id = l.id
      WHERE tl.task_id = ?
    `).all(task.id) as LabelRow[];

    const subtasks = db.prepare(`
      SELECT * FROM subtasks WHERE task_id = ? ORDER BY order_index
    `).all(task.id) as SubtaskRow[];

    return { ...task, labels, subtasks };
  });
}

export function createTask(data: {
  list_id: string;
  title: string;
  description?: string;
  due_date?: Date;
  deadline?: Date;
  estimate_minutes?: number;
  priority?: string;
  recurrence?: string;
  recurrence_rule?: string;
  parent_id?: string;
  label_ids?: string[];
}): TaskRow {
  const id = generateId();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO tasks (
      id, list_id, title, description, due_date, deadline,
      estimate_minutes, priority, recurrence, recurrence_rule, parent_id,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.list_id,
    data.title,
    data.description ?? "",
    data.due_date?.toISOString() ?? null,
    data.deadline?.toISOString() ?? null,
    data.estimate_minutes ?? 0,
    data.priority ?? "none",
    data.recurrence ?? null,
    data.recurrence_rule ?? null,
    data.parent_id ?? null,
    now,
    now
  );

  // Attach labels if provided
  if (data.label_ids && data.label_ids.length > 0) {
    const insertLabel = db.prepare("INSERT INTO task_labels (task_id, label_id) VALUES (?, ?)");
    for (const labelId of data.label_ids) {
      insertLabel.run(id, labelId);
    }
  }

  return db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as TaskRow;
}

export function updateTask(id: string, data: Partial<{
  list_id: string;
  parent_id: string;
  title: string;
  description: string;
  due_date: Date;
  deadline: Date;
  estimate_minutes: number;
  actual_minutes: number;
  status: string;
  priority: string;
  recurrence: string;
  recurrence_rule: string;
}>): TaskRow | null {
   const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as TaskRow | null;
   if (!existing) return null;

   const updates: string[] = [];
   const values: unknown[] = [];

  if (data.list_id !== undefined) {
    updates.push("list_id = ?");
    values.push(data.list_id);
  }
  if (data.parent_id !== undefined) {
    updates.push("parent_id = ?");
    values.push(data.parent_id);
  }
  if (data.title !== undefined) {
    updates.push("title = ?");
    values.push(data.title);
  }
  if (data.description !== undefined) {
    updates.push("description = ?");
    values.push(data.description);
  }
  if (data.due_date !== undefined) {
    updates.push("due_date = ?");
    values.push(data.due_date.toISOString());
  }
  if (data.deadline !== undefined) {
    updates.push("deadline = ?");
    values.push(data.deadline.toISOString());
  }
  if (data.estimate_minutes !== undefined) {
    updates.push("estimate_minutes = ?");
    values.push(data.estimate_minutes);
  }
  if (data.actual_minutes !== undefined) {
    updates.push("actual_minutes = ?");
    values.push(data.actual_minutes);
  }
  if (data.status !== undefined) {
    updates.push("status = ?");
    values.push(data.status);
    if (data.status === "completed") {
      updates.push("completed_at = CURRENT_TIMESTAMP");
    } else {
      updates.push("completed_at = NULL");
    }
  }
  if (data.priority !== undefined) {
    updates.push("priority = ?");
    values.push(data.priority);
  }
  if (data.recurrence !== undefined) {
    updates.push("recurrence = ?");
    values.push(data.recurrence);
  }
  if (data.recurrence_rule !== undefined) {
    updates.push("recurrence_rule = ?");
    values.push(data.recurrence_rule);
  }

  if (updates.length > 0) {
    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);
    db.prepare(`UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`).run(...values);
  }

  return db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as TaskRow;
}

export function deleteTask(id: string): boolean {
  const result = db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  return result.changes > 0;
}

// ==================== LABELS ====================

export interface LabelRow {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  created_at: string;
}

export function getAllLabels(): LabelRow[] {
  return db.prepare("SELECT * FROM labels ORDER BY name").all() as LabelRow[];
}

export function getLabelById(id: string): LabelRow | null {
  return rowToObj(
    db.prepare("SELECT * FROM labels WHERE id = ?").get(id)
  ) as LabelRow | null;
}

export function getLabelByName(name: string): LabelRow | null {
  return rowToObj(
    db.prepare("SELECT * FROM labels WHERE name = ?").get(name)
  ) as LabelRow | null;
}

export function createLabel(data: {
  name: string;
  color: string;
  icon?: string;
}): LabelRow {
  const id = generateId();
  db.prepare(`
    INSERT INTO labels (id, name, color, icon) VALUES (?, ?, ?, ?)
  `).run(id, data.name, data.color, data.icon ?? null);
  return getLabelById(id)!;
}

export function updateLabel(id: string, data: Partial<{
  name: string;
  color: string;
  icon: string;
}>): LabelRow | null {
  const updates: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) {
    updates.push("name = ?");
    values.push(data.name);
  }
  if (data.color !== undefined) {
    updates.push("color = ?");
    values.push(data.color);
  }
  if (data.icon !== undefined) {
    updates.push("icon = ?");
    values.push(data.icon);
  }

  if (updates.length === 0) return getLabelById(id);

  values.push(id);
  db.prepare(`UPDATE labels SET ${updates.join(", ")} WHERE id = ?`).run(...values);
  return getLabelById(id)!;
}

export function deleteLabel(id: string): boolean {
  const result = db.prepare("DELETE FROM labels WHERE id = ?").run(id);
  return result.changes > 0;
}

export function attachLabelToTask(taskId: string, labelId: string) {
  db.prepare("INSERT OR IGNORE INTO task_labels (task_id, label_id) VALUES (?, ?)").run(taskId, labelId);
}

export function detachLabelFromTask(taskId: string, labelId: string) {
  db.prepare("DELETE FROM task_labels WHERE task_id = ? AND label_id = ?").run(taskId, labelId);
}

// ==================== SUBTASKS ====================

export interface SubtaskRow {
  id: string;
  task_id: string;
  title: string;
  completed: number;
  order_index: number;
  created_at: string;
}

export function getSubtasksByTaskId(taskId: string): SubtaskRow[] {
  return db.prepare("SELECT * FROM subtasks WHERE task_id = ? ORDER BY order_index").all(taskId) as SubtaskRow[];
}

export function createSubtask(data: {
  task_id: string;
  title: string;
  order?: number;
}): SubtaskRow {
  const id = generateId();
  const order = data.order ?? (getSubtasksByTaskId(data.task_id).length + 1);
  db.prepare(`
    INSERT INTO subtasks (id, task_id, title, order_index) VALUES (?, ?, ?, ?)
  `).run(id, data.task_id, data.title, order);
  return db.prepare("SELECT * FROM subtasks WHERE id = ?").get(id) as SubtaskRow;
}

export function updateSubtask(id: string, data: Partial<{
  title: string;
  completed: boolean;
  order: number;
}>): SubtaskRow | null {
  const updates: string[] = [];
  const values: unknown[] = [];

  if (data.title !== undefined) {
    updates.push("title = ?");
    values.push(data.title);
  }
  if (data.completed !== undefined) {
    updates.push("completed = ?");
    values.push(data.completed ? 1 : 0);
  }
  if (data.order !== undefined) {
    updates.push("order_index = ?");
    values.push(data.order);
  }

  if (updates.length === 0) return null;

  values.push(id);
  db.prepare(`UPDATE subtasks SET ${updates.join(", ")} WHERE id = ?`).run(...values);
  return db.prepare("SELECT * FROM subtasks WHERE id = ?").get(id) as SubtaskRow;
}

export function deleteSubtask(id: string): boolean {
  const result = db.prepare("DELETE FROM subtasks WHERE id = ?").run(id);
  return result.changes > 0;
}

// ==================== ATTACHMENTS ====================

export interface AttachmentRow {
  id: string;
  task_id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  created_at: string;
}

export function getAttachmentsByTaskId(taskId: string): AttachmentRow[] {
  return db.prepare("SELECT * FROM attachments WHERE task_id = ?").all(taskId) as AttachmentRow[];
}

export function createAttachment(data: {
  task_id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}): AttachmentRow {
  const id = generateId();
  db.prepare(`
    INSERT INTO attachments (id, task_id, name, url, type, size)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, data.task_id, data.name, data.url, data.type, data.size);
  return db.prepare("SELECT * FROM attachments WHERE id = ?").get(id) as AttachmentRow;
}

export function deleteAttachment(id: string): boolean {
  const result = db.prepare("DELETE FROM attachments WHERE id = ?").run(id);
  return result.changes > 0;
}

// ==================== REMINDERS ====================

export interface ReminderRow {
  id: string;
  task_id: string;
  remind_at: string;
  sent: number;
  created_at: string;
}

export function getRemindersByTaskId(taskId: string): ReminderRow[] {
  return db.prepare("SELECT * FROM reminders WHERE task_id = ?").all(taskId) as ReminderRow[];
}

export function getPendingReminders(): ReminderRow[] {
  const now = new Date().toISOString();
  return db.prepare("SELECT * FROM reminders WHERE sent = 0 AND remind_at <= ?").all(now) as ReminderRow[];
}

export function createReminder(data: {
  task_id: string;
  remind_at: Date;
}): ReminderRow {
  const id = generateId();
  db.prepare(`
    INSERT INTO reminders (id, task_id, remind_at) VALUES (?, ?, ?)
  `).run(id, data.task_id, data.remind_at.toISOString());
  return db.prepare("SELECT * FROM reminders WHERE id = ?").get(id) as ReminderRow;
}

export function markReminderSent(id: string): void {
  db.prepare("UPDATE reminders SET sent = 1 WHERE id = ?").run(id);
}

export function deleteReminder(id: string): boolean {
  const result = db.prepare("DELETE FROM reminders WHERE id = ?").run(id);
  return result.changes > 0;
}

// ==================== SEED DATA ====================

export function seedDefaultData() {
  ensureInboxExists();

  const labels = getAllLabels();
  if (labels.length === 0) {
    createLabel({ name: "Work", color: "#ef4444", icon: "💼" });
    createLabel({ name: "Personal", color: "#22c55e", icon: "🏠" });
    createLabel({ name: "Urgent", color: "#f97316", icon: "🚨" });
    createLabel({ name: "Shopping", color: "#06b6d4", icon: "🛒" });
  }

  const lists = getAllLists();
  if (lists.length <= 1) { // only inbox
    createList({ name: "Today", color: "#8b5cf6", icon: "📅", order: 1 });
    createList({ name: "This Week", color: "#ec4899", icon: "📆", order: 2 });
    createList({ name: "Someday", color: "#6b7280", icon: "☁️", order: 3 });
  }
}

seedDefaultData();
