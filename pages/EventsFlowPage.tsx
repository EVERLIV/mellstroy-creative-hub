import React, { useState, useEffect } from 'react';
import { supabase } from '../src/integrations/supabase/client';
import EventsPage from './EventsPage';
import EventDetailPage from './EventDetailPage';
import CreateEventPage from './CreateEventPage';

interface EventsFlowPageProps {
    onBack: () => void;
    initialEvent?: any | null;
}

const EventsFlowPage: React.FC<EventsFlowPageProps> = ({ onBack, initialEvent }) => {
    const [view, setView] = useState<'list' | 'detail' | 'create'>(initialEvent ? 'detail' : 'list');
    const [selectedEvent, setSelectedEvent] = useState<any | null>(initialEvent || null);
    const [isExiting, setIsExiting] = useState(false);
    const [events, setEvents] = useState<any[]>([]);
    const [isTrainer, setIsTrainer] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                setCurrentUserId(user.id);

                // Check if user is trainer
                const { data: roleData } = await supabase
                    .from('user_roles')
                    .select('role')
                    .eq('user_id', user.id)
                    .eq('role', 'trainer')
                    .maybeSingle();

                setIsTrainer(!!roleData);

                // Fetch events (approved + own pending)
                const { data: eventsData, error } = await supabase
                    .from('events')
                    .select(`
                        *,
                        organizer:organizer_id (username),
                        interests:event_interests (count)
                    `)
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

        // Subscribe to realtime updates
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

    const handleSelectEvent = (event: any) => {
        setSelectedEvent(event);
        setView('detail');
    };

    const handleBackToList = () => {
        setIsExiting(true);
        setTimeout(() => {
            setView('list');
            setSelectedEvent(null);
            setIsExiting(false);
        }, 350);
    };

    const handleOpenCreate = () => {
        setView('create');
    };

    const handleToggleInterest = async (eventId: string) => {
        if (!currentUserId) return;

        try {
            // Check if already interested
            const { data: existing } = await supabase
                .from('event_interests')
                .select()
                .eq('event_id', eventId)
                .eq('user_id', currentUserId)
                .maybeSingle();

            if (existing) {
                await supabase.from('event_interests').delete().eq('id', existing.id);
            } else {
                await supabase.from('event_interests').insert({
                    event_id: eventId,
                    user_id: currentUserId,
                });
            }

            // Refresh selected event
            const { data: updated } = await supabase
                .from('events')
                .select(`
                    *,
                    organizer:organizer_id (username),
                    interests:event_interests (count)
                `)
                .eq('id', eventId)
                .single();

            if (updated) setSelectedEvent(updated);
        } catch (error) {
            console.error('Error toggling interest:', error);
        }
    };

    const renderContent = () => {
        switch(view) {
            case 'detail':
                if (!selectedEvent) return null;
                return (
                    <div className={`absolute inset-0 w-full h-full ${isExiting ? 'animate-slide-out-to-right' : 'animate-slide-in-from-right'}`}>
                        <EventDetailPage 
                            event={selectedEvent}
                            currentUserId={currentUserId}
                            onBack={handleBackToList}
                            onToggleInterest={handleToggleInterest}
                        />
                    </div>
                );
            case 'create':
                return (
                     <div className={`absolute inset-0 w-full h-full ${isExiting ? 'animate-slide-out-to-right' : 'animate-slide-in-from-right'}`}>
                        <CreateEventPage 
                            onBack={handleBackToList}
                            onSuccess={handleBackToList}
                        />
                    </div>
                );
            case 'list':
            default:
                 return (
                    <div className={`transition-opacity duration-300 ${view !== 'list' ? 'opacity-0' : 'opacity-100'}`}>
                        {!loading && (
                            <EventsPage 
                                events={events}
                                isTrainer={isTrainer}
                                onBack={onBack}
                                onSelectEvent={handleSelectEvent}
                                onOpenCreate={handleOpenCreate}
                            />
                        )}
                    </div>
                 );
        }
    };

    return (
        <div className="relative w-full h-full overflow-hidden">
            {renderContent()}
        </div>
    );
};

export default EventsFlowPage;