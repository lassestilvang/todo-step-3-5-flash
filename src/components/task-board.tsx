import { motion, AnimatePresence } from 'framer-motion';
import React, { useMemo } from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus } from '@/types';

import { TaskCard } from './task-card';

export function TaskBoard({ tasks }: { tasks: Task[] }) {
  const statuses: TaskStatus[] = ['pending', 'in_progress', 'completed'];

  const columns = useMemo(() => {
    const cols: Record<TaskStatus, Task[]> = {
      pending: [],
      in_progress: [],
      completed: [],
    };
    tasks.forEach((t) => cols[t.status].push(t));
    return cols;
  }, [tasks]);

  return (
    <div className="flex gap-6 h-[calc(100vh-280px)] overflow-x-auto pb-6 scrollbar-thin">
      {statuses.map((status) => (
        <div key={status} className="flex-shrink-0 w-80 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                status === 'pending' ? "bg-muted-foreground" : status === 'in_progress' ? "bg-primary" : "bg-green-500"
              )} />
              <h3 className="text-sm font-black uppercase tracking-widest opacity-60">
                {status.replace('_', ' ')}
              </h3>
            </div>
            <span className="text-[10px] font-black bg-muted px-2 py-0.5 rounded-full opacity-60">
              {columns[status].length}
            </span>
          </div>

          <ScrollArea className="flex-1 bg-muted/20 rounded-[32px] p-4 border border-border/50">
            <div className="flex flex-col gap-3">
              <AnimatePresence mode="popLayout">
                {columns[status].map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <TaskCard task={task} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>
      ))}
    </div>
  );
}
