type Status = 'connected' | 'disconnected' | 'checking';

const STYLES: Record<Status, { label: string; dot: string; text: string; bg: string; border: string }> = {
  connected:    { label: 'API Connected',  dot: 'bg-profit',    text: 'text-profit',    bg: 'bg-profit/10',    border: 'border-profit/25' },
  disconnected: { label: 'API Unreachable', dot: 'bg-loss',     text: 'text-loss',      bg: 'bg-loss/10',      border: 'border-loss/25'   },
  checking:     { label: 'Checking...',      dot: 'bg-zinc-500',  text: 'text-zinc-400',  bg: 'bg-zinc-800/40',  border: 'border-zinc-700'  },
};

interface StatusBadgeProps {
  status: Status;
}

/**
 * Status pill with a pulsing dot for the 'connected' state to indicate live
 * data. Generic enough to be reused for any status enum by swapping the
 * STYLES mapping above.
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, dot, text, bg, border } = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${bg} ${border} ${text}`}
    >
      <span
        className={`relative flex h-1.5 w-1.5 flex-shrink-0 rounded-full ${dot}`}
        aria-hidden="true"
      >
        {status === 'connected' && (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${dot} opacity-40`} />
        )}
      </span>
      {label}
    </span>
  );
}
