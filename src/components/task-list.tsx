'use client';

import { format, isToday, isTomorrow, isThisWeek, isThisYear } from 'date-fns';
import { Plus } from 'lucide-react';
import { useState, useCallback, useRef, useMemo } from 'react';
import React from 'react';

import { INBOX_LIST_ID, DATE_FORMATS, STRINGS } from '@/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';
import type { Task, TaskList } from '@/types';

import { TaskCard } from './task-card';

function QuickAddTask() {
  const addTask = useStore((s) => s.addTask);
  const selectedListId = useStore((s) => s.selectedListId);
  const lists = useStore((s) => s.lists);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const currentList: TaskList | undefined = useMemo(
    () => lists.find((l) => l.id === (selectedListId || INBOX_LIST_ID)),
    [lists, selectedListId]
  );

  const listId = useMemo(
    () => selectedListId || INBOX_LIST_ID,
    [selectedListId]
  );

  const handleSubmit = useCallback(async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    await addTask({ title: trimmed, listId });
    setTitle('');
    inputRef.current?.focus();
  }, [title, addTask, listId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleSubmit();
    }
    if (e.key === 'Escape') {
      setTitle('');
      inputRef.current?.blur();
    }
  };

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
        <Button size="xs" variant="default" onClick={() => { void handleSubmit(); }}>
          Add
        </Button>
      )}
    </div>
  );
}

function TaskGroups({ tasks }: { tasks: Task[] }) {
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
    <div className="space-y-8">
      {Object.entries(grouped).map(([dateLabel, grp]) => (
        <div key={dateLabel} className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-background py-2">
            {dateLabel}
          </h3>
          <div className="space-y-2">
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
  const tasks = useStore((s) => s.getFilteredTasks());
  const searchQuery = useStore((s) => s.searchQuery);
  const selectedListId = useStore((s) => s.selectedListId);

  const isFiltered = !!searchQuery.trim() || !!selectedListId;

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
        <div className="text-6xl">{isFiltered ? '🔍' : '📋'}</div>
        <p className="text-lg">
          {isFiltered ? 'No tasks match your filters' : 'No tasks yet'}
        </p>
        <p className="text-sm">
          {isFiltered
            ? 'Try adjusting your search or filters'
            : 'Create a task to get started!'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <QuickAddTask />
      <TaskGroups tasks={tasks} />
    </div>
  );
}
