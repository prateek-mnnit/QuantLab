import type { ButtonHTMLAttributes } from 'react';

/**
 * Exported separately from the `Button` component itself so a react-router
 * `<Link>` (which must render an `<a>`, not a `<button>`, to navigate) can
 * look identical to a real button - see the "New Strategy" link in
 * StrategiesPage - without copy-pasting this class string a second time.
 *
 * UI-2: kept as a plain constant (rather than folded into `buttonClasses`
 * below) specifically so existing call sites importing `buttonClassName`
 * for the primary look keep compiling unchanged.
 */
export const buttonClassName =
  'inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60';

/**
 * Secondary/outline look for genuine secondary actions (Cancel, etc.) that
 * still need `<Link>` parity the way `buttonClassName` does for primary
 * ones - exported for the same reason.
 */
export const secondaryButtonClassName =
  'inline-flex items-center justify-center rounded-lg border border-surface-border bg-transparent px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-slate-600 hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-60';

type ButtonVariant = 'primary' | 'secondary';

const VARIANT_CLASSNAME: Record<ButtonVariant, string> = {
  primary: buttonClassName,
  secondary: secondaryButtonClassName,
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  /** Defaults to 'primary' so every existing call site keeps its current look. */
  variant?: ButtonVariant;
}

/**
 * One button primitive shared by every form in the app, rather than each
 * page hand-styling its own <button>. `isLoading` disables the button AND
 * swaps its label - callers pass a mutation's `isPending` flag straight
 * through instead of writing that ternary themselves at every call site.
 *
 * `variant="secondary"` gives a proper outline treatment for genuine
 * secondary actions (Cancel, etc.) instead of each page hand-rolling its
 * own plain-text button for that.
 */
export function Button({
  isLoading,
  disabled,
  children,
  className = '',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`${VARIANT_CLASSNAME[variant]} ${className}`}
      {...props}
    >
      {isLoading ? 'Please wait...' : children}
    </button>
  );
}
