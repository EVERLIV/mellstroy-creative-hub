import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../src/integrations/supabase/client';
import EventsPage from './EventsPage';
import EventDetailPage from './EventDetailPage';
import CreateEventPage from './CreateEventPage';

interface EventsFlowPageProps {
    onBack: () => void;
    initialEvent?: any | null;
}

const EventsFlowPage: React.FC<EventsFlowPageProps> = ({ onBack, initialEvent }) => {
    const location = useLocation();
    const [view, setView] = useState<'list' | 'detail' | 'create'>('list');
    const [selectedEvent, setSelectedEvent] = useState<any | null>(initialEvent || null);
    const [isExiting, setIsExiting] = useState(false);
    const [events, setEvents] = useState<any[]>([]);
    const [isPremium, setIsPremium] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Check for event passed via navigation state
    useEffect(() => {
        if (location.state?.selectedEvent) {
            setSelectedEvent(location.state.selectedEvent);
            setView('detail');
        } else if (initialEvent) {
            setView('detail');
        }
    }, [location.state, initialEvent]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                setCurrentUserId(user.id);

                // Check if user is premium
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('is_premium')
                    .eq('id', user.id)
                    .single();

                setIsPremium(profileData?.is_premium || false);

                // Fetch events with participant counts
                const { data: eventsData, error } = await supabase
                    .from('events')
                    .select(`
                        *,
                        organizer:organizer_id (username)
                    `)
                    .eq('status', 'approved')
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

    const handleJoinEvent = async (eventId: string) => {
        // Refresh event data after joining
        try {
            const { data: updated } = await supabase
                .from('events')
                .select(`
                    *,
                    organizer:organizer_id (username)
                `)
                .eq('id', eventId)
                .single();

            if (updated) setSelectedEvent(updated);
        } catch (error) {
            console.error('Error refreshing event:', error);
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
                            onJoinEvent={handleJoinEvent}
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
                                isPremium={isPremium}
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