'use client';

import { AlignLeft } from 'lucide-react';
import type { FieldValues } from 'react-hook-form';

import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface TaskBasicFieldsProps<T extends FieldValues> {
  form: {
    control: T['control'];
  };
}

export function TaskBasicFields<T extends FieldValues>({ form }: TaskBasicFieldsProps<T>) {
  return (
    <>
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
    </>
  );
}