import type { Task, ViewType } from '@/types';

export function computeOverdue(tasks: Task[]): number {
  const now = new Date();
  return tasks.filter((t) => {
    if (t.status === 'completed') return false;
    const due = t.deadline || t.dueDate;
    return due ? new Date(due) < now : false;
  }).length;
}

export function taskMatchesView(task: Task, view: ViewType): boolean {
  if (view === 'all') return true;
  if (!task.dueDate && !task.deadline) return false;

  const due = task.dueDate || task.deadline!;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const weekLater = new Date(todayStart);
  weekLater.setDate(weekLater.getDate() + 7);

  switch (view) {
    case 'today':
      return due >= todayStart && due < tomorrowStart;
    case 'week':
      return due >= todayStart && due <= weekLater;
    case 'upcoming':
      return due > now;
    default:
      return true;
  }
}

export function getFilteredTasks(
  tasks: Task[],
  currentView: ViewType,
  selectedListId: string | null,
  showCompleted: boolean,
  searchQuery: string
): Task[] {
  let result = tasks;

  if (selectedListId) {
    result = filterByList(result, selectedListId);
  } else {
    result = filterByView(result, currentView);
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
  return [...tasks].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    const aDue = a.dueDate || a.deadline;
    const bDue = b.dueDate || b.deadline;
    if (!aDue && !bDue) return 0;
    if (!aDue) return 1;
    if (!bDue) return -1;
    if (aDue < bDue) return -1;
    if (aDue > bDue) return 1;
    const priorityOrder = { high: 0, medium: 1, low: 2, none: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}
