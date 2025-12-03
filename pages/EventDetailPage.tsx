import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Calendar, Clock, MapPin, DollarSign, AlertCircle, User, Camera, Upload, X, Loader2, Crown, Dumbbell, Building2, MessageCircle, Lock, Plus, Minus } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useToast } from '../src/hooks/use-toast';
import EventGroupChat from '../components/EventGroupChat';

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

const LEAVE_REASONS = [
    'Schedule conflict',
    'Found another event',
    'Personal reasons',
    'No longer interested',
    'Other'
];

interface EventDetailPageProps {
    event: any;
    currentUserId: string | null;
    onBack: () => void;
    onJoinEvent: (eventId: string) => void;
}

const EventDetailPage: React.FC<EventDetailPageProps> = ({ event, currentUserId, onBack, onJoinEvent }) => {
    const { toast } = useToast();
    const [hasJoined, setHasJoined] = useState(false);
    const [isOnWaitlist, setIsOnWaitlist] = useState(false);
    const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);
    const [participantCount, setParticipantCount] = useState(0);
    const [waitlistCount, setWaitlistCount] = useState(0);
    const [participants, setParticipants] = useState<any[]>([]);
    const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);
    const [loading, setLoading] = useState(false);
    const [photos, setPhotos] = useState<any[]>([]);
    const [showPhotoUpload, setShowPhotoUpload] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoCaption, setPhotoCaption] = useState('');
    const [isEventEnded, setIsEventEnded] = useState(false);
    const [isOrganizerPremium, setIsOrganizerPremium] = useState(false);
    const [showGroupChat, setShowGroupChat] = useState(false);
    const [currentUserIsPremium, setCurrentUserIsPremium] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [enteredPassword, setEnteredPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [selectedLeaveReason, setSelectedLeaveReason] = useState<string | null>(null);
    const [customLeaveReason, setCustomLeaveReason] = useState('');

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

                // Check if user is on waitlist
                const { data: waitlistEntry } = await supabase
                    .from('event_waitlist')
                    .select('position')
                    .eq('event_id', event.id)
                    .eq('user_id', currentUserId)
                    .maybeSingle();

                setIsOnWaitlist(!!waitlistEntry);
                setWaitlistPosition(waitlistEntry?.position || null);

                // Get all participants with profile data
                const { data: participantsData, error: participantsError } = await supabase
                    .from('event_participants')
                    .select(`
                        user_id,
                        joined_at,
                        profiles!event_participants_user_id_fkey(
                            username,
                            avatar_url,
                            is_premium
                        )
                    `)
                    .eq('event_id', event.id)
                    .order('joined_at', { ascending: false });

                if (participantsError) throw participantsError;

                setParticipants(participantsData || []);
                setParticipantCount(participantsData?.length || 0);

                // Get waitlist count
                const { count: waitlistTotal } = await supabase
                    .from('event_waitlist')
                    .select('*', { count: 'exact', head: true })
                    .eq('event_id', event.id);

                setWaitlistCount(waitlistTotal || 0);

                // Check if registration is still open (6 hours before event)
                const eventDateTime = new Date(`${event.date}T${event.time}`);
                const registrationDeadline = new Date(eventDateTime.getTime() - 6 * 60 * 60 * 1000);
                const now = new Date();
                setIsRegistrationOpen(now < registrationDeadline);
                
                // Check if event has ended
                setIsEventEnded(now > eventDateTime);

                // Fetch event photos
                const { data: photosData, error: photosError } = await supabase
                    .from('event_photos')
                    .select(`
                        id,
                        photo_url,
                        caption,
                        created_at,
                        user_id,
                        profiles!event_photos_user_id_fkey(
                            username,
                            avatar_url
                        )
                    `)
                    .eq('event_id', event.id)
                    .order('created_at', { ascending: false });

                if (photosError) throw photosError;
                setPhotos(photosData || []);

                // Fetch organizer premium status
                if (event.organizer_id) {
                    const { data: organizerProfile } = await supabase
                        .from('profiles')
                        .select('is_premium')
                        .eq('id', event.organizer_id)
                        .single();
                    
                    setIsOrganizerPremium(organizerProfile?.is_premium || false);
                }

                // Fetch current user's premium status
                if (currentUserId) {
                    const { data: userProfile } = await supabase
                        .from('profiles')
                        .select('is_premium')
                        .eq('id', currentUserId)
                        .single();
                    
                    setCurrentUserIsPremium(userProfile?.is_premium || false);
                }
            } catch (error) {
                console.error('Error checking participation:', error);
            }
        };

        checkParticipation();

        // Subscribe to realtime updates for participants and waitlist
        const participantsChannel = supabase
            .channel('event_participants_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'event_participants', filter: `event_id=eq.${event.id}` }, () => {
                checkParticipation();
            })
            .subscribe();

        const waitlistChannel = supabase
            .channel('event_waitlist_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'event_waitlist', filter: `event_id=eq.${event.id}` }, () => {
                checkParticipation();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(participantsChannel);
            supabase.removeChannel(waitlistChannel);
        };
    }, [event.id, event.date, event.time, currentUserId, event.organizer_id]);

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

        // If user wants to leave, show the leave modal first
        if (hasJoined || isOnWaitlist) {
            setShowLeaveModal(true);
            return;
        }

        // If trying to join, check privacy restrictions
        // Check premium_only restriction
        if ((event as any).premium_only && !currentUserIsPremium) {
            toast({
                title: "Premium Only",
                description: "This event is only for premium users.",
                variant: "destructive"
            });
            return;
        }

        // Check password restriction
        if ((event as any).event_password) {
            setShowPasswordModal(true);
            setEnteredPassword('');
            setPasswordError('');
            return;
        }

        await executeJoinLeave();
    };

    const handleConfirmLeave = async () => {
        if (!selectedLeaveReason && !customLeaveReason) {
            toast({
                title: "Please select a reason",
                description: "Choose why you're leaving the event.",
                variant: "destructive"
            });
            return;
        }
        setShowLeaveModal(false);
        await executeJoinLeave();
        setSelectedLeaveReason(null);
        setCustomLeaveReason('');
    };

    const executeJoinLeave = async () => {
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
            } else if (isOnWaitlist) {
                // Leave waitlist
                const { error } = await supabase
                    .from('event_waitlist')
                    .delete()
                    .eq('event_id', event.id)
                    .eq('user_id', currentUserId);

                if (error) throw error;

                setIsOnWaitlist(false);
                setWaitlistPosition(null);
                setWaitlistCount(prev => prev - 1);
                toast({
                    title: "Left waitlist",
                    description: "You have been removed from the waitlist."
                });
            } else {
                // Register for event (handles capacity and waitlist automatically)
                const { data, error } = await supabase.rpc('register_for_event', {
                    _event_id: event.id,
                    _user_id: currentUserId
                });

                if (error) throw error;

                const result = data as { success: boolean; message: string; status: string; waitlist_position?: number };

                if (!result.success) {
                    toast({
                        title: "Registration failed",
                        description: result.message,
                        variant: "destructive"
                    });
                    return;
                }

                if (result.status === 'registered') {
                    setHasJoined(true);
                    setParticipantCount(prev => prev + 1);
                    toast({
                        title: "Registered!",
                        description: "You have successfully registered for this event."
                    });
                    onJoinEvent(event.id);
                } else if (result.status === 'waitlisted') {
                    setIsOnWaitlist(true);
                    setWaitlistPosition(result.waitlist_position || null);
                    setWaitlistCount(prev => prev + 1);
                    toast({
                        title: "Added to waitlist",
                        description: `You are #${result.waitlist_position} on the waitlist. We'll notify you if a spot opens up.`,
                    });
                }
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

    const handlePasswordSubmit = async () => {
        if (enteredPassword === (event as any).event_password) {
            setShowPasswordModal(false);
            setEnteredPassword('');
            await executeJoinLeave();
        } else {
            setPasswordError('Incorrect password');
        }
    };

    const userPhotoCount = photos.filter(p => p.user_id === currentUserId).length;
    const canUploadMore = userPhotoCount < 5;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check if user has reached max photos limit
        if (!canUploadMore) {
            toast({
                title: "Upload limit reached",
                description: "You can only upload up to 5 photos per event.",
                variant: "destructive"
            });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "File too large",
                description: "Maximum file size is 5MB.",
                variant: "destructive"
            });
            return;
        }

        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
            toast({
                title: "Invalid file type",
                description: "Only JPG, PNG, and WEBP images are allowed.",
                variant: "destructive"
            });
            return;
        }

        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setPhotoPreview(e.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleUploadPhoto = async () => {
        if (!selectedFile || !currentUserId) return;

        setUploadingPhoto(true);

        try {
            // Upload to storage
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${currentUserId}/${event.id}/${Date.now()}.${fileExt}`;
            
            const { error: uploadError, data } = await supabase.storage
                .from('event-photos')
                .upload(fileName, selectedFile);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('event-photos')
                .getPublicUrl(fileName);

            // Save to database
            const { error: dbError } = await supabase
                .from('event_photos')
                .insert({
                    event_id: event.id,
                    user_id: currentUserId,
                    photo_url: publicUrl,
                    caption: photoCaption || null
                });

            if (dbError) throw dbError;

            toast({
                title: "Photo uploaded!",
                description: "Your photo has been added to the event gallery."
            });

            // Refresh photos
            const { data: photosData } = await supabase
                .from('event_photos')
                .select(`
                    id,
                    photo_url,
                    caption,
                    created_at,
                    user_id,
                    profiles!event_photos_user_id_fkey(
                        username,
                        avatar_url
                    )
                `)
                .eq('event_id', event.id)
                .order('created_at', { ascending: false });

            setPhotos(photosData || []);
            setShowPhotoUpload(false);
            setSelectedFile(null);
            setPhotoPreview(null);
            setPhotoCaption('');
        } catch (error: any) {
            toast({
                title: "Upload failed",
                description: error.message || "Failed to upload photo.",
                variant: "destructive"
            });
        } finally {
            setUploadingPhoto(false);
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

            <main className="flex-1 overflow-y-auto pb-[calc(10rem+env(safe-area-inset-bottom))]">
                <div className="h-64 w-full">
                    <img className="h-full w-full object-cover" src={event.image_url || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800'} alt={event.title} />
                </div>

                <div className="bg-card p-5 rounded-t-2xl -mt-8 relative z-10 space-y-6">
                    <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            {event.event_type && event.event_type !== 'general' && (
                                <span className="inline-flex items-center bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-lg">
                                    {getEventTypeLabel(event.event_type)}
                                </span>
                            )}
                            {event.sport_category && (
                                <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold px-2 py-1 rounded-lg">
                                    <Dumbbell className="w-3 h-3" />
                                    {event.sport_category}
                                </span>
                            )}
                            {event.district && (
                                <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold px-2 py-1 rounded-lg">
                                    <Building2 className="w-3 h-3" />
                                    {event.district}
                                </span>
                            )}
                            {(event as any).premium_only && (
                                <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold px-2 py-1 rounded-lg">
                                    <Crown className="w-3 h-3" />
                                    Premium Only
                                </span>
                            )}
                            {(event as any).event_password && (
                                <span className="inline-flex items-center gap-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold px-2 py-1 rounded-lg">
                                    <Lock className="w-3 h-3" />
                                    Password Protected
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">{event.title}</h1>
                        <p className="text-sm font-semibold text-primary mt-1 flex items-center gap-1.5">
                            Organized by {organizerName}
                            {isOrganizerPremium && (
                                <Crown className="w-4 h-4 text-primary" />
                            )}
                        </p>
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
                        
                        {/* Capacity progress bar */}
                        {event.max_participants && (
                            <div className="mb-4">
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-300 ${
                                            participantCount >= event.max_participants 
                                                ? 'bg-orange-500' 
                                                : 'bg-primary'
                                        }`}
                                        style={{ width: `${Math.min((participantCount / event.max_participants) * 100, 100)}%` }}
                                    />
                                </div>
                                {waitlistCount > 0 && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {waitlistCount} {waitlistCount === 1 ? 'person' : 'people'} on waitlist
                                    </p>
                                )}
                            </div>
                        )}
                        
                        {/* Waitlist status for current user */}
                        {isOnWaitlist && waitlistPosition && (
                            <div className="bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-400 p-3 rounded-lg mb-4">
                                <p className="font-semibold text-sm">You're on the waitlist</p>
                                <p className="text-xs mt-0.5">Position #{waitlistPosition} - We'll notify you if a spot opens up!</p>
                            </div>
                        )}
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
                                        <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                                            {participant.profiles?.username || 'Unknown'}
                                            {participant.profiles?.is_premium && (
                                                <Crown className="w-3.5 h-3.5 text-primary" />
                                            )}
                                        </span>
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

                    {/* Group Chat Button - Only for participants */}
                    {(hasJoined || event.organizer_id === currentUserId) && (
                        <button
                            onClick={() => setShowGroupChat(true)}
                            className="w-full flex items-center justify-center gap-2 p-4 bg-muted hover:bg-muted/80 rounded-xl border border-border transition-colors"
                        >
                            <MessageCircle className="w-5 h-5 text-primary" />
                            <span className="font-semibold text-foreground">Open Group Chat</span>
                        </button>
                    )}

                    {/* Event Photos Gallery */}
                    {isEventEnded && (
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center text-lg font-bold text-foreground">
                                    <Camera className="w-5 h-5 mr-2" />
                                    <h2>Event Photos</h2>
                                </div>
                                {hasJoined && canUploadMore && (
                                    <button
                                        onClick={() => setShowPhotoUpload(true)}
                                        className="text-sm text-primary font-semibold hover:underline flex items-center gap-1"
                                    >
                                        <Upload className="w-4 h-4" />
                                        Upload ({5 - userPhotoCount} left)
                                    </button>
                                )}
                                {hasJoined && !canUploadMore && (
                                    <span className="text-xs text-muted-foreground">Max 5 photos reached</span>
                                )}
                            </div>
                            {photos.length > 0 ? (
                                <div className="grid grid-cols-2 gap-2">
                                    {photos.map((photo) => (
                                        <div key={photo.id} className="relative group">
                                            <img 
                                                src={photo.photo_url} 
                                                alt={photo.caption || 'Event photo'}
                                                className="w-full h-48 object-cover rounded-lg"
                                            />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg p-2 flex flex-col justify-end">
                                                <p className="text-white text-xs font-medium">{photo.profiles?.username || 'Unknown'}</p>
                                                {photo.caption && (
                                                    <p className="text-white text-xs mt-1">{photo.caption}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-muted rounded-lg">
                                    <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">No photos yet. Be the first to share!</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Group Chat Modal */}
            {currentUserId && (
                <EventGroupChat
                    eventId={event.id}
                    currentUserId={currentUserId}
                    isOpen={showGroupChat}
                    onClose={() => setShowGroupChat(false)}
                />
            )}

            {/* Photo Upload Modal */}
            {showPhotoUpload && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPhotoUpload(false)}>
                    <div className="bg-card rounded-lg w-full max-w-md overflow-hidden shadow-lg" onClick={e => e.stopPropagation()}>
                        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-foreground">Upload Photo</h2>
                                <p className="text-xs text-muted-foreground">{userPhotoCount}/5 photos uploaded</p>
                            </div>
                            <button onClick={() => setShowPhotoUpload(false)} className="p-2 -mr-2 rounded-lg hover:bg-muted transition-colors">
                                <X className="w-5 h-5 text-foreground" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            {!photoPreview ? (
                                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                    <Upload className="w-12 h-12 text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground mb-1">Click to upload photo</p>
                                    <p className="text-xs text-muted-foreground">JPG, PNG, WEBP • Max 5MB • {5 - userPhotoCount} remaining</p>
                                    <input 
                                        type="file" 
                                        accept="image/jpeg,image/jpg,image/png,image/webp" 
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                </label>
                            ) : (
                                <div className="relative">
                                    <img src={photoPreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                                    <button
                                        onClick={() => {
                                            setSelectedFile(null);
                                            setPhotoPreview(null);
                                        }}
                                        className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Caption (optional)</label>
                                <input
                                    type="text"
                                    value={photoCaption}
                                    onChange={(e) => setPhotoCaption(e.target.value)}
                                    placeholder="Add a caption..."
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                                    maxLength={200}
                                />
                            </div>
                        </div>
                        <div className="px-4 py-3 bg-muted/30 border-t border-border">
                            <button
                                onClick={handleUploadPhoto}
                                disabled={!selectedFile || uploadingPhoto}
                                className="w-full bg-primary text-primary-foreground text-sm font-semibold py-2.5 rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {uploadingPhoto ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        Upload Photo
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Join/Leave Button - Right Side */}
            <button 
                onClick={handleJoinLeave}
                disabled={loading || !isRegistrationOpen}
                className={`fixed right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                    hasJoined || isOnWaitlist
                        ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
                title={hasJoined ? 'Leave Event' : isOnWaitlist ? 'Leave Waitlist' : 'Join Event'}
            >
                {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : hasJoined || isOnWaitlist ? (
                    <Minus className="w-6 h-6" />
                ) : (
                    <Plus className="w-6 h-6" />
                )}
            </button>

            {/* Leave Reason Modal */}
            {showLeaveModal && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-end justify-center sm:items-center p-4" onClick={() => setShowLeaveModal(false)}>
                    <div className="bg-card rounded-t-2xl sm:rounded-2xl w-full max-w-sm overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
                        <div className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                                        <Minus className="w-5 h-5 text-destructive" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-foreground">Leave Event</h2>
                                        <p className="text-xs text-muted-foreground">Tell us why you're leaving</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowLeaveModal(false)}
                                    className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"
                                >
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>
                            
                            <div className="space-y-2">
                                {LEAVE_REASONS.map((reason) => (
                                    <button
                                        key={reason}
                                        onClick={() => {
                                            setSelectedLeaveReason(reason);
                                            if (reason !== 'Other') setCustomLeaveReason('');
                                        }}
                                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                            selectedLeaveReason === reason
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted text-foreground hover:bg-muted/80'
                                        }`}
                                    >
                                        {reason}
                                    </button>
                                ))}
                            </div>
                            
                            {selectedLeaveReason === 'Other' && (
                                <textarea
                                    value={customLeaveReason}
                                    onChange={(e) => setCustomLeaveReason(e.target.value)}
                                    placeholder="Please specify..."
                                    className="w-full mt-3 px-4 py-3 bg-muted rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
                                    rows={2}
                                    autoFocus
                                />
                            )}
                        </div>
                        
                        <div className="px-5 py-4 bg-muted/30 border-t border-border flex gap-2">
                            <button
                                onClick={() => {
                                    setShowLeaveModal(false);
                                    setSelectedLeaveReason(null);
                                    setCustomLeaveReason('');
                                }}
                                className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-muted-foreground hover:bg-muted transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmLeave}
                                disabled={!selectedLeaveReason || (selectedLeaveReason === 'Other' && !customLeaveReason.trim())}
                                className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Leave
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setShowPasswordModal(false)}>
                    <div className="bg-card rounded-2xl w-full max-w-sm overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
                        <div className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Lock className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-foreground">Protected Event</h2>
                                        <p className="text-xs text-muted-foreground">Password required to join</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowPasswordModal(false)}
                                    className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"
                                >
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-4">
                                Enter the event password to join.
                            </p>
                            
                            <input
                                type="password"
                                value={enteredPassword}
                                onChange={(e) => {
                                    setEnteredPassword(e.target.value);
                                    setPasswordError('');
                                }}
                                onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                                placeholder="Enter password"
                                className={`w-full px-4 py-3 bg-muted rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                                    passwordError ? 'ring-2 ring-destructive' : ''
                                }`}
                                autoFocus
                            />
                            {passwordError && (
                                <p className="text-xs text-destructive mt-2">{passwordError}</p>
                            )}
                        </div>
                        
                        <div className="px-5 py-4 bg-muted/30 border-t border-border flex gap-2">
                            <button
                                onClick={() => setShowPasswordModal(false)}
                                className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-muted-foreground hover:bg-muted transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePasswordSubmit}
                                disabled={!enteredPassword}
                                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Join Event
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventDetailPage;
