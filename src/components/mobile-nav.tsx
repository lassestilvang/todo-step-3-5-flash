'use client';

import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useMemo } from 'react';
import { useStore } from '@/store';

export function MobileNav() {
  const currentView = useStore((s) => s.currentView);
  const setCurrentView = useStore((s) => s.setCurrentView);
  const openCreateTask = useStore((s) => s.openCreateTask);

  const views = useMemo(
    () => [
      { id: 'all', label: 'All', icon: '📋' },
      { id: 'today', label: 'Today', icon: '📅' },
      { id: 'week', label: 'Week', icon: '📆' },
      { id: 'upcoming', label: 'Upcoming', icon: '✨' },
    ] as const,
    []
  );

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background z-40" aria-label="View navigation">
      <div className="flex items-stretch h-16">
        {/* View tabs */}
        <div className="flex-1 flex">
          {views.map((view) => {
            const isActive = currentView === view.id;
            return (
              <button
                key={view.id}
                onClick={() => setCurrentView(view.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  flex-1 flex flex-col items-center justify-center gap-1
                  text-xs transition-colors
                  ${isActive ? 'text-primary' : 'text-muted-foreground'}
                `}
              >
                <span className="text-lg" aria-hidden="true">{view.icon}</span>
                <span>{view.label}</span>
              </button>
            );
          })}
        </div>

        {/* New Task button */}
        <div className="w-16 flex items-center justify-center border-l border-border">
          <Button
            size="icon"
            onClick={() => openCreateTask()}
            className="h-10 w-10 rounded-full"
            aria-label="Create new task"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
