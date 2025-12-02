import React, { useState } from 'react';
import { ArrowLeft, Plus, Users, Calendar, MapPin, User, Clock, DollarSign, Crown, List, CalendarDays, Dumbbell, Building2 } from 'lucide-react';
import EventCalendar from '../components/EventCalendar';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    image_url: string | null;
    organizer: { username: string; is_premium?: boolean }[];
    status: string;
    participant_count?: number;
    event_type?: string;
    price?: number;
    max_participants?: number;
    sport_category?: string;
    district?: string;
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
    const isOrganizerPremium = event.organizer?.[0]?.is_premium || false;
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
                
                {/* Sport Category & District Badges */}
                {(event.sport_category || event.district) && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {event.sport_category && (
                            <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium px-2 py-0.5 rounded-md">
                                <Dumbbell className="w-3 h-3" />
                                {event.sport_category}
                            </span>
                        )}
                        {event.district && (
                            <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium px-2 py-0.5 rounded-md">
                                <Building2 className="w-3 h-3" />
                                {event.district}
                            </span>
                        )}
                    </div>
                )}

                <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">Organized by <span className="font-semibold">{organizerName}</span></span>
                        {isOrganizerPremium && (
                            <Crown className="w-3.5 h-3.5 ml-1.5 text-primary flex-shrink-0" />
                        )}
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
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

    const CreateEventButton = () => (
        <button 
            onClick={onOpenCreate}
            className="w-full flex items-center justify-center bg-primary text-primary-foreground font-semibold h-12 rounded-xl hover:bg-primary/90 transition-colors duration-200 shadow-md"
        >
            <Plus className="w-5 h-5 mr-2" />
            Create New Event
        </button>
    );

    return (
        <div className="bg-background h-full flex flex-col relative">
            <button onClick={onBack} className="absolute top-4 left-4 z-10 bg-card border border-border shadow-md p-2 rounded-full text-foreground hover:bg-muted transition-colors">
                <ArrowLeft className="w-6 h-6" />
            </button>
            
            <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
                <div className="pt-12">
                    <h1 className="text-2xl font-bold text-foreground mb-4">Community Events</h1>
                    <CreateEventButton />
                </div>

                {/* View Toggle */}
                <div className="flex items-center justify-center gap-2 py-2">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`flex items-center gap-2 px-6 h-10 rounded-xl font-semibold text-sm transition-colors ${
                            viewMode === 'list'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                    >
                        <List className="w-4 h-4" />
                        List
                    </button>
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={`flex items-center gap-2 px-6 h-10 rounded-xl font-semibold text-sm transition-colors ${
                            viewMode === 'calendar'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                    >
                        <CalendarDays className="w-4 h-4" />
                        Calendar
                    </button>
                </div>
                
                <div className="border-t border-border pt-4">
                    {viewMode === 'list' ? (
                        <>
                            <h2 className="text-lg font-semibold text-foreground mb-3">Upcoming Events</h2>
                            <div className="space-y-4">
                                {events.map(event => (
                                    <EventCard key={event.id} event={event} onSelect={() => onSelectEvent(event)} />
                                ))}
                            </div>
                            {events.length === 0 && (
                                <div className="text-center mt-8">
                                    <p className="text-muted-foreground">No upcoming events</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <EventCalendar events={events} onSelectEvent={onSelectEvent} />
                    )}
                </div>
            </main>
        </div>
    );
};

export default EventsPage;