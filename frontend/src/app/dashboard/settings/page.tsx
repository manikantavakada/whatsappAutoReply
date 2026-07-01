'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Check, Copy } from 'lucide-react';
import { Topbar } from '@/components/Topbar';
import { TextField } from '@/components/TextField';
import { Button } from '@/components/Button';
import { useBusiness } from '@/lib/business';
import { api, ApiError } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function CopyableField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink/80">{label}</label>
      <div className="flex items-center gap-2 rounded-md border border-line bg-paper px-3.5 py-2.5">
        <code className="flex-1 truncate text-xs text-ink/70">{value}</code>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="text-ink/40 hover:text-ink"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { profile, updateProfile, refresh } = useBusiness();

  const [name, setName] = useState('');
  const [aiTone, setAiTone] = useState<'friendly' | 'professional' | 'concise'>('friendly');
  const [welcomeNote, setWelcomeNote] = useState('');
  const [autoReplyDelaySec, setAutoReplyDelaySec] = useState(0);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [waPhoneNumberId, setWaPhoneNumberId] = useState('');
  const [waBusinessAccountId, setWaBusinessAccountId] = useState('');
  const [waAccessToken, setWaAccessToken] = useState('');
  const [waAppSecret, setWaAppSecret] = useState('');
  const [waDisplayNumber, setWaDisplayNumber] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [waError, setWaError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setAiTone(profile.aiTone);
      setWelcomeNote(profile.welcomeNote ?? '');
      setAutoReplyDelaySec(profile.autoReplyDelaySec ?? 0);
    }
  }, [profile]);

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({ name, aiTone, welcomeNote, autoReplyDelaySec });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleConnect(e: FormEvent) {
    e.preventDefault();
    setWaError(null);
    setConnecting(true);
    try {
      await api.post('/business/whatsapp/connect', {
        waPhoneNumberId,
        waBusinessAccountId: waBusinessAccountId || undefined,
        waAccessToken,
        waAppSecret,
        waDisplayNumber: waDisplayNumber || undefined,
      });
      await refresh();
      setWaPhoneNumberId('');
      setWaBusinessAccountId('');
      setWaAccessToken('');
      setWaAppSecret('');
      setWaDisplayNumber('');
    } catch (err) {
      setWaError(err instanceof ApiError ? err.message : 'Could not connect WhatsApp.');
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm('Disconnect this WhatsApp number? The AI will stop replying until reconnected.')) return;
    await api.delete('/business/whatsapp/connect');
    await refresh();
  }

  if (!profile) {
    return (
      <div>
        <Topbar title="Settings" />
        <div className="p-8 text-sm text-ink/40">Loading…</div>
      </div>
    );
  }

  const webhookUrl = `${API_URL}/webhook/whatsapp/${profile.id}`;

  return (
    <div>
      <Topbar title="Settings" />
      <div className="flex flex-col gap-6 p-8">
        <section className="rounded-lg border border-line bg-white p-6 shadow-card">
          <p className="font-display text-lg text-ink">AI behaviour</p>
          <p className="mt-1 text-sm text-ink/55">Controls how your assistant sounds on WhatsApp.</p>
          <form onSubmit={handleProfileSubmit} className="mt-5 flex flex-col gap-4">
            <TextField label="Business name" value={name} onChange={(e) => setName(e.target.value)} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink/80">Tone</label>
              <select
                value={aiTone}
                onChange={(e) => setAiTone(e.target.value as typeof aiTone)}
                className="rounded-md border border-line bg-white px-3.5 py-2.5 text-sm text-ink focus:border-primary"
              >
                <option value="friendly">Friendly</option>
                <option value="professional">Professional</option>
                <option value="concise">Concise</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink/80">Internal note (not sent to customers)</label>
              <textarea
                rows={2}
                value={welcomeNote}
                onChange={(e) => setWelcomeNote(e.target.value)}
                placeholder="e.g. Mention our 7-day exchange policy if asked."
                className="rounded-md border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-primary"
              />
            </div>
            <TextField
              label="Auto-reply delay (seconds)"
              type="number"
              min={0}
              max={120}
              value={autoReplyDelaySec}
              onChange={(e) => setAutoReplyDelaySec(Number(e.target.value))}
              hint="Delay in seconds before the AI auto-replies to simulate natural human response time (max 120s)."
            />
            <div className="flex items-center gap-3">
              <Button type="submit" loading={savingProfile}>
                Save
              </Button>
              {profileSaved && <span className="text-sm text-primary">Saved</span>}
            </div>
          </form>
        </section>

        <section className="rounded-lg border border-line bg-white p-6 shadow-card">
          <p className="font-display text-lg text-ink">WhatsApp connection</p>
          <p className="mt-1 text-sm text-ink/55">
            Create a Meta App at{' '}
            <a
              href="https://developers.facebook.com/apps"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline"
            >
              developers.facebook.com
            </a>
            , add the WhatsApp product, then paste the details below.
          </p>

          {profile.waConnected ? (
            <div className="mt-5 flex items-center justify-between rounded-md bg-primary-light p-4">
              <div>
                <p className="text-sm font-medium text-primary-dark">
                  Connected{profile.waDisplayNumber ? ` · ${profile.waDisplayNumber}` : ''}
                </p>
                <p className="text-xs text-primary-dark/70">Phone number ID: {profile.waPhoneNumberId}</p>
              </div>
              <Button variant="danger" onClick={handleDisconnect}>
                Disconnect
              </Button>
            </div>
          ) : (
            <form onSubmit={handleConnect} className="mt-5 flex flex-col gap-4">
              <div className="rounded-md border border-line bg-paper p-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink/45">
                  In your Meta App's webhook settings, use:
                </p>
                <div className="flex flex-col gap-3">
                  <CopyableField label="Callback URL" value={webhookUrl} />
                  <CopyableField label="Verify token" value={profile.waVerifyToken} />
                </div>
              </div>

              <TextField
                label="Phone number ID"
                required
                value={waPhoneNumberId}
                onChange={(e) => setWaPhoneNumberId(e.target.value)}
              />
              <TextField
                label="WhatsApp Business Account ID (optional)"
                value={waBusinessAccountId}
                onChange={(e) => setWaBusinessAccountId(e.target.value)}
              />
              <TextField
                label="Display number (optional, shown in dashboard)"
                value={waDisplayNumber}
                onChange={(e) => setWaDisplayNumber(e.target.value)}
              />
              <TextField
                label="Access token"
                hint="Use a permanent token from a System User for production."
                required
                value={waAccessToken}
                onChange={(e) => setWaAccessToken(e.target.value)}
              />
              <TextField
                label="App secret"
                hint="From Meta App Dashboard → Settings → Basic. Used to verify incoming webhooks."
                required
                value={waAppSecret}
                onChange={(e) => setWaAppSecret(e.target.value)}
              />
              {waError && <p className="text-sm text-danger">{waError}</p>}
              <Button type="submit" loading={connecting} className="self-start">
                Connect WhatsApp
              </Button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
