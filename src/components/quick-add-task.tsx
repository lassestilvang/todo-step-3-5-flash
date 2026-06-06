'use client';
import { Plus } from 'lucide-react';
import { useState, useMemo, useRef, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { INBOX_LIST_ID } from '@/constants';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';
import type { TaskList } from '@/types';

export const QuickAddTask = () => {
  const addTask = useStore((s) => s.addTask);
  const selectedListId = useStore((s) => s.selectedListId);
  const lists = useStore((s) => s.lists);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const currentList: TaskList | undefined = useMemo(
    () => lists.find((l) => l.id === (selectedListId || INBOX_LIST_ID)),
    [lists, selectedListId]
  );

  const listId = useMemo(() => selectedListId || INBOX_LIST_ID, [selectedListId]);

  const handleSubmit = useCallback(async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    await addTask({ title: trimmed, listId });
    setTitle('');
    inputRef.current?.focus();
  }, [title, addTask, listId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        void handleSubmit();
      }
      if (e.key === 'Escape') {
        setTitle('');
        inputRef.current?.blur();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-muted-foreground/30 p-2 hover:border-primary/50 hover:bg-accent/20 transition-colors group">
      <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
      <input
        ref={inputRef}
        type="text"
        placeholder={`Quick add task to ${currentList?.name ?? 'Inbox'}…`}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60'
        )}
      />
      {title.trim() && (
        <Button size="xs" variant="default" onClick={() => void handleSubmit()}>
          Add
        </Button>
      )}
    </div>
  );
};
