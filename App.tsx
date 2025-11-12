import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
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
import VenuesPage from './pages/VenuesPage';
import BottomNav from './components/BottomNav';
import BookingModal from './components/BookingModal';
import ReviewModal from './components/ReviewModal';
import ReviewsModal from './components/ReviewsModal';
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
  
  // AI Coach state
  const [aiCoachMessages, setAiCoachMessages] = useState<Message[]>([]);
  const [isAiCoachLoading, setIsAiCoachLoading] = useState(false);

  // Use custom hooks for data fetching
  const { trainers, loading: trainersLoading } = useTrainers();
  const { favoriteTrainerIds, toggleFavorite } = useFavorites();
  const { events } = useEvents();

  const currentUserId = user?.id || 'current-user-id';

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
    updateLastSeen(user.id).catch(err => console.error('Failed to update last_seen on mount:', err));

    // Update every 2 minutes while user is active
    const interval = setInterval(() => {
      updateLastSeen(user.id).catch(err => console.error('Failed to update last_seen:', err));
    }, 120000); // 2 minutes

    // Update on visibility change (when user comes back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden && user.id) {
        updateLastSeen(user.id).catch(err => console.error('Failed to update last_seen on visibility change:', err));
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Update on user interactions (scroll, click, etc.)
    const handleUserActivity = () => {
      if (user.id) {
        updateLastSeen(user.id).catch(err => console.error('Failed to update last_seen on activity:', err));
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
          onConfirmBooking={(trainerId, classId, startDate, period) => {
            // Handle booking confirmation
            toast({
              title: "Booking Confirmed!",
              description: `Your booking has been confirmed for ${period === 'once' ? '1 session' : '4 weeks'}`,
            });
            setBookingModalData(null);
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
      <Toaster />
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
};

export default App;
