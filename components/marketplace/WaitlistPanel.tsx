import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Building2, Check, MessageCircle, UserRound, X } from 'lucide-react';
import {
  fetchMyWaitlist,
  fetchTrainerWaitlist,
  leaveWaitlist,
  notifyWaitlistEntry,
  type WaitlistEntry,
} from '@/src/lib/marketplace';
import { createNotification } from '@/src/lib/notifications';
import { trackEvent } from '@/src/lib/analytics';
import { requireAuth } from '@/src/lib/require-auth';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/src/components/ui/empty';
import { useToast } from '@/src/hooks/use-toast';
import { cn } from '@/src/lib/utils';

export function WaitlistPanel({
  userId,
  role,
  className,
}: {
  userId?: string | null;
  role: 'student' | 'trainer';
  className?: string;
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } =
      role === 'trainer'
        ? await fetchTrainerWaitlist(userId)
        : await fetchMyWaitlist(userId);
    if (error) {
      toast({
        title: 'Could not load waitlist',
        description: error.message,
        variant: 'destructive',
      });
    }
    setEntries(data);
    setLoading(false);
  }, [userId, role, toast]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!userId) {
    return (
      <Empty className="border border-dashed bg-card">
        <EmptyHeader>
          <EmptyTitle>Sign in to see waitlists</EmptyTitle>
          <EmptyDescription>Your waiting list syncs after you log in.</EmptyDescription>
        </EmptyHeader>
        <div className="px-6 pb-6">
          <Button type="button" onClick={() => navigate('/auth')}>
            Log in
          </Button>
        </div>
      </Empty>
    );
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading waitlist…</p>;
  }

  if (!entries.length) {
    return (
      <Empty className={cn('border border-dashed bg-card', className)}>
        <EmptyHeader>
          <EmptyTitle>
            {role === 'trainer' ? 'No one waiting yet' : 'You’re not on any waitlist'}
          </EmptyTitle>
          <EmptyDescription>
            {role === 'trainer'
              ? 'When a class fills up, athletes can join the waitlist — they’ll show here.'
              : 'Join a waitlist from a full class page to get notified when a spot opens.'}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ul className={cn('divide-y divide-border overflow-hidden rounded-xl border border-border bg-card', className)}>
      {entries.map((entry) => {
        const cls = entry.classes;
        const person = entry.profiles;
        const venue = cls?.venues;
        return (
          <li key={entry.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              {role === 'trainer' ? (
                <Avatar className="size-10">
                  <AvatarImage src={person?.avatar_url || undefined} alt="" />
                  <AvatarFallback>
                    <UserRound className="size-4" />
                  </AvatarFallback>
                </Avatar>
              ) : null}
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="truncate text-sm font-semibold hover:underline"
                    onClick={() => navigate(`/class/${entry.class_id}`)}
                  >
                    {cls?.name || 'Class'}
                  </button>
                  <Badge variant={entry.status === 'notified' ? 'default' : 'secondary'}>
                    {entry.status}
                  </Badge>
                </div>
                {role === 'trainer' ? (
                  <p className="text-xs text-muted-foreground">
                    Waiting: <span className="font-medium text-foreground">{person?.username || 'Athlete'}</span>
                    {entry.preferred_date ? ` · prefers ${entry.preferred_date}` : ''}
                    {entry.preferred_time ? ` at ${entry.preferred_time}` : ''}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Joined {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : '—'}
                    {entry.preferred_date ? ` · preferred ${entry.preferred_date}` : ''}
                  </p>
                )}
                {venue ? (
                  <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Building2 className="size-3" />
                    {venue.name}
                    {venue.district ? ` · ${venue.district}` : ''}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {role === 'trainer' ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      navigate('/messages', {
                        state: {
                          recipientId: entry.user_id,
                          recipientName: person?.username,
                          context: { classId: entry.class_id, className: cls?.name },
                        },
                      })
                    }
                  >
                    <MessageCircle className="size-3.5" />
                    Message
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={entry.status === 'notified'}
                    onClick={() => {
                      void (async () => {
                        await notifyWaitlistEntry(entry.id);
                        await createNotification({
                          userId: entry.user_id,
                          type: 'waitlist_open',
                          title: 'A spot opened',
                          message: `${cls?.name || 'Your class'} has a free spot — book now.`,
                          href: `/class/${entry.class_id}`,
                          referenceId: entry.id,
                        });
                        trackEvent('waitlist_join', { action: 'trainer_notify', entryId: entry.id }, userId);
                        toast({ title: 'Athlete notified' });
                        void refresh();
                      })();
                    }}
                  >
                    <Bell className="size-3.5" />
                    {entry.status === 'notified' ? 'Notified' : 'Notify spot'}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => navigate(`/class/${entry.class_id}`)}
                  >
                    <Check className="size-3.5" />
                    View class
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (!requireAuth(userId, navigate)) return;
                      void (async () => {
                        await leaveWaitlist(entry.id, userId);
                        toast({ title: 'Left waitlist' });
                        void refresh();
                      })();
                    }}
                  >
                    <X className="size-3.5" />
                    Leave
                  </Button>
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
