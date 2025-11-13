import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Calendar, Clock, MapPin, Users } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';

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
    event: any;
    currentUserId: string | null;
    onBack: () => void;
    onToggleInterest: (eventId: string) => void;
}

const EventDetailPage: React.FC<EventDetailPageProps> = ({ event, currentUserId, onBack, onToggleInterest }) => {
    const [isInterested, setIsInterested] = useState(false);
    const [interestCount, setInterestCount] = useState(0);

    useEffect(() => {
        const checkInterest = async () => {
            if (!currentUserId) return;

            try {
                const { data } = await supabase
                    .from('event_interests')
                    .select()
                    .eq('event_id', event.id)
                    .eq('user_id', currentUserId)
                    .maybeSingle();

                setIsInterested(!!data);

                const { count } = await supabase
                    .from('event_interests')
                    .select('*', { count: 'exact', head: true })
                    .eq('event_id', event.id);

                setInterestCount(count || 0);
            } catch (error) {
                console.error('Error checking interest:', error);
            }
        };

        checkInterest();
    }, [event.id, currentUserId]);

    const organizerName = event.organizer?.[0]?.username || 'Unknown';

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
                <button onClick={onBack} className="bg-white shadow-md p-2 rounded-full text-gray-800 hover:bg-gray-100 transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>
            </header>

            <main className="flex-1 overflow-y-auto pb-28"> {/* Padding for footer */}
                <div className="h-64 w-full">
                    <img className="h-full w-full object-cover" src={event.image_url || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800'} alt={event.title} />
                </div>

                <div className="bg-white p-5 rounded-t-2xl -mt-8 relative z-10 space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{event.title}</h1>
                        <p className="text-sm font-semibold text-blue-600 mt-1">Organized by {organizerName}</p>
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
                        {interestCount > 0 ? (
                            <div className="flex items-center">
                                <p className="text-sm text-slate-500">
                                    <span className="font-bold">{interestCount}</span> {interestCount === 1 ? 'person is' : 'people are'} interested
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">Be the first to show your interest!</p>
                        )}
                    </div>
                </div>
            </main>

            <footer className="absolute bottom-0 left-0 right-0 px-4 pt-4 bg-white border-t border-slate-200 shadow-lg pb-[calc(1rem+env(safe-area-inset-bottom))]">
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