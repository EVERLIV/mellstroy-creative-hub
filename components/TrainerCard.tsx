import React from 'react';
import { Trainer } from '../types';
import { Star, ShieldCheck, MapPin, ArrowRight, Heart, Crown } from 'lucide-react';

const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0
  }).format(amount).replace(/\s/g, '');
};

const StarRating: React.FC<{ rating: number; starSize?: string }> = ({ rating, starSize = 'w-4 h-4' }) => {
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        // Full star
        if (rating >= starValue) {
          return <Star key={index} className={`${starSize} text-yellow-400 fill-yellow-400`} />;
        }
        // Partial star - Lucide doesn't easily support this, so we'll round for now.
        // A more complex solution with masking would be needed for partial fills.
        if (rating > index && rating < starValue) {
           return <Star key={index} className={`${starSize} text-yellow-400 fill-yellow-400`} />;
        }
        // Empty star
        return <Star key={index} className={`${starSize} text-gray-300 fill-gray-300`} />;
      })}
    </div>
  );
};

interface TrainerCardProps {
    trainer: Trainer;
    onSelect: () => void;
    isFavorite: boolean;
    onToggleFavorite: (trainerId: string) => void;
}

const TrainerCard: React.FC<TrainerCardProps> = ({ trainer, onSelect, isFavorite, onToggleFavorite }) => {

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(trainer.id);
  }

  return (
    <div 
      onClick={onSelect}
      className={`bg-white rounded-2xl shadow-md shadow-slate-200/60 overflow-hidden transform hover:-translate-y-1 transition-all duration-300 cursor-pointer relative ${trainer.isPremium ? 'border-2 border-amber-400' : ''}`}
    >
      <div className="relative">
        <img className="h-52 w-full object-cover" src={trainer.imageUrl} alt={trainer.name} />
        {trainer.isPremium && (
             <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center shadow-lg">
                <Crown className="w-4 h-4 mr-1.5" />
                PREMIUM
            </div>
        )}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 bg-white/70 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-all duration-200"
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`w-6 h-6 transition-all ${isFavorite ? 'text-red-500 fill-red-500' : 'text-slate-700'}`} />
        </button>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-x-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">{trainer.name}
              {trainer.verificationStatus === 'verified' && (
                  <ShieldCheck className="w-5 h-5 ml-1.5 text-blue-500 fill-blue-100 flex-shrink-0" />
              )}
            </h3>
            <p className="text-sm font-semibold text-blue-600 mt-1">{trainer.specialty.join(' / ')}</p>
          </div>
          <div className="flex-shrink-0 text-lg font-bold text-gray-900 text-right">
            {formatVND(trainer.price)}
            <span className="text-sm font-medium text-gray-500 block">/class</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-gray-500 border-t pt-3">
          <div className="flex items-center flex-wrap">
            <StarRating rating={trainer.rating} />
            <span className="ml-2 font-semibold text-gray-600">{trainer.rating.toFixed(1)}</span>
            <span className="text-gray-400 ml-1">({trainer.reviews} reviews)</span>
          </div>
          <div className="flex items-center">
             <MapPin className="w-4 h-4 text-gray-400" />
             <span className="ml-1">{trainer.location}</span>
          </div>
        </div>
        
         <button 
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="mt-4 w-full flex items-center justify-center bg-[#FF6B35] text-white font-bold py-3 px-4 rounded-xl hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition-all duration-200 shadow-md hover:shadow-lg">
            View Classes & Details
            <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default TrainerCard;