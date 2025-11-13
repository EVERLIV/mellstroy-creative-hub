import React from 'react';
import { Venue } from '../types';
import { MapPin, Star, Clock, Users, ArrowRight } from 'lucide-react';

interface VenueCardProps {
    venue: Venue;
    onSelect: () => void;
}

const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0
    }).format(amount).replace(/\s/g, '');
};

const categoryLabels: Record<Venue['category'], string> = {
    tennis: 'Tennis',
    pickleball: 'Pickleball',
    golf: 'Golf',
    boxing: 'Boxing',
    gym: 'Gym',
    billiards: 'Billiards',
    basketball: 'Basketball',
    swimming: 'Swimming',
    yoga: 'Yoga',
    other: 'Other'
};

const VenueCard: React.FC<VenueCardProps> = React.memo(({ venue, onSelect }) => {
    return (
        <div 
            onClick={onSelect}
            className="bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 cursor-pointer border border-gray-200 hover:shadow-md hover:-translate-y-0.5 hover:border-orange-300"
        >
            <div className="relative">
                <img 
                    className="h-48 w-full object-cover" 
                    src={venue.imageUrl} 
                    alt={venue.name} 
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-[#FF6B35] text-white text-xs font-bold rounded-full">
                    {categoryLabels[venue.category]}
                </div>
            </div>
            <div className="p-3">
                <h3 className="text-sm font-bold text-gray-900 mb-1">{venue.name}</h3>
                
                <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-[#FF6B35]" />
                    <span>{venue.district}</span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="ml-1 text-xs font-semibold text-gray-900">{venue.rating.toFixed(1)}</span>
                        <span className="text-xs text-gray-500 ml-1">({venue.reviews})</span>
                    </div>
                    {venue.trainerAvailability && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            Trainers Available
                        </span>
                    )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div>
                        <div className="text-xs text-gray-500">Starting from</div>
                        <div className="text-sm font-bold text-gray-900">{formatVND(venue.pricePerHour)}/hour</div>
                    </div>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect();
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#FF6B35] text-white text-xs font-semibold rounded-lg hover:bg-orange-600 active:scale-95 transition-all duration-200 shadow-sm"
                    >
                        View Details
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
});

VenueCard.displayName = 'VenueCard';

export default VenueCard;

