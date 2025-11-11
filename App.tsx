import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import { Toaster } from './src/components/ui/toaster';
import AuthPage from './src/pages/AuthPage';
import WelcomePage from './pages/WelcomePage';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import FavoritesPage from './pages/FavoritesPage';
import ProfilePage from './pages/ProfilePage';
import StudentProfilePage from './pages/StudentProfilePage';
import MyBookingsPage from './pages/MyBookingsPage';
import ChatPage from './pages/ChatPage';
import CreateProfilePage from './pages/CreateProfilePage';
import OnboardingPage from './pages/OnboardingPage';
import BottomNav from './components/BottomNav';
import BookingModal from './components/BookingModal';
import ReviewModal from './components/ReviewModal';
import ReviewsModal from './components/ReviewsModal';
import { Trainer, Class, Booking, UserRole } from './types';

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
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [favoriteTrainerIds, setFavoriteTrainerIds] = useState<string[]>([]);
  const [bookingModalData, setBookingModalData] = useState<{ trainer: Trainer; cls: Class } | null>(null);
  const [reviewModalData, setReviewModalData] = useState<{ booking: Booking; trainer: Trainer } | null>(null);
  const [reviewsModalTrainer, setReviewsModalTrainer] = useState<Trainer | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [chatTrainer, setChatTrainer] = useState<Trainer | null>(null);

  const currentUserId = user?.id || 'current-user-id';

  // TODO: Load trainers from database
  useEffect(() => {
    // Fetch trainers from Supabase here
    // For now, starting with empty array
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
    setCurrentPage('chat');
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const handleOpenReviewsModal = (trainer: Trainer) => {
    setReviewsModalTrainer(trainer);
  };

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
        <Route path="/welcome" element={<WelcomePage onGetStarted={() => handleNavigate('home')} />} />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage onComplete={() => handleNavigate('home')} /></ProtectedRoute>} />
        <Route
          path="/"
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
                onNavigate={handleNavigate}
                onOpenReviewsModal={handleOpenReviewsModal}
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
                onNavigate={handleNavigate}
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
                onNavigate={handleNavigate}
                onOpenReviewsModal={handleOpenReviewsModal}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              {userRole === 'trainer' ? (
                <ProfilePage currentUser={trainers.find(t => t.id === currentUserId)!} onNavigate={handleNavigate} />
              ) : (
                <StudentProfilePage currentUser={trainers.find(t => t.id === currentUserId)!} onNavigate={handleNavigate} />
              )}
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
                onNavigate={handleNavigate}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              {chatTrainer && <ChatPage trainer={chatTrainer} onBack={() => handleNavigate('home')} />}
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-profile"
          element={
            <ProtectedRoute>
              <CreateProfilePage onComplete={() => handleNavigate('profile')} />
            </ProtectedRoute>
          }
        />
      </Routes>
      {user && <BottomNav />}
      {bookingModalData && (
        <BookingModal
          trainer={bookingModalData.trainer}
          cls={bookingModalData.cls}
          onClose={() => setBookingModalData(null)}
          onBook={() => setBookingModalData(null)}
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
