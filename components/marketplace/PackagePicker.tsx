import React from 'react';
import { motion, useReducedMotion, type Transition } from 'motion/react';
import type { ClassPackage } from '@/src/lib/marketplace';
import { cn } from '@/src/lib/utils';
import { formatVND } from '@/src/lib/format';
import { Badge } from '@/src/components/ui/badge';

const spring: Transition = { type: 'spring', stiffness: 380, damping: 24, mass: 0.85 };
const easeOut = [0.22, 1, 0.36, 1] as const;

export function PackagePicker({
  packages,
  value,
  onChange,
}: {
  packages: ClassPackage[];
  value?: string;
  onChange: (pkg: ClassPackage) => void;
}) {
  const reduceMotion = Boolean(useReducedMotion());

  if (!packages.length) return null;

  return (
    <motion.div
      className="grid gap-2"
      role="radiogroup"
      aria-label="Service packages"
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: reduceMotion ? undefined : { staggerChildren: 0.06, delayChildren: 0.04 },
        },
      }}
    >
      {packages.map((pkg) => {
        const selected = value === pkg.id;
        const perSession = pkg.sessions > 0 ? Math.round(pkg.price / pkg.sessions) : pkg.price;

        return (
          <motion.button
            key={pkg.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(pkg)}
            variants={
              reduceMotion
                ? undefined
                : {
                    hidden: { opacity: 0, y: 12 },
                    show: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.45, ease: easeOut },
                    },
                  }
            }
            whileHover={
              reduceMotion
                ? undefined
                : {
                    y: -3,
                    scale: 1.015,
                    transition: spring,
                  }
            }
            whileTap={reduceMotion ? undefined : { scale: 0.985, transition: spring }}
            className={cn(
              'relative flex items-start justify-between gap-3 rounded-xl border p-3 text-left touch-manipulation',
              selected
                ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/40'
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
          </motion.button>
        );
      })}
    </motion.div>
  );
}
