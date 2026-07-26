import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useSystemStatus } from '../features/system-status/useSystemStatus';
import { useAuthStore } from '../store/authStore';
import { useLogout } from '../features/auth/useAuth';
import { StatusBadge } from '../components/StatusBadge';

const NAV_LINK_BASE =
  'text-sm font-medium transition-colors hover:text-slate-100';

/**
 * Top-level layout shared by every authenticated page: a persistent nav bar
 * plus a content slot. Now that both Dashboard and Strategies exist as real
 * routes, this carries actual navigation - `NavLink` (rather than plain
 * `Link`) applies an "active" style automatically based on the current
 * route, so there's no manual `useLocation` comparison needed here.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { data, isError, isLoading } = useSystemStatus();
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();

  const status = isLoading ? 'checking' : isError || !data ? 'disconnected' : 'connected';

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-surface-border bg-surface-raised">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 font-bold text-white">
                Q
              </div>
              <span className="text-lg font-semibold tracking-tight text-slate-50">
                QuantLab
              </span>
            </div>
            <nav className="flex items-center gap-6">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `${NAV_LINK_BASE} ${isActive ? 'text-slate-100' : 'text-slate-400'}`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/strategies"
                className={({ isActive }) =>
                  `${NAV_LINK_BASE} ${isActive ? 'text-slate-100' : 'text-slate-400'}`
                }
              >
                Strategies
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <StatusBadge status={status} />
            {user && <span className="text-sm text-slate-400">{user.email}</span>}
            <button
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              className="text-sm font-medium text-slate-400 transition-colors hover:text-slate-100 disabled:opacity-50"
            >
              {logout.isPending ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
