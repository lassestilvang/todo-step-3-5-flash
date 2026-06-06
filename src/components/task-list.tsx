'use client';
import { useMemo } from 'react';
import { useStore } from '@/store';
import { getFilteredTasks } from '@/store/selectors';
import { EmptyState } from './empty-state';
import { TaskCardSkeleton } from './task-card-skeleton';
import { QuickAddTask } from './quick-add-task';
import { TaskGroups } from './task-groups';
import { TaskBoard } from './task-board';

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
    return <EmptyState isFiltered={isFiltered} />;
  }

  if (currentView === 'board') {
    return <TaskBoard tasks={filteredTasks} />;
  }

  return (
    <div className="space-y-4 p-4 md:p-0">
      <QuickAddTask />
      <TaskGroups tasks={filteredTasks} />
    </div>
  );
}
