import React from 'react';
import { useLocation } from 'react-router-dom';
import { NavLink } from './NavLink';
import { cn } from '@/src/lib/utils';
import { NAV_ITEMS, isNavItemActive, triggerHapticFeedback } from './navItems';

/** Mobile-only tab bar. On md+ screens navigation lives in <SideNav />. */
const BottomNav: React.FC = () => {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_4px_rgba(0,0,0,0.05)] backdrop-blur supports-[backdrop-filter]:bg-card/80 md:hidden"
    >
      <div className="flex h-14 items-center justify-around px-4 pb-1">
        {NAV_ITEMS.map((item) => {
          const isActive = isNavItemActive(item, pathname);
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              end
              onClick={triggerHapticFeedback}
              aria-label={item.name}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'group relative flex h-10 items-center justify-center rounded-full transition-all duration-300 ease-out active:scale-90 active:opacity-80',
                isActive
                  ? 'gap-2 bg-primary/20 px-4 text-primary shadow-sm dark:bg-primary/30'
                  : 'w-10 text-muted-foreground hover:bg-muted'
              )}
            >
              <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
              {isActive && (
                <span className="animate-fade-in whitespace-nowrap text-sm font-semibold">{item.name}</span>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
