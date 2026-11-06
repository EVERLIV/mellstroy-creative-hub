import React from 'react';
import { Skeleton } from '../src/components/ui/skeleton';
import { cn } from '../src/lib/utils';

interface MessageBubbleSkeletonProps {
  isOwn?: boolean;
}

/** Placeholder matching chat bubbles in ChatConversationPage. */
const MessageBubbleSkeleton: React.FC<MessageBubbleSkeletonProps> = React.memo(({ isOwn = false }) => {
  return (
    <div className={cn('mb-3 flex', isOwn ? 'justify-end' : 'justify-start')} aria-hidden="true">
      <div className={cn('flex max-w-[75%] gap-2', isOwn ? 'flex-row-reverse' : 'flex-row')}>
        {!isOwn && <Skeleton className="h-8 w-8 shrink-0 rounded-full" />}
        <div
          className={cn(
            'animate-pulse rounded-2xl p-3',
            isOwn ? 'rounded-br-md bg-primary/80' : 'rounded-bl-md border border-border bg-card'
          )}
        >
          <div className="space-y-2">
            <div className={cn('h-3 w-32 rounded', isOwn ? 'bg-primary-foreground/30' : 'bg-muted')} />
            <div className={cn('h-3 w-24 rounded', isOwn ? 'bg-primary-foreground/30' : 'bg-muted')} />
          </div>
        </div>
      </div>
    </div>
  );
});

MessageBubbleSkeleton.displayName = 'MessageBubbleSkeleton';

export default MessageBubbleSkeleton;
