import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Calendar,
  ChevronDown,
  Menu,
  Search,
  X,
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/src/components/ui/sheet';
import SwitchButton from '@/src/components/kokonutui/switch-button';
import { useTheme } from '@/src/hooks/useTheme';
import { useEffectiveRole } from '@/src/hooks/useViewMode';
import { BrandLockup, BrandMark, BottomTabLink, SidebarNavLink } from '@/src/components/design-system/nav';
import { APP_CONTENT } from '@/src/components/layout/shell';
import ConnectedProfileActionMenu from './ConnectedProfileActionMenu';
import ViewModeSwitcher from './ViewModeSwitcher';
import SiteFooter from './SiteFooter';
import {
  ACCOUNT_ITEMS,
  DISCOVER_ITEMS,
  NAV_ITEMS,
  isNavItemActive,
  triggerHapticFeedback,
  type NavItem,
} from './navItems';
import { cn } from '@/src/lib/utils';

/**
 * Intent: athlete books coaches/courts — chrome stays thin.
 * Hierarchy: brand → few primary links → Book Now (only loud control).
 * Rejecting: search field + location chip + theme + Account label crowding the bar.
 */

function usePrimaryNav(role: string): readonly NavItem[] {
  return useMemo(() => {
    if (role !== 'trainer') return NAV_ITEMS;
    return NAV_ITEMS.map((item) =>
      item.path === '/explore'
        ? { ...item, path: '/requests/explore', alternativePaths: ['/explore', '/requests/explore'] }
        : item
    );
  }, [role]);
}

function TopNavLink({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const active = isNavItemActive(item, pathname);
  return (
    <Link
      to={item.path}
      onClick={() => triggerHapticFeedback()}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'rounded-md px-2.5 py-1.5 text-sm transition-colors',
        active
          ? 'font-semibold text-primary'
          : 'font-medium text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {item.name}
    </Link>
  );
}

function DiscoverDropdown({ pathname }: { pathname: string }) {
  const discoverActive = DISCOVER_ITEMS.some((item) => isNavItemActive(item, pathname));
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm transition-colors',
            discoverActive
              ? 'font-semibold text-primary'
              : 'font-medium text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          Discover
          <ChevronDown className="size-3.5 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel>Discover</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {DISCOVER_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem key={item.name} asChild>
              <Link
                to={item.path}
                className={cn(
                  'flex cursor-pointer items-center gap-2',
                  isNavItemActive(item, pathname) && 'text-primary'
                )}
              >
                <Icon className="size-4" />
                {item.name}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DesktopTopNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const role = useEffectiveRole();
  const primary = usePrimaryNav(role);
  // Profile lives in the avatar menu — keep the rail short.
  const links = useMemo(
    () => primary.filter((item) => item.path !== '/profile'),
    [primary]
  );

  return (
    <header className="sticky top-0 z-40 hidden border-b border-border bg-card/95 backdrop-blur-md md:block">
      <div className={cn(APP_CONTENT, 'flex h-14 items-center gap-4 lg:h-16')}>
        <BrandLockup className="shrink-0" subtitle="Train smarter." />

        <nav className="flex min-w-0 items-center gap-0.5" aria-label="Primary">
          {links.map((item) => (
            <TopNavLink key={item.name} item={item} pathname={pathname} />
          ))}
          <DiscoverDropdown pathname={pathname} />
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <ViewModeSwitcher className="hidden 2xl:inline-flex" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Search"
            onClick={() => navigate('/search')}
          >
            <Search className="size-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Notifications"
            onClick={() => navigate('/messages')}
          >
            <Bell className="size-5" />
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary ring-2 ring-card" />
          </Button>
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            onClick={() => navigate(role === 'trainer' ? '/requests/explore' : '/venues')}
          >
            <Calendar className="size-3.5" />
            Book Now
          </Button>
          <div className="ml-1 border-l border-border pl-2">
            <ConnectedProfileActionMenu />
          </div>
        </div>
      </div>
    </header>
  );
}

function MobileTopNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { resolvedTheme, setTheme } = useTheme();
  const role = useEffectiveRole();
  const primary = usePrimaryNav(role);
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md md:hidden">
        <div className={cn(APP_CONTENT, 'flex h-14 items-center gap-2')}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <Link to="/" className="flex min-w-0 items-center gap-2 font-semibold tracking-tight">
            <BrandMark size="sm" />
            <span>RhinoFit</span>
          </Link>
          <div className="ml-auto flex items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Search"
              onClick={() => navigate('/search')}
            >
              <Search className="size-5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Notifications"
              onClick={() => navigate('/messages')}
            >
              <Bell className="size-5" />
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary ring-2 ring-card" />
            </Button>
            <Button
              type="button"
              size="sm"
              className="ml-1 h-8 gap-1 px-2.5"
              onClick={() => navigate(role === 'trainer' ? '/bookings' : '/venues')}
            >
              <Calendar className="size-3.5" />
              Book
            </Button>
          </div>
        </div>
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="flex w-[min(100%,20rem)] flex-col gap-0 p-0">
          <SheetHeader className="flex-row items-center justify-between space-y-0 border-b border-border px-4 py-4 text-left">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <BrandLockup onClick={() => setOpen(false)} />
            <Button type="button" variant="ghost" size="icon" aria-label="Close" onClick={() => setOpen(false)}>
              <X className="size-5" />
            </Button>
          </SheetHeader>
          <div className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
            <nav className="space-y-1">
              {primary.map((item) => (
                <SidebarNavLink
                  key={item.name}
                  to={item.path}
                  label={item.name}
                  icon={item.icon}
                  active={isNavItemActive(item, pathname)}
                  onClick={() => {
                    triggerHapticFeedback();
                    setOpen(false);
                  }}
                />
              ))}
            </nav>
            <div>
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Discover
              </p>
              <nav className="space-y-1">
                {DISCOVER_ITEMS.map((item) => (
                  <SidebarNavLink
                    key={item.name}
                    to={item.path}
                    label={item.name}
                    icon={item.icon}
                    active={isNavItemActive(item, pathname)}
                    onClick={() => {
                      triggerHapticFeedback();
                      setOpen(false);
                    }}
                  />
                ))}
              </nav>
            </div>
            <div>
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Account
              </p>
              <nav className="space-y-1">
                {ACCOUNT_ITEMS.map((item) => (
                  <SidebarNavLink
                    key={item.name}
                    to={item.path}
                    label={item.name}
                    icon={item.icon}
                    active={isNavItemActive(item, pathname)}
                    onClick={() => {
                      triggerHapticFeedback();
                      setOpen(false);
                    }}
                  />
                ))}
              </nav>
            </div>
          </div>
          <div className="space-y-3 border-t border-border p-3">
            <ViewModeSwitcher className="w-full justify-center" />
            <div className="flex items-center justify-between gap-2">
              <ConnectedProfileActionMenu />
              <SwitchButton size="sm" theme={resolvedTheme} onThemeChange={(n) => setTheme(n)} />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function MobileBottomNav({ role }: { role: string }) {
  const { pathname } = useLocation();
  const items = usePrimaryNav(role);
  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-1 pt-1 backdrop-blur-md md:hidden',
        'pb-[max(0.35rem,env(safe-area-inset-bottom))]'
      )}
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-lg items-stretch">
        {items.map((item) => (
          <BottomTabLink
            key={item.name}
            to={item.path}
            label={item.name}
            icon={item.icon}
            active={isNavItemActive(item, pathname)}
            onClick={() => triggerHapticFeedback()}
          />
        ))}
      </div>
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const role = useEffectiveRole();

  return (
    <div className="flex min-h-svh min-w-0 flex-col overflow-x-hidden bg-background">
      <DesktopTopNav />
      <MobileTopNav />
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </div>
      {/* Desktop site footer — messages, bookings, dialogs and all other pages. */}
      <SiteFooter />
      <MobileBottomNav role={role} />
    </div>
  );
}

export default AppShell;
