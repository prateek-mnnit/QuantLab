import type {
  PositionSizingConfig,
  StopLossConfig,
  TakeProfitConfig,
  TrailingStopConfig,
} from '@quantlab/shared-types';

const fieldSelectClass =
  'rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600/30 transition-colors';
const fieldNumberClass = `${fieldSelectClass} w-24`;

interface OptionalRiskControlProps<T extends { type: string; value: number }> {
  label: string;
  helperText: string;
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
  helperText,
  config,
  types,
  onChange,
}: OptionalRiskControlProps<T>) {
  const enabled = Boolean(config);

  return (
    <div className="rounded-lg border border-zinc-800 p-4">
      <label className="flex items-center gap-2.5 text-sm font-medium text-zinc-200">
        <input
          type="checkbox"
          checked={enabled}
          className="h-4 w-4 accent-accent-500"
          onChange={(event) =>
            onChange(event.target.checked ? ({ type: types[0]!.value, value: 1 } as T) : null)
          }
        />
        {label}
      </label>
      <p className="mt-1 pl-6 text-xs text-zinc-600">{helperText}</p>

      {enabled && config && (
        <div className="mt-3 flex items-center gap-2 pl-6">
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

/** UI-3: no longer renders its own section heading - `StrategyBuilderPage`
    now wraps this in a `BuilderSection` that already provides the
    "Risk management" title/description, matching the Entry/Exit sections
    above it. */
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
      <div className="grid gap-4 sm:grid-cols-2">
        <OptionalRiskControl
          label="Stop loss"
          helperText="Automatically exit the position if price moves against you by this amount."
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
          helperText="Automatically exit the position once it reaches this amount of profit."
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
          helperText="Follows price as it moves in your favor, locking in gains if it reverses."
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
        <div className="rounded-lg border border-zinc-800 p-4">
          <p className="text-sm font-medium text-zinc-200">Position sizing</p>
          <p className="mt-1 text-xs text-zinc-600">How much to buy or sell whenever this strategy enters a trade.</p>
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
