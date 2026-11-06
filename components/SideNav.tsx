import React from 'react';
import { useLocation } from 'react-router-dom';
import { NavLink } from './NavLink';
import { cn } from '@/src/lib/utils';
import { NAV_ITEMS, isNavItemActive } from './navItems';
import rhinoLogo from '@/src/assets/rhino-logo.png';
import { SIDEBAR_WIDTH } from '@/src/components/layout/shell';
import CommandPalette from './CommandPalette';
import ConnectedProfileActionMenu from './ConnectedProfileActionMenu';

/**
 * Desktop navigation (md+). Icon rail on tablets, full labels on lg+.
 * Width and the content offset both come from src/components/layout/shell.ts.
 */
const SideNav: React.FC = () => {
  const { pathname } = useLocation();

  return (
    <aside
      aria-label="Main"
      className={cn('fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-card md:flex', SIDEBAR_WIDTH)}
    >
      <NavLink to="/" end className="flex h-20 items-center justify-center px-3 lg:justify-start lg:px-5">
        <img src={rhinoLogo} alt="RhinoFit" className="h-14 w-14 object-contain" />
        <span className="ml-2 hidden text-lg font-bold text-foreground lg:inline">RhinoFit</span>
      </NavLink>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = isNavItemActive(item, pathname);
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              end
              title={item.name}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex h-11 items-center justify-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors lg:justify-start',
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
              <span className="hidden lg:inline">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 border-t border-border p-3">
        <div className="flex justify-center lg:justify-stretch">
          <ConnectedProfileActionMenu className="w-full max-w-full" />
        </div>
        <div className="hidden lg:block">
          <CommandPalette />
        </div>
      </div>
    </aside>
  );
};

export default SideNav;
