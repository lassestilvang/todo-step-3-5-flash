'use client';

import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: undefined };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    // In production, send to an error-reporting service here
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <main
          role="alertdialog"
          aria-live="assertive"
          aria-label="Application error"
          aria-describedby="error-message"
          className="flex min-h-screen items-center justify-center bg-background p-4"
        >
          <div className="flex flex-col items-center gap-4 text-center max-w-sm">
            <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="size-7" />
            </div>
            <h1 className="text-2xl font-semibold">Something went wrong</h1>
            <p id="error-message" className="text-muted-foreground text-sm leading-relaxed">
              An unexpected error occurred. Please try again or refresh the page.
            </p>
            <button
              type="button"
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <RefreshCcw className="size-4" />
              Try again
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
