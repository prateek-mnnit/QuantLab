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
 *
 * UI-4 (revised): the focus ring is neutral (`slate-400`), not the green
 * accent - every text field on the page focusing green on every keystroke
 * flow would make green the dominant color of the app, which runs against
 * green staying reserved for primary actions/active nav/success states.
 */
export function TextField({ label, error, id, className = '', ...props }: TextFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-300">
        {label}
      </label>
      <input
        id={id}
        className={`w-full rounded-lg border border-surface-border bg-surface px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-loss">{error}</p>}
    </div>
  );
}
