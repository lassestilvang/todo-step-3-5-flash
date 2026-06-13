'use client';

import { CheckCircle2, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';

interface TaskSubtasksSectionProps {
  subtasks: Task['subtasks'];
  taskId: string;
  onToggle: (taskId: string, subtaskId: string) => void;
  onMagic: () => void;
}

export function TaskSubtasksSection({ subtasks, taskId, onToggle, onMagic }: TaskSubtasksSectionProps) {
  if (!subtasks) return null;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
          <CheckCircle2 className="h-3.5 w-3.5" /> Subtasks
        </div>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => void onMagic()}
          className="h-7 px-3 rounded-lg text-primary hover:bg-primary/10 font-bold flex items-center gap-2"
        >
          <Sparkles className="h-3 w-3" />
          Magic Breakdown
        </Button>
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