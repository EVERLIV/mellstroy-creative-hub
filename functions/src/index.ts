import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';

admin.initializeApp();
const db = admin.firestore();

/** Mock booking PaymentIntent — replaces Supabase create-booking-payment */
export const createBookingPayment = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in required');
  }
  const holdId = String(request.data?.holdId || '');
  const tipAmount = Number(request.data?.tipAmount || 0);
  if (!holdId && !request.data?.bookingId) {
    throw new HttpsError('invalid-argument', 'holdId or bookingId required');
  }

  return {
    clientSecret: null,
    paymentIntentId: `mock_pi_${holdId || request.data.bookingId}_${Date.now()}`,
    amount: tipAmount,
    currency: 'vnd',
    mock: true,
  };
});

/** Lifecycle job: expire holds, abandon reminders, waitlist opens */
export const marketplaceLifecycle = onSchedule('every 60 minutes', async () => {
  const now = admin.firestore.Timestamp.now();
  const holds = await db
    .collection('booking_holds')
    .where('status', '==', 'held')
    .get();

  const batch = db.batch();
  holds.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const expires = data.expires_at?.toDate?.() || new Date(data.expires_at);
    if (expires && expires.getTime() < Date.now()) {
      batch.update(docSnap.ref, { status: 'expired' });
    }
  });
  await batch.commit();

  // Waitlist notify best-effort
  const waiting = await db.collection('waitlist_entries').where('status', '==', 'waiting').limit(20).get();
  for (const entry of waiting.docs) {
    const e = entry.data();
    const bookings = await db.collection('bookings').where('class_id', '==', e.class_id).where('status', '==', 'booked').get();
    const classSnap = await db.collection('classes').doc(e.class_id).get();
    const capacity = classSnap.data()?.capacity ?? 999;
    if (bookings.size < capacity) {
      await db.collection('notifications').add({
        user_id: e.user_id,
        type: 'waitlist_open',
        title: 'A spot opened',
        message: 'A class on your waitlist has availability.',
        href: `/class/${e.class_id}`,
        reference_id: entry.id,
        is_read: false,
        created_at: now.toDate().toISOString(),
      });
      await entry.ref.update({ status: 'notified', notified_at: now.toDate().toISOString() });
    }
  }

  return null;
});
