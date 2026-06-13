'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Paperclip } from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import * as actions from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { INBOX_LIST_ID } from '@/constants';
import { useStore } from '@/store';
import type { Subtask as SubtaskType, Task } from '@/types';

import { TaskBasicFields } from './task-basic-fields';
import { TaskCategorizationFields } from './task-categorization-fields';
import { TaskScheduleFields } from './task-schedule-fields';
import { TaskSubtasksEditor } from './task-subtasks-editor';

const RECURRENCE_VALUES = ['daily', 'weekly', 'weekday', 'monthly', 'yearly', 'custom'] as const;

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  listId: z.string().min(1, 'List is required'),
  dueDate: z.date().optional(),
  deadline: z.date().optional(),
  estimateMinutes: z.number().min(0).optional(),
  priority: z.enum(['none', 'low', 'medium', 'high']).default('none'),
  recurrence: z.enum(RECURRENCE_VALUES).optional(),
  labelIds: z.array(z.string()).optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

function getFormDefaults(
  isEditing: boolean,
  editTask: Task | null,
  listDefault: string
): TaskFormData {
  if (!isEditing || !editTask) {
    return {
      title: '',
      description: undefined,
      listId: listDefault,
      dueDate: undefined,
      deadline: undefined,
      estimateMinutes: undefined,
      priority: 'none',
      recurrence: undefined,
      labelIds: [],
    };
  }
  return {
    title: editTask.title,
    description: editTask.description,
    listId: editTask.listId,
    dueDate: editTask.dueDate,
    deadline: editTask.deadline,
    estimateMinutes: editTask.estimateMinutes,
    priority: editTask.priority,
    recurrence: editTask.recurrence,
    labelIds: editTask.labels?.map((l) => l.id) || [],
  };
}

export function CreateTaskDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const lists = useStore((s) => s.lists);
  const labels = useStore((s) => s.labels);
  const editTaskId = useStore((s) => s.editTaskId);
  const selectedListId = useStore((s) => s.selectedListId);
  const tasks = useStore((s) => s.tasks);
  const addTask = useStore((s) => s.addTask);

  const isEditing = !!editTaskId;
  const editTask = useMemo(
    () => (isEditing && editTaskId ? tasks.find((t) => t.id === editTaskId) || null : null),
    [isEditing, editTaskId, tasks]
  );

  const [subtasks, setSubtasks] = useState<SubtaskType[]>(() => {
    if (isEditing && editTask) {
      return editTask.subtasks;
    }
    return [];
  });

  const listDefault = selectedListId || INBOX_LIST_ID;
  const formDefaults = useMemo(() => getFormDefaults(isEditing, editTask, listDefault), [isEditing, editTask, listDefault]);

  const form = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: formDefaults,
  });

  const handleSubmit = useCallback(async (data: TaskFormData) => {
    if (isEditing && editTaskId) {
      await submitEditTask(editTaskId, data, subtasks, tasks);
    } else {
      await submitNewTask(data, subtasks, addTask);
    }
    onClose();
  }, [isEditing, editTaskId, subtasks, tasks, addTask, onClose]);

  const selectedLabelIds = useWatch({ control: form.control, name: 'labelIds' }) || [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent key={editTaskId || 'new'} className="max-w-3xl rounded-[32px] p-0 overflow-hidden border-0 shadow-2xl">
        <Form {...form}>
          <form onSubmit={(e) => void form.handleSubmit(handleSubmit)(e)} className="flex flex-col max-h-[90vh]">
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
                <TaskBasicFields form={form} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <TaskCategorizationFields
                    form={form}
                    lists={lists}
                    labels={labels}
                    selectedLabelIds={selectedLabelIds}
                  />
                  <TaskScheduleFields form={form} />
                </div>

                <TaskSubtasksEditor
                  subtasks={subtasks}
                  onSubtasksChange={setSubtasks}
                />

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

async function submitEditTask(
  editTaskId: string,
  data: TaskFormData,
  subtasks: SubtaskType[],
  tasks: { id: string; subtasks: SubtaskType[] }[]
) {
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
}

async function submitNewTask(data: TaskFormData, subtasks: SubtaskType[], addTask: (d: TaskFormData) => Promise<unknown>) {
  const newTask = await addTask({
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

  if (!newTask || typeof newTask !== 'object' || !('id' in newTask)) return;

  const subtaskPromises = subtasks.map((st, i) =>
    actions.createSubtaskAction((newTask as { id: string }).id, st.title, i)
  );
  await Promise.all(subtaskPromises);
}