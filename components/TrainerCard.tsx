import React, { useState, useEffect } from 'react';
import { Trainer } from '../types';
import { Star, ShieldCheck, MapPin, ArrowRight, Heart, Crown, Award, FileText, Circle, Clock } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { getTimeAgo, isOnline } from '../src/utils/onlineStatus';

const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0
  }).format(amount).replace(/\s/g, '');
};

const StarRating: React.FC<{ rating: number; starSize?: string }> = React.memo(({ rating, starSize = 'w-3 h-3' }) => {
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        if (rating >= starValue) {
          return <Star key={index} className={`${starSize} text-yellow-400 fill-yellow-400`} />;
        }
        return <Star key={index} className={`${starSize} text-gray-300 fill-gray-300`} />;
      })}
    </div>
  );
});

StarRating.displayName = 'StarRating';

interface TrainerCardProps {
    trainer: Trainer;
    onSelect: () => void;
    isFavorite: boolean;
    onToggleFavorite: (trainerId: string) => void;
}

const TrainerCard: React.FC<TrainerCardProps> = React.memo(({ trainer, onSelect, isFavorite, onToggleFavorite }) => {
  const [verifiedDocuments, setVerifiedDocuments] = useState<any[]>([]);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        // TODO: Re-enable when trainer_documents table is created
        /* const { data } = await supabase
          .from('trainer_documents')
          .select('*')
          .eq('trainer_id', trainer.id)
          .eq('is_verified', true)
          .order('created_at', { ascending: false })
          .limit(3); */
        const data: any[] = [];

        setVerifiedDocuments(data || []);
      } catch (error) {
        console.error('Error loading documents:', error);
      }
    };

    loadDocuments();
  }, [trainer.id]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(trainer.id);
  }

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'certificate':
        return <FileText className="w-3 h-3" />;
      case 'award':
        return <Award className="w-3 h-3" />;
      default:
        return <Award className="w-3 h-3" />;
    }
  };

  return (
    <div 
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 cursor-pointer relative border border-gray-200 ${
        trainer.isPremium ? 'border-2 border-amber-400' : ''
      } ${
        isHovered ? 'shadow-md -translate-y-0.5 border-orange-300' : 'hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      <div className="relative">
        <img 
          className={`h-48 w-full object-cover transition-transform duration-300 ${
            isHovered ? 'scale-105' : 'scale-100'
          }`} 
          src={trainer.imageUrl} 
          alt={trainer.name} 
        />
        {trainer.isPremium && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center shadow-sm">
            <Crown className="w-3.5 h-3.5 mr-1" />
            PREMIUM
          </div>
        )}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 bg-white p-2 rounded-full hover:bg-gray-100 transition-all duration-200 shadow-sm"
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`w-5 h-5 transition-all ${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-700'}`} />
        </button>
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-bold text-gray-900 flex items-center">
                {trainer.name}
                {trainer.verificationStatus === 'verified' && (
                  <ShieldCheck className="w-4 h-4 ml-1.5 text-blue-500 fill-blue-100 flex-shrink-0" />
                )}
              </h3>
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
              <p className="text-xs text-gray-600 line-clamp-2 mb-2">{trainer.shortDescription}</p>
            )}
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-sm font-bold text-gray-900">{formatVND(trainer.price)}</div>
            <span className="text-xs text-gray-500">/class</span>
          </div>
        </div>

        {/* Categories Section */}
        {trainer.specialty && trainer.specialty.length > 0 && (
          <div className="mb-3">
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

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-2 border-t border-gray-100">
          <div className="flex items-center">
            <StarRating rating={trainer.rating} starSize="w-3 h-3" />
            <span className="ml-1.5 text-xs font-semibold text-gray-900">{trainer.rating.toFixed(1)}</span>
            <span className="text-xs text-gray-500 ml-1">({trainer.reviews})</span>
          </div>
          <div className="flex items-center">
            <MapPin className="w-3.5 h-3.5 text-gray-500" />
            <span className="ml-1 text-xs text-gray-600">{trainer.location}</span>
          </div>
        </div>

        {/* Certificates & Awards Section */}
        {verifiedDocuments.length > 0 && (
          <div className="mt-3 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1.5 mb-2">
              <Award className="w-3.5 h-3.5 text-[#FF6B35]" />
              <span className="text-xs font-semibold text-gray-900">Certificates & Awards</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {verifiedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-1 px-2 py-0.5 bg-orange-50 rounded-full"
                  title={doc.title}
                >
                  {getDocumentIcon(doc.document_type)}
                  <span className="text-xs font-medium text-orange-700 truncate max-w-[100px]">
                    {doc.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="mt-3 w-full flex items-center justify-center bg-[#FF6B35] text-white text-xs font-semibold py-2.5 px-3 rounded-lg hover:bg-orange-600 active:scale-95 shadow-sm transition-all duration-200"
        >
          View Classes & Details
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
});

TrainerCard.displayName = 'TrainerCard';

export default TrainerCard;
