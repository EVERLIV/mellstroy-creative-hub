import React, { useState, useEffect } from 'react';
import { Trainer, Class, Booking, UserRole } from '../types';
import { X, Calendar, MapPin, QrCode, CheckCircle, Clock, MessageCircle, Star } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../src/hooks/use-toast';
import BookingVerificationDisplay from '../components/BookingVerificationDisplay';
import VerifyAttendanceModal from '../components/VerifyAttendanceModal';
import BookingCardSkeleton from '../components/BookingCardSkeleton';
import BookingsPageSkeleton from '../components/BookingsPageSkeleton';
import { usePullToRefresh } from '../src/hooks/usePullToRefresh';
import PullToRefreshIndicator from '../components/PullToRefreshIndicator';
import EmptyBookingsState from '../components/EmptyBookingsState';
import CancelBookingModal from '../components/CancelBookingModal';
import ReviewModal from '../components/ReviewModal';

// Extended interfaces for this page
interface BookingData {
    id: string;
    date: string;
    time: string;
    userId: string;
    trainerId: string;
    classId: string;
    status: 'booked' | 'attended' | 'cancelled';
    hasReview: boolean;
    verificationCode?: string;
    createdAt?: string;
}

interface ClassData {
    id: string;
    name: string;
    description: string;
    duration: number;
    price: number;
    schedule?: { days: string[]; time: string };
}

interface TrainerData {
    id: string;
    name: string;
    avatarUrl: string;
    location: string;
    rating: number;
}

type BookingInfo = { trainer: TrainerData; cls: ClassData; booking: BookingData; student?: TrainerData };

interface BookedClassCardProps {
    bookingInfo: BookingInfo;
    onOpenChat: (personToChatWith: TrainerData, context: { classId: string; className: string; bookingDate: string; studentId: string; }) => void;
    onStartCancellation: (bookingInfo: BookingInfo) => void;
    onOpenReviewModal: (trainer: TrainerData, cls: ClassData, booking: BookingData) => void;
    userRole: UserRole;
    onShowVerificationCode?: (code: string, bookingId: string) => void;
    onVerifyAttendance?: () => void;
}

const BookedClassCard: React.FC<BookedClassCardProps> = ({ 
    bookingInfo, 
    onOpenChat, 
    onStartCancellation, 
    onOpenReviewModal, 
    userRole,
    onShowVerificationCode,
    onVerifyAttendance 
}) => {
    const { trainer, cls, booking, student } = bookingInfo;
    const isStudentView = userRole === 'student';
    const displayPerson = isStudentView ? trainer : student;
    const [showProfileModal, setShowProfileModal] = useState(false);
    const navigate = useNavigate();

    const handleChatClick = () => {
        if (isStudentView && trainer) {
            onOpenChat(trainer, { classId: cls.id, className: cls.name, bookingDate: booking.date, studentId: booking.userId });
        } else if (!isStudentView && student) {
            onOpenChat(student, { classId: cls.id, className: cls.name, bookingDate: booking.date, studentId: student.id });
        }
    };
    
    return (
        <>
            <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                <div className="p-3">
                {/* Status Badge */}
                {booking.status === 'attended' && (
                    <div className="mb-3 inline-flex items-center bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        Verified
                    </div>
                )}
                {booking.status === 'closed' && (
                    <div className="mb-3 inline-flex items-center bg-muted text-muted-foreground text-xs font-bold px-2.5 py-1 rounded-full">
                        <X className="w-3.5 h-3.5 mr-1" />
                        Closed
                    </div>
                )}

                    {/* Class Name & Person */}
                    <div className="mb-3">
                        <h3 className="text-sm font-bold text-foreground">{cls.name}</h3>
                        <button 
                            onClick={() => setShowProfileModal(true)}
                            className="text-xs text-primary hover:underline mt-1 text-left"
                        >
                            {isStudentView ? `Trainer: ${trainer?.name || 'N/A'}` : `Student: ${student?.name || 'N/A'}`}
                        </button>
                    </div>

                {/* Date & Time & Location */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-3">
                    <div className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="ml-1 text-xs text-foreground">{booking.date}</span>
                    </div>
                    <div className="flex items-center">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="ml-1 text-xs text-foreground">{booking.time}</span>
                    </div>
                    {displayPerson?.location && (
                        <div className="flex items-center">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="ml-1 text-xs text-foreground">{displayPerson.location}</span>
                        </div>
                    )}
                </div>

                {/* Booking Details */}
                <div className="mb-3 p-2 bg-muted rounded-lg space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Booking ID:</span>
                        <span className="text-foreground font-mono font-semibold">{(booking.id.slice(0, 2) + booking.id.slice(9, 11) + booking.id.slice(14, 15)).toUpperCase()}</span>
                    </div>
                    {booking.createdAt && (
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Booked on:</span>
                            <span className="text-foreground">{booking.createdAt}</span>
                        </div>
                    )}
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="text-foreground">{cls.duration} minutes</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">Price:</span>
                        <span className="text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(cls.price).replace(/\s/g, '')}</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-border">
                    <button 
                        onClick={handleChatClick}
                        className="flex-1 bg-secondary text-secondary-foreground text-xs font-semibold py-2.5 px-3 rounded-lg hover:bg-secondary/80 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5"
                    >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Chat
                    </button>
                    
                    {isStudentView ? (
                        <>
                            {booking.status === 'booked' && (
                                <>
                                    <button 
                                        onClick={() => onStartCancellation(bookingInfo)}
                                        className="flex-1 bg-secondary text-secondary-foreground text-xs font-semibold py-2.5 px-3 rounded-lg hover:bg-secondary/80 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                        Cancel
                                    </button>
                                    {booking.verificationCode && (
                                        <button 
                                            onClick={() => onShowVerificationCode?.(booking.verificationCode!, booking.id)}
                                            className="bg-accent/10 text-accent-foreground text-xs font-semibold py-2.5 px-3 rounded-lg hover:bg-accent/20 active:scale-95 transition-all duration-200 flex items-center justify-center"
                                        >
                                            <QrCode className="w-4 h-4" />
                                        </button>
                                    )}
                                </>
                            )}
                            {booking.status === 'attended' && !booking.hasReview && (
                                <button 
                                    onClick={() => onOpenReviewModal(trainer, cls, booking)}
                                    className="flex-1 bg-primary text-primary-foreground text-xs font-semibold py-2.5 px-3 rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5"
                                >
                                    <Star className="w-3.5 h-3.5" />
                                    Leave Review
                                </button>
                            )}
                        </>
                    ) : (
                        booking.status === 'booked' && onVerifyAttendance && (
                            <button 
                                onClick={onVerifyAttendance}
                                className="flex-1 bg-primary text-primary-foreground text-xs font-semibold py-2.5 px-3 rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-200"
                            >
                                Verify
                            </button>
                        )
                    )}
                </div>
            </div>
        </div>

        {/* Profile Modal */}
        {showProfileModal && displayPerson && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 pb-20" onClick={() => setShowProfileModal(false)}>
                <div className="bg-card rounded-lg w-full max-w-md overflow-hidden shadow-lg" onClick={e => e.stopPropagation()}>
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                        <h2 className="text-base font-bold text-foreground">Profile</h2>
                        <button onClick={() => setShowProfileModal(false)} className="p-2 -mr-2 rounded-lg hover:bg-muted transition-colors">
                            <X className="w-5 h-5 text-foreground" />
                        </button>
                    </div>
                    <div className="p-4">
                        {/* Profile Image */}
                        <div className="flex flex-col items-center mb-4">
                            <img 
                                src={displayPerson.avatarUrl || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200'} 
                                alt={displayPerson.name}
                                className="w-24 h-24 rounded-full object-cover border-4 border-border mb-3"
                            />
                            <h3 className="text-lg font-bold text-foreground">{displayPerson.name}</h3>
                        </div>

                        {/* Profile Info */}
                        <div className="space-y-3">
                            {displayPerson.location && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm text-foreground">{displayPerson.location}</span>
                                </div>
                            )}
                            {displayPerson.rating && (
                                <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                    <span className="text-sm text-foreground">Rating: {displayPerson.rating.toFixed(1)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="px-4 py-3 bg-muted/30 border-t border-border space-y-2">
                        <button 
                            onClick={() => {
                                setShowProfileModal(false);
                                if (isStudentView && trainer) {
                                    navigate(`/trainer/${trainer.id}`);
                                }
                            }}
                            className="w-full bg-primary text-primary-foreground text-sm font-semibold py-2.5 rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-200"
                        >
                            View Full Profile
                        </button>
                        <button 
                            onClick={handleChatClick}
                            className="w-full bg-card border border-border text-foreground text-sm font-semibold py-2.5 rounded-lg hover:bg-muted/50 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <MessageCircle className="w-4 h-4" />
                            Send Message
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

const monthMap: { [key: string]: number } = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
};

function parseBookingDateTime(dateStr: string, timeStr: string): Date {
    const parts = dateStr.split(' ');
    const day = parseInt(parts[1], 10);
    const month = monthMap[parts[0]];
    const year = parseInt(parts[2], 10);

    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date(year, month, day, hours, minutes, 0, 0);
    return date;
}

const MyBookingsPage: React.FC = () => {
    const { user, userRole, loading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
    const [verificationCode, setVerificationCode] = useState<string | null>(null);
    const [verificationBookingId, setVerificationBookingId] = useState<string | null>(null);
    const [showVerifyModal, setShowVerifyModal] = useState<BookingInfo | null>(null);
    const [bookingsData, setBookingsData] = useState<BookingInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [reviewModalData, setReviewModalData] = useState<{ trainer: TrainerData; cls: ClassData; booking: BookingData } | null>(null);

    // Pull-to-refresh functionality
    const { containerRef, pullDistance, isRefreshing, pullProgress } = usePullToRefresh({
        onRefresh: async () => {
            await loadBookings();
        }
    });

    const checkAndCloseExpiredBookings = async () => {
        if (!user) return;
        
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        // Get all booked (not verified) bookings
        const { data: expiredBookings, error } = await supabase
            .from('bookings')
            .select('id, booking_date, booking_time')
            .eq('status', 'booked')
            .lte('booking_date', twentyFourHoursAgo.toISOString().split('T')[0]);
        
        if (error || !expiredBookings || expiredBookings.length === 0) return;
        
        // Update expired bookings to closed
        const bookingIdsToClose = expiredBookings
            .filter(booking => {
                const bookingDateTime = parseBookingDateTime(booking.booking_date, booking.booking_time);
                return bookingDateTime < twentyFourHoursAgo;
            })
            .map(b => b.id);
        
        if (bookingIdsToClose.length > 0) {
            await supabase
                .from('bookings')
                .update({ status: 'closed' })
                .in('id', bookingIdsToClose);
        }
    };

    const loadBookings = async () => {
        if (!user || !userRole) return;
        
        // Check and close expired bookings first
        await checkAndCloseExpiredBookings();
        
        setIsLoading(true);
        try {
            let query;
            
            if (userRole === 'student') {
                query = supabase
                    .from('bookings')
                    .select(`
                        id,
                        booking_date,
                        booking_time,
                        status,
                        has_left_review,
                        verification_code,
                        created_at,
                        class_id,
                        classes!inner(
                            id,
                            name,
                            description,
                            class_type,
                            duration_minutes,
                            price,
                            schedule_days,
                            schedule_time,
                            trainer_id,
                            profiles!inner(
                                id,
                                username,
                                avatar_url,
                                location,
                                rating
                            )
                        )
                    `)
                    .eq('client_id', user.id)
                    .order('booking_date', { ascending: false });
            } else {
                query = supabase
                    .from('bookings')
                    .select(`
                        id,
                        booking_date,
                        booking_time,
                        status,
                        has_left_review,
                        verification_code,
                        created_at,
                        client_id,
                        class_id,
                        classes!inner(
                            id,
                            name,
                            description,
                            class_type,
                            duration_minutes,
                            price,
                            schedule_days,
                            schedule_time,
                            trainer_id
                        ),
                        profiles!bookings_client_id_fkey(
                            id,
                            username,
                            avatar_url
                        )
                    `)
                    .eq('classes.trainer_id', user.id)
                    .order('booking_date', { ascending: false });
            }

            const { data, error } = await query;

            if (error) throw error;

            if (data) {
                const formattedBookings: BookingInfo[] = data.map((item: any) => {
                    const classData = item.classes;
                    const booking: BookingData = {
                        id: item.id,
                        userId: userRole === 'student' ? user.id : item.client_id,
                        trainerId: classData.trainer_id,
                        classId: classData.id,
                        date: new Date(item.booking_date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                        }),
                        time: item.booking_time,
                        status: item.status || 'booked',
                        hasReview: item.has_left_review || false,
                        verificationCode: item.verification_code,
                        createdAt: item.created_at ? new Date(item.created_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }) : undefined
                    };

                    const cls: ClassData = {
                        id: classData.id,
                        name: classData.name,
                        description: classData.description || '',
                        duration: classData.duration_minutes,
                        price: classData.price,
                        schedule: {
                            days: classData.schedule_days || [],
                            time: classData.schedule_time || ''
                        }
                    };

                    if (userRole === 'student') {
                        const trainerProfile = classData.profiles;
                        const trainer: TrainerData = {
                            id: trainerProfile.id,
                            name: trainerProfile.username,
                            avatarUrl: trainerProfile.avatar_url || '',
                            location: trainerProfile.location || '',
                            rating: trainerProfile.rating || 0
                        };

                        return { trainer, cls, booking };
                    } else {
                        const studentProfile = item.profiles;
                        const student: TrainerData = {
                            id: studentProfile.id,
                            name: studentProfile.username,
                            avatarUrl: studentProfile.avatar_url || '',
                            location: '',
                            rating: 0
                        };

                        const trainer: TrainerData = {
                            id: user.id,
                            name: 'You',
                            avatarUrl: '',
                            location: '',
                            rating: 0
                        };

                        return { trainer, cls, booking, student };
                    }
                });

                setBookingsData(formattedBookings);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load bookings",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadBookings();
    }, [user, userRole]);

    const now = new Date();
    const upcomingClasses = bookingsData.filter(({ booking }) => {
        const bookingDateTime = parseBookingDateTime(booking.date, booking.time);
        return bookingDateTime >= now;
    });

    const pastClasses = bookingsData.filter(({ booking }) => {
        const bookingDateTime = parseBookingDateTime(booking.date, booking.time);
        return bookingDateTime < now;
    });

    const handleOpenChat = (personToChatWith: TrainerData, context: any) => {
        // Navigate to messages page with the person to chat with
        navigate('/messages', { 
            state: { 
                recipientId: personToChatWith.id,
                recipientName: personToChatWith.name,
                context 
            } 
        });
    };

    const handleStartCancellation = (bookingInfo: BookingInfo) => {
        setCancelBookingId(bookingInfo.booking.id);
    };

    const handleCancelBookingSuccess = () => {
        setCancelBookingId(null);
        loadBookings();
    };

    const handleOpenReviewModal = (trainer: TrainerData, cls: ClassData, booking: BookingData) => {
        setReviewModalData({ trainer, cls, booking });
    };

    const handleReviewSubmit = async (rating: number, comment: string) => {
        if (!reviewModalData || !user) return;
        
        try {
            // First check if review already exists
            const { data: existingReview } = await supabase
                .from('reviews')
                .select('id')
                .eq('booking_id', reviewModalData.booking.id)
                .single();

            if (existingReview) {
                toast({
                    title: "Review already exists",
                    description: "You have already reviewed this booking.",
                    variant: "destructive"
                });
                setReviewModalData(null);
                return;
            }

            const { error } = await supabase
                .from('reviews')
                .insert({
                    booking_id: reviewModalData.booking.id,
                    trainer_id: reviewModalData.trainer.id,
                    client_id: user.id,
                    rating,
                    comment: comment || null
                });

            if (error) throw error;

            toast({
                title: "Review submitted!",
                description: "Thank you for your feedback.",
            });

            setReviewModalData(null);
            await loadBookings();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to submit review.",
                variant: "destructive"
            });
        }
    };

    const handleShowVerificationCode = (code: string, bookingId: string) => {
        setVerificationCode(code);
        setVerificationBookingId(bookingId);
    };

    if (loading || !userRole) {
        return <BookingsPageSkeleton />;
    }

    if (!user) {
        return (
            <div className="bg-background h-full flex flex-col items-center justify-center gap-4 px-4">
                <p className="text-sm text-muted-foreground text-center">Please log in to view your bookings</p>
                <button
                    onClick={() => navigate('/auth')}
                    className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-200"
                >
                    Go to Login
                </button>
            </div>
        );
    }

    return (
        <div className="bg-background h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-card shadow-sm z-20 flex-shrink-0 border-b border-border">
                <div className="w-9"></div>
                <h1 className="text-lg font-bold text-foreground">
                    {userRole === 'trainer' ? 'Client Bookings' : 'My Bookings'}
                </h1>
                <div className="w-9"></div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 px-4 py-2 bg-card border-b border-border">
                <button 
                    onClick={() => setActiveTab('upcoming')} 
                    className={`flex-1 py-2 rounded-lg font-semibold text-xs transition-colors ${
                        activeTab === 'upcoming' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-foreground hover:bg-muted/80'
                    }`}
                >
                    Upcoming
                </button>
                <button 
                    onClick={() => setActiveTab('past')} 
                    className={`flex-1 py-2 rounded-lg font-semibold text-xs transition-colors ${
                        activeTab === 'past' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-foreground hover:bg-muted/80'
                    }`}
                >
                    Past
                </button>
            </div>

            {/* Scrollable Content */}
            <div ref={containerRef} className="flex-1 overflow-y-auto">
                <div className="px-4 py-3 bg-background pb-[calc(5rem+env(safe-area-inset-bottom))]">
                    <PullToRefreshIndicator 
                        pullDistance={pullDistance}
                        isRefreshing={isRefreshing}
                        pullProgress={pullProgress}
                    />
                    {isLoading ? (
                        <div className="space-y-3">
                            {[...Array(3)].map((_, idx) => (
                                <BookingCardSkeleton key={idx} />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activeTab === 'upcoming' ? (
                                upcomingClasses.length > 0 ? (
                                    upcomingClasses.map((bookingInfo, idx) => (
                                        <BookedClassCard 
                                            key={idx} 
                                            bookingInfo={bookingInfo} 
                                            onOpenChat={handleOpenChat} 
                                            onStartCancellation={handleStartCancellation}
                                            onOpenReviewModal={handleOpenReviewModal}
                                            userRole={userRole!}
                                            onShowVerificationCode={handleShowVerificationCode}
                                            onVerifyAttendance={() => setShowVerifyModal(bookingInfo)}
                                        />
                                    ))
                                ) : (
                                    <EmptyBookingsState type="upcoming" userRole={userRole} />
                                )
                            ) : (
                                pastClasses.length > 0 ? (
                                    pastClasses.map((bookingInfo, idx) => (
                                        <BookedClassCard 
                                            key={idx} 
                                            bookingInfo={bookingInfo} 
                                            onOpenChat={handleOpenChat} 
                                            onStartCancellation={handleStartCancellation}
                                            onOpenReviewModal={handleOpenReviewModal}
                                            userRole={userRole!}
                                        />
                                    ))
                                ) : (
                                    <EmptyBookingsState type="past" userRole={userRole} />
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>

            {cancelBookingId && (
                <CancelBookingModal 
                    isOpen={true}
                    bookingId={cancelBookingId}
                    onClose={() => setCancelBookingId(null)}
                    onSuccess={handleCancelBookingSuccess}
                />
            )}

            {verificationCode && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 pb-20" onClick={() => setVerificationCode(null)}>
                    <div className="bg-card rounded-lg w-full max-w-sm overflow-hidden shadow-lg" onClick={e => e.stopPropagation()}>
                        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                            <h2 className="text-base font-bold text-foreground">Verification Code</h2>
                            <button onClick={() => setVerificationCode(null)} className="p-2 -mr-2 rounded-lg hover:bg-muted transition-colors">
                                <X className="w-5 h-5 text-foreground" />
                            </button>
                        </div>
                        <div className="p-4">
                            <BookingVerificationDisplay 
                                verificationCode={verificationCode} 
                                bookingId={verificationBookingId!}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>
            )}

            {showVerifyModal && (
                <VerifyAttendanceModal
                    isOpen={true}
                    trainerId={user?.id || ''}
                    onClose={() => setShowVerifyModal(null)}
                    onVerified={() => {
                        setShowVerifyModal(null);
                        loadBookings();
                        toast({
                            title: "Success",
                            description: "Attendance verified successfully"
                        });
                    }}
                />
            )}

            {reviewModalData && (
                <ReviewModal
                    isOpen={true}
                    onClose={() => setReviewModalData(null)}
                    onSubmit={handleReviewSubmit}
                    trainerName={reviewModalData.trainer.name}
                    className={reviewModalData.cls.name}
                />
            )}
        </div>
    );
};

export default MyBookingsPage;