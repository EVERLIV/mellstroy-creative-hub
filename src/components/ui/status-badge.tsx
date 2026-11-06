import * as React from 'react';
import { cn } from '@/src/lib/utils';

/** The only place status colors are defined. Pages pick a tone, never a color. */
const TONE_CLASSES = {
  success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  info: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  danger: 'bg-destructive/15 text-destructive',
  primary: 'bg-primary/15 text-primary',
  neutral: 'bg-muted text-muted-foreground',
} as const;

export type StatusTone = keyof typeof TONE_CLASSES;

/** Maps every status string used in the app (bookings, requests, payments, subscriptions) to a tone. */
const STATUS_TONES: Record<string, StatusTone> = {
  attended: 'success',
  accepted: 'success',
  confirmed: 'success',
  paid: 'success',
  active: 'success',
  verified: 'success',
  booked: 'primary',
  open: 'info',
  pending: 'warning',
  rejected: 'danger',
  failed: 'danger',
  canceled: 'danger',
  cancelled: 'danger',
  expired: 'neutral',
  closed: 'neutral',
  read: 'neutral',
};

export const statusTone = (status: string): StatusTone => STATUS_TONES[status.toLowerCase()] ?? 'neutral';

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Raw status from the API; tone and label are derived from it. */
  status?: string;
  tone?: StatusTone;
}

export function StatusBadge({ status, tone, className, children, ...props }: StatusBadgeProps) {
  const resolvedTone = tone ?? (status ? statusTone(status) : 'neutral');
  const label = children ?? (status ? status.charAt(0).toUpperCase() + status.slice(1) : null);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        TONE_CLASSES[resolvedTone],
        className
      )}
      {...props}
    >
      {label}
    </span>
  );
}
