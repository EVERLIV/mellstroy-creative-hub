import React from 'react';
import { Card, CardContent } from '../src/components/ui/card';
import { Skeleton } from '../src/components/ui/skeleton';

/** Placeholder matching ConversationRow / booking card spacing. */
const ConversationCardSkeleton: React.FC = React.memo(() => {
  return (
    <Card aria-hidden="true">
      <CardContent className="flex items-start gap-3 p-4">
        <Skeleton className="size-12 shrink-0 rounded-full" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-14" />
          </div>
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-6 w-48 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
});

ConversationCardSkeleton.displayName = 'ConversationCardSkeleton';

export default ConversationCardSkeleton;
