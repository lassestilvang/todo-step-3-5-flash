'use client';
import { useEffect, useMemo, useRef } from 'react';

import { useStore } from '@/store';
import { getFilteredTasks } from '@/store/selectors';

import { EmptyState } from './empty-state';
import { QuickAddTask } from './quick-add-task';
import { TaskBoard } from './task-board';
import { TaskCardSkeleton } from './task-card-skeleton';
import { TaskGroups } from './task-groups';

export function TaskList() {
  const tasks = useStore((s) => s.tasks);
  const loading = useStore((s) => s.loading);
  const searchQuery = useStore((s) => s.searchQuery);
  const selectedListId = useStore((s) => s.selectedListId);
  const currentView = useStore((s) => s.currentView);
  const statusFilter = useStore((s) => s.statusFilter);
  const showCompleted = useStore((s) => s.showCompleted);
  const navigateTask = useStore((s) => s.navigateTask);

  const containerRef = useRef<HTMLDivElement>(null);

  const filteredTasks = useMemo(
    () => getFilteredTasks(tasks, currentView, selectedListId, statusFilter, showCompleted, searchQuery),
    [tasks, currentView, selectedListId, statusFilter, showCompleted, searchQuery]
  );

  const isFiltered = !!searchQuery.trim() || !!selectedListId || !!statusFilter;

  // Keyboard navigation for task list
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle when not in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Only handle when task list is visible (not in board/statistics view)
      if (currentView === 'board' || currentView === 'statistics') return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateTask('next');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateTask('previous');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, navigateTask]);

  if (loading && filteredTasks.length === 0) {
    return (
      <div className="space-y-2">
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
    <div className="space-y-4 p-4 md:p-0" ref={containerRef}>
      <QuickAddTask />
      <TaskGroups tasks={filteredTasks} />
    </div>
  );
}
