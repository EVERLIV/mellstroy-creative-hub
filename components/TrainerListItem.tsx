import React from 'react';
import { Trainer } from '../types';
import { Star, ShieldCheck, MapPin, Heart, Crown } from 'lucide-react';


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

const TrainerListItem: React.FC<TrainerListItemProps> = ({ trainer, onSelect, isFavorite, onToggleFavorite }) => {
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(trainer.id);
  }

  return (
    <div onClick={onSelect} className={`bg-white rounded-xl shadow-md shadow-slate-200/60 p-3 flex space-x-4 items-start transform hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative ${trainer.isPremium ? 'border-l-4 border-amber-400' : ''}`}>
      <div className="relative flex-shrink-0">
        <img
          src={trainer.imageUrl}
          alt={trainer.name}
          className="w-24 h-24 object-cover rounded-lg"
        />
        <button
          onClick={handleFavoriteClick}
          className="absolute top-1.5 right-1.5 bg-white/60 backdrop-blur-sm p-1.5 rounded-full hover:bg-white transition-all duration-200"
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`w-5 h-5 transition-all ${isFavorite ? 'text-red-500 fill-red-500' : 'text-slate-700'}`} />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                {trainer.isPremium && <Crown className="w-4 h-4 mr-1.5 text-amber-500 flex-shrink-0" />}
                <h3 className="text-base font-bold text-gray-800 truncate">{trainer.name}</h3>
                {trainer.verificationStatus === 'verified' && <ShieldCheck className="w-4 h-4 ml-1.5 text-blue-500 fill-blue-100 flex-shrink-0" />}
              </div>
              <p className="text-xs font-semibold text-[#4A90E2] mt-0.5">{trainer.specialty.join(' / ')}</p>
            </div>
            <div className="flex-shrink-0 text-base font-bold text-gray-900 text-right">
              {formatVND(trainer.price)}
              <span className="text-xs font-medium text-gray-500 block">/class</span>
            </div>
          </div>
          <div className="flex items-center mt-2 text-xs text-gray-500 flex-wrap">
            <div className="flex items-center mr-3">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              <span className="ml-1 font-semibold">{trainer.rating.toFixed(1)}</span>
              <span className="text-gray-400 ml-1">({trainer.reviews})</span>
            </div>
            <div className="flex items-center">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span className="ml-1">{trainer.location}</span>
            </div>
          </div>
        </div>
        <button className="mt-3 w-full text-center bg-[#FF6B35] text-white text-sm font-bold py-2 px-3 rounded-lg hover:bg-orange-600 transition-colors duration-200">
            View Details
        </button>
      </div>
    </div>
  );
};

export default TrainerListItem;