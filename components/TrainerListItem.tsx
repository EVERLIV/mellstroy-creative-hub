import React, { useState } from 'react';
import { Trainer } from '../types';
import { Star, ShieldCheck, MapPin, Heart, Crown, Circle, Clock } from 'lucide-react';
import { getTimeAgo, isOnline } from '../src/utils/onlineStatus';


const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0
  }).format(amount).replace(/\s/g, '');
};

interface TrainerListItemProps {
    trainer: Trainer;
    onSelect: () => void;
    isFavorite: boolean;
    onToggleFavorite: (trainerId: string) => void;
}

const TrainerListItem: React.FC<TrainerListItemProps> = React.memo(({ trainer, onSelect, isFavorite, onToggleFavorite }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(trainer.id);
  }

  return (
    <div 
      onClick={onSelect} 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`bg-white rounded-lg shadow-sm p-3 flex flex-col transition-all duration-300 cursor-pointer border-2 ${
        trainer.isPremium ? 'border-amber-400 bg-gradient-to-r from-amber-50/30 to-transparent' : 'border-gray-200'
      } ${
        isHovered ? 'shadow-md -translate-y-0.5 border-orange-300' : 'hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      <div className="flex justify-between items-start gap-2 mb-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          {trainer.isPremium && <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />}
          <h3 className="text-sm font-bold text-gray-900">{trainer.name}</h3>
          {trainer.verificationStatus === 'verified' && (
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-100 flex-shrink-0" />
          )}
        </div>
        <button
          onClick={handleFavoriteClick}
          className="flex-shrink-0 p-1.5 rounded-full hover:bg-gray-100 transition-all duration-200"
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`w-4 h-4 transition-all ${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-700'}`} />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          {/* Online Status & Experience */}
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            {trainer.lastSeen != null && trainer.lastSeen !== undefined && (
              <div className="flex items-center gap-1">
                {isOnline(trainer.lastSeen) ? (
                  <>
                    <Circle className="w-2 h-2 text-green-500 fill-green-500" />
                    <span className="text-xs text-green-600 font-medium">Online</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-2.5 h-2.5 text-gray-400" />
                    <span className="text-xs text-gray-500">{getTimeAgo(trainer.lastSeen) || 'offline'}</span>
                  </>
                )}
              </div>
            )}
            {trainer.experienceYears && (
              <div className="text-xs text-gray-600">
                {trainer.experienceYears} {trainer.experienceYears === 1 ? 'year' : 'years'} exp
              </div>
            )}
            <div className="flex-shrink-0 text-right ml-auto">
              <div className="text-sm font-bold text-gray-900">{formatVND(trainer.price)}</div>
              <span className="text-xs text-gray-500">/class</span>
            </div>
          </div>
          
          {/* Short Description */}
          {trainer.shortDescription && (
            <p className="text-xs text-gray-600 line-clamp-2 mb-2">{trainer.shortDescription}</p>
          )}

          {/* Categories Section */}
          {trainer.specialty && trainer.specialty.length > 0 && (
            <div className="mb-2">
              <div className="flex flex-wrap gap-1.5">
                {trainer.specialty.map((category, index) => (
                  <span
                    key={index}
                    className="px-2.5 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap mt-2">
            <div className="flex items-center">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="ml-1 font-semibold text-gray-900">{trainer.rating.toFixed(1)}</span>
              <span className="text-gray-500 ml-1">({trainer.reviews})</span>
            </div>
            <div className="flex items-center">
              <MapPin className="w-3 h-3 text-gray-500" />
              <span className="ml-1">{trainer.location}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="mt-3 w-full text-center bg-[#FF6B35] text-white text-xs font-semibold py-2 px-3 rounded-lg hover:bg-orange-600 active:scale-95 transition-all duration-200 shadow-sm"
        >
          View Details
        </button>
      </div>
    </div>
  );
});

TrainerListItem.displayName = 'TrainerListItem';

export default TrainerListItem;
