import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../src/integrations/supabase/client';
import { AppScreen } from '@/src/components/layout/screen';
import { PageLoader } from '@/src/components/layout/states';
import EventsPage from './EventsPage';
import EventDetailPage from './EventDetailPage';
import CreateEventPage from './CreateEventPage';

interface EventsFlowPageProps {
  onBack?: () => void;
  initialEvent?: any | null;
}

const EventsFlowPage: React.FC<EventsFlowPageProps> = ({ onBack, initialEvent }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId?: string }>();

  const [view, setView] = useState<'list' | 'detail' | 'create'>(() =>
    eventId || initialEvent || location.state?.selectedEvent ? 'detail' : 'list'
  );
  const [selectedEvent, setSelectedEvent] = useState<any | null>(
    initialEvent || location.state?.selectedEvent || null
  );
  const [events, setEvents] = useState<any[]>([]);
  const [isTrainer, setIsTrainer] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        setCurrentUserId(user.id);

        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'trainer')
          .maybeSingle();

        setIsTrainer(!!roleData);

        const { data: eventsData, error } = await supabase
          .from('events')
          .select(
            `
            *,
            organizer:organizer_id (username),
            interests:event_interests (count)`
          )
          .or(`status.eq.approved,organizer_id.eq.${user.id}`)
          .order('date', { ascending: true });

        if (error) throw error;
        setEvents(eventsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const channel = supabase
      .channel('events_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // URL → detail / list
  useEffect(() => {
    if (location.pathname.endsWith('/create') || location.pathname.endsWith('/events/new')) {
      setView('create');
      return;
    }

    if (eventId) {
      const fromList = events.find((e) => e.id === eventId);
      if (fromList) {
        setSelectedEvent(fromList);
        setView('detail');
        return;
      }
      // Deep-link before list loads, or refresh single event
      const loadOne = async () => {
        const { data } = await supabase
          .from('events')
          .select(
            `
            *,
            organizer:organizer_id (username),
            interests:event_interests (count)`
          )
          .eq('id', eventId)
          .maybeSingle();
        if (data) {
          setSelectedEvent(data);
          setView('detail');
        }
      };
      void loadOne();
      return;
    }

    if (location.state?.selectedEvent) {
      setSelectedEvent(location.state.selectedEvent);
      setView('detail');
      return;
    }

    if (initialEvent) {
      setSelectedEvent(initialEvent);
      setView('detail');
      return;
    }

    setView('list');
    setSelectedEvent(null);
  }, [eventId, events, location.pathname, location.state, initialEvent]);

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
    setView('detail');
    navigate(`/events/${event.id}`);
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedEvent(null);
    navigate('/events');
  };

  const handleOpenCreate = () => {
    setView('create');
    navigate('/events/create');
  };

  const handleToggleInterest = async (id: string) => {
    if (!currentUserId) return;
    try {
      const { data: existing } = await supabase
        .from('event_interests')
        .select()
        .eq('event_id', id)
        .eq('user_id', currentUserId)
        .maybeSingle();

      if (existing) {
        await supabase.from('event_interests').delete().eq('id', existing.id);
      } else {
        await supabase.from('event_interests').insert({
          event_id: id,
          user_id: currentUserId,
        });
      }

      const { data: updated } = await supabase
        .from('events')
        .select(
          `
          *,
          organizer:organizer_id (username),
          interests:event_interests (count)`
        )
        .eq('id', id)
        .single();

      if (updated) setSelectedEvent(updated);
    } catch (error) {
      console.error('Error toggling interest:', error);
    }
  };

  if (loading && view === 'list' && !selectedEvent) {
    return (
      <AppScreen>
        <PageLoader title="Loading events…" className="min-h-svh" />
      </AppScreen>
    );
  }

  if (view === 'create') {
    return (
      <CreateEventPage
        onBack={handleBackToList}
        onSuccess={handleBackToList}
      />
    );
  }

  if (view === 'detail' && selectedEvent) {
    return (
      <EventDetailPage
        event={selectedEvent}
        currentUserId={currentUserId}
        onBack={handleBackToList}
        onToggleInterest={handleToggleInterest}
      />
    );
  }

  return (
    <EventsPage
      events={events}
      isTrainer={isTrainer}
      onBack={onBack || (() => navigate('/'))}
      onSelectEvent={handleSelectEvent}
      onOpenCreate={handleOpenCreate}
    />
  );
};

export default EventsFlowPage;
