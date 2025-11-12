import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../src/integrations/supabase/client';
import { Class, Trainer, UserRole } from '../types';
import { ArrowLeft, MapPin, Star, Calendar, Share2, ShieldCheck, Crown, Award, FileText, Building, Sun, Home, Users, ChevronLeft, ChevronRight, Camera, Clock } from 'lucide-react';
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
  const [trainerCertificates, setTrainerCertificates] = useState<any[]>([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [similarClasses, setSimilarClasses] = useState<Class[]>([]);

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

      // Load trainer certificates
      const { data: certificates } = await supabase
        .from('trainer_documents')
        .select('*')
        .eq('trainer_id', classInfo.trainer_id)
        .eq('is_verified', true)
        .order('priority', { ascending: false })
        .limit(5);
      
      setTrainerCertificates(certificates || []);

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

      // Load similar classes
      loadSimilarClasses(classInfo.trainer_id, classInfo.class_type, classId);
    } catch (error) {
      // Error will result in "Class not found" UI
    } finally {
      setLoading(false);
    }
  };

  const loadSimilarClasses = async (trainerId: string, classType: string, currentClassId: string) => {
    try {
      // First try to get other classes from the same trainer
      const { data: trainerClasses } = await supabase
        .from('classes')
        .select('*')
        .eq('trainer_id', trainerId)
        .neq('id', currentClassId)
        .limit(3);

      if (trainerClasses && trainerClasses.length > 0) {
        const classes = trainerClasses.map(c => ({
          id: c.id as any,
          name: c.name,
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
          language: c.language || [],
          level: c.level || '',
          kids_friendly: c.kids_friendly || false,
          disability_friendly: c.disability_friendly || false,
        }));
        setSimilarClasses(classes);
      } else {
        // If no trainer classes, get classes of the same type
        const { data: similarTypeClasses } = await supabase
          .from('classes')
          .select('*')
          .eq('class_type', classType)
          .neq('id', currentClassId)
          .limit(3);

        if (similarTypeClasses) {
          const classes = similarTypeClasses.map(c => ({
            id: c.id as any,
            name: c.name,
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
            language: c.language || [],
            level: c.level || '',
            kids_friendly: c.kids_friendly || false,
            disability_friendly: c.disability_friendly || false,
          }));
          setSimilarClasses(classes);
        }
      }
    } catch (error) {
      // Silent fail
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
        // Sharing cancelled or failed
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };


  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-700 font-medium">Loading class details...</p>
        </div>
      </div>
    );
  }

  if (!classData || !trainer) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <p className="text-gray-900 text-lg mb-2">Class not found</p>
        <p className="text-gray-600 text-sm mb-4">Class ID: {classId}</p>
        <button 
          onClick={() => navigate('/explore')} 
          className="bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600"
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

  const classTypeIcon = {
    'Indoor': <Building className="w-3 h-3" />,
    'Outdoor': <Sun className="w-3 h-3" />,
    'Home': <Home className="w-3 h-3" />
  }[classData.classType];

  const getCertificateIcon = (type: string) => {
    switch (type) {
      case 'certificate': return <FileText className="w-4 h-4" />;
      case 'award': return <Award className="w-4 h-4" />;
      default: return <Award className="w-4 h-4" />;
    }
  };

  const displayedReviews = showAllReviews ? classReviews : classReviews.slice(0, 3);

  return (
    <div className="bg-slate-50 h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white shadow-sm z-20 border-b border-gray-100">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </button>
        <h1 className="text-base font-bold text-gray-900">Class Details</h1>
        <button 
          onClick={handleShare}
          className="p-2 -mr-2 hover:bg-gray-100 rounded-lg transition"
          aria-label="Share class"
        >
          <Share2 className="w-5 h-5 text-gray-800" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-32">
        {/* Premium Gallery / Hero Image */}
        <div className="relative h-64 w-full bg-gray-900">
          <img 
            src={images[currentImageIndex] || classData.imageUrl} 
            alt={classData.name} 
            className="h-full w-full object-cover" 
          />
          
          {/* Gallery Navigation - Only for Premium with multiple images */}
          {trainer.isPremium && images.length > 1 && (
            <>
              <button
                onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentImageIndex 
                        ? 'w-8 bg-white' 
                        : 'w-2 bg-white/50 hover:bg-white/75'
                    }`}
                  />
                ))}
              </div>
              <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                <Camera className="w-3 h-3" />
                {images.length} photos
              </div>
            </>
          )}
          
          {/* Status Badges Overlay */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            {trainer.verificationStatus === 'verified' && (
              <div className="bg-blue-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified
              </div>
            )}
            {trainer.isPremium && (
              <div className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
                <Crown className="w-3.5 h-3.5" />
                Premium
              </div>
            )}
            {!trainer.isPremium && (
              <div className="bg-slate-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg">
                Basic
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 py-4 space-y-3">
          {/* Class Title and Price */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1">{classData.name}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>with</span>
                  <button 
                    onClick={() => navigate(`/trainer/${trainer.id}`)}
                    className="font-semibold text-orange-600 hover:text-orange-700 underline"
                  >
                    {trainer.name}
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="text-xl font-bold text-orange-600">{formatVND(classData.price)}</div>
                <span className="text-xs text-gray-500">per session</span>
              </div>
            </div>
          </div>

          {/* Categories & Details Section */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-orange-600" />
              Class Details
            </h3>
            
            {/* Class Type & Tags */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                {classTypeIcon}
                <span className="text-xs font-medium text-gray-700">{classData.classType} Class</span>
              </div>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {classData.level && (
                  <span className="px-2.5 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-100">
                    📚 {classData.level}
                  </span>
                )}
                {classData.language && classData.language.length > 0 && classData.language.map((lang, idx) => (
                  <span key={idx} className="px-2.5 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-lg border border-green-100">
                    🌐 {lang}
                  </span>
                ))}
                {(classData as any).kids_friendly && (
                  <span className="px-2.5 py-1.5 bg-pink-50 text-pink-700 text-xs font-medium rounded-lg border border-pink-100">
                    👶 Kids Friendly
                  </span>
                )}
                {(classData as any).disability_friendly && (
                  <span className="px-2.5 py-1.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-lg border border-purple-100">
                    ♿ Disability Friendly
                  </span>
                )}
              </div>
            </div>

            {/* Schedule & Location */}
            <div className="space-y-2 pt-3 border-t border-gray-100">
              {classData.schedule && (
                <div className="flex items-start gap-2 text-sm">
                  <Calendar className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Schedule</p>
                    <p className="text-xs text-gray-600">{classData.schedule.days.join(', ')} | {formatTime(classData.schedule.time)}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Location</p>
                  <p className="text-xs text-gray-600">{trainer.location}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Users className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Capacity</p>
                  <p className="text-xs text-gray-600">{enrolledCount} / {classData.capacity} enrolled</p>
                  {enrolledCount >= classData.capacity && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded">Class Full</span>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Clock className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Duration</p>
                  <p className="text-xs text-gray-600">{classData.duration} minutes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Categories - Trainer Specialties */}
          {trainer.specialty && trainer.specialty.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {trainer.specialty.map((cat, idx) => (
                  <span 
                    key={idx}
                    className="px-3 py-2 bg-orange-50 text-orange-700 text-xs font-semibold rounded-lg border border-orange-100 hover:bg-orange-100 transition-colors"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* About This Class */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-2">About This Class</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              {classData.description}
            </p>
          </div>

          {/* Trainer Certificates */}
          {trainerCertificates.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-orange-600" />
                Trainer Certificates & Awards
              </h3>
              <div className="space-y-2">
                {trainerCertificates.map((cert) => (
                  <div 
                    key={cert.id}
                    className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-100"
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      {getCertificateIcon(cert.document_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{cert.title}</p>
                      <p className="text-xs text-gray-600 capitalize">{cert.document_type}</p>
                    </div>
                    <ShieldCheck className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Your Coach Section */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Your Coach</h3>
            <div 
              onClick={() => navigate(`/trainer/${trainer.id}`)}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors border border-gray-100"
            >
              <img 
                src={trainer.imageUrl} 
                alt={trainer.name} 
                className="w-14 h-14 rounded-full object-cover flex-shrink-0 border-2 border-white shadow-sm" 
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold text-gray-900">{trainer.name}</p>
                  {trainer.verificationStatus === 'verified' && (
                    <ShieldCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  )}
                  {trainer.isPremium && (
                    <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="font-medium">{trainer.rating.toFixed(1)}</span>
                  </div>
                  <span>•</span>
                  <span>{trainer.reviews} reviews</span>
                </div>
              </div>
              <div className="text-orange-600 font-medium text-xs bg-orange-50 px-3 py-2 rounded-lg border border-orange-100">
                View Profile
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          {classReviews.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Star className="w-4 h-4 text-orange-600" />
                  Student Reviews ({classReviews.length})
                </h3>
              </div>
              <div className="space-y-3">
                {displayedReviews.map((review, index) => (
                  <div key={index} className="pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-900">{review.reviewerName}</p>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              review.rating >= (i + 1)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300 fill-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">"{review.comment}"</p>
                  </div>
                ))}
              </div>
              {classReviews.length > 3 && (
                <button
                  onClick={() => setShowAllReviews(!showAllReviews)}
                  className="w-full mt-3 py-2 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
                >
                  {showAllReviews ? 'Show Less' : `Show All ${classReviews.length} Reviews`}
                </button>
              )}
            </div>
          )}

          {/* Similar Classes Section */}
          {similarClasses.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 mb-3">More Classes You Might Like</h3>
              <div className="space-y-3">
                {similarClasses.map((simClass) => (
                  <div
                    key={simClass.id}
                    onClick={() => navigate(`/class/${simClass.id}`)}
                    className="flex gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-gray-100"
                  >
                    <img
                      src={simClass.imageUrl || '/placeholder-class.jpg'}
                      alt={simClass.name}
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 mb-1 truncate">{simClass.name}</p>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{simClass.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-orange-600">{formatVND(simClass.price)}</span>
                        <span className="text-xs text-gray-500">{simClass.duration} min</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Book Now Button */}
      <div className="fixed bottom-16 left-0 right-0 px-4 py-3 bg-white border-t border-gray-200 shadow-lg z-50">
        <button
          onClick={() => onInitiateBooking && trainer && onInitiateBooking({ trainer, cls: classData })}
          disabled={isBookingDisabled}
          className={`w-full flex items-center justify-center text-xs font-semibold py-2.5 px-3 rounded-lg shadow-sm transition-all duration-200 ${
            isBookingDisabled
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-[#FF6B35] text-white hover:bg-orange-600 active:scale-95'
          }`}
        >
          {isFull ? '🔒 Class Full' : userRole === 'trainer' ? 'Trainers Cannot Book' : '📅 Book Now'}
        </button>
      </div>

    </div>
  );
};

export default ClassDetailPage;
