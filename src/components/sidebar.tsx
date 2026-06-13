'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, CheckCircle2, Sparkles, Circle } from 'lucide-react';
import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { INBOX_LIST_ID } from '@/constants';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';
import type { TaskStatus } from '@/types';

import { CreateListDialog } from './create-list-dialog';
import { SidebarSmartViews } from './sidebar-smart-views';

export function Sidebar({ onItemClick }: { onItemClick?: () => void } = {}) {
  const lists = useStore((s) => s.lists);
  const tasks = useStore((s) => s.tasks);
  const selectedListId = useStore((s) => s.selectedListId);
  const overdueCount = useStore((s) => s.overdueCount);
  const setCurrentView = useStore((s) => s.setCurrentView);
  const setSelectedList = useStore((s) => s.setSelectedList);
  const setStatusFilter = useStore((s) => s.setStatusFilter);
  const statusFilter = useStore((s) => s.statusFilter);
  const deleteList = useStore((s) => s.deleteList);
  const clearCompleted = useStore((s) => s.clearCompleted);
  const brandColor = useStore((s) => s.brandColor);
  const setBrandColor = useStore((s) => s.setBrandColor);

  const taskCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tasks) {
      if (t.status !== 'completed') {
        const key = t.listId ?? 'unknown';
        map.set(key, (map.get(key) ?? 0) + 1);
      }
    }
    return map;
  }, [tasks]);

  const viewCounts = useMemo(() => {
    return {
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
  }, [tasks]);

  const completedCount = useMemo(() => tasks.filter(t => t.status === 'completed').length, [tasks]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { pending: 0, in_progress: 0, completed: 0 };
    for (const t of tasks) {
      if (t.status && t.status in counts) counts[t.status]++;
    }
    return counts;
  }, [tasks]);

  const handleDeleteList = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (id === INBOX_LIST_ID) return;
    deleteList(id);
    if (selectedListId === id) setSelectedList(null);
  };

  const handleClearCompleted = async () => {
    if (completedCount === 0) return;
    await clearCompleted();
  };

  const handleListClick = (id: string | null) => {
    setSelectedList(id);
    setStatusFilter(null);
    if (id) setCurrentView('all');
    onItemClick?.();
  };

  return (
    <nav className="space-y-6 p-2 flex flex-col h-full">
      <SidebarSmartViews viewCounts={viewCounts} onItemClick={onItemClick} />

      <div className="space-y-1">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Your Lists</div>
          <CreateListDialog />
        </div>

        <div className="space-y-0.5 max-h-[30vh] overflow-y-auto scrollbar-thin">
          {lists.map((list) => {
            const isActive = selectedListId === list.id;
            const count = taskCountMap.get(list.id) ?? 0;
            return (
              <motion.div key={list.id} className="group relative" whileHover={{ x: 4 }}>
                <button
                  onClick={() => handleListClick(list.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200',
                    isActive
                      ? 'bg-accent text-accent-foreground font-semibold shadow-sm'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  )}
                >
                  <div className="w-1.5 h-6 rounded-full shrink-0" style={{ backgroundColor: list.color }} />
                  <span className="text-base leading-none">{list.icon}</span>
                  <span className="flex-1 text-left truncate">{list.name}</span>
                  {count > 0 && <span className="text-[10px] tabular-nums text-muted-foreground/60">{count}</span>}
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

      <StatusFilterSection statusFilter={statusFilter} setStatusFilter={setStatusFilter} counts={statusCounts} />

      <div className="mt-auto pt-4 border-t border-border/50">
        <AnimatePresence>
          {completedCount > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
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
              <Trash2 className="h-3 w-3" />
            </div>
            {overdueCount} OVERDUE TASKS
          </div>
        )}

        <BrandColorSelector brandColor={brandColor} setBrandColor={setBrandColor} />
      </div>
    </nav>
  );
}

function StatusFilterSection({
  statusFilter,
  setStatusFilter,
  counts,
}: {
  statusFilter: TaskStatus | null;
  setStatusFilter: (status: TaskStatus | null) => void;
  counts: Record<string, number>;
}) {
  return (
    <div className="space-y-1 pt-4 border-t border-border/50 mt-4">
      <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Status Filter</div>
      <div className="space-y-0.5 px-2">
        <StatusFilterButton status="pending" counts={counts} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
        <StatusFilterButton status="in_progress" counts={counts} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
        <StatusFilterButton status="completed" counts={counts} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
        {statusFilter && (
          <button onClick={() => setStatusFilter(null)} className="w-full px-3 py-1 text-xs text-muted-foreground hover:text-primary transition-colors">
            Clear filter
          </button>
        )}
      </div>
    </div>
  );
}

function StatusFilterButton({
  status,
  counts,
  statusFilter,
  setStatusFilter,
}: {
  status: TaskStatus;
  counts: Record<string, number>;
  statusFilter: TaskStatus | null;
  setStatusFilter: (status: TaskStatus | null) => void;
}) {
  const config = {
    pending: { icon: Circle, color: 'text-muted-foreground', active: 'bg-blue-500/10 text-blue-600' },
    in_progress: { icon: () => <div className="w-4 h-4 rounded-full border-2 border-amber-500 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-amber-500" /></div>, color: 'text-muted-foreground', active: 'bg-amber-500/10 text-amber-600' },
    completed: { icon: CheckCircle2, color: 'text-muted-foreground', active: 'bg-green-500/10 text-green-600' },
  };
  const c = config[status];
  const isActive = statusFilter === status;

  return (
    <button
      onClick={() => setStatusFilter(isActive ? null : status)}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200',
        isActive ? `${c.active} font-semibold` : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
      )}
    >
      <c.icon className="h-4 w-4" />
      <span className="flex-1 text-left">{status.replace('_', ' ')}</span>
      <span className="text-[10px] tabular-nums">{counts[status]}</span>
    </button>
  );
}

function BrandColorSelector({ brandColor, setBrandColor }: { brandColor: string; setBrandColor: (color: string) => void }) {
  const colors = [
    { name: 'Default', value: 'oklch(0.55 0.25 260)' },
    { name: 'Emerald', value: 'oklch(0.6 0.18 160)' },
    { name: 'Rose', value: 'oklch(0.6 0.2 15)' },
    { name: 'Amber', value: 'oklch(0.7 0.2 70)' },
    { name: 'Cyan', value: 'oklch(0.6 0.16 220)' },
    { name: 'Violet', value: 'oklch(0.5 0.2 300)' },
  ];

  return (
    <div className="mt-4 px-3 py-2 space-y-3">
      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Brand Accent</div>
      <div className="flex flex-wrap gap-2.5">
        {colors.map((color) => (
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
  );
}