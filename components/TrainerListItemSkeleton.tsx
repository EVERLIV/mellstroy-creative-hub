import React from 'react';
import { Skeleton } from '@/src/components/ui/skeleton';

const TrainerListItemSkeleton: React.FC = React.memo(() => (
  <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 shadow-sm" aria-hidden="true">
    <Skeleton className="h-20 w-20 shrink-0 rounded-lg md:h-24 md:w-24" />
    <div className="flex-1 space-y-2 py-1">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-5/6" />
      <Skeleton className="mt-2 h-8 rounded-lg" />
    </div>
  </div>
));

TrainerListItemSkeleton.displayName = 'TrainerListItemSkeleton';

export default TrainerListItemSkeleton;
