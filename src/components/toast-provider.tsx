'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Undo } from 'lucide-react';
import { createContext, useContext, useState, useCallback } from 'react';

import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string, action?: { label: string; onClick: () => void }) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export const showToast = (type: ToastType, message: string, action?: { label: string; onClick: () => void }) => {
  console.warn('showToast called outside of ToastProvider context');
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string, action?: { label: string; onClick: () => void }) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, message, action }]);
    if (!action) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    }
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const iconMap = {
    success: <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />,
    error: <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />,
    info: <Info className="h-4 w-4 text-blue-500 shrink-0" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />,
  };

  const bgMap = {
    success: 'border-green-500/30 bg-green-500/5',
    error: 'border-red-500/30 bg-red-500/5',
    info: 'border-blue-500/30 bg-blue-500/5',
    warning: 'border-amber-500/30 bg-amber-500/5',
  };

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 max-w-sm">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl',
                bgMap[toast.type]
              )}
            >
              {iconMap[toast.type]}
              <p className="text-sm font-medium flex-1">{toast.message}</p>
              {toast.action ? (
                <button
                  onClick={toast.action.onClick}
                  className="shrink-0 rounded-lg p-1 hover:bg-muted transition-colors text-primary font-medium text-xs flex items-center gap-1"
                  aria-label={toast.action.label}
                >
                  <Undo className="h-3.5 w-3.5" />
                  {toast.action.label}
                </button>
              ) : (
                <button
                  onClick={() => dismissToast(toast.id)}
                  className="shrink-0 rounded-lg p-1 hover:bg-muted transition-colors"
                  aria-label="Dismiss notification"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
