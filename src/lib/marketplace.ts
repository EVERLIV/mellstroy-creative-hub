import { supabase } from '../integrations/supabase/client';
import type { DiscoveryFilters } from './discovery-filters';

export type ClassPackage = {
  id: string;
  class_id: string;
  trainer_id: string;
  name: string;
  sessions: number;
  price: number;
  anchor_price: number | null;
  savings_pct: number | null;
  is_active: boolean | null;
};

export type PromotedListing = {
  id: string;
  target_type: 'trainer' | 'class';
  target_id: string;
  weight: number;
  insert_every_n: number | null;
  is_active: boolean | null;
};

export type PartnerOffer = {
  id: string;
  title: string;
  description: string | null;
  partner_name: string | null;
  image_url: string | null;
  cta_url: string | null;
  category: string | null;
};

export type RelatedService = {
  id: string;
  source_specialty: string;
  related_label: string;
  related_category: string | null;
  related_class_id: string | null;
  related_trainer_id: string | null;
};

export async function fetchActivePackages(classId: string) {
  const { data, error } = await supabase
    .from('class_packages' as never)
    .select('*')
    .eq('class_id', classId)
    .eq('is_active', true)
    .order('sessions', { ascending: true });
  return { data: (data || []) as ClassPackage[], error };
}

export async function fetchPromoted(targetType: 'trainer' | 'class') {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('promoted_listings' as never)
    .select('*')
    .eq('target_type', targetType)
    .eq('is_active', true)
    .lte('starts_at', now);
  return { data: (data || []) as PromotedListing[], error };
}

export async function saveSearch(input: {
  userId: string;
  name?: string;
  filters: DiscoveryFilters;
  target: 'trainer' | 'class';
  notify?: boolean;
}) {
  return supabase.from('saved_searches' as never).insert({
    user_id: input.userId,
    name: input.name || 'Saved search',
    filters: input.filters,
    target: input.target,
    notify: input.notify ?? true,
  } as never);
}

export type WaitlistEntry = {
  id: string;
  class_id: string;
  user_id: string;
  preferred_date: string | null;
  preferred_time: string | null;
  status: 'waiting' | 'notified' | 'booked' | 'cancelled';
  notified_at: string | null;
  created_at: string | null;
  classes?: {
    id: string;
    name: string;
    trainer_id: string;
    schedule_time?: string | null;
    venue_id?: string | null;
    venues?: { id: string; name: string; district: string | null; address: string | null } | null;
  } | null;
  profiles?: {
    id: string;
    username: string;
    avatar_url: string | null;
    location: string | null;
  } | null;
};

export async function joinWaitlist(input: {
  classId: string;
  userId: string;
  preferredDate?: string;
  preferredTime?: string;
}) {
  return supabase
    .from('waitlist_entries' as never)
    .insert({
      class_id: input.classId,
      user_id: input.userId,
      preferred_date: input.preferredDate ?? null,
      preferred_time: input.preferredTime ?? null,
      status: 'waiting',
    } as never)
    .select('*')
    .single();
}

export async function leaveWaitlist(entryId: string, userId: string) {
  return supabase
    .from('waitlist_entries' as never)
    .update({ status: 'cancelled' } as never)
    .eq('id', entryId)
    .eq('user_id', userId);
}

export async function fetchMyWaitlist(userId: string) {
  const { data, error } = await supabase
    .from('waitlist_entries' as never)
    .select(
      `*, classes:class_id (id, name, trainer_id, schedule_time, venue_id, venues:venue_id (id, name, district, address)), profiles:user_id (id, username, avatar_url, location)`
    )
    .eq('user_id', userId)
    .in('status', ['waiting', 'notified'])
    .order('created_at', { ascending: false });
  return { data: (data || []) as WaitlistEntry[], error };
}

/** Trainer view: everyone waiting on my classes */
export async function fetchTrainerWaitlist(trainerId: string) {
  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select('id')
    .eq('trainer_id', trainerId);
  if (classError) return { data: [] as WaitlistEntry[], error: classError };
  const ids = (classes || []).map((c) => c.id);
  if (!ids.length) return { data: [] as WaitlistEntry[], error: null };

  const { data, error } = await supabase
    .from('waitlist_entries' as never)
    .select(
      `*, classes:class_id (id, name, trainer_id, schedule_time, venue_id, venues:venue_id (id, name, district, address)), profiles:user_id (id, username, avatar_url, location)`
    )
    .in('class_id', ids)
    .in('status', ['waiting', 'notified'])
    .order('created_at', { ascending: true });
  return { data: (data || []) as WaitlistEntry[], error };
}

export async function notifyWaitlistEntry(entryId: string) {
  return supabase
    .from('waitlist_entries' as never)
    .update({ status: 'notified', notified_at: new Date().toISOString() } as never)
    .eq('id', entryId);
}

export async function fetchVenue(venueId: string) {
  const { data, error } = await supabase
    .from('venues' as never)
    .select('*')
    .eq('id', venueId)
    .maybeSingle();
  return { data, error };
}

export async function fetchClassVenue(classId: string) {
  const { data, error } = await supabase
    .from('classes')
    .select('venue_id, venues:venue_id (id, name, district, address, image_url, amenities)')
    .eq('id', classId)
    .maybeSingle();
  return { data, error };
}

/** Resolve trainer id for a class (for waitlist notifications). */
export async function fetchClassTrainerId(classId: string) {
  const { data, error } = await supabase
    .from('classes')
    .select('trainer_id, name')
    .eq('id', classId)
    .maybeSingle();
  return { data: data as { trainer_id: string; name: string } | null, error };
}

export async function createBookingHold(input: {
  classId: string;
  userId: string;
  holdDate: string;
  holdTime: string;
  packageId?: string;
  upsells?: unknown[];
  promoCode?: string;
  serviceFee: number;
  insuranceFee: number;
  subtotal: number;
  total: number;
  holdMinutes?: number;
}) {
  const expires = new Date(Date.now() + (input.holdMinutes ?? 10) * 60_000).toISOString();
  return supabase
    .from('booking_holds' as never)
    .insert({
      class_id: input.classId,
      user_id: input.userId,
      hold_date: input.holdDate,
      hold_time: input.holdTime,
      package_id: input.packageId ?? null,
      upsells: input.upsells ?? [],
      promo_code: input.promoCode ?? null,
      service_fee: input.serviceFee,
      insurance_fee: input.insuranceFee,
      subtotal: input.subtotal,
      total: input.total,
      status: 'held',
      expires_at: expires,
    } as never)
    .select('*')
    .single();
}

export async function fetchPartnerOffers(limit = 6) {
  const { data, error } = await supabase
    .from('partner_offers' as never)
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(limit);
  return { data: (data || []) as PartnerOffer[], error };
}

export async function fetchRelatedServices(specialty: string) {
  const { data, error } = await supabase
    .from('related_services' as never)
    .select('*')
    .ilike('source_specialty', `%${specialty}%`)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(8);
  return { data: (data || []) as RelatedService[], error };
}

export async function fetchFrequentlyTogether(classId: string) {
  const { data, error } = await supabase
    .from('frequently_together' as never)
    .select('*')
    .or(`class_a_id.eq.${classId},class_b_id.eq.${classId}`)
    .limit(6);
  return { data: data || [], error };
}

export async function lookupPromo(code: string) {
  const { data, error } = await supabase
    .from('promo_codes' as never)
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .eq('is_active', true)
    .maybeSingle();
  return {
    data: data as { discount_type: string; discount_value: number; code: string } | null,
    error,
  };
}

export function computeServiceFee(subtotal: number) {
  return Math.round(subtotal * 0.05);
}

export function applyPromo(
  subtotal: number,
  promo?: { discount_type: string; discount_value: number } | null
) {
  if (!promo) return 0;
  if (promo.discount_type === 'percent') {
    return Math.round(subtotal * (promo.discount_value / 100));
  }
  return Math.min(subtotal, promo.discount_value);
}

/** Interleave organic list with promoted ids every N cards; promoted first by weight. */
export function interleavePromoted<T extends { id: string }>(
  organic: T[],
  promotedIds: string[],
  everyN = 6
): T[] {
  if (!promotedIds.length) return organic;
  const promotedSet = new Set(promotedIds);
  const boosted = organic.filter((x) => promotedSet.has(x.id));
  const rest = organic.filter((x) => !promotedSet.has(x.id));
  const out: T[] = [...boosted];
  let n = everyN;
  for (let i = 0; i < rest.length; i++) {
    out.push(rest[i]);
    if ((i + 1) % n === 0 && boosted[Math.floor(i / n) % boosted.length]) {
      // already placed at top; skip duplicate inserts of same card
    }
  }
  return out;
}

export function boostScore(input: {
  rating: number;
  reviews: number;
  isPremium?: boolean;
  promotedWeight?: number;
  distanceKm?: number | null;
  createdAt?: string | null;
}) {
  const recency =
    input.createdAt != null
      ? Math.max(0, 30 - (Date.now() - new Date(input.createdAt).getTime()) / 86_400_000)
      : 0;
  const dist =
    input.distanceKm == null ? 0 : Math.max(0, 20 - Math.min(input.distanceKm, 20));
  return (
    (input.promotedWeight ?? 0) * 10 +
    input.rating * 8 +
    Math.min(input.reviews, 50) * 0.15 +
    (input.isPremium ? 5 : 0) +
    recency * 0.5 +
    dist * 0.4
  );
}
