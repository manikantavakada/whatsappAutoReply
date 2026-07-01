'use client';

import { useEffect, useState } from 'react';
import { Topbar } from '@/components/Topbar';
import { StatCard } from '@/components/StatCard';
import { SetupChecklist } from '@/components/SetupChecklist';
import { useBusiness } from '@/lib/business';
import { api } from '@/lib/api';
import type { Product } from '@/lib/types';

export default function OverviewPage() {
  const { profile, overview, loading } = useBusiness();
  const [productCount, setProductCount] = useState<number | null>(null);

  useEffect(() => {
    api
      .get<Product[]>('/products')
      .then((products) => setProductCount(products.length))
      .catch(() => setProductCount(0));
  }, []);

  return (
    <div>
      <Topbar title="Overview" />
      <div className="flex flex-col gap-6 p-8">
        {profile && (
          <SetupChecklist
            steps={[
              { label: 'Connect your WhatsApp number', done: profile.waConnected, href: '/dashboard/settings' },
              { label: 'Add at least one product', done: (productCount ?? 0) > 0, href: '/dashboard/products' },
            ]}
          />
        )}

        {loading || !overview ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-lg bg-line/60" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Conversations" value={String(overview.totalConversations)} hint="Unique customers" />
            <StatCard label="Messages sent & received" value={String(overview.totalMessages)} />
            <StatCard label="In the last 24 hours" value={String(overview.messagesLast24h)} />
            <StatCard
              label="Handled by AI"
              value={`${overview.aiHandledShare}%`}
              hint={overview.openHandoffs > 0 ? `${overview.openHandoffs} chat${overview.openHandoffs > 1 ? 's' : ''} need you` : 'No handoffs waiting'}
            />
          </div>
        )}

        <div className="rounded-lg border border-line bg-white p-6 shadow-card">
          <p className="font-display text-lg text-ink">How this works</p>
          <p className="mt-2 max-w-2xl text-sm text-ink/60">
            Customers message your WhatsApp number as usual. As long as the AI toggle at the top
            right is on, your assistant replies instantly using the products you've added. Reply
            to any chat yourself from Conversations any time — the AI steps aside for that
            customer automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
