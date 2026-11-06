import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import type { LucideIcon } from 'lucide-react';

export function NavSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground group-data-[collapsible=icon]:hidden">
      {children}
    </div>
  );
}

export function SidebarNavLink({
  to,
  label,
  icon: Icon,
  active,
  onClick,
  className,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors active:scale-[0.98]',
        'group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:p-0',
        active
          ? 'bg-primary/10 font-semibold text-primary'
          : 'font-medium text-muted-foreground hover:bg-muted hover:text-foreground',
        className
      )}
      title={label}
    >
      <Icon
        className={cn('size-5 shrink-0', active ? 'text-primary' : 'text-muted-foreground')}
        strokeWidth={active ? 2.25 : 2}
        aria-hidden
      />
      <span className="truncate group-data-[collapsible=icon]:hidden">{label}</span>
    </Link>
  );
}

export function BottomTabLink({
  to,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition-colors',
        active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
      )}
    >
      <span
        className={cn(
          'grid size-9 place-items-center rounded-xl transition-colors',
          active && 'bg-primary/10'
        )}
      >
        <Icon className="size-5" strokeWidth={active ? 2.4 : 2} aria-hidden />
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}
