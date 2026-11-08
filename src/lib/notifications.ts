import { supabase } from '../integrations/supabase/client';

export type AppNotification = {
  id: string;
  user_id: string;
  type: string;
  message: string;
  reference_id: string;
  title?: string | null;
  href?: string | null;
  is_read: boolean | null;
  created_at: string | null;
  payload?: Record<string, unknown> | null;
};

export async function createNotification(input: {
  userId: string;
  type: string;
  message: string;
  referenceId?: string;
  title?: string;
  href?: string;
  payload?: Record<string, unknown>;
}) {
  const { error } = await supabase.from('notifications').insert({
    user_id: input.userId,
    type: input.type,
    message: input.message,
    reference_id: input.referenceId || crypto.randomUUID(),
    title: input.title ?? null,
    href: input.href ?? null,
    payload: input.payload ?? {},
    is_read: false,
  } as never);
  return { error };
}

export async function listNotifications(userId: string, limit = 30) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data: (data || []) as AppNotification[], error };
}

export async function markNotificationRead(id: string) {
  return supabase.from('notifications').update({ is_read: true } as never).eq('id', id);
}

export async function markAllNotificationsRead(userId: string) {
  return supabase
    .from('notifications')
    .update({ is_read: true } as never)
    .eq('user_id', userId)
    .eq('is_read', false);
}

export async function unreadNotificationCount(userId: string) {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  return { count: count ?? 0, error };
}
