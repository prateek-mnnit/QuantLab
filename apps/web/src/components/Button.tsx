import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
}

/**
 * One button primitive shared by every form in the app, rather than each
 * page hand-styling its own <button>. `isLoading` disables the button AND
 * swaps its label - callers pass a mutation's `isPending` flag straight
 * through instead of writing that ternary themselves at every call site.
 */
export function Button({ isLoading, disabled, children, className = '', ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    >
      {isLoading ? 'Please wait...' : children}
    </button>
  );
}
