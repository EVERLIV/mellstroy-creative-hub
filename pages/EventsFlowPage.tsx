import React, { useState } from 'react';
import { Event, Trainer } from '../types';
import EventsPage from './EventsPage';
import EventDetailPage from './EventDetailPage';
import CreateEventPage from './CreateEventPage';

interface EventsFlowPageProps {
    events: Event[];
    currentUser: Trainer;
    onBack: () => void;
    onToggleInterest: (eventId: string) => void;
    onCreateEvent: (eventData: Omit<Event, 'id' | 'organizerId' | 'organizerName' | 'interestedUserIds'>) => void;
    initialEvent?: Event | null;
}

const EventsFlowPage: React.FC<EventsFlowPageProps> = ({ events, currentUser, onBack, onToggleInterest, onCreateEvent, initialEvent }) => {
    const [view, setView] = useState<'list' | 'detail' | 'create'>(initialEvent ? 'detail' : 'list');
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(initialEvent || null);
    const [isExiting, setIsExiting] = useState(false);

    const handleSelectEvent = (event: Event) => {
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

    const handleCreateAndGoBack = (eventData: Omit<Event, 'id' | 'organizerId' | 'organizerName' | 'interestedUserIds'>) => {
        onCreateEvent(eventData);
        handleBackToList();
    };

    const renderContent = () => {
        switch(view) {
            case 'detail':
                if (!selectedEvent) return null;
                return (
                    <div className={`absolute inset-0 w-full h-full ${isExiting ? 'animate-slide-out-to-right' : 'animate-slide-in-from-right'}`}>
                        <EventDetailPage 
                            event={selectedEvent}
                            currentUser={currentUser}
                            onBack={handleBackToList}
                            onToggleInterest={onToggleInterest}
                        />
                    </div>
                );
            case 'create':
                return (
                     <div className={`absolute inset-0 w-full h-full ${isExiting ? 'animate-slide-out-to-right' : 'animate-slide-in-from-right'}`}>
                        <CreateEventPage 
                            onBack={handleBackToList}
                            onCreateEvent={handleCreateAndGoBack}
                        />
                    </div>
                );
            case 'list':
            default:
                 return (
                    <div className={`transition-opacity duration-300 ${view !== 'list' ? 'opacity-0' : 'opacity-100'}`}>
                        <EventsPage 
                            events={events}
                            currentUser={currentUser}
                            onBack={onBack}
                            onSelectEvent={handleSelectEvent}
                            onOpenCreate={handleOpenCreate}
                        />
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