import { Brain } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function FocusTimerMinimized({ onStart }: { onStart: () => void }) {
  return (
    <Button 
      onClick={onStart}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full h-12 px-6 shadow-2xl bg-primary text-primary-foreground font-bold flex items-center gap-2 group hover:scale-105 active:scale-95 transition-all"
    >
      <Brain className="w-5 h-5 group-hover:rotate-12 transition-transform" />
      Start Focus Session
    </Button>
  );
}
