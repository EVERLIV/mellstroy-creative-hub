import React from 'react';
import { Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { Badge } from '@/src/components/ui/badge';
import { Card, CardContent } from '@/src/components/ui/card';
import { cn } from '@/src/lib/utils';

export interface ConversationRowProps {
  name: string;
  avatarUrl?: string | null;
  preview?: string;
  timestamp?: string;
  unreadCount?: number;
  bookingLabel?: string;
  roleLabel?: string;
  active?: boolean;
  onClick?: () => void;
}

export function ConversationRow({
  name,
  avatarUrl,
  preview,
  timestamp,
  unreadCount = 0,
  bookingLabel,
  roleLabel,
  active,
  onClick,
}: ConversationRowProps) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const hasUnread = unreadCount > 0;

  return (
    <Card
      className={cn(
        'cursor-pointer transition-colors hover:bg-muted/40',
        active && 'border-primary/40 bg-primary/5',
        hasUnread && !active && 'border-primary/20'
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <CardContent className="flex items-start gap-3 p-4">
        <Avatar className="size-12 shrink-0">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} className="object-cover" /> : null}
          <AvatarFallback>{initials || '?'}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-0.5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-semibold text-foreground">{name}</span>
                {roleLabel ? <Badge variant="secondary">{roleLabel}</Badge> : null}
              </div>
              {preview ? (
                <p
                  className={cn(
                    'truncate text-sm',
                    hasUnread ? 'font-medium text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {preview}
                </p>
              ) : (
                <p className="truncate text-sm italic text-muted-foreground">No messages yet</p>
              )}
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1.5">
              {timestamp ? (
                <span
                  className={cn(
                    'text-xs',
                    hasUnread ? 'font-semibold text-primary' : 'text-muted-foreground'
                  )}
                >
                  {timestamp}
                </span>
              ) : null}
              {hasUnread ? (
                <Badge className="rounded-full px-2">{unreadCount > 99 ? '99+' : unreadCount}</Badge>
              ) : null}
            </div>
          </div>

          {bookingLabel ? (
            <div className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
              <Calendar data-icon="inline-start" aria-hidden />
              <span className="truncate">{bookingLabel}</span>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default ConversationRow;
