import React from 'react';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { formatVND } from '@/src/lib/format';

export function StickyBookBar({
  price,
  label = 'Book',
  meta,
  onBook,
  disabled,
  className,
}: {
  price: number;
  label?: string;
  meta?: string;
  onBook: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'fixed inset-x-0 z-50 border-t border-border/80 bg-background/95 backdrop-blur-md md:hidden',
        'bottom-[calc(4.75rem+env(safe-area-inset-bottom))] pb-3 pt-3',
        className
      )}
    >
      <div className="mx-auto flex max-w-lg items-center gap-3 px-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            From
          </p>
          <p className="text-lg font-semibold tabular-nums tracking-tight">{formatVND(price)}</p>
          {meta ? <p className="truncate text-xs text-muted-foreground">{meta}</p> : null}
        </div>
        <Button
          type="button"
          size="lg"
          className="h-11 min-w-[8.5rem] touch-manipulation"
          disabled={disabled}
          onClick={onBook}
        >
          {label}
        </Button>
      </div>
    </div>
  );
}
