import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { Badge } from '@/src/components/ui/badge';
import { cn } from '@/src/lib/utils';
import type { ChatConversation } from './types';

export interface ConversationSidebarItemProps {
  conversation: ChatConversation;
  currentUserId?: string;
  active?: boolean;
  timestampLabel?: string;
  onClick?: () => void;
}

function previewText(content: string, isOwn: boolean) {
  const raw = content.replace(/\s+/g, ' ').trim();
  let summary = raw;

  if (/booking details/i.test(raw) || raw.startsWith('📅')) {
    const classMatch = raw.match(/Class:\s*([^·\n]+)/i);
    summary = classMatch
      ? `Booking details · ${classMatch[1].trim()}`
      : 'Booking details shared';
  } else if (/booking confirmed/i.test(raw)) {
    const classMatch = raw.match(/Class:\s*([^·\n📅]+)/i);
    summary = classMatch
      ? `Booking confirmed · ${classMatch[1].trim()}`
      : 'Booking confirmed';
  }

  return `${isOwn ? 'You: ' : ''}${summary}`;
}

export function ConversationSidebarItem({
  conversation,
  currentUserId,
  active,
  timestampLabel,
  onClick,
}: ConversationSidebarItemProps) {
  const { other_participant: peer, last_message, unread_count, booking_details } = conversation;
  const initials = peer.username
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const isOwn = last_message?.sender_id === currentUserId;
  const preview = last_message
    ? previewText(last_message.content, Boolean(isOwn))
    : 'No messages yet';
  const specialty = peer.specialty?.[0];
  const hasUnread = unread_count > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full max-w-full gap-3 border-l-4 px-3 py-3.5 text-left transition-colors sm:px-3.5',
        active
          ? 'border-l-primary bg-primary/5'
          : 'border-l-transparent hover:bg-muted/50'
      )}
    >
      <Avatar className="size-11 shrink-0">
        {peer.avatar_url ? (
          <AvatarImage src={peer.avatar_url} alt={peer.username} className="object-cover" />
        ) : null}
        <AvatarFallback>{initials || '?'}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-baseline gap-2">
          <span className="min-w-0 flex-1 break-words text-xs font-bold text-foreground">
            {peer.username}
          </span>
          <div className="flex shrink-0 items-center gap-1">
            {timestampLabel ? (
              <span
                className={cn(
                  'text-[10px] font-semibold tabular-nums',
                  hasUnread || active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {timestampLabel}
              </span>
            ) : null}
            {hasUnread ? (
              <Badge className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px]">
                {unread_count > 99 ? '99+' : unread_count}
              </Badge>
            ) : null}
          </div>
        </div>

        <p
          className={cn(
            'break-words text-xs leading-snug',
            hasUnread || active ? 'font-medium text-foreground' : 'text-muted-foreground'
          )}
        >
          {preview}
        </p>

        {(specialty || booking_details) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {specialty ? <Badge variant="secondary">{specialty}</Badge> : null}
            {booking_details ? (
              <span className="break-words text-[10px] text-muted-foreground">
                {booking_details.class_name}
              </span>
            ) : null}
          </div>
        )}
      </div>
    </button>
  );
}

export default ConversationSidebarItem;
