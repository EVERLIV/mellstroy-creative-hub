import React, { useState, useEffect } from 'react';
import { Trainer, Class, Booking, UserRole } from '../types';
import { X, Calendar, MapPin, Edit, QrCode, CheckCircle } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/hooks/useAuth';
import BookingVerificationDisplay from '../components/BookingVerificationDisplay';
import VerifyAttendanceModal from '../components/VerifyAttendanceModal';

type BookingInfo = { trainer: Trainer; cls: Class; booking: Booking; student?: Trainer };

interface CancelBookingModalProps {
    bookingInfo: BookingInfo;
    onConfirm: (trainerId: string, classId: number, date: string, time: string) => void;
    onClose: () => void;
}

const CancelBookingModal: React.FC<CancelBookingModalProps> = ({ bookingInfo, onConfirm, onClose }) => {
    const { trainer, cls, booking } = bookingInfo;

    const handleConfirm = () => {
        onConfirm(trainer.id, cls.id, booking.date, booking.time);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-gray-600 flex items-center justify-center z-50 p-4 pb-20 animate-fade-in" onClick={onClose}>
            <div className="bg-gray-100 rounded-lg w-full max-w-sm overflow-hidden transform animate-slide-up shadow-2xl border border-gray-300" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-gray-200 relative">
                    <h2 className="text-lg font-bold text-gray-800 text-center">Cancel Booking</h2>
                    <p className="text-sm text-gray-500 text-center">{cls.name}</p>
                    <p className="text-xs text-gray-500 text-center mt-1">{booking.date} at {booking.time}</p>
                    <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100">
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
                <div className="p-5">
                    <p className="text-center text-gray-700">Are you sure you want to cancel this class session? This action cannot be undone.</p>
                </div>
                <div className="p-5 bg-gray-50 border-t border-gray-200 grid grid-cols-2 gap-3">
                     <button onClick={onClose} className="w-full bg-white border border-gray-300 text-gray-700 font-bold py-2.5 rounded-xl transition-colors hover:bg-gray-100">
                        Keep Booking
                    </button>
                    <button onClick={handleConfirm} className="w-full bg-red-500 text-white font-bold py-2.5 rounded-xl transition-colors hover:bg-red-600">
                        Confirm Cancellation
                    </button>
                </div>
            </div>
        </div>
    );
};

interface BookedClassCardProps {
    bookingInfo: BookingInfo;
    onOpenChat: (personToChatWith: Trainer, context: { classId: number; className: string; bookingDate: string; studentId: string; }) => void;
    onStartCancellation: (bookingInfo: BookingInfo) => void;
    onOpenReviewModal: (trainer: Trainer, cls: Class, booking: Booking) => void;
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
        <div className="bg-white rounded-2xl shadow-md shadow-slate-200/60 flex overflow-hidden">
            <img src={cls.imageUrl} alt={cls.name} className="w-28 h-auto object-cover flex-shrink-0" />
            <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                    <p className="text-xs font-semibold text-gray-500">{isStudentView ? trainer.name : student?.name}</p>
                    <h3 className="text-base font-bold text-gray-900 leading-tight mt-0.5 line-clamp-1">{cls.name}</h3>
                    
                    <div className="mt-2 space-y-1.5 text-xs text-gray-600">
                        <div className="flex items-center">
                            <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{booking.date} at {booking.time}</span>
                        </div>
                        <div className="flex items-center">
                            <MapPin className="w-3.5 h-3.5 mr-1.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{trainer.location}</span>
                        </div>
                    </div>
                </div>
                <div className="mt-3 flex items-center space-x-2">
                    {booking.status === 'booked' && (
                        <>
                            <button onClick={handleChatClick} className="flex-1 text-center bg-blue-50 text-blue-700 text-xs font-bold py-2 px-2 rounded-lg hover:bg-blue-100 transition-colors duration-200">
                                Chat
                            </button>
                             {isStudentView ? (
                                <>
                                    {(booking as any).verification_code && (
                                        <button 
                                            onClick={() => onShowVerificationCode && onShowVerificationCode((booking as any).verification_code, (booking as any).id)}
                                            className="flex-1 text-center bg-orange-50 text-orange-700 text-xs font-bold py-2 px-2 rounded-lg hover:bg-orange-100 transition-colors duration-200 flex items-center justify-center gap-1"
                                        >
                                            <QrCode className="w-3 h-3" />
                                            Code
                                        </button>
                                    )}
                                    <button onClick={() => onStartCancellation(bookingInfo)} className="flex-1 text-center bg-slate-100 text-slate-700 text-xs font-bold py-2 px-2 rounded-lg hover:bg-slate-200 transition-colors duration-200">
                                        Cancel
                                    </button>
                                </>
                             ) : (
                                <button 
                                    onClick={onVerifyAttendance}
                                    className="flex-1 text-center bg-green-50 text-green-700 text-xs font-bold py-2 px-2 rounded-lg hover:bg-green-100 transition-colors duration-200 flex items-center justify-center gap-1"
                                >
                                    <CheckCircle className="w-3 h-3" />
                                    Verify
                                </button>
                             )}
                        </>
                    )}
                    {booking.status === 'attended' && isStudentView && (
                        !booking.hasLeftReview ? (
                            <button onClick={() => onOpenReviewModal(trainer, cls, booking)} className="w-full flex items-center justify-center bg-amber-400 text-white text-xs font-bold py-2 px-2 rounded-lg hover:bg-amber-500 transition-colors duration-200">
                                <Edit className="w-3 h-3 mr-1.5" /> Leave a Review
                            </button>
                        ) : (
                            <p className="text-xs text-center font-semibold text-green-600 w-full py-2">Review Submitted</p>
                        )
                    )}
                    {booking.status === 'cancelled' && (
                        <p className="text-xs text-center font-semibold text-red-500 w-full py-2">Cancelled</p>
                    )}
                </div>
            </div>
        </div>
    );
}

interface MyBookingsPageProps {
    trainers: Trainer[];
    onOpenChat: (personToChatWith: Trainer, context: { classId: number; className: string; bookingDate: string; studentId: string; }) => void;
    onCancelBooking: (trainerId: string, classId: number, bookingDate: string, bookingTime: string) => void;
    currentUserId: string;
    currentUser: Trainer;
    userRole: UserRole;
    onOpenReviewModal: (trainer: Trainer, cls: Class, booking: Booking) => void;
}

const monthMap: { [key: string]: number } = {
  'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
  'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
};

const parseBookingDateTime = (booking: Booking): Date => {
    const currentYear = new Date().getFullYear();
    const dateParts = booking.date.split(' '); // e.g., "Mon," "08" "Jul"
    const dayOfMonth = parseInt(dateParts[1], 10);
    const monthName = dateParts[2];
    const monthIndex = monthMap[monthName];

    if (monthIndex === undefined) {
        // Fallback for invalid month, return a date in the past
        return new Date(0);
    }

    // To create a Date object that correctly represents a specific time in a specific timezone (UTC+7 for Saigon),
    // we construct an ISO 8601 string with the timezone offset. This avoids client-side timezone issues.
    const isoMonth = String(monthIndex + 1).padStart(2, '0');
    const isoDay = String(dayOfMonth).padStart(2, '0');
    
    // The format is YYYY-MM-DDTHH:mm:ss+07:00
    const isoString = `${currentYear}-${isoMonth}-${isoDay}T${booking.time}:00+07:00`;
    
    return new Date(isoString);
};

const MyBookingsPage: React.FC<MyBookingsPageProps> = ({ trainers, onOpenChat, onCancelBooking, currentUserId, currentUser, userRole, onOpenReviewModal }) => {
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [bookingToCancel, setBookingToCancel] = useState<BookingInfo | null>(null);
    const [verificationCodeModal, setVerificationCodeModal] = useState<{ code: string; bookingId: string } | null>(null);
    const [verifyAttendanceModal, setVerifyAttendanceModal] = useState(false);
    const { user } = useAuth();
    const [bookings, setBookings] = useState<BookingInfo[]>([]);
    const [loading, setLoading] = useState(true);

    // Load bookings from database
    useEffect(() => {
        loadBookings();
    }, [user?.id, userRole]);

    const loadBookings = async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            
            if (userRole === 'student') {
                // Student view - load their bookings
                const { data, error } = await supabase
                    .from('bookings')
                    .select(`
                        *,
                        class:classes(*),
                        trainer:classes(trainer_id, profiles(*))
                    `)
                    .eq('client_id', user.id)
                    .order('booking_date', { ascending: true });

                if (error) throw error;

                const bookingsData: BookingInfo[] = (data || []).map(b => ({
                    booking: {
                        id: b.id,
                        userId: b.client_id,
                        date: new Date(b.booking_date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            day: '2-digit', 
                            month: 'short' 
                        }).replace(/,/g, ','),
                        time: b.booking_time,
                        status: b.status,
                        hasLeftReview: b.has_left_review,
                        verification_code: b.verification_code,
                        verified_at: b.verified_at,
                    } as any,
                    cls: {
                        id: (b.class as any).id,
                        name: (b.class as any).name,
                        description: (b.class as any).description || '',
                        duration: (b.class as any).duration_minutes,
                        price: Number((b.class as any).price),
                        imageUrl: (b.class as any).image_url || '',
                        imageUrls: (b.class as any).image_urls || [],
                        capacity: (b.class as any).capacity,
                        classType: (b.class as any).class_type,
                        schedule: (b.class as any).schedule_days && (b.class as any).schedule_time ? {
                            days: (b.class as any).schedule_days,
                            time: (b.class as any).schedule_time
                        } : undefined,
                    } as Class,
                    trainer: {
                        id: (b.class as any).trainer_id,
                        name: '',
                        specialty: [],
                        rating: 0,
                        reviews: 0,
                        location: '',
                        price: 0,
                        imageUrl: '',
                        verificationStatus: 'unverified',
                        isPremium: false,
                        bio: '',
                        classes: [],
                        reviewsData: [],
                        chatHistory: []
                    } as Trainer
                }));

                setBookings(bookingsData);
            } else {
                // Trainer view - load bookings for their classes
                const { data: classes, error: classesError } = await supabase
                    .from('classes')
                    .select('id')
                    .eq('trainer_id', user.id);

                if (classesError) throw classesError;

                const classIds = (classes || []).map(c => c.id);

                if (classIds.length > 0) {
                    const { data, error } = await supabase
                        .from('bookings')
                        .select(`
                            *,
                            class:classes(*),
                            student:profiles!bookings_client_id_fkey(*)
                        `)
                        .in('class_id', classIds)
                        .order('booking_date', { ascending: true });

                    if (error) throw error;

                    const bookingsData: BookingInfo[] = (data || []).map(b => ({
                        booking: {
                            id: b.id,
                            userId: b.client_id,
                            date: new Date(b.booking_date).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                day: '2-digit', 
                                month: 'short' 
                            }).replace(/,/g, ','),
                            time: b.booking_time,
                            status: b.status,
                            hasLeftReview: b.has_left_review,
                            verification_code: b.verification_code,
                            verified_at: b.verified_at,
                        } as any,
                        cls: {
                            id: (b.class as any).id,
                            name: (b.class as any).name,
                            description: (b.class as any).description || '',
                            duration: (b.class as any).duration_minutes,
                            price: Number((b.class as any).price),
                            imageUrl: (b.class as any).image_url || '',
                            imageUrls: (b.class as any).image_urls || [],
                            capacity: (b.class as any).capacity,
                            classType: (b.class as any).class_type,
                        } as Class,
                        trainer: currentUser,
                        student: b.student ? {
                            id: (b.student as any).id,
                            name: (b.student as any).username,
                            specialty: [],
                            rating: 0,
                            reviews: 0,
                            location: '',
                            price: 0,
                            imageUrl: (b.student as any).avatar_url || '',
                            verificationStatus: 'unverified',
                            isPremium: false,
                            bio: '',
                            classes: [],
                            reviewsData: [],
                            chatHistory: []
                        } as Trainer : undefined
                    }));

                    setBookings(bookingsData);
                }
            }
        } catch (error) {
            // Silent fail
        } finally {
            setLoading(false);
        }
    };

    const getBookings = () => {
        return bookings;
    };
    
    const allBookings = getBookings();
    const now = new Date();

    const upcomingClasses = allBookings.filter(b => {
        const bookingDateTime = parseBookingDateTime(b.booking);
        return b.booking.status === 'booked' && bookingDateTime > now;
    });

    const pastClasses = allBookings.filter(b => {
        const bookingDateTime = parseBookingDateTime(b.booking);
        // A class is "past" if it's already marked attended/cancelled,
        // or if it was booked but the time has now passed.
        return b.booking.status === 'attended' ||
               b.booking.status === 'cancelled' ||
               (b.booking.status === 'booked' && bookingDateTime <= now);
    }).reverse(); // Show most recent past classes first
    
    const handleConfirmCancellation = (trainerId: string, classId: number, date: string, time: string) => {
        onCancelBooking(trainerId, classId, date, time);
        setBookingToCancel(null);
    };

    const displayedClasses = activeTab === 'upcoming' ? upcomingClasses : pastClasses;
    const pageTitle = userRole === 'student' ? "My Bookings" : "My Schedule";

    return (
        <div className="bg-slate-100 h-full overflow-y-auto">
            <div className="p-4 pt-6 pb-[calc(5rem+env(safe-area-inset-bottom))]">
                <h1 className="text-2xl font-bold text-slate-800 text-center mb-4">{pageTitle}</h1>
                <div className="bg-slate-200 p-1 rounded-xl grid grid-cols-2 gap-1 mb-4">
                    <button onClick={() => setActiveTab('upcoming')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'upcoming' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
                        Upcoming
                    </button>
                    <button onClick={() => setActiveTab('past')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'past' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
                        Past
                    </button>
                </div>
                
                {displayedClasses.length > 0 ? (
                    <div className="space-y-4">
                        {displayedClasses.map((bookingInfo) => (
                            <BookedClassCard 
                                key={`${bookingInfo.cls.id}-${bookingInfo.booking.date}-${bookingInfo.booking.time}-${bookingInfo.booking.userId}`} 
                                bookingInfo={bookingInfo}
                                onOpenChat={onOpenChat}
                                onStartCancellation={setBookingToCancel}
                                onOpenReviewModal={onOpenReviewModal}
                                userRole={userRole}
                                onShowVerificationCode={(code, bookingId) => setVerificationCodeModal({ code, bookingId })}
                                onVerifyAttendance={() => setVerifyAttendanceModal(true)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center mt-20">
                        <p className="font-semibold text-gray-600">No {activeTab} classes</p>
                        <p className="text-sm text-gray-400 mt-2">
                           {activeTab === 'upcoming' 
                             ? (userRole === 'student' ? "You haven't booked any classes yet." : "No upcoming classes booked by students.")
                             : "No completed or past classes yet."}
                        </p>
                    </div>
                )}
            </div>
            
            {bookingToCancel && (
                <CancelBookingModal 
                    bookingInfo={bookingToCancel}
                    onConfirm={handleConfirmCancellation}
                    onClose={() => setBookingToCancel(null)}
                />
            )}
            
            {verificationCodeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900">Your Verification Code</h2>
                            <button
                                onClick={() => setVerificationCodeModal(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                        <div className="p-6">
                            <BookingVerificationDisplay 
                                verificationCode={verificationCodeModal.code}
                                bookingId={verificationCodeModal.bookingId}
                            />
                        </div>
                    </div>
                </div>
            )}

            {verifyAttendanceModal && user && (
                <VerifyAttendanceModal
                    isOpen={verifyAttendanceModal}
                    onClose={() => setVerifyAttendanceModal(false)}
                    onVerified={() => {
                        setVerifyAttendanceModal(false);
                        loadBookings(); // Reload bookings after verification
                    }}
                    trainerId={user.id}
                />
            )}
        </div>
    );
};

export default MyBookingsPage;