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
                        organizer:organizer_id (username, is_premium)
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

    const handleCreateSuccess = async () => {
        // Refresh events list after creation
        try {
            const { data: eventsData } = await supabase
                .from('events')
                .select(`
                    *,
                    organizer:organizer_id (username, is_premium)
                `)
                .eq('status', 'approved')
                .order('date', { ascending: true });

            setEvents(eventsData || []);
        } catch (error) {
            console.error('Error refreshing events:', error);
        }
        
        handleBackToList();
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
        if (view === 'detail' && selectedEvent) {
            return (
                <div className={`absolute inset-0 w-full h-full z-20 bg-background ${isExiting ? 'animate-slide-out-to-right' : 'animate-slide-in-from-right'}`}>
                    <EventDetailPage 
                        event={selectedEvent}
                        currentUserId={currentUserId}
                        onBack={handleBackToList}
                        onJoinEvent={handleJoinEvent}
                    />
                </div>
            );
        }
        
        if (view === 'create') {
            return (
                <div className={`absolute inset-0 w-full h-full z-20 bg-background ${isExiting ? 'animate-slide-out-to-right' : 'animate-slide-in-from-right'}`}>
                    <CreateEventPage 
                        onBack={handleBackToList}
                        onSuccess={handleCreateSuccess}
                    />
                </div>
            );
        }
        
        // Default list view
        if (loading) return null;
        
        return (
            <EventsPage 
                events={events}
                isPremium={isPremium}
                onBack={onBack}
                onSelectEvent={handleSelectEvent}
                onOpenCreate={handleOpenCreate}
            />
        );
    };

    return (
        <div className="h-screen w-full overflow-hidden bg-background">
            {renderContent()}
        </div>
    );
};

export default EventsFlowPage;