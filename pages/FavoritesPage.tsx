import React, { useState } from 'react';
import { Trainer, Class, UserRole } from '../types';
import { ArrowLeft, Heart } from 'lucide-react';
import TrainerGrid from '../components/TrainerGrid';
import ViewToggle from '../components/ViewToggle';
import TrainerDetailPage from '../components/TrainerDetailPage';

interface FavoritesPageProps {
    trainers: Trainer[];
    favoriteTrainerIds: string[];
    onToggleFavorite: (trainerId: string) => void;
    onInitiateBooking: (target: { trainer: Trainer; cls: Class }) => void;
    onOpenChat: (trainer: Trainer) => void;
    onBack: () => void;
    userRole: UserRole;
    currentUserId: string;
    onOpenReviewsModal: (trainer: Trainer) => void;
}

// Mock trainers removed - using real data from database only

const FavoritesPage: React.FC<FavoritesPageProps> = ({
    trainers,
    favoriteTrainerIds,
    onToggleFavorite,
    onInitiateBooking,
    onOpenChat,
    onBack,
    userRole,
    currentUserId,
    onOpenReviewsModal
}) => {
    const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
    const [isExitingDetail, setIsExitingDetail] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Use only real trainers from database
    const favoriteTrainers = trainers.filter(t => favoriteTrainerIds.includes(t.id));

    const handleSelectTrainer = (trainer: Trainer) => {
        setIsExitingDetail(false);
        setSelectedTrainer(trainer);
        window.scrollTo(0, 0);
    };

    const handleBackFromDetail = () => {
        setIsExitingDetail(true);
        setTimeout(() => {
            setSelectedTrainer(null);
            setIsExitingDetail(false);
        }, 300);
    };

    if (selectedTrainer) {
        return (
            <div className={`absolute inset-0 z-20 bg-white transition-all duration-300 ${
                isExitingDetail 
                    ? 'translate-x-full opacity-0' 
                    : 'translate-x-0 opacity-100'
            }`}>
                <TrainerDetailPage 
                    trainer={selectedTrainer} 
                    onBack={handleBackFromDetail}
                    onInitiateBooking={onInitiateBooking}
                    userRole={userRole}
                    currentUserId={currentUserId}
                    isFavorite={favoriteTrainerIds.includes(selectedTrainer.id)}
                    onToggleFavorite={onToggleFavorite}
                    onOpenReviewsModal={onOpenReviewsModal}
                />
            </div>
        );
    }

    return (
        <div className="bg-white h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white shadow-sm z-20 flex-shrink-0">
                <button onClick={onBack} className="p-2 -ml-2">
                    <ArrowLeft className="w-5 h-5 text-gray-800" />
                </button>
                <h1 className="text-base font-bold text-gray-900">My Favorites</h1>
                <div className="w-9"></div> {/* Spacer for centering */}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="px-4 py-3 bg-gray-50 pb-[calc(5rem+env(safe-area-inset-bottom))]">
                    {/* Info Card */}
                    <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                            <h2 className="text-sm font-bold text-gray-900">Favorite Trainers</h2>
                        </div>
                        <p className="text-xs text-gray-600">
                            {favoriteTrainers.length > 0 
                                ? `You have ${favoriteTrainers.length} ${favoriteTrainers.length === 1 ? 'trainer' : 'trainers'} in your favorites`
                                : 'No trainers in your favorites yet'}
                        </p>
                    </div>

                    {/* View Toggle */}
                    {favoriteTrainers.length > 0 && (
                        <div className="flex justify-end items-center mb-3">
                            <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
                        </div>
                    )}

                    {/* Trainers Grid/List */}
                    {favoriteTrainers.length > 0 ? (
                        <TrainerGrid 
                            trainers={favoriteTrainers}
                            viewMode={viewMode}
                            onSelectTrainer={handleSelectTrainer}
                            isLoading={false}
                            favoriteTrainerIds={favoriteTrainerIds}
                            onToggleFavorite={onToggleFavorite}
                        />
                    ) : (
                        <div className="bg-white rounded-lg p-6 text-center shadow-sm">
                            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-sm font-bold text-gray-900 mb-2">No Favorites Yet</h3>
                            <p className="text-xs text-gray-600 mb-4">
                                Tap the heart icon on a trainer's profile to add them to your favorites.
                            </p>
                            <button
                                onClick={onBack}
                                className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 active:scale-95 transition-all duration-200 shadow-sm"
                            >
                                Explore Trainers
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FavoritesPage;
