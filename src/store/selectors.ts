import type { Task, ViewType } from '@/types';

export function computeOverdue(tasks: Task[]): number {
  const now = new Date();
  return tasks.filter((t) => {
    if (t.status === 'completed') return false;
    const due = t.deadline || t.dueDate;
    return due ? new Date(due) < now : false;
  }).length;
}

function matchesDateRange(due: Date, start: Date, end: Date): boolean {
  return due >= start && due <= end;
}

function getTodayRange(): { start: Date; end: Date } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 86400000);
  return { start, end };
}

function getWeekRange(): { start: Date; end: Date } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 604800000);
  return { start, end };
}

export function taskMatchesView(task: Task, view: ViewType): boolean {
  if (view === 'all') return true;
  if (view === 'in_progress') return task.status === 'in_progress';

  const dueDate = task.dueDate ?? task.deadline;
  if (!dueDate) return false;
  const due = dueDate instanceof Date ? dueDate : new Date(dueDate);
  const now = new Date();

  if (view === 'today') {
    const { start, end } = getTodayRange();
    return matchesDateRange(due, start, end);
  }
  if (view === 'week') {
    const { start, end } = getWeekRange();
    return matchesDateRange(due, start, end);
  }
  if (view === 'upcoming') return due > now;
  return true;
}

export function getFilteredTasks(
  tasks: Task[],
  currentView: ViewType,
  selectedListId: string | null,
  statusFilter: Task['status'] | null,
  showCompleted: boolean,
  searchQuery: string
): Task[] {
  let result = tasks;

  if (selectedListId) {
    result = filterByList(result, selectedListId);
  } else {
    result = filterByView(result, currentView);
  }

  if (statusFilter) {
    result = filterByStatus(result, statusFilter);
  }

  result = filterByCompletion(result, showCompleted);
  result = filterBySearch(result, searchQuery);
  result = sortTasks(result);

  return result;
}

function filterByList(tasks: Task[], listId: string): Task[] {
  return tasks.filter((t) => t.listId === listId);
}

function filterByView(tasks: Task[], view: ViewType): Task[] {
  return tasks.filter((t) => taskMatchesView(t, view));
}

function filterByStatus(tasks: Task[], status: Task['status']): Task[] {
  return tasks.filter((t) => t.status === status);
}

function filterByCompletion(tasks: Task[], show: boolean): Task[] {
  if (show) return tasks;
  return tasks.filter((t) => t.status !== 'completed');
}

function filterBySearch(tasks: Task[], query: string): Task[] {
  const q = query.trim();
  if (!q) return tasks;
  const lower = q.toLowerCase();
  return tasks.filter(
    (t) => t.title.toLowerCase().includes(lower) || t.description.toLowerCase().includes(lower)
  );
}

function sortTasks(tasks: Task[]): Task[] {
  const priorityOrder: Record<Task['priority'], number> = { high: 0, medium: 1, low: 2, none: 3 };
  return [...tasks].sort((a, b) => {
    const aCompleted = Number(a.status === 'completed');
    const bCompleted = Number(b.status === 'completed');
    if (aCompleted !== bCompleted) return aCompleted - bCompleted;

    const aDue = a.dueDate || a.deadline;
    const bDue = b.dueDate || b.deadline;
    const aTime = aDue ? new Date(aDue).getTime() : Infinity;
    const bTime = bDue ? new Date(bDue).getTime() : Infinity;
    if (aTime !== bTime) return aTime - bTime;

    const aPri = priorityOrder[a.priority] ?? 3;
    const bPri = priorityOrder[b.priority] ?? 3;
    return aPri - bPri;
  });
}
