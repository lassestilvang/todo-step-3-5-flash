'use client';

import { format, isToday, isTomorrow } from 'date-fns';
import { motion } from 'framer-motion';
import { Clock, Flag, Tag, ChevronRight, AlertTriangle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn, formatDuration } from '@/lib/utils';
import { useStore } from '@/store';
import type { Task } from '@/types';

interface TaskCardProps {
  task: Task;
}

const priorityColors = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  none: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

const priorityLabels = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  none: 'None',
};

export function TaskCard({ task }: TaskCardProps) {
  const { toggleTaskComplete, openEditTask, setSelectedTask, selectedTaskId } = useStore();

  const isSelected = selectedTaskId === task.id;

  const getDueLabel = () => {
    const date = task.dueDate ?? task.deadline;
    if (!date) return null;
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  const due = task.dueDate ?? task.deadline;
  const isOverdue = due ? new Date(due) < new Date() && task.status !== 'completed' : false;

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      onClick={() => setSelectedTask(task.id)}
      className={cn(
        'group relative w-full rounded-lg border bg-card p-4 text-left transition-all hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        task.status === 'completed' && 'opacity-60 bg-muted/30',
        isSelected && 'ring-2 ring-primary',
        isOverdue && 'border-red-500'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <Checkbox
          checked={task.status === 'completed'}
          onCheckedChange={() => void toggleTaskComplete(task.id)}
          aria-label={task.status === 'completed' ? 'Mark as incomplete' : 'Mark as complete'}
          className={cn(
            'mt-0.5 h-5 w-5 shrink-0',
            task.status === 'completed'
              ? 'bg-primary border-primary text-primary-foreground'
              : 'border-muted-foreground/30 hover:border-primary'
          )}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={cn(
                'text-sm font-medium leading-tight mb-1',
                task.status === 'completed' && 'line-through text-muted-foreground'
              )}
            >
              {task.title}
            </h4>
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

          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{task.description}</p>
          )}

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* List color indicator */}
            <div className="flex items-center gap-1.5">
              <span className="text-lg">{task.list?.icon}</span>
              <span className="text-muted-foreground">{task.list?.name}</span>
            </div>

            {/* Due date */}
            {getDueLabel() && (
              <Badge variant={isOverdue ? 'destructive' : 'secondary'} className="text-xs">
                <Clock className="mr-1 h-3 w-3" />
                {getDueLabel()}
                {isOverdue && <AlertTriangle className="ml-1 h-3 w-3" />}
              </Badge>
            )}

            {/* Priority */}
            {task.priority !== 'none' && (
              <Badge variant="outline" className={cn('text-xs', priorityColors[task.priority])}>
                <Flag className="mr-1 h-3 w-3" />
                {priorityLabels[task.priority]}
              </Badge>
            )}

            {/* Estimate */}
            {(task.estimateMinutes ?? 0) > 0 && (
              <span className="text-muted-foreground">
                <Clock className="inline mr-1 h-3 w-3" />
                {formatDuration(task.estimateMinutes!)}
              </span>
            )}

            {/* Labels */}
            {task.labels?.map((label) => (
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

            {/* Subtasks progress */}
            {task.subtasks && task.subtasks.length > 0 && (
              <span className="text-muted-foreground">
                {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtasks
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
}
