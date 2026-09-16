/* eslint-disable max-lines, complexity */
'use client';

import { 
  Palette, 
  Volume2, 
  Bell, 
  Keyboard, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  CheckCircle2, 
  VolumeX 
} from 'lucide-react';
import { useTheme } from 'next-themes';
import React, { useState } from 'react';

import { useToast } from '@/components/toast-provider';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useStore } from '@/store';

const THEME_ACCENTS = [
  { name: 'Default Indigo', value: 'oklch(0.55 0.25 260)' },
  { name: 'Emerald', value: 'oklch(0.6 0.18 160)' },
  { name: 'Rose Red', value: 'oklch(0.6 0.2 15)' },
  { name: 'Amber Gold', value: 'oklch(0.7 0.2 70)' },
  { name: 'Cyan Sea', value: 'oklch(0.6 0.16 220)' },
  { name: 'Violet Dusk', value: 'oklch(0.5 0.2 300)' },
  { name: 'Teal Forest', value: 'oklch(0.6 0.15 190)' },
];

const TAG_PALETTE = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#6b7280', // Slate
];

export function SettingsView() {
  const { theme, setTheme } = useTheme();
  const brandColor = useStore((s) => s.brandColor);
  const setBrandColor = useStore((s) => s.setBrandColor);
  const soundEnabled = useStore((s) => s.soundEnabled);
  const setSoundEnabled = useStore((s) => s.setSoundEnabled);
  const notificationsEnabled = useStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = useStore((s) => s.setNotificationsEnabled);
  const shortcutsHelperEnabled = useStore((s) => s.shortcutsHelperEnabled);
  const setShortcutsHelperEnabled = useStore((s) => s.setShortcutsHelperEnabled);

  // Label management
  const labels = useStore((s) => s.labels);
  const addLabel = useStore((s) => s.addLabel);
  const deleteLabel = useStore((s) => s.deleteLabel);
  
  // Custom tag form
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_PALETTE[0] || '#ef4444');
  
  const { showToast } = useToast();

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) {
      showToast('info', 'Tag name cannot be empty');
      return;
    }
    
    // Check if tag already exists
    if (labels.some((l) => l.name.toLowerCase() === newTagName.trim().toLowerCase())) {
      showToast('info', 'A tag with this name already exists');
      return;
    }

    try {
      await addLabel(newTagName.trim(), newTagColor);
      setNewTagName('');
      showToast('success', `Created tag "${newTagName.trim()}"`);
    } catch {
      showToast('error', 'Failed to create tag');
    }
  };

  const handleDeleteTag = async (id: string, name: string) => {
    try {
      await deleteLabel(id);
      showToast('success', `Deleted tag "${name}"`);
    } catch {
      showToast('error', 'Failed to delete tag');
    }
  };

  // Export database as JSON
  const handleExportJSON = () => {
    try {
      const state = useStore.getState();
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        tasks: state.tasks,
        lists: state.lists,
        labels: state.labels,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `taskplanner-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showToast('success', 'Backup exported successfully!');
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to export backup file.');
    }
  };

  // Import database from JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importData = JSON.parse(event.target?.result as string);
        if (!importData || !Array.isArray(importData.tasks) || !Array.isArray(importData.lists)) {
          showToast('error', 'Invalid backup file format');
          return;
        }

        const confirmImport = window.confirm(
          `Are you sure you want to import ${importData.tasks.length} tasks and ${importData.lists.length} lists? This will merge with your current data.`
        );

        if (!confirmImport) return;

        // Perform merge by triggering actions
        // To be safe and clean, we iterate and import them.
        const store = useStore.getState();
        
        // Import lists
        for (const list of importData.lists) {
          if (!store.lists.some((l) => l.id === list.id || l.name === list.name)) {
            await store.addList({
              name: list.name,
              color: list.color,
              icon: list.icon,
            });
          }
        }

        // Import labels
        for (const label of importData.labels || []) {
          if (!store.labels.some((l) => l.id === label.id || l.name === label.name)) {
            await store.addLabel(label.name, label.color, label.icon);
          }
        }

        // Import tasks
        // Reload all data at the end
        const freshStore = useStore.getState();
        const defaultListId = freshStore.lists[0]?.id || 'inbox';
        
        for (const task of importData.tasks) {
          if (!store.tasks.some((t) => t.id === task.id || (t.title === task.title && t.createdAt === task.createdAt))) {
            const listExists = freshStore.lists.find((l) => l.id === task.listId || l.name === task.list?.name);
            const targetListId = listExists ? listExists.id : defaultListId;
            
            // Map imported labels back to existing store label IDs
            const mappedLabelIds = (task.labels || [])
              .map((lbl: any) => freshStore.labels.find((l) => l.name === lbl.name)?.id)
              .filter(Boolean) as string[];

            await freshStore.addTask({
              title: task.title,
              description: task.description,
              listId: targetListId,
              dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
              deadline: task.deadline ? new Date(task.deadline) : undefined,
              priority: task.priority,
              estimateMinutes: task.estimateMinutes,
              recurrence: task.recurrence,
              labelIds: mappedLabelIds,
            });
          }
        }

        await useStore.getState().loadData();
        showToast('success', 'Backup imported and merged successfully!');
      } catch (err) {
        console.error(err);
        showToast('error', 'Failed to import backup. Please check file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black tracking-tight mb-2">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Personalize themes, shortcuts, audio cues, and manage your custom tags
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Accent and Color theme */}
          <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" /> Visual Customization
            </h3>
            
            <div className="space-y-3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Brand Accent Color
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
                {THEME_ACCENTS.map((accent) => {
                  const isActive = brandColor === accent.value;
                  return (
                    <button
                      key={accent.value}
                      onClick={() => setBrandColor(accent.value)}
                      className="group relative flex flex-col items-center gap-1.5 focus:outline-none"
                      title={accent.name}
                    >
                      <div
                        className="w-10 h-10 rounded-2xl transition-all duration-300 group-hover:scale-105 active:scale-95 shadow-md flex items-center justify-center border-2 border-transparent"
                        style={{ 
                          backgroundColor: accent.value,
                          borderColor: isActive ? 'var(--foreground)' : 'transparent'
                        }}
                      >
                        {isActive && <CheckCircle2 className="h-5 w-5 text-white drop-shadow" />}
                      </div>
                      <span className="text-[9px] text-muted-foreground text-center line-clamp-1 w-full font-medium">
                        {accent.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-border/50 pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Appearance Theme</div>
                  <div className="text-xs text-muted-foreground">Switch between light, dark, or system preferences</div>
                </div>
                <div className="flex gap-1.5 bg-muted p-1 rounded-xl">
                  {['light', 'dark', 'system'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`text-xs px-3 py-1.5 rounded-lg capitalize font-bold transition-all ${
                        theme === t 
                          ? 'bg-background shadow text-foreground' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sound & Notifications */}
          <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-primary" /> Sounds & Notifications
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold flex items-center gap-1.5">
                    {soundEnabled ? <Volume2 className="h-4 w-4 text-green-500" /> : <VolumeX className="h-4 w-4 text-red-500" />}
                    Audible Audio Cues
                  </div>
                  <div className="text-xs text-muted-foreground">Play alerts when a Pomodoro ends or task is completed</div>
                </div>
                <Switch 
                  checked={soundEnabled} 
                  onCheckedChange={setSoundEnabled} 
                />
              </div>

              <div className="border-t border-border/50 pt-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold flex items-center gap-1.5">
                    <Bell className="h-4 w-4 text-primary" /> Push Notifications
                  </div>
                  <div className="text-xs text-muted-foreground">Receive browser-level notifications for focus milestones</div>
                </div>
                <Switch 
                  checked={notificationsEnabled} 
                  onCheckedChange={setNotificationsEnabled} 
                />
              </div>
            </div>
          </div>

          {/* Shortcuts Overlay Toggle */}
          <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Keyboard className="h-5 w-5 text-primary" /> Power User Features
            </h3>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Shortcuts Helper Button</div>
                <div className="text-xs text-muted-foreground">Display the floating keyboard cheat sheet widget at bottom-right</div>
              </div>
              <Switch 
                checked={shortcutsHelperEnabled} 
                onCheckedChange={setShortcutsHelperEnabled} 
              />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Custom Tags / Labels */}
          <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> Tag & Label Management
            </h3>

            {/* Create Tag Form */}
            <form onSubmit={handleCreateTag} className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New tag name (e.g. Work, Coding)"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-xl bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary h-11 text-sm font-medium"
                />
                <Button type="submit" className="rounded-xl px-4 h-11 font-bold">
                  Add Tag
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Pick Color</label>
                <div className="flex flex-wrap gap-2">
                  {TAG_PALETTE.map((color) => {
                    const isSelected = newTagColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewTagColor(color)}
                        className={`w-6 h-6 rounded-full transition-all flex items-center justify-center border ${
                          isSelected ? 'scale-110 ring-2 ring-primary border-transparent' : 'opacity-80 hover:opacity-100 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                        aria-label={`Color ${color}`}
                      >
                        {isSelected && <span className="text-[10px] text-white">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </form>

            {/* Tag List */}
            <div className="border-t border-border/50 pt-4 space-y-3">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Current Tags ({labels.length})</label>
              {labels.length === 0 ? (
                <div className="text-xs text-muted-foreground italic text-center py-4">No custom tags created yet.</div>
              ) : (
                <div className="max-h-48 overflow-y-auto pr-2 space-y-2">
                  {labels.map((label) => (
                    <div 
                      key={label.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: label.color }} />
                        <span className="text-sm font-semibold">{label.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDeleteTag(label.id, label.name)}
                        className="rounded-lg hover:text-red-500 hover:bg-red-500/10"
                        title="Delete Tag"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sync, Backup, CSV Export */}
          <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" /> Data Backup & Synchronization
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={handleExportJSON}
                variant="outline"
                className="rounded-2xl h-20 flex flex-col justify-center items-center gap-2 border-2 hover:bg-muted/30 transition-all font-bold text-xs"
              >
                <Download className="h-5 w-5 text-green-500" />
                Export JSON Backup
              </Button>

              <label 
                className="border-2 border-dashed rounded-2xl h-20 flex flex-col justify-center items-center gap-2 hover:bg-muted/30 cursor-pointer transition-all text-xs font-bold text-muted-foreground hover:text-foreground text-center"
              >
                <Upload className="h-5 w-5 text-primary" />
                Import JSON Backup
                <input 
                  type="file" 
                  accept=".json"
                  onChange={handleImportJSON} 
                  className="hidden" 
                />
              </label>
            </div>
            
            <p className="text-[10px] text-muted-foreground text-center">
              JSON Backups contain lists, tags, and tasks that you can merge.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
