import { useEffect, useRef } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Hook to track user activity and update last_seen timestamp
 * Updates every 5 minutes when the user is active
 */
export const useActivityTracker = () => {
  const { user } = useAuth();
  const lastUpdateRef = useRef<Date>(new Date());
  const activityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const updateLastSeen = async () => {
    if (!user) return;

    const now = new Date();
    const timeSinceLastUpdate = now.getTime() - lastUpdateRef.current.getTime();
    
    // Only update if 5 minutes have passed since last update
    if (timeSinceLastUpdate < 5 * 60 * 1000) return;

    try {
      await supabase
        .from('profiles')
        .update({ last_seen: now.toISOString() })
        .eq('id', user.id);
      
      lastUpdateRef.current = now;
      console.log('Updated last_seen');
    } catch (error) {
      console.error('Error updating last_seen:', error);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Track various user activity events
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      // Clear existing timer
      if (activityTimerRef.current) {
        clearTimeout(activityTimerRef.current);
      }

      // Set new timer to update after activity stops for 1 second
      activityTimerRef.current = setTimeout(() => {
        updateLastSeen();
      }, 1000);
    };

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Also update periodically every 5 minutes if user is on the page
    const intervalId = setInterval(() => {
      updateLastSeen();
    }, 5 * 60 * 1000);

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      
      if (activityTimerRef.current) {
        clearTimeout(activityTimerRef.current);
      }
      
      clearInterval(intervalId);
    };
  }, [user]);
};
