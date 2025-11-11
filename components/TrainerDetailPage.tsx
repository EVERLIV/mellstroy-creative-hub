import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trainer, Class, ClassType, UserRole } from '../types';
import { ArrowLeft, MessageCircle, Star, ShieldCheck, MapPin, Clock, Building, Sun, Home, Heart, Users, Crown, Camera } from 'lucide-react';
import ImageGalleryModal from './ImageGalleryModal';
import { Button } from '@/src/components/ui/button';

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
        return time; // Return original string if format is unexpected
    }
};


const StarRating: React.FC<{ rating: number; starSize?: string }> = ({ rating, starSize = 'w-4 h-4' }) => {
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
};

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


// Class Card Component
interface ClassCardProps {
    cls: Class;
    trainer: Trainer;
    userRole: UserRole;
    currentUserId: string;
    onInitiateBooking: (target: { trainer: Trainer; cls: Class }) => void;
    onOpenChat: (trainer: Trainer, context?: { className: string; bookingDate?: string; }) => void;
}
const ClassCard: React.FC<ClassCardProps> = ({ cls, trainer, userRole, currentUserId, onInitiateBooking, onOpenChat }) => {
    const navigate = useNavigate();
    const enrolledCount = cls.bookings?.length || 0;
    const enrollmentPercentage = cls.capacity > 0 ? (enrolledCount / cls.capacity) * 100 : 0;
    const isFull = enrolledCount >= cls.capacity;
    const isBookingDisabledForTrainer = userRole === 'trainer';
    const userBooking = cls.bookings?.find(b => b.userId === currentUserId);
    const hasUserBooked = !!userBooking;

    // Premium class styling
    const isPremiumClass = trainer.isPremium;

    return (
        <div className={`bg-card rounded-2xl overflow-hidden transition-all duration-300 ${
            isPremiumClass 
                ? 'shadow-lg shadow-amber-200/50 ring-2 ring-amber-400/30 hover:shadow-xl hover:shadow-amber-200/60' 
                : 'shadow-md shadow-slate-200/60 hover:shadow-lg'
        }`}>
            {isPremiumClass && (
                <div className="bg-gradient-to-r from-amber-400 to-yellow-500 px-3 py-1 flex items-center justify-center">
                    <Crown className="w-3 h-3 text-white mr-1.5" />
                    <span className="text-xs font-bold text-white">PREMIUM CLASS</span>
                </div>
            )}
            <img src={cls.imageUrl} alt={cls.name} className="h-40 w-full object-cover" />
            <div className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg">{cls.name}</h3>
                        <div className="flex items-center space-x-3 mt-1">
                            <p className="text-xs text-gray-500">{cls.duration} min</p>
                             <span className="text-gray-300">&bull;</span>
                            <ClassTypeDisplay type={cls.classType} />
                        </div>
                    </div>
                    <p className="font-bold text-lg text-gray-900">{formatVND(cls.price)}</p>
                </div>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed line-clamp-2">{cls.description}</p>
                
                <div className="mt-4">
                    <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                        <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4" />
                            <span>Enrolled</span>
                        </div>
                        <span className={`font-semibold ${isFull ? 'text-red-500' : 'text-gray-700'}`}>{enrolledCount} / {cls.capacity}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                            className={`h-2 rounded-full transition-all duration-500 ${isFull ? 'bg-red-400' : 'bg-gradient-to-r from-[#FF6B35] to-[#FFA985]'}`}
                            style={{ width: `${enrollmentPercentage}%` }}
                        ></div>
                    </div>
                </div>

                <div className="mt-4">
                    <div className="flex items-center text-sm font-semibold text-gray-600 mb-2">
                        <Clock className="w-5 h-5 mr-1.5 text-gray-400" />
                        <span>Schedule</span>
                    </div>
                    {cls.schedule && cls.schedule.days && cls.schedule.time ? (
                         <div className="flex flex-wrap gap-2">
                            <div className="bg-blue-50 text-blue-800 text-xs font-semibold px-2.5 py-1.5 rounded-full">
                                {cls.schedule.days.join(', ')} at {formatTime(cls.schedule.time)}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-amber-50 text-amber-700 text-xs font-medium px-2.5 py-1.5 rounded-lg">
                            Schedule not set - Book to arrange time with trainer
                        </div>
                    )}
                </div>
                
                <div className="mt-4 flex items-center gap-2">
                    <Button 
                        onClick={() => {
                            const classId = (cls as any)._dbId || cls.id;
                            console.log('Navigating to class detail:', classId, 'cls:', cls);
                            navigate(`/class/${classId}`);
                        }}
                        variant="outline"
                        size="default"
                        className="flex-1"
                    >
                        View Details
                    </Button>
                    <Button 
                        onClick={() => onInitiateBooking({ trainer, cls })}
                        disabled={isFull || isBookingDisabledForTrainer}
                        size="default"
                        className={`flex-1 ${isFull || isBookingDisabledForTrainer ? '' : 'bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white'}`}
                    >
                        {isFull ? 'Full' : isBookingDisabledForTrainer ? 'N/A' : 'Book'}
                    </Button>
                    {hasUserBooked && (
                         <Button 
                            onClick={() => onOpenChat(trainer, { className: cls.name, bookingDate: userBooking?.date })}
                            variant="secondary"
                            size="icon"
                            className="flex-shrink-0"
                         >
                             <MessageCircle className="w-5 h-5" />
                         </Button>
                    )}
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
    onOpenChat: (trainer: Trainer, context?: { className: string; bookingDate?: string; }) => void;
    isFavorite: boolean;
    onToggleFavorite: (trainerId: string) => void;
    onOpenReviewsModal: (trainer: Trainer) => void;
}

const TrainerDetailPage: React.FC<TrainerDetailPageProps> = ({ trainer, userRole, currentUserId, onBack, onInitiateBooking, onOpenChat, isFavorite, onToggleFavorite, onOpenReviewsModal }) => {
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    const openGallery = (index: number) => {
        setSelectedImageIndex(index);
        setIsGalleryOpen(true);
    };

    return (
        <div className="animate-fade-in pb-24 bg-white">
            {/* Header Image */}
            <div className="relative">
                <img className="h-64 w-full object-cover" src={trainer.imageUrl} alt={trainer.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <button onClick={onBack} className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm p-2 rounded-full text-gray-800 hover:bg-white transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <button 
                    onClick={() => onToggleFavorite(trainer.id)}
                    className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-full text-gray-800 hover:bg-white transition-colors"
                    aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                    <Heart className={`w-6 h-6 transition-all ${isFavorite ? 'text-red-500 fill-red-500' : 'text-slate-700'}`} />
                </button>
            </div>

            <div className="p-4 bg-white -mt-12 rounded-t-2xl relative z-10">
                {/* Trainer Info */}
                 <div className="flex flex-wrap gap-2">
                    {trainer.specialty.map(spec => (
                        <span key={spec} className="text-sm font-semibold bg-blue-100 text-blue-800 px-3 py-1 rounded-full">{spec}</span>
                    ))}
                </div>
                <div className="flex items-center mt-2 flex-wrap gap-x-2">
                    <h1 className="text-3xl font-bold text-gray-800">{trainer.name}</h1>
                    {trainer.verificationStatus === 'verified' && <ShieldCheck className="w-6 h-6 text-blue-500 fill-blue-100" />}
                    {trainer.isPremium && (
                        <div className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center shadow-md">
                            <Crown className="w-4 h-4 mr-1.5" />
                            PREMIUM
                        </div>
                    )}
                </div>
                <div className="flex items-center mt-2 text-sm text-gray-500">
                    <div className="flex items-center">
                        <StarRating rating={trainer.rating} />
                        <span className="ml-2 font-semibold text-gray-700">{trainer.rating.toFixed(1)}</span>
                        <span className="text-gray-400 ml-1">({trainer.reviews} reviews)</span>
                    </div>
                    <span className="mx-2 text-gray-300">|</span>
                    <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="ml-1">{trainer.location}</span>
                    </div>
                </div>

                {/* About Section */}
                <div className="mt-8">
                    <h2 className="text-lg font-bold text-gray-800 mb-2">About {trainer.name}</h2>
                    <p className="text-sm text-gray-600 leading-relaxed">{trainer.bio}</p>
                </div>

                {/* Gallery Section */}
                {trainer.isPremium && trainer.galleryImages && (
                    <div className="mt-8">
                        <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                            <Camera className="w-5 h-5 mr-2 text-gray-600" /> Photo Gallery
                        </h2>
                        <div className="flex overflow-x-auto space-x-3 pb-2 -mx-4 px-4 no-scrollbar">
                            {trainer.galleryImages.map((imgUrl, index) => (
                                <button key={index} onClick={() => openGallery(index)} className="flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden shadow-md transform hover:scale-105 transition-transform duration-200">
                                    <img src={imgUrl} alt={`Gallery image ${index + 1}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}


                {/* Classes Section */}
                <div className="mt-8">
                    <h2 className="text-lg font-bold text-gray-800 mb-3">Classes Offered</h2>
                    <div className="space-y-4">
                        {trainer.classes.map(cls => (
                           <ClassCard key={cls.id} cls={cls} trainer={trainer} userRole={userRole} currentUserId={currentUserId} onInitiateBooking={onInitiateBooking} onOpenChat={onOpenChat} />
                        ))}
                    </div>
                </div>
                
                {/* Reviews Section */}
                <div className="mt-8">
                    <h2 className="text-lg font-bold text-gray-800 mb-3">What Clients Say</h2>
                    {trainer.reviewsData.length > 0 ? (
                        <div className="space-y-4">
                            {trainer.reviewsData.slice(0, 2).map((review, index) => (
                                <div key={index} className="bg-white p-4 rounded-xl shadow-sm shadow-slate-200/80">
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-gray-800">{review.reviewerName}</p>
                                        <StarRating rating={review.rating} />
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2 italic">"{review.comment}"</p>
                                </div>
                            ))}
                            {trainer.reviewsData.length > 2 && (
                                <button 
                                    onClick={() => onOpenReviewsModal(trainer)}
                                    className="w-full mt-4 text-center bg-slate-100 text-slate-700 text-sm font-bold py-3 px-3 rounded-lg hover:bg-slate-200 transition-colors duration-200"
                                >
                                    View all {trainer.reviews} reviews
                                </button>
                            )}
                        </div>
                    ) : (
                         <p className="text-sm text-gray-500">No reviews yet.</p>
                    )}
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