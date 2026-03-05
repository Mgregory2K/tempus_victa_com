'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
import { twinPlusKernel } from '@/core/twin_plus/twin_plus_kernel';

export default function ClientShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Force-unregister any old service workers to prevent caching issues
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
    }

    // Initialize the Twin+ Kernel
    twinPlusKernel.init();
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}
