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
import { ChatTrigger } from '../chat/ChatTrigger';
import { ChatDrawer } from '../chat/ChatDrawer';
import { publishPage } from '../../chat/pageContext';

const NAV = [
  { to: '/', label: 'Routines', end: true },
  { to: '/products', label: 'Products' },
  { to: '/c/pigmentation', label: 'Pigmentation protocol', short: 'Pigmentation' },
];

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
  const theme = useTheme();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); publishPage({ route: pathname }); }, [pathname]);
  useEffect(() => { publishPage({ theme, dataVersion: manifest.status === 'ready' ? manifest.data.generatedAt : null }); }, [theme, manifest]);
  return (
    <div className="min-h-dvh">
      <button type="button" onClick={() => document.getElementById('main')?.focus()}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-page">Skip to content</button>
      <header className="glass sticky top-0 z-40 border-b border-line">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-2 px-4 sm:h-16 sm:flex-nowrap sm:gap-4 sm:px-6">
          <NavLink to="/" className="flex h-14 shrink-0 items-center gap-2.5 no-underline sm:h-auto">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[13px] font-extrabold text-accent-ink" aria-hidden>S</span>
            <span className="hidden text-[15px] font-extrabold tracking-tight text-display min-[360px]:inline">Skin Ledger</span>
          </NavLink>
          <nav aria-label="Primary" className="scrollbar-none order-last -mx-4 flex h-11 basis-full items-stretch overflow-x-auto px-1 sm:order-none sm:mx-0 sm:h-full sm:min-w-0 sm:flex-1 sm:basis-auto sm:justify-center sm:gap-1 sm:px-0">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end}
                className={({ isActive }) => clsx('relative flex items-center whitespace-nowrap px-3 text-[14px] font-bold text-secondary no-underline transition-colors hover:text-display',
                  'after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-t-full after:bg-accent after:opacity-0 after:transition-opacity',
                  isActive && 'text-display after:opacity-100')}>
                {n.short ? <><span className="sm:hidden">{n.short}</span><span className="hidden sm:inline">{n.label}</span></> : n.label}
              </NavLink>
            ))}
          </nav>
          <span className="flex-1 sm:hidden" aria-hidden />
          <CommandSearch />
          <ChatTrigger />
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
              Every product is a real listing captured live from Flipkart or Amazon.in. Scores are read only from the published ingredient list, the accountable maker and real buyer ratings — seller claims are shown as claims and score nothing. Unknown fields say so. Nothing here is lab-tested or medical advice.
            </p>
            {manifest.status === 'ready' && <LiveDataBadge capturedAt={manifest.data.generatedAt} className="mt-4" />}
          </div>
          {manifest.status === 'ready' && (
            <dl className="grid grid-cols-3 gap-6 self-start md:text-right">
              <div><dt className="label">Listings</dt><dd className="mt-0.5 text-[20px] font-extrabold text-display">{manifest.data.total.toLocaleString('en-IN')}</dd></div>
              <div><dt className="label">Routines</dt><dd className="mt-0.5 text-[20px] font-extrabold text-display">{manifest.data.routines.count}</dd></div>
              <div><dt className="label">Data captured</dt><dd className="mt-0.5 text-[20px] font-extrabold text-display">{manifest.data.generatedAt.slice(0, 10)}</dd></div>
            </dl>
          )}
        </div>
      </footer>
      <ToastStack />
      <ChatDrawer />
      <DevPanel />
    </div>
  );
}
