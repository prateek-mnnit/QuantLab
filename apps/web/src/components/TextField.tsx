import type { InputHTMLAttributes } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

/**
 * A labeled input with a consistent focus ring and an optional inline error
 * message. `id` is required (via InputHTMLAttributes) and doubles as the
 * `<label htmlFor>` target - keeps the label properly associated with its
 * input for accessibility (clicking the label focuses the field, and
 * screen readers announce it correctly) without every call site having to
 * remember to wire that up itself.
 */
export function TextField({ label, error, id, className = '', ...props }: TextFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-300">
        {label}
      </label>
      <input
        id={id}
        className={`w-full rounded-lg border border-surface-border bg-surface px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-loss">{error}</p>}
    </div>
  );
}
