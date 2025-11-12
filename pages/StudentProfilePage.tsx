import React, { useState } from 'react';
import { Trainer, UserRole } from '../types';
import { ArrowLeft, Calendar, MessageCircle, User as UserIcon, UtensilsCrossed, Heart, LogOut, Pencil, ChevronRight, Crown, ShieldCheck, MapPin, Sparkles } from 'lucide-react';
import AboutMePage from './AboutMePage';
import EditAboutMePage from './EditAboutMePage';
import FavoritesPage from './FavoritesPage';
import MyMealPlansPage from './MyMealPlansPage';
import { isStudentProfileComplete } from '../utils/profile';
import CompleteProfilePrompt from '../components/CompleteProfilePrompt';

const ANIMATION_DURATION = 300;

interface StudentProfilePageProps {
    currentUser: Trainer | null;
    userRole: UserRole;
    onNavigateToBookings: () => void;
    onNavigateToChats: () => void;
    onEditProfile: () => void;
    onSaveProfile: (updatedUser: Trainer) => void;
    onLogout: () => void;
}

type SubPage = 'about' | 'edit-about' | 'favorites' | 'meal-plans';

const StudentProfilePage: React.FC<StudentProfilePageProps> = (props) => {
    const { currentUser, userRole, onNavigateToBookings, onNavigateToChats, onEditProfile, onSaveProfile, onLogout } = props;
    const [activeSubPage, setActiveSubPage] = useState<SubPage | null>(null);
    const [isExiting, setIsExiting] = useState(false);
    const profileIsIncomplete = currentUser ? !isStudentProfileComplete(currentUser) : false;

    const handleNavigateTo = (page: SubPage) => {
        setActiveSubPage(page);
        setIsExiting(false);
    };

    const handleBack = () => {
        setIsExiting(true);
        setTimeout(() => {
            setActiveSubPage(null);
        }, ANIMATION_DURATION);
    };
    
    const handleBackToParent = (page: SubPage) => {
        setIsExiting(true);
        setTimeout(() => {
            setActiveSubPage(page);
        }, ANIMATION_DURATION);
    }

    const renderSubPage = () => {
        if (!activeSubPage || !currentUser) return null;

        switch (activeSubPage) {
            case 'about':
                return <AboutMePage user={currentUser} onBack={handleBack} onEdit={() => handleNavigateTo('edit-about')} />;
            case 'edit-about':
                return <EditAboutMePage 
                    user={currentUser} 
                    onCancel={() => handleBackToParent('about')} 
                    onSave={(updatedUser) => {
                        onSaveProfile(updatedUser);
                        handleBackToParent('about');
                    }} 
                />;
            case 'favorites':
                return <FavoritesPage 
                    trainers={[]} 
                    favoriteTrainerIds={[]} 
                    onToggleFavorite={() => {}} 
                    onBack={handleBack}
                    onInitiateBooking={() => {}}
                    onOpenChat={() => {}}
                    userRole="student"
                    currentUserId=""
                    onOpenReviewsModal={() => {}}
                />;
            case 'meal-plans':
                return <MyMealPlansPage 
                    plans={[]} 
                    onBack={handleBack}
                    onDelete={() => {}}
                />;
            default:
                return null;
        }
    };
    
    if (!currentUser) {
        return (
            <div className="bg-white h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white h-full flex flex-col overflow-hidden">
            {/* Modern Compact Header */}
            <div className="bg-white border-b border-gray-100 shadow-sm">
                <div className="px-4 py-3">
                    {/* Top Row: Title and Edit Button */}
                    <div className="flex items-center justify-between mb-3">
                        <h1 className="text-base font-bold text-gray-900">Profile</h1>
                        <button 
                            onClick={onEditProfile}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="Edit profile"
                        >
                            <Pencil className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>

                    {/* Profile Info Row: Avatar, Name, Badges */}
                    <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <img 
                                src={currentUser.imageUrl || 'https://via.placeholder.com/56'} 
                                alt={currentUser.name || 'User'} 
                                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                            />
                            {currentUser.verificationStatus === 'verified' && (
                                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5 border-2 border-white">
                                    <ShieldCheck className="w-3 h-3 text-white" />
                                </div>
                            )}
                        </div>

                        {/* Name and Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-base font-bold text-gray-900 truncate">
                                    {currentUser.name || 'User'}
                                </h2>
                                {currentUser.isPremium && (
                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full shadow-sm">
                                        <Crown className="w-3 h-3 text-white" />
                                        <span className="text-xs font-bold text-white">Premium</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                {!currentUser.isPremium && (
                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full">
                                        <Sparkles className="w-3 h-3 text-gray-600" />
                                        <span className="text-xs font-medium text-gray-700">Basic</span>
                                    </div>
                                )}
                                {currentUser.location && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <MapPin className="w-3 h-3" />
                                        <span className="truncate">{currentUser.location}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="px-4 py-3 bg-gray-50">
                    {/* Complete Profile Prompt */}
                    {profileIsIncomplete && (
                        <div className="mb-3">
                            <CompleteProfilePrompt role="student" onComplete={() => handleNavigateTo('edit-about')} />
                        </div>
                    )}
                    
                    {/* Premium CTA */}
                    {!currentUser.isPremium && (
                        <div className="bg-gradient-to-r from-amber-400 to-yellow-500 p-4 rounded-lg mb-3 shadow-sm">
                            <div className="flex items-start gap-3">
                                <Crown className="w-6 h-6 text-white flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-white mb-1">Upgrade to Premium</h3>
                                    <p className="text-xs text-white/90 mb-3">Access exclusive meal plans, AI fitness coach, priority bookings, and personalized workout programs</p>
                                    <button className="w-full bg-white text-amber-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-amber-50 transition-colors">
                                        Get Premium RhinoFit
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Menu Card */}
                    <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 mb-2">Menu</h3>
                        <div className="space-y-1">
                            <button 
                                onClick={() => handleNavigateTo('about')} 
                                className="w-full flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                <div className="flex items-center gap-2.5">
                                    <UserIcon className="w-4 h-4 text-gray-600"/>
                                    <span className="text-xs font-semibold text-gray-900">About Me</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </button>
                            
                            <button 
                                onClick={() => handleNavigateTo('favorites')} 
                                className="w-full flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                <div className="flex items-center gap-2.5">
                                    <Heart className="w-4 h-4 text-gray-600"/>
                                    <span className="text-xs font-semibold text-gray-900">My Favorites</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </button>
                            
                            <button 
                                onClick={onNavigateToBookings} 
                                className="w-full flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                <div className="flex items-center gap-2.5">
                                    <Calendar className="w-4 h-4 text-gray-600"/>
                                    <span className="text-xs font-semibold text-gray-900">My Bookings</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </button>
                            
                            <button 
                                onClick={onNavigateToChats} 
                                className="w-full flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                <div className="flex items-center gap-2.5">
                                    <MessageCircle className="w-4 h-4 text-gray-600"/>
                                    <span className="text-xs font-semibold text-gray-900">My Chats</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </button>
                            
                            <button 
                                onClick={() => handleNavigateTo('meal-plans')} 
                                className="w-full flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                <div className="flex items-center gap-2.5">
                                    <UtensilsCrossed className="w-4 h-4 text-gray-600"/>
                                    <span className="text-xs font-semibold text-gray-900">My Meal Plans</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* Logout Button Card */}
                    <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
                        <button 
                            onClick={onLogout}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Sub Page Overlay */}
            {activeSubPage && (
                <div className={`absolute inset-0 bg-white z-30 transition-transform duration-300 ${
                    isExiting 
                        ? 'translate-x-full opacity-0' 
                        : 'translate-x-0 opacity-100'
                }`}>
                    {renderSubPage()}
                </div>
            )}
        </div>
    );
};

export default StudentProfilePage;
