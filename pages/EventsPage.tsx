import React from 'react';
import { Event, Trainer } from '../types';
import { ArrowLeft, Plus, Heart, Calendar, MapPin, User, Lock } from 'lucide-react';

const EventCard: React.FC<{ event: Event; onSelect: () => void; }> = ({ event, onSelect }) => {
    const eventDate = new Date(event.date);
    const month = eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const day = eventDate.getDate();

    return (
        <button onClick={onSelect} className="w-full bg-white rounded-2xl shadow-md shadow-slate-200/60 overflow-hidden text-left hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="relative">
                <img src={event.imageUrl} alt={event.title} className="h-44 w-full object-cover" />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl p-2 text-center shadow">
                    <p className="text-sm font-bold text-red-500">{month}</p>
                    <p className="text-2xl font-extrabold text-slate-800 -mt-1">{day}</p>
                </div>
            </div>
            <div className="p-4">
                <h3 className="font-bold text-gray-800 text-lg truncate">{event.title}</h3>
                <div className="mt-2 space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                        <span className="truncate">Organized by <span className="font-semibold">{event.organizerName}</span></span>
                    </div>
                    <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                    </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                        <Heart className="w-4 h-4 mr-1.5 text-red-400" />
                        <span className="font-semibold">{event.interestedUserIds.length}</span>
                        <span className="ml-1">Interested</span>
                    </div>
                    <div className="flex items-center justify-center bg-[#FF6B35] text-white font-bold py-2 px-4 rounded-lg text-sm">
                        View Details
                    </div>
                </div>
            </div>
        </button>
    )
};


interface EventsPageProps {
    events: Event[];
    currentUser: Trainer;
    onBack: () => void;
    onSelectEvent: (event: Event) => void;
    onOpenCreate: () => void;
}

const EventsPage: React.FC<EventsPageProps> = ({ events, currentUser, onBack, onSelectEvent, onOpenCreate }) => {
    const isPremium = currentUser.isPremium;

    const CreateEventButton = () => (
        <div className="relative group">
            <button 
                onClick={isPremium ? onOpenCreate : undefined}
                disabled={!isPremium}
                className="w-full flex items-center justify-center bg-blue-500 text-white font-bold py-3 rounded-xl hover:bg-blue-600 transition-colors duration-200 shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
                {isPremium ? <Plus className="w-5 h-5 mr-2" /> : <Lock className="w-5 h-5 mr-2" />}
                Create New Event
            </button>
            {!isPremium && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-slate-700 text-white text-xs font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    This is a premium feature
                </div>
            )}
        </div>
    );

    return (
        <div className="bg-slate-50 h-full flex flex-col relative">
            <button onClick={onBack} className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-full text-gray-800 hover:bg-white transition-colors">
                <ArrowLeft className="w-6 h-6" />
            </button>
            
            <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
                <div className="pt-12">
                    <h1 className="text-3xl font-bold text-slate-800 mb-4">Community Events</h1>
                    <CreateEventButton />
                </div>
                
                <div className="border-t pt-4">
                     <h2 className="text-xl font-bold text-gray-800 mb-3">Upcoming Events</h2>
                     <div className="space-y-4">
                        {events.map(event => (
                            <EventCard key={event.id} event={event} onSelect={() => onSelectEvent(event)} />
                        ))}
                    </div>
                </div>
                 <div className="text-center mt-8">
                    <p className="text-slate-500">More events coming soon!</p>
                </div>
            </main>
        </div>
    );
};

export default EventsPage;