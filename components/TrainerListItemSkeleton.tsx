import React from 'react';

const TrainerListItemSkeleton: React.FC = React.memo(() => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-3 flex gap-3 items-start border border-gray-200">
      <div className="animate-pulse flex-1 flex gap-3">
        <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0"></div>
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          <div className="h-8 bg-gray-200 rounded-lg mt-2"></div>
        </div>
      </div>
    </div>
  );
});

TrainerListItemSkeleton.displayName = 'TrainerListItemSkeleton';

export default TrainerListItemSkeleton;
