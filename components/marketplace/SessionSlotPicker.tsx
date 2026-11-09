import React from 'react';
import { Clock } from 'lucide-react';
import type { SessionSlot } from '@/src/lib/sessionSlots';
import { cn } from '@/src/lib/utils';

/** Plain slot chips — no layout/motion thrash on select (prevents tab freezes). */
export function SessionSlotPicker({
  slots,
  value,
  onChange,
  emptyLabel = 'No upcoming sessions published yet.',
}: {
  slots: SessionSlot[];
  value?: string;
  onChange: (slot: SessionSlot) => void;
  emptyLabel?: string;
}) {
  if (!slots.length) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-muted/30 px-3 py-4 text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Available sessions">
      {slots.map((slot) => {
        const selected = value === slot.id;
        const full = slot.spotsLeft === 0;
        return (
          <button
            key={slot.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={full}
            onClick={() => {
              if (full || selected) return;
              onChange(slot);
            }}
            className={cn(
              'flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left touch-manipulation transition-colors',
              full && 'cursor-not-allowed opacity-50',
              selected
                ? 'border-primary bg-primary/5 ring-1 ring-primary/40'
                : 'border-border/80 bg-card hover:border-foreground/20'
            )}
          >
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Clock className="size-3.5 shrink-0 text-primary" />
                {slot.time}
              </span>
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {slot.label.replace(` · ${slot.time}`, '')}
              </span>
            </span>
            {typeof slot.spotsLeft === 'number' ? (
              <span
                className={cn(
                  'shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                  full
                    ? 'bg-muted text-muted-foreground'
                    : slot.spotsLeft <= 2
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                {full ? 'Full' : `${slot.spotsLeft} left`}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
