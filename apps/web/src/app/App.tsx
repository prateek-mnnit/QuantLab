import { Routes, Route } from 'react-router-dom';
import { AppShell } from './AppShell';
import { DashboardPage } from '../pages/DashboardPage';

/**
 * Route table for the app. Kept as one file rather than one router per
 * feature since, at this size, a single flat table is easier to scan than
 * the indirection of splitting it up - revisit if this grows past a
 * screenful.
 */
export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
      </Routes>
    </AppShell>
  );
}
