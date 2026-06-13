'use client';

import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface TaskDetailHeaderProps {
  currentIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  onDelete: () => void;
}

export function TaskDetailHeader({
  currentIndex,
  total,
  onPrev,
  onNext,
  onClose,
  onDelete,
}: TaskDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-border/50 bg-background/50 backdrop-blur-xl sticky top-0 z-10">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl"
          onClick={onPrev}
          disabled={currentIndex <= 0}
          aria-label="Previous task"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="px-3 py-1 bg-muted rounded-full text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {currentIndex + 1} <span className="mx-1 opacity-50">/</span> {total}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl"
          onClick={onNext}
          disabled={currentIndex >= total - 1}
          aria-label="Next task"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
        <Separator orientation="vertical" className="h-4 mx-1" />
        <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl font-bold px-4">
          Close
        </Button>
      </div>
    </div>
  );
}