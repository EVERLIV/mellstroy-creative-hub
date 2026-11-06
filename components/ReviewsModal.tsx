import React, { useState } from 'react';
import { Trainer } from '../types';
import { Star, MessageSquare } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { PageHeader, PageContent } from '@/src/components/layout/page';
import { EmptyState } from '@/src/components/layout/states';

interface ReviewsModalProps {
    trainer: Trainer;
    onClose: () => void;
}

const StarRating: React.FC<{ rating: number; starSize?: string }> = ({ rating, starSize = 'w-4 h-4' }) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, index) => {
          const starValue = index + 1;
          return (
            <Star
              key={index}
              className={cn(starSize, rating >= starValue ? 'fill-yellow-400 text-yellow-400' : 'fill-muted text-muted')}
            />
          );
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
        <div
            className="fixed inset-0 z-50 flex animate-slide-up-full flex-col overflow-y-auto bg-background"
            role="dialog"
            aria-modal="true"
            aria-label={`Reviews for ${trainer.name}`}
        >
            <PageHeader
                title={`Reviews for ${trainer.name}`}
                description={`${trainer.reviewsData.length} reviews`}
                onBack={onClose}
                backLabel="Close reviews"
            />

            <PageContent className="space-y-4 md:space-y-4">
                {trainer.reviewsData.length === 0 ? (
                    <EmptyState icon={MessageSquare} title="No reviews yet" />
                ) : (
                    <div className="grid gap-3 md:grid-cols-2 md:gap-4">
                        {trainer.reviewsData.slice(0, visibleCount).map((review, index) => (
                            <div key={index} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="truncate font-semibold text-foreground">{review.reviewerName}</p>
                                    <StarRating rating={review.rating} />
                                </div>
                                <p className="mt-2 text-sm italic text-muted-foreground">"{review.comment}"</p>
                            </div>
                        ))}
                    </div>
                )}

                {visibleCount < trainer.reviewsData.length && (
                    <div className="flex justify-center">
                        <Button variant="outline" onClick={handleLoadMore} className="w-full md:w-auto">
                            Load More Reviews
                        </Button>
                    </div>
                )}
            </PageContent>
        </div>
    );
};

export default ReviewsModal;
