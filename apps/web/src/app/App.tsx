import { Routes, Route } from 'react-router-dom';
import { AppShell } from './AppShell';
import { DashboardPage } from '../pages/DashboardPage';
import { ChartPage } from '../pages/ChartPage';
import { StrategiesPage } from '../pages/StrategiesPage';
import { StrategyBuilderPage } from '../pages/StrategyBuilderPage';
import { BacktestsPage } from '../pages/BacktestsPage';
import { BacktestNewPage } from '../pages/BacktestNewPage';
import { BacktestDetailPage } from '../pages/BacktestDetailPage';
import { BacktestComparePage } from '../pages/BacktestComparePage';
import { WatchlistPage } from '../pages/WatchlistPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useSessionBootstrap } from '../features/auth/useSessionBootstrap';

/**
 * Route table for the app. `useSessionBootstrap` runs once here, at the
 * root, so every route - protected or not - is rendered only after the app
 * has had a chance to silently restore a session from the refresh cookie.
 * /login and /register are deliberately OUTSIDE AppShell (a logged-out
 * visitor shouldn't see the authenticated app's nav bar); everything behind
 * ProtectedRoute is wrapped in AppShell instead.
 */
export function App() {
  useSessionBootstrap();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route
          path="/"
          element={
            <AppShell>
              <DashboardPage />
            </AppShell>
          }
        />
        <Route
          path="/chart"
          element={
            <AppShell>
              <ChartPage />
            </AppShell>
          }
        />
        <Route
          path="/strategies"
          element={
            <AppShell>
              <StrategiesPage />
            </AppShell>
          }
        />
        <Route
          path="/strategies/new"
          element={
            <AppShell>
              <StrategyBuilderPage />
            </AppShell>
          }
        />
        <Route
          path="/strategies/:id/edit"
          element={
            <AppShell>
              <StrategyBuilderPage />
            </AppShell>
          }
        />
        <Route
          path="/backtests"
          element={
            <AppShell>
              <BacktestsPage />
            </AppShell>
          }
        />
        <Route
          path="/backtests/new"
          element={
            <AppShell>
              <BacktestNewPage />
            </AppShell>
          }
        />
        <Route
          path="/backtests/compare"
          element={
            <AppShell>
              <BacktestComparePage />
            </AppShell>
          }
        />
        <Route
          path="/backtests/:id"
          element={
            <AppShell>
              <BacktestDetailPage />
            </AppShell>
          }
        />
        <Route
          path="/watchlist"
          element={
            <AppShell>
              <WatchlistPage />
            </AppShell>
          }
        />
      </Route>
    </Routes>
  );
}
