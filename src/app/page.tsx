"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/store";
import { Sidebar } from "@/components/sidebar";
import { TaskList } from "@/components/task-list";
import { CreateTaskDialog } from "@/components/create-task-dialog";
import { TaskDetailSheet } from "@/components/task-detail-sheet";
import { SearchBar } from "@/components/search-bar";
import { ViewToggle } from "@/components/view-toggle";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AnimatePresence } from "framer-motion";
import { PanelLeft } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MobileNav } from "@/components/mobile-nav";

export default function HomePage() {
  const showCompleted = useStore((s) => s.showCompleted);
  const toggleShowCompleted = useStore((s) => s.toggleShowCompleted);
  const createTaskOpen = useStore((s) => s.isCreateTaskOpen);
  const closeTaskModal = useStore((s) => s.closeTaskModal);
  const currentView = useStore((s) => s.currentView);
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
                <h1 className="text-xl font-bold">TaskPlanner</h1>
                <ThemeToggle />
              </div>
              <SearchBar />
            </div>
            <ScrollArea className="flex-1 p-2">
              <Sidebar onItemClick={() => setSidebarOpen(false)} />
            </ScrollArea>
            <div className="p-4 border-t border-border">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Show completed</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleShowCompleted}
                  className={showCompleted ? "text-primary" : ""}
                >
                  {showCompleted ? "✓" : "○"}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">TaskPlanner</h1>
            <ThemeToggle />
          </div>
          <SearchBar />
        </div>
        <ScrollArea className="flex-1 p-2">
          <Sidebar />
        </ScrollArea>
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Show completed</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleShowCompleted}
              className={showCompleted ? "text-primary" : ""}
            >
              {showCompleted ? "✓" : "○"}
            </Button>
          </div>
        </div>
      </aside>

{/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
          {/* Header */}
          <header className="flex-shrink-0 border-b border-border p-2 md:p-4">
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
                  <h2 className="text-lg md:text-2xl font-semibold capitalize">
                    {currentView === "week" ? "Next 7 Days" : currentView}
                  </h2>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {useStore.getState().tasks.length} tasks
                    {useStore.getState().overdueCount > 0 && (
                      <span className="ml-2 text-red-500">
                        ({useStore.getState().overdueCount} overdue)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden md:block">
                  <ViewToggle />
                </div>
                <Button size="sm" onClick={() => useStore.getState().openCreateTask()}>
                  <span className="hidden sm:inline">+ New Task</span>
                  <span className="sm:hidden">+</span>
                </Button>
              </div>
            </div>
          </header>

          {/* Task List */}
          <ScrollArea className="flex-1 p-2 md:p-4">
            <TaskList />
          </ScrollArea>
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav />

      {/* Modals */}
      <AnimatePresence>
        {createTaskOpen && (
          <CreateTaskDialog open={createTaskOpen} onClose={closeTaskModal} />
        )}
      </AnimatePresence>

      <TaskDetailSheet />
    </div>
  );
}
