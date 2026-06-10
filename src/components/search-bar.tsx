'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Fuse from 'fuse.js';
import { Search, Sparkles } from 'lucide-react';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

import { Input } from '@/components/ui/input';
import { DEBOUNCE_DELAY_MS } from '@/constants';
import { debounce } from '@/lib/utils';
import { useStore } from '@/store';

export function SearchBar() {
  const { tasks, searchQuery, setSearchQuery, setSelectedTask } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchableTasks = useMemo(() => {
    return tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      listName: t.list?.name || '',
      icon: t.list?.icon || '📋',
    }));
  }, [tasks]);

  interface SearchableTask {
    id: string;
    title: string;
    description: string;
    listName: string;
    icon: string;
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

  const fastFilter = useMemo(
    () => (query: string, data: SearchableTask[]): SearchableTask[] => {
      if (query.length <= 2) {
        const lower = query.toLowerCase();
        return data.filter(
          (t) => t.title.toLowerCase().includes(lower) || t.listName.toLowerCase().includes(lower)
        );
      }
      return fuse.search(query).slice(0, 8).map((r) => r.item);
    },
    [fuse]
  );

  const results = useMemo(() => {
    if (!localQuery.trim()) return [];
    return fastFilter(localQuery, searchableTasks);
  }, [localQuery, searchableTasks, fastFilter]);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setFocusedIndex(-1);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleResultClick = useCallback((task: SearchableTask) => {
    setSearchQuery(task.title);
    setLocalQuery(task.title);
    setIsOpen(false);
    setFocusedIndex(-1);
    setSelectedTask(task.id);
  }, [setSearchQuery, setSelectedTask]);

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
          handleResultClick(selected);
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    },
    [isOpen, results, focusedIndex, handleResultClick]
  );

  const resultListId = 'search-results-list';

  return (
    <div className="relative group/search">
      <div className="relative">
        <Search className={cn(
          "absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
          isOpen ? "text-primary" : "text-muted-foreground group-focus-within/search:text-primary"
        )} />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search everything..."
          value={localQuery}
          onChange={(e) => {
            setLocalQuery(e.target.value);
            setFocusedIndex(-1);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className={cn(
            "h-11 pl-10 pr-14 rounded-xl border-2 transition-all bg-muted/20 border-transparent",
            "focus-visible:ring-0 focus-visible:bg-background focus-visible:border-primary/50 focus-visible:shadow-lg focus-visible:shadow-primary/5",
            isOpen && localQuery && "rounded-b-none border-b-0"
          )}
          onKeyDown={handleResultsKeyDown}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={isOpen ? resultListId : undefined}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border bg-muted/50 px-1.5 font-mono text-[10px] font-bold text-muted-foreground/60">
            ⌘K
          </kbd>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && localQuery && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -4 }}
            className="absolute top-[calc(100%-2px)] left-0 right-0 rounded-b-2xl border-2 border-t-0 border-primary/50 bg-background shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-2 border-t border-border/50">
              {results.length > 0 ? (
                <ul id={resultListId} role="listbox" className="space-y-0.5">
                  {results.map((task, index) => (
                    <li key={task.id}>
                      <button
                        type="button"
                        onClick={() => handleResultClick(task)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-xl transition-all duration-200",
                          index === focusedIndex ? "bg-primary/10 text-primary shadow-inner" : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                        )}
                        role="option"
                        aria-selected={index === focusedIndex}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-base shadow-sm",
                          index === focusedIndex ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                          {task.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={cn(
                            "font-bold text-sm truncate",
                            index === focusedIndex ? "text-primary" : "text-foreground"
                          )}>
                            {task.title}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">in {task.listName}</span>
                            {task.description && (
                              <span className="text-[10px] truncate opacity-40">— {task.description}</span>
                            )}
                          </div>
                        </div>
                        <Sparkles className={cn("w-3 h-3 transition-opacity", index === focusedIndex ? "opacity-100" : "opacity-0")} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-muted mx-auto flex items-center justify-center mb-4">
                    <Search className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">No matches found</h4>
                  <p className="text-xs text-muted-foreground mt-1">Try searching for something else</p>
                </div>
              )}
            </div>
            
            <div className="px-4 py-2.5 bg-muted/30 border-t border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase">
                  <kbd className="px-1 py-0.5 rounded bg-background border shadow-sm">↑↓</kbd>
                  Navigate
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase">
                  <kbd className="px-1 py-0.5 rounded bg-background border shadow-sm">↵</kbd>
                  Select
                </div>
              </div>
              <div className="text-[10px] font-bold text-primary/50 uppercase tracking-widest">
                Search Results
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/5 backdrop-blur-[2px]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

