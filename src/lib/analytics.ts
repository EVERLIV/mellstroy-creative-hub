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
  // Defer off the click/navigation path so a slow store write cannot freeze the tab.
  void Promise.resolve().then(async () => {
    try {
      let uid = userId ?? null;
      if (!uid) {
        try {
          const demo = localStorage.getItem('rhinofit.demoUser');
          if (demo) uid = (JSON.parse(demo) as { user?: { id?: string } }).user?.id ?? null;
        } catch {
          /* ignore */
        }
      }
      const { error } = await supabase.from('analytics_events' as never).insert({
        name,
        user_id: uid,
        props,
        created_at: new Date().toISOString(),
      } as never);
      if (error) {
        /* swallow */
      }
    } catch {
      /* analytics must not break product */
    }
  });
}
