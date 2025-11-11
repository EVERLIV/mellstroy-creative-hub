import React, { useState } from 'react';
import { X, Star, Send } from 'lucide-react';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (rating: number, comment: string) => void;
    trainerName: string;
    className: string;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, onSubmit, trainerName, className }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');

    const handleSubmit = () => {
        if (rating > 0) {
            onSubmit(rating, comment);
        }
    };
    
    const handleClose = () => {
        onClose();
        setTimeout(() => {
            setRating(0);
            setComment('');
        }, 300);
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={handleClose}>
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden transform animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-gray-200 relative">
                    <h2 className="text-lg font-bold text-gray-800 text-center">Leave a Review</h2>
                    <p className="text-sm text-gray-500 text-center">{className}</p>
                    <p className="text-xs text-gray-500 text-center mt-1">with {trainerName}</p>
                    <button onClick={handleClose} className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100">
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
                
                <div className="p-5 space-y-4">
                    <div>
                        <p className="text-md font-semibold text-gray-700 mb-2 text-center">Your Rating</p>
                        <div className="flex justify-center" onMouseLeave={() => setHoverRating(0)}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                    key={star}
                                    className={`w-10 h-10 cursor-pointer transition-colors ${
                                        (hoverRating || rating) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                                    }`}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="comment" className="block text-sm font-medium text-slate-600 mb-1">Your Comments (optional)</label>
                        <textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="How was your experience?"
                            rows={4}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>
                </div>

                <div className="p-5 bg-gray-50 border-t border-gray-200">
                    <button 
                        onClick={handleSubmit} 
                        disabled={rating === 0}
                        className="w-full flex items-center justify-center bg-[#FF6B35] text-white font-bold py-2.5 rounded-xl transition-colors hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                       <Send className="w-4 h-4 mr-2" /> Submit Review
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;
