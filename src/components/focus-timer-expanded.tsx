import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Coffee, Brain, X, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
  focusTimer: any; // Using any for simplicity here as it's extracted from the existing component
  progress: number;
  activeTask: any;
  formatTime: (s: number) => string;
  onMinimize: () => void;
  onClose: () => void;
  onReset: () => void;
  onToggle: () => void;
  onToggleMode: () => void;
}) {
  return (
    <motion.div
      layout
      className="bg-background/80 backdrop-blur-2xl border border-border/50 rounded-[32px] shadow-2xl overflow-hidden w-[320px]"
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
            <Button variant="ghost" size="icon-xs" onClick={onMinimize} className="rounded-lg">
              <Minimize2 className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={onClose} className="rounded-lg hover:text-destructive">
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-center py-2">
          <div className="text-4xl font-black tabular-nums tracking-tighter mb-1">
            {formatTime(focusTimer.timeLeft)}
          </div>
          {activeTask && (
            <div className="text-[10px] font-bold text-muted-foreground uppercase truncate max-w-[200px]">
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
                "h-full transition-all duration-1000",
                focusTimer.mode === 'work' ? "bg-primary" : "bg-green-500"
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
              className="rounded-2xl h-12 w-24 font-bold shadow-lg shadow-primary/20"
            >
              {focusTimer.isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            </Button>

            <Button variant="outline" size="icon" onClick={onToggleMode} className="rounded-xl h-10 w-10">
              {focusTimer.mode === 'work' ? <Coffee className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
