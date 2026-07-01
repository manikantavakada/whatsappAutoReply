'use client';

import { RequireAuth } from '@/lib/auth';
import { BusinessProvider } from '@/lib/business';
import { Sidebar } from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <BusinessProvider>
        <div className="flex">
          <Sidebar />
          <main className="min-h-screen flex-1 bg-paper">{children}</main>
        </div>
      </BusinessProvider>
    </RequireAuth>
  );
}
