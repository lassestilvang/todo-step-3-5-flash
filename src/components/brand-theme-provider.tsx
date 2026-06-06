'use client';

import { useEffect } from 'react';

import { useStore } from '@/store';

export function BrandThemeProvider({ children }: { children: React.ReactNode }) {
  const brandColor = useStore((s) => s.brandColor);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--primary', brandColor);
      document.documentElement.style.setProperty('--ring', brandColor);
      document.documentElement.style.setProperty('--sidebar-primary', brandColor);
      document.documentElement.style.setProperty('--sidebar-ring', brandColor);
    }
  }, [brandColor]);

  return <>{children}</>;
}
