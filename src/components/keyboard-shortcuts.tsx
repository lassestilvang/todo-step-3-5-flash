'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X, Command, Search, Plus, SortAsc, CheckSquare } from 'lucide-react';
import { useEffect, useState, useCallback, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { useStore } from '@/store';

interface ShortcutCategory {
  title: string;
  shortcuts: { keys: string[]; label: string; description?: string; icon?: React.ReactNode }[];
}

const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['K'], label: 'Focus search', icon: <Search className="w-3 h-3" /> },
      { keys: ['N'], label: 'Create new task', icon: <Plus className="w-3 h-3" /> },
      { keys: ['⇧', 'J'], label: 'Next task', description: 'Navigate tasks' },
      { keys: ['⇧', 'K'], label: 'Previous task', description: 'Navigate tasks' },
      { keys: ['T'], label: 'Toggle show completed', icon: <CheckSquare className="w-3 h-3" /> },
    ],
  },
  {
    title: 'Task Management',
    shortcuts: [
      { keys: ['S'], label: 'Cycle task status', description: 'When task is focused' },
      { keys: ['⇧', 'S'], label: 'Magic sort tasks', icon: <SortAsc className="w-3 h-3" /> },
      { keys: ['X'], label: 'Delete task', description: 'When task is focused' },
      { keys: ['⌘', 'N'], label: 'Open quick add' },
    ],
  },
  {
    title: 'Focus Timer',
    shortcuts: [
      { keys: ['Space'], label: 'Play/Pause timer', description: 'When timer is open' },
      { keys: ['R'], label: 'Reset timer', description: 'When timer is open' },
    ],
  },
  {
    title: 'System',
    shortcuts: [
      { keys: ['?'], label: 'Show / hide shortcuts' },
      { keys: ['Esc'], label: 'Close modal / Clear search' },
    ],
  },
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
    onMagicSort: () => void;
  }
): boolean => {
  const {
    onToggleShortcuts,
    onClose,
    onCreateTask,
    onFocusSearch,
    onToggleCompleted,
    onMagicSort,
  } = callbacks;

  const handlers = [
    { condition: () => e.key === '?' && !isInput, action: () => { e.preventDefault(); onToggleShortcuts(); } },
    { condition: () => e.key === 'Escape' && !isInput, action: () => onClose() },
    { condition: () => e.key === 'n' && !isInput && !isModdedEvent(e), action: () => { e.preventDefault(); onCreateTask(); } },
    { condition: () => e.key === 'k' && !isInput && !isModdedEvent(e), action: () => { e.preventDefault(); onFocusSearch(); } },
    { condition: () => e.key === 't' && !isInput && !isModdedEvent(e), action: () => { e.preventDefault(); onToggleCompleted(); } },
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
  const modalRef = useRef<HTMLDivElement>(null);
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
        onMagicSort: magicSortTasks,
      });
    },
    [openCreateTask, toggleShowCompleted, magicSortTasks]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Focus management for modal
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      modalRef.current?.focus();
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    // Return focus to the shortcuts button
    setTimeout(() => {
      const triggerButton = document.querySelector('[aria-label="Keyboard shortcuts"]') as HTMLElement | null;
      triggerButton?.focus();
    }, 100);
  }, []);

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
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-background/60 backdrop-blur-md"
            />

            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              tabIndex={-1}
              className="relative w-full max-w-lg bg-background rounded-[32px] border border-border/50 shadow-2xl overflow-hidden focus:outline-none"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                      <Keyboard className="h-6 w-6" />
                    </div>
                    <h2 id="shortcuts-title" className="text-2xl font-black tracking-tight">
                      Keyboard Shortcuts
                    </h2>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-xl">
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="space-y-6 max-h-[60vh] overflow-y-auto scrollbar-thin pr-1">
                  {SHORTCUT_CATEGORIES.map((category) => (
                    <div key={category.title} className="space-y-3">
                      <h3 className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider">
                        {category.title}
                      </h3>
                      <div className="space-y-2">
                        {category.shortcuts.map((shortcut) => (
                          <div
                            key={shortcut.label}
                            className="flex items-center justify-between p-3 rounded-xl bg-muted/30 group hover:bg-muted/50 transition-colors"
                            role="row"
                          >
                            <div className="flex items-center gap-2.5">
                              {shortcut.icon}
                              <div>
                                <div className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                                  {shortcut.label}
                                </div>
                                {shortcut.description && (
                                  <div className="text-xs text-muted-foreground/60 mt-0.5">
                                    {shortcut.description}
                                  </div>
                                )}
                              </div>
                            </div>
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