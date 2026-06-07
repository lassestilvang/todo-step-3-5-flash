'use client';

import { useEffect, useState, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';
import { FocusTimerMinimized } from './focus-timer-minimized';
import { FocusTimerExpanded } from './focus-timer-expanded';

export function FocusTimer() {
  const { focusTimer, startFocusTimer, pauseFocusTimer, resetFocusTimer, tickFocusTimer, setFocusMode, tasks } = useStore();
  const [isMinimized, setIsMinimized] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (focusTimer.isActive) {
      interval = setInterval(() => {
        tickFocusTimer();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [focusTimer.isActive, tickFocusTimer]);

  const activeTask = useMemo(() => 
    tasks.find(t => t.id === focusTimer.taskId),
    [tasks, focusTimer.taskId]
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = useMemo(() => {
    const total = focusTimer.mode === 'work' ? 25 * 60 : 5 * 60;
    return ((total - focusTimer.timeLeft) / total) * 100;
  }, [focusTimer.timeLeft, focusTimer.mode]);

  if (!focusTimer.isActive && isMinimized && !focusTimer.taskId) {
     return <FocusTimerMinimized onStart={() => setIsMinimized(false)} />;
  }

  return (
    <div className={cn(
      "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500",
      isMinimized ? "w-auto" : "w-[320px]"
    )}>
      {!isMinimized ? (
        <FocusTimerExpanded
          focusTimer={focusTimer}
          progress={progress}
          activeTask={activeTask}
          formatTime={formatTime}
          onMinimize={() => setIsMinimized(true)}
          onClose={() => { pauseFocusTimer(); setIsMinimized(true); }}
          onReset={resetFocusTimer}
          onToggle={focusTimer.isActive ? pauseFocusTimer : () => startFocusTimer()}
          onToggleMode={() => setFocusMode(focusTimer.mode === 'work' ? 'break' : 'work')}
        />
      ) : (
        <Button 
          onClick={() => setIsMinimized(false)}
          className="rounded-full h-12 w-12 shadow-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center transition-all"
        >
          {formatTime(focusTimer.timeLeft)}
        </Button>
      )}
    </div>
  );
}

