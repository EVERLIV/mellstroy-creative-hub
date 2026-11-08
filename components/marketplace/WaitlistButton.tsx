import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellPlus } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import {
  fetchClassTrainerId,
  fetchMyWaitlist,
  joinWaitlist,
} from '@/src/lib/marketplace';
import { trackEvent } from '@/src/lib/analytics';
import { createNotification } from '@/src/lib/notifications';
import { requireAuth } from '@/src/lib/require-auth';
import { useToast } from '@/src/hooks/use-toast';
import { supabase } from '@/src/integrations/supabase/client';

export function WaitlistButton({
  classId,
  userId,
  preferredDate,
  preferredTime,
  className,
}: {
  classId: string;
  userId?: string | null;
  preferredDate?: string;
  preferredTime?: string;
  className?: string;
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!userId) {
      setJoined(false);
      return;
    }
    void (async () => {
      const { data } = await fetchMyWaitlist(userId);
      setJoined(data.some((e) => e.class_id === classId && e.status === 'waiting'));
    })();
  }, [userId, classId]);

  const onJoin = async () => {
    if (
      !requireAuth(userId, navigate, {
        returnTo: `/class/${classId}`,
        toast: (msg) => toast({ ...msg, variant: 'destructive' }),
      })
    ) {
      return;
    }
    if (!userId) return;

    setLoading(true);
    try {
      const { data: entry, error } = await joinWaitlist({
        classId,
        userId,
        preferredDate,
        preferredTime,
      });
      if (error) throw error;

      trackEvent('waitlist_join', { classId }, userId);

      await createNotification({
        userId,
        type: 'waitlist_joined',
        title: 'Waitlist joined',
        message: 'We will notify you when a spot opens.',
        href: `/class/${classId}`,
        referenceId: classId,
      });

      const { data: cls } = await fetchClassTrainerId(classId);
      if (cls?.trainer_id && cls.trainer_id !== userId) {
        const { data: me } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', userId)
          .maybeSingle();
        await createNotification({
          userId: cls.trainer_id,
          type: 'waitlist_new',
          title: 'New waitlist signup',
          message: `${(me as { username?: string } | null)?.username || 'An athlete'} is waiting for ${cls.name || 'your class'}.`,
          href: '/bookings?tab=waitlist',
          referenceId: (entry as { id?: string } | null)?.id || classId,
          payload: { classId, studentId: userId },
        });
      }

      setJoined(true);
      toast({
        title: 'You’re on the waitlist',
        description: 'The coach was notified. We’ll ping you when a slot frees up.',
      });
    } catch (e) {
      toast({
        title: 'Could not join waitlist',
        description: e instanceof Error ? e.message : 'Try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      disabled={loading || joined}
      onClick={() => void onJoin()}
    >
      <BellPlus className="size-4" />
      {joined ? 'On waitlist' : 'Join waitlist'}
    </Button>
  );
}
