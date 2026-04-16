"use client";

import { useStore } from "@/store";
import { TaskCard } from "@/components/task-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isToday, isTomorrow, isThisWeek, isThisYear } from "date-fns";

export function TaskList() {
  const tasks = useStore((s) => s.getFilteredTasks());

  // Sort tasks: by due date, then by priority
  const sortedTasks = [...tasks].sort((a, b) => {
    // Completed tasks last
    if (a.status === "completed" && b.status !== "completed") return 1;
    if (a.status !== "completed" && b.status === "completed") return -1;

    // By due date
    const aDue = a.dueDate || a.deadline;
    const bDue = b.dueDate || b.deadline;

    if (!aDue && !bDue) return 0;
    if (!aDue) return 1;
    if (!bDue) return -1;

    if (aDue < bDue) return -1;
    if (aDue > bDue) return 1;

    // Then by priority
    const priorityOrder = { high: 0, medium: 1, low: 2, none: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Group by date
  const grouped: Record<string, typeof sortedTasks> = {};
  sortedTasks.forEach((task) => {
    let dateLabel = "No Date";
    const due = task.dueDate || task.deadline;
    if (due) {
      if (isToday(due)) dateLabel = "Today";
      else if (isTomorrow(due)) dateLabel = "Tomorrow";
      else if (isThisWeek(due)) dateLabel = format(due, "EEEE");
      else if (isThisYear(due)) dateLabel = format(due, "MMM d");
      else dateLabel = format(due, "MMM d, yyyy");
    }
    if (!grouped[dateLabel]) grouped[dateLabel] = [];
    grouped[dateLabel].push(task);
  });

  if (sortedTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <div className="text-6xl mb-4">📋</div>
        <p className="text-lg">No tasks found</p>
        <p className="text-sm">Create a task to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([dateLabel, tasks]) => (
        <div key={dateLabel} className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-background py-2">
            {dateLabel}
          </h3>
          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
