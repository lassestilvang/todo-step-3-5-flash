'use client';

import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Coffee, Brain, X, Maximize2, Minimize2 } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';
import { FocusTimerMinimized } from './focus-timer-minimized';

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
      <motion.div 
        layout
        className="bg-background/80 backdrop-blur-2xl border border-border/50 rounded-[32px] shadow-2xl overflow-hidden"
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={cn(
                "p-2 rounded-xl transition-colors",
                focusTimer.mode === 'work' ? "bg-primary/10 text-primary" : "bg-green-500/10 text-green-600"
              )}>
                {focusTimer.mode === 'work' ? <Brain className="w-4 h-4" /> : <Coffee className="w-4 h-4" />}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                {focusTimer.mode === 'work' ? 'Focus Time' : 'Break Time'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-xs" onClick={() => setIsMinimized(!isMinimized)} className="rounded-lg">
                {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
              </Button>
              <Button variant="ghost" size="icon-xs" onClick={() => { pauseFocusTimer(); setIsMinimized(true); }} className="rounded-lg hover:text-destructive">
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col items-center py-2">
             <div className="text-4xl font-black tabular-nums tracking-tighter mb-1">
               {formatTime(focusTimer.timeLeft)}
             </div>
             {!isMinimized && activeTask && (
               <div className="text-[10px] font-bold text-muted-foreground uppercase truncate max-w-[200px]">
                 Focusing on: {activeTask.title}
               </div>
             )}
          </div>

          {!isMinimized && (
            <div className="mt-4 space-y-4">
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className={cn(
                    "h-full transition-all duration-1000",
                    focusTimer.mode === 'work' ? "bg-primary" : "bg-green-500"
                  )}
                />
              </div>

              <div className="flex items-center justify-center gap-3">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={resetFocusTimer}
                  className="rounded-xl h-10 w-10"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                
                <Button 
                  size="lg" 
                  onClick={focusTimer.isActive ? pauseFocusTimer : () => startFocusTimer()}
                  className="rounded-2xl h-12 w-24 font-bold shadow-lg shadow-primary/20"
                >
                  {focusTimer.isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                </Button>

                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setFocusMode(focusTimer.mode === 'work' ? 'break' : 'work')}
                  className="rounded-xl h-10 w-10"
                >
                  {focusTimer.mode === 'work' ? <Coffee className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
