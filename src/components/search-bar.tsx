'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Fuse from 'fuse.js';
import { Search } from 'lucide-react';
import { useState, useEffect, useMemo, useCallback } from 'react';

import { Input } from '@/components/ui/input';
import { DEBOUNCE_DELAY_MS } from '@/constants';
import { debounce } from '@/lib/utils';
import { useStore } from '@/store';

export function SearchBar() {
  const { tasks, searchQuery, setSearchQuery, setSelectedTask } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Prepare searchable data
  const searchableTasks = useMemo(() => {
    return tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      listName: t.list?.name || '',
    }));
  }, [tasks]);

  // Fuse instance — created once; collection updated in-place via setCollection()
  interface SearchableTask {
    id: string;
    title: string;
    description: string;
    listName: string;
  }
  const fuse = useMemo(
    () =>
      new Fuse<SearchableTask>([], {
        keys: ['title', 'description', 'listName'],
        threshold: 0.3,
        includeScore: true,
      }),
    []
  );

  useEffect(() => {
    fuse.setCollection(searchableTasks);
  }, [fuse, searchableTasks]);

  // Fast-path: stable reference so useMemo deps are exact
  const fastFilter = useMemo(
    () => (query: string, data: SearchableTask[]): SearchableTask[] => {
      if (query.length <= 2) {
        const lower = query.toLowerCase();
        return data.filter(
          (t) => t.title.toLowerCase().includes(lower) || t.listName.toLowerCase().includes(lower)
        );
      }
      return fuse.search(query).slice(0, 10).map((r) => r.item);
    },
    [fuse]
  );

  // Filtered results — memoized on dependents only
  const results = useMemo(() => {
    if (!localQuery.trim()) return [];
    return fastFilter(localQuery, searchableTasks);
  }, [localQuery, searchableTasks, fastFilter]);

  // Reset focus index when results change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFocusedIndex(-1);
  }, [localQuery]);

  // Debounced search update
  const debouncedSetSearch = useMemo(
    () =>
      debounce((value: string) => {
        setSearchQuery(value);
      }, DEBOUNCE_DELAY_MS),
    [setSearchQuery]
  );

  useEffect(() => {
    debouncedSetSearch(localQuery);
    return () => debouncedSetSearch.cancel();
  }, [localQuery, debouncedSetSearch]);

  // Keyboard shortcut & navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Arrow key navigation inside results
  const handleResultsKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        e.preventDefault();
        const selected = results[focusedIndex];
        if (selected) {
          setSearchQuery(selected.title);
          setLocalQuery(selected.title);
          setIsOpen(false);
          setFocusedIndex(-1);
          setSelectedTask(selected.id);
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    },
    [isOpen, results, focusedIndex, setSearchQuery, setSelectedTask]
  );

  const handleFocus = () => setIsOpen(true);

  const handleResultClick = (task: (typeof results)[0]) => {
    setSearchQuery(task.title);
    setLocalQuery(task.title);
    setIsOpen(false);
    setFocusedIndex(-1);
    setSelectedTask(task.id);
  };

  const resultListId = 'search-results-list';

  return (
    <div className="relative">
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search tasks... (⌘K)"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          onFocus={handleFocus}
          className="pl-9 pr-12"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={isOpen ? resultListId : undefined}
          aria-activedescendant={
            isOpen && focusedIndex >= 0 ? `search-result-${results[focusedIndex]?.id}` : undefined
          }
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden md:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>

      {/* Dropdown results */}
      <AnimatePresence>
        {isOpen && localQuery && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 rounded-lg border bg-popover shadow-lg z-50 overflow-hidden"
            onKeyDown={handleResultsKeyDown}
          >
            {results.length > 0 ? (
              <ul id={resultListId} role="listbox" className="py-1 max-h-60 overflow-auto">
                {results.map((task, index) => (
                  <li key={task.id} id={`search-result-${task.id}`}>
                    <button
                      type="button"
                      onClick={() => handleResultClick(task)}
                      className={`w-full px-4 py-2 text-left transition-colors ${
                        index === focusedIndex ? 'bg-accent' : 'hover:bg-accent/50'
                      }`}
                      role="option"
                      aria-selected={index === focusedIndex}
                      aria-label={`${task.title}${task.description ? ', ' + task.description : ''} in ${task.listName}`}
                    >
                      <div className="font-medium text-sm">{task.title}</div>
                      {task.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {task.description}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">in {task.listName}</div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No results found for &quot;{localQuery}&quot;
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setIsOpen(false)}
          aria-hidden="true"
          tabIndex={-1}
        />
      )}
    </div>
  );
}
