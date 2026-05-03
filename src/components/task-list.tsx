'use client';

import { format, isToday, isTomorrow, isThisWeek, isThisYear } from 'date-fns';

import { TaskCard } from '@/components/task-card';
import { DATE_FORMATS, STRINGS } from '@/constants';
import { useStore } from '@/store';
import type { Task } from '@/types';

export function TaskList() {
  const tasks = useStore((s) => s.getFilteredTasks());

  // Group by date
  const grouped: Record<string, Task[]> = {};
  tasks.forEach((task) => {
    let dateLabel: string = STRINGS.NO_DATE;
    const due = task.dueDate || task.deadline;
    if (due) {
      if (isToday(due)) dateLabel = STRINGS.TODAY;
      else if (isTomorrow(due)) dateLabel = STRINGS.TOMORROW;
      else if (isThisWeek(due)) dateLabel = format(due, DATE_FORMATS.FULL_WEEKDAY);
      else if (isThisYear(due)) dateLabel = format(due, DATE_FORMATS.SHORT_DATE);
      else dateLabel = format(due, DATE_FORMATS.FULL_DATE);
    }
    if (!grouped[dateLabel]) grouped[dateLabel] = [];
    grouped[dateLabel]!.push(task);
  });

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <div className="text-6xl mb-4">📋</div>
        <p className="text-lg">{STRINGS.NO_TASKS_FOUND}</p>
        <p className="text-sm">{STRINGS.CREATE_TASK_TO_GET_STARTED}</p>
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
