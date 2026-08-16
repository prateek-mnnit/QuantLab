import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useSystemStatus } from '../features/system-status/useSystemStatus';
import { useAuthStore } from '../store/authStore';
import { useLogout } from '../features/auth/useAuth';

// ─── SVG Icons ─────────────────────────────────────────────────────────────
// Each icon is a minimal 24px stroke SVG, matching the visual style of the
// reference screenshots — thin strokes, rounded caps, no fills.

function IconDashboard({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function IconStrategies({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 3h18v4H3zM3 10.5h14M3 15h10M3 19.5h6" />
    </svg>
  );
}
function IconBuilder({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}
function IconBacktests({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
function IconWatchlist({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function IconCharts({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6"  y1="20" x2="6"  y2="14" />
    </svg>
  );
}
function IconSignOut({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
function IconLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#22c55e" fillOpacity="0.15" />
      <polyline
        points="6 20 11 12 16 16 21 8 26 14"
        stroke="#22c55e"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// ─── Nav Items ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: '/',            label: 'Dashboard',       Icon: IconDashboard,  activeColor: 'text-violet-400', end: true  },
  { to: '/chart',       label: 'Charts',          Icon: IconCharts,     activeColor: 'text-cyan-500',   end: false },
  { to: '/strategies',  label: 'Strategies',      Icon: IconStrategies, activeColor: 'text-indigo-400', end: false },
  { to: '/strategies/new', label: 'Strategy Builder', Icon: IconBuilder, activeColor: 'text-indigo-400', end: false },
  { to: '/backtests',   label: 'Backtests',       Icon: IconBacktests,  activeColor: 'text-profit',     end: false },
  { to: '/watchlist',   label: 'Watchlist',       Icon: IconWatchlist,  activeColor: 'text-amber-500',  end: false },
] as const;

// Mobile-only bottom nav uses a subset (5 most important routes)
const MOBILE_NAV_ITEMS = [
  { to: '/',           label: 'Dashboard',  Icon: IconDashboard,  activeColor: 'text-violet-400', end: true  },
  { to: '/chart',      label: 'Charts',     Icon: IconCharts,     activeColor: 'text-cyan-500',   end: false },
  { to: '/strategies', label: 'Strategies', Icon: IconStrategies, activeColor: 'text-indigo-400', end: false },
  { to: '/backtests',  label: 'Backtests',  Icon: IconBacktests,  activeColor: 'text-profit',     end: false },
  { to: '/watchlist',  label: 'Watchlist',  Icon: IconWatchlist,  activeColor: 'text-amber-500',  end: false },
] as const;

// ─── Status dot ──────────────────────────────────────────────────────────────
function StatusDot({ status }: { status: 'connected' | 'disconnected' | 'checking' }) {
  const color =
    status === 'connected'    ? 'bg-profit' :
    status === 'disconnected' ? 'bg-loss'   : 'bg-zinc-500';
  return (
    <span
      title={
        status === 'connected'    ? 'API Connected' :
        status === 'disconnected' ? 'API Unreachable' : 'Checking…'
      }
      className={`h-1.5 w-1.5 rounded-full ${color} flex-shrink-0`}
    />
  );
}

// ─── Sidebar nav item ─────────────────────────────────────────────────────────
function SideNavItem({
  to,
  label,
  Icon,
  activeColor,
  end,
  onClick,
}: {
  to: string;
  label: string;
  Icon: (props: { className?: string }) => React.ReactElement;
  activeColor?: string;
  end?: boolean;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-100 ${
          isActive
            ? 'bg-zinc-800/60 text-zinc-100 before:absolute before:left-0 before:top-1/2 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-accent-500'
            : 'text-zinc-500 hover:bg-zinc-800/40 hover:text-zinc-200'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? (activeColor || 'text-accent-500') : 'text-zinc-500 group-hover:text-zinc-300'}`} />
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
}

// ─── AppShell ─────────────────────────────────────────────────────────────────
/**
 * Authenticated layout: compact left sidebar (desktop) + bottom tab bar
 * (mobile). The sidebar is 220px wide on ≥lg screens. Routing, auth, and
 * query behavior are untouched — this is a purely structural/visual change.
 *
 * High-risk notes:
 * - <Outlet>/children rendering is identical to the old layout — nothing
 *   about what gets rendered for each route changes.
 * - useSystemStatus, useAuthStore, useLogout hooks are unchanged.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { data, isError, isLoading } = useSystemStatus();
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const status: 'connected' | 'disconnected' | 'checking' =
    isLoading ? 'checking' : isError || !data ? 'disconnected' : 'connected';

  function handleLogout() {
    setMobileMenuOpen(false);
    logout.mutate();
  }

  return (
    <div className="flex min-h-screen bg-background font-sans text-zinc-100">
      {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex lg:flex-shrink-0"
        aria-label="Main navigation"
      >
        <div className="flex w-[220px] flex-col border-r border-zinc-800 bg-[#0c0c0e]">
          {/* Logo */}
          <div className="flex h-14 items-center gap-2.5 border-b border-zinc-800 px-4">
            <IconLogo className="h-8 w-8 flex-shrink-0" />
            <span className="text-base font-semibold tracking-tight text-zinc-100">
              QuantLab
            </span>
          </div>

          {/* Nav links */}
          <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
            {NAV_ITEMS.map((item) => (
              <SideNavItem
                key={item.to}
                to={item.to}
                label={item.label}
                Icon={item.Icon}
                activeColor={item.activeColor}
                end={item.end}
              />
            ))}
          </nav>

          {/* Footer: status + user + sign out */}
          <div className="border-t border-zinc-800 px-3 py-3 space-y-2">
            <div className="flex items-center gap-2 px-1">
              <StatusDot status={status} />
              <span className="text-xs text-zinc-600 truncate flex-1">
                {status === 'connected' ? 'API live' : status === 'disconnected' ? 'API offline' : 'Checking…'}
              </span>
            </div>
            {user && (
              <div className="px-1">
                <p className="truncate text-xs text-zinc-500">{user.email}</p>
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              disabled={logout.isPending}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-800/40 hover:text-zinc-200 disabled:opacity-50"
            >
              <IconSignOut className="h-4 w-4 flex-shrink-0" />
              {logout.isPending ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile header (top bar, lg hidden) ───────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-zinc-800 bg-[#0c0c0e] px-4 lg:hidden">
          <div className="flex items-center gap-2.5">
            <IconLogo className="h-7 w-7" />
            <span className="text-sm font-semibold tracking-tight text-zinc-100">QuantLab</span>
          </div>
          <div className="flex items-center gap-3">
            <StatusDot status={status} />
            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-menu"
              className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
                {mobileMenuOpen
                  ? <path d="M6 6l12 12M18 6L6 18" />
                  : <path d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </header>

        {/* Mobile slide-down menu */}
        {mobileMenuOpen && (
          <div
            id="mobile-nav-menu"
            className="absolute inset-x-0 top-14 z-40 border-b border-zinc-800 bg-[#0c0c0e] shadow-dropdown lg:hidden"
          >
            <nav className="flex flex-col gap-0.5 px-3 py-2">
              {NAV_ITEMS.map((item) => (
                <SideNavItem
                  key={item.to}
                  to={item.to}
                  label={item.label}
                  Icon={item.Icon}
                  end={item.end}
                  onClick={() => setMobileMenuOpen(false)}
                />
              ))}
            </nav>
            <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3">
              <div className="flex items-center gap-2">
                <StatusDot status={status} />
                {user && <span className="text-xs text-zinc-500 truncate max-w-[180px]">{user.email}</span>}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={logout.isPending}
                className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-200 disabled:opacity-50 transition-colors"
              >
                <IconSignOut className="h-4 w-4" />
                {logout.isPending ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </div>
        )}

        {/* ── Page content ───────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1280px] px-5 py-5 pb-24 lg:pb-5">
            {children}
          </div>
        </main>

        {/* ── Mobile bottom tab bar ─────────────────────────────────────── */}
        <nav
          aria-label="Mobile navigation"
          className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-zinc-800 bg-[#0c0c0e] lg:hidden"
        >
          {MOBILE_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors duration-100 ${
                  isActive ? (item.activeColor || 'text-accent-500') : 'text-zinc-600 hover:text-zinc-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.Icon className={`h-5 w-5 ${isActive ? (item.activeColor || 'text-accent-500') : ''}`} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
