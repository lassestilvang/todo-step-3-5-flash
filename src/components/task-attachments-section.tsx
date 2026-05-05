'use client';

import { Link2, FileText } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { Task } from '@/types';

export function TaskAttachmentsSection({ attachments }: { attachments: Task['attachments'] }) {
  if (!attachments || attachments.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Link2 className="h-4 w-4" /> Attachments
      </div>
      <div className="space-y-1">
        {attachments.map((att) => (
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
  );
}
