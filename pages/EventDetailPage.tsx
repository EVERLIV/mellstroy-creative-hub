import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Calendar, Clock, MapPin, DollarSign, AlertCircle, User, Camera, Upload, X, Loader2 } from 'lucide-react';
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
    const [photos, setPhotos] = useState<any[]>([]);
    const [showPhotoUpload, setShowPhotoUpload] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoCaption, setPhotoCaption] = useState('');
    const [isEventEnded, setIsEventEnded] = useState(false);

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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

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

                    {/* Event Photos Gallery */}
                    {isEventEnded && (
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center text-lg font-bold text-foreground">
                                    <Camera className="w-5 h-5 mr-2" />
                                    <h2>Event Photos</h2>
                                </div>
                                {hasJoined && (
                                    <button
                                        onClick={() => setShowPhotoUpload(true)}
                                        className="text-sm text-primary font-semibold hover:underline flex items-center gap-1"
                                    >
                                        <Upload className="w-4 h-4" />
                                        Upload
                                    </button>
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

            {/* Photo Upload Modal */}
            {showPhotoUpload && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPhotoUpload(false)}>
                    <div className="bg-card rounded-lg w-full max-w-md overflow-hidden shadow-lg" onClick={e => e.stopPropagation()}>
                        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                            <h2 className="text-base font-bold text-foreground">Upload Photo</h2>
                            <button onClick={() => setShowPhotoUpload(false)} className="p-2 -mr-2 rounded-lg hover:bg-muted transition-colors">
                                <X className="w-5 h-5 text-foreground" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            {!photoPreview ? (
                                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                    <Upload className="w-12 h-12 text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground mb-1">Click to upload photo</p>
                                    <p className="text-xs text-muted-foreground">JPG, PNG, WEBP (max 5MB)</p>
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
