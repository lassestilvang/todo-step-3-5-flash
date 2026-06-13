'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Subtask {
  id?: string;
  title: string;
  completed: boolean;
}

interface TaskSubtasksEditorProps {
  subtasks: Subtask[];
  onSubtasksChange: (subtasks: Subtask[]) => void;
}

export function TaskSubtasksEditor({ subtasks, onSubtasksChange }: TaskSubtasksEditorProps) {
  const [newSubtask, setNewSubtask] = useState('');

  const addSubtask = (title: string) => {
    if (!title.trim()) return;
    onSubtasksChange([...subtasks, { title, completed: false }]);
    setNewSubtask('');
  };

  const removeSubtask = (index: number) => {
    onSubtasksChange(subtasks.filter((_, i) => i !== index));
  };

  const toggleSubtask = (index: number) => {
    const updated = [...subtasks];
    updated[index]!.completed = !updated[index]!.completed;
    onSubtasksChange(updated);
  };

  return (
    <div className="space-y-4 pt-4 border-t border-border/50">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Plus className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider">Subtasks</span>
      </div>

      <div className="space-y-2">
        {subtasks.map((subtask, index) => (
          <div key={subtask.id || index} className="flex items-center gap-3 p-3 rounded-2xl bg-muted/20 group">
            <Checkbox
              checked={subtask.completed}
              onCheckedChange={() => toggleSubtask(index)}
              className="rounded-full"
            />
            <span className={cn('flex-1 text-sm font-medium', subtask.completed && 'line-through text-muted-foreground/60')}>
              {subtask.title}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
              onClick={() => removeSubtask(index)}
              type="button"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Add a step..."
          value={newSubtask}
          onChange={(e) => setNewSubtask(e.target.value)}
          className="rounded-xl border-2 h-11"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addSubtask(e.currentTarget.value);
            }
          }}
        />
        <Button type="button" onClick={() => addSubtask(newSubtask)} className="rounded-xl px-6 font-bold">
          Add
        </Button>
      </div>
    </div>
  );
}