import React, { useState, useMemo } from 'react';
import { Trainer, Class } from '../types';
import { Calendar, Clock, X, Info } from 'lucide-react';

interface BookingModalProps {
    bookingTarget: {
        trainer: Trainer;
        cls: Class;
    };
    onConfirmBooking: (trainerId: string, classId: number, startDate: Date, period: 'once' | '4weeks') => void;
    onClose: () => void;
}

const dayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount).replace(/\s/g, '');
  };

const BookingModal: React.FC<BookingModalProps> = ({ bookingTarget, onConfirmBooking, onClose }) => {
    const { trainer, cls } = bookingTarget;
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [bookingPeriod, setBookingPeriod] = useState<'once' | '4weeks'>('once');

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
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="bg-white rounded-2xl w-full max-w-sm transform animate-slide-up flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-5 border-b border-gray-200 relative flex-shrink-0">
                    <h2 className="text-lg font-bold text-gray-800 text-center">Schedule a Class</h2>
                    <p className="text-sm text-gray-500 text-center">{cls.name}</p>
                    <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100">
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
                
                <div className="p-5 overflow-y-auto">
                    {/* Date Picker */}
                    <div>
                        <div className="flex items-center text-md font-semibold text-gray-700 mb-2">
                            <Calendar className="w-5 h-5 mr-2 text-gray-400" />
                            Select a Start Date
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {upcomingDates.map(date => {
                                const dayOfWeek = dayMap[date.getDay()];
                                const isAvailable = availableScheduleDays.has(dayOfWeek);
                                const isSelected = selectedDate?.toDateString() === date.toDateString();

                                return (
                                    <button
                                        key={date.toISOString()}
                                        onClick={() => handleDateSelect(date)}
                                        disabled={!isAvailable}
                                        className={`flex-shrink-0 flex flex-col items-center justify-center h-20 rounded-xl transition-all duration-200
                                            ${isSelected 
                                                ? 'bg-[#FF6B35] text-white shadow-lg' 
                                                : isAvailable 
                                                ? 'bg-white text-gray-700 border border-gray-200 hover:bg-orange-50' 
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-70'
                                            }`}
                                    >
                                        <span className="text-sm font-medium">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                        <span className="text-2xl font-bold mt-1">{date.getDate()}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {selectedDate && (
                        <div className="animate-fade-in">
                            {/* Time Display */}
                            <div className="mt-5">
                                <div className="flex items-center text-md font-semibold text-gray-700 mb-2">
                                    <Clock className="w-5 h-5 mr-2 text-gray-400" />
                                    Class Time
                                </div>
                                <div className="bg-slate-100 text-slate-800 text-center text-lg font-bold p-3 rounded-lg">
                                    {cls.schedule?.time}
                                </div>
                            </div>
                            
                            {/* Booking Period */}
                             <div className="mt-5">
                                <h3 className="text-md font-semibold text-gray-700 mb-2">Booking Period</h3>
                                <div className="space-y-2">
                                    <label className="flex items-center p-3 rounded-lg border-2 has-[:checked]:border-orange-400 has-[:checked]:bg-orange-50 transition-colors">
                                        <input type="radio" name="booking-period" value="once" checked={bookingPeriod === 'once'} onChange={() => setBookingPeriod('once')} className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300" />
                                        <span className="ml-3 text-sm font-medium text-gray-700">Book single class</span>
                                    </label>
                                     <label className="flex items-center p-3 rounded-lg border-2 has-[:checked]:border-orange-400 has-[:checked]:bg-orange-50 transition-colors">
                                        <input type="radio" name="booking-period" value="4weeks" checked={bookingPeriod === '4weeks'} onChange={() => setBookingPeriod('4weeks')} className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300" />
                                        <span className="ml-3 text-sm font-medium text-gray-700">Enroll for 4 weeks</span>
                                    </label>
                                </div>
                                {bookingPeriod === '4weeks' && (
                                    <div className="flex items-start gap-2 p-2 mt-2 bg-blue-50 text-blue-700 rounded-lg text-xs">
                                        <Info className="w-4 h-4 mt-0.5 flex-shrink-0"/>
                                        <span>This will book all recurring classes for 4 weeks starting from your selected date.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Footer */}
                <div className="p-5 bg-gray-50 border-t border-gray-200 flex-shrink-0">
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedDate || !cls.schedule?.time}
                        className="w-full bg-[#FF6B35] text-white font-bold py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                        Confirm Booking for {formatVND(totalPrice)}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingModal;