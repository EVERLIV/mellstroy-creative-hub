import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { formatVND } from '@/src/lib/format';

/** Shared RhinoFit performance-card shell. */
export function CardShell({
  className,
  accentTop,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & { accentTop?: boolean }) {
  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm',
        className
      )}
      {...props}
    >
      {accentTop ? (
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary to-orange-400" aria-hidden />
      ) : null}
      {children}
    </article>
  );
}

export type CardBadgeTone = 'primary' | 'secondary' | 'success' | 'accent' | 'muted' | 'overlay';

const BADGE_TONES: Record<CardBadgeTone, string> = {
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-primary/90 text-primary-foreground',
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  accent: 'bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200',
  muted: 'bg-muted text-muted-foreground',
  overlay: 'bg-background/90 text-foreground backdrop-blur-sm',
};

export function CardBadge({
  tone = 'muted',
  className,
  children,
}: {
  tone?: CardBadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
        BADGE_TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function RatingPill({
  rating,
  reviews,
  className,
  compact,
}: {
  rating: number;
  reviews?: number;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-lg bg-muted/70 px-2 py-1 text-xs font-semibold text-foreground',
        compact && 'bg-transparent px-0 py-0',
        className
      )}
      aria-label={`Rated ${rating.toFixed(1)} out of 5`}
    >
      <Star className="size-3.5 fill-amber-500 text-amber-500" aria-hidden />
      <span>{rating.toFixed(1)}</span>
      {typeof reviews === 'number' ? (
        <span className="font-normal text-muted-foreground">({reviews})</span>
      ) : null}
    </div>
  );
}

export function PriceBlock({
  amount,
  unit = '/hr',
  compareAt,
  size = 'md',
  className,
}: {
  amount: number;
  unit?: string;
  compareAt?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="flex flex-wrap items-baseline gap-1.5">
        <span
          className={cn(
            'font-bold tabular-nums tracking-tight text-foreground',
            size === 'sm' && 'text-sm',
            size === 'md' && 'text-lg',
            size === 'lg' && 'text-2xl'
          )}
        >
          {formatVND(amount)}
        </span>
        {compareAt != null && compareAt > amount ? (
          <span className="text-xs text-muted-foreground line-through">{formatVND(compareAt)}</span>
        ) : null}
        {unit ? <span className="text-xs font-normal text-muted-foreground">{unit}</span> : null}
      </div>
    </div>
  );
}

export function CapacityBar({
  filled,
  capacity,
  hint,
  className,
}: {
  filled: number;
  capacity: number;
  hint?: string;
  className?: string;
}) {
  const pct = capacity > 0 ? Math.min(100, Math.round((filled / capacity) * 100)) : 0;
  const remaining = Math.max(0, capacity - filled);
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between text-[11px] font-medium">
        <span className="text-muted-foreground">Confirmed</span>
        <span className="font-bold text-foreground">
          {filled} / {capacity} spots
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full border border-border bg-muted">
        <div
          className={cn('h-full rounded-full', pct >= 75 ? 'bg-primary' : 'bg-orange-500')}
          style={{ width: `${pct}%` }}
        />
      </div>
      {hint ? (
        <p className="text-[11px] font-medium text-orange-800 dark:text-orange-200">{hint}</p>
      ) : remaining > 0 && remaining <= 3 ? (
        <p className="text-[11px] font-medium text-orange-800 dark:text-orange-200">
          Only {remaining} spot{remaining === 1 ? '' : 's'} left
        </p>
      ) : remaining > 3 ? (
        <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">Open enrollment</p>
      ) : (
        <p className="text-[11px] font-medium text-muted-foreground">Full</p>
      )}
    </div>
  );
}

export function CardChip({
  children,
  active,
  className,
}: {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-md border px-2.5 py-1 text-[11px] font-medium',
        active
          ? 'border-primary/30 bg-primary/10 font-semibold text-primary'
          : 'border-border bg-muted/50 text-muted-foreground',
        className
      )}
    >
      {children}
    </span>
  );
}

export function CardSectionLabel({
  color = 'primary',
  title,
  meta,
}: {
  color?: 'primary' | 'secondary' | 'success' | 'accent';
  title: string;
  meta?: string;
}) {
  const dot =
    color === 'secondary'
      ? 'bg-orange-500'
      : color === 'success'
        ? 'bg-emerald-600'
        : color === 'accent'
          ? 'bg-amber-500'
          : 'bg-primary';
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className={cn('size-2.5 shrink-0 rounded-full', dot)} />
        <h2 className="truncate text-lg font-bold tracking-tight text-foreground md:text-xl">{title}</h2>
      </div>
      {meta ? <span className="shrink-0 text-[11px] font-medium text-muted-foreground">{meta}</span> : null}
    </div>
  );
}
