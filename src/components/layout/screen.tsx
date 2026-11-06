import * as React from 'react';
import { cn } from '@/src/lib/utils';
import {
  DetailContextStrip,
  type DetailCrumb,
} from '@/src/components/layout/detail-context-strip';
import {
  ABOVE_MOBILE_NAV,
  PAGE_WIDTH,
  SCREEN_BOTTOM_SAFE,
  SCREEN_GUTTER,
  SCREEN_WIDTH,
  type PageWidth,
  type ScreenWidth,
} from './shell';

export type { DetailCrumb as ScreenCrumb };

type AnyWidth = ScreenWidth | PageWidth;

function resolveWidth(width: AnyWidth = 'detail'): string {
  if (width in SCREEN_WIDTH) return SCREEN_WIDTH[width as ScreenWidth];
  return PAGE_WIDTH[width as PageWidth];
}

/* ------------------------------------------------------------------ */
/* AppScreen — root of every screen                                    */
/* ------------------------------------------------------------------ */

export function AppScreen({ className, children }: { className?: string; children: React.ReactNode }) {
  /* Shell owns viewport height; screens fill the content column. */
  return <div className={cn('min-w-0 bg-background text-foreground', className)}>{children}</div>;
}

/* ------------------------------------------------------------------ */
/* ScreenHeader                                                        */
/* ------------------------------------------------------------------ */

interface ScreenHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  onBack?: () => void;
  backLabel?: string;
  actions?: React.ReactNode;
  width?: AnyWidth;
  breadcrumbs?: DetailCrumb[];
  children?: React.ReactNode;
  className?: string;
}

export function ScreenHeader({
  title,
  description,
  onBack,
  backLabel = 'Back',
  actions,
  width = 'detail',
  breadcrumbs,
  children,
  className,
}: ScreenHeaderProps) {
  const showStrip = Boolean(onBack);

  return (
    <header
      className={cn(
        // Sit under classic top nav (h-14 / lg:h-16).
        'border-b border-border/80 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75 md:sticky md:top-14 md:z-30 lg:top-16',
        className
      )}
    >
      <div className={cn('mx-auto w-full', resolveWidth(width), SCREEN_GUTTER, 'pt-3 md:pt-4')}>
        {showStrip ? (
          <DetailContextStrip
            backLabel={backLabel}
            onBack={onBack!}
            crumbs={breadcrumbs ?? []}
            actions={actions}
            className="mb-2"
          />
        ) : null}
        <div
          className={cn(
            'flex min-h-12 items-center gap-2 pb-3 md:min-h-14 md:gap-3 md:pb-4',
            !showStrip && 'pt-1'
          )}
        >
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-tight text-foreground md:text-2xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-0.5 hidden text-sm text-muted-foreground md:block">{description}</p>
            ) : null}
          </div>
          {!showStrip && actions ? (
            <div className="flex shrink-0 items-center gap-1.5 md:gap-2">{actions}</div>
          ) : null}
        </div>
        {children ? <div className="pb-3">{children}</div> : null}
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* ScreenBody                                                          */
/* ------------------------------------------------------------------ */

interface ScreenBodyProps {
  width?: AnyWidth;
  className?: string;
  children: React.ReactNode;
}

export function ScreenBody({ width = 'detail', className, children }: ScreenBodyProps) {
  return (
    <main className={cn('mx-auto w-full', resolveWidth(width), SCREEN_GUTTER, SCREEN_BOTTOM_SAFE, 'pt-4 md:pt-6', className)}>
      <div className="flex flex-col gap-6 md:gap-8">{children}</div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* ScreenSection                                                       */
/* ------------------------------------------------------------------ */

interface ScreenSectionProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: 'plain' | 'panel' | 'card';
  className?: string;
  children: React.ReactNode;
}

export function ScreenSection({
  title,
  description,
  action,
  variant = 'plain',
  className,
  children,
}: ScreenSectionProps) {
  const panel = variant === 'panel' || variant === 'card';
  return (
    <section className={cn('flex flex-col gap-3', className)}>
      {(title || action || description) && (
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold text-foreground md:text-lg">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn(panel && 'rounded-2xl border border-border bg-card p-4 shadow-sm md:p-6')}>
        {children}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* ScreenSplit — main + aside                                          */
/* ------------------------------------------------------------------ */

export function ScreenSplit({
  main,
  aside,
  className,
}: {
  main: React.ReactNode;
  aside: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('grid gap-6 lg:grid-cols-3 lg:gap-8', className)}>
      <div className="flex flex-col gap-6 lg:col-span-2">{main}</div>
      <aside className="flex flex-col gap-6">{aside}</aside>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ScreenStickyBar — primary actions above mobile nav                  */
/* ------------------------------------------------------------------ */

export function ScreenStickyBar({
  width = 'form',
  className,
  children,
}: {
  width?: AnyWidth;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="h-20 md:hidden" aria-hidden />
      <div
        className={cn(
          'fixed inset-x-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur md:static md:z-auto md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none',
          ABOVE_MOBILE_NAV,
          className
        )}
      >
        <div className={cn('mx-auto flex w-full items-center justify-end gap-2', resolveWidth(width), SCREEN_GUTTER, 'md:px-0')}>
          {children}
        </div>
      </div>
    </>
  );
}

/* Legacy aliases so pages can migrate gradually */
export { AppScreen as Page };
export { ScreenHeader as PageHeader };
export { ScreenBody as PageContent };
export { ScreenSection as PageSection };
export { ScreenStickyBar as PageActions };
