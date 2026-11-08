// @ts-nocheck
// Deno Edge Function: expire holds, abandon reminders, waitlist + reactivation
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(supabaseUrl, serviceKey);
  const now = new Date();
  const summary = { expired: 0, reminded1h: 0, reminded24h: 0, reactivation: 0, waitlist: 0 };

  // 1) Expire held booking_holds
  const { data: expired } = await admin
    .from('booking_holds')
    .update({ status: 'expired' })
    .eq('status', 'held')
    .lt('expires_at', now.toISOString())
    .select('id');
  summary.expired = expired?.length ?? 0;

  // 2) 1h abandon reminders
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const { data: holds1h } = await admin
    .from('booking_holds')
    .select('*')
    .in('status', ['expired', 'abandoned'])
    .eq('reminded_1h', false)
    .lt('created_at', oneHourAgo)
    .limit(50);

  for (const hold of holds1h || []) {
    await admin.from('notifications').insert({
      user_id: hold.user_id,
      type: 'booking_abandon_1h',
      title: 'Finish your booking',
      message: 'Your slot hold expired — book again and get a small bonus.',
      reference_id: hold.id,
      href: `/class/${hold.class_id}`,
      payload: { holdId: hold.id },
      is_read: false,
    });
    await admin.from('booking_holds').update({ reminded_1h: true, status: 'abandoned' }).eq('id', hold.id);
    summary.reminded1h += 1;
  }

  // 3) 24h abandon reminders
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const { data: holds24h } = await admin
    .from('booking_holds')
    .select('*')
    .eq('status', 'abandoned')
    .eq('reminded_24h', false)
    .lt('created_at', dayAgo)
    .limit(50);

  for (const hold of holds24h || []) {
    await admin.from('notifications').insert({
      user_id: hold.user_id,
      type: 'booking_abandon_24h',
      title: 'Still want this session?',
      message: 'A similar slot may still be open. Come back to finish booking.',
      reference_id: hold.id,
      href: `/class/${hold.class_id}`,
      is_read: false,
    });
    await admin.from('booking_holds').update({ reminded_24h: true }).eq('id', hold.id);
    summary.reminded24h += 1;
  }

  // 4) Reactivation: inactive 30d students
  const thirtyDays = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: inactive } = await admin
    .from('profiles')
    .select('id, last_seen')
    .lt('last_seen', thirtyDays)
    .is('deactivated_at', null)
    .limit(40);

  for (const profile of inactive || []) {
    const code = `BACK${String(profile.id).slice(0, 4).toUpperCase()}10`;
    await admin.from('promo_codes').upsert(
      {
        code,
        discount_type: 'percent',
        discount_value: 10,
        is_active: true,
        max_uses: 1,
      },
      { onConflict: 'code' }
    );
    await admin.from('notifications').insert({
      user_id: profile.id,
      type: 'reactivation',
      title: 'We miss you on the mat',
      message: `Use code ${code} for 10% off your next session.`,
      reference_id: code,
      href: '/explore',
      is_read: false,
    });
    summary.reactivation += 1;
  }

  // 5) Waitlist notify when class has capacity (best-effort)
  const { data: waiting } = await admin
    .from('waitlist_entries')
    .select('id, user_id, class_id')
    .eq('status', 'waiting')
    .limit(30);

  for (const entry of waiting || []) {
    const { count } = await admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('class_id', entry.class_id)
      .eq('status', 'booked');
    const { data: cls } = await admin
      .from('classes')
      .select('capacity, name')
      .eq('id', entry.class_id)
      .maybeSingle();
    if (cls && (count ?? 0) < (cls.capacity || 999)) {
      await admin.from('notifications').insert({
        user_id: entry.user_id,
        type: 'waitlist_open',
        title: 'A spot opened',
        message: `${cls.name || 'Your class'} has availability — book now.`,
        reference_id: entry.id,
        href: `/class/${entry.class_id}`,
        is_read: false,
      });
      await admin
        .from('waitlist_entries')
        .update({ status: 'notified', notified_at: now.toISOString() })
        .eq('id', entry.id);
      summary.waitlist += 1;
    }
  }

  return new Response(JSON.stringify({ ok: true, summary }), {
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
});
