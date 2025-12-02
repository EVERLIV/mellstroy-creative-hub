import React from 'react';
import { Calendar, MapPin, Clock, MessageCircle, X, QrCode, Star, CheckCircle } from 'lucide-react';

interface BookingCardProps {
  booking: any;
  onCancel: (bookingId: string) => void;
  onShowQR?: (booking: any) => void;
  onChat?: (booking: any) => void;
}

const BookingCard: React.FC<BookingCardProps> = React.memo(({ booking, onCancel, onShowQR, onChat }) => {
  const trainer = booking.trainer || {};
  const cls = booking.cls || {};
  const bookingData = booking.booking || {};

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      <div className="p-3">
        {/* Status Badge */}
        {bookingData.status === 'attended' && (
          <div className="mb-3 inline-flex items-center bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold px-2.5 py-1 rounded-full">
            <CheckCircle className="w-3.5 h-3.5 mr-1" />
            Verified
          </div>
        )}

        {/* Class Name & Trainer */}
        <div className="mb-3">
          <h3 className="text-sm font-bold text-foreground">{cls.name || 'Class'}</h3>
          <p className="text-xs text-muted-foreground mt-1">with {trainer.name || 'Trainer'}</p>
        </div>

        {/* Date & Time */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-3">
          <div className="flex items-center">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="ml-1 text-xs text-foreground">{bookingData.date}</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="ml-1 text-xs text-foreground">{bookingData.time}</span>
          </div>
        </div>

        {/* Location */}
        {trainer.location && (
          <div className="flex items-center mb-3 pb-3 border-b border-border">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="ml-1 text-xs text-foreground">{trainer.location}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button 
            onClick={() => onChat?.(booking)}
            className="flex-1 bg-primary text-primary-foreground text-xs font-semibold py-2.5 px-3 rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Chat
          </button>
          
          {bookingData.status === 'booked' && (
            <>
              <button 
                onClick={() => onCancel(bookingData.id)}
                className="flex-1 bg-secondary text-secondary-foreground text-xs font-semibold py-2.5 px-3 rounded-lg hover:bg-secondary/80 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
              {bookingData.verificationCode && (
                <button 
                  onClick={() => onShowQR?.(booking)}
                  className="bg-accent/10 text-accent-foreground text-xs font-semibold py-2.5 px-3 rounded-lg hover:bg-accent/20 active:scale-95 transition-all duration-200 flex items-center justify-center"
                >
                  <QrCode className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
});

BookingCard.displayName = 'BookingCard';

export default BookingCard;
