"use client";

import { useState, useEffect, useMemo } from "react";
import { useStore } from "@/store";
import { Search, Command } from "lucide-react";
import { Input } from "@/components/ui/input";
import { debounce } from "@/lib/utils";
import Fuse from "fuse.js";
import { motion, AnimatePresence } from "framer-motion";

export function SearchBar() {
  const { tasks, searchQuery, setSearchQuery } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState(searchQuery);

  // Prepare searchable data
  const searchableTasks = useMemo(() => {
    return tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      listName: t.list?.name || "",
    }));
  }, [tasks]);

  // Fuse instance
  const fuse = useMemo(() => {
    return new Fuse(searchableTasks, {
      keys: ["title", "description", "listName"],
      threshold: 0.3,
      includeScore: true,
    });
  }, [searchableTasks]);

  // Filtered results
  const results = useMemo(() => {
    if (!localQuery.trim()) return [];
    return fuse.search(localQuery).slice(0, 10).map((r) => r.item);
  }, [fuse, localQuery]);

  // Debounced search update
  const debouncedSetSearch = useMemo(
    () => debounce((value: string) => {
      setSearchQuery(value);
    }, 300),
    [setSearchQuery]
  );

  useEffect(() => {
    debouncedSetSearch(localQuery);
    return () => debouncedSetSearch.cancel();
  }, [localQuery, debouncedSetSearch]);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleFocus = () => setIsOpen(true);

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
          >
            {results.length > 0 ? (
              <ul className="py-1">
                {results.map((task) => (
                  <li key={task.id}>
                    <button
                      onClick={() => {
                        setSearchQuery(task.title);
                        setLocalQuery(task.title);
                        setIsOpen(false);
                        // Navigate to task
                        useStore.getState().setSelectedTask(task.id);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-accent transition-colors"
                    >
                      <div className="font-medium text-sm">{task.title}</div>
                      {task.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {task.description}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        in {task.listName}
                      </div>
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
        />
      )}
    </div>
  );
}
