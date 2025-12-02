import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../src/integrations/supabase/client';
import { useToast } from '../src/hooks/use-toast';
import { Crown, Lock, X, Key } from 'lucide-react';
import EventsPage from './EventsPage';
import EventDetailPage from './EventDetailPage';
import CreateEventPage from './CreateEventPage';

interface EventsFlowPageProps {
    onBack: () => void;
    initialEvent?: any | null;
}

const EventsFlowPage: React.FC<EventsFlowPageProps> = ({ onBack, initialEvent }) => {
    const location = useLocation();
    const { toast } = useToast();
    const [view, setView] = useState<'list' | 'detail' | 'create'>('list');
    const [selectedEvent, setSelectedEvent] = useState<any | null>(initialEvent || null);
    const [isExiting, setIsExiting] = useState(false);
    const [events, setEvents] = useState<any[]>([]);
    const [isPremium, setIsPremium] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [userEventPassword, setUserEventPassword] = useState<string | null>(null);

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

                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('is_premium, event_password')
                    .eq('id', user.id)
                    .single();

                setIsPremium(profileData?.is_premium || false);
                setUserEventPassword((profileData as any)?.event_password || null);

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
        if (!isPremium) {
            toast({
                title: "Premium Required",
                description: "Only premium users can create events.",
                variant: "destructive"
            });
            return;
        }
        
        if (!userEventPassword) {
            // User needs to set a password first
            setShowSetPasswordModal(true);
            setNewPassword('');
            setConfirmPassword('');
            setPasswordError('');
        } else {
            // User has a password, verify it
            setShowPasswordModal(true);
            setPassword('');
            setPasswordError('');
        }
    };

    const handlePasswordSubmit = () => {
        if (password === userEventPassword) {
            setShowPasswordModal(false);
            setPassword('');
            setView('create');
        } else {
            setPasswordError('Incorrect password');
        }
    };

    const handleSetPassword = async () => {
        if (newPassword.length < 4) {
            setPasswordError('Password must be at least 4 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }
        
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ event_password: newPassword } as any)
                .eq('id', currentUserId);
                
            if (error) throw error;
            
            setUserEventPassword(newPassword);
            setShowSetPasswordModal(false);
            setView('create');
            toast({
                title: "Password Set",
                description: "Your event creation password has been saved."
            });
        } catch (error) {
            console.error('Error setting password:', error);
            setPasswordError('Failed to save password');
        }
    };

    const handleCreateSuccess = async () => {
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
                                        <h2 className="text-lg font-bold text-foreground">Create Event</h2>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Crown className="w-3 h-3 text-primary" />
                                            Premium Feature
                                        </p>
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
                                Enter your event creation password to continue.
                            </p>
                            
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setPasswordError('');
                                }}
                                onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                                placeholder="Enter your password"
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
                                disabled={!password}
                                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Set Password Modal */}
            {showSetPasswordModal && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setShowSetPasswordModal(false)}>
                    <div className="bg-card rounded-2xl w-full max-w-sm overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
                        <div className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Key className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-foreground">Set Password</h2>
                                        <p className="text-xs text-muted-foreground">
                                            Create your event password
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowSetPasswordModal(false)}
                                    className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"
                                >
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-4">
                                Set a password to secure your event creation. You'll need this password each time you create an event.
                            </p>
                            
                            <div className="space-y-3">
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => {
                                        setNewPassword(e.target.value);
                                        setPasswordError('');
                                    }}
                                    placeholder="New password"
                                    className="w-full px-4 py-3 bg-muted rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    autoFocus
                                />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        setPasswordError('');
                                    }}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSetPassword()}
                                    placeholder="Confirm password"
                                    className={`w-full px-4 py-3 bg-muted rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                                        passwordError ? 'ring-2 ring-destructive' : ''
                                    }`}
                                />
                            </div>
                            {passwordError && (
                                <p className="text-xs text-destructive mt-2">{passwordError}</p>
                            )}
                        </div>
                        
                        <div className="px-5 py-4 bg-muted/30 border-t border-border flex gap-2">
                            <button
                                onClick={() => setShowSetPasswordModal(false)}
                                className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-muted-foreground hover:bg-muted transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSetPassword}
                                disabled={!newPassword || !confirmPassword}
                                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Set Password
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventsFlowPage;
