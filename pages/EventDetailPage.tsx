import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Calendar, Clock, MapPin, DollarSign, AlertCircle, User } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useToast } from '../src/hooks/use-toast';

const InfoItem: React.FC<{ icon: React.FC<any>, label: string, value: string }> = ({ icon: Icon, label, value }) => (
    <div className="flex items-center">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mr-3 flex-shrink-0">
            <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="font-semibold text-foreground text-sm leading-tight">{value}</p>
        </div>
    </div>
);

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

interface EventDetailPageProps {
    event: any;
    currentUserId: string | null;
    onBack: () => void;
    onJoinEvent: (eventId: string) => void;
}

const EventDetailPage: React.FC<EventDetailPageProps> = ({ event, currentUserId, onBack, onJoinEvent }) => {
    const { toast } = useToast();
    const [hasJoined, setHasJoined] = useState(false);
    const [participantCount, setParticipantCount] = useState(0);
    const [participants, setParticipants] = useState<any[]>([]);
    const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const checkParticipation = async () => {
            if (!currentUserId) return;

            try {
                // Check if user has joined
                const { data: participation } = await supabase
                    .from('event_participants')
                    .select()
                    .eq('event_id', event.id)
                    .eq('user_id', currentUserId)
                    .maybeSingle();

                setHasJoined(!!participation);

                // Get all participants with profile data
                const { data: participantsData, error: participantsError } = await supabase
                    .from('event_participants')
                    .select(`
                        user_id,
                        joined_at,
                        profiles!event_participants_user_id_fkey(
                            username,
                            avatar_url
                        )
                    `)
                    .eq('event_id', event.id)
                    .order('joined_at', { ascending: false });

                if (participantsError) throw participantsError;

                setParticipants(participantsData || []);
                setParticipantCount(participantsData?.length || 0);

                // Check if registration is still open (6 hours before event)
                const eventDateTime = new Date(`${event.date}T${event.time}`);
                const registrationDeadline = new Date(eventDateTime.getTime() - 6 * 60 * 60 * 1000);
                const now = new Date();
                setIsRegistrationOpen(now < registrationDeadline);
            } catch (error) {
                console.error('Error checking participation:', error);
            }
        };

        checkParticipation();
    }, [event.id, event.date, event.time, currentUserId]);

    const handleJoinLeave = async () => {
        if (!currentUserId) {
            toast({
                title: "Login required",
                description: "Please log in to join events.",
                variant: "destructive"
            });
            return;
        }

        if (!isRegistrationOpen) {
            toast({
                title: "Registration closed",
                description: "Registration closes 6 hours before the event.",
                variant: "destructive"
            });
            return;
        }

        // Check if event is full
        if (event.max_participants && participantCount >= event.max_participants && !hasJoined) {
            toast({
                title: "Event full",
                description: "This event has reached maximum capacity.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);

        try {
            if (hasJoined) {
                // Leave event
                const { error } = await supabase
                    .from('event_participants')
                    .delete()
                    .eq('event_id', event.id)
                    .eq('user_id', currentUserId);

                if (error) throw error;

                setHasJoined(false);
                setParticipantCount(prev => prev - 1);
                toast({
                    title: "Left event",
                    description: "You have left this event."
                });
            } else {
                // Join event
                const { error } = await supabase
                    .from('event_participants')
                    .insert({
                        event_id: event.id,
                        user_id: currentUserId
                    });

                if (error) throw error;

                setHasJoined(true);
                setParticipantCount(prev => prev + 1);
                toast({
                    title: "Joined event!",
                    description: "You have successfully joined this event."
                });
                onJoinEvent(event.id);
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update participation.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const organizerName = event.organizer?.[0]?.username || 'Unknown';
    const isFree = !event.price || event.price === 0;

    const formatDateTime = () => {
        const date = new Date(event.date + 'T' + event.time);
        return {
            date: date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        };
    };
    
    const { date, time } = formatDateTime();

    return (
        <div className="h-full w-full bg-background flex flex-col relative">
            <header className="absolute top-0 left-0 right-0 z-20 p-4">
                <button onClick={onBack} className="bg-card border border-border shadow-md p-2 rounded-full text-foreground hover:bg-muted transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>
            </header>

            <main className="flex-1 overflow-y-auto pb-28">
                <div className="h-64 w-full">
                    <img className="h-full w-full object-cover" src={event.image_url || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800'} alt={event.title} />
                </div>

                <div className="bg-card p-5 rounded-t-2xl -mt-8 relative z-10 space-y-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            {event.event_type && event.event_type !== 'general' && (
                                <span className="inline-flex items-center bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-lg">
                                    {getEventTypeLabel(event.event_type)}
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">{event.title}</h1>
                        <p className="text-sm font-semibold text-primary mt-1">Organized by {organizerName}</p>
                    </div>

                    {!isRegistrationOpen && (
                        <div className="bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-400 p-3 rounded-lg flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-sm">Registration Closed</p>
                                <p className="text-xs mt-0.5">Registration closes 6 hours before the event starts.</p>
                            </div>
                        </div>
                    )}

                    <div className="bg-muted p-4 rounded-2xl border border-border space-y-4">
                        <InfoItem icon={Calendar} label="Date" value={date} />
                        <InfoItem icon={Clock} label="Time" value={time} />
                        <InfoItem icon={MapPin} label="Location" value={event.location} />
                        {!isFree && (
                            <InfoItem 
                                icon={DollarSign} 
                                label="Price" 
                                value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(event.price).replace(/\s/g, '')}
                            />
                        )}
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-foreground mb-2">About this event</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{event.description}</p>
                    </div>
                    
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center text-lg font-bold text-foreground">
                                <Users className="w-5 h-5 mr-2" />
                                <h2>Participants</h2>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                <span className="font-bold text-foreground">{participantCount}</span>
                                {event.max_participants && <span> / {event.max_participants}</span>}
                                {event.max_participants && participantCount >= event.max_participants && (
                                    <span className="ml-2 text-orange-600 font-semibold">FULL</span>
                                )}
                            </div>
                        </div>
                        {participants.length > 0 ? (
                            <div className="space-y-2">
                                {participants.slice(0, 5).map((participant, index) => (
                                    <div key={index} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {participant.profiles?.avatar_url ? (
                                                <img src={participant.profiles.avatar_url} alt={participant.profiles.username} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-5 h-5 text-primary" />
                                            )}
                                        </div>
                                        <span className="text-sm font-medium text-foreground">{participant.profiles?.username || 'Unknown'}</span>
                                    </div>
                                ))}
                                {participants.length > 5 && (
                                    <p className="text-xs text-muted-foreground text-center pt-2">
                                        + {participants.length - 5} more participants
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Be the first to join this event!</p>
                        )}
                    </div>
                </div>
            </main>

            <footer className="absolute bottom-0 left-0 right-0 px-4 pt-4 bg-card border-t border-border shadow-lg pb-[calc(1rem+env(safe-area-inset-bottom))]">
                 <button 
                    onClick={handleJoinLeave}
                    disabled={loading || (!hasJoined && !isRegistrationOpen) || (!hasJoined && event.max_participants && participantCount >= event.max_participants)}
                    className={`w-full flex items-center justify-center font-bold py-3.5 px-4 rounded-xl transition-all duration-300 text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                    ${hasJoined 
                        ? 'bg-card text-foreground border-2 border-border hover:bg-muted'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                >
                    <Users className={`w-5 h-5 mr-2 transition-all`} />
                    {loading ? 'Loading...' : hasJoined ? "Leave Event" : "Join Event"}
                </button>
            </footer>
        </div>
    );
};

export default EventDetailPage;
