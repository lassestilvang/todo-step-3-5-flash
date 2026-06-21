import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import './globals.css';
import { BrandThemeProvider } from '@/components/brand-theme-provider';
import { ErrorBoundary } from '@/components/error-boundary';
import { RegisterServiceWorker } from '@/components/register-sw';
import { ThemeProvider } from '@/components/theme-provider';
import { ToastProvider } from '@/components/toast-provider';
import { TooltipProvider } from '@/components/ui/tooltip';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: { default: 'TaskPlanner - Daily Task Manager', template: '%s | TaskPlanner' },
  description:
    'A modern, professional daily task planner to organize your day, boost productivity, and manage tasks with ease.',
  applicationName: 'TaskPlanner',
  keywords: ['task planner', 'productivity', 'todo', 'daily planner', 'task management'],
  authors: [{ name: 'TaskPlanner' }],
  creator: 'TaskPlanner',
  publisher: 'TaskPlanner',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'TaskPlanner' },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'TaskPlanner',
    title: 'TaskPlanner - Daily Task Manager',
    description: 'A modern, professional daily task planner to organize your day.',
    images: [{ url: '/icon.svg', width: 512, height: 512 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TaskPlanner - Daily Task Manager',
    description: 'A modern, professional daily task planner to organize your day.',
    images: ['/icon.svg'],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <BrandThemeProvider>
            <ErrorBoundary>
              <TooltipProvider>
                <ToastProvider>
                  <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[999] focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-xl"
                  >
                    Skip to main content
                  </a>
                  {/* Screen reader announcements */}
                  <div aria-live="polite" aria-atomic="true" className="sr-only" />
                  {children}
                  <RegisterServiceWorker />
                </ToastProvider>
              </TooltipProvider>
            </ErrorBoundary>
          </BrandThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
