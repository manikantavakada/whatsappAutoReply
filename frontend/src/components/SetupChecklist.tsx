import Link from 'next/link';
import { CheckCircle2, Circle } from 'lucide-react';
import clsx from 'clsx';

interface Step {
  label: string;
  done: boolean;
  href: string;
}

export function SetupChecklist({ steps }: { steps: Step[] }) {
  const remaining = steps.filter((s) => !s.done).length;
  if (remaining === 0) return null;

  return (
    <div className="rounded-lg border border-marigold/30 bg-marigold-light p-5">
      <p className="font-display text-lg text-ink">Finish setting up your shop</p>
      <p className="mt-1 text-sm text-ink/60">
        {remaining} step{remaining > 1 ? 's' : ''} left before customers start getting instant
        replies.
      </p>
      <ul className="mt-4 flex flex-col gap-2.5">
        {steps.map((step) => (
          <li key={step.label}>
            <Link
              href={step.href}
              className={clsx(
                'flex items-center gap-2.5 text-sm',
                step.done ? 'text-ink/40 line-through' : 'font-medium text-ink hover:underline',
              )}
            >
              {step.done ? (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              ) : (
                <Circle className="h-4 w-4 text-marigold-dark" />
              )}
              {step.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
