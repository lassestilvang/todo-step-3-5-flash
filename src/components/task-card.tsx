'use client';

import { format, isToday, isTomorrow } from 'date-fns';
import { motion } from 'framer-motion';
import { Clock, ChevronRight, AlertTriangle, GripVertical, Play, PauseCircle, Zap, Trash2 } from 'lucide-react';
import React, { useEffect, useRef } from 'react';

import { useToast } from '@/components/toast-provider';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { PRIORITY_LABELS, DATE_FORMATS, STRINGS } from '@/constants';
import { cn, formatDuration } from '@/lib/utils';
import { useStore } from '@/store';
import type { Task, Priority } from '@/types';

interface TaskCardProps {
  task: Task;
}

// Helper components - defined outside to reduce file size
const TaskCheckbox = React.memo(function TaskCheckbox({
  task,
  toggleTaskComplete,
}: { task: Task; toggleTaskComplete: (id: string, status?: Task['status']) => Promise<void> | void; }) {
  const isCompleted = task.status === 'completed';
  const isInProgress = task.status === 'in_progress';
  return (
    <div className="relative flex items-center justify-center">
      <Checkbox
        checked={isCompleted}
        onCheckedChange={() => { void toggleTaskComplete(task.id, isCompleted ? 'pending' : 'completed'); }}
        aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
        className={cn('h-6 w-6 rounded-full border-2 transition-all',
          isCompleted ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20 scale-110' :
          isInProgress ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20' :
          'border-muted-foreground/30 hover:border-primary bg-background')} />
      {isInProgress && (
        <motion.div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
      )}
      {isCompleted && (
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1.5, opacity: 0.3 }}
          className="absolute inset-0 rounded-full bg-green-500" />
      )}
    </div>
  );
});

const TaskTitle = React.memo(function TaskTitle({ task }: { task: Task }) {
  return (
    <h4 className={cn('text-base font-semibold leading-tight transition-all',
      task.status === 'completed' ? 'line-through text-muted-foreground/60' : 'text-foreground',
      task.status === 'in_progress' && 'text-amber-600')}>
      {task.title}
    </h4>
  );
});

function TaskDescription({ task }: { task: Task }) {
  if (!task.description) return null;
  return (
    <p className={cn('text-sm line-clamp-2 mt-1', task.status === 'completed' ? 'text-muted-foreground/40' : 'text-muted-foreground')}>
      {task.description}
    </p>
  );
}

function DueDateBadge({ due, isOverdue }: { due: Date | undefined; isOverdue: boolean }) {
  if (!due) return null;
  const label = isToday(due) ? STRINGS.TODAY : isTomorrow(due) ? STRINGS.TOMORROW : format(due, DATE_FORMATS.SHORT_DATE);
  return (
    <div className={cn('flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase',
      isOverdue ? 'bg-red-500/10 text-red-600 ring-1 ring-red-500/20' : 'bg-primary/10 text-primary ring-1 ring-primary/20')}>
      <Clock className="h-3 w-3" />{label}{isOverdue && <AlertTriangle className="h-3 w-3 animate-pulse" />}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  if (priority === 'none') return null;
  const labels: Record<Priority, string> = { none: '', low: '!', medium: '!!', high: '!!!' };
  const colors = { high: 'bg-red-500 text-white', medium: 'bg-amber-500 text-white', low: 'bg-blue-500 text-white' };
  return <div className={cn('px-2 py-0.5 rounded-full text-[10px] font-black', colors[priority])}>{labels[priority]} {PRIORITY_LABELS[priority]}</div>;
}

function LabelsList({ labels }: { labels: Task['labels'] }) {
  if (!labels?.length) return null;
  return <div className="flex flex-wrap gap-1">{labels.map((l) => (
    <div key={l.id} className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border"
      style={{ borderColor: `${l.color}40`, backgroundColor: `${l.color}10`, color: l.color }}>{l.name}</div>
  ))}</div>;
}

function SubtasksProgress({ subtasks, status }: { subtasks: Task['subtasks']; status: Task['status'] }) {
  if (!subtasks?.length) return null;
  const completed = subtasks.filter(s => s.completed).length;
  const percent = Math.round((completed / subtasks.length) * 100);
  return (
    <div className="flex items-center gap-2 flex-1 max-w-[120px]" aria-label={`Progress: ${completed} of ${subtasks.length}`}>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden" aria-hidden>
        <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }}
          className={cn('h-full rounded-full', status === 'completed' ? 'bg-muted-foreground/30' : 'bg-green-500')} />
      </div>
      <span className="text-[10px] font-bold text-muted-foreground tabular-nums">{completed}/{subtasks.length}</span>
    </div>
  );
}

function TaskMeta({ task, due, isOverdue }: { task: Task; due: Date | undefined; isOverdue: boolean }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-muted/50 text-[10px] font-bold uppercase tracking-tight">
        <span className="text-sm">{task.list?.icon}</span>{task.list?.name}
      </div>
      <DueDateBadge due={due} isOverdue={isOverdue} />
      <PriorityBadge priority={task.priority} />
      {(task.estimateMinutes ?? 0) > 0 && (
        <div className="flex items-center gap-1 text-[10px] font-bold uppercase"><Clock className="h-3 w-3" />{formatDuration(task.estimateMinutes!)}</div>
      )}
      <LabelsList labels={task.labels} />
      <div className="flex-1" />
      <SubtasksProgress subtasks={task.subtasks} status={task.status} />
      {task.subtasks.length > 0 && <span className="text-[10px] font-bold text-muted-foreground/60">{task.subtasks.length} subtask{task.subtasks.length !== 1 ? 's' : ''}</span>}
    </div>
  );
}

function StatusCycleButton({ task, onCycle }: { task: Task; onCycle: (id: string, status: Task['status']) => void }) {
  const nextStatus = task.status === 'pending' ? 'in_progress' : 'completed';
  const statusConfig = {
    pending: { label: 'Start', icon: Play, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    in_progress: { label: 'Complete', icon: PauseCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    completed: { label: 'Reset', icon: Clock, color: 'text-green-500', bg: 'bg-green-500/10' },
  };
  const config = statusConfig[task.status] || statusConfig.pending;

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className={cn(
        'opacity-0 group-hover:opacity-100 transition-all rounded-xl',
        `hover:${config.bg}`,
        `hover:${config.color}`
      )}
      onClick={(e) => { e.stopPropagation(); onCycle(task.id, nextStatus); }}
      title={`Mark as ${nextStatus.replace('_', ' ')}`}
      aria-label={`Mark as ${nextStatus.replace('_', ' ')}`}
    >
      <config.icon className="h-4 w-4" />
    </Button>
  );
}

function DeleteButton({ task, onDelete }: { task: Task; onDelete: (id: string) => void }) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="opacity-0 group-hover:opacity-100 transition-all rounded-xl hover:bg-destructive/10 hover:text-destructive"
      onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
      title="Delete task"
      aria-label="Delete task"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

function computeIsOverdue(dueDate: string | Date | undefined, status: Task['status']): boolean {
  if (!dueDate || status === 'completed') return false;
  return new Date(dueDate) < new Date();
}

export const TaskCard = React.memo(function TaskCard({ task }: TaskCardProps) {
  const { toggleTaskComplete, openEditTask, setSelectedTask, selectedTaskId, startFocusTimer, deleteTask, undoDeleteTask } = useStore();
  const { showToast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);

  const isSelected = selectedTaskId === task.id;
  const due = task.dueDate ?? task.deadline;
  const isOverdue = computeIsOverdue(due, task.status);

  // Focus effect for keyboard navigation - scroll into view when selected
  useEffect(() => {
    if (isSelected && cardRef.current) {
      cardRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [isSelected]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelectedTask(task.id);
    }
    if (e.key === 's' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
      e.preventDefault();
      e.stopPropagation();
      const nextStatus = task.status === 'pending' ? 'in_progress' : 'completed';
      void toggleTaskComplete(task.id, nextStatus);
    }
  };

  const handleDelete = (id: string) => {
    void deleteTask(id);
    showToast('success', 'Task deleted', {
      label: 'Undo',
      onClick: () => undoDeleteTask(id),
    });
  };

  return (
    <motion.div
      ref={cardRef}
      layout
      whileHover={{ y: -2 }}
      onClick={() => setSelectedTask(task.id)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      className={cn(
        'group relative w-full rounded-2xl border bg-card p-5 text-left transition-all duration-300',
        'hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-primary/20',
        'dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]',
        task.status === 'completed' && 'bg-muted/30 opacity-60 grayscale-[0.5]',
        task.status === 'in_progress' && 'border-amber-500/50 bg-amber-500/[0.03]',
        isSelected && 'ring-2 ring-primary ring-offset-4 ring-offset-background z-10',
        isOverdue && 'border-red-500/50 bg-red-500/[0.02]'
      )}
    >
      <div className="flex items-start gap-4">
        <div className="opacity-0 -ml-2 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
          <GripVertical className="h-5 w-5 text-muted-foreground/30" />
        </div>
        <TaskCheckbox task={task} toggleTaskComplete={toggleTaskComplete} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <TaskTitle task={task} />
              <TaskDescription task={task} />
            </div>
            <div className="flex items-center gap-1">
              <StatusCycleButton task={task} onCycle={(id, status) => void toggleTaskComplete(id, status)} />
              <Button
                variant="ghost"
                size="icon-sm"
                className="opacity-0 group-hover:opacity-100 transition-all rounded-xl hover:bg-amber-500/10 hover:text-amber-500"
                onClick={(e) => { e.stopPropagation(); startFocusTimer(task.id); }}
                title="Start Focus Session"
                aria-label="Start focus session for this task"
              >
                <Zap className="h-4 w-4" />
              </Button>
              <DeleteButton task={task} onDelete={handleDelete} />
              <Button
                variant="ghost"
                size="icon-sm"
                className="opacity-0 group-hover:opacity-100 transition-all rounded-xl hover:bg-primary/10 hover:text-primary"
                onClick={(e) => { e.stopPropagation(); openEditTask(task.id); }}
                aria-label="Edit task"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <TaskMeta task={task} due={due} isOverdue={isOverdue} />
        </div>
      </div>
      {isSelected && <motion.div layoutId="focus-ring" className="absolute -inset-[2px] rounded-[18px] border-2 border-primary pointer-events-none" />}
    </motion.div>
  );
});