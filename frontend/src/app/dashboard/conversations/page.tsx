'use client';

import { useCallback, useEffect, useState } from 'react';
import { Topbar } from '@/components/Topbar';
import { ConversationList } from '@/components/ConversationList';
import { ConversationThread } from '@/components/ConversationThread';
import { api } from '@/lib/api';
import type { ConversationSummary, Message } from '@/lib/types';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);

  const loadConversations = useCallback(async () => {
    const data = await api.get<ConversationSummary[]>('/conversations');
    setConversations(data);
    return data;
  }, []);

  const loadMessages = useCallback(async (customerId: string) => {
    const data = await api.get<Message[]>(`/conversations/${customerId}/messages`);
    setMessages(data);
  }, []);

  useEffect(() => {
    loadConversations().catch(() => setConversations([]));
    const interval = setInterval(() => {
      loadConversations().catch(() => undefined);
    }, 8_000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedId) return;
    loadMessages(selectedId).catch(() => setMessages([]));
    api.post(`/conversations/${selectedId}/read`).catch(() => undefined);
    const interval = setInterval(() => {
      loadMessages(selectedId).catch(() => undefined);
    }, 5_000);
    return () => clearInterval(interval);
  }, [selectedId, loadMessages]);

  function handleSelect(id: string) {
    setSelectedId(id);
    setMessages(null);
  }

  async function handleSend(text: string) {
    if (!selectedId) return;
    await api.post(`/conversations/${selectedId}/reply`, { text });
    await Promise.all([loadMessages(selectedId), loadConversations()]);
  }

  async function handleToggleAi(paused: boolean) {
    if (!selectedId) return;
    await api.patch(`/conversations/${selectedId}/ai`, { aiPaused: paused });
    await loadConversations();
  }

  const selectedCustomer = conversations?.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="flex h-screen flex-col">
      <Topbar title="Conversations" />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 shrink-0 border-r border-line bg-white">
          {conversations === null ? (
            <div className="p-4 text-sm text-ink/40">Loading…</div>
          ) : (
            <ConversationList
              conversations={conversations}
              selectedId={selectedId}
              onSelect={handleSelect}
            />
          )}
        </div>
        <div className="flex-1">
          <ConversationThread
            customer={selectedCustomer}
            messages={messages}
            onSend={handleSend}
            onToggleAi={handleToggleAi}
          />
        </div>
      </div>
    </div>
  );
}
