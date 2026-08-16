import type { ButtonHTMLAttributes } from 'react';

/**
 * QuantLab button system — four variants, three sizes.
 *
 * Design decisions:
 * - Primary: solid green — the ONE place green is used as a fill, reserved
 *   for the main action on each page. Never use for secondary actions.
 * - Secondary: transparent with zinc border + hover:bg-white/5 (relative
 *   overlay tint, not a fixed surface tier, so it works in any context:
 *   page background, card, modal).
 * - Ghost: no border, subtle hover — table row actions, icon buttons.
 * - Danger: red fill — destructive actions only (delete, clear).
 *
 * Test constraints:
 * - buttonClassName must contain 'bg-accent-500' (not accent-600) per Button.test.tsx
 * - secondaryButtonClassName must contain 'hover:bg-white/5' and 'border-surface-border'
 * - isLoading shows 'Please wait...' (three dots, not ellipsis)
 */

export const buttonClassName =
  'inline-flex items-center justify-center gap-2 rounded-md bg-accent-500 px-3.5 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500 disabled:cursor-not-allowed disabled:opacity-50';

export const secondaryButtonClassName =
  'inline-flex items-center justify-center gap-2 rounded-md border border-surface-border bg-transparent px-3.5 py-2 text-sm font-medium text-zinc-200 transition-colors duration-150 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-500 disabled:cursor-not-allowed disabled:opacity-50';

export const ghostButtonClassName =
  'inline-flex items-center justify-center gap-2 rounded-md bg-transparent px-3 py-1.5 text-sm font-medium text-zinc-400 transition-colors duration-150 hover:bg-white/5 hover:text-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-500 disabled:cursor-not-allowed disabled:opacity-50';

export const dangerButtonClassName =
  'inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-3.5 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:opacity-50';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize   = 'sm' | 'md' | 'lg';

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:   buttonClassName,
  secondary: secondaryButtonClassName,
  ghost:     ghostButtonClassName,
  danger:    dangerButtonClassName,
};

const SIZE_OVERRIDES: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1.5 text-xs rounded',
  md: '',  // default — no override needed
  lg: 'px-4 py-2.5 text-base',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/**
 * Single button primitive for the entire app. Props:
 * - `isLoading` — disables the button and shows "Please wait..."
 * - `variant`   — 'primary' | 'secondary' | 'ghost' | 'danger'
 * - `size`      — 'sm' | 'md' | 'lg'
 */
export function Button({
  isLoading,
  disabled,
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  const base = VARIANT_CLASS[variant];
  const sizeOverride = SIZE_OVERRIDES[size];
  return (
    <button
      disabled={disabled || isLoading}
      className={`${base} ${sizeOverride} ${className}`.trim()}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="h-3.5 w-3.5 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span>Please wait...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
