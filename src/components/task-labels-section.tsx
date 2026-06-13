'use client';

import { Tag } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { Task } from '@/types';

interface TaskLabelsSectionProps {
  labels: Task['labels'];
}

export function TaskLabelsSection({ labels }: TaskLabelsSectionProps) {
  if (!labels || labels.length === 0) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
        <Tag className="h-3.5 w-3.5" /> Labels
      </div>
      <div className="flex flex-wrap gap-2">
        {labels.map((label) => (
          <Badge
            key={label.id}
            variant="outline"
            className="rounded-lg border-2 px-3 py-1"
            style={{ borderColor: `${label.color}40`, color: label.color, backgroundColor: `${label.color}10` }}
          >
            {label.icon && <span className="mr-2">{label.icon}</span>}
            {label.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}