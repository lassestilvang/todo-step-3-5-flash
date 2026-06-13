'use client';

import { CheckCircle2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Task } from '@/types';

interface TaskTitleSectionProps {
  selectedTask: Task;
  toggleTaskComplete: (id: string) => Promise<void> | void;
}

export function TaskTitleSection({ selectedTask, toggleTaskComplete }: TaskTitleSectionProps) {
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
              <span className="text-xs font-bold uppercase tracking-wider">Description</span>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedTask.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}