import React from 'react';
import { Skeleton } from '@/src/components/ui/skeleton';

const TrainerCardSkeleton: React.FC = React.memo(() => (
  <div className="aspect-[3/4] overflow-hidden rounded-3xl" aria-hidden="true">
    <Skeleton className="size-full rounded-3xl" />
  </div>
));

TrainerCardSkeleton.displayName = 'TrainerCardSkeleton';

export default TrainerCardSkeleton;
