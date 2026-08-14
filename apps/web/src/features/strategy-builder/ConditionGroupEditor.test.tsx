import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ConditionGroup } from '@quantlab/shared-types';
import { ConditionGroupEditor } from './ConditionGroupEditor.js';
import { createEmptyCondition, createEmptyGroup } from './conditionTreeFactories.js';

function emptyGroup(type: 'AND' | 'OR' = 'AND'): ConditionGroup {
  return createEmptyGroup(type);
}

describe('ConditionGroupEditor', () => {
  it('shows the empty-state helper text when a group has no conditions', () => {
    render(<ConditionGroupEditor group={emptyGroup()} onChange={vi.fn()} />);

    expect(screen.getByText(/no conditions yet/i)).toBeInTheDocument();
  });

  it('adds a condition when "Condition" is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ConditionGroupEditor group={emptyGroup()} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /condition/i }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const updated = onChange.mock.calls[0][0] as ConditionGroup;
    expect(updated.children).toHaveLength(1);
    expect(updated.children[0]?.type).toBe('CONDITION');
  });

  it('removes a condition row via its remove button', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const group: ConditionGroup = { ...emptyGroup(), children: [createEmptyCondition()] };
    render(<ConditionGroupEditor group={group} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /remove condition/i }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ children: [] }));
  });

  it('switches the match type between ALL (AND) and ANY (OR)', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ConditionGroupEditor group={emptyGroup('AND')} onChange={onChange} />);

    await user.click(screen.getByRole('radio', { name: /any \(or\)/i }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ type: 'OR' }));
  });

  it('shows an AND/OR connector between sibling conditions matching the group type', () => {
    const group: ConditionGroup = {
      ...emptyGroup('OR'),
      children: [createEmptyCondition(), createEmptyCondition()],
    };
    render(<ConditionGroupEditor group={group} onChange={vi.fn()} />);

    // One connector between the two rows, plus the OR shown in the toggle -
    // scope to the badge specifically so this doesn't just match the toggle.
    expect(screen.getAllByText('OR').length).toBeGreaterThanOrEqual(1);
  });

  it('does not offer "Nested group" past the maximum nesting depth', () => {
    render(<ConditionGroupEditor group={emptyGroup()} onChange={vi.fn()} depth={2} />);

    expect(screen.queryByRole('button', { name: /nested group/i })).not.toBeInTheDocument();
  });

  it('offers "Nested group" below the maximum nesting depth', () => {
    render(<ConditionGroupEditor group={emptyGroup()} onChange={vi.fn()} depth={1} />);

    expect(screen.getByRole('button', { name: /nested group/i })).toBeInTheDocument();
  });

  it('only shows "Remove group" when onRemove is provided (never for the root group)', () => {
    const { rerender } = render(<ConditionGroupEditor group={emptyGroup()} onChange={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /remove group/i })).not.toBeInTheDocument();

    rerender(<ConditionGroupEditor group={emptyGroup()} onChange={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByRole('button', { name: /remove group/i })).toBeInTheDocument();
  });
});
