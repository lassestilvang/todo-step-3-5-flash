'use client';

import { LayoutList, Calendar, CalendarDays, Sparkles, LayoutGrid, PlayCircle } from 'lucide-react';
import { useMemo } from 'react';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStore } from '@/store';
import type { ViewType } from '@/types';

export function ViewToggle() {
  const { currentView, setCurrentView } = useStore();

  const views = useMemo(
    () => [
      { id: 'today' as const, label: 'Today', icon: Calendar },
      { id: 'week' as const, label: 'Week', icon: CalendarDays },
      { id: 'upcoming' as const, label: 'Upcoming', icon: Sparkles },
      { id: 'in_progress' as const, label: 'Active', icon: PlayCircle },
      { id: 'board' as const, label: 'Board', icon: LayoutGrid },
      { id: 'all' as const, label: 'All', icon: LayoutList },
    ],
    []
  );

  return (
    <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as ViewType)}>
      <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 lg:grid-cols-6">
        {views.map((view) => {
          const Icon = view.icon;
          return (
            <TabsTrigger key={view.id} value={view.id} className="flex items-center gap-1">
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{view.label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
