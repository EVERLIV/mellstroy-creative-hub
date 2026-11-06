import React, { useState, useMemo } from 'react';
import { Trainer, Class } from '../types';
import { Calendar, Clock, X, Info, Shield } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { formatVND } from '@/src/lib/format';
import { Button } from '@/src/components/ui/button';
import { Checkbox } from '@/src/components/ui/checkbox';

interface BookingModalProps {
    bookingTarget: {
        trainer: Trainer;
        cls: Class;
    };
    onConfirmBooking: (trainerId: string, classId: number, startDate: Date, period: 'once' | '4weeks') => void;
    onClose: () => void;
}

const dayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];


const BookingModal: React.FC<BookingModalProps> = ({ bookingTarget, onConfirmBooking, onClose }) => {
    const { trainer, cls } = bookingTarget;
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [bookingPeriod, setBookingPeriod] = useState<'once' | '4weeks'>('once');
    const [acceptPrivacy, setAcceptPrivacy] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);

    const availableScheduleDays = useMemo(() => new Set(cls.schedule?.days || []), [cls.schedule]);

    const upcomingDates = useMemo(() => {
        const dates: Date[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start from today
        for (let i = 0; i < 14; i++) { // Show next 2 weeks for selection
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            dates.push(date);
        }
        return dates;
    }, []);

    const handleDateSelect = (date: Date) => {
        const dayOfWeek = dayMap[date.getDay()];
        if (availableScheduleDays.has(dayOfWeek)) {
            setSelectedDate(date);
        }
    };

    const handleConfirm = () => {
        if (selectedDate && cls.schedule?.time) {
            onConfirmBooking(trainer.id, cls.id, selectedDate, bookingPeriod);
        }
    };

    const totalPrice = useMemo(() => {
        if (!selectedDate || !cls.schedule) return cls.price;
        if (bookingPeriod === 'once') return cls.price;

        const scheduledDaysCount = cls.schedule.days.length;
        return cls.price * scheduledDaysCount * 4; // 4 weeks
    }, [bookingPeriod, selectedDate, cls.price, cls.schedule]);


    return (
        <div
            className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/60 p-4 pb-20 md:pb-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="flex max-h-[85vh] w-full max-w-md transform animate-slide-up flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl md:max-w-xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="relative flex-shrink-0 border-b border-border p-4 text-center">
                    <h2 className="text-base font-semibold text-foreground md:text-lg">Schedule a Class</h2>
                    <p className="text-sm text-muted-foreground">{cls.name}</p>
                    <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close" className="absolute right-2 top-2">
                        <X />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    {/* Date Picker */}
                    <div>
                        <h3 className="mb-2 flex items-center text-sm font-semibold text-foreground">
                            <Calendar className="mr-2 h-5 w-5 text-muted-foreground" />
                            Select a Start Date
                        </h3>
                        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                            {upcomingDates.map(date => {
                                const dayOfWeek = dayMap[date.getDay()];
                                const isAvailable = availableScheduleDays.has(dayOfWeek);
                                const isSelected = selectedDate?.toDateString() === date.toDateString();

                                return (
                                    <button
                                        key={date.toISOString()}
                                        onClick={() => handleDateSelect(date)}
                                        disabled={!isAvailable}
                                        type="button"
                                        aria-pressed={isSelected}
                                        className={cn(
                                            'flex h-20 flex-shrink-0 flex-col items-center justify-center rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-[4.5rem]',
                                            isSelected
                                                ? 'bg-primary text-primary-foreground shadow-lg'
                                                : isAvailable
                                                  ? 'border border-border bg-card text-foreground hover:bg-primary/10'
                                                  : 'cursor-not-allowed bg-muted text-muted-foreground opacity-70'
                                        )}
                                    >
                                        <span className="text-sm font-medium">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                        <span className="mt-1 text-2xl font-bold sm:text-xl">{date.getDate()}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {selectedDate && (
                        <div className="animate-fade-in">
                            {/* Time Display */}
                            <div className="mt-5">
                                <h3 className="mb-2 flex items-center text-sm font-semibold text-foreground">
                                    <Clock className="mr-2 h-5 w-5 text-muted-foreground" />
                                    Class Time
                                </h3>
                                <div className="rounded-lg bg-muted p-3 text-center text-lg font-bold text-foreground">
                                    {cls.schedule?.time}
                                </div>
                            </div>

                            {/* Booking Period */}
                             <div className="mt-5">
                                <h3 className="mb-2 text-sm font-semibold text-foreground">Booking Period</h3>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    <label className="flex cursor-pointer items-center rounded-lg border-2 border-border p-3 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                                        <input type="radio" name="booking-period" value="once" checked={bookingPeriod === 'once'} onChange={() => setBookingPeriod('once')} className="h-4 w-4 accent-primary" />
                                        <span className="ml-3 text-sm font-medium text-foreground">Book single class</span>
                                    </label>
                                     <label className="flex cursor-pointer items-center rounded-lg border-2 border-border p-3 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                                        <input type="radio" name="booking-period" value="4weeks" checked={bookingPeriod === '4weeks'} onChange={() => setBookingPeriod('4weeks')} className="h-4 w-4 accent-primary" />
                                        <span className="ml-3 text-sm font-medium text-foreground">Enroll for 4 weeks</span>
                                    </label>
                                </div>
                                {bookingPeriod === '4weeks' && (
                                    <div className="flex items-start gap-2 p-2 mt-2 bg-primary/10 text-primary rounded-lg text-xs">
                                        <Info className="w-4 h-4 mt-0.5 flex-shrink-0"/>
                                        <span>This will book all recurring classes for 4 weeks starting from your selected date.</span>
                                    </div>
                                 )}
                            </div>

                            {/* Privacy Policy & Terms */}
                            <div className="mt-5 space-y-3">
                                <div className="flex items-center gap-2 text-foreground">
                                    <Shield className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                    <h3 className="text-sm font-semibold">Agreements</h3>
                                </div>
                                <label htmlFor="booking-accept-privacy" className="flex cursor-pointer items-start gap-3 rounded-lg border-2 border-border p-3 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/10">
                                    <Checkbox
                                        id="booking-accept-privacy"
                                        checked={acceptPrivacy}
                                        onCheckedChange={(checked) => setAcceptPrivacy(checked === true)}
                                        className="mt-0.5"
                                    />
                                    <span className="text-xs text-muted-foreground leading-relaxed">
                                        I have read and accept the <span className="font-semibold text-primary">Privacy Policy</span>
                                    </span>
                                </label>
                                <label htmlFor="booking-accept-terms" className="flex cursor-pointer items-start gap-3 rounded-lg border-2 border-border p-3 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/10">
                                    <Checkbox
                                        id="booking-accept-terms"
                                        checked={acceptTerms}
                                        onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                                        className="mt-0.5"
                                    />
                                    <span className="text-xs text-muted-foreground leading-relaxed">
                                        I acknowledge the <span className="font-semibold text-primary">booking terms</span> and cancellation policy
                                    </span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 border-t border-border bg-muted/50 p-4">
                    <Button
                        size="lg"
                        onClick={handleConfirm}
                        disabled={!selectedDate || !cls.schedule?.time || !acceptPrivacy || !acceptTerms}
                        className="w-full"
                    >
                        Confirm Booking for {formatVND(totalPrice)}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default BookingModal;