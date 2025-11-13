import React, { useState, useEffect } from 'react';
import { Trainer, Class, Booking, UserRole } from '../types';
import { X, Calendar, MapPin, QrCode, CheckCircle } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../src/hooks/use-toast';
import BookingVerificationDisplay from '../components/BookingVerificationDisplay';
import VerifyAttendanceModal from '../components/VerifyAttendanceModal';
import BookingCardSkeleton from '../components/BookingCardSkeleton';
import { usePullToRefresh } from '../src/hooks/usePullToRefresh';
import PullToRefreshIndicator from '../components/PullToRefreshIndicator';
import EmptyBookingsState from '../components/EmptyBookingsState';

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

interface CancelBookingModalProps {
    bookingInfo: BookingInfo;
    onConfirm: (trainerId: string, classId: string, date: string, time: string) => void;
    onClose: () => void;
}

const CancelBookingModal: React.FC<CancelBookingModalProps> = ({ bookingInfo, onConfirm, onClose }) => {
    const { trainer, cls, booking } = bookingInfo;

    const handleConfirm = () => {
        onConfirm(trainer.id, cls.id, booking.date, booking.time);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 pb-20 animate-fade-in" onClick={onClose}>
            <div className="bg-card rounded-2xl w-full max-w-sm overflow-hidden transform animate-slide-up shadow-lg border border-border" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-border relative">
                    <h2 className="text-lg font-bold text-foreground text-center">Cancel Booking</h2>
                <p className="text-sm text-muted-foreground text-center">{cls.name}</p>
                    <p className="text-xs text-muted-foreground text-center mt-1">{booking.date} at {booking.time}</p>
                    <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full hover:bg-muted transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>
                <div className="p-5">
                    <p className="text-center text-foreground">Are you sure you want to cancel this class session? This action cannot be undone.</p>
                </div>
                <div className="p-5 bg-muted border-t border-border grid grid-cols-2 gap-3">
                     <button onClick={onClose} className="w-full bg-background border border-border text-foreground font-semibold py-2.5 rounded-xl transition-colors hover:bg-muted">
                        Keep Booking
                    </button>
                    <button onClick={handleConfirm} className="w-full bg-destructive text-destructive-foreground font-semibold py-2.5 rounded-xl transition-colors hover:bg-destructive/90">
                        Confirm Cancellation
                    </button>
                </div>
            </div>
        </div>
    );
};

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

    const handleChatClick = () => {
        if (isStudentView) {
            onOpenChat(trainer, { classId: cls.id, className: cls.name, bookingDate: booking.date, studentId: booking.userId });
        } else if (student) {
            onOpenChat(student, { classId: cls.id, className: cls.name, bookingDate: booking.date, studentId: student.id });
        }
    };
    
    return (
        <div className="bg-card rounded-2xl shadow-sm border border-border flex overflow-hidden">
            <div className="flex-1 p-4">
                <div className="flex items-start justify-between mb-2">
                    <div>
                        <h3 className="font-bold text-base text-foreground">{cls.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            {isStudentView ? `Trainer: ${trainer.name}` : `Student: ${student?.name || 'N/A'}`}
                        </p>
                    </div>
                    {booking.status === 'attended' && (
                        <span className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>{booking.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        <span>{booking.time}</span>
                    </div>
                </div>
                <div className="flex gap-2 mt-4">
                    <button 
                        onClick={handleChatClick}
                        className="flex-1 bg-primary text-primary-foreground font-medium py-2 rounded-xl transition-colors hover:bg-primary/90 text-sm"
                    >
                        Chat
                    </button>
                    {isStudentView ? (
                        <>
                            {booking.status === 'booked' && (
                                <>
                                    <button 
                                        onClick={() => onStartCancellation(bookingInfo)}
                                        className="flex-1 bg-muted text-muted-foreground font-medium py-2 rounded-xl transition-colors hover:bg-muted/80 text-sm"
                                    >
                                        Cancel
                                    </button>
                                    {booking.verificationCode && (
                                        <button 
                                            onClick={() => onShowVerificationCode?.(booking.verificationCode!, booking.id)}
                                            className="px-4 bg-accent text-accent-foreground font-medium py-2 rounded-xl transition-colors hover:bg-accent/90"
                                        >
                                            <QrCode className="w-4 h-4" />
                                        </button>
                                    )}
                                </>
                            )}
                            {booking.status === 'attended' && !booking.hasReview && (
                                <button 
                                    onClick={() => onOpenReviewModal(trainer, cls, booking)}
                                    className="flex-1 bg-accent text-accent-foreground font-medium py-2 rounded-xl transition-colors hover:bg-accent/90 text-sm"
                                >
                                    Leave a Review
                                </button>
                            )}
                        </>
                    ) : (
                        booking.status === 'booked' && (
                            <button 
                                onClick={onVerifyAttendance}
                                className="flex-1 bg-primary text-primary-foreground font-medium py-2 rounded-xl transition-colors hover:bg-primary/90 text-sm"
                            >
                                Verify
                            </button>
                        )
                    )}
                </div>
            </div>
        </div>
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
    const { user, userRole } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [cancelBookingTarget, setCancelBookingTarget] = useState<BookingInfo | null>(null);
    const [verificationCode, setVerificationCode] = useState<string | null>(null);
    const [verificationBookingId, setVerificationBookingId] = useState<string | null>(null);
    const [showVerifyModal, setShowVerifyModal] = useState<BookingInfo | null>(null);
    const [bookingsData, setBookingsData] = useState<BookingInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Pull-to-refresh functionality
    const { containerRef, pullDistance, isRefreshing, pullProgress } = usePullToRefresh({
        onRefresh: async () => {
            await loadBookings();
        }
    });

    const loadBookings = async () => {
        if (!user || !userRole) return;
        
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
                        verificationCode: item.verification_code
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
        navigate(`/chat/${personToChatWith.id}`, { state: { context } });
    };

    const handleStartCancellation = (bookingInfo: BookingInfo) => {
        setCancelBookingTarget(bookingInfo);
    };

    const handleCancelBooking = async (trainerId: string, classId: string, date: string, time: string) => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('bookings')
                .delete()
                .eq('client_id', user.id)
                .eq('class_id', classId)
                .eq('booking_date', new Date(date).toISOString().split('T')[0])
                .eq('booking_time', time);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Booking cancelled successfully"
            });

            loadBookings();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to cancel booking",
                variant: "destructive"
            });
        }
    };

    const handleOpenReviewModal = (trainer: TrainerData, cls: ClassData, booking: BookingData) => {
        navigate('/explore');
    };

    const handleShowVerificationCode = (code: string, bookingId: string) => {
        setVerificationCode(code);
        setVerificationBookingId(bookingId);
    };

    if (!user || !userRole) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="text-muted-foreground">Please log in to view bookings</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-background">
            <div className="flex items-center justify-between p-4 border-b border-border bg-card sticky top-0 z-10">
                <h1 className="text-xl font-bold text-foreground">My Bookings</h1>
            </div>

            <div className="flex gap-2 p-4 border-b border-border bg-card">
                <button 
                    onClick={() => setActiveTab('upcoming')} 
                    className={`flex-1 py-2.5 rounded-xl font-semibold transition-colors ${
                        activeTab === 'upcoming' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                >
                    Upcoming
                </button>
                <button 
                    onClick={() => setActiveTab('past')} 
                    className={`flex-1 py-2.5 rounded-xl font-semibold transition-colors ${
                        activeTab === 'past' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                >
                    Past
                </button>
            </div>

            <div ref={containerRef} className="flex-1 overflow-y-auto pb-24 relative">
                <PullToRefreshIndicator 
                    pullDistance={pullDistance}
                    isRefreshing={isRefreshing}
                    pullProgress={pullProgress}
                />
                {isLoading ? (
                    <div className="p-4 space-y-3">
                        {[...Array(3)].map((_, idx) => (
                            <BookingCardSkeleton key={idx} />
                        ))}
                    </div>
                ) : (
                    <div className="p-4 space-y-3">
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
                                <EmptyBookingsState type="upcoming" />
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
                                <EmptyBookingsState type="past" />
                            )
                        )}
                    </div>
                )}
            </div>

            {cancelBookingTarget && (
                <CancelBookingModal 
                    bookingInfo={cancelBookingTarget} 
                    onConfirm={handleCancelBooking} 
                    onClose={() => setCancelBookingTarget(null)} 
                />
            )}

            {verificationCode && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 pb-20" onClick={() => setVerificationCode(null)}>
                    <div className="bg-card rounded-2xl w-full max-w-sm overflow-hidden shadow-lg border border-border" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-border relative">
                            <h2 className="text-lg font-bold text-foreground text-center">Your Verification Code</h2>
                            <button onClick={() => setVerificationCode(null)} className="absolute top-3 right-3 p-2 rounded-full hover:bg-muted transition-colors">
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>
                        <div className="p-5">
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
                    booking={showVerifyModal.booking}
                    onClose={() => setShowVerifyModal(null)}
                    onVerified={() => {
                        setShowVerifyModal(null);
                        loadBookings();
                    }}
                />
            )}
        </div>
    );
};

export default MyBookingsPage;