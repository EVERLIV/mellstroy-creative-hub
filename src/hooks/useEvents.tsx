import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Event } from '../../types';
import { useToast } from './use-toast';

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch events with organizer profiles
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          *,
          organizer:profiles!events_organizer_id_fkey(username)
        `)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (eventsError) {
        console.error('Error fetching events:', eventsError);
        setEvents([]);
        setLoading(false);
        return;
      }

      // Fetch event interests to get interestedUserIds
      const eventIds = eventsData?.map(e => e.id) || [];
      let interestedUsersMap: Record<string, string[]> = {};

      if (eventIds.length > 0) {
        const { data: interests, error: interestsError } = await supabase
          .from('event_interests')
          .select('event_id, user_id')
          .in('event_id', eventIds);

        if (!interestsError && interests) {
          interestedUsersMap = interests.reduce((acc, interest) => {
            if (!acc[interest.event_id]) {
              acc[interest.event_id] = [];
            }
            acc[interest.event_id].push(interest.user_id);
            return acc;
          }, {} as Record<string, string[]>);
        }
      }

      // Transform data
      const transformedEvents: Event[] = (eventsData || []).map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        organizerId: event.organizer_id,
        organizerName: (event.organizer as any)?.username || 'Unknown',
        date: event.date,
        time: event.time,
        location: event.location,
        imageUrl: event.image_url || '',
        interestedUserIds: interestedUsersMap[event.id] || [],
      }));

      setEvents(transformedEvents);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load events';
      console.error('Error loading events:', err);
      setError(errorMessage);
      setEvents([]);
      // Don't show toast on initial load to avoid spam
      // Only show toast if we had events before and lost them
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return { events, loading, error, refetch: loadEvents };
};

