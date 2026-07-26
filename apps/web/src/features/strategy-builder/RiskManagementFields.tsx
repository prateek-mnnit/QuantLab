import type {
  PositionSizingConfig,
  StopLossConfig,
  TakeProfitConfig,
  TrailingStopConfig,
} from '@quantlab/shared-types';

const fieldSelectClass =
  'rounded-md border border-surface-border bg-surface px-2 py-1.5 text-sm text-slate-100 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';
const fieldNumberClass = `${fieldSelectClass} w-24`;

interface OptionalRiskControlProps<T extends { type: string; value: number }> {
  label: string;
  config: T | null | undefined;
  types: { value: string; label: string }[];
  onChange: (config: T | null) => void;
}

/**
 * Stop loss, take profit, and trailing stop share the exact same shape
 * (`{ type, value } | null`) and the exact same UI pattern (a checkbox to
 * enable it, then a type + value pair once enabled) - one generic component
 * covers all three instead of writing three near-identical ones.
 */
function OptionalRiskControl<T extends { type: string; value: number }>({
  label,
  config,
  types,
  onChange,
}: OptionalRiskControlProps<T>) {
  const enabled = Boolean(config);

  return (
    <div className="rounded-lg border border-surface-border p-4">
      <label className="flex items-center gap-2 text-sm font-medium text-slate-200">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) =>
            onChange(event.target.checked ? ({ type: types[0]!.value, value: 1 } as T) : null)
          }
        />
        {label}
      </label>

      {enabled && config && (
        <div className="mt-3 flex items-center gap-2">
          <select
            className={fieldSelectClass}
            value={config.type}
            onChange={(event) => onChange({ ...config, type: event.target.value } as T)}
          >
            {types.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.1"
            min={0}
            className={fieldNumberClass}
            value={config.value}
            onChange={(event) => onChange({ ...config, value: Number(event.target.value) } as T)}
          />
        </div>
      )}
    </div>
  );
}

interface RiskManagementFieldsProps {
  stopLossConfig: StopLossConfig | null | undefined;
  takeProfitConfig: TakeProfitConfig | null | undefined;
  trailingStopConfig: TrailingStopConfig | null | undefined;
  positionSizingConfig: PositionSizingConfig;
  onStopLossChange: (config: StopLossConfig | null) => void;
  onTakeProfitChange: (config: TakeProfitConfig | null) => void;
  onTrailingStopChange: (config: TrailingStopConfig | null) => void;
  onPositionSizingChange: (config: PositionSizingConfig) => void;
}

export function RiskManagementFields({
  stopLossConfig,
  takeProfitConfig,
  trailingStopConfig,
  positionSizingConfig,
  onStopLossChange,
  onTakeProfitChange,
  onTrailingStopChange,
  onPositionSizingChange,
}: RiskManagementFieldsProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-slate-200">Risk management</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <OptionalRiskControl
          label="Stop loss"
          config={stopLossConfig}
          onChange={onStopLossChange}
          types={[
            { value: 'PERCENT', label: 'Percent' },
            { value: 'POINTS', label: 'Points' },
            { value: 'ATR', label: 'ATR multiple' },
          ]}
        />
        <OptionalRiskControl
          label="Take profit"
          config={takeProfitConfig}
          onChange={onTakeProfitChange}
          types={[
            { value: 'PERCENT', label: 'Percent' },
            { value: 'POINTS', label: 'Points' },
            { value: 'RISK_REWARD_MULTIPLE', label: 'Risk/reward multiple' },
          ]}
        />
        <OptionalRiskControl
          label="Trailing stop"
          config={trailingStopConfig}
          onChange={onTrailingStopChange}
          types={[
            { value: 'PERCENT', label: 'Percent' },
            { value: 'ATR', label: 'ATR multiple' },
          ]}
        />

        {/* Position sizing is always required (never null), unlike the
            three optional controls above, so it gets its own fixed block
            rather than being routed through OptionalRiskControl. */}
        <div className="rounded-lg border border-surface-border p-4">
          <p className="text-sm font-medium text-slate-200">Position sizing</p>
          <div className="mt-3 flex items-center gap-2">
            <select
              className={fieldSelectClass}
              value={positionSizingConfig.type}
              onChange={(event) =>
                onPositionSizingChange({
                  ...positionSizingConfig,
                  type: event.target.value as PositionSizingConfig['type'],
                })
              }
            >
              <option value="FIXED_SHARES">Fixed shares</option>
              <option value="PERCENT_CAPITAL">% of capital</option>
              <option value="RISK_BASED">Risk-based (% risked per trade)</option>
            </select>
            <input
              type="number"
              min={0}
              step="0.1"
              className={fieldNumberClass}
              value={positionSizingConfig.value}
              onChange={(event) =>
                onPositionSizingChange({ ...positionSizingConfig, value: Number(event.target.value) })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
