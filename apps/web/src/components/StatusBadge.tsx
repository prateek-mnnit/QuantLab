interface StatusBadgeProps {
  status: 'connected' | 'disconnected' | 'checking';
}

const STYLES: Record<StatusBadgeProps['status'], { label: string; classes: string }> = {
  connected: { label: 'API Connected', classes: 'bg-profit/10 text-profit border-profit/30' },
  disconnected: { label: 'API Unreachable', classes: 'bg-loss/10 text-loss border-loss/30' },
  checking: { label: 'Checking...', classes: 'bg-slate-500/10 text-slate-400 border-slate-500/30' },
};

/**
 * A small, reusable status pill - generic enough to reuse later for
 * backtest run status (PENDING/RUNNING/COMPLETED/FAILED) without writing a
 * new component, just a new status->style mapping.
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, classes } = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${classes}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
