'use client';

import { LayoutList, Calendar, CalendarDays, Sparkles, Plus, Trash2, Trash } from 'lucide-react';
import { useState, useMemo } from 'react';

import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { INBOX_LIST_ID } from '@/constants';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';
import type { ViewType } from '@/types';

const VIEWS = [
  { id: 'all', label: 'All Tasks', icon: LayoutList },
  { id: 'today', label: 'Today', icon: Calendar },
  { id: 'week', label: 'Next 7 Days', icon: CalendarDays },
  { id: 'upcoming', label: 'Upcoming', icon: Sparkles },
];

export function Sidebar({ onItemClick }: { onItemClick?: () => void } = {}) {
  const lists = useStore((s) => s.lists);
  const tasks = useStore((s) => s.tasks);
  const currentView = useStore((s) => s.currentView);
  const selectedListId = useStore((s) => s.selectedListId);
  const overdueCount = useStore((s) => s.overdueCount);
  const setCurrentView = useStore((s) => s.setCurrentView);
  const setSelectedList = useStore((s) => s.setSelectedList);
  const addList = useStore((s) => s.addList);
  const deleteList = useStore((s) => s.deleteList);
  const clearCompleted = useStore((s) => s.clearCompleted);

  const [newListDialogOpen, setNewListDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListColor, setNewListColor] = useState('#3b82f6');
  const [newListIcon, setNewListIcon] = useState('📋');

  // Memoize task counts per list to avoid recomputing on every render
  const taskCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tasks) {
      map.set(t.listId, (map.get(t.listId) ?? 0) + 1);
    }
    return map;
  }, [tasks]);

  const completedCount = useMemo(
    () => tasks.filter((t) => t.status === 'completed').length,
    [tasks]
  );

  const handleCreateList = () => {
    if (!newListName.trim()) return;
    addList({
      name: newListName,
      color: newListColor,
      icon: newListIcon,
    });
    setNewListDialogOpen(false);
    setNewListName('');
  };

  const handleDeleteList = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (id === INBOX_LIST_ID) return;
    deleteList(id);
    if (selectedListId === id) {
      setSelectedList(null);
    }
  };

  const handleClearCompleted = async () => {
    if (completedCount === 0) return;
    await clearCompleted();
  };

  const handleClearCompletedClick = () => {
    void handleClearCompleted();
  };

  const handleListClick = (id: string | null) => {
    setSelectedList(id);
    if (id) {
      setCurrentView('all');
    }
    onItemClick?.();
  };

  // Common emoji list
  const emojis = ['📋', '📅', '📆', '💼', '🏠', '🛒', '🎯', '🚀', '💡', '❤️', '⭐', '🔥'];

  return (
    <nav className="space-y-6">
      {/* Views */}
      <div className="space-y-1">
        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Views
        </div>
        {VIEWS.map((view) => {
          const Icon = view.icon;
          const isActive = currentView === view.id && !selectedListId;
          return (
            <button
              key={view.id}
              onClick={() => {
                setCurrentView(view.id as ViewType);
                setSelectedList(null);
                onItemClick?.();
              }}
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'w-full justify-start',
                isActive && 'bg-accent text-accent-foreground font-medium'
              )}
            >
              <Icon className="mr-2 h-4 w-4" />
              {view.label}
            </button>
          );
        })}
      </div>

      {/* Lists */}
      <div className="space-y-1">
        <div className="flex items-center justify-between px-2 py-1">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Lists
          </div>
          <Dialog open={newListDialogOpen} onOpenChange={setNewListDialogOpen}>
            <DialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  aria-label="Create new list"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New List</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="My List"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    {['#3b82f6', '#ef4444', '#22c55e', '#f97316', '#8b5cf6', '#ec4899'].map((c) => (
                      <button
                        key={c}
                        className={cn(
                          'w-8 h-8 rounded-full border-2',
                          newListColor === c ? 'border-foreground' : 'border-transparent'
                        )}
                        style={{ backgroundColor: c }}
                        onClick={() => setNewListColor(c)}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <div className="flex flex-wrap gap-2">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        className={cn(
                          'w-10 h-10 text-xl rounded border',
                          newListIcon === emoji ? 'bg-accent' : 'bg-background'
                        )}
                        onClick={() => setNewListIcon(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleCreateList}>Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {lists.map((list) => {
          const isActive = selectedListId === list.id;
          const taskCount = taskCountMap.get(list.id) ?? 0;
          return (
            <div key={list.id} className="group relative">
              <button
                onClick={() => handleListClick(list.id)}
                className={cn(
                  buttonVariants({ variant: 'ghost' }),
                  'w-full justify-start pr-8',
                  isActive && 'bg-accent text-accent-foreground font-medium'
                )}
                style={{
                  borderLeft: `3px solid ${list.color}`,
                }}
              >
                <span className="mr-2">{list.icon}</span>
                <span className="flex-1 truncate">{list.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">{taskCount}</span>
                {list.isMagic && <Sparkles className="ml-2 h-3 w-3 text-amber-500" />}
              </button>
              {list.id !== INBOX_LIST_ID && (
                <button
                  onClick={(e) => handleDeleteList(e, list.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Delete list ${list.name}`}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="space-y-1 mt-auto">
        {overdueCount > 0 && (
          <div className="px-2 py-2 text-sm text-red-500 flex items-center">
            <span className="mr-2">⚠️</span>
            {overdueCount} overdue task{overdueCount > 1 ? 's' : ''}
          </div>
        )}
        {completedCount > 0 && (
          <button
            onClick={handleClearCompletedClick}
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'w-full justify-start text-sm text-muted-foreground hover:text-destructive'
            )}
          >
            <Trash className="mr-2 h-4 w-4" />
            Clear {completedCount} completed
          </button>
        )}
      </div>
    </nav>
  );
}
