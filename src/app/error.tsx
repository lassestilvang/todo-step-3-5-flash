'use client';

import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <main role="alertdialog" aria-live="assertive" aria-describedby="error-description" className="flex items-center justify-center min-h-screen p-4">
      <div className="flex flex-col items-center gap-5 p-8 text-center max-w-md">
        <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-7" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p id="error-description" className="text-muted-foreground text-sm leading-relaxed">
            An unexpected error occurred. Please try again or refresh the page.
          </p>
        </div>
        <Button onClick={reset} variant="default" className="gap-2">
          <RefreshCcw className="size-4" />
          Try again
        </Button>
      </div>
    </main>
  );
}
