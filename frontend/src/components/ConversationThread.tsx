'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import clsx from 'clsx';
import { Bot, Send, User, UserCog } from 'lucide-react';
import { Button } from './Button';
import type { ConversationSummary, Message } from '@/lib/types';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

export function ConversationThread({
  customer,
  messages,
  onSend,
  onToggleAi,
}: {
  customer: ConversationSummary | null;
  messages: Message[] | null;
  onSend: (text: string) => Promise<void>;
  onToggleAi: (paused: boolean) => Promise<void>;
}) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!customer) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-ink/40">
        Select a conversation to view messages.
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await onSend(text.trim());
      setText('');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div>
          <p className="font-medium text-ink">{customer.name || customer.waNumber}</p>
          <p className="text-xs text-ink/45">{customer.waNumber}</p>
        </div>
        <button
          onClick={() => onToggleAi(!customer.aiPaused)}
          className={clsx(
            'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium',
            customer.aiPaused
              ? 'border-marigold/30 bg-marigold-light text-marigold-dark'
              : 'border-primary/20 bg-primary-light text-primary-dark',
          )}
        >
          {customer.aiPaused ? <UserCog className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
          {customer.aiPaused ? 'You are replying' : 'AI is replying'}
        </button>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto bg-paper px-5 py-4">
        {messages === null ? (
          <p className="text-sm text-ink/40">Loading messages…</p>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m) => {
              const fromCustomer = m.sender === 'CUSTOMER';
              return (
                <div
                  key={m.id}
                  className={clsx('flex', fromCustomer ? 'justify-start' : 'justify-end')}
                >
                  <div
                    className={clsx(
                      'max-w-md rounded-lg px-3.5 py-2.5 text-sm shadow-card',
                      fromCustomer ? 'bg-white text-ink' : 'bg-primary text-white',
                    )}
                  >
                    <p>{m.content}</p>
                    <div
                      className={clsx(
                        'mt-1 flex items-center gap-1.5 text-[11px]',
                        fromCustomer ? 'text-ink/40' : 'text-white/70',
                      )}
                    >
                      {!fromCustomer && (m.sender === 'AI' ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />)}
                      {formatTime(m.createdAt)}
                      {m.failed && <span className="text-marigold-light">· not delivered</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-3 border-t border-line p-4">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a reply… (sends as you, not the AI)"
          className="flex-1 rounded-full border border-line bg-white px-4 py-2.5 text-sm focus:border-primary"
        />
        <Button type="submit" loading={sending} disabled={!text.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
