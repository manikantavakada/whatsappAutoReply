'use client';

import { useAuth } from '@/lib/auth';
import { useBusiness } from '@/lib/business';
import { AiStatusToggle } from './AiStatusToggle';

export function Topbar({ title }: { title: string }) {
  const { user } = useAuth();
  const { profile } = useBusiness();

  return (
    <header className="flex items-center justify-between border-b border-line bg-white px-8 py-5">
      <div>
        <h1 className="font-display text-2xl text-ink">{title}</h1>
        {profile && <p className="text-sm text-ink/50">{profile.name}</p>}
      </div>
      <div className="flex items-center gap-4">
        <AiStatusToggle />
        <div className="h-9 w-9 rounded-full bg-primary-light text-center text-sm font-semibold leading-9 text-primary-dark">
          {user?.email?.[0]?.toUpperCase() ?? '?'}
        </div>
      </div>
    </header>
  );
}
