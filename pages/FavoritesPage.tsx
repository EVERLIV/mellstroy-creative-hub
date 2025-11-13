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

<<<<<<< HEAD
// Тестовые тренеры для демонстрации
const mockTrainers: Trainer[] = [
    {
        id: 'mock-1',
        name: 'Alex Johnson',
        specialty: ['strength training', 'hiit'],
        rating: 4.9,
        reviews: 127,
        location: 'District 1',
        price: 500000,
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
        verificationStatus: 'verified',
        isPremium: true,
        bio: 'Professional strength trainer with 10+ years of experience. Specialized in HIIT and functional training.',
        reviewsData: [
            { reviewerName: 'Sarah M.', rating: 5, comment: 'Amazing trainer! Helped me achieve my fitness goals.' },
            { reviewerName: 'Mike T.', rating: 5, comment: 'Very professional and motivating.' }
        ],
        classes: [
            {
                id: 1,
                name: 'HIIT Bootcamp',
                description: 'High-intensity interval training',
                duration: 60,
                price: 500000,
                imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400',
                imageUrls: [],
                capacity: 15,
                classType: 'Indoor',
                language: ['English', 'Vietnamese'],
                level: 'Intermediate',
                schedule: { days: ['Mon', 'Wed', 'Fri'], time: '18:00' },
                bookings: []
            }
        ],
        chatHistory: []
    },
    {
        id: 'mock-2',
        name: 'Maria Garcia',
        specialty: ['yoga', 'pilates'],
        rating: 4.8,
        reviews: 89,
        location: 'District 3',
        price: 400000,
        imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400',
        verificationStatus: 'verified',
        isPremium: false,
        bio: 'Certified yoga instructor focusing on mindfulness and flexibility.',
        reviewsData: [
            { reviewerName: 'Emma L.', rating: 5, comment: 'Best yoga classes in the city!' },
            { reviewerName: 'John D.', rating: 4, comment: 'Very relaxing and professional.' }
        ],
        classes: [
            {
                id: 2,
                name: 'Morning Yoga Flow',
                description: 'Gentle yoga flow for all levels',
                duration: 75,
                price: 400000,
                imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400',
                imageUrls: [],
                capacity: 20,
                classType: 'Indoor',
                language: ['English'],
                level: 'Beginner',
                schedule: { days: ['Tue', 'Thu', 'Sat'], time: '07:00' },
                bookings: []
            }
        ],
        chatHistory: []
    },
    {
        id: 'mock-3',
        name: 'David Chen',
        specialty: ['boxing', 'mma'],
        rating: 4.7,
        reviews: 156,
        location: 'District 7',
        price: 600000,
        imageUrl: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=400',
        verificationStatus: 'verified',
        isPremium: true,
        bio: 'Former professional boxer now teaching self-defense and fitness boxing.',
        reviewsData: [
            { reviewerName: 'Tom R.', rating: 5, comment: 'Great technique and motivation!' },
            { reviewerName: 'Lisa K.', rating: 4, comment: 'Challenging but fun workouts.' }
        ],
        classes: [
            {
                id: 3,
                name: 'Boxing Fundamentals',
                description: 'Learn boxing basics and get fit',
                duration: 60,
                price: 600000,
                imageUrl: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=400',
                imageUrls: [],
                capacity: 12,
                classType: 'Indoor',
                language: ['English', 'Vietnamese', 'Chinese'],
                level: 'Beginner',
                schedule: { days: ['Mon', 'Wed', 'Fri'], time: '19:00' },
                bookings: []
            }
        ],
        chatHistory: []
    },
    {
        id: 'mock-4',
        name: 'Sophie Anderson',
        specialty: ['running', 'cardio'],
        rating: 4.9,
        reviews: 203,
        location: 'District 2',
        price: 350000,
        imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400',
        verificationStatus: 'verified',
        isPremium: true,
        bio: 'Marathon runner and certified running coach. Helping people achieve their running goals.',
        reviewsData: [
            { reviewerName: 'Anna B.', rating: 5, comment: 'Helped me run my first marathon!' },
            { reviewerName: 'Chris M.', rating: 5, comment: 'Excellent coaching and support.' }
        ],
        classes: [
            {
                id: 4,
                name: '5K Training Program',
                description: 'Build endurance and speed',
                duration: 45,
                price: 350000,
                imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400',
                imageUrls: [],
                capacity: 25,
                classType: 'Outdoor',
                language: ['English'],
                level: 'All Levels',
                schedule: { days: ['Tue', 'Thu', 'Sun'], time: '06:00' },
                bookings: []
            }
        ],
        chatHistory: []
    }
];
=======
// Mock trainers removed - using real data from database only
>>>>>>> f5b1c0859b80a5f6a8702140f10ec53e9a8acd25

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

<<<<<<< HEAD
    // Объединяем реальных тренеров с тестовыми для демонстрации
    const allTrainers = [...trainers, ...mockTrainers];
    const favoriteTrainers = allTrainers.filter(t => favoriteTrainerIds.includes(t.id) || mockTrainers.some(m => m.id === t.id));
=======
    // Use only real trainers from database
    const favoriteTrainers = trainers.filter(t => favoriteTrainerIds.includes(t.id));
>>>>>>> f5b1c0859b80a5f6a8702140f10ec53e9a8acd25

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
<<<<<<< HEAD
                    isFavorite={favoriteTrainerIds.includes(selectedTrainer.id) || mockTrainers.some(m => m.id === selectedTrainer.id)}
=======
                    isFavorite={favoriteTrainerIds.includes(selectedTrainer.id)}
>>>>>>> f5b1c0859b80a5f6a8702140f10ec53e9a8acd25
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
<<<<<<< HEAD
                            favoriteTrainerIds={favoriteTrainerIds.concat(mockTrainers.map(t => t.id))}
=======
                            favoriteTrainerIds={favoriteTrainerIds}
>>>>>>> f5b1c0859b80a5f6a8702140f10ec53e9a8acd25
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
