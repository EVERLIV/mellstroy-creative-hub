import React from 'react';
import { cn } from '@/src/lib/utils';
import { APP_CONTENT } from '@/src/components/layout/shell';

/** Shared Stitch page canvas — matches Profile/Explore gutters. */
export function StitchCanvas({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(APP_CONTENT, 'space-y-6 py-6', className)}>{children}</div>
  );
}

/** Title row used across Stitch-redesigned main pages. */
export function StitchPageHeader({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

/** White panel used for lists / widgets. */
export function StitchPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border border-border bg-card shadow-sm', className)}>
      {children}
    </div>
  );
}
