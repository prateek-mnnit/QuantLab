import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MarketOverview } from './MarketOverview.js';
import { useCandles } from '../market-data/useMarketData';

/**
 * Same mocking approach as `DashboardPage.test.tsx`: the data hook
 * (`useCandles`) and navigation (`useNavigate`, `chartViewStore`) are
 * mocked directly rather than exercising real network calls or the real
 * store - these tests are about where each card navigates and what it
 * selects, not about `useCandles`/`chartViewStore` themselves (already
 * covered by their own call sites).
 */
vi.mock('../market-data/useMarketData', () => ({ useCandles: vi.fn() }));

const navigateMock = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigateMock };
});

const selectSymbolMock = vi.fn();
vi.mock('../../store/chartViewStore', () => ({
  useChartViewStore: (selector: (state: { selectSymbol: typeof selectSymbolMock }) => unknown) =>
    selector({ selectSymbol: selectSymbolMock }),
}));

function mockLoadedCandles() {
  vi.mocked(useCandles).mockReturnValue({
    data: [
      { time: 0, open: 100, high: 100, low: 100, close: 100, volume: 1000 },
      { time: 1, open: 110, high: 110, low: 110, close: 110, volume: 1000 },
    ],
    isLoading: false,
    isError: false,
  } as never);
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('MarketOverview', () => {
  it.each([
    ['NIFTY 50', '^NSEI'],
    ['SENSEX', '^BSESN'],
    ['NIFTY BANK', '^NSEBANK'],
    ['NIFTY IT', '^CNXIT'],
  ])('opens the Chart page with %s (%s) selected when its card is clicked', async (label, symbol) => {
    mockLoadedCandles();
    render(<MarketOverview />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: `Open ${label} chart` }));

    expect(selectSymbolMock).toHaveBeenCalledWith({ symbol, name: label, exchange: '' });
    expect(navigateMock).toHaveBeenCalledWith('/chart');
  });

  it('renders every card as a real button, even while loading/unavailable', () => {
    vi.mocked(useCandles).mockReturnValue({ data: undefined, isLoading: true, isError: false } as never);
    render(<MarketOverview />);

    expect(screen.getByRole('button', { name: 'Open NIFTY 50 chart' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open SENSEX chart' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open NIFTY BANK chart' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open NIFTY IT chart' })).toBeInTheDocument();
  });

  it('still navigates correctly for a card whose data is unavailable', async () => {
    vi.mocked(useCandles).mockReturnValue({ data: undefined, isLoading: false, isError: true } as never);
    render(<MarketOverview />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Open SENSEX chart' }));

    expect(selectSymbolMock).toHaveBeenCalledWith({ symbol: '^BSESN', name: 'SENSEX', exchange: '' });
    expect(navigateMock).toHaveBeenCalledWith('/chart');
  });
});
