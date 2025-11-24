import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../src/integrations/supabase/client';
import { Trainer, Class, UserRole } from '../types';
import { ArrowLeft, Star, ShieldCheck, MapPin, Share2 } from 'lucide-react';

// Helper functions
const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0
  }).format(amount).replace(/\s/g, '');
};

const StarRating: React.FC<{ rating: number; starSize?: string }> = React.memo(({ rating, starSize = 'w-4 h-4' }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        if (rating >= starValue) {
          return <Star key={index} className={`${starSize} text-yellow-400 fill-yellow-400`} />;
        } else if (rating >= starValue - 0.5) {
          return (
            <div key={index} className="relative">
              <Star className={`${starSize} text-yellow-400 fill-yellow-400`} />
            </div>
          );
        }
        return <Star key={index} className={`${starSize} text-gray-300`} />;
      })}
    </div>
  );
});

StarRating.displayName = 'StarRating';

// Class Card Component
interface ClassCardProps {
  cls: Class;
  onViewDetails: () => void;
}

const ClassCard: React.FC<ClassCardProps> = ({ cls, onViewDetails }) => {
  return (
    <div className="bg-card rounded-xl overflow-hidden shadow-sm border border-border hover:shadow-md transition-shadow">
      {/* Class Image */}
      <div className="relative h-32 bg-muted">
        {cls.imageUrl ? (
          <img 
            src={cls.imageUrl} 
            alt={cls.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20">
            <span className="text-3xl">🏋️</span>
          </div>
        )}
      </div>
      
      {/* Class Info */}
      <div className="p-3">
        <h4 className="font-bold text-foreground text-sm mb-1 line-clamp-1">{cls.name}</h4>
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{cls.description || 'No description available'}</p>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-primary">{formatVND(cls.price)}</span>
          <button
            onClick={onViewDetails}
            className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 active:scale-95 transition-all"
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Component
interface TrainerDetailPageProps {
    trainer: Trainer;
    userRole: UserRole;
    currentUserId: string;
    onBack: () => void;
    onInitiateBooking: (target: { trainer: Trainer; cls: Class }) => void;
    isFavorite: boolean;
    onToggleFavorite: (trainerId: string) => void;
    onOpenReviewsModal: (trainer: Trainer) => void;
}

const TrainerDetailPage: React.FC<TrainerDetailPageProps> = ({ 
    trainer, 
    userRole, 
    currentUserId, 
    onBack, 
    onInitiateBooking, 
    isFavorite, 
    onToggleFavorite, 
    onOpenReviewsModal 
}) => {
    const [classes, setClasses] = useState<Class[]>(trainer?.classes || []);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Scroll to top when component mounts
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, [trainer?.id]);

    if (!trainer) {
        return (
            <div className="bg-background h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm text-muted-foreground">Loading trainer...</p>
                </div>
            </div>
        );
    }

    // Use memoized classes from trainer prop
    const displayClasses = useMemo(() => {
        return classes.length > 0 ? classes : (trainer?.classes || []);
    }, [classes, trainer?.classes]);

    useEffect(() => {
        if (trainer && trainer.classes) {
            setClasses(trainer.classes);
        }
    }, [trainer?.id, trainer?.classes]);

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${trainer.name} - Trainer Profile`,
                    text: `Check out ${trainer.name}'s profile`,
                    url: window.location.href,
                });
            } catch (error) {
                // Sharing cancelled or failed
            }
        }
    };

    const handleViewClassDetails = (cls: Class) => {
        const classId = (cls as any)._dbId || cls.id;
        navigate(`/class/${classId}`);
    };

    return (
        <div className="bg-background h-screen flex flex-col overflow-hidden">
            {/* Gradient Header with Profile */}
            <div className="relative">
                {/* Gradient Background */}
                <div className="h-48 bg-gradient-to-r from-blue-500 via-purple-500 to-purple-600 relative rounded-b-3xl">
                    {/* Header Controls */}
                    <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-4 z-20">
                        <button 
                            onClick={onBack} 
                            className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6 text-white" />
                        </button>
                        <h1 className="text-xl font-bold text-white">{trainer.name}</h1>
                        <button 
                            onClick={handleShare}
                            className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                            aria-label="Share trainer"
                        >
                            <Share2 className="w-6 h-6 text-white" />
                        </button>
                    </div>
                </div>

                {/* Profile Image - Centered and overlapping */}
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-16 z-10">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-background shadow-xl">
                            <img 
                                src={trainer.imageUrl} 
                                alt={trainer.name} 
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pt-20 pb-24 bg-background">
                <div className="px-4">
                    {/* Trainer Name and Info */}
                    <div className="text-center mb-6">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <h2 className="text-2xl font-bold text-foreground">{trainer.name}</h2>
                            {trainer.verificationStatus === 'verified' && (
                                <ShieldCheck className="w-6 h-6 text-blue-500 flex-shrink-0" />
                            )}
                        </div>
                        
                        {/* Specialization */}
                        {trainer.specialty && trainer.specialty.length > 0 && (
                            <p className="text-muted-foreground mb-2">
                                {trainer.specialty.join(', ')}
                            </p>
                        )}
                        
                        {/* Location */}
                        <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">{trainer.location}</span>
                        </div>
                    </div>

                    {/* Bio Section */}
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-foreground mb-3">Bio</h3>
                        <p className="text-muted-foreground text-base leading-relaxed">
                            {trainer.bio || trainer.shortDescription || 'No bio available'}
                        </p>
                    </div>

                    {/* Client Reviews Section */}
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-foreground mb-4">Client Reviews</h3>
                        
                        {/* Rating Summary */}
                        <div className="flex items-center gap-3 mb-5">
                            <span className="text-4xl font-bold text-foreground">{trainer.rating.toFixed(1)}</span>
                            <div>
                                <StarRating rating={trainer.rating} starSize="w-5 h-5" />
                                <span className="text-sm text-muted-foreground">({trainer.reviews} Reviews)</span>
                            </div>
                        </div>

                        {/* Review Cards - Horizontal Scroll */}
                        {trainer.reviewsData && trainer.reviewsData.length > 0 ? (
                            <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
                                {trainer.reviewsData.map((review, idx) => (
                                    <div 
                                        key={idx} 
                                        className="flex-shrink-0 w-[280px] bg-card rounded-2xl p-5 shadow-sm border border-border snap-start"
                                    >
                                        <div className="mb-3">
                                            <h4 className="font-bold text-foreground text-base mb-2">{review.reviewerName}</h4>
                                            <StarRating rating={review.rating} starSize="w-4 h-4" />
                                        </div>
                                        {review.comment && (
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {review.comment}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-base text-muted-foreground">No reviews yet</p>
                        )}
                    </div>

                    {/* Available Sessions Section */}
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-foreground mb-4">Available Sessions</h3>
                        
                        {displayClasses.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3">
                                {displayClasses.map((cls) => (
                                    <ClassCard
                                        key={(cls as any)._dbId || cls.id}
                                        cls={cls}
                                        onViewDetails={() => handleViewClassDetails(cls)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-base">No sessions available</p>
                        )}
                    </div>
                </div>

                {/* Fixed Book Button */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
                    <button 
                        onClick={() => {
                            if (displayClasses.length > 0) {
                                onInitiateBooking({ trainer, cls: displayClasses[0] });
                            }
                        }}
                        disabled={displayClasses.length === 0 || userRole === 'trainer'}
                        className="w-full py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-lg font-bold rounded-full shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Book a Session
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TrainerDetailPage;
