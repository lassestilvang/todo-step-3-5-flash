import { format, isToday, isTomorrow, isThisWeek, isThisYear } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useCallback, useEffect, useMemo } from 'react';

import { DATE_FORMATS, STRINGS } from '@/constants';
import { useStore } from '@/store';
import type { Task } from '@/types';

import { TaskCard } from './task-card';

function getDateLabel(due: Date | string | undefined): string {
  if (!due) return STRINGS.NO_DATE;
  const date = new Date(due);
  if (isToday(date)) return STRINGS.TODAY;
  if (isTomorrow(date)) return STRINGS.TOMORROW;
  if (isThisWeek(date)) return format(date, DATE_FORMATS.FULL_WEEKDAY);
  if (isThisYear(date)) return format(date, DATE_FORMATS.SHORT_DATE);
  return format(date, DATE_FORMATS.FULL_DATE);
}

export function TaskGroups({ tasks }: { tasks: Task[] }) {
  const setSelectedTask = useStore((s) => s.setSelectedTask);

  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  const handlePrev = useCallback(() => {
    const current = useStore.getState().selectedTaskId;
    if (!current || taskIds.length === 0) return;
    const idx = taskIds.indexOf(current);
    const nextIdx = idx > 0 ? idx - 1 : taskIds.length - 1;
    setSelectedTask(taskIds[nextIdx]!);
  }, [taskIds, setSelectedTask]);

  const handleNext = useCallback(() => {
    const current = useStore.getState().selectedTaskId;
    if (!current || taskIds.length === 0) return;
    const idx = taskIds.indexOf(current);
    const nextIdx = idx < taskIds.length - 1 ? idx + 1 : 0;
    setSelectedTask(taskIds[nextIdx]!);
  }, [taskIds, setSelectedTask]);

  const handleKeyDown = useCallback((e: KeyboardEvent, handleNext: () => void, handlePrev: () => void) => {
    const tag = document.activeElement?.tagName;
    const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || e.target instanceof HTMLInputElement;
    if (isInput) return;
    const isModifier = e.metaKey || e.ctrlKey;

    if (e.key === 'j' && !isModifier) {
      e.preventDefault();
      handleNext();
    } else if (e.key === 'k' && !isModifier) {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'x' && !isModifier) {
      e.preventDefault();
      const current = useStore.getState().selectedTaskId;
      if (current) {
        void useStore.getState().deleteTask(current);
        useStore.getState().setSelectedTask(null);
      }
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => handleKeyDown(e, handleNext, handlePrev);
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleNext, handlePrev, handleKeyDown]);

  const grouped = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((task) => {
      const dateLabel = getDateLabel(task.dueDate || task.deadline);
      if (!map[dateLabel]) map[dateLabel] = [];
      map[dateLabel]!.push(task);
    });
    return map;
  }, [tasks]);

  return (
    <div className="space-y-8" style={{ contentVisibility: 'auto', containIntrinsicHeight: '800px' }}>
      {Object.entries(grouped).map(([dateLabel, grp]) => (
        <div key={dateLabel} className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-background py-2">
            {dateLabel}
            <span className="ml-2 text-xs font-normal opacity-60 tabular-nums">({grp.length})</span>
          </h3>
          <div className="space-y-2" style={{ contentVisibility: 'auto', containIntrinsicHeight: '200px' }}>
            <AnimatePresence mode="popLayout">
              {grp.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <TaskCard task={task} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ))}
    </div>
  );
}
