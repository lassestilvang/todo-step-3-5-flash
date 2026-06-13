import React from 'react';

export function TaskCardSkeleton() {
  return (
    <div className="w-full rounded-2xl border bg-card p-5 animate-pulse hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="flex items-start gap-4">
        <div className="mt-0.5 h-6 w-6 shrink-0 rounded-full border-2 border-border" />
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="h-5 flex-1 rounded-lg bg-muted" />
            <div className="h-6 w-6 rounded-lg bg-muted ml-2" />
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