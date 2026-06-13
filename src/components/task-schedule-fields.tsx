'use client';

import { format } from 'date-fns';
import { CalendarIcon, Clock, Repeat } from 'lucide-react';
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RECURRENCE_OPTIONS } from '@/constants';
import { cn } from '@/lib/utils';

interface TaskScheduleFieldsProps<T extends FieldValues> {
  form: UseFormReturn<T>;
}

export function TaskScheduleFields<T extends FieldValues>({ form }: TaskScheduleFieldsProps<T>) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider">Schedule</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={'dueDate' as Path<T>}
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
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={'estimateMinutes' as Path<T>}
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
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name={'recurrence' as Path<T>}
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
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}