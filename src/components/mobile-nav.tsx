'use client';

import { Plus } from 'lucide-react';
import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';
import type { ViewType } from '@/types';

export function MobileNav() {
  const currentView = useStore((s) => s.currentView);
  const setCurrentView = useStore((s) => s.setCurrentView);
  const openCreateTask = useStore((s) => s.openCreateTask);

  const views = useMemo(
    () => [
      { id: 'all', label: 'All', icon: '📋' },
      { id: 'today', label: 'Today', icon: '📅' },
      { id: 'in_progress', label: 'Active', icon: '⚡' },
      { id: 'statistics', label: 'Stats', icon: '📊' },
    ],
    []
  );

  const handleViewChange = (viewId: ViewType) => {
    setCurrentView(viewId);
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background/80 backdrop-blur-xl z-40"
      aria-label="View navigation"
    >
      <div className="flex items-stretch h-16">
        {/* View tabs */}
        <div className="flex-1 flex" role="tablist">
          {views.map((view) => {
            const isActive = currentView === view.id;
            return (
              <button
                key={view.id}
                onClick={() => handleViewChange(view.id as ViewType)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={view.label}
                role="tab"
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 text-xs transition-colors relative touch-manipulation min-h-[44px]",
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <div
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    isActive ? "bg-primary/10" : "bg-transparent"
                  )}
                  aria-hidden="true"
                >
                  {view.icon}
                </div>
                <span className="sr-only">{view.label}</span>
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* New Task button */}
        <div className="w-16 flex items-center justify-center border-l border-border">
          <Button
            size="icon"
            onClick={() => openCreateTask()}
            className="h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 touch-manipulation"
            aria-label="Create new task"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
