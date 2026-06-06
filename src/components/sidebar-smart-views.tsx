'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { VIEWS } from '@/constants';
import { useStore } from '@/store';
import type { ViewType } from '@/types';

export function SidebarSmartViews({
  viewCounts,
  onItemClick,
}: {
  viewCounts: Record<string, number>;
  onItemClick?: () => void;
}) {
  const currentView = useStore((s) => s.currentView);
  const selectedListId = useStore((s) => s.selectedListId);
  const setCurrentView = useStore((s) => s.setCurrentView);
  const setSelectedList = useStore((s) => s.setSelectedList);

  return (
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
  );
}
