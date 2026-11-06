import React from 'react';
import { Skeleton } from '../src/components/ui/skeleton';

const BookingCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm" aria-hidden="true">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="mt-4 flex gap-2 border-t border-border pt-3">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
      </div>
    </div>
  );
};

export default BookingCardSkeleton;
