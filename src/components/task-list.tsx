'use client';

import { format, isToday, isTomorrow, isThisWeek, isThisYear } from 'date-fns';
import { Plus } from 'lucide-react';
import { useEffect, useCallback, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { INBOX_LIST_ID, DATE_FORMATS, STRINGS } from '@/constants';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';
import { getFilteredTasks } from '@/store/selectors';
import type { Task, TaskList } from '@/types';

import { TaskCard } from './task-card';

function TaskCardSkeleton() {
  return (
    <div className="w-full rounded-lg border bg-card p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 h-5 w-5 shrink-0 rounded border border-border" />
        <div className="flex-1 min-w-0 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="h-4 flex-1 rounded bg-muted" />
            <div className="h-6 w-6 rounded bg-muted" />
          </div>
          <div className="h-3 w-3/4 rounded bg-muted/60" />
          <div className="flex flex-wrap gap-2">
            <div className="h-5 w-14 rounded-full bg-muted/50" />
            <div className="h-5 w-16 rounded-full bg-muted/50" />
            <div className="h-5 w-10 rounded-full bg-muted/50" />
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted/40" />
        </div>
      </div>
    </div>
  );
}

const QuickAddTask = () => {
  const addTask = useStore((s) => s.addTask);
  const selectedListId = useStore((s) => s.selectedListId);
  const lists = useStore((s) => s.lists);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const currentList: TaskList | undefined = useMemo(
    () => lists.find((l) => l.id === (selectedListId || INBOX_LIST_ID)),
    [lists, selectedListId]
  );

  const listId = useMemo(() => selectedListId || INBOX_LIST_ID, [selectedListId]);

  const handleSubmit = useCallback(async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    await addTask({ title: trimmed, listId });
    setTitle('');
    inputRef.current?.focus();
  }, [title, addTask, listId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        void handleSubmit();
      }
      if (e.key === 'Escape') {
        setTitle('');
        inputRef.current?.blur();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-muted-foreground/30 p-2 hover:border-primary/50 hover:bg-accent/20 transition-colors">
      <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
      <input
        ref={inputRef}
        type="text"
        placeholder={`Add task to ${currentList?.name ?? 'Inbox'}…`}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60'
        )}
      />
      {title.trim() && (
        <Button size="xs" variant="default" onClick={() => void handleSubmit()}>
          Add
        </Button>
      )}
    </div>
  );
};

function TaskGroups({ tasks }: { tasks: Task[] }) {
  const setSelectedTask = useStore((s) => s.setSelectedTask);

  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  const handlePrev = useCallback(() => {
    const current = useStore.getState().selectedTaskId;
    if (!current || taskIds.length === 0) return;
    const idx = taskIds.indexOf(current);
    const nextIdx = idx > 0 ? idx - 1 : taskIds.length - 1;
    setSelectedTask(taskIds[nextIdx]!);
  }, [taskIds, setSelectedTask]);

  const handleNext = useCallback(() => {
    const current = useStore.getState().selectedTaskId;
    if (!current || taskIds.length === 0) return;
    const idx = taskIds.indexOf(current);
    const nextIdx = idx < taskIds.length - 1 ? idx + 1 : 0;
    setSelectedTask(taskIds[nextIdx]!);
  }, [taskIds, setSelectedTask]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || e.target instanceof HTMLInputElement;
      if (isInput) return;
      const isModifier = e.metaKey || e.ctrlKey;

      if (e.key === 'j' && !isModifier) {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'k' && !isModifier) {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleNext, handlePrev]);

  const grouped = useMemo(() => {
    const map: Record<string, Task[]> = {};
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
      if (!map[dateLabel]) map[dateLabel] = [];
      map[dateLabel]!.push(task);
    });
    return map;
  }, [tasks]);

  return (
    <div className="space-y-8" style={{ contentVisibility: 'auto', containIntrinsicHeight: '800px' }}>
      {Object.entries(grouped).map(([dateLabel, grp]) => (
        <div key={dateLabel} className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-background py-2">
            {dateLabel}
            <span className="ml-2 text-xs font-normal opacity-60 tabular-nums">({grp.length})</span>
          </h3>
          <div className="space-y-2" style={{ contentVisibility: 'auto', containIntrinsicHeight: '200px' }}>
            {grp.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TaskList() {
  const tasks = useStore((s) => s.tasks);
  const loading = useStore((s) => s.loading);
  const searchQuery = useStore((s) => s.searchQuery);
  const selectedListId = useStore((s) => s.selectedListId);
  const currentView = useStore((s) => s.currentView);
  const showCompleted = useStore((s) => s.showCompleted);

  const filteredTasks = useMemo(
    () => getFilteredTasks(tasks, currentView, selectedListId, showCompleted, searchQuery),
    [tasks, currentView, selectedListId, showCompleted, searchQuery]
  );

  const isFiltered = !!searchQuery.trim() || !!selectedListId;

  if (loading && filteredTasks.length === 0) {
    return (
      <div className="space-y-2 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <TaskCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (filteredTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
        <div className="text-6xl">{isFiltered ? '🔍' : '📋'}</div>
        <p className="text-lg">{isFiltered ? 'No tasks match your filters' : 'No tasks yet'}</p>
        <p className="text-sm">{isFiltered ? 'Try adjusting your search or filters' : 'Create a task to get started!'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <QuickAddTask />
      <TaskGroups tasks={filteredTasks} />
    </div>
  );
}