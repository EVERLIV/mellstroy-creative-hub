import React from 'react';
import { Calendar, Clock, MapPin, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import type { ChatBookingDetails, ChatConversation } from './types';

export interface ChatPeerSidebarProps {
  peer: ChatConversation['other_participant'];
  bookingDetails?: ChatBookingDetails | null;
  onViewProfile?: () => void;
}

export function ChatPeerSidebar({ peer, bookingDetails, onViewProfile }: ChatPeerSidebarProps) {
  const initials = peer.username
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const specialty = peer.specialty?.[0];

  return (
    <aside className="hidden min-h-0 w-80 shrink-0 flex-col overflow-hidden border-l border-border bg-card xl:flex">
      <div className="flex flex-col items-center gap-2 border-b border-border p-5 text-center">
        <Avatar className="size-20">
          {peer.avatar_url ? (
            <AvatarImage src={peer.avatar_url} alt={peer.username} className="object-cover" />
          ) : null}
          <AvatarFallback className="text-lg">{initials || '?'}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-0.5">
          <h3 className="text-base font-bold text-foreground">{peer.username}</h3>
          {specialty ? <p className="text-xs font-semibold text-primary">{specialty}</p> : null}
          {peer.bio ? (
            <p className="line-clamp-2 text-xs text-muted-foreground">{peer.bio}</p>
          ) : null}
        </div>

        <div className="grid w-full grid-cols-3 gap-2 border-t border-border pt-3">
          <div className="rounded-lg bg-muted/50 p-2">
            <div className="flex items-center justify-center gap-1 text-xs font-bold text-foreground">
              {(peer.rating ?? 0).toFixed(1)}
              <Star className="size-3 fill-primary text-primary" aria-hidden />
            </div>
            <div className="text-[10px] text-muted-foreground">Rating</div>
          </div>
          <div className="rounded-lg bg-muted/50 p-2">
            <div className="text-xs font-bold text-foreground">
              {peer.experience_years ? `${peer.experience_years}+ yrs` : '—'}
            </div>
            <div className="text-[10px] text-muted-foreground">Exp</div>
          </div>
          <div className="rounded-lg bg-muted/50 p-2">
            <div className="text-xs font-bold text-foreground">
              {peer.is_verified ? 'Verified' : 'Member'}
            </div>
            <div className="text-[10px] text-muted-foreground">Status</div>
          </div>
        </div>
      </div>

      {bookingDetails ? (
        <div className="flex flex-col gap-2 border-b border-border p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Upcoming session
            </span>
            <Badge variant="secondary">Active</Badge>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-3">
            <p className="mb-1 text-xs font-bold text-foreground">{bookingDetails.class_name}</p>
            <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar aria-hidden />
              {new Date(bookingDetails.booking_date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            <p className="mb-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock aria-hidden />
              {bookingDetails.booking_time}
            </p>
            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-2 text-[11px]">
              <div>
                <span className="block font-semibold text-foreground">Check-in code</span>
                <span className="font-mono text-muted-foreground">
                  {bookingDetails.verification_code}
                </span>
              </div>
              <MapPin className="size-3.5 text-muted-foreground" aria-hidden />
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-auto flex flex-col gap-2 bg-muted/30 p-4">
        {onViewProfile ? (
          <Button type="button" variant="outline" className="w-full" onClick={onViewProfile}>
            View profile
          </Button>
        ) : null}
      </div>
    </aside>
  );
}

export default ChatPeerSidebar;
