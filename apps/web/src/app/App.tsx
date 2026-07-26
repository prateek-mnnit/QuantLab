import { Routes, Route } from 'react-router-dom';
import { AppShell } from './AppShell';
import { DashboardPage } from '../pages/DashboardPage';
import { StrategiesPage } from '../pages/StrategiesPage';
import { StrategyBuilderPage } from '../pages/StrategyBuilderPage';
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
      </Route>
    </Routes>
  );
}
