'use client';

import { Hash, Flag, Plus, X } from 'lucide-react';
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PRIORITY_VALUES, PRIORITY_LABELS, PRIORITY_TEXT_COLORS } from '@/constants';
import { cn } from '@/lib/utils';
import type { Label as LabelType } from '@/types';

type LabelIdsFieldValues = { labelIds: string[] };

interface TaskCategorizationFieldsProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  lists: { id: string; name: string; icon: string }[];
  labels: LabelType[];
  selectedLabelIds: string[];
}

export function TaskCategorizationFields<T extends FieldValues>({ form, lists, labels, selectedLabelIds }: TaskCategorizationFieldsProps<T>) {
  const availableLabels = labels.filter((l) => !selectedLabelIds.includes(l.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Hash className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider">Categorization</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={'listId' as Path<T>}
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
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={'priority' as Path<T>}
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
              <FormMessage />
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
                    const current = form.getValues('labelIds' as Path<LabelIdsFieldValues>) as string[];
                    const updated = current.filter((id) => id !== labelId);
                    form.setValue('labelIds', updated);
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
                      const current = form.getValues('labelIds' as Path<LabelIdsFieldValues>) as string[];
                      const updated = [...current, label.id];
                      form.setValue('labelIds', updated);
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
  );
}