'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { useStore } from '@/store';
import { playSound } from '@/lib/sounds';

import { FocusTimerExpanded } from './focus-timer-expanded';
import { FocusTimerMinimized } from './focus-timer-minimized';

export function FocusTimer() {
  const {
    focusTimer,
    startFocusTimer,
    pauseFocusTimer,
    resetFocusTimer,
    tickFocusTimer,
    setFocusMode,
    tasks,
  } = useStore();
  const [isMinimized, setIsMinimized] = useState(true);

  const activeTask = useMemo(
    () => tasks.find((t) => t.id === focusTimer.taskId),
    [tasks, focusTimer.taskId]
  );

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const progress = useMemo(() => {
    const total = focusTimer.mode === 'work' ? 25 * 60 : 5 * 60;
    return ((total - focusTimer.timeLeft) / total) * 100;
  }, [focusTimer.timeLeft, focusTimer.mode]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (focusTimer.isActive && focusTimer.timeLeft > 0) {
      interval = setInterval(() => {
        tickFocusTimer();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [focusTimer.isActive, focusTimer.timeLeft, tickFocusTimer]);

  useEffect(() => {
    if (focusTimer.timeLeft === 0 && focusTimer.isActive) {
      playSound('timer_end');
      try {
        navigator.vibrate([100, 50, 100]);
      } catch {
        // Vibration not supported
      }
    }
  }, [focusTimer.timeLeft, focusTimer.isActive]);

  const handleStart = useCallback(() => {
    setIsMinimized(false);
    if (!focusTimer.isActive) {
      startFocusTimer();
    }
  }, [focusTimer.isActive, startFocusTimer]);

  const handleClose = useCallback(() => {
    pauseFocusTimer();
    setIsMinimized(true);
  }, [pauseFocusTimer]);

  const handleReset = useCallback(() => {
    resetFocusTimer();
  }, [resetFocusTimer]);

  const handleToggle = useCallback(() => {
    if (focusTimer.isActive) {
      pauseFocusTimer();
    } else {
      startFocusTimer();
    }
  }, [focusTimer.isActive, startFocusTimer, pauseFocusTimer]);

  const handleToggleMode = useCallback(() => {
    setFocusMode(focusTimer.mode === 'work' ? 'break' : 'work');
  }, [focusTimer.mode, setFocusMode]);

  if (!focusTimer.isActive && isMinimized && !focusTimer.taskId) {
    return <FocusTimerMinimized onStart={handleStart} />;
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500">
      <FocusTimerExpanded
        focusTimer={focusTimer}
        progress={progress}
        activeTask={activeTask}
        formatTime={formatTime}
        onMinimize={() => setIsMinimized(true)}
        onClose={handleClose}
        onReset={handleReset}
        onToggle={handleToggle}
        onToggleMode={handleToggleMode}
      />
    </div>
  );
}

