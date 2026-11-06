import React from 'react';
import { cn } from '@/src/lib/utils';

export interface MessageBubbleProps {
  body: React.ReactNode;
  isOwn?: boolean;
  timestamp?: string;
  status?: string;
  className?: string;
}

export function MessageBubble({ body, isOwn, timestamp, status, className }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        'flex w-full flex-col gap-1',
        isOwn ? 'items-end' : 'items-start',
        className
      )}
    >
      <div
        className={cn(
          'max-w-[min(85%,28rem)] px-3.5 py-2 text-sm leading-relaxed shadow-xs',
          isOwn
            ? 'rounded-2xl rounded-br-md bg-primary text-primary-foreground'
            : 'rounded-2xl rounded-bl-md border border-border bg-card text-foreground'
        )}
      >
        {body}
      </div>
      {(timestamp || status) && (
        <div
          className={cn(
            'flex items-center gap-1.5 px-1 text-[10px] text-muted-foreground',
            isOwn && 'flex-row-reverse'
          )}
        >
          {timestamp ? <span>{timestamp}</span> : null}
          {status ? <span>{status}</span> : null}
        </div>
      )}
    </div>
  );
}

export default MessageBubble;
