import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface NotificationPreferences {
  messages_enabled: boolean;
  bookings_enabled: boolean;
  events_enabled: boolean;
  daily_reminder_enabled: boolean;
  reviews_enabled: boolean;
}

const defaultPreferences: NotificationPreferences = {
  messages_enabled: true,
  bookings_enabled: true,
  events_enabled: true,
  daily_reminder_enabled: true,
  reviews_enabled: true,
};

export const useNotificationPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setPreferences(defaultPreferences);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences({
          messages_enabled: data.messages_enabled,
          bookings_enabled: data.bookings_enabled,
          events_enabled: data.events_enabled,
          daily_reminder_enabled: data.daily_reminder_enabled,
          reviews_enabled: data.reviews_enabled,
        });
      } else {
        // No preferences saved yet, use defaults
        setPreferences(defaultPreferences);
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      setPreferences(defaultPreferences);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    loading,
    refetch: fetchPreferences,
  };
};
