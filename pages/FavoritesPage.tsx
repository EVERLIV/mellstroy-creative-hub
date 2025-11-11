import React, { useState } from 'react';
import { Trainer, Class, UserRole } from '../types';
import { ArrowLeft, Heart } from 'lucide-react';
import TrainerListItem from '../components/TrainerListItem';
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

    const favoriteTrainers = trainers.filter(t => favoriteTrainerIds.includes(t.id));

    const handleSelectTrainer = (trainer: Trainer) => {
        setSelectedTrainer(trainer);
    };

    const handleBackFromDetail = () => {
        setSelectedTrainer(null);
    };

    if (selectedTrainer) {
        return (
            <TrainerDetailPage 
                trainer={selectedTrainer} 
                onBack={handleBackFromDetail}
                onInitiateBooking={onInitiateBooking}
                onOpenChat={onOpenChat}
                userRole={userRole}
                currentUserId={currentUserId}
                isFavorite={favoriteTrainerIds.includes(selectedTrainer.id)}
                onToggleFavorite={onToggleFavorite}
                onOpenReviewsModal={onOpenReviewsModal}
            />
        );
    }

    return (
        <div className="bg-slate-50 h-full animate-fade-in flex flex-col relative">
            <button onClick={onBack} className="absolute top-4 left-4 z-10 p-2 rounded-full bg-white/70 backdrop-blur-sm hover:bg-white transition-colors">
                <ArrowLeft className="w-6 h-6 text-slate-700" />
            </button>

            <main className="flex-1 p-4 space-y-4 overflow-y-auto pb-[calc(5rem+env(safe-area-inset-bottom))] pt-20">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center justify-center mb-4">
                    <Heart className="w-7 h-7 mr-2 text-red-500" />
                    My Favorite Trainers
                </h1>

                {favoriteTrainers.length > 0 ? (
                    favoriteTrainers.map(trainer => (
                        <TrainerListItem 
                            key={trainer.id}
                            trainer={trainer}
                            onSelect={() => handleSelectTrainer(trainer)}
                            isFavorite={true} // It's always a favorite on this page
                            onToggleFavorite={onToggleFavorite}
                        />
                    ))
                ) : (
                    <div className="text-center mt-20">
                        <Heart className="w-16 h-16 text-slate-300 mx-auto" />
                        <p className="font-semibold text-slate-600 mt-4">No Favorites Yet</p>
                        <p className="text-sm text-slate-400 mt-2">
                            Tap the heart icon on a trainer's profile to add them to your favorites.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default FavoritesPage;