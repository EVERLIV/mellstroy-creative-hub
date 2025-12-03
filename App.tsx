import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { User, X } from 'lucide-react';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import { ThemeProvider } from './src/hooks/useTheme';
import { supabase } from './src/integrations/supabase/client';
import { Toaster } from './src/components/ui/toaster';
import { useToast } from './src/hooks/use-toast';
import { useTrainers } from './src/hooks/useTrainers';
import { useFavorites } from './src/hooks/useFavorites';
import { useEvents } from './src/hooks/useEvents';
import { validateEnv } from './src/utils/env';
import { saveMealPlan } from './src/utils/mealPlans';
import { updateLastSeen } from './src/utils/onlineStatus';
import AuthPage from './src/pages/AuthPage';
import WelcomePage from './pages/WelcomePage';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import Explore from './pages/Explore';
import SearchPage from './pages/SearchPage';
import FavoritesPage from './pages/FavoritesPage';
import MyBookingsPage from './pages/MyBookingsPage';
import ChatPage from './pages/ChatPage';
import MessageListPage from './pages/MessageListPage';
import ChatConversationPage from './pages/ChatConversationPage';
import ChatInfoPage from './pages/ChatInfoPage';
import OnboardingPageContainer from './pages/OnboardingPageContainer';
import ProfileContainer from './pages/ProfileContainer';
import VerificationPage from './pages/VerificationPage';
import EventsFlowPage from './pages/EventsFlowPage';
import MealPlannerPage from './pages/MealPlannerPage';
import AICoachPage from './pages/AICoachPage';
import AICoachProfilePage from './pages/AICoachProfilePage';
import UploadCategoryIconsPage from './pages/UploadCategoryIconsPage';
import MediaUploadPage from './pages/MediaUploadPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ClassDetailPage from './pages/ClassDetailPage';
import TrainerProfileViewPage from './pages/TrainerProfileViewPage';
import VenuesPage from './pages/VenuesPage';
import SubscriptionManagementPage from './pages/SubscriptionManagementPage';
import MyReviewsPage from './pages/MyReviewsPage';
import BottomNav from './components/BottomNav';
import BookingModal from './components/BookingModal';
import ReviewModal from './components/ReviewModal';
import ReviewsModal from './components/ReviewsModal';
import BookingVerificationDisplay from './components/BookingVerificationDisplay';
import CategoryPage from './pages/CategoryPage';
import { CATEGORIES } from './constants';
import { Trainer, Class, Booking, UserRole, Event, Message, MealPlan, Venue, Category } from './types';
import { mockVenues } from './data/mockVenues';
import { getAICoachResponse } from './utils/ai';
import PWAInstallPrompt from './components/PWAInstallPrompt';
// ErrorBoundary temporarily disabled due to React 19 TypeScript compatibility
// import { ErrorBoundary } from './src/components/ErrorBoundary';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const VenuesPageWrapper = () => {
  const navigate = useNavigate();
  return <VenuesPage venues={mockVenues} onBack={() => navigate('/')} />;
};

const CategoryRoute: React.FC<{
  trainers: Trainer[];
  onInitiateBooking: (target: { trainer: Trainer; cls: Class }) => void;
  onOpenChat: (trainer: Trainer, context?: { className: string; bookingDate?: string }) => void;
  userRole: UserRole;
  currentUserId: string;
  favoriteTrainerIds: string[];
  onToggleFavorite: (trainerId: string) => void;
  onOpenReviewsModal: (trainer: Trainer) => void;
}> = ({
  trainers,
  onInitiateBooking,
  onOpenChat,
  userRole,
  currentUserId,
  favoriteTrainerIds,
  onToggleFavorite,
  onOpenReviewsModal,
}) => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();

  const category = (CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0]) as Category;

  const categorySpecialtyMap: { [key: string]: string[] } = {
    gym: ['strength training', 'hiit', 'personal training', 'gym coach'],
    yoga: ['yoga', 'pilates'],
    tennis: ['tennis'],
    boxing: ['boxing', 'kickboxing', 'mma'],
    swimming: ['swimming'],
    pickleball: ['pickleball'],
    dance: ['dance fitness'],
    running: ['running'],
  };

  const relevantSpecialties = categorySpecialtyMap[category.id] || [category.name.toLowerCase()];

  const categoryTrainers = trainers.filter(trainer =>
    trainer.specialty.some(spec =>
      relevantSpecialties.some(rs => rs && spec.toLowerCase().includes(rs)),
    ),
  );

  return (
    <CategoryPage
      category={category}
      trainers={categoryTrainers}
      onBack={() => navigate(-1)}
      onInitiateBooking={onInitiateBooking}
      onOpenChat={onOpenChat}
      userRole={userRole}
      currentUserId={currentUserId}
      favoriteTrainerIds={favoriteTrainerIds}
      onToggleFavorite={onToggleFavorite}
      onOpenReviewsModal={onOpenReviewsModal}
    />
  );
};

const AppRoutes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [bookingModalData, setBookingModalData] = useState<{ trainer: Trainer; cls: Class } | null>(null);
  const [reviewModalData, setReviewModalData] = useState<{ booking: Booking; trainer: Trainer } | null>(null);
  const [reviewsModalTrainer, setReviewsModalTrainer] = useState<Trainer | null>(null);
  const [chatTrainer, setChatTrainer] = useState<Trainer | null>(null);
  const [verificationCode, setVerificationCode] = useState<{ code: string; bookingId: string } | null>(null);
  
  // AI Coach state
  const [aiCoachMessages, setAiCoachMessages] = useState<Message[]>([]);
  const [isAiCoachLoading, setIsAiCoachLoading] = useState(false);

  // Use custom hooks for data fetching
  const { trainers, loading: trainersLoading, refetch: refetchTrainers } = useTrainers();
  const { favoriteTrainerIds, toggleFavorite } = useFavorites();
  const { events } = useEvents();

  const currentUserId = user?.id || 'current-user-id';

  // Fetch user role from database
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!error && data) {
        setUserRole(data.role as UserRole);
      }
    };

    fetchUserRole();
  }, [user?.id]);

  // Validate environment variables on mount
  useEffect(() => {
    if (!validateEnv()) {
      toast({
        title: 'Configuration Warning',
        description: 'Some environment variables are missing. Please check your .env.local file.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Update last_seen timestamp periodically for online status
  useEffect(() => {
    if (!user?.id) return;

    // Update immediately on mount
    updateLastSeen(user.id).catch(() => {});

    // Update every 2 minutes while user is active
    const interval = setInterval(() => {
      updateLastSeen(user.id).catch(() => {});
    }, 120000); // 2 minutes

    // Update on visibility change (when user comes back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden && user.id) {
        updateLastSeen(user.id).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Update on user interactions (scroll, click, etc.)
    const handleUserActivity = () => {
      if (user.id) {
        updateLastSeen(user.id).catch(() => {});
      }
    };
    
    // Throttle activity updates to avoid too many calls
    let activityTimeout: NodeJS.Timeout;
    const throttledActivity = () => {
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(handleUserActivity, 30000); // Update every 30 seconds max
    };
    
    window.addEventListener('scroll', throttledActivity, { passive: true });
    window.addEventListener('click', throttledActivity, { passive: true });
    window.addEventListener('keydown', throttledActivity, { passive: true });

    return () => {
      clearInterval(interval);
      clearTimeout(activityTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('scroll', throttledActivity);
      window.removeEventListener('click', throttledActivity);
      window.removeEventListener('keydown', throttledActivity);
    };
  }, [user?.id]);

  const handleInitiateBooking = (data: { trainer: Trainer; cls: Class }) => {
    setBookingModalData(data);
  };

  const handleOpenChat = (trainer: Trainer) => {
    setChatTrainer(trainer);
  };

  const handleOpenReviewsModal = (trainer: Trainer) => {
    setReviewsModalTrainer(trainer);
  };

  const handleSendAICoachMessage = async (messageText: string) => {
    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    setAiCoachMessages(prev => [...prev, userMessage]);
    setIsAiCoachLoading(true);

    try {
      const response = await getAICoachResponse(messageText);
      const aiMessage: Message = {
        id: Date.now(),
        sender: 'trainer',
        text: response,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setAiCoachMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get response from AI Coach. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAiCoachLoading(false);
    }
  };

  const handleSaveMealPlan = async (plan: Omit<MealPlan, 'id' | 'createdAt'>) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to save meal plans.",
        variant: "destructive",
      });
      return;
    }

    try {
      await saveMealPlan(user.id, plan);
      toast({
        title: "Meal Plan Saved",
        description: `"${plan.name}" has been saved successfully!`,
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save meal plan. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PWAInstallPrompt />
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
        <Route 
          path="/welcome" 
          element={
            <WelcomePage 
              trainers={trainers}
              onOpenMealPlanner={() => navigate('/meal-planner')}
              onOpenAICoach={() => navigate('/ai-coach')}
              events={events}
              onNavigate={(page) => navigate(`/${page}`)}
              onSelectEvent={(event) => navigate(`/events/${event.id}`)}
              onSelectTopCategory={(category) => {
                setSelectedCategory(category.id);
                navigate('/explore');
              }}
            />
          } 
        />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingPageContainer /></ProtectedRoute>} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/explore"
          element={
            <ProtectedRoute>
              {userRole === 'trainer' ? (
                <Navigate to="/" replace />
              ) : (
                <Explore
                  onInitiateBooking={handleInitiateBooking}
                  onOpenChat={handleOpenChat}
                  userRole={userRole}
                  currentUserId={currentUserId}
                  favoriteTrainerIds={favoriteTrainerIds}
                  onToggleFavorite={toggleFavorite}
                  onOpenReviewsModal={handleOpenReviewsModal}
                />
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/class/:classId"
          element={
            <ProtectedRoute>
              <ClassDetailPage
                userRole={userRole}
                currentUserId={currentUserId}
                onInitiateBooking={handleInitiateBooking}
                onOpenChat={handleOpenChat}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trainer/:trainerId"
          element={
            <ProtectedRoute>
              <TrainerProfileViewPage
                userRole={userRole}
                currentUserId={currentUserId}
                favoriteTrainerIds={favoriteTrainerIds}
                onToggleFavorite={toggleFavorite}
                onInitiateBooking={handleInitiateBooking}
                onOpenReviewsModal={handleOpenReviewsModal}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/category/:categoryId"
          element={
            <ProtectedRoute>
              {userRole === 'trainer' ? (
                <Navigate to="/" replace />
              ) : (
                <CategoryRoute
                  trainers={trainers}
                  onInitiateBooking={handleInitiateBooking}
                  onOpenChat={handleOpenChat}
                  userRole={userRole}
                  currentUserId={currentUserId}
                  favoriteTrainerIds={favoriteTrainerIds}
                  onToggleFavorite={toggleFavorite}
                  onOpenReviewsModal={handleOpenReviewsModal}
                />
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/events"
          element={
            <ProtectedRoute>
              <EventsFlowPage onBack={() => navigate('/')} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/meal-planner"
          element={
            <ProtectedRoute>
              {user && (
                <MealPlannerPage
                  user={user as any}
                  onClose={() => navigate('/')}
                  onSavePlan={handleSaveMealPlan}
                />
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-coach"
          element={
            <ProtectedRoute>
              <AICoachPage
                messages={aiCoachMessages}
                onSendMessage={handleSendAICoachMessage}
                isLoading={isAiCoachLoading}
                onClose={() => navigate('/')}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-coach/profile"
          element={
            <ProtectedRoute>
              <AICoachProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscription"
          element={
            <ProtectedRoute>
              <SubscriptionManagementPage onBack={() => navigate(-1)} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <SearchPage
                trainers={trainers}
                onInitiateBooking={handleInitiateBooking}
                onOpenChat={handleOpenChat}
                userRole={userRole}
                currentUserId={currentUserId}
                favoriteTrainerIds={favoriteTrainerIds}
                onToggleFavorite={toggleFavorite}
                onOpenReviewsModal={handleOpenReviewsModal}
                onRefreshTrainers={refetchTrainers}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <FavoritesPage
                trainers={trainers.filter(t => favoriteTrainerIds.includes(t.id))}
                onInitiateBooking={handleInitiateBooking}
                onOpenChat={handleOpenChat}
                userRole={userRole}
                currentUserId={currentUserId}
                favoriteTrainerIds={favoriteTrainerIds}
                onToggleFavorite={toggleFavorite}
                onOpenReviewsModal={handleOpenReviewsModal}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfileContainer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-reviews"
          element={
            <ProtectedRoute>
              <MyReviewsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/verification"
          element={
            <ProtectedRoute>
              <VerificationPage 
                onBack={() => window.history.back()}
                onComplete={() => window.history.back()}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload-category-icons"
          element={
            <ProtectedRoute>
              <UploadCategoryIconsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/media-upload"
          element={
            <ProtectedRoute>
              <MediaUploadPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <MyBookingsPage
                trainers={trainers}
                currentUserId={currentUserId}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <MessageListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages/:recipientId"
          element={
            <ProtectedRoute>
              <ChatConversationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages/:recipientId/info"
          element={
            <ProtectedRoute>
              <ChatInfoPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              {chatTrainer && <ChatPage trainer={chatTrainer} />}
            </ProtectedRoute>
          }
        />
        <Route
          path="/venues"
          element={
            <ProtectedRoute>
              <VenuesPageWrapper />
            </ProtectedRoute>
          }
        />
      </Routes>
      {user && 
        location.pathname !== '/ai-coach' && 
        location.pathname !== '/meal-planner' && 
        !location.pathname.startsWith('/messages/') && 
        <BottomNav />
      }
      {bookingModalData && (
        <BookingModal
          bookingTarget={bookingModalData}
          onConfirmBooking={async (trainerId, classId, startDate, period) => {
            try {
              if (!user?.id) {
                toast({
                  title: "Error",
                  description: "You must be logged in to book a class",
                  variant: "destructive",
                });
                return;
              }

              // Format the date
              const bookingDate = startDate.toISOString().split('T')[0];
              const bookingTime = bookingModalData.cls.schedule?.time || '00:00';

              // Check if user is a trainer
              if (userRole === 'trainer') {
                toast({
                  title: "Booking Not Allowed",
                  description: "Trainers cannot book classes. Only students can book classes.",
                  variant: "destructive",
                });
                return;
              }

              // Insert booking into database
              const { data: bookingData, error: bookingError } = await supabase
                .from('bookings')
                .insert({
                  class_id: classId,
                  client_id: user.id,
                  booking_date: bookingDate,
                  booking_time: bookingTime,
                  status: 'booked'
                })
                .select()
                .single();

              if (bookingError) {
                toast({
                  title: "Booking Failed",
                  description: bookingError.message || "Failed to create booking. Please try again.",
                  variant: "destructive",
                });
                return;
              }

              // Create or find existing conversation between student and trainer
              const { data: existingConversation } = await supabase
                .from('conversations')
                .select('id')
                .or(`and(participant_1_id.eq.${user.id},participant_2_id.eq.${trainerId}),and(participant_1_id.eq.${trainerId},participant_2_id.eq.${user.id})`)
                .maybeSingle();

              let conversationId: string;

              if (!existingConversation) {
                // Create new conversation
                const { data: newConversation } = await supabase
                  .from('conversations')
                  .insert({
                    participant_1_id: user.id,
                    participant_2_id: trainerId,
                    booking_id: bookingData.id,
                    last_message_at: new Date().toISOString()
                  })
                  .select('id')
                  .single();
                conversationId = newConversation?.id || '';
              } else {
                // Update existing conversation with booking reference
                await supabase
                  .from('conversations')
                  .update({
                    booking_id: bookingData.id,
                    last_message_at: new Date().toISOString()
                  })
                  .eq('id', existingConversation.id);
                conversationId = existingConversation.id;
              }

              // Send automatic booking details message
              if (conversationId) {
                const bookingMessage = `📅 *Booking Confirmed*\n\n` +
                  `🏋️ Class: ${bookingModalData.cls.name}\n` +
                  `📆 Date: ${new Date(bookingDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}\n` +
                  `⏰ Time: ${bookingTime}\n` +
                  `🔢 Verification Code: ${bookingData.verification_code}\n\n` +
                  `⚠️ *Important:* Payment at meeting only. Pay your trainer in person at the class. Never send money through chat.`;

                await supabase
                  .from('messages')
                  .insert({
                    conversation_id: conversationId,
                    sender_id: user.id,
                    recipient_id: trainerId,
                    content: bookingMessage
                  });
              }

              // Show verification code modal
              if (bookingData && bookingData.verification_code) {
                setVerificationCode({
                  code: bookingData.verification_code,
                  bookingId: bookingData.id
                });
              }

              toast({
                title: "Booking Confirmed!",
                description: `Your booking has been confirmed for ${period === 'once' ? '1 session' : '4 weeks'}`,
              });
              setBookingModalData(null);
            } catch (error) {
              toast({
                title: "Error",
                description: "An unexpected error occurred. Please try again.",
                variant: "destructive",
              });
            }
          }}
          onClose={() => setBookingModalData(null)}
        />
      )}
      {reviewModalData && (
        <ReviewModal
          booking={reviewModalData.booking}
          trainer={reviewModalData.trainer}
          onClose={() => setReviewModalData(null)}
          onSubmit={() => setReviewModalData(null)}
        />
      )}
      {reviewsModalTrainer && (
        <ReviewsModal
          trainer={reviewsModalTrainer}
          onClose={() => setReviewsModalTrainer(null)}
        />
      )}
      {verificationCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Booking Confirmed!</h2>
              <button
                onClick={() => {
                  setVerificationCode(null);
                  navigate('/bookings');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="p-6">
              <BookingVerificationDisplay 
                verificationCode={verificationCode.code}
                bookingId={verificationCode.bookingId}
              />
              <button
                onClick={() => {
                  setVerificationCode(null);
                  navigate('/bookings');
                }}
                className="w-full mt-4 bg-[#FF6B35] text-white py-3 px-4 rounded-xl font-semibold hover:bg-orange-600 transition-all active:scale-95"
              >
                Go to My Bookings
              </button>
            </div>
          </div>
        </div>
      )}
      <Toaster />
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider defaultTheme="light" storageKey="rhinofit-theme">
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
