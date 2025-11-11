
import React, { useState, useMemo, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import { CATEGORIES } from './constants';
import { Trainer, Message, Class, UserRole, MealPlan, Booking, Review, Event, Category } from './types';
import HomePage from './pages/HomePage';
import MyBookingsPage from './pages/MyBookingsPage';
import ChatPage from './pages/ChatPage';
import { produce } from 'immer';
import BookingModal from './components/BookingModal';
import ProfilePage from './pages/ProfilePage';
import CreateProfilePage from './pages/CreateProfilePage';
import AddEditClassModal from './components/AddEditClassModal';
import WelcomePage from './pages/WelcomePage';
import StudentProfilePage from './pages/StudentProfilePage';
import MessageListPage from './pages/MessageListPage';
import ReportModal from './components/ReportModal';
import { analyzeChat, getAICoachResponse } from './utils/ai';
import { CheckCircle, Loader, AlertTriangle } from 'lucide-react';
import MealPlannerPage from './pages/MealPlannerPage';
import MyMealPlansPage from './pages/MyMealPlansPage';
import FavoritesPage from './pages/FavoritesPage';
import EditAboutMePage from './pages/EditAboutMePage';
import ReviewModal from './components/ReviewModal';
import AICoachPage from './pages/AICoachPage';
import VerificationPage from './pages/VerificationPage';
import EventsFlowPage from './pages/EventsFlowPage';
import CategoryPage from './pages/CategoryPage';
import ReviewsModal from './components/ReviewsModal';
import AdminPage from './pages/AdminPage'; // New Import
import AuthPage from './pages/AuthPage'; // Auth Page
import OnboardingPage from './pages/OnboardingPage'; // New Onboarding Page
import { db, auth } from './firebase';
import { collection, doc, updateDoc, arrayUnion, setDoc, addDoc, arrayRemove, getDoc, onSnapshot } from 'firebase/firestore';
import { 
    onAuthStateChanged, 
    User,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    updateProfile
} from 'firebase/auth';


type ActiveTab = 'Home' | 'Catalog' | 'My Classes' | 'Messages' | 'Profile' | 'Admin';
const TABS: ActiveTab[] = ['Home', 'Catalog', 'My Classes', 'Messages', 'Profile', 'Admin'];
const ANIMATION_DURATION = 350; // ms, should match CSS
const ADMIN_USER_ID = 'your_admin_uid_here'; // TODO: Replace with your actual Firebase Admin UID

interface ChatContext {
  personToChatWith: Trainer;
  context?: {
    classId: number;
    className: string;
    bookingDate?: string;
    studentId: string;
  };
}

const initialAICoachMessages: Message[] = [
    {
        id: 1,
        text: "Hi there! I'm your AI Fitness Coach. I can help with workout ideas, nutrition tips, and general fitness advice. What's on your mind today?",
        sender: 'trainer',
        timestamp: 'Just now'
    }
];

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('Home');
  const [previousTab, setPreviousTab] = useState<ActiveTab | null>(null);
  const [animationDirection, setAnimationDirection] = useState<'forward' | 'backward'>('forward');

  const [userRole, setUserRole] = useState<UserRole>('student');
  const [trainersData, setTrainersData] = useState<Trainer[]>([]);
  const [eventsData, setEventsData] = useState<Event[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<Trainer | null>(null);
  const [selectedChatContext, setSelectedChatContext] = useState<ChatContext | null>(null);
  const [bookingTarget, setBookingTarget] = useState<{ trainer: Trainer, cls: Class } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [profileView, setProfileView] = useState<'view' | 'edit'>('view');
  const [favoriteTrainerIds, setFavoriteTrainerIds] = useState<string[]>([]);

  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportingTrainer, setReportingTrainer] = useState<Trainer | null>(null);
  
  const [reviewTarget, setReviewTarget] = useState<{ trainer: Trainer, cls: Class, booking: Booking } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [reviewsModalTarget, setReviewsModalTarget] = useState<Trainer | null>(null);

  // Full screen page states
  const [mealPlannerState, setMealPlannerState] = useState<'closed' | 'open' | 'exiting'>('closed');
  const [aiCoachState, setAiCoachState] = useState<'closed' | 'open'>('closed');
  const [verificationState, setVerificationState] = useState<'closed' | 'open' | 'exiting'>('closed');
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null);
  const [isExitingOverlay, setIsExitingOverlay] = useState(false);
  const [isExitingChat, setIsExitingChat] = useState(false);
  const [selectedEventForFlow, setSelectedEventForFlow] = useState<Event | null>(null);
  const [selectedTopCategory, setSelectedTopCategory] = useState<Category | null>(null);
  const [isExitingCategoryPage, setIsExitingCategoryPage] = useState(false);

  
  const [aiCoachMessages, setAiCoachMessages] = useState<Message[]>(initialAICoachMessages);
  const [isAICoachLoading, setIsAICoachLoading] = useState(false);
  const [savedMealPlans, setSavedMealPlans] = useState<MealPlan[]>([]);

  const currentUserId = authUser?.uid;
  const isAdmin = currentUserId === ADMIN_USER_ID;
  const currentUser = currentUserProfile;

  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
        setAuthUser(user);
        
        let unsubscribers: (() => void)[] = [];

        if (user) {
            setFetchError(null);
            setIsLoading(true);

            // Listener for all trainers
            const trainersUnsubscribe = onSnapshot(collection(db, "trainers"), (snapshot) => {
                const trainersList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Trainer[];
                setTrainersData(trainersList);
            }, (error) => {
                console.error("Error fetching trainers collection:", error);
                setFetchError("Error connecting to the server. Please check your connection.");
            });
            unsubscribers.push(trainersUnsubscribe);

            // Listener for all events
            const eventsUnsubscribe = onSnapshot(collection(db, "events"), (snapshot) => {
                const eventsList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Event[];
                setEventsData(eventsList);
            }, (error) => {
                console.error("Error fetching events collection:", error);
                // Optionally set an error state here as well
            });
            unsubscribers.push(eventsUnsubscribe);
            
            // Listener for the current user's profile
            const userUnsubscribe = onSnapshot(doc(db, "trainers", user.uid), (docSnap) => {
                if (docSnap.exists()) {
                    const currentUserData = { ...docSnap.data(), id: docSnap.id } as Trainer;
                    setCurrentUserProfile(currentUserData);
                    setFavoriteTrainerIds(currentUserData.favoriteTrainerIds || []);
                    setUserRole(currentUserData.role || 'student');

                    if (!currentUserData.onboardingCompleted) {
                        setIsOnboarding(true);
                    } else {
                        setIsOnboarding(false);
                    }
                } else {
                    console.warn("Current user document not yet created. Waiting for sign-up process to complete.");
                    setCurrentUserProfile(null);
                    setIsOnboarding(false);
                }
                setIsLoading(false); // Consider loading finished once user profile is checked
            }, (error) => {
                console.error("Error fetching user profile:", error);
                setFetchError("Could not load your profile. Please check your connection.");
                setIsLoading(false);
            });
            unsubscribers.push(userUnsubscribe);

        } else {
            // No user, reset data and finish loading
            setTrainersData([]);
            setEventsData([]);
            setFavoriteTrainerIds([]);
            setIsOnboarding(false);
            setCurrentUserProfile(null);
            setIsLoading(false);
        }

        // Cleanup function for when auth state changes (e.g., user logs out)
        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    });

    // Main cleanup for when the App component unmounts
    return () => authUnsubscribe();
  }, []);

  
    const upcomingBookingsCount = useMemo(() => {
    if (!currentUserId) return 0;
    if (userRole === 'student') {
        return trainersData.reduce((count, trainer) => {
            return count + (trainer.classes.reduce((classCount, cls) => {
                return classCount + (cls.bookings?.filter(b => b.userId === currentUserId && b.status === 'booked').length || 0);
            }, 0));
        }, 0);
    }
    // Trainer view
    if (!currentUser) return 0;
    return currentUser.classes.reduce((count, cls) => {
        return count + (cls.bookings?.filter(b => b.status === 'booked').length || 0);
    }, 0);
  }, [trainersData, currentUserId, userRole, currentUser]);

  const messagesCount = useMemo(() => {
    if (userRole === 'student') {
        return trainersData.reduce((count, trainer) => {
            const hasUnread = trainer.chatHistory.some(msg => msg.sender === 'trainer' && msg.status !== 'read');
            return hasUnread ? count + 1 : count;
        }, 0);
    }
    // TODO: Implement for trainer view
    return 0;
  }, [trainersData, userRole]);

  const handleUpdateProfile = async (updatedTrainer: Trainer) => {
    const trainerRef = doc(db, "trainers", updatedTrainer.id);
    // The onSnapshot listener will handle the local state update automatically.
    await updateDoc(trainerRef, updatedTrainer as { [x: string]: any });
    
    if (profileView === 'edit') {
        setProfileView('view');
        setToastMessage('Profile updated successfully!');
        setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleInitiateBooking = (target: { trainer: Trainer, cls: Class }) => {
    setBookingTarget(target);
  };
  
  const handleCloseBookingModal = () => {
    setBookingTarget(null);
  };

  const handleBookClass = async (trainerId: string, classId: number, startDate: Date, period: 'once' | '4weeks') => {
    if (!currentUserId) return;
    const trainerRef = doc(db, "trainers", trainerId);
    
    const trainerToUpdate = trainersData.find(t => t.id === trainerId);
    if (!trainerToUpdate) return;

    // Create a new version of the classes array with the new bookings
    const updatedClasses = produce(trainerToUpdate.classes, draft => {
       const classToBook = draft.find(c => c.id === classId);
      if (!classToBook || !classToBook.schedule) return;

      if (!classToBook.bookings) {
        classToBook.bookings = [];
      }

      const dayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const scheduledDays = classToBook.schedule.days.map(day => dayMap.indexOf(day));
      const weeks = period === 'once' ? 1 : 4;

      for (let i = 0; i < 7 * weeks; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        if (scheduledDays.includes(date.getDay())) {
            const formattedDate = date.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });
            const newBooking: Booking = {
                date: formattedDate,
                time: classToBook.schedule.time,
                userId: currentUserId,
                status: 'booked',
            };
            if (!classToBook.bookings.some(b => b.date === newBooking.date && b.userId === newBooking.userId)) {
                classToBook.bookings.push(newBooking);
            }
        }
      }
    });

    // Persist to Firestore
    await updateDoc(trainerRef, { classes: updatedClasses });

    setBookingTarget(null);
    setToastMessage('Class booked successfully!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCancelBooking = async (trainerId: string, classId: number, bookingDate: string, bookingTime: string) => {
    if (!currentUserId) return;
    const trainerToUpdate = trainersData.find(t => t.id === trainerId);
    if (!trainerToUpdate) return;
    
    const updatedClasses = produce(trainerToUpdate.classes, draft => {
        const classToCancel = draft.find(c => c.id === classId);
        if (classToCancel && classToCancel.bookings) {
            const bookingIndex = classToCancel.bookings.findIndex(b => 
                b.userId === currentUserId && b.date === bookingDate && b.time === bookingTime
            );
            if (bookingIndex !== -1) {
               classToCancel.bookings[bookingIndex].status = 'cancelled';
            }
        }
    });
    
    const trainerRef = doc(db, "trainers", trainerId);
    await updateDoc(trainerRef, { classes: updatedClasses });
  };

  const handleSendMessage = async (trainerId: string, messageText: string) => {
      const trainerRef = doc(db, "trainers", trainerId);
      const newMessage: Message = {
          id: Date.now(),
          text: messageText,
          sender: 'user',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'sent',
      };
      
      // The real-time listener will update the local state.
      await updateDoc(trainerRef, {
          chatHistory: arrayUnion(newMessage)
      });
      
      const trainer = trainersData.find(t => t.id === trainerId);
      if (trainer) {
          const updatedChatHistory = [...trainer.chatHistory, newMessage];
          const analysis = await analyzeChat(updatedChatHistory);
          if (!analysis.is_safe) {
              await updateDoc(trainerRef, { aiWarning: analysis.reason });
          } else {
              // Only update if there is a warning to clear
              if (trainer.aiWarning) {
                  await updateDoc(trainerRef, { aiWarning: "" });
              }
          }
      }
  };


  const markMessagesAsRead = async (trainerId: string) => {
    const trainer = trainersData.find(t => t.id === trainerId);
    if (!trainer) return;

    const hasUnread = trainer.chatHistory.some(msg => msg.sender === 'trainer' && msg.status !== 'read');
    if (!hasUnread) return;

    const updatedChatHistory = trainer.chatHistory.map(msg => 
        (msg.sender === 'trainer' && msg.status !== 'read') ? { ...msg, status: 'read' } : msg
    );
    
    const trainerRef = doc(db, "trainers", trainerId);
    await updateDoc(trainerRef, { chatHistory: updatedChatHistory });
  };
  
  const handleOpenChat = (personToChatWith: Trainer, context?: ChatContext['context']) => {
    markMessagesAsRead(personToChatWith.id);
    setSelectedChatContext({ personToChatWith, context });
  };
  
  const handleCloseChat = () => {
    setIsExitingChat(true);
    setTimeout(() => {
        setSelectedChatContext(null);
        setIsExitingChat(false);
    }, ANIMATION_DURATION);
  };

  const handleSelectChat = (personToChatWith: Trainer, context?: ChatContext['context']) => {
    markMessagesAsRead(personToChatWith.id);
    setSelectedChatContext({ personToChatWith, context });
  };

  const handleOpenReportModal = (trainer: Trainer) => {
    setReportingTrainer(trainer);
    setIsReportModalOpen(true);
  };

  const handleCloseReportModal = () => {
    setIsReportModalOpen(false);
    setTimeout(() => setReportingTrainer(null), 300);
  };

  const handleSubmitReport = (reason: string, details: string) => {
    console.log(`Report submitted for trainer: ${reportingTrainer?.name}`);
  };

  const handleOpenClassModal = (cls: Class | null) => {
    setEditingClass(cls);
    setIsClassModalOpen(true);
  };

  const handleCloseClassModal = () => {
    setIsClassModalOpen(false);
    setEditingClass(null);
  };

  const handleAddOrUpdateClass = async (classData: Class) => {
    if (!currentUser) return;
    
    const updatedClasses = produce(currentUser.classes, draft => {
        const classIndex = draft.findIndex(c => c.id === classData.id);
        if (classIndex !== -1) {
            draft[classIndex] = { ...draft[classIndex], ...classData };
        } else {
            const newClass: Class = {
              ...classData,
              id: Date.now(),
              bookings: [],
            };
            draft.push(newClass);
        }
    });

    const trainerRef = doc(db, "trainers", currentUser.id);
    await updateDoc(trainerRef, { classes: updatedClasses });
    handleCloseClassModal();
  };
  
  const handleDeleteClass = async (classId: number) => {
      if (!currentUser) return;
      const updatedClasses = currentUser.classes.filter(c => c.id !== classId);
      const trainerRef = doc(db, "trainers", currentUser.id);
      await updateDoc(trainerRef, { classes: updatedClasses });
  };
  
  const handleOpenMealPlanner = () => setMealPlannerState('open');
  const handleCloseMealPlanner = () => {
    setMealPlannerState('exiting');
    setTimeout(() => setMealPlannerState('closed'), 400);
  };

  const handleOpenAICoach = () => setAiCoachState('open');
  const handleCloseAICoach = () => {
      setAiCoachState('closed');
  };

  const handleOpenVerification = () => setVerificationState('open');
  const handleCloseVerification = () => {
      setVerificationState('exiting');
      setTimeout(() => setVerificationState('closed'), 400);
  };
  
  const handleVerificationComplete = async () => {
    if (!currentUserId) return;
    const trainerRef = doc(db, "trainers", currentUserId);
    await updateDoc(trainerRef, { verificationStatus: 'pending' });
    handleCloseVerification();
    setToastMessage('Verification submitted for review!');
    setTimeout(() => setToastMessage(null), 3000);
  };


  const handleSaveMealPlan = (planData: Omit<MealPlan, 'id' | 'createdAt'>) => {
    const newPlan: MealPlan = {
      ...planData,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    };
    setSavedMealPlans(prev => [...prev, newPlan]);
    handleCloseMealPlanner();
    // Student will be navigated to their meal plans page from within the profile tab.
    setActiveTab('Profile');
    setToastMessage('Meal plan saved successfully!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeleteMealPlan = (planId: number) => {
    setSavedMealPlans(prev => prev.filter(p => p.id !== planId));
  };

  const handleToggleFavorite = async (trainerId: string) => {
    if (!currentUserId) return;
    const userRef = doc(db, "trainers", currentUserId);
    const isCurrentlyFavorite = favoriteTrainerIds.includes(trainerId);
    
    // Firestore listener will handle the UI update
    await updateDoc(userRef, {
        favoriteTrainerIds: isCurrentlyFavorite ? arrayRemove(trainerId) : arrayUnion(trainerId)
    });
  };
  
  const handleTabNavigate = (tab: ActiveTab) => {
    if (tab === activeTab) return;
    
    const oldIndex = TABS.indexOf(activeTab);
    const newIndex = TABS.indexOf(tab);

    setAnimationDirection(newIndex > oldIndex ? 'forward' : 'backward');
    setPreviousTab(activeTab);
    setActiveTab(tab);

    setTimeout(() => {
        setPreviousTab(null);
    }, ANIMATION_DURATION);
  };

  const handleRoleChange = async (role: UserRole) => {
    if (!currentUserId) return;
    const userRef = doc(db, "trainers", currentUserId);
    await updateDoc(userRef, { role: role });
    setToastMessage(`Switched to ${role} view`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUpdateBookingStatus = async (trainerId: string, classId: number, bookingDate: string, studentId: string, status: 'attended' | 'cancelled') => {
    const trainerRef = doc(db, "trainers", trainerId);
    const trainerToUpdate = trainersData.find(t => t.id === trainerId);
    if (!trainerToUpdate) return;

    const updatedClasses = produce(trainerToUpdate.classes, draft => {
        const cls = draft.find(c => c.id === classId);
        const booking = cls?.bookings?.find(b => b.userId === studentId && b.date === bookingDate);
        if (booking) {
            booking.status = status;
        }
    });
    await updateDoc(trainerRef, { classes: updatedClasses });
  };

  const handleOpenReviewModal = (trainer: Trainer, cls: Class, booking: Booking) => {
    setReviewTarget({ trainer, cls, booking });
  };

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!reviewTarget || !currentUser) return;
    const { trainer, cls, booking } = reviewTarget;
    const trainerRef = doc(db, "trainers", trainer.id);

    const newReview: Review = {
        reviewerName: currentUser.name,
        rating,
        comment,
    };
    
    const trainerToUpdate = trainersData.find(t => t.id === trainer.id);
    if (!trainerToUpdate) return;
    
    const newReviewsData = [...trainerToUpdate.reviewsData, newReview];
    const oldTotalRating = trainerToUpdate.rating * trainerToUpdate.reviews;
    const newReviewsCount = trainerToUpdate.reviews + 1;
    const newRating = (oldTotalRating + rating) / newReviewsCount;

    const updatedClasses = produce(trainerToUpdate.classes, draft => {
       const classToUpdate = draft.find(c => c.id === cls.id);
        const bookingToUpdate = classToUpdate?.bookings?.find(b => b.date === booking.date && b.userId === booking.userId);
        if (bookingToUpdate) {
            bookingToUpdate.hasLeftReview = true;
        }
    });

    await updateDoc(trainerRef, {
        reviewsData: newReviewsData,
        rating: newRating,
        reviews: newReviewsCount,
        classes: updatedClasses
    } as { [x: string]: any });


    setReviewTarget(null);
    setToastMessage("Thank you for your review!");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSendToAICoach = async (messageText: string) => {
    const newUserMessage: Message = {
        id: Date.now(),
        text: messageText,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setAiCoachMessages(prev => [...prev, newUserMessage]);
    setIsAICoachLoading(true);

    try {
        const responseText = await getAICoachResponse(messageText);
        const newAIMessage: Message = {
            id: Date.now() + 1,
            text: responseText,
            sender: 'trainer',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setAiCoachMessages(prev => [...prev, newAIMessage]);
    } catch (error) {
        console.error("Failed to get AI coach response:", error);
        const errorMessage: Message = {
            id: Date.now() + 1,
            text: "Sorry, I'm having trouble connecting right now. Please try again later.",
            sender: 'trainer',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setAiCoachMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsAICoachLoading(false);
    }
  };

  const handleMenuNavigation = (page: string) => {
      if (page === 'events') {
          setSelectedEventForFlow(null);
          setActiveOverlay('events');
      } else {
          alert(`Navigate to ${page}`);
      }
  };
  
  const handleSelectEvent = (event: Event) => {
      setSelectedEventForFlow(event);
      setActiveOverlay('events');
  };

  const handleCloseOverlay = () => {
      setIsExitingOverlay(true);
      setTimeout(() => {
          setActiveOverlay(null);
          setSelectedEventForFlow(null);
          setIsExitingOverlay(false);
      }, ANIMATION_DURATION);
  };

  const handleToggleInterest = async (eventId: string) => {
    if (!currentUserId) return;
    const eventRef = doc(db, "events", eventId);
    const isInterested = eventsData.find(e => e.id === eventId)?.interestedUserIds.includes(currentUserId);
    
    await updateDoc(eventRef, {
        interestedUserIds: isInterested ? arrayRemove(currentUserId) : arrayUnion(currentUserId)
    });
  };

  const handleCreateEvent = async (eventData: Omit<Event, 'id' | 'organizerId' | 'organizerName' | 'interestedUserIds'>) => {
    if (!currentUser) return;
    const newEventData = {
        ...eventData,
        organizerId: currentUser.id,
        organizerName: currentUser.name,
        interestedUserIds: [],
    };
    await addDoc(collection(db, "events"), newEventData);
    setToastMessage("Event created successfully!");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSelectTopCategory = (category: Category) => {
    setSelectedTopCategory(category);
  };

  const handleCloseCategoryPage = () => {
    setIsExitingCategoryPage(true);
    setTimeout(() => {
        setSelectedTopCategory(null);
        setIsExitingCategoryPage(false);
    }, ANIMATION_DURATION);
  };

  const handleOpenReviewsModal = (trainer: Trainer) => {
    setReviewsModalTarget(trainer);
  };

  const handleCloseReviewsModal = () => {
      setReviewsModalTarget(null);
  };

  const handleCreateTrainer = async (newTrainerData: Omit<Trainer, 'id'>) => {
    await addDoc(collection(db, 'trainers'), newTrainerData);
    setToastMessage('Trainer created successfully!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreateCourseForTrainer = async (trainerId: string, newCourseData: Omit<Class, 'id'>) => {
    const trainerRef = doc(db, 'trainers', trainerId);
    const newCourse: Class = {
        ...newCourseData,
        id: Date.now(), // Simple ID generation
    };
    
    await updateDoc(trainerRef, {
        classes: arrayUnion(newCourse)
    });
    
    setToastMessage('Course created successfully!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getTrainersForCategory = (category: Category) => {
    const categoryMappings: { [key: string]: string[] } = {
        gym: ['strength training', 'hiit', 'personal training', 'gym coach'],
        yoga: ['yoga', 'pilates'],
        tennis: ['tennis'],
        boxing: ['boxing', 'kickboxing', 'mma'],
        swimming: ['swimming'],
        dance: ['dance fitness'],
        running: ['running'],
    };

    const relevantSpecialties = categoryMappings[category.id] || [category.name.toLowerCase()];

    return trainersData.filter(trainer =>
        trainer.specialty.some(spec =>
            relevantSpecialties.includes(spec.toLowerCase())
        )
    );
  };
  
   // --- AUTH FUNCTIONS ---
    const createFirestoreUser = async (user: User, name?: string) => {
        const userDocRef = doc(db, "trainers", user.uid);
        const docSnap = await getDoc(userDocRef);

        if (!docSnap.exists()) {
            const newUserProfile: Trainer = {
                id: user.uid,
                name: name || user.displayName || 'New User',
                specialty: [],
                rating: 0,
                reviews: 0,
                location: 'Ho Chi Minh City', // Default
                price: 0,
                imageUrl: user.photoURL || `https://i.pravatar.cc/300?u=${user.uid}`,
                verificationStatus: 'unverified',
                isPremium: false,
                bio: '',
                reviewsData: [],
                classes: [],
                chatHistory: [],
                favoriteTrainerIds: [],
                onboardingCompleted: false,
                role: 'student',
            };
            await setDoc(userDocRef, newUserProfile);
        }
    };

    const handleSignUp = async (email: string, password: string, name: string): Promise<void> => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        await createFirestoreUser(userCredential.user, name);
    };

    const handleLogin = async (email: string, password: string): Promise<void> => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const handleGoogleSignIn = async (): Promise<void> => {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        await createFirestoreUser(result.user);
    };
    
    const handleLogout = async (): Promise<void> => {
        await signOut(auth);
    };

    const handleOnboardingComplete = async (updatedUser: Trainer) => {
        const finalUserData = { ...updatedUser, onboardingCompleted: true };
        await handleUpdateProfile(finalUserData);
        // State for onboarding will be updated by the real-time listener
        if (finalUserData.role === 'student') {
            handleTabNavigate('Catalog');
        } else {
            handleTabNavigate('Profile');
        }
    };

  const isFullScreenPage = !!selectedChatContext || mealPlannerState !== 'closed' || aiCoachState !== 'closed' || verificationState !== 'closed' || !!activeOverlay || !!selectedTopCategory || !!reviewsModalTarget;

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-screen bg-white">
            <div className="flex flex-col items-center">
                 <Loader className="w-8 h-8 text-orange-500 animate-spin" />
                 <p className="mt-4 text-lg font-semibold text-slate-700">Loading RhinoFit...</p>
            </div>
        </div>
    );
  }

  if (fetchError) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-4 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400" />
            <h2 className="mt-4 text-xl font-bold text-slate-800">Connection Error</h2>
            <p className="mt-2 text-slate-600 max-w-sm">{fetchError}</p>
            <button 
                onClick={() => window.location.reload()} // Simplest retry is a reload
                className="mt-6 px-6 py-2.5 bg-[#FF6B35] text-white font-bold rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center shadow-md hover:shadow-lg"
            >
                Retry Connection
            </button>
        </div>
    );
  }
  
  if (!authUser) {
    return <AuthPage onLogin={handleLogin} onSignUp={handleSignUp} onGoogleSignIn={handleGoogleSignIn} />
  }

  if (isOnboarding && currentUser) {
      return <OnboardingPage currentUser={currentUser} onComplete={handleOnboardingComplete} />
  }


  const getPageComponent = (tab: ActiveTab) => {
    switch (tab) {
      case 'Home':
        return <WelcomePage 
                    trainers={trainersData} 
                    onOpenMealPlanner={handleOpenMealPlanner} 
                    onOpenAICoach={handleOpenAICoach} 
                    events={eventsData}
                    onNavigate={handleMenuNavigation}
                    onSelectEvent={handleSelectEvent}
                    onSelectTopCategory={handleSelectTopCategory}
                />;
      case 'Catalog':
        return <HomePage 
                    trainers={trainersData} 
                    onInitiateBooking={handleInitiateBooking} 
                    onOpenChat={handleOpenChat} 
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                    userRole={userRole}
                    currentUserId={currentUserId!}
                    favoriteTrainerIds={favoriteTrainerIds}
                    onToggleFavorite={handleToggleFavorite}
                    onNavigate={handleMenuNavigation}
                    onOpenReviewsModal={handleOpenReviewsModal}
                />;
      case 'My Classes':
        return <MyBookingsPage 
                  trainers={trainersData} 
                  onOpenChat={handleOpenChat} 
                  onCancelBooking={handleCancelBooking} 
                  currentUserId={currentUserId!}
                  currentUser={currentUser!}
                  userRole={userRole}
                  onOpenReviewModal={handleOpenReviewModal}
                />;
      case 'Messages':
        return <MessageListPage
                  trainers={trainersData}
                  onSelectChat={handleSelectChat}
                  currentUserId={currentUserId!}
                />;
      case 'Profile':
        if (!currentUser) return <div className="p-4">User not found.</div>;
        if (userRole === 'trainer') {
            if (profileView === 'edit') {
                return <CreateProfilePage 
                            trainer={currentUser} 
                            onSave={handleUpdateProfile}
                            onCancel={() => setProfileView('view')}
                        />
            }
            return <ProfilePage 
                        trainer={currentUser}
                        onEdit={() => setProfileView('edit')}
                        onManageClass={handleOpenClassModal}
                        onDeleteClass={handleDeleteClass}
                        userRole={userRole}
                        onRoleChange={handleRoleChange}
                        onStartVerification={handleOpenVerification}
                        onLogout={handleLogout}
                    />;
        } else {
             return <StudentProfilePage
                        user={currentUser}
                        userRole={userRole}
                        onRoleChange={handleRoleChange}
                        onNavigateTab={handleTabNavigate}
                        // Pass full-page handlers for sub-page navigation
                        trainers={trainersData}
                        favoriteTrainerIds={favoriteTrainerIds}
                        onToggleFavorite={handleToggleFavorite}
                        onInitiateBooking={handleInitiateBooking}
                        onOpenChat={handleOpenChat}
                        savedMealPlans={savedMealPlans}
                        onDeleteMealPlan={handleDeleteMealPlan}
                        onUpdateProfile={handleUpdateProfile}
                        onOpenReviewsModal={handleOpenReviewsModal}
                        onLogout={handleLogout}
                    />
        }
      case 'Admin':
        return <AdminPage
                    trainers={trainersData}
                    onCreateTrainer={handleCreateTrainer}
                    onCreateCourse={handleCreateCourseForTrainer}
                />
      default:
        return <WelcomePage 
                  trainers={trainersData} 
                  onOpenMealPlanner={handleOpenMealPlanner} 
                  onOpenAICoach={handleOpenAICoach} 
                  events={eventsData}
                  onNavigate={handleMenuNavigation}
                  onSelectEvent={handleSelectEvent}
                  onSelectTopCategory={handleSelectTopCategory}
                />;
    }
  };


  return (
    <div className="max-w-md mx-auto h-screen bg-white flex flex-col relative pt-[env(safe-area-inset-top)]">
       {toastMessage && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-800 text-white font-semibold py-3 px-5 rounded-full shadow-lg animate-fade-in-down">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span>{toastMessage}</span>
          </div>
        )}
      <main className="flex-1 relative overflow-hidden">
        {previousTab && (
          <div
            key={previousTab}
            className={`absolute inset-0 w-full h-full ${animationDirection === 'forward' ? 'animate-slide-out-to-left' : 'animate-slide-out-to-right'}`}
          >
            {getPageComponent(previousTab)}
          </div>
        )}
        <div
            key={activeTab}
            className={`w-full h-full ${previousTab ? `absolute inset-0 ${animationDirection === 'forward' ? 'animate-slide-in-from-right' : 'animate-slide-in-from-left'}` : 'relative'}`}
        >
            {getPageComponent(activeTab)}
        </div>
      </main>

      {/* Full Screen Pages */}
      {selectedTopCategory && (
            <div className={`absolute inset-0 z-30 bg-white ${isExitingCategoryPage ? 'animate-slide-out-to-right' : 'animate-slide-in-from-right'}`}>
                <CategoryPage
                    category={selectedTopCategory}
                    trainers={getTrainersForCategory(selectedTopCategory)}
                    onBack={handleCloseCategoryPage}
                    onInitiateBooking={handleInitiateBooking}
                    onOpenChat={handleOpenChat}
                    userRole={userRole}
                    currentUserId={currentUserId!}
                    favoriteTrainerIds={favoriteTrainerIds}
                    onToggleFavorite={handleToggleFavorite}
                    onOpenReviewsModal={handleOpenReviewsModal}
                />
            </div>
        )}
       {activeOverlay === 'events' && (
          <div className={`absolute inset-0 z-30 bg-white ${isExitingOverlay ? 'animate-slide-out-to-right' : 'animate-slide-in-from-right'}`}>
              <EventsFlowPage
                events={eventsData}
                currentUser={currentUser!}
                onBack={handleCloseOverlay}
                onToggleInterest={handleToggleInterest}
                onCreateEvent={handleCreateEvent}
                initialEvent={selectedEventForFlow}
              />
          </div>
      )}
       {mealPlannerState !== 'closed' && (
          <div className={`absolute inset-0 z-20 bg-white ${mealPlannerState === 'exiting' ? 'animate-slide-down-full' : 'animate-slide-up-full'}`}>
            <MealPlannerPage user={currentUser!} onClose={handleCloseMealPlanner} onSavePlan={handleSaveMealPlan} />
          </div>
        )}
        {aiCoachState === 'open' && (
          <div className="absolute inset-0 z-20 bg-white">
            <AICoachPage 
                messages={aiCoachMessages} 
                onSendMessage={handleSendToAICoach} 
                isLoading={isAICoachLoading}
                onClose={handleCloseAICoach}
            />
          </div>
        )}
        {verificationState !== 'closed' && (
          <div className={`absolute inset-0 z-20 bg-white ${verificationState === 'exiting' ? 'animate-slide-down-full' : 'animate-slide-up-full'}`}>
              <VerificationPage
                  currentUser={currentUser!}
                  onBack={handleCloseVerification}
                  onComplete={handleVerificationComplete}
              />
          </div>
        )}
       {selectedChatContext && currentUser && (
          <div className={`absolute inset-0 z-20 bg-white ${isExitingChat ? 'animate-slide-out-to-right' : 'animate-slide-in-from-right'}`}>
            <ChatPage 
              personToChatWith={selectedChatContext.personToChatWith}
              context={selectedChatContext.context}
              onBack={handleCloseChat}
              onSendMessage={handleSendMessage}
              onOpenReportModal={handleOpenReportModal}
              userRole={userRole}
              currentUser={currentUser}
              onUpdateBookingStatus={handleUpdateBookingStatus}
              bookingStatus={selectedChatContext.context ? trainersData.find(t => t.id === (userRole === 'student' ? selectedChatContext.personToChatWith.id : currentUserId))?.classes.find(c => c.id === selectedChatContext.context?.classId)?.bookings?.find(b => b.userId === selectedChatContext.context?.studentId && b.date === selectedChatContext.context?.bookingDate)?.status : undefined}
            />
          </div>
        )}
      {reviewsModalTarget && (
        <ReviewsModal 
            trainer={reviewsModalTarget}
            onClose={handleCloseReviewsModal}
        />
      )}

      {!isFullScreenPage && (
          <BottomNav 
              activeTab={activeTab} 
              onNavigate={handleTabNavigate} 
              favoriteCount={favoriteTrainerIds.length}
              bookingsCount={upcomingBookingsCount}
              messagesCount={messagesCount}
              isAdmin={isAdmin}
          />
      )}
      {bookingTarget && (
        <BookingModal 
          bookingTarget={bookingTarget}
          onConfirmBooking={handleBookClass}
          onClose={handleCloseBookingModal}
        />
      )}
      {isClassModalOpen && (
        <AddEditClassModal
            isOpen={isClassModalOpen}
            onClose={handleCloseClassModal}
            onSave={handleAddOrUpdateClass}
            classData={editingClass}
        />
      )}
      {isReportModalOpen && reportingTrainer && (
        <ReportModal 
          isOpen={isReportModalOpen}
          onClose={handleCloseReportModal}
          onSubmit={handleSubmitReport}
          trainerName={reportingTrainer.name}
        />
      )}
      {reviewTarget && (
          <ReviewModal
            isOpen={!!reviewTarget}
            onClose={() => setReviewTarget(null)}
            onSubmit={handleSubmitReview}
            trainerName={reviewTarget.trainer.name}
            className={reviewTarget.cls.name}
          />
      )}
    </div>
  );
};

export default App;
