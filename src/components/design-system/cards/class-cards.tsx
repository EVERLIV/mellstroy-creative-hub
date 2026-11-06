import React, { useState } from 'react';
import { ChevronRight, Lock, Tag } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { formatVND } from '@/src/lib/format';
import { CapacityBar, CardBadge, CardShell, PriceBlock } from './primitives';

export type ClassSessionCardProps = {
  title: string;
  description?: string;
  imageUrl: string;
  levelLabel?: string;
  durationMin?: number;
  venueLabel?: string;
  capacity: number;
  filled: number;
  coachName: string;
  coachRole?: string;
  coachImageUrl?: string;
  price: number;
  compareAt?: number;
  memberPerk?: boolean;
  slots?: string[];
  onReserve?: (slot: string) => void;
  className?: string;
};

/** Training class / masterclass card with roster capacity. */
export function ClassSessionCard({
  title,
  description,
  imageUrl,
  levelLabel,
  durationMin,
  venueLabel,
  capacity,
  filled,
  coachName,
  coachRole,
  coachImageUrl,
  price,
  compareAt,
  memberPerk = true,
  slots = [],
  onReserve,
  className,
}: ClassSessionCardProps) {
  const [slot, setSlot] = useState(slots[0] ?? '');

  return (
    <CardShell className={cn('flex flex-col', className)}>
      <div className="relative h-44 overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt=""
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {levelLabel ? <CardBadge tone="secondary">{levelLabel}</CardBadge> : null}
          {durationMin ? <CardBadge tone="overlay">{durationMin} min</CardBadge> : null}
        </div>
        {memberPerk ? (
          <div className="absolute right-3 top-3">
            <CardBadge tone="success">
              <Tag className="size-3" />
              RhinoFit 10% OFF
            </CardBadge>
          </div>
        ) : null}
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between text-xs text-white">
          <span className="font-semibold">{venueLabel}</span>
          <span className="rounded bg-black/40 px-2 py-0.5 backdrop-blur-sm">Max {capacity}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="text-base font-bold tracking-tight text-foreground">{title}</h3>
        {description ? <p className="line-clamp-2 text-xs text-muted-foreground">{description}</p> : null}

        <div className="flex items-center gap-2.5 rounded-lg border border-border/70 bg-muted/30 p-2">
          {coachImageUrl ? (
            <img
              src={coachImageUrl}
              alt=""
              className="size-8 rounded-full border border-border object-cover"
            />
          ) : (
            <div className="grid size-8 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
              {coachName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground">{coachName}</p>
            {coachRole ? <p className="truncate text-[11px] text-muted-foreground">{coachRole}</p> : null}
          </div>
        </div>

        <CapacityBar filled={filled} capacity={capacity} />

        {slots.length > 0 ? (
          <div>
            <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">Upcoming sessions</p>
            <div className="grid grid-cols-2 gap-1.5">
              {slots.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSlot(s)}
                  className={cn(
                    'rounded-lg px-2 py-1.5 text-center text-xs font-semibold transition-colors',
                    slot === s
                      ? 'border-2 border-primary bg-primary/10 text-primary'
                      : 'border border-border bg-card text-muted-foreground hover:text-foreground'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-border bg-muted/20 p-5 pt-3">
        <PriceBlock amount={price} compareAt={compareAt} unit="per attendee" size="md" />
        <Button
          type="button"
          size="sm"
          className="gap-1"
          onClick={() => onReserve?.(slot)}
          disabled={!onReserve}
        >
          Reserve Spot
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </CardShell>
  );
}

export type BookingLineItem = {
  title: string;
  meta?: string;
  amount: number;
};

export type BookingSummaryCardProps = {
  title?: string;
  description?: string;
  items: BookingLineItem[];
  discountLabel?: string;
  discountAmount?: number;
  surchargeLabel?: string;
  surchargeAmount?: number;
  total: number;
  onConfirm?: () => void;
  className?: string;
};

/** Interactive mini-cart / checkout summary card. */
export function BookingSummaryCard({
  title = 'Active Booking Summary',
  description = 'Real-time checkout with RhinoFit club discounts.',
  items,
  discountLabel = 'RhinoFit Member 10%',
  discountAmount,
  surchargeLabel = 'Court Maintenance',
  surchargeAmount = 0,
  total,
  onConfirm,
  className,
}: BookingSummaryCardProps) {
  const subtotal = items.reduce((sum, i) => sum + i.amount, 0);
  return (
    <CardShell className={cn('flex flex-col p-5', className)}>
      <div className="mb-3 flex items-center justify-between">
        <CardBadge tone="accent">Interactive Mini-Cart</CardBadge>
      </div>
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>

      <div className="mt-4 space-y-3 rounded-lg border border-border/70 bg-muted/30 p-3">
        {items.map((item) => (
          <div key={item.title} className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-foreground">{item.title}</p>
              {item.meta ? <p className="text-[11px] text-muted-foreground">{item.meta}</p> : null}
            </div>
            <span className="shrink-0 text-xs font-bold tabular-nums">{formatVND(item.amount)}</span>
          </div>
        ))}
        {discountAmount ? (
          <div className="flex justify-between border-t border-border/60 pt-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
            <span>{discountLabel}</span>
            <span>−{formatVND(discountAmount)}</span>
          </div>
        ) : null}
      </div>

      <div className="mt-4 space-y-1.5 text-xs">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatVND(subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>{surchargeLabel}</span>
          <span>{surchargeAmount ? formatVND(surchargeAmount) : '0₫ (Waived)'}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-2 text-sm font-semibold text-foreground">
          <span>Total Payable</span>
          <span className="font-bold text-primary">{formatVND(total)}</span>
        </div>
      </div>

      <div className="mt-6 border-t border-border pt-4">
        <Button type="button" className="w-full gap-2" onClick={onConfirm} disabled={!onConfirm}>
          <Lock className="size-4" />
          Confirm &amp; Pay {formatVND(total)}
        </Button>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Instant refund up to 12 hours before start
        </p>
      </div>
    </CardShell>
  );
}
