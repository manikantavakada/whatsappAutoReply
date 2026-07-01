'use client';

import { forwardRef } from 'react';
import clsx from 'clsx';

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, hint, error, className, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-ink/80">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'rounded-md border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-primary',
            error && 'border-danger',
            className,
          )}
          {...props}
        />
        {hint && !error && <span className="text-xs text-ink/50">{hint}</span>}
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>
    );
  },
);
TextField.displayName = 'TextField';
