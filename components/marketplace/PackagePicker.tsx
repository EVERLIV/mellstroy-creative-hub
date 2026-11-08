import React from 'react';
import type { ClassPackage } from '@/src/lib/marketplace';
import { cn } from '@/src/lib/utils';
import { formatVND } from '@/src/lib/format';
import { Badge } from '@/src/components/ui/badge';

export function PackagePicker({
  packages,
  value,
  onChange,
}: {
  packages: ClassPackage[];
  value?: string;
  onChange: (pkg: ClassPackage) => void;
}) {
  if (!packages.length) return null;

  return (
    <div className="grid gap-2" role="radiogroup" aria-label="Service packages">
      {packages.map((pkg) => {
        const selected = value === pkg.id;
        const perSession = pkg.sessions > 0 ? Math.round(pkg.price / pkg.sessions) : pkg.price;
        return (
          <button
            key={pkg.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(pkg)}
            className={cn(
              'flex items-start justify-between gap-3 rounded-xl border p-3 text-left transition-colors touch-manipulation',
              selected
                ? 'border-primary bg-primary/5'
                : 'border-border/80 bg-card hover:border-foreground/20'
            )}
          >
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">{pkg.name}</span>
                {pkg.savings_pct && pkg.savings_pct > 0 ? (
                  <Badge variant="secondary" className="tabular-nums">
                    Save {pkg.savings_pct}%
                  </Badge>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                {pkg.sessions} session{pkg.sessions === 1 ? '' : 's'} · {formatVND(perSession)} / session
              </p>
            </div>
            <div className="shrink-0 text-right">
              {pkg.anchor_price && pkg.anchor_price > pkg.price ? (
                <p className="text-xs text-muted-foreground line-through tabular-nums">
                  {formatVND(pkg.anchor_price)}
                </p>
              ) : null}
              <p className="text-sm font-semibold tabular-nums">{formatVND(pkg.price)}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
