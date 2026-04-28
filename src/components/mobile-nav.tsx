'use client';

import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useStore } from '@/store';

export function MobileNav() {
  const { currentView, setCurrentView, openCreateTask } = useStore();

  const views = [
    { id: 'all', label: 'All', icon: '📋' },
    { id: 'today', label: 'Today', icon: '📅' },
    { id: 'week', label: 'Week', icon: '📆' },
    { id: 'upcoming', label: 'Upcoming', icon: '✨' },
  ] as const;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background z-40">
      <div className="flex items-stretch h-16">
        {/* View tabs */}
        <div className="flex-1 flex">
          {views.map((view) => {
            const isActive = currentView === view.id;
            return (
              <button
                key={view.id}
                onClick={() => setCurrentView(view.id)}
                className={`
                  flex-1 flex flex-col items-center justify-center gap-1
                  text-xs
                  ${isActive ? 'text-primary' : 'text-muted-foreground'}
                `}
              >
                <span className="text-lg">{view.icon}</span>
                <span>{view.label}</span>
              </button>
            );
          })}
        </div>

        {/* New Task button */}
        <div className="w-16 flex items-center justify-center border-l border-border">
          <Button size="icon" onClick={() => openCreateTask()} className="h-10 w-10 rounded-full">
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
