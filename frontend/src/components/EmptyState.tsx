import type { LucideIcon } from 'lucide-react';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line bg-white py-16 text-center">
      <Icon className="h-8 w-8 text-ink/30" />
      <p className="mt-4 font-display text-lg text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-ink/55">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
