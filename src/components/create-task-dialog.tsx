"use client";

import { useState, useEffect, useMemo } from "react";
import { useStore } from "@/store";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Flag, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import * as actions from "@/app/actions";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  listId: z.string().min(1, "List is required"),
  dueDate: z.date().optional(),
  deadline: z.date().optional(),
  estimateMinutes: z.number().min(0).optional(),
  priority: z.enum(["none", "low", "medium", "high"]).default("none"),
  recurrence: z.enum(["daily", "weekly", "weekday", "monthly", "yearly", "custom"]).optional(),
  labelIds: z.array(z.string()).optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

const PRIORITIES = [
  { value: "none", label: "None", color: "default" },
  { value: "low", label: "Low", color: "green" },
  { value: "medium", label: "Medium", color: "amber" },
  { value: "high", label: "High", color: "red" },
] as const;

const RECURRENCE_OPTIONS = [
  { value: "daily", label: "Every day" },
  { value: "weekly", label: "Every week" },
  { value: "weekday", label: "Every weekday" },
  { value: "monthly", label: "Every month" },
  { value: "yearly", label: "Every year" },
  { value: "custom", label: "Custom..." },
] as const;

export function CreateTaskDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lists, labels, addTask, updateTask, editTaskId, selectedListId } = useStore();
  const [subtasks, setSubtasks] = useState<{ id?: string; title: string; completed: boolean }[]>([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);

  const isEditing = !!editTaskId;
  const editTask = isEditing ? useStore.getState().getTaskById(editTaskId) : null;

  const form = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      listId: selectedListId || "inbox",
      priority: "none",
      estimateMinutes: 0,
      recurrence: undefined,
      labelIds: [],
    },
  });

  // Reset form when dialog opens/closes or task changes
  useEffect(() => {
    if (open) {
      if (isEditing && editTask) {
        form.reset({
          title: editTask.title,
          description: editTask.description,
          listId: editTask.listId,
          dueDate: editTask.dueDate,
          deadline: editTask.deadline,
          estimateMinutes: editTask.estimateMinutes || 0,
          priority: editTask.priority,
          recurrence: editTask.recurrence as any,
          labelIds: editTask.labels?.map((l) => l.id) || [],
        });
        setSubtasks(
          editTask.subtasks?.map((s) => ({
            id: s.id,
            title: s.title,
            completed: s.completed,
          })) || []
        );
      } else {
        form.reset({
          title: "",
          description: "",
          listId: selectedListId || "inbox",
          priority: "none",
          estimateMinutes: 0,
          recurrence: undefined,
          labelIds: [],
        });
        setSubtasks([]);
      }
    }
  }, [open, editTask, isEditing, form, selectedListId]);

  const onSubmit = async (data: any) => {
    if (isEditing && editTaskId) {
      await actions.updateTaskAction(editTaskId, {
        ...data,
        due_date: data.dueDate,
        deadline: data.deadline,
        estimate_minutes: data.estimateMinutes,
        label_ids: data.labelIds,
      } as any);

      // Get existing subtasks from store
      const existingTask = useStore.getState().getTaskById(editTaskId);
      const existingSubtasks = existingTask?.subtasks || [];

      // Delete removed subtasks
      for (const st of existingSubtasks) {
        if (!subtasks.find((s) => s.id === st.id)) {
          await actions.deleteSubtaskAction(st.id);
        }
      }

      // Update/create subtasks
      for (let i = 0; i < subtasks.length; i++) {
        const st = subtasks[i];
        if (st.id) {
          await actions.updateSubtaskAction(st.id, { title: st.title, completed: st.completed, order: i });
        } else {
          await actions.createSubtaskAction(editTaskId, st.title, i);
        }
      }
    } else {
      const newTask = await actions.createTaskAction({
        ...data,
        due_date: data.dueDate,
        deadline: data.deadline,
        estimate_minutes: data.estimateMinutes,
        label_ids: data.labelIds,
      } as any);

      // Add subtasks
      for (let i = 0; i < subtasks.length; i++) {
        const st = subtasks[i];
        await actions.createSubtaskAction(newTask.id, st.title, i);
      }
    }

    onClose();
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks([...subtasks, { title: newSubtask, completed: false }]);
    setNewSubtask("");
  };

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const toggleSubtask = (index: number) => {
    const updated = [...subtasks];
    updated[index].completed = !updated[index].completed;
    setSubtasks(updated);
  };

  // Filter out already selected labels
  const availableLabels = useMemo(() => {
    const selectedIds = form.watch("labelIds") || [];
    return labels.filter((l) => !selectedIds.includes(l.id));
  }, [labels, form]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Task" : "Create New Task"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="What needs to be done?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add details..." {...field} value={field.value || ""} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Row: List + Priority + Estimate */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="listId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>List</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            <Flag className={`mr-2 h-4 w-4 text-${p.color}-500`} />
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimateMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Est. (min)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value || ""}
                        placeholder="0"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Row: Due Date + Deadline */}
            <div className="grid grid-cols-2 gap-4">
               <FormField
                 control={form.control}
                 name="dueDate"
                 render={({ field }) => (
                   <FormItem className="flex flex-col">
<FormLabel>Due Date</FormLabel>
                       <Popover>
                         <PopoverTrigger
                           render={
                             <FormControl>
                               <Button
                                 variant="outline"
                                 className={cn(
                                   "pl-3 text-left font-normal",
                                   !field.value && "text-muted-foreground"
                                 )}
                               >
                                 {field.value ? format(field.value, "MMM d, yyyy") : "Pick a date"}
                                 <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                               </Button>
                             </FormControl>
                           }
                         />
                         <PopoverContent className="w-auto p-0" align="start">
                           <Calendar
                             mode="single"
                             selected={field.value}
                             onSelect={field.onChange}
                             initialFocus
                           />
                         </PopoverContent>
                       </Popover>
                   </FormItem>
                 )}
               />

               <FormField
                 control={form.control}
                 name="deadline"
                 render={({ field }) => (
                   <FormItem className="flex flex-col">
<FormLabel>Deadline</FormLabel>
                       <Popover>
                         <PopoverTrigger
                           render={
                             <FormControl>
                               <Button
                                 variant="outline"
                                 className={cn(
                                   "pl-3 text-left font-normal",
                                   !field.value && "text-muted-foreground"
                                 )}
                               >
                                 {field.value ? format(field.value, "MMM d, yyyy") : "Pick a date"}
                                 <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                               </Button>
                             </FormControl>
                           }
                         />
                         <PopoverContent className="w-auto p-0" align="start">
                           <Calendar
                             mode="single"
                             selected={field.value}
                             onSelect={field.onChange}
                             initialFocus
                           />
                         </PopoverContent>
                       </Popover>
                   </FormItem>
                 )}
               />
            </div>

            {/* Recurrence */}
            <FormField
              control={form.control}
              name="recurrence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recurrence</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Does not repeat" />
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

            {/* Labels */}
            <div className="space-y-2">
              <FormLabel>Labels</FormLabel>
              <div className="flex flex-wrap gap-2">
                {form.watch("labelIds")?.map((labelId) => {
                  const label = labels.find((l) => l.id === labelId);
                  if (!label) return null;
                  return (
                    <Badge
                      key={label.id}
                      variant="outline"
                      style={{ borderColor: label.color, color: label.color }}
                      className="px-2 py-1"
                    >
                      {label.icon && <span className="mr-1">{label.icon}</span>}
                      {label.name}
                      <button
                        type="button"
                        onClick={() => {
                          const current = form.getValues("labelIds") || [];
                          form.setValue("labelIds", current.filter((id) => id !== labelId));
                        }}
                        className="ml-1"
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
                          <Button variant="outline" size="sm" type="button">
                            + Add Label
                          </Button>
                        }
                      />
                    <DropdownMenuContent>
                      {availableLabels.map((label) => (
                        <DropdownMenuItem
                          key={label.id}
                          onClick={() => {
                            const current = form.getValues("labelIds") || [];
                            form.setValue("labelIds", [...current, label.id]);
                          }}
                        >
                          <span className="mr-2">{label.icon}</span>
                          <span
                            className="flex-1"
                            style={{ color: label.color }}
                          >
                            {label.name}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* Subtasks */}
            <div className="space-y-2">
              <FormLabel>Subtasks</FormLabel>
              <div className="space-y-2">
                {subtasks.map((subtask, index) => (
                  <div
                    key={subtask.id || index}
                    className="flex items-center gap-2"
                  >
                    <Checkbox
                      checked={subtask.completed}
                      onCheckedChange={() => toggleSubtask(index)}
                    />
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        subtask.completed && "line-through text-muted-foreground"
                      )}
                    >
                      {subtask.title}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeSubtask(index)}
                      type="button"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add subtask..."
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSubtask();
                    }
                  }}
                />
                <Button type="button" onClick={addSubtask} size="sm">
                  Add
                </Button>
              </div>
            </div>

            {/* Attachments (placeholder) */}
            {/* For now we'll just show a placeholder */}
            <div className="space-y-2">
              <FormLabel>Attachments</FormLabel>
              <div className="border-2 border-dashed rounded-lg p-4 text-center text-sm text-muted-foreground">
                Drag & drop files or click to upload (coming soon)
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">{isEditing ? "Save Changes" : "Create Task"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
