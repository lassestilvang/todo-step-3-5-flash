'use client';

import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { PanelLeft, Sparkles, CheckCircle2, Trophy, Calendar } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';

import { CreateTaskDialog } from '@/components/create-task-dialog';
import { FocusTimer } from '@/components/focus-timer';
import { KeyboardShortcuts } from '@/components/keyboard-shortcuts';
import { MobileNav } from '@/components/mobile-nav';
import { QuickAddTask } from '@/components/quick-add-task';
import { SearchBar } from '@/components/search-bar';
import { Sidebar } from '@/components/sidebar';
import { TaskDetailSheet } from '@/components/task-detail-sheet';
import { TaskList } from '@/components/task-list';
import { TaskStatistics } from '@/components/task-statistics';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ViewToggle } from '@/components/view-toggle';
import { VIEW_LABELS } from '@/constants';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';

export default function HomePage() {
  const showCompleted = useStore((s) => s.showCompleted);
  const toggleShowCompleted = useStore((s) => s.toggleShowCompleted);
  const isCreateTaskOpen = useStore((s) => s.isCreateTaskOpen);
  const closeTaskModal = useStore((s) => s.closeTaskModal);
  const currentView = useStore((s) => s.currentView);
  const overdueCount = useStore((s) => s.overdueCount);
  const openCreateTask = useStore((s) => s.openCreateTask);
  const magicSortTasks = useStore((s) => s.magicSortTasks);
  const tasks = useStore((s) => s.tasks);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    useStore.getState().loadData();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'n' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        useStore.getState().openCreateTask();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const productivityStats = useMemo(() => {
    const completed = tasks.filter(t => t.status === 'completed').length;
    const total = tasks.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
  }, [tasks]);

  return (
    <div className="flex h-screen bg-[#fafafa] dark:bg-[#050505] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '20s' }} />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '25s' }} />
      {/* Mobile Sidebar Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0 border-r-0 shadow-2xl">
          <div className="flex flex-col h-full bg-background/50 backdrop-blur-xl">
            <div className="p-6 border-b border-border/50">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                    <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h1 className="text-xl font-black tracking-tighter">TaskPlanner</h1>
                </div>
                <ThemeToggle />
              </div>
              <SearchBar />
            </div>
            <ScrollArea className="flex-1">
              <Sidebar onItemClick={() => setSidebarOpen(false)} />
              <ScrollBar />
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col border-r border-border/50 bg-background/50 backdrop-blur-xl">
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 group cursor-default">
              <motion.div 
                whileHover={{ rotate: 12, scale: 1.1 }}
                className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 transition-transform"
              >
                <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
              </motion.div>
              <h1 className="text-xl font-black tracking-tighter group-hover:text-primary transition-colors">TaskPlanner</h1>
            </div>
            <ThemeToggle />
          </div>
          <SearchBar />
        </div>
        <ScrollArea className="flex-1">
          <Sidebar />
          <ScrollBar />
        </ScrollArea>
        <div className="p-6 border-t border-border/50">
          <div className="bg-muted/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <span>Overall Progress</span>
              <span>{productivityStats.percent}%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${productivityStats.percent}%` }}
                className="h-full bg-primary"
              />
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              {productivityStats.completed} of {productivityStats.total} tasks completed
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main id="main-content" role="main" className="flex-1 flex flex-col overflow-hidden relative">
        {/* Background gradient for main content */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        
        {/* Header */}
        <header className="flex-shrink-0 z-10 p-4 md:p-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="icon" 
                className="lg:hidden h-10 w-10 rounded-xl"
                onClick={() => setSidebarOpen(true)}
              >
                <PanelLeft className="h-5 w-5" />
              </Button>

              <div>
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 mb-1"
                >
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Personal Workspace</span>
                </motion.div>
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl md:text-5xl font-black tracking-tight">
                    {VIEW_LABELS[currentView] || currentView}
                  </h2>
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(), 'EEEE, MMMM d')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {productivityStats.total} tasks active
                  </p>
                  {overdueCount > 0 && (
                    <Badge variant="destructive" className="rounded-full px-2 py-0 h-5 text-[10px] font-bold">
                      {overdueCount} OVERDUE
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => magicSortTasks()}
                className="rounded-xl h-10 w-10 hover:text-primary hover:border-primary/50 transition-all"
                title="Magic Sort (Priority & Date)"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
              <ViewToggle />
              <Button 
                size="lg" 
                onClick={() => openCreateTask()}
                className="rounded-2xl h-12 px-6 font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
              >
                <span className="hidden sm:inline">+ Create Task</span>
                <span className="sm:hidden">+</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Productivity Summary Bar */}
        <div className="px-4 md:px-8 mb-4">
          <div className="bg-background border border-border/50 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Productivity Score</div>
                <div className="text-lg font-black tracking-tight">{productivityStats.percent} <span className="text-sm font-medium text-muted-foreground">/ 100</span></div>
              </div>
            </div>
            
            <div className="hidden md:flex gap-8">
              <div className="text-center">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Completed</div>
                <div className="text-lg font-black">{productivityStats.completed}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Outstanding</div>
                <div className="text-lg font-black">{productivityStats.total - productivityStats.completed}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
               <span className="text-xs font-medium text-muted-foreground">Show Completed</span>
               <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleShowCompleted}
                  className={cn('rounded-lg', showCompleted ? 'text-primary bg-primary/10' : '')}
                >
                  {showCompleted ? '✓' : '○'}
                </Button>
            </div>
          </div>
        </div>

        {/* Quick Add */}
        <div className="px-4 md:px-8 pb-4">
          <div className="max-w-5xl mx-auto">
            <QuickAddTask />
          </div>
        </div>

        {/* Task List or Statistics */}
        <ScrollArea className="flex-1 px-4 md:px-8">
          <div className="max-w-5xl mx-auto pb-24">
            {currentView === 'statistics' ? <TaskStatistics /> : <TaskList />}
          </div>
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
      <KeyboardShortcuts />
      <FocusTimer />
    </div>
  );
}