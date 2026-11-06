import React from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { formatVND } from '@/src/lib/format';
import { CardShell, PriceBlock } from './primitives';

export type ActiveBookingCardProps = {
  reference?: string;
  title: string;
  whenLabel: string;
  courtLabel?: string;
  initials?: string;
  onAddToCalendar?: () => void;
  className?: string;
};

export function ActiveBookingCard({
  reference = '#RH-9428',
  title,
  whenLabel,
  courtLabel,
  initials = 'RF',
  onAddToCalendar,
  className,
}: ActiveBookingCardProps) {
  return (
    <CardShell
      className={cn(
        'border-emerald-200/60 bg-gradient-to-br from-card to-emerald-50/40 p-4 dark:border-emerald-900 dark:to-emerald-950/20',
        className
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="size-3.5" />
          Active Booking Confirmed
        </span>
        <span className="text-[11px] text-muted-foreground">{reference}</span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-foreground">{title}</p>
          <p className="text-[11px] text-muted-foreground">{whenLabel}</p>
        </div>
      </div>
      {(courtLabel || onAddToCalendar) && (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-border/70 bg-card p-2 text-xs">
          <span className="text-muted-foreground">{courtLabel}</span>
          {onAddToCalendar ? (
            <button type="button" className="font-semibold text-primary hover:underline" onClick={onAddToCalendar}>
              Add to Calendar
            </button>
          ) : null}
        </div>
      )}
    </CardShell>
  );
}

export type DenseListRowProps = {
  icon?: React.ReactNode;
  title: string;
  meta: string;
  price: number;
  status: 'available' | 'limited' | 'booked';
  statusLabel?: string;
  onClick?: () => void;
  className?: string;
};

export function DenseListRow({
  icon,
  title,
  meta,
  price,
  status,
  statusLabel,
  onClick,
  className,
}: DenseListRowProps) {
  const booked = status === 'booked';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={booked}
      className={cn(
        'flex w-full items-center justify-between rounded-lg border border-border/70 p-2.5 text-left transition-colors',
        booked ? 'opacity-70' : 'hover:bg-muted/50',
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <h5
            className={cn(
              'truncate text-xs font-semibold',
              booked ? 'text-muted-foreground line-through' : 'text-foreground'
            )}
          >
            {title}
          </h5>
          <p className="text-[11px] text-muted-foreground">{meta}</p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <span className="block text-xs font-bold tabular-nums text-foreground">{formatVND(price)}</span>
        <span
          className={cn(
            'text-[11px] font-semibold',
            status === 'available' && 'text-emerald-700',
            status === 'limited' && 'text-orange-700',
            status === 'booked' && 'text-destructive'
          )}
        >
          {statusLabel ?? (status === 'available' ? 'Available' : status === 'limited' ? '1 Left' : 'Booked')}
        </span>
      </div>
    </button>
  );
}

export function DenseListCard({
  title = 'STATE A: DENSE COMPACT LIST',
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <CardShell className={cn('space-y-3 p-4', className)}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-muted-foreground">{title}</span>
        <span className="rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">Scannable</span>
      </div>
      {children}
    </CardShell>
  );
}

export type SessionInspectCardProps = {
  title?: string;
  subtitle: string;
  ratingLabel?: string;
  rows: { label: string; value: string; accent?: boolean }[];
  total: number;
  onConfirm?: () => void;
  onClose?: () => void;
  className?: string;
};

export function SessionInspectCard({
  title = 'Session Detail Inspection',
  subtitle,
  ratingLabel = '4.9★',
  rows,
  total,
  onConfirm,
  onClose,
  className,
}: SessionInspectCardProps) {
  return (
    <CardShell className={cn('border-2 border-primary/40 p-5 shadow-md', className)}>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[11px] font-bold text-primary">STATE B: EXPANDED DETAIL</span>
        {onClose ? (
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close">
            <X className="size-4" />
          </button>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
          {ratingLabel}
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="mt-4 space-y-2 rounded-lg border border-border/70 bg-muted/30 p-3 text-xs">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-2">
            <span className="text-muted-foreground">{row.label}</span>
            <span className={cn('font-medium', row.accent ? 'text-emerald-700' : 'text-foreground')}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] text-muted-foreground">Total fee</p>
          <PriceBlock amount={total} unit="" size="md" className="[&_span]:text-primary" />
        </div>
        {onConfirm ? (
          <Button type="button" size="sm" onClick={onConfirm}>
            Confirm Time Slot
          </Button>
        ) : null}
      </div>
    </CardShell>
  );
}

export type BookingConfirmedCardProps = {
  reference?: string;
  pin?: string;
  paidLabel?: string;
  onViewTicket?: () => void;
  onDirections?: () => void;
  className?: string;
};

export function BookingConfirmedCard({
  reference = '#RHF-2025-8819',
  pin = '8 4 9 2',
  paidLabel = 'MoMo Wallet',
  onViewTicket,
  onDirections,
  className,
}: BookingConfirmedCardProps) {
  return (
    <CardShell
      className={cn(
        'space-y-4 border-emerald-300/40 bg-gradient-to-b from-emerald-50/40 to-card p-5 dark:from-emerald-950/20',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
          STATE C: BOOKING CONFIRMED
        </span>
        <CheckCircle2 className="size-4 text-emerald-600" />
      </div>
      <div className="py-2 text-center">
        <div className="mx-auto mb-2 grid size-12 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          <CheckCircle2 className="size-6" />
        </div>
        <h4 className="text-base font-bold text-foreground">Spot Confirmed!</h4>
        <p className="mt-0.5 text-xs text-muted-foreground">Your receipt &amp; QR access pass is ready</p>
      </div>
      <div className="space-y-1.5 rounded-lg border border-border bg-card p-3 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Booking Ref</span>
          <span className="font-mono font-bold">{reference}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Check-in PIN</span>
          <span className="font-mono font-bold text-primary">{pin}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Paid via</span>
          <span className="text-foreground">{paidLabel}</span>
        </div>
      </div>
      <div className="flex gap-2">
        {onViewTicket ? (
          <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onViewTicket}>
            View Ticket
          </Button>
        ) : null}
        {onDirections ? (
          <Button type="button" size="sm" className="flex-1" onClick={onDirections}>
            Get Directions
          </Button>
        ) : null}
      </div>
    </CardShell>
  );
}
