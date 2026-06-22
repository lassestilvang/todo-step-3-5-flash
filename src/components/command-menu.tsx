'use client';

import {
  Search,
  Plus,
  Calendar,
  Layers,
  CheckCircle,
  BarChart,
  Grid,
  Sun,
  Moon,
  Laptop,
  Volume2,
  Bell,
  Play,
  Pause,
  RotateCcw,
  Download,
  Palette,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import * as React from 'react';

import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from '@/components/ui/command';
import { useStore } from '@/store';

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const { setTheme } = useTheme();

  // Store selector hooks
  const tasks = useStore((s) => s.tasks);
  const brandColor = useStore((s) => s.brandColor);
  const soundEnabled = useStore((s) => s.soundEnabled);
  const notificationsEnabled = useStore((s) => s.notificationsEnabled);
  const focusTimerActive = useStore((s) => s.focusTimer.isActive);

  // Store actions
  const openCreateTask = useStore((s) => s.openCreateTask);
  const setCurrentView = useStore((s) => s.setCurrentView);
  const setSelectedList = useStore((s) => s.setSelectedList);
  const setSelectedTask = useStore((s) => s.setSelectedTask);
  const setBrandColor = useStore((s) => s.setBrandColor);
  const setSoundEnabled = useStore((s) => s.setSoundEnabled);
  const setNotificationsEnabled = useStore((s) => s.setNotificationsEnabled);
  const startFocusTimer = useStore((s) => s.startFocusTimer);
  const pauseFocusTimer = useStore((s) => s.pauseFocusTimer);
  const resetFocusTimer = useStore((s) => s.resetFocusTimer);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = React.useCallback((action: () => void) => {
    action();
    setOpen(false);
  }, []);

  const colors = [
    { name: 'Default Blue', value: 'oklch(0.55 0.25 260)' },
    { name: 'Emerald', value: 'oklch(0.6 0.18 160)' },
    { name: 'Rose', value: 'oklch(0.6 0.2 15)' },
    { name: 'Amber', value: 'oklch(0.7 0.2 70)' },
    { name: 'Cyan', value: 'oklch(0.6 0.16 220)' },
    { name: 'Violet', value: 'oklch(0.5 0.2 300)' },
  ];

  // Active / incomplete tasks for quick selection
  const activeTasks = React.useMemo(() => {
    return tasks.filter((t) => t.status !== 'completed').slice(0, 5);
  }, [tasks]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-40 hidden md:flex items-center gap-2 px-3 py-2 rounded-2xl bg-background/80 backdrop-blur-xl border border-border/50 shadow-2xl text-xs font-medium text-muted-foreground hover:text-foreground transition-all hover:scale-105 active:scale-95 animate-fade-in"
        aria-label="Open command menu"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Menu</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-bold text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search tasks..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          {activeTasks.length > 0 && (
            <CommandGroup heading="Active Tasks">
              {activeTasks.map((task) => (
                <CommandItem
                  key={task.id}
                  value={`task-${task.title}`}
                  onSelect={() =>
                    runCommand(() => {
                      setSelectedTask(task.id);
                    })
                  }
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>{task.title}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandGroup heading="Quick Actions">
            <CommandItem
              value="create task"
              onSelect={() => runCommand(() => openCreateTask())}
            >
              <Plus />
              <span>Create Task</span>
              <CommandShortcut>N</CommandShortcut>
            </CommandItem>
            
            <CommandItem
              value="export tasks as csv"
              onSelect={() =>
                runCommand(() => {
                  window.open('/api/export', '_blank');
                })
              }
            >
              <Download />
              <span>Export to CSV</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Views">
            <CommandItem
              value="view today"
              onSelect={() =>
                runCommand(() => {
                  setCurrentView('today');
                  setSelectedList(null);
                })
              }
            >
              <Calendar />
              <span>Today View</span>
              <CommandShortcut>2</CommandShortcut>
            </CommandItem>
            <CommandItem
              value="view all tasks"
              onSelect={() =>
                runCommand(() => {
                  setCurrentView('all');
                  setSelectedList(null);
                })
              }
            >
              <Layers />
              <span>All Tasks View</span>
              <CommandShortcut>1</CommandShortcut>
            </CommandItem>
            <CommandItem
              value="view in progress"
              onSelect={() =>
                runCommand(() => {
                  setCurrentView('in_progress');
                  setSelectedList(null);
                })
              }
            >
              <Grid />
              <span>In Progress View</span>
              <CommandShortcut>3</CommandShortcut>
            </CommandItem>
            <CommandItem
              value="view completed"
              onSelect={() =>
                runCommand(() => {
                  setCurrentView('completed');
                  setSelectedList(null);
                })
              }
            >
              <CheckCircle />
              <span>Completed View</span>
              <CommandShortcut>4</CommandShortcut>
            </CommandItem>
            <CommandItem
              value="view kanban board"
              onSelect={() =>
                runCommand(() => {
                  setCurrentView('board');
                  setSelectedList(null);
                })
              }
            >
              <Grid />
              <span>Kanban Board</span>
            </CommandItem>
            <CommandItem
              value="view statistics"
              onSelect={() =>
                runCommand(() => {
                  setCurrentView('statistics');
                  setSelectedList(null);
                })
              }
            >
              <BarChart />
              <span>Productivity Statistics</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Focus Timer">
            {focusTimerActive ? (
              <CommandItem
                value="pause focus timer"
                onSelect={() => runCommand(() => pauseFocusTimer())}
              >
                <Pause />
                <span>Pause Focus Timer</span>
                <CommandShortcut>Space</CommandShortcut>
              </CommandItem>
            ) : (
              <CommandItem
                value="start focus timer"
                onSelect={() => runCommand(() => startFocusTimer())}
              >
                <Play />
                <span>Start Focus Timer</span>
                <CommandShortcut>Space</CommandShortcut>
              </CommandItem>
            )}
            <CommandItem
              value="reset focus timer"
              onSelect={() => runCommand(() => resetFocusTimer())}
            >
              <RotateCcw />
              <span>Reset Focus Timer</span>
              <CommandShortcut>R</CommandShortcut>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Theme Settings">
            <CommandItem value="theme light" onSelect={() => runCommand(() => setTheme('light'))}>
              <Sun />
              <span>Light Theme</span>
            </CommandItem>
            <CommandItem value="theme dark" onSelect={() => runCommand(() => setTheme('dark'))}>
              <Moon />
              <span>Dark Theme</span>
            </CommandItem>
            <CommandItem value="theme system" onSelect={() => runCommand(() => setTheme('system'))}>
              <Laptop />
              <span>System Theme</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Brand Accent Colors">
            {colors.map((color) => (
              <CommandItem
                key={color.value}
                value={`color ${color.name.toLowerCase()}`}
                onSelect={() => runCommand(() => setBrandColor(color.value))}
                data-checked={brandColor === color.value}
              >
                <Palette className="h-4 w-4" style={{ color: color.value }} />
                <span>{color.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Sound & Notifications">
            <CommandItem
              value="toggle sound effects"
              onSelect={() => runCommand(() => setSoundEnabled(!soundEnabled))}
              data-checked={soundEnabled}
            >
              <Volume2 />
              <span>Sound Effects</span>
            </CommandItem>
            <CommandItem
              value="toggle notifications"
              onSelect={() => runCommand(() => setNotificationsEnabled(!notificationsEnabled))}
              data-checked={notificationsEnabled}
            >
              <Bell />
              <span>Browser Notifications</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
