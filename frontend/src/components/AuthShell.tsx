import type { ReactNode } from 'react';

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-ink p-12 text-paper lg:flex">
        <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.2em] text-marigold">
          <span className="h-1.5 w-1.5 rounded-full bg-marigold" />
          Seller AI
        </div>
        <div>
          <p className="font-display text-5xl leading-[1.05]">
            Every WhatsApp enquiry,
            <br />
            answered before they
            <br />
            put the phone down.
          </p>
          <p className="mt-6 max-w-md text-base text-paper/70">
            Connect your WhatsApp number, add what you sell, and let your shop reply itself —
            day or night.
          </p>
        </div>
        <p className="text-sm text-paper/50">Built for Indian sellers on WhatsApp.</p>
      </div>

      <div className="flex items-center justify-center bg-paper px-6 py-16">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl text-ink">{title}</h1>
          <p className="mt-2 text-sm text-ink/60">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
