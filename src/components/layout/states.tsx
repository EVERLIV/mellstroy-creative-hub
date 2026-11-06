import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/src/components/ui/empty';
import Loader from '@/src/components/kokonutui/loader';

/** Full-area loading state (Kokonut UI loader). */
export function PageLoader({
  title = 'Loading…',
  subtitle,
  className,
}: {
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div role="status" aria-live="polite" className={cn('flex min-h-[50vh] items-center justify-center p-6', className)}>
      <Loader size="sm" title={title} subtitle={subtitle ?? ''} />
    </div>
  );
}

export const ScreenLoader = PageLoader;

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

/** Nothing to show yet — shadcn Empty. */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <Empty className={cn('border border-dashed border-border', className)}>
      <EmptyHeader>
        {Icon && (
          <EmptyMedia variant="icon">
            <Icon />
          </EmptyMedia>
        )}
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  );
}

/** Failed load — shadcn Alert. */
export function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again in a moment.',
  onRetry,
  className,
}: {
  title?: string;
  description?: React.ReactNode;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <Alert variant="destructive" className={cn('items-start', className)}>
      <AlertTriangle />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <span>{description}</span>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="w-fit bg-background">
            Try again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
