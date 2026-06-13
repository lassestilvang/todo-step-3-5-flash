'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/store';

const DEFAULT_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b'];
const EMOJIS = ['📋', '📅', '📆', '💼', '🏠', '🛒', '🎯', '🚀', '💡', '❤️', '⭐', '🔥'];

export function CreateListDialog() {
  const [open, setOpen] = useState(false);
  const addList = useStore((s) => s.addList);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [icon, setIcon] = useState('📋');

  const handleCreate = () => {
    if (!name.trim()) return;
    addList({ name, color, icon });
    setOpen(false);
    setName('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
        aria-label="Create new list"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4" />
      </Button>
      <DialogContent className="sm:max-w-[400px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create New List</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label htmlFor="list-name" className="text-sm font-semibold">Name</Label>
            <Input
              id="list-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g. Work, Personal, Shopping"
              className="h-12 rounded-xl border-2 focus:border-primary transition-all"
            />
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Brand Color</Label>
            <div className="flex flex-wrap gap-3">
              {DEFAULT_COLORS.map((c) => (
                <button
                  key={c}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 active:scale-95 ${
                    color === c ? 'border-foreground ring-2 ring-primary ring-offset-2' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Icon</Label>
            <div className="grid grid-cols-6 gap-2">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  className={`h-10 text-xl rounded-xl border-2 transition-all hover:bg-accent ${
                    icon === emoji ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/30'
                  }`}
                  onClick={() => setIcon(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <Button onClick={handleCreate} size="lg" className="w-full rounded-xl font-bold h-12 shadow-lg shadow-primary/20">
            Create List
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}