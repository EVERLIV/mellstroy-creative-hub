import React, { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { formatVND } from '@/src/lib/format';
import { trackEvent } from '@/src/lib/analytics';
import { supabase } from '@/src/integrations/supabase/client';
import { useToast } from '@/src/hooks/use-toast';

const TIPS = [0, 20_000, 50_000, 100_000] as const;

export function TipAfterService({
  bookingId,
  userId,
}: {
  bookingId: string;
  userId?: string | null;
}) {
  const { toast } = useToast();
  const [amount, setAmount] = useState(0);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  if (sent) {
    return <p className="text-xs text-emerald-700 dark:text-emerald-400">Thanks for tipping!</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Tip coach</span>
      {TIPS.map((n) => (
        <Button
          key={n}
          type="button"
          size="sm"
          variant={amount === n ? 'default' : 'outline'}
          className="h-7 px-2 text-xs"
          onClick={() => setAmount(n)}
        >
          {n === 0 ? 'None' : formatVND(n)}
        </Button>
      ))}
      <Button
        type="button"
        size="sm"
        className="h-7"
        disabled={loading || amount === 0 || !userId}
        onClick={() => {
          void (async () => {
            if (!userId || amount === 0) return;
            setLoading(true);
            try {
              const { data: payment } = await supabase.functions.invoke('create-booking-payment', {
                body: { holdId: null, tipAmount: amount, bookingId },
              });
              await supabase.from('booking_tips' as never).insert({
                booking_id: bookingId,
                user_id: userId,
                amount,
                stripe_payment_intent_id:
                  (payment as { paymentIntentId?: string } | null)?.paymentIntentId || null,
              } as never);
              await supabase
                .from('bookings')
                .update({ tip_amount: amount } as never)
                .eq('id', bookingId);
              trackEvent('tip_submit', { bookingId, amount }, userId);
              setSent(true);
              toast({ title: 'Tip sent', description: formatVND(amount) });
            } catch {
              toast({ title: 'Tip failed', variant: 'destructive' });
            } finally {
              setLoading(false);
            }
          })();
        }}
      >
        Send
      </Button>
    </div>
  );
}
