'use client';

/* eslint-disable max-lines */
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Flag, Trash2, X, Plus, Paperclip, Repeat, Type, AlignLeft, Hash, Clock } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import * as actions from '@/app/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  INBOX_LIST_ID,
  DATE_FORMATS,
  PRIORITY_VALUES,
  PRIORITY_LABELS,
  PRIORITY_TEXT_COLORS,
  RECURRENCE_VALUES,
  RECURRENCE_OPTIONS,
  STRINGS,
} from '@/constants';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  listId: z.string().min(1, 'List is required'),
  dueDate: z.date().optional(),
  deadline: z.date().optional(),
  estimateMinutes: z.number().min(0).optional(),
  priority: z.enum(PRIORITY_VALUES).default('none'),
  recurrence: z.enum(RECURRENCE_VALUES).optional(),
  labelIds: z.array(z.string()).optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

export function CreateTaskDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const lists = useStore((s) => s.lists);
  const labels = useStore((s) => s.labels);
  const editTaskId = useStore((s) => s.editTaskId);
  const selectedListId = useStore((s) => s.selectedListId);
  const tasks = useStore((s) => s.tasks);
  const [subtasks, setSubtasks] = useState<{ id?: string; title: string; completed: boolean }[]>(
    []
  );
  const [newSubtask, setNewSubtask] = useState('');
  const seededTaskIdRef = React.useRef<string | null>(null);

  const isEditing = !!editTaskId;
  const editTask = useMemo(
    () => (isEditing && editTaskId ? tasks.find((t) => t.id === editTaskId) || null : null),
    [isEditing, editTaskId, tasks]
  );

  const listDefault = selectedListId || INBOX_LIST_ID;
  const formDefaults = useMemo(
    (): TaskFormData => ({
      title: '',
      description: undefined,
      listId: listDefault,
      priority: 'none',
      dueDate: undefined,
      deadline: undefined,
      estimateMinutes: undefined,
      recurrence: undefined,
      labelIds: [] as string[],
    }),
    [listDefault]
  );

  const form = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: formDefaults,
  });

  useEffect(() => {
    if (!open) return;
    const targetId = isEditing && editTask ? editTask.id : null;
    if (targetId === seededTaskIdRef.current) return;
    seededTaskIdRef.current = targetId;

    if (isEditing && editTask) {
      form.reset({
        title: editTask.title,
        description: editTask.description,
        listId: editTask.listId,
        dueDate: editTask.dueDate,
        deadline: editTask.deadline,
        estimateMinutes: editTask.estimateMinutes || 0,
        priority: editTask.priority,
        recurrence: editTask.recurrence,
        labelIds: editTask.labels?.map((l) => l.id) || [],
      });
      setSubtasks(
        editTask.subtasks.map((s) => ({ id: s.id, title: s.title, completed: s.completed }))
      );
    } else {
      form.reset({
        title: '',
        description: undefined,
        listId: listDefault,
        priority: 'none',
        estimateMinutes: undefined,
        recurrence: undefined,
        labelIds: [],
      });
      setSubtasks([]);
    }
  }, [open, isEditing, editTask, listDefault, form]);

  const onSubmit = async (data: TaskFormData) => {
    if (isEditing && editTaskId) {
      await actions.updateTaskAction(editTaskId, {
        title: data.title,
        description: data.description,
        listId: data.listId,
        dueDate: data.dueDate,
        deadline: data.deadline,
        estimateMinutes: data.estimateMinutes,
        priority: data.priority,
        recurrence: data.recurrence,
        labelIds: data.labelIds,
      });

      const existingTask = tasks.find((t) => t.id === editTaskId);
      const existingSubtasks = existingTask?.subtasks || [];

      const deletePromises = existingSubtasks
        .filter((st) => !subtasks.some((s) => s.id === st.id))
        .map((st) => actions.deleteSubtaskAction(st.id));
      await Promise.all(deletePromises);

      const subtaskPromises = subtasks.map(async (st, i) => {
        if (st.id) {
          await actions.updateSubtaskAction(st.id, {
            title: st.title,
            completed: st.completed,
            order: i,
          });
        } else {
          await actions.createSubtaskAction(editTaskId, st.title, i);
        }
      });
      await Promise.all(subtaskPromises);
    } else {
      const newTask = await actions.createTaskAction({
        title: data.title,
        description: data.description,
        listId: data.listId,
        dueDate: data.dueDate,
        deadline: data.deadline,
        estimateMinutes: data.estimateMinutes,
        priority: data.priority,
        recurrence: data.recurrence,
        labelIds: data.labelIds,
      });

      if (!newTask) return;

      const subtaskPromises = subtasks.map((st, i) =>
        actions.createSubtaskAction(newTask.id, st.title, i)
      );
      await Promise.all(subtaskPromises);
    }

    onClose();
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks([...subtasks, { title: newSubtask, completed: false }]);
    setNewSubtask('');
  };

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const toggleSubtask = (index: number) => {
    const updated = [...subtasks];
    updated[index]!.completed = !updated[index]!.completed;
    setSubtasks(updated);
  };

  const selectedLabelIds = useWatch({ control: form.control, name: 'labelIds' }) || [];
  const availableLabels = useMemo(() => {
    return labels.filter((l) => !selectedLabelIds.includes(l.id));
  }, [labels, selectedLabelIds]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl rounded-[32px] p-0 overflow-hidden border-0 shadow-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col max-h-[90vh]">
            <div className="p-8 space-y-8 overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black tracking-tight flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                    <Plus className="w-6 h-6 text-primary-foreground" />
                  </div>
                  {isEditing ? 'Edit Task' : 'New Task'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          placeholder="Task title..." 
                          className="text-2xl font-bold h-auto py-2 border-0 focus-visible:ring-0 px-0 placeholder:text-muted-foreground/30" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <AlignLeft className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Description</span>
                      </div>
                      <FormControl>
                        <Textarea 
                          placeholder="Add more details about this task..." 
                          className="min-h-[100px] rounded-2xl bg-muted/30 border-0 focus-visible:ring-1 focus-visible:ring-primary/20 p-4 resize-none" 
                          {...field} 
                          value={field.value || ''} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Hash className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Categorization</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="listId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-bold uppercase text-muted-foreground/60">List</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="rounded-xl border-2 h-11">
                                  <SelectValue placeholder="Select list" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {lists.map((list) => (
                                  <SelectItem key={list.id} value={list.id}>
                                    <span className="mr-2">{list.icon}</span>
                                    {list.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-bold uppercase text-muted-foreground/60">Priority</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="rounded-xl border-2 h-11">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {PRIORITY_VALUES.map((p) => (
                                  <SelectItem key={p} value={p}>
                                    <Flag className={cn('mr-2 h-4 w-4 inline', PRIORITY_TEXT_COLORS[p])} />
                                    {PRIORITY_LABELS[p]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-3">
                      <FormLabel className="text-[10px] font-bold uppercase text-muted-foreground/60">Labels</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {selectedLabelIds.map((labelId) => {
                          const label = labels.find((l) => l.id === labelId);
                          if (!label) return null;
                          return (
                            <Badge
                              key={label.id}
                              variant="outline"
                              className="pl-2 pr-1 py-1 rounded-lg border-2"
                              style={{ borderColor: `${label.color}40`, color: label.color, backgroundColor: `${label.color}10` }}
                            >
                              {label.name}
                              <button
                                type="button"
                                onClick={() => {
                                  const current = form.getValues('labelIds') || [];
                                  form.setValue('labelIds', current.filter((id) => id !== labelId));
                                }}
                                className="ml-1 p-0.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          );
                        })}
                        {availableLabels.length > 0 && (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button variant="outline" size="xs" type="button" className="rounded-lg border-dashed border-2 h-7">
                                  <Plus className="h-3 w-3 mr-1" /> Label
                                </Button>
                              }
                            />
                            <DropdownMenuContent className="rounded-xl p-1">
                              {availableLabels.map((label) => (
                                <DropdownMenuItem
                                  key={label.id}
                                  className="rounded-lg"
                                  onClick={() => {
                                    const current = form.getValues('labelIds') || [];
                                    form.setValue('labelIds', [...current, label.id]);
                                  }}
                                >
                                  <span className="mr-2">{label.icon}</span>
                                  <span style={{ color: label.color }}>{label.name}</span>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Schedule</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-[10px] font-bold uppercase text-muted-foreground/60">Start Date</FormLabel>
                            <Popover>
                              <PopoverTrigger
                                render={
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn('rounded-xl border-2 h-11 px-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                                    >
                                      {field.value ? format(field.value, 'MMM d') : 'Set date'}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                }
                              />
                              <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden border-0 shadow-2xl" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                              </PopoverContent>
                            </Popover>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="estimateMinutes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-bold uppercase text-muted-foreground/60">Est. Time (min)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                className="rounded-xl border-2 h-11"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                value={field.value || ''}
                                placeholder="0"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="recurrence"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase text-muted-foreground/60 flex items-center gap-1">
                            <Repeat className="w-3 h-3" /> Recurrence
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="rounded-xl border-2 h-11">
                                <SelectValue placeholder="One-time task" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {RECURRENCE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Plus className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Subtasks</span>
                  </div>
                  
                  <div className="space-y-2">
                    {subtasks.map((subtask, index) => (
                      <div key={subtask.id || index} className="flex items-center gap-3 p-3 rounded-2xl bg-muted/20 group">
                        <Checkbox checked={subtask.completed} onCheckedChange={() => toggleSubtask(index)} className="rounded-full" />
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
                          addSubtask();
                        }
                      }}
                    />
                    <Button type="button" onClick={addSubtask} className="rounded-xl px-6 font-bold">Add</Button>
                  </div>
                </div>

                <div className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-4">
                    <Paperclip className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Attachments</span>
                  </div>
                  <div className="border-2 border-dashed rounded-3xl p-8 text-center text-sm text-muted-foreground bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer">
                    Click or drag files here to attach
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 bg-muted/30 border-t border-border/50 flex flex-row justify-between gap-4">
              <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl font-bold px-8">
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl font-bold px-12 h-12 shadow-xl shadow-primary/20">
                {isEditing ? 'Save Changes' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

