'use client';

import { AnimatePresence } from 'framer-motion';
import { PanelLeft } from 'lucide-react';
import { useEffect, useState } from 'react';

import { CreateTaskDialog } from '@/components/create-task-dialog';
import { MobileNav } from '@/components/mobile-nav';
import { SearchBar } from '@/components/search-bar';
import { Sidebar } from '@/components/sidebar';
import { TaskDetailSheet } from '@/components/task-detail-sheet';
import { TaskList } from '@/components/task-list';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ViewToggle } from '@/components/view-toggle';
import { VIEW_LABELS } from '@/constants';
import { useStore } from '@/store';

export default function HomePage() {
  const showCompleted = useStore((s) => s.showCompleted);
  const toggleShowCompleted = useStore((s) => s.toggleShowCompleted);
  const isCreateTaskOpen = useStore((s) => s.isCreateTaskOpen);
  const closeTaskModal = useStore((s) => s.closeTaskModal);
  const currentView = useStore((s) => s.currentView);
  const overdueCount = useStore((s) => s.overdueCount);
  const openCreateTask = useStore((s) => s.openCreateTask);
  const taskCount = useStore((s) => s.tasks.length);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    useStore.getState().loadData();
  }, []);

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Sidebar Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">TaskPlanner</h1>
                <ThemeToggle />
              </div>
              <SearchBar />
            </div>
            <ScrollArea className="flex-1 scrollbar-thin">
              <Sidebar onItemClick={() => setSidebarOpen(false)} />
              <ScrollBar />
            </ScrollArea>
            <div className="p-4 border-t border-border">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Show completed</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleShowCompleted}
                  className={showCompleted ? 'text-primary' : ''}
                >
                  {showCompleted ? '✓' : '○'}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-sidebar">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">TaskPlanner</h1>
            <ThemeToggle />
          </div>
          <SearchBar />
        </div>
        <ScrollArea className="flex-1 scrollbar-thin">
          <Sidebar />
          <ScrollBar />
        </ScrollArea>
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Show completed</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleShowCompleted}
              className={showCompleted ? 'text-primary' : ''}
            >
              {showCompleted ? '✓' : '○'}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        {/* Header */}
        <header className="flex-shrink-0 border-b border-border p-2 md:p-4 backdrop-blur-sm bg-background/80 supports-backdrop-blur:bg-background/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              {/* Mobile menu button */}
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger
                  render={
                    <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                      <PanelLeft className="h-5 w-5" />
                    </Button>
                  }
                />
              </Sheet>

              <div>
                <h2 className="text-lg md:text-2xl font-semibold">
                  {VIEW_LABELS[currentView] || currentView}
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {taskCount} tasks
                  {overdueCount > 0 && (
                    <span className="ml-2 text-red-500">
                      ({overdueCount} overdue)
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:block">
                <ViewToggle />
              </div>
              <Button size="sm" onClick={() => openCreateTask()}>
                <span className="hidden sm:inline">+ New Task</span>
                <span className="sm:hidden">+</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Task List */}
        <ScrollArea className="flex-1 scrollbar-thin">
          <TaskList />
          <ScrollBar />
        </ScrollArea>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Modals */}
      <AnimatePresence>
        {isCreateTaskOpen && <CreateTaskDialog open={isCreateTaskOpen} onClose={closeTaskModal} />}
      </AnimatePresence>

      <TaskDetailSheet />
    </div>
  );
}