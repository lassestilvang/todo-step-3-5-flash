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
      <div className="text-4xl mb-6">✨</div>
      <h3 className="text-xl font-bold mb-2">
        {isFiltered ? 'No tasks match your filters' : 'You are all caught up!'}
      </h3>
      <p className="text-muted-foreground max-w-sm mb-8">{quote}</p>
      {isFiltered ? (
        <button
          onClick={() => setSearchQuery('')}
          className="text-sm font-semibold text-primary hover:underline"
        >
          Clear filters
        </button>
      ) : (
        <button
          onClick={handleCreateClick}
          className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
        >
          Create New Task
        </button>
      )}
    </motion.div>
  );
}
