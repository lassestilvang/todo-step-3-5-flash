'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X, Command, Shift, ArrowDown, ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

const SHORTCUTS = [
  { keys: ['⌘', 'K'], label: 'Open search' },
  { keys: ['N'], label: 'Create new task' },
  { keys: ['J'], label: 'Next task in list' },
  { keys: ['K'], label: 'Previous task in list' },
  { keys: ['Esc'], label: 'Close modal / Clear search' },
  { keys: ['?'], label: 'Show / hide shortcuts' },
];

export function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl h-12 w-12 hover:scale-110 active:scale-95 transition-all hidden md:flex"
        aria-label="Keyboard shortcuts"
      >
        <Keyboard className="h-5 w-5" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-background/60 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-background rounded-[32px] border border-border/50 shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                      <Keyboard className="h-6 w-6" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">Keyboard Shortcuts</h2>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-xl">
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {SHORTCUTS.map((shortcut) => (
                    <div key={shortcut.label} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 group hover:bg-muted/50 transition-colors">
                      <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">{shortcut.label}</span>
                      <div className="flex gap-1.5">
                        {shortcut.keys.map((key) => (
                          <kbd
                            key={key}
                            className="min-w-[32px] h-8 flex items-center justify-center px-2 rounded-lg bg-background border-2 border-border/50 font-mono text-xs font-black shadow-sm"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-border/50 flex items-center justify-center gap-6">
                   <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                     <Command className="w-3 h-3" /> System Wide
                   </div>
                   <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                     <Shift className="w-3 h-3" /> Shortcuts
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
