import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DashboardPage } from './DashboardPage.js';
import { useStrategies } from '../features/strategies/useStrategies';
import { useBacktestsList } from '../features/backtests/useBacktests';
import { useWatchlist } from '../features/watchlist/useWatchlist';

/**
 * The Dashboard's own data hooks are mocked directly (rather than mocking
 * fetch/React Query) - these tests are about what the PAGE does with
 * loading/error/loaded data and where it navigates, not about
 * `useStrategies` etc. themselves (already covered by their own
 * call sites and the backend's own tests). `useCandles` is mocked the same
 * way so Market Overview never attempts a real network call in a test.
 */
vi.mock('../features/strategies/useStrategies', () => ({ useStrategies: vi.fn() }));
vi.mock('../features/backtests/useBacktests', () => ({ useBacktestsList: vi.fn() }));
vi.mock('../features/watchlist/useWatchlist', () => ({ useWatchlist: vi.fn() }));
vi.mock('../features/market-data/useMarketData', () => ({
  useCandles: () => ({ data: undefined, isLoading: false, isError: true }),
}));

const navigateMock = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigateMock };
});

const selectSymbolMock = vi.fn();
vi.mock('../store/chartViewStore', () => ({
  useChartViewStore: (selector: (state: { selectSymbol: typeof selectSymbolMock }) => unknown) =>
    selector({ selectSymbol: selectSymbolMock }),
}));

vi.mock('../store/authStore', () => ({
  useAuthStore: (selector: (state: { user: null }) => unknown) => selector({ user: null }),
}));

function mockLoading() {
  vi.mocked(useStrategies).mockReturnValue({ data: undefined, isLoading: true, isError: false } as never);
  vi.mocked(useBacktestsList).mockReturnValue({ data: undefined, isLoading: true, isError: false } as never);
  vi.mocked(useWatchlist).mockReturnValue({ data: undefined, isLoading: true, isError: false } as never);
}

function mockError() {
  vi.mocked(useStrategies).mockReturnValue({ data: undefined, isLoading: false, isError: true } as never);
  vi.mocked(useBacktestsList).mockReturnValue({ data: undefined, isLoading: false, isError: true } as never);
  vi.mocked(useWatchlist).mockReturnValue({ data: undefined, isLoading: false, isError: true } as never);
}

function mockLoaded() {
  vi.mocked(useStrategies).mockReturnValue({
    data: [
      {
        id: 'strategy-1',
        name: 'My RSI Strategy',
        description: null,
        timeframe: '1D',
        version: 1,
        isBuiltIn: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ],
    isLoading: false,
    isError: false,
  } as never);
  vi.mocked(useBacktestsList).mockReturnValue({
    data: [
      {
        id: 'run-1',
        strategyId: 'strategy-1',
        symbol: 'ICICIBANK.NS',
        timeframe: '1D',
        dateFrom: '2024-01-01T00:00:00.000Z',
        dateTo: '2024-02-01T00:00:00.000Z',
        status: 'COMPLETED',
        errorMessage: null,
        totalReturnPct: 0.09,
        cagr: null,
        winRate: null,
        profitFactor: null,
        maxDrawdownPct: null,
        sharpeRatio: null,
        totalTrades: 4,
        isBuiltIn: false,
        createdAt: '2024-01-02T00:00:00.000Z',
        completedAt: '2024-01-02T00:05:00.000Z',
      },
    ],
    isLoading: false,
    isError: false,
  } as never);
  vi.mocked(useWatchlist).mockReturnValue({
    data: [{ id: 'item-1', symbol: 'RELIANCE.NS', addedAt: '2024-01-03T00:00:00.000Z', isBuiltIn: false }],
    isLoading: false,
    isError: false,
  } as never);
}

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('DashboardPage', () => {
  it('links the three stat cards to their existing pages', () => {
    mockLoaded();
    renderDashboard();

    expect(screen.getByRole('link', { name: /total strategies/i })).toHaveAttribute('href', '/strategies');
    expect(screen.getByRole('link', { name: /total backtests/i })).toHaveAttribute('href', '/backtests');
    expect(screen.getByRole('link', { name: /^watchlist/i })).toHaveAttribute('href', '/watchlist');
  });

  it('links every Quick Action to its existing page', () => {
    mockLoaded();
    renderDashboard();

    expect(screen.getByRole('link', { name: '+ New Strategy' })).toHaveAttribute('href', '/strategies/new');
    expect(screen.getByRole('link', { name: 'Run Backtest' })).toHaveAttribute('href', '/backtests/new');
    expect(screen.getByRole('link', { name: 'View Charts' })).toHaveAttribute('href', '/chart');
    expect(screen.getByRole('link', { name: 'Add to Watchlist' })).toHaveAttribute('href', '/watchlist');
  });

  it('shows a loading state for the recent sections without crashing', () => {
    mockLoading();
    renderDashboard();

    expect(screen.getAllByText('Loading...').length).toBeGreaterThan(0);
  });

  it('shows an error state for the recent sections without crashing', () => {
    mockError();
    renderDashboard();

    expect(screen.getAllByText("Couldn't load this section.").length).toBeGreaterThan(0);
  });

  it('shows strategy name, timeframe, and a working View Analysis link on a recent backtest row', () => {
    mockLoaded();
    renderDashboard();

    expect(screen.getAllByText(/My RSI Strategy/).length).toBeGreaterThan(0);
    expect(screen.getByText('0.09%')).toBeInTheDocument();
    const viewAnalysisLinks = screen.getAllByRole('link', { name: /view analysis/i });
    expect(viewAnalysisLinks[0]).toHaveAttribute('href', '/backtests/run-1');
  });

  it('navigates to the Charts page with the clicked symbol selected when a watchlist row is clicked', async () => {
    mockLoaded();
    renderDashboard();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'RELIANCE.NS' }));

    expect(selectSymbolMock).toHaveBeenCalledWith({ symbol: 'RELIANCE.NS', name: 'RELIANCE.NS', exchange: '' });
    expect(navigateMock).toHaveBeenCalledWith('/chart');
  });

  it('surfaces a real personal activity entry derived from the same loaded data', () => {
    mockLoaded();
    renderDashboard();

    expect(screen.getByText('Ran backtest')).toBeInTheDocument();
    expect(screen.getByText(/ICICIBANK\.NS · My RSI Strategy/)).toBeInTheDocument();
  });
});
