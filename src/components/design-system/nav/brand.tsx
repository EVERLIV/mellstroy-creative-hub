import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/src/lib/utils';

export function BrandMark({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid shrink-0 place-items-center rounded-xl bg-primary font-bold text-primary-foreground shadow-sm',
        size === 'sm' && 'size-8 text-sm',
        size === 'md' && 'size-9 text-base',
        size === 'lg' && 'size-10 text-lg',
        className
      )}
      aria-hidden
    >
      R
    </div>
  );
}

export function BrandLockup({
  to = '/',
  subtitle = 'Train smarter',
  className,
  onClick,
}: {
  to?: string;
  subtitle?: string;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn('flex min-w-0 items-center gap-3', className)}
    >
      <BrandMark />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-base font-bold leading-tight tracking-tight text-foreground">
          RhinoFit
        </span>
        <span className="truncate text-[11px] font-medium text-muted-foreground">{subtitle}</span>
      </div>
    </Link>
  );
}
