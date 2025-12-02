import React from 'react';
import { ArrowLeft, Plus, Users, Calendar, MapPin, User, Lock, Clock, DollarSign } from 'lucide-react';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    image_url: string | null;
    organizer: { username: string }[];
    status: string;
    participant_count?: number;
    event_type?: string;
    price?: number;
    max_participants?: number;
  };
  onSelect: () => void;
}

const getEventTypeLabel = (type: string) => {
    const types: Record<string, string> = {
        partner_search: 'Looking for Partner',
        sparring: 'Sparring Session',
        group_class: 'Group Class',
        ride: 'Ride/Run',
        competition: 'Competition',
        general: 'General Event'
    };
    return types[type] || 'General Event';
};

const EventCard: React.FC<EventCardProps> = ({ event, onSelect }) => {
    const eventDate = new Date(event.date);
    const month = eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const day = eventDate.getDate();
    const organizerName = event.organizer?.[0]?.username || 'Unknown';
    const participantCount = event.participant_count || 0;
    const isFree = !event.price || event.price === 0;

    return (
        <button onClick={onSelect} className="w-full bg-card rounded-2xl border border-border overflow-hidden text-left hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="relative">
                <img 
                  src={event.image_url || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800'} 
                  alt={event.title} 
                  className="h-44 w-full object-cover" 
                />
                <div className="absolute top-3 right-3 bg-card rounded-xl p-2 text-center shadow-md">
                    <p className="text-sm font-bold text-primary">{month}</p>
                    <p className="text-2xl font-extrabold text-foreground -mt-1">{day}</p>
                </div>
                {event.event_type && event.event_type !== 'general' && (
                  <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-lg">
                    {getEventTypeLabel(event.event_type)}
                  </div>
                )}
            </div>
            <div className="p-4">
                <h3 className="font-bold text-foreground text-lg truncate">{event.title}</h3>
                <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">Organized by <span className="font-semibold">{organizerName}</span></span>
                    </div>
                    <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                    </div>
                    {!isFree && (
                        <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="font-semibold text-primary">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(event.price!).replace(/\s/g, '')}
                            </span>
                        </div>
                    )}
                </div>
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="w-4 h-4 mr-1.5" />
                        <span className="font-semibold">{participantCount}</span>
                        {event.max_participants && <span className="ml-1">/ {event.max_participants}</span>}
                        <span className="ml-1">Joined</span>
                    </div>
                    <div className="flex items-center justify-center bg-primary text-primary-foreground font-bold py-2 px-4 rounded-lg text-sm">
                        View Details
                    </div>
                </div>
            </div>
        </button>
    )
};


interface EventsPageProps {
    events: any[];
    isPremium: boolean;
    onBack: () => void;
    onSelectEvent: (event: any) => void;
    onOpenCreate: () => void;
}

const EventsPage: React.FC<EventsPageProps> = ({ events, isPremium, onBack, onSelectEvent, onOpenCreate }) => {

    const CreateEventButton = () => (
        <div className="relative group">
            <button 
                onClick={isPremium ? onOpenCreate : undefined}
                disabled={!isPremium}
                className="w-full flex items-center justify-center bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors duration-200 shadow-md disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
            >
                {isPremium ? <Plus className="w-5 h-5 mr-2" /> : <Lock className="w-5 h-5 mr-2" />}
                Create New Event
            </button>
            {!isPremium && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-card border border-border text-foreground text-xs font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Premium feature - Upgrade to create events
                </div>
            )}
        </div>
    );

    return (
        <div className="bg-background h-full flex flex-col relative">
            <button onClick={onBack} className="absolute top-4 left-4 z-10 bg-card border border-border shadow-md p-2 rounded-full text-foreground hover:bg-muted transition-colors">
                <ArrowLeft className="w-6 h-6" />
            </button>
            
            <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
                <div className="pt-12">
                    <h1 className="text-3xl font-bold text-foreground mb-4">Community Events</h1>
                    <CreateEventButton />
                </div>
                
                <div className="border-t border-border pt-4">
                     <h2 className="text-xl font-bold text-foreground mb-3">Upcoming Events</h2>
                     <div className="space-y-4">
                        {events.map(event => (
                            <EventCard key={event.id} event={event} onSelect={() => onSelectEvent(event)} />
                        ))}
                    </div>
                </div>
                 <div className="text-center mt-8">
                    <p className="text-muted-foreground">More events coming soon!</p>
                </div>
            </main>
        </div>
    );
};

export default EventsPage;