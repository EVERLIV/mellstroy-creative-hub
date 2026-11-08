// @ts-nocheck
// Deno Edge Function: create Stripe PaymentIntent for a booking hold
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const holdId = body.holdId as string;
    const tipAmount = Number(body.tipAmount || 0);
    if (!holdId) {
      return new Response(JSON.stringify({ error: 'holdId required' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: hold, error: holdError } = await admin
      .from('booking_holds')
      .select('*')
      .eq('id', holdId)
      .eq('user_id', user.id)
      .single();

    if (holdError || !hold) {
      return new Response(JSON.stringify({ error: 'Hold not found' }), {
        status: 404,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    if (hold.status !== 'held' || new Date(hold.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: 'Hold expired' }), {
        status: 410,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const amountVnd = Math.round(Number(hold.total) + tipAmount);
    // Stripe VND is zero-decimal; amount is in VND units
    if (!stripeKey) {
      // Dev fallback: mark hold convertible without Stripe
      return new Response(
        JSON.stringify({
          clientSecret: null,
          paymentIntentId: `dev_${holdId}`,
          amount: amountVnd,
          currency: 'vnd',
          mock: true,
        }),
        { headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const params = new URLSearchParams();
    params.set('amount', String(amountVnd));
    params.set('currency', 'vnd');
    params.set('automatic_payment_methods[enabled]', 'true');
    params.set('metadata[hold_id]', holdId);
    params.set('metadata[user_id]', user.id);
    params.set('metadata[class_id]', hold.class_id);
    if (tipAmount > 0) params.set('metadata[tip_amount]', String(tipAmount));

    const stripeRes = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });
    const intent = await stripeRes.json();
    if (!stripeRes.ok) {
      return new Response(JSON.stringify({ error: intent.error?.message || 'Stripe error' }), {
        status: 502,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        clientSecret: intent.client_secret,
        paymentIntentId: intent.id,
        amount: amountVnd,
        currency: 'vnd',
      }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
