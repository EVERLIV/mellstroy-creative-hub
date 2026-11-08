import React, { useMemo, useState } from 'react';
import { formatVND } from '@/src/lib/format';
import { Button } from '@/src/components/ui/button';
import { Checkbox } from '@/src/components/ui/checkbox';
import { trackEvent } from '@/src/lib/analytics';
import { cn } from '@/src/lib/utils';

export type BundleItem = {
  id: string;
  label: string;
  price: number;
  description?: string;
};

export function BundleCart({
  items,
  discountPct = 10,
  onCheckout,
  className,
}: {
  items: BundleItem[];
  discountPct?: number;
  onCheckout?: (selected: BundleItem[], total: number) => void;
  className?: string;
}) {
  const [selected, setSelected] = useState<string[]>(() => items.map((i) => i.id));

  const { subtotal, total, savings } = useMemo(() => {
    const chosen = items.filter((i) => selected.includes(i.id));
    const sub = chosen.reduce((sum, i) => sum + i.price, 0);
    const disc = chosen.length > 1 ? Math.round(sub * (discountPct / 100)) : 0;
    return { subtotal: sub, total: sub - disc, savings: disc };
  }, [items, selected, discountPct]);

  if (!items.length) return null;

  return (
    <section className={cn('rounded-xl border border-border bg-card p-4', className)}>
      <h3 className="text-sm font-semibold">Bundle & save</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Book {items.length > 1 ? 'together' : 'this pack'} for {discountPct}% off when you select 2+.
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => {
          const checked = selected.includes(item.id);
          return (
            <li key={item.id} className="flex items-start gap-3">
              <Checkbox
                checked={checked}
                onCheckedChange={(v) => {
                  setSelected((prev) =>
                    v ? [...prev, item.id] : prev.filter((id) => id !== item.id)
                  );
                }}
                aria-label={item.label}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{item.label}</p>
                {item.description ? (
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                ) : null}
              </div>
              <span className="text-sm tabular-nums">{formatVND(item.price)}</span>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex items-end justify-between gap-3 border-t border-border pt-3">
        <div>
          {savings > 0 ? (
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              Save {formatVND(savings)}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Select 2+ for bundle discount</p>
          )}
          <p className="text-lg font-semibold tabular-nums">{formatVND(total)}</p>
          {savings > 0 ? (
            <p className="text-xs text-muted-foreground line-through tabular-nums">
              {formatVND(subtotal)}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          disabled={selected.length === 0}
          onClick={() => {
            const chosen = items.filter((i) => selected.includes(i.id));
            trackEvent('upsell_accept', { kind: 'bundle', count: chosen.length, total });
            onCheckout?.(chosen, total);
          }}
        >
          Checkout bundle
        </Button>
      </div>
    </section>
  );
}
