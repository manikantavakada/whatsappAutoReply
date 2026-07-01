'use client';

import clsx from 'clsx';
import { Pause } from 'lucide-react';
import type { ConversationSummary } from '@/lib/types';

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: {
  conversations: ConversationSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (conversations.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-ink/50">
        No conversations yet. Once a customer messages your WhatsApp number, it'll show up here.
      </div>
    );
  }

  return (
    <ul className="scrollbar-thin h-full overflow-y-auto">
      {conversations.map((c) => {
        const active = c.id === selectedId;
        return (
          <li key={c.id}>
            <button
              onClick={() => onSelect(c.id)}
              className={clsx(
                'flex w-full flex-col gap-1 border-b border-line px-4 py-3.5 text-left transition-colors',
                active ? 'bg-primary-light' : 'hover:bg-paper',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-ink">
                  {c.name || c.waNumber}
                </span>
                <span className="shrink-0 text-xs text-ink/40">{timeAgo(c.lastMessageAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs text-ink/55">
                  {c.lastMessage?.content ?? 'No messages yet'}
                </span>
                <div className="flex shrink-0 items-center gap-1.5">
                  {c.aiPaused && <Pause className="h-3 w-3 text-marigold-dark" />}
                  {c.unreadCount > 0 && (
                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
