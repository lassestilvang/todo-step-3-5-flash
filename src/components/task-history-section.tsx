'use client';

import { formatDistanceToNow } from 'date-fns';
import { History } from 'lucide-react';

import type { Task } from '@/types';

export function TaskHistorySection({ changeLogs }: { changeLogs: Task['changeLogs'] }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <History className="h-4 w-4" /> History
      </div>
      <div className="space-y-2">
        {changeLogs && changeLogs.length > 0 ? (
          changeLogs.map((log) => (
            <div key={log.id} className="text-sm border-l-2 pl-3 border-muted">
              <div className="font-medium capitalize">{log.field}</div>
              <div className="text-muted-foreground text-xs">
                {log.oldValue !== null && <span className="line-through">{log.oldValue}</span>}
                {log.oldValue !== null && log.newValue !== null && ' → '}
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
  );
}
