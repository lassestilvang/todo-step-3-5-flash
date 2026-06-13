'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';

import { useStore } from '@/store';

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
  const animationRef = useRef<number | null>(null);

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
    const total = focusTimer.mode === 'work' ? focusTimer.workDuration : focusTimer.breakDuration;
    return ((total - focusTimer.timeLeft) / total) * 100;
  }, [focusTimer.timeLeft, focusTimer.mode, focusTimer.workDuration, focusTimer.breakDuration]);

  useEffect(() => {
    if (!focusTimer.isActive || focusTimer.timeLeft <= 0) {
      return;
    }

    let lastTick = Date.now();

    const tick = () => {
      const now = Date.now();
      const elapsed = now - lastTick;

      if (elapsed >= 1000) {
        tickFocusTimer();
        lastTick = now;
      }

      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [focusTimer.isActive, focusTimer.timeLeft, tickFocusTimer]);

  const handleStart = useCallback(() => {
    setIsMinimized(false);
    if (!focusTimer.isActive) {
      startFocusTimer();
    }
  }, [focusTimer.isActive, startFocusTimer]);

  const handleClose = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
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

