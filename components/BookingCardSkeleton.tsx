import React from 'react';

const BookingCardSkeleton: React.FC = () => {
  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border flex overflow-hidden animate-pulse">
      <div className="flex-1 p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="h-5 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
          <div className="h-6 w-16 bg-muted rounded-full"></div>
        </div>
        
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-20"></div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-16"></div>
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          <div className="flex-1 h-9 bg-muted rounded-xl"></div>
          <div className="flex-1 h-9 bg-muted rounded-xl"></div>
        </div>
      </div>
    </div>
  );
};

export default BookingCardSkeleton;
