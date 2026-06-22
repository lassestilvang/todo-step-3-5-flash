'use client';

import { motion } from 'framer-motion';
import { Brain, Coffee, Play, Pause, Maximize2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FocusTimerState } from '@/store/types';
import type { Task } from '@/types';

interface FocusTimerMinimizedProps {
  focusTimer: FocusTimerState;
  activeTask?: Task;
  formatTime: (s: number) => string;
  onMaximize: () => void;
  onToggle: () => void;
}

export function FocusTimerMinimized({
  focusTimer,
  activeTask,
  formatTime,
  onMaximize,
  onToggle,
}: FocusTimerMinimizedProps) {
  const isWorkMode = focusTimer.mode === 'work';

  // If timer is not active and no task is selected, show the default "Start Focus Session" call to action
  if (!focusTimer.isActive && !focusTimer.taskId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
      >
        <Button
          onClick={onMaximize}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full h-12 px-6 shadow-2xl bg-primary text-primary-foreground font-bold flex items-center gap-2 group hover:scale-105 active:scale-95 transition-all"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Brain className="w-5 h-5" />
          </motion.div>
          Start Focus Session
        </Button>
      </motion.div>
    );
  }

  // Otherwise, show a beautiful, glassmorphic compact status pill
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2 bg-background/80 backdrop-blur-xl border border-border/50 rounded-full shadow-2xl hover:border-primary/30 transition-all select-none"
    >
      <div className="flex items-center gap-2">
        <motion.div
          animate={focusTimer.isActive ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
          className={cn(
            'p-1.5 rounded-full',
            isWorkMode ? 'bg-primary/10 text-primary' : 'bg-green-500/10 text-green-600'
          )}
        >
          {isWorkMode ? <Brain className="w-3.5 h-3.5" /> : <Coffee className="w-3.5 h-3.5" />}
        </motion.div>
        
        <span className="text-sm font-black tabular-nums tracking-tight">
          {formatTime(focusTimer.timeLeft)}
        </span>
        
        {activeTask && (
          <span className="hidden sm:inline text-[10px] font-bold text-muted-foreground uppercase tracking-wider max-w-[100px] truncate">
            • {activeTask.title}
          </span>
        )}
      </div>

      <div className="h-4 w-px bg-border/60" />

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onToggle}
          className="rounded-lg h-7 w-7 hover:bg-muted/80"
          aria-label={focusTimer.isActive ? 'Pause' : 'Start'}
        >
          {focusTimer.isActive ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onMaximize}
          className="rounded-lg h-7 w-7 hover:bg-muted/80"
          aria-label="Maximize timer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}
