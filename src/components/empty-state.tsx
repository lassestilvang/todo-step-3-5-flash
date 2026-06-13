import { motion } from 'framer-motion';
import React, { useMemo } from 'react';

import { QUOTES } from '@/constants/quotes';
import { useStore } from '@/store';

const getRandomQuote = () => QUOTES[Math.floor(Math.random() * QUOTES.length)];

export function EmptyState({ isFiltered }: { isFiltered: boolean }) {
  const openCreateTask = useStore((s) => s.openCreateTask);
  const setSearchQuery = useStore((s) => s.setSearchQuery);

  const handleCreateClick = () => openCreateTask();

  const quote = useMemo(() => getRandomQuote(), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="text-4xl mb-6"
      >
        ✨
      </motion.div>
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl font-bold mb-2"
      >
        {isFiltered ? 'No tasks match your filters' : 'You are all caught up!'}
      </motion.h3>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-muted-foreground max-w-sm mb-8"
      >
        {quote}
      </motion.p>
      {isFiltered ? (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => setSearchQuery('')}
          className="text-sm font-semibold text-primary hover:underline"
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
