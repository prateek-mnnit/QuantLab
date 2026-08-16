import { INDICATOR_CATALOG, INDICATOR_TYPES } from '@quantlab/shared-types';
import type { ConditionOperand, IndicatorType } from '@quantlab/shared-types';

interface OperandEditorProps {
  value: ConditionOperand;
  onChange: (operand: ConditionOperand) => void;
}

const selectClass =
  'rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600/30 transition-colors';
const numberInputClass = `${selectClass} w-20`;

/**
 * Renders the controls for ONE side of a condition (either `left` or
 * `right`) - a discriminated-union editor. Switching the `source` dropdown
 * (Indicator / Price / Fixed value) swaps which fields render below it,
 * mirroring the `operandSchema` discriminated union from shared-types
 * exactly, so whatever this produces is guaranteed to match one of its
 * three valid shapes.
 *
 * UI-3: the whole control set renders inside a subtly-shaded box so an
 * indicator's source + type + params reads as ONE unit at a glance,
 * separate from the operator select and the other side's operand in
 * ConditionLeafEditor's row.
 */
export function OperandEditor({ value, onChange }: OperandEditorProps) {
  function handleSourceChange(source: ConditionOperand['source']): void {
    if (source === 'INDICATOR') {
      onChange({ source: 'INDICATOR', indicator: 'RSI', params: { period: 14 } });
    } else if (source === 'PRICE') {
      onChange({ source: 'PRICE', field: 'close' });
    } else {
      onChange({ source: 'VALUE', value: 0 });
    }
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-md bg-zinc-800/50 p-1.5">
      <select
        className={selectClass}
        value={value.source}
        onChange={(event) => handleSourceChange(event.target.value as ConditionOperand['source'])}
      >
        <option value="INDICATOR">Indicator</option>
        <option value="PRICE">Price</option>
        <option value="VALUE">Fixed value</option>
      </select>

      {value.source === 'INDICATOR' && (
        <>
          <select
            className={selectClass}
            value={value.indicator}
            onChange={(event) => {
              // Switching indicator resets params to that indicator's own
              // defaults - the previous indicator's params (e.g. RSI's
              // "period") have no meaning for a different indicator.
              const indicator = event.target.value as IndicatorType;
              const definition = INDICATOR_CATALOG[indicator];
              const params = Object.fromEntries(
                definition.params.map((param) => [param.key, param.defaultValue]),
              );
              onChange({
                source: 'INDICATOR',
                indicator,
                params,
                output: definition.outputs.length > 1 ? definition.outputs[0]!.key : undefined,
              });
            }}
          >
            {INDICATOR_TYPES.map((type) => (
              <option key={type} value={type}>
                {INDICATOR_CATALOG[type].label}
              </option>
            ))}
          </select>

          {INDICATOR_CATALOG[value.indicator as IndicatorType].params.map((param) => (
            <label key={param.key} className="flex items-center gap-1 text-xs text-zinc-500">
              {param.label}
              <input
                type="number"
                className={numberInputClass}
                min={param.min}
                max={param.max}
                value={value.params[param.key] ?? param.defaultValue}
                onChange={(event) =>
                  onChange({
                    ...value,
                    params: { ...value.params, [param.key]: Number(event.target.value) },
                  })
                }
              />
            </label>
          ))}

          {INDICATOR_CATALOG[value.indicator as IndicatorType].outputs.length > 1 && (
            <select
              className={selectClass}
              value={value.output ?? INDICATOR_CATALOG[value.indicator as IndicatorType].outputs[0]!.key}
              onChange={(event) => onChange({ ...value, output: event.target.value })}
            >
              {INDICATOR_CATALOG[value.indicator as IndicatorType].outputs.map((output) => (
                <option key={output.key} value={output.key}>
                  {output.label}
                </option>
              ))}
            </select>
          )}
        </>
      )}

      {value.source === 'PRICE' && (
        <select
          className={selectClass}
          value={value.field}
          onChange={(event) =>
            onChange({ source: 'PRICE', field: event.target.value as typeof value.field })
          }
        >
          <option value="open">Open</option>
          <option value="high">High</option>
          <option value="low">Low</option>
          <option value="close">Close</option>
        </select>
      )}

      {value.source === 'VALUE' && (
        <input
          type="number"
          className={numberInputClass}
          value={value.value}
          onChange={(event) => onChange({ source: 'VALUE', value: Number(event.target.value) })}
        />
      )}
    </div>
  );
}
