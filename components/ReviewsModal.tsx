import React, { useState } from 'react';
import { Trainer } from '../types';
import { ArrowLeft, Star } from 'lucide-react';

interface ReviewsModalProps {
    trainer: Trainer;
    onClose: () => void;
}

const StarRating: React.FC<{ rating: number; starSize?: string }> = ({ rating, starSize = 'w-4 h-4' }) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, index) => {
          const starValue = index + 1;
          if (rating >= starValue) {
            return <Star key={index} className={`${starSize} text-yellow-400 fill-yellow-400`} />;
          }
          return <Star key={index} className={`${starSize} text-gray-300 fill-gray-300`} />;
        })}
      </div>
    );
};

const REVIEWS_PER_PAGE = 8;
const INITIAL_COUNT = 8;

const ReviewsModal: React.FC<ReviewsModalProps> = ({ trainer, onClose }) => {
    const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + REVIEWS_PER_PAGE);
    };

    return (
        <div className="fixed inset-0 bg-slate-50 z-40 animate-slide-up-full flex flex-col">
            {/* Header */}
            <header className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 shadow-sm p-4 flex items-center flex-shrink-0">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 mr-2">
                    <ArrowLeft className="w-6 h-6 text-slate-700" />
                </button>
                <div className="text-center flex-1">
                    <h1 className="text-lg font-bold text-slate-800">Reviews for</h1>
                    <p className="text-sm text-slate-600 -mt-1">{trainer.name}</p>
                </div>
                <div className="w-10"></div> {/* Spacer */}
            </header>

            {/* Content */}
            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                {trainer.reviewsData.slice(0, visibleCount).map((review, index) => (
                    <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80">
                        <div className="flex items-center justify-between">
                            <p className="font-bold text-gray-800">{review.reviewerName}</p>
                            <StarRating rating={review.rating} />
                        </div>
                        <p className="text-sm text-gray-600 mt-2 italic">"{review.comment}"</p>
                    </div>
                ))}
                
                {visibleCount < trainer.reviewsData.length && (
                    <button 
                        onClick={handleLoadMore}
                        className="w-full mt-4 text-center bg-white border border-slate-300 text-slate-700 text-sm font-bold py-3 px-3 rounded-lg hover:bg-slate-100 transition-colors duration-200"
                    >
                        Load More Reviews
                    </button>
                )}
            </main>
        </div>
    );
};

export default ReviewsModal;
