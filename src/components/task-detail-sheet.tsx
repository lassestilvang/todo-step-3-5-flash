'use client';

import { format, formatDistanceToNow, isToday, isTomorrow, isThisWeek } from 'date-fns';
import {
  Clock,
  Flag,
  Calendar,
  Tag,
  Repeat,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { DATE_FORMATS, STRINGS } from '@/constants';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';
import type { Task } from '@/types';

import { TaskAttachmentsSection } from './task-attachments-section';
import { TaskHistorySection } from './task-history-section';

function TaskDetailHeader({
  currentIndex,
  total,
  onPrev,
  onNext,
  onClose,
}: {
  currentIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onPrev} disabled={currentIndex <= 0}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} of {total}
        </span>
        <Button variant="ghost" size="icon" onClick={onNext} disabled={currentIndex >= total - 1}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <Button variant="ghost" size="sm" onClick={onClose}>
        Close
      </Button>
    </div>
  );
}

function TaskTitleSection({
  selectedTask,
  toggleTaskComplete,
}: {
  selectedTask: Task;
  toggleTaskComplete: (id: string) => Promise<void> | void;
}) {
  return (
    <div className="flex items-start gap-4">
      <button
        onClick={() => {
          void toggleTaskComplete(selectedTask.id);
        }}
        className="mt-1"
      >
        {selectedTask.status === 'completed' ? (
          <CheckCircle className="h-6 w-6 text-green-500" />
        ) : (
          <Circle className="h-6 w-6 text-muted-foreground" />
        )}
      </button>
      <div className="flex-1">
        <h2 className="text-2xl font-semibold mb-2">{selectedTask.title}</h2>
        {selectedTask.description && (
          <p className="text-muted-foreground whitespace-pre-wrap">{selectedTask.description}</p>
        )}
      </div>
    </div>
  );
}

function TaskMetaGrid({ selectedTask, dueLabel }: { selectedTask: Task; dueLabel: string | null }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {selectedTask.list && (
        <div className="flex items-center gap-2">
          <span className="text-2xl">{selectedTask.list.icon}</span>
          <div>
            <div className="text-xs text-muted-foreground">List</div>
            <div className="font-medium">{selectedTask.list.name}</div>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Flag className="h-5 w-5 text-muted-foreground" />
        <div>
          <div className="text-xs text-muted-foreground">Priority</div>
          <div className="font-medium capitalize">{selectedTask.priority}</div>
        </div>
      </div>
      {dueLabel && (
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">Due</div>
            <div className="font-medium">{dueLabel}</div>
            {selectedTask.dueDate && (
              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(selectedTask.dueDate, { addSuffix: true })}
              </div>
            )}
          </div>
        </div>
      )}
      {selectedTask.estimateMinutes && selectedTask.estimateMinutes > 0 && (
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">Estimate</div>
            <div className="font-medium">
              {Math.floor(selectedTask.estimateMinutes / 60)}h {selectedTask.estimateMinutes % 60}m
            </div>
          </div>
        </div>
      )}
      {selectedTask.actualMinutes && selectedTask.actualMinutes > 0 && (
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">Actual</div>
            <div className="font-medium">
              {Math.floor(selectedTask.actualMinutes / 60)}h {selectedTask.actualMinutes % 60}m
            </div>
          </div>
        </div>
      )}
      {selectedTask.recurrence && (
        <div className="flex items-center gap-2">
          <Repeat className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">Repeats</div>
            <div className="font-medium capitalize">{selectedTask.recurrence}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskLabelsSection({ labels }: { labels: Task['labels'] }) {
  if (!labels || labels.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Tag className="h-4 w-4" /> Labels
      </div>
      <div className="flex flex-wrap gap-2">
        {labels.map((label) => (
          <Badge
            key={label.id}
            variant="outline"
            style={{ borderColor: label.color, color: label.color }}
          >
            {label.icon && <span className="mr-1">{label.icon}</span>}
            {label.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function TaskSubtasksSection({
  subtasks,
  taskId,
  onToggle,
}: {
  subtasks: Task['subtasks'];
  taskId: string;
  onToggle: (taskId: string, subtaskId: string) => void;
}) {
  if (!subtasks || subtasks.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <CheckCircle className="h-4 w-4" /> Subtasks
      </div>
      <div className="space-y-2">
        {subtasks.map((subtask) => (
          <div key={subtask.id} className="flex items-center gap-2 text-sm">
            <button
              onClick={() => {
                void onToggle(taskId, subtask.id);
              }}
            >
              {subtask.completed ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            <span className={cn(subtask.completed && 'line-through text-muted-foreground')}>
              {subtask.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TaskDetailSheet() {
  const tasks = useStore((s) => s.tasks);
  const selectedTaskId = useStore((s) => s.selectedTaskId);
  const setSelectedTask = useStore((s) => s.setSelectedTask);
  const toggleTaskComplete = useStore((s) => s.toggleTaskComplete);
  const toggleSubtaskFromStore = useStore((s) => s.toggleSubtask);

  const selectedTask = useMemo(() => tasks.find((t) => t.id === selectedTaskId) ?? null, [tasks, selectedTaskId]);
  if (!selectedTask) return null;

  // Derived values — only recompute when inputs change
  const tasksArray = useMemo(
    () => tasks.filter((t) => t.status !== 'completed' || t.id === selectedTaskId),
    [tasks, selectedTaskId]
  );
  const currentIndex = useMemo(
    () => tasksArray.findIndex((t) => t.id === selectedTaskId),
    [tasksArray, selectedTaskId]
  );
  const prevTask = currentIndex > 0 ? tasksArray[currentIndex - 1] : null;
  const nextTask = currentIndex < tasksArray.length - 1 ? tasksArray[currentIndex + 1] : null;

  const dueLabel = useMemo(() => {
    const date = selectedTask.dueDate ?? selectedTask.deadline;
    if (!date) return null;
    if (isToday(date)) return STRINGS.TODAY;
    if (isTomorrow(date)) return STRINGS.TOMORROW;
    if (isThisWeek(date)) return format(date, DATE_FORMATS.FULL_WEEKDAY);
    return format(date, DATE_FORMATS.FULL_DATE);
  }, [selectedTask.dueDate, selectedTask.deadline]);

  const handlePrev = () => {
    if (prevTask) setSelectedTask(prevTask.id);
  };

  const handleNext = () => {
    if (nextTask) setSelectedTask(nextTask.id);
  };

  return (
    <Sheet
      open={selectedTaskId !== null}
      onOpenChange={(open) => {
        if (!open) setSelectedTask(null);
      }}
    >
      <SheetContent side="right" className="w-full max-w-xl p-0">
        <div className="flex flex-col h-full">
          <TaskDetailHeader
            currentIndex={currentIndex}
            total={tasksArray.length}
            onPrev={handlePrev}
            onNext={handleNext}
            onClose={() => setSelectedTask(null)}
          />
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              <TaskTitleSection
                selectedTask={selectedTask}
                toggleTaskComplete={toggleTaskComplete}
              />
              <Separator />
              <TaskMetaGrid selectedTask={selectedTask} dueLabel={dueLabel} />
              <TaskLabelsSection labels={selectedTask.labels} />
              <TaskSubtasksSection
                subtasks={selectedTask.subtasks}
                taskId={selectedTask.id}
                onToggle={(taskId, subtaskId) => {
                  void toggleSubtaskFromStore(taskId, subtaskId);
                }}
              />
              <TaskAttachmentsSection attachments={selectedTask.attachments} />
              <Separator />
              <TaskHistorySection changeLogs={selectedTask.changeLogs} />
              <div className="text-xs text-muted-foreground pt-4 border-t">
                Created {formatDistanceToNow(new Date(selectedTask.createdAt), { addSuffix: true })}
                {selectedTask.updatedAt &&
                  selectedTask.updatedAt.getTime() !== selectedTask.createdAt.getTime() && (
                    <>
                      {' · Updated '}
                      {formatDistanceToNow(new Date(selectedTask.updatedAt), { addSuffix: true })}
                    </>
                  )}
              </div>
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
