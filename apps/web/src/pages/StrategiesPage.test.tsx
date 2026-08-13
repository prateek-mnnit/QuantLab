import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, afterEach } from 'vitest';
import type { StrategySummary } from '@quantlab/shared-types';
import { StrategiesPage } from './StrategiesPage.js';
import { useStrategies, useDeleteStrategy } from '../features/strategies/useStrategies';

/**
 * Mirrors DashboardPage.test.tsx: mock the page's own data hooks directly
 * rather than the network, since this is about what the PAGE does with the
 * delete flow - specifically, that it now goes through the ConfirmDialog
 * instead of `window.confirm()` - not about `useStrategies`/`useDeleteStrategy`
 * themselves.
 */
vi.mock('../features/strategies/useStrategies', () => ({
  useStrategies: vi.fn(),
  useDeleteStrategy: vi.fn(),
}));

const myStrategy: StrategySummary = {
  id: 'strategy-1',
  name: 'My RSI Strategy',
  description: null,
  timeframe: '1D',
  version: 1,
  isBuiltIn: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

function renderPage() {
  return render(
    <MemoryRouter>
      <StrategiesPage />
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('StrategiesPage delete confirmation', () => {
  it('does not call deleteStrategy.mutate until the dialog is confirmed', async () => {
    const mutate = vi.fn();
    vi.mocked(useStrategies).mockReturnValue({ data: [myStrategy], isLoading: false, isError: false } as never);
    vi.mocked(useDeleteStrategy).mockReturnValue({ mutate, isPending: false } as never);

    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    // The dialog is open, but nothing has been deleted yet.
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();

    // The dialog's own Delete button (scoped to the dialog, since the row
    // behind it also has a button named "Delete").
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(mutate).toHaveBeenCalledWith('strategy-1', expect.anything());
  });

  it('closes the dialog and does not delete when Cancel is clicked', async () => {
    const mutate = vi.fn();
    vi.mocked(useStrategies).mockReturnValue({ data: [myStrategy], isLoading: false, isError: false } as never);
    vi.mocked(useDeleteStrategy).mockReturnValue({ mutate, isPending: false } as never);

    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(mutate).not.toHaveBeenCalled();
  });
});
