import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import { Toaster } from './src/components/ui/toaster';
import { useToast } from './src/hooks/use-toast';
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
import BottomNav from './components/BottomNav';
import BookingModal from './components/BookingModal';
import ReviewModal from './components/ReviewModal';
import ReviewsModal from './components/ReviewsModal';
import { Trainer, Class, Booking, UserRole, Event, Message, MealPlan } from './types';
import { getAICoachResponse } from './utils/ai';

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

const AppRoutes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [favoriteTrainerIds, setFavoriteTrainerIds] = useState<string[]>([]);
  const [bookingModalData, setBookingModalData] = useState<{ trainer: Trainer; cls: Class } | null>(null);
  const [reviewModalData, setReviewModalData] = useState<{ booking: Booking; trainer: Trainer } | null>(null);
  const [reviewsModalTrainer, setReviewsModalTrainer] = useState<Trainer | null>(null);
  const [chatTrainer, setChatTrainer] = useState<Trainer | null>(null);
  
  // AI Coach state
  const [aiCoachMessages, setAiCoachMessages] = useState<Message[]>([]);
  const [isAiCoachLoading, setIsAiCoachLoading] = useState(false);

  const currentUserId = user?.id || 'current-user-id';

  // TODO: Load trainers and events from database
  useEffect(() => {
    // Fetch trainers from Supabase here
    // Fetch events from Supabase here
    // For now, starting with empty arrays
  }, []);

  const handleToggleFavorite = (trainerId: string) => {
    setFavoriteTrainerIds(prev =>
      prev.includes(trainerId)
        ? prev.filter(id => id !== trainerId)
        : [...prev, trainerId]
    );
  };

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

  const handleSaveMealPlan = (plan: Omit<MealPlan, 'id' | 'createdAt'>) => {
    // TODO: Save meal plan to database
    console.log('Saving meal plan:', plan);
    toast({
      title: "Meal Plan Saved",
      description: `"${plan.name}" has been saved successfully!`,
    });
    navigate('/');
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
                onToggleFavorite={handleToggleFavorite}
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
                onToggleFavorite={handleToggleFavorite}
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
                onToggleFavorite={handleToggleFavorite}
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
                onToggleFavorite={handleToggleFavorite}
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
