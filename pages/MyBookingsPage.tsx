import React, { useState, useEffect } from 'react';
import { Trainer, Class, Booking, UserRole } from '../types';
import { X, Calendar, MapPin, QrCode, CheckCircle, Clock, MessageCircle, Star, FileText, Edit, Eye, Plus } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/hooks/useAuth';
import { useEffectiveRole } from '../src/hooks/useViewMode';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../src/hooks/use-toast';
import BookingVerificationDisplay from '../components/BookingVerificationDisplay';
import VerifyAttendanceModal from '../components/VerifyAttendanceModal';
import BookingCardSkeleton from '../components/BookingCardSkeleton';
import { usePullToRefresh } from '../src/hooks/usePullToRefresh';
import PullToRefreshIndicator from '../components/PullToRefreshIndicator';
import EmptyBookingsState from '../components/EmptyBookingsState';
import RequestCard from '../components/RequestCard';
import { TrainingRequest } from '../types';
import { AppScreen } from '@/src/components/layout/screen';
import { DetailContextStrip } from '@/src/components/layout/detail-context-strip';
import { StitchCanvas, StitchPageHeader } from '@/src/components/layout/stitch-page';
import { cn } from '@/src/lib/utils';
import { PageLoader, EmptyState } from '../src/components/layout/states';
import { Button } from '../src/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../src/components/ui/card';
import { Skeleton } from '../src/components/ui/skeleton';
import { StatusBadge } from '../src/components/ui/status-badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../src/components/ui/dialog';
import SmoothTab from '../src/components/kokonutui/smooth-tab';
import HoldButton from '../src/components/kokonutui/hold-button';
import { formatVND } from '../src/lib/format';

const BOOKING_SKELETONS = 4;

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
        <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-sm">
                <DialogHeader className="text-center sm:text-center">
                    <DialogTitle>Cancel Booking</DialogTitle>
                    <DialogDescription>
                        {cls.name} · {booking.date} at {booking.time}
                    </DialogDescription>
                </DialogHeader>
                <p className="text-center text-sm text-foreground">
                    Are you sure you want to cancel this booking? This action cannot be undone.
                </p>
                <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
                    {/* Irreversible: press and hold to confirm (Kokonut UI hold-button) */}
                    <HoldButton
                        variant="red"
                        className="w-full"
                        holdingLabel="Keep holding…"
                        completeLabel="Cancelled"
                        onHoldComplete={handleConfirm}
                    >
                        Hold to cancel booking
                    </HoldButton>
                    <Button variant="outline" className="w-full" onClick={onClose}>
                        Keep Booking
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
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

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200';

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
            onOpenChat(trainer, {
                classId: cls.id,
                className: cls.name,
                bookingDate: booking.date,
                studentId: booking.userId,
                bookingId: booking.id
            });
        } else if (!isStudentView && student) {
            onOpenChat(student, {
                classId: cls.id,
                className: cls.name,
                bookingDate: booking.date,
                studentId: student.id,
                bookingId: booking.id
            });
        }
    };

    const shortBookingId = (booking.id.slice(0, 2) + booking.id.slice(9, 11) + booking.id.slice(14, 15)).toUpperCase();

    return (
        <>
            <Card className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-colors hover:border-primary/40">
                <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 p-4 pb-3">
                    <div className="flex min-w-0 flex-col gap-1">
                        <CardTitle className="truncate text-sm md:text-base">{cls.name}</CardTitle>
                        <CardDescription>
                            <button
                                type="button"
                                onClick={() => setShowProfileModal(true)}
                                className="text-left text-xs text-primary hover:underline focus-visible:outline-none focus-visible:underline md:text-sm"
                            >
                                {isStudentView ? `Trainer: ${trainer?.name || 'N/A'}` : `Student: ${student?.name || 'N/A'}`}
                            </button>
                        </CardDescription>
                    </div>
                    {booking.status === 'attended' && (
                        <StatusBadge status="attended" className="shrink-0">
                            <CheckCircle className="size-3.5" />
                            Verified
                        </StatusBadge>
                    )}
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-3 p-4 pt-0">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-foreground">
                        <span className="flex items-center gap-1">
                            <Calendar className="size-3.5 text-primary" />
                            {booking.date}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="size-3.5 text-primary" />
                            {booking.time}
                        </span>
                        {displayPerson?.location && (
                            <span className="flex min-w-0 items-center gap-1">
                                <MapPin className="size-3.5 shrink-0 text-primary" />
                                <span className="truncate">{displayPerson.location}</span>
                            </span>
                        )}
                    </div>

                    <dl className="flex flex-col gap-1.5 rounded-lg bg-muted/50 p-3 text-xs">
                        <DetailRow label="Booking ID" value={<span className="font-mono font-semibold">{shortBookingId}</span>} />
                        {booking.createdAt && <DetailRow label="Booked on" value={booking.createdAt} />}
                        <DetailRow label="Duration" value={`${cls.duration} minutes`} />
                        <DetailRow label="Price" value={<span className="font-semibold text-primary">{formatVND(cls.price)}</span>} />
                    </dl>
                </CardContent>

                <CardFooter className="gap-2 border-t border-border p-4">
                        <Button size="sm" variant="secondary" className="flex-1" onClick={handleChatClick}>
                            <MessageCircle />
                            Chat
                        </Button>

                        {isStudentView ? (
                            <>
                                {booking.status === 'booked' && (
                                    <>
                                        <Button size="sm" variant="secondary" className="flex-1" onClick={() => onStartCancellation(bookingInfo)}>
                                            <X />
                                            Cancel
                                        </Button>
                                        {booking.verificationCode && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-primary"
                                                onClick={() => onShowVerificationCode?.(booking.verificationCode!, booking.id)}
                                                aria-label="Show attendance QR code"
                                            >
                                                <QrCode />
                                            </Button>
                                        )}
                                    </>
                                )}
                                {booking.status === 'attended' && !booking.hasReview && (
                                    <Button size="sm" className="flex-1" onClick={() => onOpenReviewModal(trainer, cls, booking)}>
                                        Leave Review
                                    </Button>
                                )}
                            </>
                        ) : (
                            booking.status === 'booked' && onVerifyAttendance && (
                                <Button size="sm" className="flex-1" onClick={onVerifyAttendance}>
                                    Verify
                                </Button>
                            )
                        )}
                </CardFooter>
            </Card>

            {showProfileModal && displayPerson && (
                <Dialog open onOpenChange={(open) => { if (!open) setShowProfileModal(false); }}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Profile</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col items-center">
                            <img
                                src={displayPerson.avatarUrl || DEFAULT_AVATAR}
                                alt={displayPerson.name}
                                className="mb-3 h-24 w-24 rounded-full border-4 border-border object-cover"
                            />
                            <h3 className="text-lg font-bold text-foreground">{displayPerson.name}</h3>
                        </div>
                        <div className="flex flex-col gap-3">
                            {displayPerson.location && (
                                <div className="flex items-center gap-2 text-sm text-foreground">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    {displayPerson.location}
                                </div>
                            )}
                            {displayPerson.rating && (
                                <div className="flex items-center gap-2 text-sm text-foreground">
                                    <Star className="h-4 w-4 fill-primary text-primary" />
                                    Rating: {displayPerson.rating.toFixed(1)}
                                </div>
                            )}
                        </div>
                        <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
                            <Button
                                className="w-full"
                                onClick={() => {
                                    setShowProfileModal(false);
                                    if (isStudentView && trainer) {
                                        navigate(`/trainer/${trainer.id}`);
                                    }
                                }}
                            >
                                View Full Profile
                            </Button>
                            <Button variant="outline" className="w-full" onClick={handleChatClick}>
                                <MessageCircle />
                                Send Message
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{label}:</dt>
            <dd className="text-right text-foreground">{value}</dd>
        </div>
    );
}

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
    const { user, loading } = useAuth();
    const userRole = useEffectiveRole();
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const [activeMainTab, setActiveMainTab] = useState<'bookings' | 'requests'>('bookings');
    const [activeBookingTab, setActiveBookingTab] = useState<'upcoming' | 'past'>('upcoming');
    const [cancelBookingTarget, setCancelBookingTarget] = useState<BookingInfo | null>(null);
    const [verificationCode, setVerificationCode] = useState<string | null>(null);
    const [verificationBookingId, setVerificationBookingId] = useState<string | null>(null);
    const [showVerifyModal, setShowVerifyModal] = useState<BookingInfo | null>(null);
    const [bookingsData, setBookingsData] = useState<BookingInfo[]>([]);
    const [requestsData, setRequestsData] = useState<TrainingRequest[]>([]);
    const [isLoadingBookings, setIsLoadingBookings] = useState(true);
    const [isLoadingRequests, setIsLoadingRequests] = useState(true);

    // Pull-to-refresh functionality
    const { containerRef, pullDistance, isRefreshing, pullProgress } = usePullToRefresh({
        onRefresh: async () => {
            if (activeMainTab === 'bookings') {
                await loadBookings();
            } else {
                await loadRequests();
            }
        }
    });

    const loadBookings = async () => {
        if (!user || !userRole) return;
        
        setIsLoadingBookings(true);
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
                        )`)
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
                        )`)
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
            setIsLoadingBookings(false);
        }
    };

    const loadRequests = async () => {
        if (!user || userRole !== 'student') return;

        setIsLoadingRequests(true);
        try {
            const { data, error } = await supabase
                .from('requests')
                .select(`
                    *,
                    student:profiles!requests_student_id_fkey(username, avatar_url)`)
                .eq('student_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const transformedRequests: TrainingRequest[] = (data || []).map((req: any) => {
                return {
                    id: req.id,
                    student_id: req.student_id,
                    student_name: req.student?.username,
                    student_avatar: req.student?.avatar_url,
                    category: req.category,
                    district: req.district,
                    description: req.description,
                    desired_price: parseFloat(req.desired_price),
                    level: req.level,
                    preferred_time: req.preferred_time,
                    location_type: req.location_type,
                    status: req.status,
                    created_at: req.created_at,
                    updated_at: req.updated_at,
                };
            });

            // Load responses count for each request
            const requestsWithCounts = await Promise.all(
                transformedRequests.map(async (req) => {
                    const { count } = await supabase
                        .from('trainer_responses')
                        .select('*', { count: 'exact', head: true })
                        .eq('request_id', req.id);

                    return {
                        ...req,
                        responses_count: count || 0
                    };
                })
            );

            setRequestsData(requestsWithCounts);
        } catch (error) {
            console.error('Error loading requests:', error);
            toast({
                title: "Error",
                description: "Failed to load requests",
                variant: "destructive"
            });
        } finally {
            setIsLoadingRequests(false);
        }
    };

    useEffect(() => {
        // Trainers cannot create/manage training requests — keep them on bookings only.
        if (userRole !== 'student') {
            setActiveMainTab('bookings');
            return;
        }
        const state = location.state as { activeTab?: string } | null;
        if (state?.activeTab === 'requests') {
            setActiveMainTab('requests');
        }
    }, [location.state, userRole]);

    useEffect(() => {
        if (activeMainTab === 'bookings') {
            loadBookings();
        } else if (activeMainTab === 'requests' && userRole === 'student') {
            loadRequests();
        }
    }, [user, userRole, activeMainTab]);

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
        navigate('/messages', { 
            state: { 
                recipientId: personToChatWith.id,
                recipientName: personToChatWith.name,
                context 
            } 
        });
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

    if (loading) {
        return (
            <AppScreen>
                <PageLoader title="Loading bookings…" />
            </AppScreen>
        );
    }

    if (!user) {
        return (
            <AppScreen>
                <StitchCanvas>
                    <EmptyState
                        icon={Calendar}
                        title="Sign in to see your bookings"
                        description="Please log in to view your bookings"
                        action={<Button onClick={() => navigate('/auth')}>Go to Login</Button>}
                    />
                </StitchCanvas>
            </AppScreen>
        );
    }

    const isStudent = userRole === 'student';

    const renderBookingList = (items: BookingInfo[], type: 'upcoming' | 'past') =>
        items.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-2">
                {items.map((bookingInfo) => (
                    <BookedClassCard
                        key={bookingInfo.booking.id}
                        bookingInfo={bookingInfo}
                        onOpenChat={handleOpenChat}
                        onStartCancellation={handleStartCancellation}
                        onOpenReviewModal={handleOpenReviewModal}
                        userRole={userRole!}
                        {...(type === 'upcoming' && {
                            onShowVerificationCode: handleShowVerificationCode,
                            onVerifyAttendance: () => setShowVerifyModal(bookingInfo),
                        })}
                    />
                ))}
            </div>
        ) : (
            <EmptyBookingsState type={type} />
        );

    return (
        // Fixed-height column so the list is the scroll container pull-to-refresh measures.
        <AppScreen className="flex min-h-[calc(100dvh-3.5rem)] min-w-0 flex-col overflow-x-hidden bg-[#f9fafb] dark:bg-background lg:min-h-[calc(100dvh-4rem)]">
            <div className="shrink-0 border-b border-border bg-card/95 backdrop-blur">
                <StitchCanvas className="!space-y-0 flex flex-col gap-3 !py-4">
                    <DetailContextStrip
                        backLabel="Back to Home"
                        onBack={() => navigate('/')}
                        crumbs={[
                            { label: 'Home', href: '/' },
                            {
                                label: isStudent && activeMainTab === 'requests' ? 'My Requests' : 'My Bookings',
                                href: '/bookings',
                            },
                        ]}
                        actions={
                            isStudent && activeMainTab === 'requests' ? (
                                <Button
                                    size="sm"
                                    onClick={() => navigate('/requests/create')}
                                    aria-label="Create request"
                                >
                                    <Plus data-icon="inline-start" />
                                    Create Request
                                </Button>
                            ) : undefined
                        }
                    />
                    <StitchPageHeader
                        title={
                            isStudent && activeMainTab === 'requests' ? 'My Requests' : 'My Bookings'
                        }
                        description={
                            isStudent
                                ? activeMainTab === 'requests'
                                    ? 'Training requests you’ve posted for coaches'
                                    : 'Your upcoming and past classes'
                                : 'Classes your students booked with you'
                        }
                    >
                        {isStudent ? (
                            <div
                                className="inline-flex items-center rounded-lg border border-border bg-muted/60 p-1"
                                role="tablist"
                                aria-label="My bookings sections"
                            >
                                {(
                                    [
                                        { id: 'bookings', label: 'Bookings', icon: Calendar },
                                        { id: 'requests', label: 'My Requests', icon: FileText },
                                    ] as const
                                ).map(({ id, label, icon: Icon }) => {
                                    const active = activeMainTab === id;
                                    return (
                                        <button
                                            key={id}
                                            type="button"
                                            role="tab"
                                            aria-selected={active}
                                            onClick={() => setActiveMainTab(id)}
                                            className={cn(
                                                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                                                active && 'bg-card text-foreground shadow-sm',
                                                !active && 'text-muted-foreground hover:text-foreground'
                                            )}
                                        >
                                            <Icon className="size-4" />
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : null}
                    </StitchPageHeader>
                </StitchCanvas>
            </div>

            <div ref={containerRef} className="flex-1 overflow-y-auto">
                <StitchCanvas className="!pt-4">
                    <PullToRefreshIndicator
                        pullDistance={pullDistance}
                        isRefreshing={isRefreshing}
                        pullProgress={pullProgress}
                    />

                    {activeMainTab === 'bookings' ? (
                        isLoadingBookings ? (
                            <div className="grid gap-3 lg:grid-cols-2">
                                {Array.from({ length: BOOKING_SKELETONS }, (_, idx) => (
                                    <BookingCardSkeleton key={idx} />
                                ))}
                            </div>
                        ) : (
                            // Kokonut UI smooth-tab: swipe between Upcoming and Past on touch screens
                            <SmoothTab
                                label="Booking period"
                                value={activeBookingTab}
                                onChange={(id) => setActiveBookingTab(id as 'upcoming' | 'past')}
                                items={[
                                    {
                                        id: 'upcoming',
                                        title: `Upcoming (${upcomingClasses.length})`,
                                        content: renderBookingList(upcomingClasses, 'upcoming'),
                                    },
                                    {
                                        id: 'past',
                                        title: `Past (${pastClasses.length})`,
                                        content: renderBookingList(pastClasses, 'past'),
                                    },
                                ]}
                            />
                        )
                    ) : isLoadingRequests ? (
                        <div className="grid gap-3 lg:grid-cols-2">
                            {Array.from({ length: BOOKING_SKELETONS }, (_, idx) => (
                                <Skeleton key={idx} className="h-28 rounded-xl" />
                            ))}
                        </div>
                    ) : requestsData.length === 0 ? (
                        <EmptyState
                            icon={FileText}
                            title="No Requests Yet"
                            description="Create your first training request to find trainers"
                            action={
                                <Button className="bg-[#fd651e] text-white hover:bg-[#a73a00]" onClick={() => navigate('/requests/create')}>
                                    <Plus />
                                    Create Request
                                </Button>
                            }
                        />
                    ) : (
                        <div className="grid gap-3 lg:grid-cols-2">
                            {requestsData.map((request) => (
                                <div key={request.id} className="flex flex-col gap-2">
                                        <RequestCard
                                            request={request}
                                            userRole="student"
                                            currentUserId={user.id}
                                            onViewResponses={(req) => navigate(`/requests/${req.id}/responses`, { state: { request: req } })}
                                            onClick={() => navigate(`/requests/${request.id}/responses`, { state: { request } })}
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                className="flex-1"
                                                onClick={() => navigate(`/requests/${request.id}/responses`, { state: { request } })}
                                            >
                                                <Eye />
                                                View Responses ({request.responses_count || 0})
                                            </Button>
                                            {request.status === 'open' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-primary"
                                                    onClick={() => navigate(`/requests/${request.id}/edit`, { state: { request } })}
                                                    aria-label="Edit request"
                                                >
                                                    <Edit />
                                                </Button>
                                            )}
                                        </div>
                                </div>
                            ))}
                        </div>
                    )}
                </StitchCanvas>
            </div>

            {cancelBookingTarget && (
                <CancelBookingModal
                    bookingInfo={cancelBookingTarget}
                    onConfirm={handleCancelBooking}
                    onClose={() => setCancelBookingTarget(null)}
                />
            )}

            {verificationCode && (
                <Dialog open onOpenChange={(open) => { if (!open) setVerificationCode(null); }}>
                    <DialogContent className="max-h-[90vh] max-w-sm overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Verification Code</DialogTitle>
                        </DialogHeader>
                        <BookingVerificationDisplay
                            verificationCode={verificationCode}
                            bookingId={verificationBookingId!}
                            className="w-full border-0 p-0 shadow-none"
                        />
                    </DialogContent>
                </Dialog>
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
        </AppScreen>
    );
};

export default MyBookingsPage;
