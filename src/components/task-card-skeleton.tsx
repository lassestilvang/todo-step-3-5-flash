import React from 'react';

export function TaskCardSkeleton() {
  return (
    <div className="w-full rounded-lg border bg-card p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 h-5 w-5 shrink-0 rounded border border-border" />
        <div className="flex-1 min-w-0 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="h-4 flex-1 rounded bg-muted" />
            <div className="h-6 w-6 rounded bg-muted" />
          </div>
          <div className="h-3 w-3/4 rounded bg-muted/60" />
          <div className="flex flex-wrap gap-2">
            <div className="h-5 w-14 rounded-full bg-muted/50" />
            <div className="h-5 w-16 rounded-full bg-muted/50" />
            <div className="h-5 w-10 rounded-full bg-muted/50" />
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted/40" />
        </div>
      </div>
    </div>
  );
}
