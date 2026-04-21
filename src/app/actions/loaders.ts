import {
  db,
  getAllLists,
  getAllLabels,
  getAllTasks,
  getOverdueTasks,
  getTaskById,
  getListById,
} from "@/lib/db";
import type { Task, TaskList, Label, ViewType } from "@/types";
import type { TaskRow, SubtaskRow, LabelRow } from "@/lib/db";
import { toTask, toList, toLabel } from "./_helpers";

export async function loadAppData(_params: {
  view: ViewType;
  selectedListId?: string | null;
  showCompleted: boolean;
  searchQuery: string;
}) {
  const rawLists = getAllLists();
  const rawLabels = getAllLabels();
  const rawTasks = getAllTasks();

  const lists: TaskList[] = rawLists.map(toList);
  const labels: Label[] = rawLabels.map(toLabel);

  // Batch build label map
  const labelMap: Record<string, Label[]> = {};
  if (rawLabels.length > 0) {
    const placeholders = rawLabels.map(() => "?").join(",");
    const taskLabels = db.prepare(`
      SELECT tl.task_id, l.id, l.name, l.color, l.icon, l.created_at
      FROM task_labels tl
      JOIN labels l ON tl.label_id = l.id
      WHERE l.id IN (${placeholders})
    `).all(...rawLabels.map((l) => l.id)) as Array<{
      task_id: string;
      id: string;
      name: string;
      color: string;
      icon: string | null;
      created_at: string;
    }>;

    for (const tl of taskLabels) {
      if (!labelMap[tl.task_id]) labelMap[tl.task_id] = [];
      labelMap[tl.task_id].push(toLabel(tl));
    }
  }

  // Batch build subtasks map
  const taskIds = rawTasks.map((t) => t.id);
  const subtasksMap: Record<string, SubtaskRow[]> = {};
  if (taskIds.length > 0) {
    const placeholders = taskIds.map(() => "?").join(",");
    const subtasks = db.prepare(`
      SELECT * FROM subtasks WHERE task_id IN (${placeholders}) ORDER BY task_id, order_index
    `).all(...taskIds) as SubtaskRow[];
    for (const st of subtasks) {
      if (!subtasksMap[st.task_id]) subtasksMap[st.task_id] = [];
      subtasksMap[st.task_id].push(st);
    }
  }

  // Build tasks with relations
  const tasks = rawTasks.map((row): Task => {
    const taskLabels = labelMap[row.id] || [];
    const taskSubtasks = subtasksMap[row.id] || [];
    return toTask({
      ...row,
      labels: taskLabels as unknown as any,
      subtasks: taskSubtasks as unknown as any,
    });
  });

  const overdue = getOverdueTasks().length;

  return { tasks, lists, labels, overdueCount: overdue };
}
