import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../src/integrations/supabase/client';
import { Class, Trainer, UserRole } from '../types';
import { ArrowLeft, MapPin, Star, Calendar, Share2 } from 'lucide-react';
import { Review } from '../types';

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

interface ClassDetailPageProps {
  userRole?: UserRole;
  currentUserId?: string;
  onInitiateBooking?: (target: { trainer: Trainer; cls: Class }) => void;
  onOpenChat?: (trainer: Trainer, context?: { className: string; bookingDate?: string; }) => void;
}

const ClassDetailPage: React.FC<ClassDetailPageProps> = ({ 
  userRole = 'student', 
  currentUserId = '',
  onInitiateBooking,
  onOpenChat
}) => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [classData, setClassData] = useState<Class | null>(null);
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [classReviews, setClassReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (!classId) return;
    loadClassData();
  }, [classId]);

  // Subscribe to realtime bookings updates
  useEffect(() => {
    if (!classId) return;

    const loadBookings = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('class_id', classId);
      
      if (!error && data) {
        setEnrolledCount(data.length);
      }
    };

    loadBookings();

    const channel = supabase
      .channel(`class-detail-bookings-${classId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `class_id=eq.${classId}`
        },
        () => {
          loadBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [classId]);


  const loadClassData = async () => {
    if (!classId) return;

    try {
      setLoading(true);

      const { data: classInfo, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .maybeSingle();

      if (classError) throw classError;
      if (!classInfo) return;

      const { data: trainerProfile, error: trainerError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', classInfo.trainer_id)
        .maybeSingle();

      if (trainerError) throw trainerError;
      if (!trainerProfile) return;

      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('class_id', classId);

      setEnrolledCount(bookings?.length || 0);

      // Load reviews for this class through bookings
      let reviewsData: Review[] = [];
      if (bookings && bookings.length > 0) {
        const bookingIds = bookings.map(b => b.id);
        const { data: reviews, error: reviewsError } = await supabase
          .from('reviews')
          .select(`
            *,
            client:profiles!reviews_client_id_fkey(username)
          `)
          .in('booking_id', bookingIds);

        if (!reviewsError && reviews) {
          reviewsData = reviews.map(r => ({
            reviewerName: (r.client as any)?.username || 'Anonymous',
            rating: r.rating,
            comment: r.comment || '',
          }));
        }
      }

      const cls: Class = {
        id: classInfo.id as any,
        name: classInfo.name,
        description: classInfo.description || '',
        duration: classInfo.duration_minutes,
        price: Number(classInfo.price),
        imageUrl: classInfo.image_url || '',
        imageUrls: classInfo.image_urls || [],
        capacity: classInfo.capacity,
        classType: classInfo.class_type as 'Indoor' | 'Outdoor' | 'Home',
        schedule: classInfo.schedule_days && classInfo.schedule_time ? {
          days: classInfo.schedule_days,
          time: classInfo.schedule_time
        } : undefined,
        language: (classInfo as any).language || [],
        level: (classInfo as any).level || '',
        kids_friendly: (classInfo as any).kids_friendly || false,
        disability_friendly: (classInfo as any).disability_friendly || false,
      };

      setClassReviews(reviewsData);

      const trainerData: Trainer = {
        id: trainerProfile.id,
        name: trainerProfile.username,
        specialty: trainerProfile.specialty || [],
        rating: Number(trainerProfile.rating) || 0,
        reviews: trainerProfile.reviews_count || 0,
        location: trainerProfile.location || '',
        price: Number(trainerProfile.price_per_hour) || 0,
        imageUrl: trainerProfile.avatar_url || '',
        verificationStatus: trainerProfile.is_verified ? 'verified' : 'unverified',
        isPremium: trainerProfile.is_premium || false,
        bio: trainerProfile.bio || '',
        reviewsData: [],
        classes: [],
        chatHistory: [],
      };

      setClassData(cls);
      setTrainer(trainerData);
    } catch (error) {
      console.error('Error loading class data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share && classData) {
      try {
        await navigator.share({
          title: classData.name,
          text: classData.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };


  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-foreground font-medium">Loading class details...</p>
        </div>
      </div>
    );
  }

  if (!classData || !trainer) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background p-4">
        <p className="text-foreground text-lg mb-2">Class not found</p>
        <p className="text-muted-foreground text-sm mb-4">Class ID: {classId}</p>
        <button 
          onClick={() => navigate('/explore')} 
          className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold hover:bg-primary/90"
        >
          Back to Explore
        </button>
      </div>
    );
  }

  const isFull = enrolledCount >= classData.capacity;
  const isBookingDisabled = userRole === 'trainer' || isFull;

  const images = classData.imageUrls && classData.imageUrls.length > 0 
    ? classData.imageUrls 
    : classData.imageUrl 
    ? [classData.imageUrl] 
    : [];

  return (
    <div className="bg-white h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white shadow-sm z-20">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 -ml-2"
        >
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </button>
        <h1 className="text-base font-bold text-gray-900">Class Details</h1>
        <button 
          onClick={handleShare}
          className="p-2 -mr-2"
          aria-label="Share class"
        >
          <Share2 className="w-5 h-5 text-gray-800" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Hero Image */}
        <div className="relative h-48 w-full">
          <img 
            src={images[currentImageIndex] || classData.imageUrl} 
            alt={classData.name} 
            className="h-full w-full object-cover" 
          />
          {images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentImageIndex 
                      ? 'w-6 bg-white' 
                      : 'w-1.5 bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="px-4 py-3 bg-gray-50">
          {/* Class Title and Coach Card */}
          <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-0.5">{classData.name}</h2>
            <p className="text-sm text-gray-600">with {trainer.name}</p>
          </div>

          {/* Price and Schedule Card */}
          <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
            <div className="space-y-1.5">
              <p className="text-sm font-bold text-gray-900">
                Price: {formatVND(classData.price)} / Session
              </p>
              {classData.schedule && (
                <div className="flex items-start gap-2 text-xs text-gray-700">
                  <Calendar className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>
                    Schedule: {classData.schedule.days.join(', ')} | {formatTime(classData.schedule.time)}
                  </span>
                </div>
              )}
              <div className="flex items-start gap-2 text-xs text-gray-700">
                <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>{trainer.location}</span>
              </div>
            </div>
          </div>

          {/* Class Details Grid Card */}
          <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
            <div className="space-y-3">
              {/* Level and Language as Bubbles */}
              <div className="flex flex-wrap gap-2">
                {classData.level && (
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    {classData.level}
                  </span>
                )}
                {classData.language && classData.language.length > 0 && classData.language.map((lang, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    {lang}
                  </span>
                ))}
                {(classData as any).kids_friendly && (
                  <span className="px-2.5 py-1 bg-pink-100 text-pink-700 text-xs font-medium rounded-full">
                    <span className="text-sm">👶</span> Kids Friendly
                  </span>
                )}
                {(classData as any).disability_friendly && (
                  <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                    <span className="text-sm">♿</span> Disability Friendly
                  </span>
                )}
              </div>
              {/* Duration and Capacity */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                <div className="space-y-1.5">
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="text-xs text-gray-900">{classData.duration} minutes</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-gray-500">Capacity</p>
                  <p className="text-xs text-gray-900">{enrolledCount} / {classData.capacity}</p>
                </div>
              </div>
            </div>
          </div>

          {/* About This Class Card */}
          <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-1.5">About this Class</h3>
            <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
              {classData.description}
            </p>
          </div>

          {/* Your Coach Card */}
          <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-1.5">Your Coach</h3>
            <div 
              onClick={() => navigate(`/trainer/${trainer.id}`)}
              className="bg-gray-50 rounded-lg p-2.5 flex items-center gap-2.5 cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <img src={trainer.imageUrl} alt={trainer.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{trainer.name}</p>
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span>{trainer.rating.toFixed(1)}</span>
                  <span>•</span>
                  <span>{trainer.reviews} reviews</span>
                </div>
              </div>
              <button className="text-xs font-medium text-blue-600 px-2 py-1 hover:text-blue-700">
                View
              </button>
            </div>
          </div>

          {/* Reviews Section */}
          {classReviews.length > 0 && (
            <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-2">Reviews</h3>
              <div className="space-y-2.5">
                {classReviews.slice(0, 3).map((review, index) => (
                  <div key={index} className="border-b border-gray-100 last:border-0 pb-2.5 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-gray-900">{review.reviewerName}</p>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => {
                          const starValue = i + 1;
                          return (
                            <Star
                              key={i}
                              className={`w-2.5 h-2.5 ${
                                review.rating >= starValue
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300 fill-gray-300'
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">"{review.comment}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="px-4 py-3 bg-white shadow-lg">
        <button
          onClick={() => onInitiateBooking && trainer && onInitiateBooking({ trainer, cls: classData })}
          disabled={isBookingDisabled}
          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-200 text-sm shadow-sm ${
            isBookingDisabled
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95'
          }`}
        >
          {isFull ? 'Class Full' : userRole === 'trainer' ? 'Trainers Cannot Book' : 'Book Now'}
        </button>
      </div>

    </div>
  );
};

export default ClassDetailPage;

