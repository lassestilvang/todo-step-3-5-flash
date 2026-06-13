import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Coffee, Brain, X, Minimize2, Bell, BellOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FocusTimerState } from '@/store/types';
import type { Task } from '@/types';

export function FocusTimerExpanded({
  focusTimer,
  progress,
  activeTask,
  formatTime,
  onMinimize,
  onClose,
  onReset,
  onToggle,
  onToggleMode,
}: {
  focusTimer: FocusTimerState;
  progress: number;
  activeTask: Task | undefined;
  formatTime: (s: number) => string;
  onMinimize: () => void;
  onClose: () => void;
  onReset: () => void;
  onToggle: () => void;
  onToggleMode: () => void;
}) {
  const isWorkMode = focusTimer.mode === 'work';
  const isNearEnd = focusTimer.timeLeft <= 60 && focusTimer.timeLeft > 0;
  const isComplete = focusTimer.timeLeft === 0;

  return (
    <motion.div
      layout
      className="bg-background/80 backdrop-blur-2xl border border-border/50 rounded-[32px] shadow-2xl overflow-hidden w-[320px]"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <motion.div
              className={cn(
                "p-2 rounded-xl",
                isWorkMode ? "bg-primary/10 text-primary" : "bg-green-500/10 text-green-600"
              )}
              animate={{ scale: isNearEnd ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.5, repeat: isNearEnd ? Infinity : 0 }}
            >
              {isWorkMode ? <Brain className="w-4 h-4" /> : <Coffee className="w-4 h-4" />}
            </motion.div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60 block">
                {isWorkMode ? 'Focus Time' : 'Break Time'}
              </span>
              <div className="text-[10px] text-muted-foreground/60">
                {isWorkMode ? 'Stay focused' : 'Relax & recharge'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-xs" onClick={onMinimize} className="rounded-lg">
              <Minimize2 className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={onClose} className="rounded-lg hover:text-destructive">
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-center py-2">
          <AnimatePresence>
            <motion.div
              key={formatTime(focusTimer.timeLeft)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-4xl font-black tabular-nums tracking-tighter mb-1"
            >
              {formatTime(focusTimer.timeLeft)}
            </motion.div>
          </AnimatePresence>
          {activeTask && (
            <div className="text-[10px] font-bold text-muted-foreground uppercase truncate max-w-[200px] opacity-80">
              Focusing on: {activeTask.title}
            </div>
          )}
        </div>

        <div className="mt-4 space-y-4">
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className={cn(
                "h-full",
                isWorkMode ? "bg-primary" : "bg-green-500"
              )}
            />
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="icon" onClick={onReset} className="rounded-xl h-10 w-10">
              <RotateCcw className="w-4 h-4" />
            </Button>

            <Button
              size="lg"
              onClick={onToggle}
              className={cn(
                "rounded-2xl h-12 w-24 font-bold shadow-lg transition-all",
                isWorkMode
                  ? "shadow-primary/20 hover:shadow-primary/40"
                  : "shadow-green-500/20 hover:shadow-green-500/40"
              )}
            >
              {focusTimer.isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            </Button>

            <Button variant="outline" size="icon" onClick={onToggleMode} className="rounded-xl h-10 w-10">
              {isWorkMode ? <Coffee className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
