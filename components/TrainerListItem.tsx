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
      className={`bg-white rounded-lg shadow-sm p-3 flex gap-3 items-start transition-all duration-300 cursor-pointer border border-gray-200 ${
        trainer.isPremium ? 'border-l-4 border-l-amber-400' : ''
      } ${
        isHovered ? 'shadow-md -translate-y-0.5 border-orange-300' : 'hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      <div className="relative flex-shrink-0">
        <img
          src={trainer.imageUrl}
          alt={trainer.name}
          className={`w-20 h-20 object-cover rounded-lg transition-transform duration-300 ${
            isHovered ? 'scale-105' : 'scale-100'
          }`}
        />
        <button
          onClick={handleFavoriteClick}
          className="absolute top-1 right-1 bg-white p-1.5 rounded-full hover:bg-gray-100 transition-all duration-200 shadow-sm"
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`w-4 h-4 transition-all ${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-700'}`} />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex justify-between items-start gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                {trainer.isPremium && <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                <h3 className="text-sm font-bold text-gray-900 truncate">{trainer.name}</h3>
                {trainer.verificationStatus === 'verified' && (
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-100 flex-shrink-0" />
                )}
                {/* Online Status */}
                {trainer.lastSeen != null && trainer.lastSeen !== undefined && (
                  <div className="flex items-center gap-1">
                    {isOnline(trainer.lastSeen) ? (
                      <div className="flex items-center gap-1">
                        <Circle className="w-2 h-2 text-green-500 fill-green-500" />
                        <span className="text-xs text-green-600 font-medium">Online</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-gray-400" />
                        <span className="text-xs text-gray-500">{getTimeAgo(trainer.lastSeen) || 'offline'}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Experience Years */}
              {trainer.experienceYears && (
                <div className="text-xs text-gray-600 mb-1">
                  {trainer.experienceYears} {trainer.experienceYears === 1 ? 'year' : 'years'} of experience
                </div>
              )}
              {/* Short Description */}
              {trainer.shortDescription && (
                <p className="text-xs text-gray-600 line-clamp-2 mb-1">{trainer.shortDescription}</p>
              )}
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="text-sm font-bold text-gray-900">{formatVND(trainer.price)}</div>
              <span className="text-xs text-gray-500">/class</span>
            </div>
          </div>

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
