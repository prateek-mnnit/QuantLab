import { useEffect, useRef } from 'react';
import { buttonClassName } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the confirm button in the loss/danger color - the delete-confirmation case. */
  destructive?: boolean;
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const DESTRUCTIVE_CONFIRM_CLASSNAME =
  'inline-flex items-center justify-center rounded-lg bg-loss px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-loss/80 disabled:cursor-not-allowed disabled:opacity-60';

/**
 * A reusable dark-themed replacement for `window.confirm()` on destructive
 * actions - a native browser confirm can't be restyled at all, so it was
 * the one place in the app that broke out of the QuantLab charcoal design.
 * Generic on purpose (title/description/labels are all props) so any
 * future destructive action - not just strategy deletion - can reuse it
 * without a new component.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  isConfirming = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Closing on Escape mirrors what a native window.confirm()/dialog would
  // do, so keyboard users lose nothing by this being a custom component.
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  useEffect(() => {
    if (open) confirmButtonRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? 'confirm-dialog-description' : undefined}
        className="w-full max-w-sm rounded-xl border border-surface-border bg-surface-raised p-6 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-lg font-semibold text-slate-50">
          {title}
        </h2>
        {description && (
          <p id="confirm-dialog-description" className="mt-2 text-sm text-slate-400">
            {description}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="inline-flex items-center justify-center rounded-lg border border-surface-border bg-transparent px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-slate-600 hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className={destructive ? DESTRUCTIVE_CONFIRM_CLASSNAME : buttonClassName}
          >
            {isConfirming ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
