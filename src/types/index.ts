export type Priority = "none" | "low" | "medium" | "high";
export type RecurrenceType = "daily" | "weekly" | "weekday" | "monthly" | "yearly" | "custom";
export type TaskStatus = "pending" | "in_progress" | "completed";
export type ViewType = "today" | "week" | "upcoming" | "all";

export interface Label {
  id: string;
  name: string;
  color: string;
  icon?: string;
  createdAt: Date;
}

export interface TaskList {
  id: string;
  name: string;
  color: string;
  icon: string;
  isMagic?: boolean; // true for Inbox
  parentId?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  order: number;
  createdAt: Date;
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: Date;
}

export interface TaskReminder {
  id: string;
  taskId: string;
  remindAt: Date;
  sent: boolean;
  createdAt: Date;
}

export interface TaskChangeLog {
  id: string;
  taskId: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: Date;
  changedBy?: string; // user id in future
}

export interface Task {
  id: string;
  listId: string;
  parentId?: string; // for subtasks

  // Core fields
  title: string;
  description: string;
  dueDate?: Date;
  deadline?: Date;
  estimateMinutes?: number;
  actualMinutes?: number;
  status: TaskStatus;
  priority: Priority;
  recurrence?: RecurrenceType;
  recurrenceRule?: string; // iCal RRULE format for custom recurrence

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;

  // Relations
  labels: Label[];
  subtasks: Subtask[];
  attachments: TaskAttachment[];
  reminders: TaskReminder[];
  changeLogs: TaskChangeLog[];

  // Denormalized list info for UI
  list?: Pick<TaskList, 'name' | 'icon' | 'color'>;
}

export interface TaskFilters {
  view: ViewType;
  listId?: string;
  labelIds?: string[];
  status?: TaskStatus[];
  priority?: Priority[];
  showCompleted?: boolean;
  searchQuery?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  listId: string;
  dueDate?: Date;
  deadline?: Date;
  estimateMinutes?: number;
  priority?: Priority;
  recurrence?: RecurrenceType;
  labelIds?: string[];
  subtasks?: Pick<Subtask, "title">[];
  parentId?: string;
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  id: string;
}

export interface CreateListData {
  name: string;
  color: string;
  icon: string;
  parentId?: string;
}
