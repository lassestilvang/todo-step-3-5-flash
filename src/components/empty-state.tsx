import { motion } from 'framer-motion';
import React, { useMemo } from 'react';

import { QUOTES } from '@/constants/quotes';
import { useStore } from '@/store';

const getRandomQuote = () => QUOTES[Math.floor(Math.random() * QUOTES.length)];

export function EmptyState({ isFiltered }: { isFiltered: boolean }) {
  const openCreateTask = useStore((s) => s.openCreateTask);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const currentView = useStore((s) => s.currentView);

  const handleCreateClick = () => openCreateTask();

  const quote = useMemo(() => getRandomQuote(), []);

  const getTitle = () => {
    if (isFiltered) return 'No tasks match your filters';
    switch (currentView) {
      case 'today': return 'All caught up for today!';
      case 'week': return 'No tasks this week';
      case 'in_progress': return 'No tasks in progress';
      case 'completed': return 'No completed tasks yet';
      default: return 'You are all caught up!';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8"
    >
      <motion.div
        initial={{ scale: 0.8, rotate: -5 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="text-6xl mb-6 relative"
      >
        <span className="relative z-10">✨</span>
        <motion.div
          className="absolute -inset-4 rounded-full bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 blur-xl"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </motion.div>
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
      >
        {getTitle()}
      </motion.h3>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-muted-foreground max-w-sm mb-8 italic"
      >
        &ldquo;{quote}&rdquo;
      </motion.p>
      {isFiltered ? (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => setSearchQuery('')}
          className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
        >
          Clear filters
        </motion.button>
      ) : (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={handleCreateClick}
          className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
        >
          Create New Task
        </motion.button>
      )}
    </motion.div>
  );
}
