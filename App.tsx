import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
import OnboardingPageContainer from './pages/OnboardingPageContainer';
import ProfileContainer from './pages/ProfileContainer';
import VerificationPage from './pages/VerificationPage';
import EventsFlowPage from './pages/EventsFlowPage';
import MealPlannerPage from './pages/MealPlannerPage';
import AICoachPage from './pages/AICoachPage';
import UploadCategoryIconsPage from './pages/UploadCategoryIconsPage';
import MediaUploadPage from './pages/MediaUploadPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ClassDetailPage from './pages/ClassDetailPage';
import TrainerProfileViewPage from './pages/TrainerProfileViewPage';
import VenuesPage from './pages/VenuesPage';
import SubscriptionManagementPage from './pages/SubscriptionManagementPage';
import BottomNav from './components/BottomNav';
import BookingModal from './components/BookingModal';
import ReviewModal from './components/ReviewModal';
import ReviewsModal from './components/ReviewsModal';
import BookingVerificationDisplay from './components/BookingVerificationDisplay';
import { Trainer, Class, Booking, UserRole, Event, Message, MealPlan, Venue } from './types';
import { mockVenues } from './data/mockVenues';
import { getAICoachResponse } from './utils/ai';
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

const AppRoutes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
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
  const { trainers, loading: trainersLoading } = useTrainers();
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
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
        <Route path="/welcome" element={<WelcomePage />} />
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
              <Explore
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
              <HomePage
                trainers={trainers}
                onInitiateBooking={handleInitiateBooking}
                onOpenChat={handleOpenChat}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
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
      {user && <BottomNav />}
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
              const { data, error } = await supabase
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

              if (error) {
                toast({
                  title: "Booking Failed",
                  description: error.message || "Failed to create booking. Please try again.",
                  variant: "destructive",
                });
                return;
              }

              // Show verification code modal
              if (data && data.verification_code) {
                setVerificationCode({
                  code: data.verification_code,
                  bookingId: data.id
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
