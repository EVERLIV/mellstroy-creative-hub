import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Calendar, MessageSquare, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/hooks/useAuth';
import { useToast } from '../src/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface TrainerProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  location: string | null;
  specialty: string[] | null;
  rating: number | null;
  reviews_count: number | null;
  bio: string | null;
  experience_years: number | null;
  last_seen: string | null;
  price_per_hour: number | null;
}

interface TrainerClass {
  id: string;
  name: string;
  price: number;
  class_type: string;
}

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  verification_code: string;
  class: {
    name: string;
    price: number;
  };
}

const ChatInfoPage: React.FC = () => {
  const { recipientId } = useParams<{ recipientId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Format price with thousands separator and VND
  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + ' VND';
  };
  
  const [trainer, setTrainer] = useState<TrainerProfile | null>(null);
  const [trainerClasses, setTrainerClasses] = useState<TrainerClass[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [messageCount, setMessageCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChatInfo();
  }, [recipientId, user]);

  const loadChatInfo = async () => {
    if (!recipientId || !user) return;

    try {
      setLoading(true);

      // Load trainer profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', recipientId)
        .single();

      if (profileError) throw profileError;
      setTrainer(profileData);

      // Load trainer's classes
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('id, name, price, class_type')
        .eq('trainer_id', recipientId)
        .order('name');

      if (!classesError && classesData) {
        setTrainerClasses(classesData);
      }

      // Load bookings between user and trainer
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          booking_time,
          status,
          verification_code,
          class:classes(name, price)
        `)
        .eq('client_id', user.id)
        .eq('classes.trainer_id', recipientId)
        .order('booking_date', { ascending: false });

      if (!bookingsError && bookingsData) {
        setBookings(bookingsData as any);
      }

      // Count messages in conversation
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant_1_id.eq.${user.id},participant_2_id.eq.${recipientId}),and(participant_1_id.eq.${recipientId},participant_2_id.eq.${user.id})`)
        .maybeSingle();

      if (conversation) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conversation.id);
        
        setMessageCount(count || 0);
      }

    } catch (error) {
      console.error('Error loading chat info:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat information',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getOnlineStatus = () => {
    if (!trainer?.last_seen) return { text: 'Offline', color: 'text-muted-foreground' };
    
    const lastSeen = new Date(trainer.last_seen);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / 60000);
    
    if (diffMinutes < 5) return { text: 'Online', color: 'text-green-600' };
    if (diffMinutes < 60) return { text: `Active ${diffMinutes} min ago`, color: 'text-yellow-600' };
    if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      return { text: `Active ${hours}h ago`, color: 'text-orange-600' };
    }
    const days = Math.floor(diffMinutes / 1440);
    return { text: `Active ${days}d ago`, color: 'text-muted-foreground' };
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; color: string } } = {
      booked: { label: 'Booked', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
      attended: { label: 'Attended', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
      cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
    };
    
    const statusInfo = statusMap[status] || statusMap.booked;
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!trainer) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Trainer not found</p>
      </div>
    );
  }

  const onlineStatus = getOnlineStatus();

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header - WhatsApp/Telegram style */}
      <div className="bg-card border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5">
          {/* Back Button */}
          <button 
            onClick={() => navigate(`/messages/${recipientId}`)} 
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors flex-shrink-0"
            aria-label="Back to chat"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          
          {/* Title */}
          <h1 className="text-base font-semibold text-foreground flex-1">Chat Info</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Trainer Profile - Compact */}
        <div className="bg-card border-b border-border p-4">
          <div className="flex items-start gap-3 mb-4">
            {/* Small Avatar */}
            <img
              src={trainer.avatar_url || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200'}
              alt={trainer.username}
              className="w-16 h-16 rounded-full object-cover border-2 border-border flex-shrink-0"
            />
            
            {/* Trainer Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-foreground mb-1">{trainer.username}</h2>
              <p className={`text-xs ${onlineStatus.color} font-medium mb-2`}>{onlineStatus.text}</p>
              
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-2">
                {trainer.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {trainer.location}
                  </div>
                )}
                
                {trainer.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold text-foreground">{trainer.rating.toFixed(1)}</span>
                    <span>({trainer.reviews_count || 0})</span>
                  </div>
                )}
                
                {trainer.experience_years && (
                  <span>{trainer.experience_years} years exp.</span>
                )}
              </div>

              {/* Price per hour */}
              {trainer.price_per_hour && (
                <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg inline-flex items-center gap-1 text-sm font-semibold">
                  {formatPrice(trainer.price_per_hour)}/hour
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {trainer.bio && (
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">{trainer.bio}</p>
          )}

          {/* Specializations */}
          {trainer.specialty && trainer.specialty.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Specializations
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {trainer.specialty.map((spec, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => navigate(`/trainer/${trainer.id}`)}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 rounded-lg transition-colors text-sm"
          >
            View Full Profile
          </button>
        </div>

        {/* Trainer's Classes */}
        {trainerClasses.length > 0 && (
          <div className="bg-card border-b border-border p-4">
            <h3 className="text-sm font-bold text-foreground mb-3">Classes</h3>
            <div className="space-y-2">
              {trainerClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{cls.name}</p>
                    <p className="text-xs text-muted-foreground">{cls.class_type}</p>
                  </div>
                  <div className="text-sm font-semibold text-primary ml-3">
                    {formatPrice(cls.price)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Statistics */}
        <div className="bg-card border-b border-border p-4">
          <h3 className="text-sm font-bold text-foreground mb-3">Chat Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Messages</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{messageCount}</p>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Bookings</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{bookings.length}</p>
            </div>
          </div>
        </div>

        {/* Booking History */}
        <div className="bg-card border-b border-border p-6">
          <h3 className="text-sm font-bold text-foreground mb-4">Booking History</h3>
          {bookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">No bookings yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-muted rounded-lg p-4 border border-border"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-sm text-foreground">
                      {booking.class?.name || 'Unknown Class'}
                    </h4>
                    {getStatusBadge(booking.status)}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      📅 {new Date(booking.booking_date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                    <span>⏰ {booking.booking_time}</span>
                  </div>
                  {booking.verification_code && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <span className="text-xs text-muted-foreground">Verification: </span>
                      <span className="text-xs font-mono font-bold text-foreground">
                        #{booking.verification_code}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat Settings */}
        <div className="bg-card p-6">
          <h3 className="text-sm font-bold text-foreground mb-4">Chat Settings</h3>
          <div className="space-y-2">
            <button
              onClick={() => {
                toast({
                  title: 'Feature Coming Soon',
                  description: 'Mute notifications feature will be available soon',
                });
              }}
              className="w-full text-left px-4 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
            >
              <p className="text-sm font-medium text-foreground">Mute Notifications</p>
              <p className="text-xs text-muted-foreground">Stop receiving notifications from this chat</p>
            </button>
            
            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear chat history? This action cannot be undone.')) {
                  toast({
                    title: 'Feature Coming Soon',
                    description: 'Clear chat history feature will be available soon',
                  });
                }
              }}
              className="w-full text-left px-4 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
            >
              <p className="text-sm font-medium text-foreground">Clear Chat History</p>
              <p className="text-xs text-muted-foreground">Delete all messages in this conversation</p>
            </button>

            <button
              onClick={() => navigate(`/messages/${recipientId}`)}
              className="w-full text-left px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <p className="text-sm font-medium text-red-600">Report Chat</p>
              </div>
              <p className="text-xs text-red-600/70 ml-6">Report this conversation for violations</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInfoPage;
