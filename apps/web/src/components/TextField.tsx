import type { InputHTMLAttributes } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

/**
 * Labeled input with consistent dark styling, focus ring, optional error
 * and hint text. `id` doubles as the <label htmlFor> target — accessibility
 * is automatic, call sites don't wire it up themselves.
 *
 * Redesign changes:
 * - bg-zinc-900 (not surface) so the input sits distinctly in its card
 * - Focus ring: zinc-600 border (neutral, not green — green is reserved
 *   for primary actions, not universal form interaction)
 * - Error state: red border + ring
 * - Optional `hint` text below the input for contextual guidance
 */
export function TextField({
  label,
  error,
  hint,
  id,
  className = '',
  ...props
}: TextFieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-zinc-300"
      >
        {label}
      </label>
      <input
        id={id}
        className={`
          w-full rounded-md border bg-zinc-900 px-3 py-2 text-sm text-zinc-100
          placeholder:text-zinc-600
          transition-colors duration-150
          focus:outline-none
          ${error
            ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/30'
            : 'border-zinc-800 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600/30'
          }
          disabled:cursor-not-allowed disabled:opacity-50
          ${className}
        `.replace(/\s+/g, ' ').trim()}
        {...props}
      />
      {hint && !error && (
        <p className="text-xs text-zinc-600">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
