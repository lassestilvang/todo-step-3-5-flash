'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { LayoutList, Calendar, CalendarDays, Sparkles, Plus, Trash2, Trash, CheckCircle2 } from 'lucide-react';
import { useState, useMemo } from 'react';

import { Button } from '@/components/ui/button';
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
  { id: 'all', label: 'All Tasks', icon: LayoutList, color: 'text-blue-500' },
  { id: 'today', label: 'Today', icon: Calendar, color: 'text-green-500' },
  { id: 'week', label: 'Next 7 Days', icon: CalendarDays, color: 'text-purple-500' },
  { id: 'upcoming', label: 'Upcoming', icon: Sparkles, color: 'text-amber-500' },
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
  const brandColor = useStore((s) => s.brandColor);
  const setBrandColor = useStore((s) => s.setBrandColor);

  const [newListDialogOpen, setNewListDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListColor, setNewListColor] = useState('#3b82f6');
  const [newListIcon, setNewListIcon] = useState('📋');

  const brandColors = [
    { name: 'Default', value: 'oklch(0.55 0.25 260)' },
    { name: 'Emerald', value: 'oklch(0.6 0.18 160)' },
    { name: 'Rose', value: 'oklch(0.6 0.2 15)' },
    { name: 'Amber', value: 'oklch(0.7 0.2 70)' },
    { name: 'Cyan', value: 'oklch(0.6 0.16 220)' },
    { name: 'Violet', value: 'oklch(0.5 0.2 300)' },
  ];

  const taskCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tasks) {
      if (t.status !== 'completed') {
        map.set(t.listId, (map.get(t.listId) ?? 0) + 1);
      }
    }
    return map;
  }, [tasks]);

  const viewCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: tasks.filter(t => t.status !== 'completed').length,
      today: tasks.filter(t => {
        if (t.status === 'completed') return false;
        const due = t.dueDate || t.deadline;
        if (!due) return false;
        const d = new Date(due);
        const today = new Date();
        return d.getDate() === today.getDate() && 
               d.getMonth() === today.getMonth() && 
               d.getFullYear() === today.getFullYear();
      }).length,
    };
    return counts;
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

  const handleListClick = (id: string | null) => {
    setSelectedList(id);
    if (id) {
      setCurrentView('all');
    }
    onItemClick?.();
  };

  const emojis = ['📋', '📅', '📆', '💼', '🏠', '🛒', '🎯', '🚀', '💡', '❤️', '⭐', '🔥'];

  return (
    <nav className="space-y-6 p-2 flex flex-col h-full">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
          Smart Views
        </div>
        {VIEWS.map((view) => {
          const Icon = view.icon;
          const isActive = currentView === view.id && !selectedListId;
          const count = viewCounts[view.id];
          
          return (
            <motion.button
              key={view.id}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setCurrentView(view.id as ViewType);
                setSelectedList(null);
                onItemClick?.();
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 group',
                isActive 
                  ? 'bg-primary/10 text-primary font-semibold shadow-sm ring-1 ring-primary/20' 
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg transition-colors",
                isActive ? "bg-primary text-primary-foreground" : cn("bg-muted group-hover:bg-background", view.color)
              )}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="flex-1 text-left">{view.label}</span>
              {count !== undefined && count > 0 && (
                <span className={cn(
                  "text-[10px] tabular-nums px-1.5 py-0.5 rounded-full",
                  isActive ? "bg-primary/20" : "bg-muted"
                )}>
                  {count}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
            Your Lists
          </div>
          <Dialog open={newListDialogOpen} onOpenChange={setNewListDialogOpen}>
            <DialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                  aria-label="Create new list"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              }
            />
            <DialogContent className="sm:max-w-[400px] rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Create New List</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-sm font-semibold">Name</Label>
                  <Input
                    id="name"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="E.g. Work, Personal, Shopping"
                    className="h-12 rounded-xl border-2 focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Brand Color</Label>
                  <div className="flex flex-wrap gap-3">
                    {['#3b82f6', '#ef4444', '#22c55e', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b'].map((c) => (
                      <button
                        key={c}
                        className={cn(
                          'w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 active:scale-95',
                          newListColor === c ? 'border-foreground ring-2 ring-primary ring-offset-2' : 'border-transparent'
                        )}
                        style={{ backgroundColor: c }}
                        onClick={() => setNewListColor(c)}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Icon</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        className={cn(
                          'h-10 text-xl rounded-xl border-2 transition-all hover:bg-accent',
                          newListIcon === emoji ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/30'
                        )}
                        onClick={() => setNewListIcon(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={handleCreateList} size="lg" className="w-full rounded-xl font-bold h-12 shadow-lg shadow-primary/20">
                  Create List
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-0.5 max-h-[30vh] overflow-y-auto scrollbar-thin">
          {lists.map((list) => {
            const isActive = selectedListId === list.id;
            const count = taskCountMap.get(list.id) ?? 0;
            return (
              <motion.div 
                key={list.id} 
                className="group relative"
                whileHover={{ x: 4 }}
              >
                <button
                  onClick={() => handleListClick(list.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200',
                    isActive 
                      ? 'bg-accent text-accent-foreground font-semibold shadow-sm' 
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  )}
                >
                  <div 
                    className="w-1.5 h-6 rounded-full shrink-0" 
                    style={{ backgroundColor: list.color }} 
                  />
                  <span className="text-base leading-none">{list.icon}</span>
                  <span className="flex-1 text-left truncate">{list.name}</span>
                  {count > 0 && (
                    <span className="text-[10px] tabular-nums text-muted-foreground/60">
                      {count}
                    </span>
                  )}
                  {list.isMagic && <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" />}
                </button>
                {list.id !== INBOX_LIST_ID && (
                  <button
                    onClick={(e) => handleDeleteList(e, list.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                    aria-label={`Delete list ${list.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-border/50">
        <AnimatePresence>
          {completedCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <Button
                variant="ghost"
                onClick={() => void handleClearCompleted()}
                className="w-full justify-start text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 group px-3 h-10 rounded-xl"
              >
                <div className="p-1.5 rounded-lg bg-muted group-hover:bg-destructive/10 transition-colors mr-3">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                Clear {completedCount} completed
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {overdueCount > 0 && (
          <div className="mt-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-600 flex items-center gap-2">
            <div className="p-1 rounded-md bg-red-500 text-white">
              <Trash className="h-3 w-3" />
            </div>
            {overdueCount} OVERDUE TASKS
          </div>
        )}

        <div className="mt-4 px-3 py-2 space-y-3">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
            Brand Accent
          </div>
          <div className="flex flex-wrap gap-2.5">
            {brandColors.map((color) => (
              <button
                key={color.value}
                onClick={() => setBrandColor(color.value)}
                className={cn(
                  'w-5 h-5 rounded-full transition-all hover:scale-125 active:scale-90 shadow-sm',
                  brandColor === color.value ? 'ring-2 ring-foreground ring-offset-2 scale-110' : 'opacity-60 hover:opacity-100'
                )}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
