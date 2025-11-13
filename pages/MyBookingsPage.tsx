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
        <div className="bg-card rounded-2xl shadow-sm border border-border flex overflow-hidden">
            <div className="flex-1 p-4">
                <div className="flex items-start justify-between mb-2">
                    <div>
                        <h3 className="font-bold text-base text-foreground">{cls.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            {isStudentView ? `Trainer: ${trainer.username}` : `Student: ${student?.username || 'N/A'}`}
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

export default MyBookingsPage;