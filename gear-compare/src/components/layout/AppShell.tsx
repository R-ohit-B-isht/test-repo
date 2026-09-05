import { Outlet, useLocation } from 'react-router-dom';
import { AppNavLink as NavLink } from '../ui/AppLink';
import { clsx } from 'clsx';
import { useEffect } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useManifest } from '../../data/hooks';
import { DevPanel } from '../dev/DevPanel';
import { setTheme, useTheme, type Theme } from '../../state/themeStore';
import { RadioMenu } from '../ui/RadioMenu';
import { ToastStack } from '../ui/ToastStack';
import { CommandSearch } from '../search/CommandSearch';
import { LiveDataBadge } from '../ui/primitives';

const NAV = [{ to: '/', label: 'Categories', end: true, short: 'Categories' }];

const THEME_ICON = { auto: Monitor, light: Sun, dark: Moon } as const;
const THEME_OPTIONS = [
  { value: 'auto' as Theme, label: 'Use device settings', hint: 'Follows your system appearance', icon: <Monitor size={15} /> },
  { value: 'light' as Theme, label: 'Light', hint: 'Paper and ink', icon: <Sun size={15} /> },
  { value: 'dark' as Theme, label: 'Dark', hint: 'Ink and paper', icon: <Moon size={15} /> },
];

/** Booking / MyFitnessPal "Appearance" radio group, opened from one icon button. */
function ThemeMenu() {
  const theme = useTheme();
  const Icon = THEME_ICON[theme];
  return (
    <RadioMenu<Theme> value={theme} options={THEME_OPTIONS} onChange={setTheme} heading="Appearance"
      triggerLabel={`Appearance: ${THEME_OPTIONS.find((o) => o.value === theme)?.label ?? theme}`} triggerClassName="btn h-9 w-9 shrink-0 px-0"
      trigger={() => <Icon size={15} />} />
  );
}

export function AppShell() {
  const manifest = useManifest();
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  /** One nav link per category, straight from the manifest — the nav grows as categories are added. */
  const links = manifest.status === 'ready' ? [...NAV, ...manifest.data.categories.map((c) => ({ to: `/c/${c.id}`, label: c.label, short: c.label, end: false }))] : NAV;
  const official = manifest.status === 'ready' ? manifest.data.categories.reduce((n, c) => n + c.evidence.official, 0) : 0;
  return (
    <div className="min-h-dvh">
      <button type="button" onClick={() => document.getElementById('main')?.focus()}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-page">Skip to content</button>
      <header className="glass sticky top-0 z-40 border-b border-line">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-4 sm:px-6">
          <NavLink to="/" className="flex shrink-0 items-center gap-2.5 no-underline">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[13px] font-extrabold text-accent-ink" aria-hidden>G</span>
            <span className="hidden text-[15px] font-extrabold tracking-tight text-display sm:inline">Gear Ledger</span>
          </NavLink>
          <nav aria-label="Primary" className="scrollbar-none flex h-full min-w-0 flex-1 items-stretch gap-0 overflow-x-auto sm:justify-center sm:gap-1">
            {links.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end}
                className={({ isActive }) => clsx('relative flex items-center whitespace-nowrap px-2 text-[13px] font-bold sm:px-3 sm:text-[14px] text-secondary no-underline transition-colors hover:text-display',
                  'after:absolute after:inset-x-2 after:bottom-0 sm:after:inset-x-3 after:h-[3px] after:rounded-t-full after:bg-accent after:opacity-0 after:transition-opacity',
                  isActive && 'text-display after:opacity-100')}>
                <span className="sm:hidden">{n.short}</span><span className="hidden sm:inline">{n.label}</span>
              </NavLink>
            ))}
          </nav>
          <CommandSearch />
          <ThemeMenu />
        </div>
      </header>
      <main id="main" tabIndex={-1} className="outline-none mx-auto max-w-[1440px] px-4 pb-24 sm:px-6">
        <Outlet />
      </main>
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-10 text-[13px] text-secondary sm:px-6 md:grid-cols-[1fr_auto]">
          <div className="max-w-2xl">
            <p className="text-[15px] font-extrabold text-display">Real listings or nothing.</p>
            <p className="mt-2">
              Every product is a real listing captured live from Flipkart or Amazon.in. Scores are read only from specifications the maker published or the marketplace spec table states, the accountable maker and its warranty, and real buyer ratings — title and seller-text claims are shown as claims and score nothing. Rejected and unstated fields say so. Nothing here is lab-tested.
            </p>
            {manifest.status === 'ready' && <LiveDataBadge capturedAt={manifest.data.generatedAt} className="mt-4" />}
          </div>
          {manifest.status === 'ready' && (
            <dl className="grid grid-cols-3 gap-6 self-start md:text-right">
              <div><dt className="label">Listings</dt><dd className="mt-0.5 text-[20px] font-extrabold text-display">{manifest.data.total.toLocaleString('en-IN')}</dd></div>
              <div><dt className="label">Maker-verified</dt><dd className="mt-0.5 text-[20px] font-extrabold text-display">{official.toLocaleString('en-IN')}</dd></div>
              <div><dt className="label">Data captured</dt><dd className="mt-0.5 text-[20px] font-extrabold text-display">{manifest.data.generatedAt.slice(0, 10)}</dd></div>
            </dl>
          )}
        </div>
      </footer>
      <ToastStack />
      <DevPanel />
    </div>
  );
}
