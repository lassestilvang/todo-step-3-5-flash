"use client";

import { useStore } from "@/store";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Flag,
  Calendar,
  Tag,
  Repeat,
  Link2,
  FileText,
  History,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle,
} from "lucide-react";
import { format, formatDistanceToNow, isToday, isTomorrow, isThisWeek } from "date-fns";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export function TaskDetailSheet() {
  const { selectedTaskId, tasks, setSelectedTask, toggleTaskComplete } = useStore();
  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  const [internalOpen, setInternalOpen] = useState(false);

  // Open sheet when a task is selected
  useEffect(() => {
    if (selectedTaskId !== null) {
      setInternalOpen(true);
    }
  }, [selectedTaskId]);

  const tasksArray = tasks.filter((t) => t.status !== "completed" || t.id === selectedTaskId);
  const currentIndex = tasksArray.findIndex((t) => t.id === selectedTaskId);
  const prevTask = currentIndex > 0 ? tasksArray[currentIndex - 1] : null;
  const nextTask = currentIndex < tasksArray.length - 1 ? tasksArray[currentIndex + 1] : null;

  const handlePrev = () => {
    if (prevTask) setSelectedTask(prevTask.id);
  };

  const handleNext = () => {
    if (nextTask) setSelectedTask(nextTask.id);
  };

  if (!selectedTask) return null;

  const getDueLabel = () => {
    const date = selectedTask.dueDate ?? selectedTask.deadline;
    if (!date) return null;
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isThisWeek(date)) return format(date, "EEEE");
    return format(date, "MMM d, yyyy");
  };

  return (
    <Sheet open={internalOpen} onOpenChange={setInternalOpen}>
      <SheetContent side="right" className="w-full max-w-xl p-0">
        <div className="flex flex-col h-full">
          {/* Header with navigation */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrev}
                disabled={!prevTask}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} of {tasksArray.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                disabled={!nextTask}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTask(null)}
            >
              Close
            </Button>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Title & complete */}
              <div className="flex items-start gap-4">
                <button
                  onClick={() => toggleTaskComplete(selectedTask.id)}
                  className="mt-1"
                >
                  {selectedTask.status === "completed" ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground" />
                  )}
                </button>
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold mb-2">{selectedTask.title}</h2>
                  {selectedTask.description && (
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {selectedTask.description}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* List */}
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedTask.list?.icon}</span>
                  <div>
                    <div className="text-xs text-muted-foreground">List</div>
                    <div className="font-medium">{selectedTask.list?.name}</div>
                  </div>
                </div>

                {/* Priority */}
                <div className="flex items-center gap-2">
                  <Flag className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Priority</div>
                    <div className="font-medium capitalize">{selectedTask.priority}</div>
                  </div>
                </div>

                {/* Due Date */}
                {getDueLabel() && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Due</div>
                      <div className="font-medium">{getDueLabel()}</div>
                      {selectedTask.dueDate && (
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(selectedTask.dueDate, { addSuffix: true })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Estimate */}
                {selectedTask.estimateMinutes && selectedTask.estimateMinutes > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Estimate</div>
                      <div className="font-medium">
                        {Math.floor(selectedTask.estimateMinutes / 60)}h {selectedTask.estimateMinutes % 60}m
                      </div>
                    </div>
                  </div>
                )}

                {/* Actual time */}
                {selectedTask.actualMinutes && selectedTask.actualMinutes > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Actual</div>
                      <div className="font-medium">
                        {Math.floor(selectedTask.actualMinutes / 60)}h {selectedTask.actualMinutes % 60}m
                      </div>
                    </div>
                  </div>
                )}

                {/* Recurrence */}
                {selectedTask.recurrence && (
                  <div className="flex items-center gap-2">
                    <Repeat className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Repeats</div>
                      <div className="font-medium capitalize">{selectedTask.recurrence}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Labels */}
              {selectedTask.labels && selectedTask.labels.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Tag className="h-4 w-4" />
                    Labels
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTask.labels.map((label) => (
                      <Badge
                        key={label.id}
                        variant="outline"
                        style={{ borderColor: label.color, color: label.color }}
                      >
                        {label.icon && <span className="mr-1">{label.icon}</span>}
                        {label.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Subtasks */}
              {selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle className="h-4 w-4" />
                    Subtasks
                  </div>
                  <div className="space-y-2">
                    {selectedTask.subtasks.map((subtask) => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <button
                          onClick={() => useStore.getState().toggleSubtask(selectedTask.id, subtask.id)}
                        >
                          {subtask.completed ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                        <span
                          className={cn(
                            subtask.completed && "line-through text-muted-foreground"
                          )}
                        >
                          {subtask.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments (placeholder) */}
              {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Link2 className="h-4 w-4" />
                    Attachments
                  </div>
                  <div className="space-y-1">
                    {selectedTask.attachments.map((att) => (
                      <div key={att.id} className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{att.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({Math.round(att.size / 1024)} KB)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Change History */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <History className="h-4 w-4" />
                  History
                </div>
                <div className="space-y-2">
                  {selectedTask.changeLogs && selectedTask.changeLogs.length > 0 ? (
                    selectedTask.changeLogs.map((log) => (
                      <div
                        key={log.id}
                        className="text-sm border-l-2 pl-3 border-muted"
                      >
                        <div className="font-medium capitalize">{log.field}</div>
                        <div className="text-muted-foreground text-xs">
                          {log.oldValue !== null && <span className="line-through">{log.oldValue}</span>}
                          {log.oldValue !== null && log.newValue !== null && " → "}
                          {log.newValue !== null && <span>{log.newValue}</span>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(log.changedAt), { addSuffix: true })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">No changes yet</div>
                  )}
                </div>
              </div>

              {/* Created/updated */}
              <div className="text-xs text-muted-foreground pt-4 border-t">
                Created {formatDistanceToNow(new Date(selectedTask.createdAt), { addSuffix: true })}
                {selectedTask.updatedAt && selectedTask.updatedAt.getTime() !== selectedTask.createdAt.getTime() && (
                  <> · Updated {formatDistanceToNow(new Date(selectedTask.updatedAt), { addSuffix: true })}</>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
