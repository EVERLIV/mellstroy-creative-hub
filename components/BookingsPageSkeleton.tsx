import React from 'react';

const BookingsPageSkeleton: React.FC = () => {
  return (
    <div className="bg-background h-full flex flex-col overflow-hidden animate-pulse">
      {/* Header */}
      <div className="flex-shrink-0 bg-card border-b border-border px-4 py-3">
        <div className="h-6 w-32 bg-muted rounded mb-3" />
        {/* Tabs */}
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-muted rounded-lg" />
          <div className="h-9 w-24 bg-muted rounded-lg" />
        </div>
      </div>

      {/* Booking cards */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card rounded-lg shadow-sm border border-border p-3">
            {/* Class name & person */}
            <div className="mb-3">
              <div className="h-4 w-3/4 bg-muted rounded mb-2" />
              <div className="h-3 w-1/3 bg-muted rounded" />
            </div>

            {/* Date & Time */}
            <div className="flex gap-3 mb-3">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 bg-muted rounded" />
                <div className="h-3 w-20 bg-muted rounded" />
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 bg-muted rounded" />
                <div className="h-3 w-14 bg-muted rounded" />
              </div>
            </div>

            {/* Booking details */}
            <div className="mb-3 p-2 bg-muted/50 rounded-lg space-y-2">
              <div className="flex justify-between">
                <div className="h-3 w-20 bg-muted rounded" />
                <div className="h-3 w-16 bg-muted rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-16 bg-muted rounded" />
                <div className="h-3 w-20 bg-muted rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-14 bg-muted rounded" />
                <div className="h-3 w-24 bg-muted rounded" />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2 border-t border-border">
              <div className="flex-1 h-9 bg-muted rounded-lg" />
              <div className="flex-1 h-9 bg-muted rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookingsPageSkeleton;
