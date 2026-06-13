'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X, Command } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { useStore } from '@/store';

const SHORTCUTS = [
  { keys: ['⌘', 'K'], label: 'Open search' },
  { keys: ['N'], label: 'Create new task' },
  { keys: ['⌘', 'S'], label: 'Magic sort tasks' },
  { keys: ['T'], label: 'Toggle show completed' },
  { keys: ['B'], label: 'Toggle sidebar' },
  { keys: ['S'], label: 'Cycle task status' },
  { keys: ['/'], label: 'Focus search' },
  { keys: ['Esc'], label: 'Close modal / Clear search' },
  { keys: ['?'], label: 'Show / hide shortcuts' },
];

function isInputTarget(target: HTMLElement): boolean {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
}

function isModdedEvent(e: KeyboardEvent): boolean {
  return e.metaKey || e.ctrlKey;
}

const handleShortcut = (
  e: KeyboardEvent,
  isInput: boolean,
  callbacks: {
    onToggleShortcuts: () => void;
    onClose: () => void;
    onCreateTask: () => void;
    onFocusSearch: () => void;
    onToggleCompleted: () => void;
    onToggleSidebar: () => void;
    onMagicSort: () => void;
  }
): boolean => {
  const {
    onToggleShortcuts,
    onClose,
    onCreateTask,
    onFocusSearch,
    onToggleCompleted,
    onToggleSidebar,
    onMagicSort,
  } = callbacks;

  const handlers = [
    { condition: () => e.key === '?' && !isInput, action: () => { e.preventDefault(); onToggleShortcuts(); } },
    { condition: () => e.key === 'Escape' && !isInput, action: () => onClose() },
    { condition: () => e.key === 'n' && !isInput, action: () => { e.preventDefault(); onCreateTask(); } },
    { condition: () => !isInput && !isModdedEvent(e) && e.key === 'k', action: () => { e.preventDefault(); onFocusSearch(); } },
    { condition: () => e.key === 't' && !isInput && !isModdedEvent(e), action: () => { e.preventDefault(); onToggleCompleted(); } },
    { condition: () => e.key === 'b' && !isInput && !isModdedEvent(e), action: () => { e.preventDefault(); onToggleSidebar(); } },
    { condition: () => isModdedEvent(e) && e.key === 's', action: () => { e.preventDefault(); onMagicSort(); } },
  ];

  for (const { condition, action } of handlers) {
    if (condition()) {
      action();
      return true;
    }
  }
  return false;
};

export function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);
  const magicSortTasks = useStore((s) => s.magicSortTasks);
  const toggleShowCompleted = useStore((s) => s.toggleShowCompleted);
  const openCreateTask = useStore((s) => s.openCreateTask);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isInput = isInputTarget(e.target as HTMLElement);
      handleShortcut(e, isInput, {
        onToggleShortcuts: () => setIsOpen((prev) => !prev),
        onClose: () => setIsOpen(false),
        onCreateTask: openCreateTask,
        onFocusSearch: () => {
          const el = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement | null;
          el?.focus();
        },
        onToggleCompleted: toggleShowCompleted,
        onToggleSidebar: () => setIsOpen((prev) => !prev),
        onMagicSort: magicSortTasks,
      });
    },
    [openCreateTask, toggleShowCompleted, magicSortTasks]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

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

                <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto scrollbar-thin pr-1">
                  {SHORTCUTS.map((shortcut) => (
                    <div
                      key={shortcut.label}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/30 group hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                        {shortcut.label}
                      </span>
                      <div className="flex gap-1.5">
                        {shortcut.keys.map((key) => (
                          <kbd
                            key={key}
                            className="min-w-[28px] h-7 flex items-center justify-center px-2 rounded-lg bg-background border-2 border-border/50 font-mono text-xs font-black shadow-sm"
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
                    <kbd className="min-w-[20px] h-4 px-1 rounded text-xs font-bold">⇧</kbd> Shortcuts
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