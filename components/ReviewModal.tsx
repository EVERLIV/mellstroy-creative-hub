import React, { useState } from 'react';
import { X, Star, Send } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { Textarea } from '@/src/components/ui/textarea';
import { FormField } from '@/src/components/form/form-field';

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
        <div
            className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/60 p-4 pb-20 md:pb-4"
            onClick={handleClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="review-modal-title"
                className="w-full max-w-md transform animate-slide-up overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="relative border-b border-border p-4 text-center">
                    <h2 id="review-modal-title" className="text-base font-semibold text-foreground">Leave a Review</h2>
                    <p className="text-sm text-muted-foreground">{className}</p>
                    <p className="mt-1 text-xs text-muted-foreground">with {trainerName}</p>
                    <Button variant="ghost" size="icon" onClick={handleClose} aria-label="Close" className="absolute right-2 top-2">
                        <X />
                    </Button>
                </div>

                <div className="space-y-5 p-4 md:p-6">
                    <div>
                        <p className="mb-2 text-center text-sm font-semibold text-foreground">Your Rating</p>
                        <div className="flex justify-center gap-1" onMouseLeave={() => setHoverRating(0)} role="radiogroup" aria-label="Rating">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    type="button"
                                    key={star}
                                    role="radio"
                                    aria-checked={rating === star}
                                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <Star
                                        className={cn(
                                            'h-10 w-10 transition-colors',
                                            (hoverRating || rating) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/40'
                                        )}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                    <FormField label="Your Comments (optional)" htmlFor="comment">
                        <Textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="How was your experience?"
                            rows={4}
                        />
                    </FormField>
                </div>

                <div className="border-t border-border bg-muted/50 p-4">
                    <Button onClick={handleSubmit} disabled={rating === 0} className="w-full">
                        <Send /> Submit Review
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;
