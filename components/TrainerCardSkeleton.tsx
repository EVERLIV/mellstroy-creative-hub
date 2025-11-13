import React from 'react';

const TrainerCardSkeleton: React.FC = React.memo(() => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
      <div className="animate-pulse">
        <div className="bg-gray-200 h-48 w-full"></div>
        <div className="p-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="flex-shrink-0 w-1/4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded mt-1"></div>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-2 mt-2">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
          </div>
          <div className="mt-3 h-9 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
});

TrainerCardSkeleton.displayName = 'TrainerCardSkeleton';

export default TrainerCardSkeleton;
