import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../src/integrations/supabase/client';
import { Trainer, Class, ClassType, UserRole } from '../types';
import { ArrowLeft, MessageCircle, Star, ShieldCheck, MapPin, Clock, Building, Sun, Home, Heart, Users, Crown, Camera, Share2, Calendar } from 'lucide-react';
import ImageGalleryModal from './ImageGalleryModal';

// Helper functions
const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0
  }).format(amount).replace(/\s/g, '');
};

const formatTime = (time: string) => {
    try {
        const [hours, minutes] = time.split(':');
        const date = new Date();
        date.setHours(parseInt(hours));
        date.setMinutes(parseInt(minutes));
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch (error) {
        return time;
    }
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

// Class Type Display Component
const ClassTypeDisplay: React.FC<{ type: ClassType }> = ({ type }) => {
    const iconMap: Record<ClassType, React.ReactNode> = {
        Indoor: <Building className="w-3.5 h-3.5" />,
        Outdoor: <Sun className="w-3.5 h-3.5" />,
        Home: <Home className="w-3.5 h-3.5" />,
    };

    return (
        <div className="flex items-center text-xs text-gray-500">
            {iconMap[type]}
            <span className="ml-1.5">{type}</span>
        </div>
    );
};

// Helper function to transform class data
const transformClassData = (c: any): Class => ({
    id: c.id as any,
    name: c.name,
    language: (c as any).language || [],
    level: (c as any).level || '',
    description: c.description || '',
    duration: c.duration_minutes,
    price: Number(c.price),
    imageUrl: c.image_url || '',
    imageUrls: c.image_urls || [],
    capacity: c.capacity,
    classType: c.class_type as 'Indoor' | 'Outdoor' | 'Home',
    schedule: c.schedule_days && c.schedule_time ? {
        days: c.schedule_days,
        time: c.schedule_time
    } : undefined,
    bookings: [],
    kids_friendly: c.kids_friendly || false,
    disability_friendly: c.disability_friendly || false,
});

// Class Card Component
interface ClassCardProps {
    cls: Class;
    trainer: Trainer;
    userRole: UserRole;
    currentUserId: string;
    onInitiateBooking: (target: { trainer: Trainer; cls: Class }) => void;
    onBack: () => void;
}

const ClassCard: React.FC<ClassCardProps> = React.memo(({ cls, trainer, userRole, currentUserId, onInitiateBooking, onBack }) => {
    const navigate = useNavigate();
    const isBookingDisabledForTrainer = userRole === 'trainer';

    const handleCardClick = () => {
        const classId = (cls as any)._dbId || cls.id;
        onBack();
        setTimeout(() => {
            navigate(`/class/${classId}`);
        }, 100);
    };

    const handleBookClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onInitiateBooking({ trainer, cls });
    };

    const classImage = cls.imageUrls && cls.imageUrls.length > 0 ? cls.imageUrls[0] : cls.imageUrl;

    return (
        <div 
            onClick={handleCardClick}
            className="bg-card rounded-xl overflow-hidden shadow-sm cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-border hover:border-primary/50 mb-3"
        >
            {/* Image Header with Overlay Info */}
            <div className="relative h-36 overflow-hidden bg-muted">
                <img 
                    src={classImage || '/api/placeholder/400/200'} 
                    alt={cls.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                
                {/* Class Type Badge */}
                <div className="absolute top-2 left-2 flex gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-background/95 backdrop-blur-sm text-foreground text-xs font-semibold rounded-md shadow-sm">
                        {cls.classType === 'Indoor' && <Building className="w-3 h-3" />}
                        {cls.classType === 'Outdoor' && <Sun className="w-3 h-3" />}
                        {cls.classType === 'Home' && <Home className="w-3 h-3" />}
                        {cls.classType}
                    </span>
                    {(cls as any).level && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/90 backdrop-blur-sm text-white text-xs font-medium rounded-md">
                            <Star className="w-3 h-3 fill-current" />
                            {(cls as any).level}
                        </span>
                    )}
                </div>

                {/* Duration Badge */}
                <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-background/95 backdrop-blur-sm text-foreground text-xs font-semibold rounded-md shadow-sm">
                        <Clock className="w-3 h-3" />
                        {cls.duration} min
                    </span>
                </div>

                {/* Price - Bottom Right */}
                <div className="absolute bottom-2 right-2">
                    <span className="px-2.5 py-1 bg-primary text-primary-foreground text-sm font-bold rounded-md shadow-lg">
                        {formatVND(cls.price)}
                    </span>
                </div>
            </div>

            {/* Card Content */}
            <div className="p-3">
                {/* Class Name */}
                <h3 className="text-sm font-bold text-foreground mb-2 line-clamp-1">{cls.name}</h3>

                {/* Key Info Grid */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                    {/* Schedule */}
                    {cls.schedule && cls.schedule.days && cls.schedule.time ? (
                        <div className="flex items-start gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[10px] text-muted-foreground uppercase font-medium">Schedule</p>
                                <p className="text-xs text-foreground font-medium truncate">{cls.schedule.days[0]}</p>
                                <p className="text-[10px] text-muted-foreground">{formatTime(cls.schedule.time)}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[10px] text-muted-foreground uppercase font-medium">Schedule</p>
                                <p className="text-xs text-amber-600 font-medium">Flexible</p>
                            </div>
                        </div>
                    )}

                    {/* Location */}
                    <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                            <p className="text-[10px] text-muted-foreground uppercase font-medium">Location</p>
                            <p className="text-xs text-foreground font-medium truncate">{trainer.location || 'TBD'}</p>
                        </div>
                    </div>

                    {/* Capacity */}
                    <div className="flex items-start gap-1.5">
                        <Users className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                            <p className="text-[10px] text-muted-foreground uppercase font-medium">Capacity</p>
                            <p className="text-xs text-foreground font-medium">Max {cls.capacity}</p>
                        </div>
                    </div>

                    {/* Language */}
                    {(cls as any).language && (cls as any).language.length > 0 && (
                        <div className="flex items-start gap-1.5">
                            <MessageCircle className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[10px] text-muted-foreground uppercase font-medium">Language</p>
                                <p className="text-xs text-foreground font-medium truncate">{(cls as any).language[0]}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tags Row */}
                <div className="flex items-center gap-1.5 flex-wrap mb-3">
                    {(cls as any).kids_friendly && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-pink-100 text-pink-700 text-[10px] font-medium rounded">
                            👶 Kids
                        </span>
                    )}
                    {(cls as any).disability_friendly && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-medium rounded">
                            ♿ Accessible
                        </span>
                    )}
                    {(cls as any).language && (cls as any).language.length > 1 && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded">
                            +{(cls as any).language.length - 1} more
                        </span>
                    )}
                </div>

                {/* Action Button */}
                <button 
                    onClick={handleBookClick}
                    disabled={isBookingDisabledForTrainer}
                    className={`w-full px-3 py-2 text-xs font-bold rounded-lg transition-all duration-200 shadow-sm ${
                        isBookingDisabledForTrainer 
                            ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                            : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 hover:shadow-md'
                    }`}
                >
                    {isBookingDisabledForTrainer ? 'N/A for Trainers' : 'Book Now →'}
                </button>
            </div>
        </div>
    );
});

ClassCard.displayName = 'ClassCard';

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
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [classes, setClasses] = useState<Class[]>(trainer?.classes || []);
    const navigate = useNavigate();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Scroll to top when component mounts
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, [trainer?.id]);

    if (!trainer) {
        return (
            <div className="bg-background h-[100dvh] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm text-muted-foreground">Loading trainer...</p>
                </div>
            </div>
        );
    }

    // Use memoized classes from trainer prop, but allow updates from real-time
    const displayClasses = useMemo(() => {
        return classes.length > 0 ? classes : (trainer?.classes || []);
    }, [classes, trainer?.classes]);

    useEffect(() => {
        if (trainer && trainer.classes) {
            setClasses(trainer.classes);
        }
    }, [trainer?.id, trainer?.classes]);

    useEffect(() => {
        if (!trainer?.id) return;

        const loadClasses = async () => {
            const { data: classesData, error } = await supabase
                .from('classes')
                .select('*')
                .eq('trainer_id', trainer.id);

            if (!error && classesData) {
                const transformedClasses = classesData.map(transformClassData);
                setClasses(transformedClasses);
            }
        };

        loadClasses();

        const channel = supabase
            .channel(`trainer-classes-${trainer.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'classes',
                    filter: `trainer_id=eq.${trainer.id}`
                },
                () => {
                    loadClasses();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [trainer?.id]);

    const openGallery = (index: number) => {
        setSelectedImageIndex(index);
        setIsGalleryOpen(true);
    };

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

    return (
        <div className="bg-background h-[100dvh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-background border-b border-border flex-shrink-0">
                <button 
                    onClick={onBack} 
                    className="p-2 -ml-2"
                >
                    <ArrowLeft className="w-5 h-5 text-foreground" />
                </button>
                <h1 className="text-base font-bold text-foreground">Trainer Profile</h1>
                <div className="flex items-center gap-1">
                    <button 
                        onClick={() => onToggleFavorite(trainer.id)}
                        className="p-2 -mr-2"
                        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                        <Heart className={`w-5 h-5 transition-all ${isFavorite ? 'text-red-500 fill-red-500' : 'text-foreground'}`} />
                    </button>
                    <button 
                        onClick={handleShare}
                        className="p-2 -mr-2"
                        aria-label="Share trainer"
                    >
                        <Share2 className="w-5 h-5 text-foreground" />
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0">
                <div className="px-4 py-3 bg-muted/30 pb-[calc(5rem+env(safe-area-inset-bottom))]">
                    {/* Trainer Profile Card */}
                    <div className="bg-card rounded-lg p-3 mb-3 border border-border">
                        <div className="flex items-start gap-3">
                            <div className="relative flex-shrink-0">
                                <div className={`w-16 h-16 rounded-full overflow-hidden border-2 ${
                                    trainer.isPremium ? 'border-amber-400' : 'border-green-200'
                                }`}>
                                    <img 
                                        src={trainer.imageUrl} 
                                        alt={trainer.name} 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {trainer.isPremium && (
                                    <div className="absolute -top-1 -left-1 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full p-0.5 border-2 border-background shadow-sm">
                                        <Crown className="w-3 h-3 text-white" />
                                    </div>
                                )}
                                {trainer.verificationStatus === 'verified' && (
                                    <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5 border-2 border-background">
                                        <ShieldCheck className="w-3 h-3 text-white" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h2 className="text-base font-bold text-foreground">{trainer.name}</h2>
                                    {trainer.isPremium && (
                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full shadow-sm">
                                            <Crown className="w-3 h-3 text-white" />
                                            <span className="text-xs font-bold text-white">Premium</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 mb-1">
                                    <StarRating rating={trainer.rating} />
                                    <span className="text-xs font-bold text-foreground">{trainer.rating.toFixed(1)}</span>
                                    <span className="text-xs text-muted-foreground">({trainer.reviews} reviews)</span>
                                </div>
                                {trainer.location && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <MapPin className="w-3.5 h-3.5 text-primary" />
                                        <span>{trainer.location}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Categories Section */}
                    {trainer.specialty && trainer.specialty.length > 0 && (
                        <div className="bg-card rounded-lg p-3 mb-3 border border-border">
                            <h3 className="text-sm font-bold text-foreground mb-2">Categories</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {trainer.specialty.map((category, index) => (
                                    <span
                                        key={index}
                                        className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full"
                                    >
                                        {category}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* About Me Section */}
                    {trainer.bio && (
                        <div className="bg-card rounded-lg p-3 mb-3 border border-border">
                            <h3 className="text-sm font-bold text-foreground mb-2">About Me</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">{trainer.bio}</p>
                        </div>
                    )}

                    {/* Classes Section */}
                    <div className="bg-card rounded-lg p-3 mb-3 border border-border">
                        <h3 className="text-sm font-bold text-foreground mb-3">Classes</h3>
                        {displayClasses.length > 0 ? (
                            <div className="space-y-0">
                                {displayClasses.map((cls, index) => (
                                    <React.Fragment key={cls.id}>
                                        <ClassCard 
                                            cls={cls} 
                                            trainer={trainer} 
                                            userRole={userRole} 
                                            currentUserId={currentUserId} 
                                            onInitiateBooking={onInitiateBooking} 
                                            onBack={onBack} 
                                        />
                                        {index < displayClasses.length - 1 && (
                                            <div className="border-t border-border mb-3"></div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground text-center py-4">No classes available yet.</p>
                        )}
                    </div>
                    
                    {/* Reviews Section */}
                    <div className="bg-card rounded-lg p-3 border border-border">
                        <h3 className="text-sm font-bold text-foreground mb-2">Ratings & Reviews ({trainer.reviews})</h3>
                        {trainer.reviewsData && trainer.reviewsData.length > 0 ? (
                            <div className="space-y-3">
                                {trainer.reviewsData.slice(0, 2).map((review, index) => (
                                    <div key={index} className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                            <Users className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-xs font-bold text-foreground">{review.reviewerName}</p>
                                                <StarRating rating={review.rating} />
                                            </div>
                                            <p className="text-xs text-muted-foreground">{review.comment}</p>
                                        </div>
                                    </div>
                                ))}
                                {trainer.reviewsData.length > 2 && (
                                    <button 
                                        onClick={() => onOpenReviewsModal(trainer)}
                                        className="w-full mt-2 text-center text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                                    >
                                        View all {trainer.reviews} reviews
                                    </button>
                                )}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground text-center py-4">No reviews yet.</p>
                        )}
                    </div>
                </div>
            </div>

            {isGalleryOpen && trainer.galleryImages && (
                <ImageGalleryModal
                    images={trainer.galleryImages}
                    startIndex={selectedImageIndex}
                    onClose={() => setIsGalleryOpen(false)}
                />
            )}
        </div>
    );
};

export default TrainerDetailPage;
