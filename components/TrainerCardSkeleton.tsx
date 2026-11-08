import React from 'react';
import { Skeleton } from '@/src/components/ui/skeleton';

/** Matches DiscoveryCoachCard proportions: accent rail + portrait + body. */
const TrainerCardSkeleton: React.FC = React.memo(() => (
  <div
    className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
    aria-hidden="true"
  >
    <div className="h-1.5 bg-muted" />
    <Skeleton className="aspect-[4/5] w-full rounded-none" />
    <div className="space-y-2.5 p-3.5 pt-4">
      <Skeleton className="h-4 w-3/5" />
      <Skeleton className="h-3 w-2/5" />
      <div className="flex items-center justify-between border-t border-border/70 pt-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-16 rounded-md" />
      </div>
    </div>
  </div>
));

TrainerCardSkeleton.displayName = 'TrainerCardSkeleton';

export default TrainerCardSkeleton;
