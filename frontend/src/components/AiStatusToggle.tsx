'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { useBusiness } from '@/lib/business';

export function AiStatusToggle() {
  const { profile, updateProfile } = useBusiness();
  const [pending, setPending] = useState(false);

  if (!profile) {
    return <div className="h-9 w-44 animate-pulse rounded-full bg-line" />;
  }

  const aiEnabled = profile.aiEnabled;

  async function toggle() {
    setPending(true);
    try {
      await updateProfile({ aiEnabled: !aiEnabled });
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      title={aiEnabled ? 'AI is replying to customers' : "You're replying to customers"}
      className={clsx(
        'flex items-center gap-2.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors disabled:opacity-60',
        aiEnabled
          ? 'border-primary/20 bg-primary-light text-primary-dark'
          : 'border-marigold/30 bg-marigold-light text-marigold-dark',
      )}
    >
      <span className="relative flex h-2 w-2">
        {aiEnabled && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
        )}
        <span
          className={clsx(
            'relative inline-flex h-2 w-2 rounded-full',
            aiEnabled ? 'bg-primary' : 'bg-marigold-dark',
          )}
        />
      </span>
      {aiEnabled ? 'AI is replying' : "You're replying"}
    </button>
  );
}
