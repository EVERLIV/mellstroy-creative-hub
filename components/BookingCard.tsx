import React from 'react';
import { Calendar, MapPin, Clock, MessageCircle, X, QrCode, Star, CheckCircle } from 'lucide-react';

interface BookingCardProps {
  booking: any;
  onCancel: (bookingId: string) => void;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onCancel }) => {
  const trainer = booking.trainer || {};
  const cls = booking.cls || {};
  const bookingData = booking.booking || {};

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      {/* Trainer Image */}
      <div className="relative">
        <img 
          className="h-48 w-full object-cover" 
          src={trainer.avatarUrl || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'} 
          alt={trainer.name || 'Trainer'} 
        />
        {bookingData.status === 'attended' && (
          <div className="absolute top-3 left-3 bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center shadow-sm">
            <CheckCircle className="w-3.5 h-3.5 mr-1" />
            Verified
          </div>
        )}
      </div>

      <div className="p-3">
        {/* Class Name & Trainer */}
        <div className="mb-2">
          <h3 className="text-sm font-bold text-gray-900">{cls.name || 'Class'}</h3>
          <p className="text-xs text-gray-600 mt-1">with {trainer.name || 'Trainer'}</p>
        </div>

        {/* Date & Time */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-3">
          <div className="flex items-center">
            <Calendar className="w-3.5 h-3.5 text-gray-500" />
            <span className="ml-1 text-xs text-gray-600">{bookingData.date}</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            <span className="ml-1 text-xs text-gray-600">{bookingData.time}</span>
          </div>
        </div>

        {/* Location */}
        {trainer.location && (
          <div className="flex items-center mb-3">
            <MapPin className="w-3.5 h-3.5 text-gray-500" />
            <span className="ml-1 text-xs text-gray-600">{trainer.location}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <button 
            onClick={() => {/* Handle chat */}}
            className="flex-1 bg-blue-600 text-white text-xs font-semibold py-2.5 px-3 rounded-lg hover:bg-blue-700 active:scale-95 transition-all duration-200 shadow-sm flex items-center justify-center gap-1.5"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Chat
          </button>
          
          {bookingData.status === 'booked' && (
            <>
              <button 
                onClick={() => onCancel(bookingData.id)}
                className="flex-1 bg-gray-100 text-gray-700 text-xs font-semibold py-2.5 px-3 rounded-lg hover:bg-gray-200 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
              {bookingData.verificationCode && (
                <button 
                  onClick={() => {/* Show QR code */}}
                  className="bg-orange-100 text-orange-700 text-xs font-semibold py-2.5 px-3 rounded-lg hover:bg-orange-200 active:scale-95 transition-all duration-200 flex items-center justify-center"
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
};

export default BookingCard;
