'use client';

/* eslint-disable max-lines */ 

import {
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isThisWeek,
  } from 'date-fns';
import {
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Flag,
  Repeat,
  Tag,
  AlignLeft,
  History,
  Paperclip,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { useMemo } from 'react';

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
  onDelete,
}: {
  currentIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-border/50 bg-background/50 backdrop-blur-xl sticky top-0 z-10">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl"
          onClick={onPrev}
          disabled={currentIndex <= 0}
          aria-label="Previous task"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="px-3 py-1 bg-muted rounded-full text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {currentIndex + 1} <span className="mx-1 opacity-50">/</span> {total}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl"
          onClick={onNext}
          disabled={currentIndex >= total - 1}
          aria-label="Next task"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onDelete}
          className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
        <Separator orientation="vertical" className="h-4 mx-1" />
        <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl font-bold px-4">
          Close
        </Button>
      </div>
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
    <div className="flex items-start gap-5">
      <button
        onClick={() => {
          void toggleTaskComplete(selectedTask.id);
        }}
        className="mt-1.5 transition-transform active:scale-90"
      >
        {selectedTask.status === 'completed' ? (
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-500/20">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full border-2 border-muted-foreground/30 hover:border-primary transition-colors" />
        )}
      </button>
      <div className="flex-1">
        <h2 className={cn(
          "text-3xl font-black tracking-tight mb-3 transition-all",
          selectedTask.status === 'completed' && "line-through text-muted-foreground/50"
        )}>
          {selectedTask.title}
        </h2>
        {selectedTask.description && (
          <div className="bg-muted/30 rounded-2xl p-4 border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <AlignLeft className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Description</span>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedTask.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskMetaGrid({ selectedTask, dueLabel }: { selectedTask: Task; dueLabel: string | null }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {selectedTask.list && (
        <div className="flex items-center gap-4 p-3 rounded-2xl bg-muted/20 border border-border/50">
          <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-2xl shadow-sm">
            {selectedTask.list.icon}
          </div>
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">List</div>
            <div className="font-bold">{selectedTask.list.name}</div>
          </div>
        </div>
      )}
      <div className="flex items-center gap-4 p-3 rounded-2xl bg-muted/20 border border-border/50">
        <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-muted-foreground shadow-sm">
          <Flag className={cn("h-5 w-5", selectedTask.priority === 'high' ? "text-red-500" : "text-muted-foreground")} />
        </div>
        <div>
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Priority</div>
          <div className="font-bold capitalize">{selectedTask.priority}</div>
        </div>
      </div>
      {dueLabel && (
        <div className="flex items-center gap-4 p-3 rounded-2xl bg-muted/20 border border-border/50">
          <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-primary shadow-sm">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Due Date</div>
            <div className="font-bold">{dueLabel}</div>
            {selectedTask.dueDate && (
              <div className="text-[10px] font-medium text-muted-foreground opacity-70">
                {formatDistanceToNow(selectedTask.dueDate, { addSuffix: true })}
              </div>
            )}
          </div>
        </div>
      )}
      {(selectedTask.estimateMinutes ?? 0) > 0 && (
        <div className="flex items-center gap-4 p-3 rounded-2xl bg-muted/20 border border-border/50">
          <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-muted-foreground shadow-sm">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Estimate</div>
            <div className="font-bold">
              {Math.floor(selectedTask.estimateMinutes! / 60)}h {selectedTask.estimateMinutes! % 60}m
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskLabelsSection({ labels }: { labels: Task['labels'] }) {
  if (!labels || labels.length === 0) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
        <Tag className="h-3.5 w-3.5" /> Labels
      </div>
      <div className="flex flex-wrap gap-2">
        {labels.map((label) => (
          <Badge
            key={label.id}
            variant="outline"
            className="rounded-lg border-2 px-3 py-1"
            style={{ borderColor: `${label.color}40`, color: label.color, backgroundColor: `${label.color}10` }}
          >
            {label.icon && <span className="mr-2">{label.icon}</span>}
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
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
        <CheckCircle2 className="h-3.5 w-3.5" /> Subtasks
      </div>
      <div className="space-y-2">
        {subtasks.map((subtask) => (
          <div key={subtask.id} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/10 hover:bg-muted/20 transition-colors group">
            <button
              onClick={() => {
                void onToggle(taskId, subtask.id);
              }}
              className="transition-transform active:scale-90"
            >
              {subtask.completed ? (
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 group-hover:border-primary transition-colors" />
              )}
            </button>
            <span className={cn(
              "text-sm font-medium transition-all",
              subtask.completed && 'line-through text-muted-foreground/50'
            )}>
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
  const deleteTask = useStore((s) => s.deleteTask);

  const selectedTask = useMemo(() => tasks.find((t) => t.id === selectedTaskId) ?? null, [tasks, selectedTaskId]);

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

  const handlePrev = () => {
    if (prevTask) setSelectedTask(prevTask.id);
  };

  const handleNext = () => {
    if (nextTask) setSelectedTask(nextTask.id);
  };

  const handleDelete = async () => {
    if (!selectedTask) return;
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask(selectedTask.id);
      setSelectedTask(null);
    }
  };

  if (!selectedTask) return null;

  return (
    <Sheet
      open={selectedTaskId !== null}
      onOpenChange={(open) => {
        if (!open) setSelectedTask(null);
      }}
    >
      <SheetContent side="right" className="w-full max-w-2xl p-0 border-l-0 shadow-2xl rounded-l-[40px] overflow-hidden">
        <div className="flex flex-col h-full bg-background/50 backdrop-blur-3xl">
          <TaskDetailHeader
            currentIndex={currentIndex}
            total={tasksArray.length}
            onPrev={handlePrev}
            onNext={handleNext}
            onClose={() => setSelectedTask(null)}
            onDelete={handleDelete}
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
              />
              
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                  <Paperclip className="h-3.5 w-3.5" /> Attachments
                </div>
                <TaskAttachmentsSection attachments={selectedTask.attachments} />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                  <History className="h-3.5 w-3.5" /> Activity Log
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
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}

