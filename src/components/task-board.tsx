'use client';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useMemo } from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';
import type { Task, TaskStatus } from '@/types';

import { TaskCard } from './task-card';

const statuses: TaskStatus[] = ['pending', 'in_progress', 'completed'];

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'To Do', color: 'text-muted-foreground', bg: 'bg-muted/30' },
  in_progress: { label: 'In Progress', color: 'text-amber-600', bg: 'bg-amber-500/10' },
  completed: { label: 'Done', color: 'text-green-600', bg: 'bg-green-500/10' },
};

const COLUMN_IDS = {
  pending: 'pending-column',
  in_progress: 'in_progress-column',
  completed: 'completed-column',
};

function StatusColumn({
  status,
  tasks,
}: {
  status: TaskStatus;
  tasks: Task[];
}) {
  const config = STATUS_CONFIG[status];

  return (
    <div
      data-column-id={COLUMN_IDS[status]}
      className={cn(
        'flex-shrink-0 w-80 flex flex-col gap-4 rounded-[32px] p-4 transition-all duration-200',
        config.bg
      )}
    >
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-2 h-2 rounded-full',
            status === 'pending' ? 'bg-muted-foreground' : status === 'in_progress' ? 'bg-amber-500' : 'bg-green-500'
          )} />
          <h3 className={cn('text-sm font-black uppercase tracking-widest', config.color)}>
            {config.label}
          </h3>
        </div>
        <span className={cn(
          'text-[10px] font-black px-2 py-0.5 rounded-full',
          'bg-background/50 text-muted-foreground'
        )}>
          {tasks.length}
        </span>
      </div>

      <ScrollArea className="flex-1 rounded-2xl bg-background/30 p-3 border border-border/50">
        <div className="flex flex-col gap-3 min-h-[200px]">
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <SortableTaskCard key={task.id} task={task} />
            ))}
            {tasks.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center mb-3">
                  <span className="text-2xl opacity-40">📋</span>
                </div>
                <p className="text-xs text-muted-foreground/60">Drop tasks here</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}

function SortableTaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task, status: task.status },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'cursor-grab active:cursor-grabbing transition-all',
        isDragging && 'rotate-2 scale-105 shadow-2xl'
      )}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} />
    </div>
  );
}

export function TaskBoard({ tasks }: { tasks: Task[] }) {
  const updateTask = useStore((s) => s.updateTask);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const columns = useMemo(() => {
    const cols: Record<TaskStatus, Task[]> = {
      pending: [],
      in_progress: [],
      completed: [],
    };
    tasks.forEach((t) => cols[t.status].push(t));
    return cols;
  }, [tasks]);

  function handleDragEnd(event: { active: { id: unknown }; over: { id: unknown } | null }) {
    const { active, over } = event;

    if (!over) return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t.id === activeTaskId);
    if (!activeTask) return;

    let newStatus: TaskStatus;
    if (Object.values(COLUMN_IDS).includes(overId as TaskStatus)) {
      newStatus = overId as TaskStatus;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      newStatus = overTask?.status ?? activeTask.status;
    }

    if (newStatus !== activeTask.status) {
      void updateTask(activeTaskId, { status: newStatus });
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 h-[calc(100vh-280px)] overflow-x-auto pb-6 scrollbar-thin">
        {statuses.map((status) => (
          <StatusColumn
            key={status}
            status={status}
            tasks={columns[status]}
          />
        ))}
      </div>
    </DndContext>
  );
}