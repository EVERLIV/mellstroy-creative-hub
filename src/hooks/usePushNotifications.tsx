import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import { useAuth } from './useAuth';

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted' && user) {
        await registerServiceWorker();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported, user]);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  };

  const showLocalNotification = useCallback((title: string, options?: NotificationOptions & { vibrate?: number[] }) => {
    if (permission !== 'granted') return;

    const defaultOptions: NotificationOptions = {
      icon: '/favicon.png',
      badge: '/favicon.png',
      ...options
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, defaultOptions);
      });
    } else {
      new Notification(title, defaultOptions);
    }
  }, [permission]);

  const scheduleLocalNotification = useCallback((
    title: string, 
    body: string, 
    delayMs: number,
    tag?: string
  ) => {
    if (permission !== 'granted') return null;

    const timeoutId = setTimeout(() => {
      showLocalNotification(title, { body, tag });
    }, delayMs);

    return timeoutId;
  }, [permission, showLocalNotification]);

  return {
    permission,
    isSupported,
    requestPermission,
    showLocalNotification,
    scheduleLocalNotification
  };
};

// Hook for automatic notifications based on app events
export const useNotificationTriggers = () => {
  const { user } = useAuth();
  const { permission, showLocalNotification } = usePushNotifications();

  useEffect(() => {
    if (!user || permission !== 'granted') return;

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('messages-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`
        },
        async (payload) => {
          const message = payload.new as any;
          
          // Don't notify if app is in foreground and focused
          if (document.visibilityState === 'visible') return;

          // Get sender info
          const { data: sender } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', message.sender_id)
            .single();

          showLocalNotification('New Message', {
            body: `${sender?.username || 'Someone'}: ${message.content.substring(0, 50)}...`,
            tag: `message-${message.id}`,
            data: { url: `/chat/${message.conversation_id}` }
          });
        }
      )
      .subscribe();

    // Subscribe to new bookings (for trainers)
    const bookingsChannel = supabase
      .channel('bookings-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings'
        },
        async (payload) => {
          const booking = payload.new as any;
          
          // Check if current user is the trainer for this class
          const { data: classData } = await supabase
            .from('classes')
            .select('trainer_id, name')
            .eq('id', booking.class_id)
            .single();

          if (classData?.trainer_id !== user.id) return;
          if (document.visibilityState === 'visible') return;

          // Get client info
          const { data: client } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', booking.client_id)
            .single();

          showLocalNotification('New Booking!', {
            body: `${client?.username || 'A client'} booked "${classData?.name}"`,
            tag: `booking-${booking.id}`,
            data: { url: '/bookings' }
          });
        }
      )
      .subscribe();

    // Subscribe to new events in user's district
    const eventsChannel = supabase
      .channel('events-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events'
        },
        async (payload) => {
          const event = payload.new as any;
          
          if (document.visibilityState === 'visible') return;

          // Get user's district
          const { data: profile } = await supabase
            .from('profiles')
            .select('district')
            .eq('id', user.id)
            .single();

          // Only notify if event is in user's district
          if (profile?.district && event.district === profile.district) {
            showLocalNotification('New Event in Your Area!', {
              body: `"${event.title}" - ${event.location}`,
              tag: `event-${event.id}`,
              data: { url: `/events/${event.id}` }
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(eventsChannel);
    };
  }, [user, permission, showLocalNotification]);
};

// Daily reminder hook
export const useDailyReminder = () => {
  const { user } = useAuth();
  const { permission, showLocalNotification } = usePushNotifications();

  useEffect(() => {
    if (!user || permission !== 'granted') return;

    const REMINDER_KEY = 'rhinofit_daily_reminder';
    const REMINDER_HOUR = 18; // 6 PM

    const checkAndScheduleReminder = () => {
      const now = new Date();
      const lastReminder = localStorage.getItem(REMINDER_KEY);
      const today = now.toDateString();

      // Already reminded today
      if (lastReminder === today) return;

      const reminderTime = new Date();
      reminderTime.setHours(REMINDER_HOUR, 0, 0, 0);

      // If it's past reminder time, show notification
      if (now >= reminderTime) {
        showLocalNotification('Time to Train! 💪', {
          body: "Don't skip your workout today! Your fitness goals are waiting.",
          tag: 'daily-reminder',
          data: { url: '/explore' }
        });
        localStorage.setItem(REMINDER_KEY, today);
      } else {
        // Schedule for later today
        const delay = reminderTime.getTime() - now.getTime();
        setTimeout(() => {
          showLocalNotification('Time to Train! 💪', {
            body: "Don't skip your workout today! Your fitness goals are waiting.",
            tag: 'daily-reminder',
            data: { url: '/explore' }
          });
          localStorage.setItem(REMINDER_KEY, today);
        }, delay);
      }
    };

    checkAndScheduleReminder();

    // Check again every hour
    const interval = setInterval(checkAndScheduleReminder, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, permission, showLocalNotification]);
};
