import React from 'react';
import { Event, Trainer } from '../types';
import { ArrowLeft, Heart, Calendar, Clock, MapPin, Users } from 'lucide-react';

const getAvatarUrl = (userId: string) => `https://i.pravatar.cc/40?u=${userId}`;

const InfoItem: React.FC<{ icon: React.FC<any>, label: string, value: string }> = ({ icon: Icon, label, value }) => (
    <div className="flex items-center">
        <div className="w-10 h-10 rounded-full bg-slate-200/60 flex items-center justify-center mr-3 flex-shrink-0">
            <Icon className="w-5 h-5 text-slate-600" />
        </div>
        <div>
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className="font-semibold text-slate-800 text-sm leading-tight">{value}</p>
        </div>
    </div>
);

interface EventDetailPageProps {
    event: Event;
    currentUser: Trainer;
    onBack: () => void;
    onToggleInterest: (eventId: string) => void;
}

const EventDetailPage: React.FC<EventDetailPageProps> = ({ event, currentUser, onBack, onToggleInterest }) => {
    
    const isInterested = event.interestedUserIds.includes(currentUser.id);

    const formatDateTime = () => {
        const date = new Date(event.date + 'T' + event.time);
        return {
            date: date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        };
    };
    
    const { date, time } = formatDateTime();

    return (
        <div className="h-full w-full bg-slate-50 flex flex-col relative">
            <header className="absolute top-0 left-0 right-0 z-20 p-4">
                <button onClick={onBack} className="bg-white/80 backdrop-blur-sm p-2 rounded-full text-gray-800 hover:bg-white transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>
            </header>

            <main className="flex-1 overflow-y-auto pb-28"> {/* Padding for footer */}
                <div className="h-64 w-full">
                    <img className="h-full w-full object-cover" src={event.imageUrl} alt={event.title} />
                </div>

                <div className="bg-white p-5 rounded-t-2xl -mt-8 relative z-10 space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{event.title}</h1>
                        <p className="text-sm font-semibold text-blue-600 mt-1">Organized by {event.organizerName}</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                        <InfoItem icon={Calendar} label="Date" value={date} />
                        <InfoItem icon={Clock} label="Time" value={time} />
                        <InfoItem icon={MapPin} label="Location" value={event.location} />
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-slate-900 mb-2">About this event</h2>
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{event.description}</p>
                    </div>
                    
                    <div>
                        <div className="flex items-center text-lg font-bold text-slate-900 mb-3">
                           <Users className="w-5 h-5 mr-2" />
                           <h2>Who's Interested</h2>
                        </div>
                        {event.interestedUserIds.length > 0 ? (
                            <div className="flex items-center">
                                <div className="flex -space-x-3">
                                    {event.interestedUserIds.slice(0, 7).map(id => (
                                        <img key={id} src={getAvatarUrl(id)} alt={`User ${id}`} className="w-9 h-9 rounded-full border-2 border-white object-cover shadow-sm" />
                                    ))}
                                </div>
                                <p className="text-sm text-slate-500 ml-4">
                                    <span className="font-bold">{event.interestedUserIds.length}</span> people are interested
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">Be the first to show your interest!</p>
                        )}
                    </div>
                </div>
            </main>

            <footer className="absolute bottom-0 left-0 right-0 px-4 pt-4 bg-white/90 backdrop-blur-sm border-t border-slate-200/80 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                 <button 
                    onClick={() => onToggleInterest(event.id)}
                    className={`w-full flex items-center justify-center font-bold py-3.5 px-4 rounded-xl transition-all duration-300 text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5
                    ${isInterested 
                        ? 'bg-white text-emerald-600 border-2 border-emerald-500'
                        : 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                    }`}
                >
                    <Heart className={`w-5 h-5 mr-2 transition-all ${isInterested ? 'fill-emerald-500 text-emerald-500' : ''}`} />
                    {isInterested ? "You're Interested!" : "I'm Interested"}
                </button>
            </footer>
        </div>
    );
};

export default EventDetailPage;