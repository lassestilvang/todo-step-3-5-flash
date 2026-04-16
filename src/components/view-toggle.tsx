"use client";

import { useStore } from "@/store";
import { ViewType } from "@/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutList, Calendar, CalendarDays, Sparkles } from "lucide-react";

export function ViewToggle() {
  const { currentView, setCurrentView } = useStore();

  const views: { id: ViewType; label: string; icon: React.ElementType }[] = [
    { id: "today", label: "Today", icon: Calendar },
    { id: "week", label: "Week", icon: CalendarDays },
    { id: "upcoming", label: "Upcoming", icon: Sparkles },
    { id: "all", label: "All", icon: LayoutList },
  ];

  return (
    <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as ViewType)}>
      <TabsList className="grid w-full grid-cols-4">
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
