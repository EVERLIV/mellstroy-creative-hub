import * as React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';

export type DetailCrumb = { label: string; href?: string };

export interface DetailContextStripProps {
  /** Outline back control — e.g. "Back to Classes" */
  backLabel: string;
  onBack: () => void;
  /** Slash crumbs: section / category / current — every item with href is clickable */
  crumbs: DetailCrumb[];
  /** Optional meta line (spots left, series, etc.) */
  meta?: React.ReactNode;
  /** Share / Save / etc. */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Shared detail chrome — same structure on classes, trainers, venues, events.
 * Hierarchy: back + crumbs lead; actions demoted to the trailing edge.
 */
export function DetailContextStrip({
  backLabel,
  onBack,
  crumbs,
  meta,
  actions,
  className,
}: DetailContextStripProps) {
  return (
    <div
      className={cn(
        'mb-4 flex flex-wrap items-center justify-between gap-3',
        className
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={onBack}
        >
          <ArrowLeft className="size-3.5" />
          {backLabel}
        </Button>
        {crumbs.length > 0 ? (
          <nav
            className="hidden min-w-0 items-center gap-2 md:flex"
            aria-label="Breadcrumb"
          >
            {crumbs.map((crumb, i) => {
              const isLast = i === crumbs.length - 1;
              return (
                <React.Fragment key={`${crumb.label}-${i}`}>
                  {i > 0 ? <span className="text-border">/</span> : null}
                  {crumb.href ? (
                    <Link
                      to={crumb.href}
                      aria-current={isLast ? 'page' : undefined}
                      className={cn(
                        'truncate transition-colors hover:text-foreground',
                        isLast
                          ? 'font-bold text-foreground'
                          : 'hover:underline'
                      )}
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      className={cn(
                        'truncate',
                        isLast ? 'font-bold text-foreground' : undefined
                      )}
                    >
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        ) : null}
        {meta ? (
          <span className="hidden items-center gap-2 lg:inline-flex">{meta}</span>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export default DetailContextStrip;
