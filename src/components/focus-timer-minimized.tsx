import { motion } from 'framer-motion';
import { Brain, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function FocusTimerMinimized({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <Button
        onClick={onStart}
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
