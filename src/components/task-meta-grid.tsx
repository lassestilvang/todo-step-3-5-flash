'use client';

import { formatDistanceToNow } from 'date-fns';
import { Calendar, Clock, Flag } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Task } from '@/types';

interface TaskMetaGridProps {
  selectedTask: Task;
  dueLabel: string | null;
}

export function TaskMetaGrid({ selectedTask, dueLabel }: TaskMetaGridProps) {
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