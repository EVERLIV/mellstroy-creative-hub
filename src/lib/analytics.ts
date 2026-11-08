import { supabase } from '../integrations/supabase/client';

export type AnalyticsEventName =
  | 'discover_view'
  | 'filter_apply'
  | 'trainer_profile_view'
  | 'slot_select'
  | 'booking_start'
  | 'booking_hold'
  | 'booking_complete'
  | 'booking_abandon'
  | 'chat_open'
  | 'review_submit'
  | 'waitlist_join'
  | 'promo_apply'
  | 'upsell_accept'
  | 'saved_search_create'
  | 'collection_click'
  | 'cross_sell_click'
  | 'tip_submit'
  | 'reschedule_offer'
  | 'repeat_book';

/** Fire-and-forget marketplace funnel event. Never blocks UI. */
export function trackEvent(
  name: AnalyticsEventName,
  props: Record<string, unknown> = {},
  userId?: string | null
) {
  void (async () => {
    try {
      let uid = userId ?? null;
      if (!uid) {
        const { data } = await supabase.auth.getUser();
        uid = data.user?.id ?? null;
      }
      await supabase.from('analytics_events' as never).insert({
        name,
        user_id: uid,
        props,
      } as never);
    } catch {
      /* analytics must not break product */
    }
  })();
}
