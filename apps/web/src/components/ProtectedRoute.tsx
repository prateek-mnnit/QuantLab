import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/**
 * A "layout route" pattern from react-router: this component renders
 * <Outlet /> (whichever child route matched) instead of taking children as
 * a prop, which is what lets it wrap multiple protected routes in App.tsx
 * with a single <Route element={<ProtectedRoute />}> wrapper rather than
 * repeating a guard around every page.
 *
 * Three states, three behaviors:
 * - 'idle'            -> render a lightweight loading state (bootstrap in flight)
 * - 'unauthenticated'  -> redirect to /login, remembering the attempted route
 * - 'authenticated'     -> render the matched child route
 */
export function ProtectedRoute() {
  const status = useAuthStore((state) => state.status);
  const location = useLocation();

  if (status === 'idle') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <span className="text-sm text-slate-500">Loading...</span>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
