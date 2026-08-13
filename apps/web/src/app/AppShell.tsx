import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useSystemStatus } from '../features/system-status/useSystemStatus';
import { useAuthStore } from '../store/authStore';
import { useLogout } from '../features/auth/useAuth';
import { StatusBadge } from '../components/StatusBadge';

const NAV_LINK_BASE =
  'text-sm font-medium transition-colors hover:text-slate-100';

const NAV_ITEMS: Array<{ to: string; label: string; end?: boolean }> = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/chart', label: 'Charts' },
  { to: '/strategies', label: 'Strategies' },
  { to: '/backtests', label: 'Backtests' },
  { to: '/watchlist', label: 'Watchlist' },
];

/**
 * Top-level layout shared by every authenticated page: a persistent nav bar
 * plus a content slot. Now that both Dashboard and Strategies exist as real
 * routes, this carries actual navigation - `NavLink` (rather than plain
 * `Link`) applies an "active" style automatically based on the current
 * route, so there's no manual `useLocation` comparison needed here.
 *
 * UI-1: the nav links collapse behind a hamburger menu below the `md`
 * breakpoint - the same `NAV_ITEMS` list drives both the inline desktop
 * nav and the mobile dropdown, so there's exactly one place that defines
 * "what's in the nav". Routing/auth behavior is untouched; this is purely
 * a smaller-screen presentation of the same links and controls.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { data, isError, isLoading } = useSystemStatus();
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const status = isLoading ? 'checking' : isError || !data ? 'disconnected' : 'connected';

  function closeMenu(): void {
    setIsMenuOpen(false);
  }

  function handleLogout(): void {
    closeMenu();
    logout.mutate();
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-surface-border bg-surface-raised">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 font-bold text-white">
                Q
              </div>
              <span className="text-lg font-semibold tracking-tight text-slate-50">
                QuantLab
              </span>
            </div>
            {/* Desktop nav: hidden below `md`, where the hamburger button
                (below) takes over instead. */}
            <nav className="hidden items-center gap-6 md:flex">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `${NAV_LINK_BASE} ${isActive ? 'text-slate-100' : 'text-slate-400'}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Status badge stays visible at every width - it's small and
                useful context even on a phone. The email is hidden on the
                narrowest screens purely for space; it's also shown inside
                the mobile menu below. */}
            <div className="hidden sm:block">
              <StatusBadge status={status} />
            </div>
            {user && <span className="hidden text-sm text-slate-400 md:inline">{user.email}</span>}
            <button
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              className="hidden text-sm font-medium text-slate-400 transition-colors hover:text-slate-100 disabled:opacity-50 md:inline-block"
            >
              {logout.isPending ? 'Signing out...' : 'Sign out'}
            </button>

            {/* Hamburger toggle: only rendered/interactive below `md`. */}
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-nav-menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border text-slate-300 transition-colors hover:bg-surface hover:text-slate-100 md:hidden"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                {isMenuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile dropdown: nav links + status + account controls, all in
            one place, so nothing from the desktop header is lost on a
            narrow screen. */}
        {isMenuOpen && (
          <div id="mobile-nav-menu" className="border-t border-surface-border bg-surface-raised md:hidden">
            <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive ? 'bg-surface text-slate-100' : 'text-slate-400 hover:bg-surface hover:text-slate-100'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="mt-2 flex items-center justify-between border-t border-surface-border px-3 pt-3">
                <div className="flex items-center gap-3">
                  <StatusBadge status={status} />
                  {user && <span className="text-sm text-slate-400">{user.email}</span>}
                </div>
                <button
                  onClick={handleLogout}
                  disabled={logout.isPending}
                  className="text-sm font-medium text-slate-400 transition-colors hover:text-slate-100 disabled:opacity-50"
                >
                  {logout.isPending ? 'Signing out...' : 'Sign out'}
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
