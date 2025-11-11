import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../src/integrations/supabase/client';
import { Class, Trainer, UserRole } from '../types';
import { ArrowLeft, Clock, Users, MapPin, Building, Sun, Home, Star, Crown, Calendar } from 'lucide-react';
import ImageGalleryModal from '../components/ImageGalleryModal';

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
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  console.log('🎯 ClassDetailPage MOUNTED');
  console.log('📋 Props received:', { userRole, currentUserId, classId });
  console.log('🔗 URL params:', useParams());

  useEffect(() => {
    console.log('🔄 useEffect triggered for classId:', classId);
    if (!classId) {
      console.error('❌ No classId provided!');
      return;
    }
    loadClassData();
  }, [classId]);

  const loadClassData = async () => {
    if (!classId) {
      console.error('❌ loadClassData: No classId');
      return;
    }

    try {
      setLoading(true);
      console.log('📥 Loading class data for ID:', classId);

      // Fetch class data
      const { data: classInfo, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .maybeSingle();

      console.log('🔍 Supabase query result:', { classInfo, classError });

      if (classError) {
        console.error('❌ Error fetching class:', classError);
        throw classError;
      }

      if (!classInfo) {
        console.error('❌ Class not found for ID:', classId);
        setLoading(false);
        return;
      }

      console.log('✅ Class data loaded:', classInfo);

      // Fetch trainer profile
      console.log('📥 Loading trainer profile for ID:', classInfo.trainer_id);
      const { data: trainerProfile, error: trainerError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', classInfo.trainer_id)
        .maybeSingle();

      console.log('🔍 Trainer query result:', { trainerProfile, trainerError });

      if (trainerError) {
        console.error('❌ Error fetching trainer:', trainerError);
        throw trainerError;
      }

      if (!trainerProfile) {
        console.error('❌ Trainer not found for ID:', classInfo.trainer_id);
        setLoading(false);
        return;
      }

      console.log('✅ Trainer data loaded:', trainerProfile);

      // Fetch bookings for this class
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('class_id', classId);

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
      }

      console.log('Bookings loaded:', bookings?.length || 0);

      // Transform class data
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
      };

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
      console.log('✅✅✅ Class and trainer data set successfully');
      console.log('📊 Final state:', { cls, trainerData });
    } catch (error) {
      console.error('💥 ERROR in loadClassData:', error);
    } finally {
      setLoading(false);
      console.log('🏁 Loading complete, loading state set to false');
    }
  };

  const openGallery = (index: number) => {
    setSelectedImageIndex(index);
    setIsGalleryOpen(true);
  };

  console.log('🎨 RENDER - State:', { 
    loading, 
    hasClassData: !!classData, 
    hasTrainer: !!trainer,
    classId,
    className: classData?.name 
  });

  if (loading) {
    console.log('⏳ Rendering loading state...');
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Loading class details...</p>
        </div>
      </div>
    );
  }

  if (!classData || !trainer) {
    console.log('❌ Rendering NOT FOUND state - classData:', !!classData, 'trainer:', !!trainer);
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

  const enrolledCount = 0; // TODO: Get from bookings
  const enrollmentPercentage = classData.capacity > 0 ? (enrolledCount / classData.capacity) * 100 : 0;
  const isFull = enrolledCount >= classData.capacity;
  const isBookingDisabled = userRole === 'trainer' || isFull;

  const classTypeIcon = {
    Indoor: <Building className="w-5 h-5" />,
    Outdoor: <Sun className="w-5 h-5" />,
    Home: <Home className="w-5 h-5" />,
  };

  const images = classData.imageUrls && classData.imageUrls.length > 0 
    ? classData.imageUrls 
    : classData.imageUrl 
    ? [classData.imageUrl] 
    : [];

  return (
    <div className="bg-background min-h-screen pb-24">
      {console.log('✅ Rendering ClassDetailPage content - Class:', classData.name, 'Trainer:', trainer.name)}
      {/* Header Image */}
      <div className="relative">
        <img 
          src={images[0] || classData.imageUrl} 
          alt={classData.name} 
          className="h-72 w-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm p-2 rounded-full hover:bg-background transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        {trainer.isPremium && (
          <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center shadow-lg">
            <Crown className="w-4 h-4 mr-1" />
            PREMIUM CLASS
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 bg-background -mt-8 rounded-t-2xl relative z-10">
        {/* Class Info */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground mb-2">{classData.name}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{classData.duration} min</span>
              </div>
              <div className="flex items-center gap-1">
                {classTypeIcon[classData.classType]}
                <span>{classData.classType}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">{formatVND(classData.price)}</p>
            <p className="text-xs text-muted-foreground">per session</p>
          </div>
        </div>

        {/* Trainer Info */}
        <div 
          onClick={() => navigate(`/trainer/${trainer.id}`)}
          className="bg-card p-3 rounded-xl mb-6 flex items-center gap-3 cursor-pointer hover:bg-accent transition-colors"
        >
          <img src={trainer.imageUrl} alt={trainer.name} className="w-12 h-12 rounded-full object-cover" />
          <div className="flex-1">
            <p className="font-semibold text-foreground">{trainer.name}</p>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 mr-1" />
                <span className="text-muted-foreground">{trainer.rating.toFixed(1)}</span>
              </div>
              <span className="text-muted-foreground">•</span>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span className="text-xs">{trainer.location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-foreground mb-2">About This Class</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{classData.description}</p>
        </div>

        {/* Image Gallery for Premium */}
        {trainer.isPremium && images.length > 1 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-foreground mb-3">Class Gallery</h2>
            <div className="grid grid-cols-3 gap-2">
              {images.map((imgUrl, index) => (
                <button 
                  key={index} 
                  onClick={() => openGallery(index)}
                  className="aspect-square rounded-lg overflow-hidden"
                >
                  <img src={imgUrl} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Schedule */}
        {classData.schedule && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Schedule
            </h2>
            <div className="bg-primary/10 rounded-xl p-4">
              <p className="text-sm font-semibold text-foreground mb-1">
                {classData.schedule.days.join(', ')}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatTime(classData.schedule.time)}
              </p>
            </div>
          </div>
        )}

        {/* Enrollment Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Enrollment</span>
            </div>
            <span className={`text-sm font-bold ${isFull ? 'text-destructive' : 'text-foreground'}`}>
              {enrolledCount} / {classData.capacity}
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${isFull ? 'bg-destructive' : 'bg-primary'}`}
              style={{ width: `${enrollmentPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Book Button */}
        <button
          onClick={() => onInitiateBooking && trainer && onInitiateBooking({ trainer, cls: classData })}
          disabled={isBookingDisabled}
          className={`w-full font-bold py-3.5 px-4 rounded-xl transition-all duration-200 ${
            isBookingDisabled
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg'
          }`}
        >
          {isFull ? 'Class Full' : userRole === 'trainer' ? 'Trainers Cannot Book' : 'Book This Class'}
        </button>
      </div>

      {/* Image Gallery Modal */}
      {isGalleryOpen && images.length > 0 && (
        <ImageGalleryModal
          images={images}
          startIndex={selectedImageIndex}
          onClose={() => setIsGalleryOpen(false)}
        />
      )}
    </div>
  );
};

export default ClassDetailPage;
