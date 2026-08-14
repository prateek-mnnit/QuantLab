import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConditionLeafEditor } from './ConditionLeafEditor.js';
import { createEmptyCondition } from './conditionTreeFactories.js';

describe('ConditionLeafEditor', () => {
  it('calls onRemove when the remove button is clicked', async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();
    render(<ConditionLeafEditor leaf={createEmptyCondition()} onChange={vi.fn()} onRemove={onRemove} />);

    await user.click(screen.getByRole('button', { name: /remove condition/i }));

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('reports an operator change via onChange', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ConditionLeafEditor leaf={createEmptyCondition()} onChange={onChange} onRemove={vi.fn()} />);

    await user.selectOptions(screen.getByLabelText('Operator'), 'GREATER_THAN');

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ operator: 'GREATER_THAN' }));
  });
});
