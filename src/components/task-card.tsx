'use client';

import { format, isToday, isTomorrow } from 'date-fns';
import { motion } from 'framer-motion';
import { Clock, Flag, Tag, ChevronRight, AlertTriangle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { PRIORITY_COLORS, PRIORITY_LABELS, DATE_FORMATS, STRINGS } from '@/constants';
import { cn, formatDuration } from '@/lib/utils';
import { useStore } from '@/store';
import type { Task, Priority } from '@/types';

interface TaskCardProps {
  task: Task;
}

function TaskCheckbox({
  task,
  toggleTaskComplete,
}: {
  task: Task;
  toggleTaskComplete: (id: string) => Promise<void> | void;
}) {
  return (
    <Checkbox
      checked={task.status === 'completed'}
      onCheckedChange={() => {
        void toggleTaskComplete(task.id);
      }}
      aria-label={task.status === 'completed' ? 'Mark as incomplete' : 'Mark as complete'}
      className={cn(
        'mt-0.5 h-5 w-5 shrink-0',
        task.status === 'completed'
          ? 'bg-primary border-primary text-primary-foreground'
          : 'border-muted-foreground/30 hover:border-primary'
      )}
    />
  );
}

function TaskTitle({ task }: { task: Task }) {
  return (
    <h4
      className={cn(
        'text-sm font-medium leading-tight mb-1',
        task.status === 'completed' && 'line-through text-muted-foreground'
      )}
    >
      {task.title}
    </h4>
  );
}

function TaskDescription({ task }: { task: Task }) {
  if (!task.description) return null;
  return <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{task.description}</p>;
}

function DueDateBadge({ due, isOverdue }: { due: Date | undefined; isOverdue: boolean }) {
  if (!due) return null;
  let label: string;
  if (isToday(due)) label = STRINGS.TODAY;
  else if (isTomorrow(due)) label = STRINGS.TOMORROW;
  else label = format(due, DATE_FORMATS.SHORT_DATE);

  return (
    <Badge variant={isOverdue ? 'destructive' : 'secondary'} className="text-xs">
      <Clock className="mr-1 h-3 w-3" />
      {label}
      {isOverdue && <AlertTriangle className="ml-1 h-3 w-3" />}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  if (priority === 'none') return null;
  return (
    <Badge variant="outline" className={cn('text-xs', PRIORITY_COLORS[priority])}>
      <Flag className="mr-1 h-3 w-3" />
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}

function LabelsList({ labels }: { labels: Task['labels'] }) {
  if (!labels || labels.length === 0) return null;
  return (
    <>
      {labels.map((label) => (
        <Badge
          key={label.id}
          variant="outline"
          className="text-xs"
          style={{ borderColor: label.color, color: label.color }}
        >
          <Tag className="mr-1 h-3 w-3" />
          {label.name}
        </Badge>
      ))}
    </>
  );
}

function SubtasksProgress({ subtasks }: { subtasks: Task['subtasks'] }) {
  if (!subtasks || subtasks.length === 0) return null;
  const completed = subtasks.filter((s) => s.completed).length;
  return (
    <span className="text-muted-foreground">
      {completed}/{subtasks.length} subtasks
    </span>
  );
}

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
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <div className="flex items-center gap-1.5">
        <span className="text-lg">{task.list?.icon}</span>
        <span className="text-muted-foreground">{task.list?.name}</span>
      </div>
      <DueDateBadge due={due} isOverdue={isOverdue} />
      <PriorityBadge priority={task.priority} />
      {(task.estimateMinutes ?? 0) > 0 && (
        <span className="text-muted-foreground">
          <Clock className="inline mr-1 h-3 w-3" />
          {formatDuration(task.estimateMinutes!)}
        </span>
      )}
      <LabelsList labels={task.labels} />
      <SubtasksProgress subtasks={task.subtasks} />
    </div>
  );
}

export function TaskCard({ task }: TaskCardProps) {
  const { toggleTaskComplete, openEditTask, setSelectedTask, selectedTaskId } = useStore();

  const isSelected = selectedTaskId === task.id;
  const due = task.dueDate ?? task.deadline;
  const isOverdue = due ? new Date(due) < new Date() && task.status !== 'completed' : false;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelectedTask(task.id);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      onClick={() => setSelectedTask(task.id)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      className={cn(
        'group relative w-full rounded-lg border bg-card p-4 text-left transition-all hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        task.status === 'completed' && 'opacity-60 bg-muted/30',
        isSelected && 'ring-2 ring-primary',
        isOverdue && 'border-red-500'
      )}
    >
      <div className="flex items-start gap-3">
        <TaskCheckbox task={task} toggleTaskComplete={toggleTaskComplete} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <TaskTitle task={task} />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                openEditTask(task.id);
              }}
              aria-label="Edit task"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <TaskDescription task={task} />
          <TaskMeta task={task} due={due} isOverdue={isOverdue} />
        </div>
      </div>
    </motion.div>
  );
}
