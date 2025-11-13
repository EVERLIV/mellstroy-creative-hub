import React, { useState, useEffect } from 'react';
import { Trainer, Class, Booking, UserRole } from '../types';
import { X, Calendar, MapPin, QrCode, CheckCircle, Clock, MessageCircle, Star, FileText, Edit, Eye, Plus, Loader } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/hooks/useAuth';
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 pb-20" onClick={onClose}>
            <div className="bg-white rounded-lg w-full max-w-sm overflow-hidden shadow-lg" onClick={e => e.stopPropagation()}>
                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex-1">
                        <h2 className="text-base font-bold text-gray-900 text-center">Cancel Booking</h2>
                        <p className="text-xs text-gray-600 text-center mt-1">{cls.name}</p>
                        <p className="text-xs text-gray-600 text-center">{booking.date} at {booking.time}</p>
                    </div>
                    <button onClick={onClose} className="p-2 -mr-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <X className="w-5 h-5 text-gray-800" />
                    </button>
                </div>
                <div className="p-4">
                    <p className="text-sm text-gray-900 text-center">
                        Are you sure you want to cancel this booking? This action cannot be undone.
                    </p>
                </div>
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex gap-2">
                    <button 
                        onClick={onClose} 
                        className="flex-1 bg-white border border-gray-200 text-gray-900 text-xs font-semibold py-2.5 rounded-lg hover:bg-gray-50 active:scale-95 transition-all duration-200"
                    >
                        Keep Booking
                    </button>
                    <button 
                        onClick={handleConfirm} 
                        className="flex-1 bg-red-600 text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-red-700 active:scale-95 transition-all duration-200"
                    >
                        Cancel Booking
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
    
    return (
        <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                <div className="p-3">
                    {/* Status Badge */}
                    {booking.status === 'attended' && (
                        <div className="mb-3 inline-flex items-center bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Verified
                        </div>
                    )}

                    {/* Class Name & Person */}
                    <div className="mb-3">
                        <h3 className="text-sm font-bold text-gray-900">{cls.name}</h3>
                        <button 
                            onClick={() => setShowProfileModal(true)}
                            className="text-xs text-[#FF6B35] hover:underline mt-1 text-left"
                        >
                            {isStudentView ? `Trainer: ${trainer?.name || 'N/A'}` : `Student: ${student?.name || 'N/A'}`}
                        </button>
                    </div>

                {/* Date & Time & Location */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-3">
                    <div className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 text-[#FF6B35]" />
                        <span className="ml-1 text-xs text-gray-900">{booking.date}</span>
                    </div>
                    <div className="flex items-center">
                        <Clock className="w-3.5 h-3.5 text-[#FF6B35]" />
                        <span className="ml-1 text-xs text-gray-900">{booking.time}</span>
                    </div>
                    {displayPerson?.location && (
                        <div className="flex items-center">
                            <MapPin className="w-3.5 h-3.5 text-[#FF6B35]" />
                            <span className="ml-1 text-xs text-gray-900">{displayPerson.location}</span>
                        </div>
                    )}
                </div>

                {/* Booking Details */}
                <div className="mb-3 p-2 bg-gray-50 rounded-lg space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Booking ID:</span>
                        <span className="text-gray-900 font-mono font-semibold">{(booking.id.slice(0, 2) + booking.id.slice(9, 11) + booking.id.slice(14, 15)).toUpperCase()}</span>
                    </div>
                    {booking.createdAt && (
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Booked on:</span>
                            <span className="text-gray-900">{booking.createdAt}</span>
                        </div>
                    )}
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Duration:</span>
                        <span className="text-gray-900">{cls.duration} minutes</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-gray-600">Price:</span>
                        <span className="text-[#FF6B35]">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(cls.price).replace(/\s/g, '')}</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-gray-200">
                    <button 
                        onClick={handleChatClick}
                        className="flex-1 bg-gray-100 text-gray-900 text-xs font-semibold py-2.5 px-3 rounded-lg hover:bg-gray-200 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5"
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
                                        className="flex-1 bg-gray-100 text-gray-900 text-xs font-semibold py-2.5 px-3 rounded-lg hover:bg-gray-200 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                        Cancel
                                    </button>
                                    {booking.verificationCode && (
                                        <button 
                                            onClick={() => onShowVerificationCode?.(booking.verificationCode!, booking.id)}
                                            className="bg-[#FF6B35]/10 text-[#FF6B35] text-xs font-semibold py-2.5 px-3 rounded-lg hover:bg-[#FF6B35]/20 active:scale-95 transition-all duration-200 flex items-center justify-center"
                                        >
                                            <QrCode className="w-4 h-4" />
                                        </button>
                                    )}
                                </>
                            )}
                            {booking.status === 'attended' && !booking.hasReview && (
                                <button 
                                    onClick={() => onOpenReviewModal(trainer, cls, booking)}
                                    className="flex-1 bg-[#FF6B35] text-white text-xs font-semibold py-2.5 px-3 rounded-lg hover:bg-orange-600 active:scale-95 transition-all duration-200"
                                >
                                    Leave Review
                                </button>
                            )}
                        </>
                    ) : (
                        booking.status === 'booked' && onVerifyAttendance && (
                            <button 
                                onClick={onVerifyAttendance}
                                className="flex-1 bg-[#FF6B35] text-white text-xs font-semibold py-2.5 px-3 rounded-lg hover:bg-orange-600 active:scale-95 transition-all duration-200"
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
                <div className="bg-white rounded-lg w-full max-w-md overflow-hidden shadow-lg" onClick={e => e.stopPropagation()}>
                    <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="text-base font-bold text-gray-900">Profile</h2>
                        <button onClick={() => setShowProfileModal(false)} className="p-2 -mr-2 rounded-lg hover:bg-gray-100 transition-colors">
                            <X className="w-5 h-5 text-gray-800" />
                        </button>
                    </div>
                    <div className="p-4">
                        {/* Profile Image */}
                        <div className="flex flex-col items-center mb-4">
                            <img 
                                src={displayPerson.avatarUrl || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200'} 
                                alt={displayPerson.name}
                                className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 mb-3"
                            />
                            <h3 className="text-lg font-bold text-gray-900">{displayPerson.name}</h3>
                        </div>

                        {/* Profile Info */}
                        <div className="space-y-3">
                            {displayPerson.location && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-[#FF6B35]" />
                                    <span className="text-sm text-gray-900">{displayPerson.location}</span>
                                </div>
                            )}
                            {displayPerson.rating && (
                                <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-[#FF6B35] fill-[#FF6B35]" />
                                    <span className="text-sm text-gray-900">Rating: {displayPerson.rating.toFixed(1)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 space-y-2">
                        <button 
                            onClick={() => {
                                setShowProfileModal(false);
                                if (isStudentView && trainer) {
                                    navigate(`/trainer/${trainer.id}`);
                                }
                            }}
                            className="w-full bg-[#FF6B35] text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-orange-600 active:scale-95 transition-all duration-200"
                        >
                            View Full Profile
                        </button>
                        <button 
                            onClick={handleChatClick}
                            className="w-full bg-white border border-gray-200 text-gray-900 text-sm font-semibold py-2.5 rounded-lg hover:bg-gray-50 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
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
                    student:profiles!requests_student_id_fkey(username, avatar_url)
                `)
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
        // Handle navigation state for tab switching
        const state = location.state as { activeTab?: string } | null;
        if (state?.activeTab === 'requests' && userRole === 'student') {
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
            <div className="bg-gray-50 h-full flex items-center justify-center">
                <Loader className="w-6 h-6 text-[#FF6B35] animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="bg-gray-50 h-full flex flex-col items-center justify-center gap-4 px-4">
                <p className="text-sm text-gray-600 text-center">Please log in to view your bookings</p>
                <button
                    onClick={() => navigate('/auth')}
                    className="px-4 py-2 bg-[#FF6B35] text-white text-xs font-semibold rounded-lg hover:bg-orange-600 active:scale-95 transition-all duration-200"
                >
                    Go to Login
                </button>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 shadow-sm z-20 flex-shrink-0">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="w-9"></div>
                    <h1 className="text-lg font-bold text-gray-900">My Bookings</h1>
                    {userRole === 'student' && activeMainTab === 'requests' && (
                        <button
                            onClick={() => navigate('/requests/create')}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <Plus className="w-5 h-5 text-[#FF6B35]" />
                        </button>
                    )}
                    {userRole === 'student' && activeMainTab === 'bookings' && (
                        <div className="w-9"></div>
                    )}
                </div>

                {/* Main Tabs */}
                {userRole === 'student' && (
                    <div className="flex gap-2 px-4 pb-2">
                        <button 
                            onClick={() => setActiveMainTab('bookings')} 
                            className={`flex-1 py-2 rounded-lg font-semibold text-xs transition-all duration-200 ${
                                activeMainTab === 'bookings' 
                                    ? 'bg-[#FF6B35] text-white shadow-md' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <Calendar className="w-4 h-4 inline mr-1.5" />
                            Bookings
                        </button>
                        <button 
                            onClick={() => setActiveMainTab('requests')} 
                            className={`flex-1 py-2 rounded-lg font-semibold text-xs transition-all duration-200 ${
                                activeMainTab === 'requests' 
                                    ? 'bg-[#FF6B35] text-white shadow-md' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <FileText className="w-4 h-4 inline mr-1.5" />
                            My Requests
                        </button>
                    </div>
                )}
            </div>

            {/* Booking Tabs (only for bookings tab) */}
            {activeMainTab === 'bookings' && (
                <div className="flex gap-2 px-4 py-2 bg-white border-b border-gray-100">
                    <button 
                        onClick={() => setActiveBookingTab('upcoming')} 
                        className={`flex-1 py-2 rounded-lg font-semibold text-xs transition-all duration-200 ${
                            activeBookingTab === 'upcoming' 
                                ? 'bg-[#FF6B35] text-white shadow-sm' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Upcoming
                    </button>
                    <button 
                        onClick={() => setActiveBookingTab('past')} 
                        className={`flex-1 py-2 rounded-lg font-semibold text-xs transition-all duration-200 ${
                            activeBookingTab === 'past' 
                                ? 'bg-[#FF6B35] text-white shadow-sm' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Past
                    </button>
                </div>
            )}

            {/* Scrollable Content */}
            <div ref={containerRef} className="flex-1 overflow-y-auto">
                <div className="px-4 py-3 pb-safe-nav">
                    <PullToRefreshIndicator 
                        pullDistance={pullDistance}
                        isRefreshing={isRefreshing}
                        pullProgress={pullProgress}
                    />
                    
                    {activeMainTab === 'bookings' ? (
                        isLoadingBookings ? (
                            <div className="space-y-3">
                                {[...Array(3)].map((_, idx) => (
                                    <BookingCardSkeleton key={idx} />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {activeBookingTab === 'upcoming' ? (
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
                        )
                    ) : (
                        // Requests Tab (only for students)
                        isLoadingRequests ? (
                            <div className="space-y-3">
                                {[...Array(3)].map((_, idx) => (
                                    <div key={idx} className="bg-white rounded-lg p-3 shadow-sm animate-pulse">
                                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                ))}
                            </div>
                        ) : requestsData.length === 0 ? (
                            <div className="text-center mt-12">
                                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm font-bold text-gray-900 mb-1">No Requests Yet</p>
                                <p className="text-xs text-gray-600 mb-4">Create your first training request to find trainers</p>
                                <button
                                    onClick={() => navigate('/requests/create')}
                                    className="px-4 py-2 bg-[#FF6B35] text-white rounded-lg text-xs font-semibold hover:bg-orange-600 active:scale-95 shadow-sm transition-all duration-200 flex items-center gap-2 mx-auto"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create Request
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {requestsData.map((request) => (
                                    <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                        <div className="p-3">
                                            <RequestCard
                                                request={request}
                                                userRole="student"
                                                currentUserId={user.id}
                                                onViewResponses={(req) => navigate(`/requests/${req.id}/responses`, { state: { request: req } })}
                                                onClick={() => navigate(`/requests/${request.id}/responses`, { state: { request } })}
                                            />
                                            <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                                                <button
                                                    onClick={() => navigate(`/requests/${request.id}/responses`, { state: { request } })}
                                                    className="flex-1 bg-gray-100 text-gray-900 text-xs font-semibold py-2 px-3 rounded-lg hover:bg-gray-200 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    View Responses ({request.responses_count || 0})
                                                </button>
                                                {request.status === 'open' && (
                                                    <button
                                                        onClick={() => navigate(`/requests/${request.id}/edit`, { state: { request } })}
                                                        className="px-3 py-2 bg-[#FF6B35]/10 text-[#FF6B35] text-xs font-semibold rounded-lg hover:bg-[#FF6B35]/20 active:scale-95 transition-all duration-200 flex items-center justify-center"
                                                    >
                                                        <Edit className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>

            {cancelBookingTarget && (
                <CancelBookingModal 
                    bookingInfo={cancelBookingTarget} 
                    onConfirm={handleCancelBooking} 
                    onClose={() => setCancelBookingTarget(null)} 
                />
            )}

            {verificationCode && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 pb-20" onClick={() => setVerificationCode(null)}>
                    <div className="bg-white rounded-lg w-full max-w-sm overflow-hidden shadow-lg" onClick={e => e.stopPropagation()}>
                        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-base font-bold text-gray-900">Verification Code</h2>
                            <button onClick={() => setVerificationCode(null)} className="p-2 -mr-2 rounded-lg hover:bg-gray-100 transition-colors">
                                <X className="w-5 h-5 text-gray-800" />
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
        </div>
    );
};

export default MyBookingsPage;
