import React, { useState } from 'react';
import { Trainer, UserRole, Class, MealPlan } from '../types';
import RoleSwitcher from '../components/RoleSwitcher';
import { ChevronRight, Calendar, MessageCircle, User as UserIcon, UtensilsCrossed, Heart, LogOut } from 'lucide-react';
import AboutMePage from './AboutMePage';
import EditAboutMePage from './EditAboutMePage';
import FavoritesPage from './FavoritesPage';
import MyMealPlansPage from './MyMealPlansPage';
import { isStudentProfileComplete } from '../utils/profile'; // New Import
import CompleteProfilePrompt from '../components/CompleteProfilePrompt'; // New Import


const ANIMATION_DURATION = 350;

interface StudentProfilePageProps {
    currentUser: Trainer;
    userRole: UserRole;
    onRoleChange: (role: UserRole) => void;
    onNavigateToBookings: () => void;
    onNavigateToChats: () => void;
    onEditProfile: () => void;
    onSaveProfile: (updatedUser: Trainer) => void;
    onLogout: () => void;
}

type SubPage = 'about' | 'edit-about' | 'favorites' | 'meal-plans';

const StudentProfilePage: React.FC<StudentProfilePageProps> = (props) => {
    const { currentUser, userRole, onRoleChange, onNavigateToBookings, onNavigateToChats, onEditProfile, onSaveProfile, onLogout } = props;
    const [activeSubPage, setActiveSubPage] = useState<SubPage | null>(null);
    const [isExiting, setIsExiting] = useState(false);
    const profileIsIncomplete = !isStudentProfileComplete(currentUser);


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
        if (!activeSubPage) return null;

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
                return null; // Will be integrated separately
            case 'meal-plans':
                return null; // Will be integrated separately
            default:
                return null;
        }
    };
    
    return (
        <div className="bg-slate-50 h-full relative overflow-hidden">
             <div className={`transition-opacity duration-300 ${activeSubPage ? 'opacity-0' : 'opacity-100'}`}>
                <div className="bg-white pb-6 pt-6">
                     <h1 className="text-2xl font-bold text-slate-800 text-center">My Profile</h1>
                    <div className="flex flex-col items-center pt-2">
                        <img 
                            src={currentUser.imageUrl} 
                            alt={currentUser.name} 
                            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                        <h2 className="text-2xl font-bold text-slate-800 mt-3">{currentUser.name}</h2>
                        <p className="text-sm text-slate-500 mt-1">{currentUser.location}</p>
                    </div>
                </div>
                
                <div className="p-4 space-y-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
                    {/* Complete Profile Prompt */}
                    {profileIsIncomplete && (
                        <CompleteProfilePrompt role="student" onComplete={() => handleNavigateTo('edit-about')} />
                    )}

                    {/* Role Switcher */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80">
                         <h3 className="font-bold text-slate-800 mb-2">Account Type</h3>
                        <RoleSwitcher currentRole={userRole} onRoleChange={onRoleChange} />
                         <p className="text-xs text-slate-400 mt-2 text-center">Switch to trainer mode to manage your classes and profile.</p>
                    </div>
                    
                    {/* Menu */}
                    <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200/80">
                        <ul className="divide-y divide-slate-100">
                             <li className="p-2">
                                <button onClick={() => handleNavigateTo('about')} className="w-full flex items-center justify-between hover:bg-slate-50 p-2 rounded-lg">
                                    <div className="flex items-center">
                                        <UserIcon className="w-5 h-5 mr-3 text-slate-500"/>
                                        <span className="font-semibold text-slate-700">About Me</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-400" />
                                </button>
                            </li>
                             <li className="p-2">
                                <button onClick={() => handleNavigateTo('favorites')} className="w-full flex items-center justify-between hover:bg-slate-50 p-2 rounded-lg">
                                    <div className="flex items-center">
                                        <Heart className="w-5 h-5 mr-3 text-slate-500"/>
                                        <span className="font-semibold text-slate-700">My Favorites</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-400" />
                                </button>
                            </li>
                             <li className="p-2">
                                <button onClick={onNavigateToBookings} className="w-full flex items-center justify-between hover:bg-slate-50 p-2 rounded-lg">
                                    <div className="flex items-center">
                                        <Calendar className="w-5 h-5 mr-3 text-slate-500"/>
                                        <span className="font-semibold text-slate-700">My Bookings</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-400" />
                                </button>
                            </li>
                            <li className="p-2">
                                 <button onClick={onNavigateToChats} className="w-full flex items-center justify-between hover:bg-slate-50 p-2 rounded-lg">
                                    <div className="flex items-center">
                                        <MessageCircle className="w-5 h-5 mr-3 text-slate-500"/>
                                        <span className="font-semibold text-slate-700">My Chats</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-400" />
                                </button>
                            </li>
                             <li className="p-2">
                                 <button onClick={() => handleNavigateTo('meal-plans')} className="w-full flex items-center justify-between hover:bg-slate-50 p-2 rounded-lg">
                                    <div className="flex items-center">
                                        <UtensilsCrossed className="w-5 h-5 mr-3 text-slate-500"/>
                                        <span className="font-semibold text-slate-700">My Meal Plans</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-400" />
                                </button>
                            </li>
                        </ul>
                    </div>

                     <button 
                        onClick={onLogout}
                        className="w-full flex items-center justify-center bg-slate-200 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-300 transition-colors"
                    >
                        <LogOut className="w-5 h-5 mr-2" />
                        Logout
                    </button>
                </div>
            </div>

             {activeSubPage && (
                <div className={`absolute inset-0 bg-slate-50 z-10 ${isExiting ? 'animate-slide-out-to-right' : 'animate-slide-in-from-right'}`}>
                    {renderSubPage()}
                </div>
            )}
        </div>
    );
};

export default StudentProfilePage;
