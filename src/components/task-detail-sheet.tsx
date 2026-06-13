'use client';

import { format, formatDistanceToNow, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { useMemo, useEffect, useCallback } from 'react';

import { TaskAttachmentsSection } from '@/components/task-attachments-section';
import { TaskDetailHeader } from '@/components/task-detail-header';
import { TaskHistorySection } from '@/components/task-history-section';
import { TaskLabelsSection } from '@/components/task-labels-section';
import { TaskMetaGrid } from '@/components/task-meta-grid';
import { TaskSubtasksSection } from '@/components/task-subtasks-section';
import { TaskTitleSection } from '@/components/task-title-section';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { DATE_FORMATS, STRINGS } from '@/constants';
import { getMagicBreakdownSuggestions } from '@/lib/magic-breakdown';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';
import type { Task } from '@/types';

function ReminderSection({ reminders }: { reminders: Task['reminders'] }) {
  if (!reminders || reminders.length === 0) {
    return (
      <div className="text-xs text-muted-foreground/60">
        No reminders set. Add a due date to enable reminders.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {reminders.map((r) => (
        <div key={r.id} className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg text-xs">
          <span>{format(new Date(r.remindAt), 'MMM d, h:mm a')}</span>
          <span className={cn('w-2 h-2 rounded-full', r.sent ? 'bg-green-500' : 'bg-amber-500')} />
        </div>
      ))}
    </div>
  );
}

export function TaskDetailSheet() {
  const tasks = useStore((s) => s.tasks);
  const selectedTaskId = useStore((s) => s.selectedTaskId);
  const setSelectedTask = useStore((s) => s.setSelectedTask);
  const toggleTaskComplete = useStore((s) => s.toggleTaskComplete);
  const toggleSubtaskFromStore = useStore((s) => s.toggleSubtask);
  const deleteTask = useStore((s) => s.deleteTask);
  const addSubtask = useStore((s) => s.addSubtask);

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId]
  );

  const handleMagicBreakdown = async () => {
    if (!selectedTask) return;
    const suggestions = getMagicBreakdownSuggestions(selectedTask.title);

    for (const sub of suggestions) {
      if (!selectedTask.subtasks.some((s) => s.title === sub)) {
        await addSubtask(selectedTask.id, sub);
      }
    }
  };

  const tasksArray = useMemo(
    () => tasks.filter((t: Task) => t.status !== 'completed' || t.id === selectedTaskId),
    [tasks, selectedTaskId]
  );

  const currentIndex = useMemo(
    () => tasksArray.findIndex((t: Task) => t.id === selectedTaskId),
    [tasksArray, selectedTaskId]
  );

  const prevTask = currentIndex > 0 ? tasksArray[currentIndex - 1] : null;
  const nextTask = currentIndex < tasksArray.length - 1 ? tasksArray[currentIndex + 1] : null;

  const dueLabel = useMemo(() => {
    if (!selectedTask) return null;
    const date = selectedTask.dueDate ?? selectedTask.deadline;
    if (!date) return null;
    if (isToday(date)) return STRINGS.TODAY;
    if (isTomorrow(date)) return STRINGS.TOMORROW;
    if (isThisWeek(date)) return format(date, DATE_FORMATS.FULL_WEEKDAY);
    return format(date, DATE_FORMATS.FULL_DATE);
  }, [selectedTask]);

  const handlePrev = useCallback(() => {
    if (prevTask) setSelectedTask(prevTask.id);
  }, [prevTask, setSelectedTask]);

  const handleNext = useCallback(() => {
    if (nextTask) setSelectedTask(nextTask.id);
  }, [nextTask, setSelectedTask]);

  const handleDelete = useCallback(async () => {
    if (!selectedTask) return;
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask(selectedTask.id);
      setSelectedTask(null);
    }
  }, [selectedTask, deleteTask, setSelectedTask]);

  // Keyboard navigation for task detail sheet
  useEffect(() => {
    /* eslint-disable-next-line complexity */
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (!selectedTaskId) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const isMod = e.metaKey || e.ctrlKey;

      if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
      else if ((e.key === 'Delete' || e.key === 'Backspace') && !isMod) {
        e.preventDefault();
        void handleDelete();
      } else if (e.key === 'Escape') setSelectedTask(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTaskId, handlePrev, handleNext, handleDelete, setSelectedTask]);

  if (!selectedTask) return null;

  return (
    <Sheet
      open={selectedTaskId !== null}
      onOpenChange={(open) => {
        if (!open) setSelectedTask(null);
      }}
    >
      <SheetContent side="right" className="w-full max-w-2xl p-0 border-l-0 shadow-2xl rounded-l-[40px] overflow-hidden">
        <div role="dialog" aria-modal="true" aria-label="Task details" className="flex flex-col h-full bg-background/50 backdrop-blur-3xl">
          <TaskDetailHeader
            currentIndex={currentIndex}
            total={tasksArray.length}
            onPrev={handlePrev}
            onNext={handleNext}
            onClose={() => setSelectedTask(null)}
            onDelete={() => void handleDelete()}
          />
          <ScrollArea className="flex-1">
            <div className="p-8 space-y-10 pb-24">
              <TaskTitleSection
                selectedTask={selectedTask}
                toggleTaskComplete={toggleTaskComplete}
              />

              <TaskMetaGrid selectedTask={selectedTask} dueLabel={dueLabel} />

              <TaskLabelsSection labels={selectedTask.labels} />

              <TaskSubtasksSection
                subtasks={selectedTask.subtasks}
                taskId={selectedTask.id}
                onToggle={(taskId, subtaskId) => {
                  void toggleSubtaskFromStore(taskId, subtaskId);
                }}
                onMagic={() => void handleMagicBreakdown()}
              />

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                  <span>📎</span> Attachments
                </div>
                <TaskAttachmentsSection attachments={selectedTask.attachments} />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                  <span>🔔</span> Reminders
                </div>
                <ReminderSection reminders={selectedTask.reminders} />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                  <span>🕒</span> Activity Log
                </div>
                <TaskHistorySection changeLogs={selectedTask.changeLogs} />
              </div>

              <div className="pt-8 border-t border-border/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex justify-between items-center opacity-40">
                <span>Created {formatDistanceToNow(new Date(selectedTask.createdAt), { addSuffix: true })}</span>
                {selectedTask.updatedAt && (
                  <span>Updated {formatDistanceToNow(new Date(selectedTask.updatedAt), { addSuffix: true })}</span>
                )}
              </div>
            </div>
            <ScrollBar />
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}