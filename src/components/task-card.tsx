'use client';

import { format, isToday, isTomorrow } from 'date-fns';
import { motion } from 'framer-motion';
import { Clock, ChevronRight, AlertTriangle, GripVertical, Brain } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { PRIORITY_LABELS, DATE_FORMATS, STRINGS } from '@/constants';
import { cn, formatDuration } from '@/lib/utils';
import { useStore } from '@/store';
import type { Task, Priority } from '@/types';

interface TaskCardProps {
  task: Task;
}

const TaskCheckbox = React.memo(function TaskCheckbox({
  task,
  toggleTaskComplete,
}: {
  task: Task;
  toggleTaskComplete: (id: string) => Promise<void> | void;
}) {
  return (
    <div className="relative flex items-center justify-center">
      <Checkbox
        checked={task.status === 'completed'}
        onCheckedChange={() => {
          void toggleTaskComplete(task.id);
        }}
        aria-label={task.status === 'completed' ? 'Mark as incomplete' : 'Mark as complete'}
        className={cn(
          'h-6 w-6 rounded-full transition-all duration-300 border-2',
          task.status === 'completed'
            ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20'
            : 'border-muted-foreground/30 hover:border-primary bg-background'
        )}
      />
    </div>
  );
});

const TaskTitle = React.memo(function TaskTitle({ task }: { task: Task }) {
  return (
    <h4
      className={cn(
        'text-base font-semibold leading-tight transition-all duration-300',
        task.status === 'completed' ? 'line-through text-muted-foreground/60' : 'text-foreground'
      )}
    >
      {task.title}
    </h4>
  );
});

function TaskDescription({ task }: { task: Task }) {
  if (!task.description) return null;
  return (
    <p className={cn(
      "text-sm line-clamp-2 mt-1 transition-colors duration-300",
      task.status === 'completed' ? "text-muted-foreground/40" : "text-muted-foreground"
    )}>
      {task.description}
    </p>
  );
}

function DueDateBadge({ due, isOverdue }: { due: Date | undefined; isOverdue: boolean }) {
  if (!due) return null;
  let label: string;
  if (isToday(due)) label = STRINGS.TODAY;
  else if (isTomorrow(due)) label = STRINGS.TOMORROW;
  else label = format(due, DATE_FORMATS.SHORT_DATE);

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase",
      isOverdue ? "bg-red-500/10 text-red-600 ring-1 ring-red-500/20" : "bg-primary/10 text-primary ring-1 ring-primary/20"
    )}>
      <Clock className="h-3 w-3" />
      {label}
      {isOverdue && <AlertTriangle className="h-3 w-3 animate-pulse" />}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  if (priority === 'none') return null;
  const labels: Record<Priority, string> = {
    none: '',
    low: '!',
    medium: '!!',
    high: '!!!',
  };
  
  return (
    <div className={cn(
      "px-2 py-0.5 rounded-full text-[10px] font-black",
      priority === 'high' && "bg-red-500 text-white shadow-lg shadow-red-500/20",
      priority === 'medium' && "bg-amber-500 text-white shadow-lg shadow-amber-500/20",
      priority === 'low' && "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
    )}>
      {labels[priority]} {PRIORITY_LABELS[priority]}
    </div>
  );
}

function LabelsList({ labels }: { labels: Task['labels'] }) {
  if (!labels || labels.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {labels.map((label) => (
        <div
          key={label.id}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border"
          style={{ 
            borderColor: `${label.color}40`, 
            backgroundColor: `${label.color}10`,
            color: label.color 
          }}
        >
          {label.name}
        </div>
      ))}
    </div>
  );
}

const SubtasksProgress = React.memo(function SubtasksProgress({ subtasks, status }: { subtasks: Task['subtasks'], status: Task['status'] }) {
  if (!subtasks || subtasks.length === 0) return null;
  const completed = subtasks.filter((s) => s.completed).length;
  const percent = Math.round((completed / subtasks.length) * 100);
  
  return (
    <div className="flex items-center gap-2 flex-1 max-w-[120px]" aria-label={`Subtask progress: ${completed} of ${subtasks.length}`}>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden" aria-hidden="true">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          className={cn(
            "h-full rounded-full transition-all duration-500",
            status === 'completed' ? "bg-muted-foreground/30" : "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
          )}
        />
      </div>
      <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
        {completed}/{subtasks.length}
      </span>
    </div>
  );
});

function TaskMeta({
  task,
  due,
  isOverdue,
}: {
  task: Task;
  due: Date | undefined;
  isOverdue: boolean;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 py-1 px-2 rounded-lg bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
        <span className="text-sm leading-none">{task.list?.icon}</span>
        {task.list?.name}
      </div>
      
      <DueDateBadge due={due} isOverdue={isOverdue} />
      <PriorityBadge priority={task.priority} />
      
      {(task.estimateMinutes ?? 0) > 0 && (
        <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase">
          <Clock className="h-3 w-3" />
          {formatDuration(task.estimateMinutes!)}
        </div>
      )}
      
      <LabelsList labels={task.labels} />
      <div className="flex-1" />
      <SubtasksProgress subtasks={task.subtasks} status={task.status} />
    </div>
  );
}

function computeIsOverdue(dueDate: string | Date | undefined, status: Task['status']): boolean {
  if (!dueDate || status === 'completed') return false;
  return new Date(dueDate) < new Date();
}

export const TaskCard = React.memo(function TaskCard({ task }: TaskCardProps) {
  const { toggleTaskComplete, openEditTask, setSelectedTask, selectedTaskId, startFocusTimer } = useStore();

  const isSelected = selectedTaskId === task.id;
  const due = task.dueDate ?? task.deadline;
  const isOverdue = computeIsOverdue(due, task.status);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelectedTask(task.id);
    }
  };

  return (
    <motion.div
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
              <Button
                variant="ghost"
                size="icon-sm"
                className="opacity-0 group-hover:opacity-100 transition-all rounded-xl hover:bg-primary/10 hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  startFocusTimer(task.id);
                }}
                title="Start Focus Session"
              >
                <Brain className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon-sm"
                className="opacity-0 group-hover:opacity-100 transition-all rounded-xl hover:bg-primary/10 hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  openEditTask(task.id);
                }}
                aria-label="Edit task"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <TaskMeta task={task} due={due} isOverdue={isOverdue} />
        </div>
      </div>
      
      {isSelected && (
        <motion.div 
          layoutId="focus-ring"
          className="absolute -inset-[2px] rounded-[18px] border-2 border-primary pointer-events-none"
        />
      )}
    </motion.div>
  );
});

