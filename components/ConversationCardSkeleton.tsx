import React from 'react';

const ConversationCardSkeleton: React.FC = React.memo(() => {
  return (
    <div className="w-full bg-white rounded-lg p-3 mb-3 shadow-sm animate-pulse">
      {/* Header with avatar, name, time */}
      <div className="flex items-start gap-3 mb-2">
        {/* Avatar skeleton */}
        <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0"></div>
        
        {/* Name and message preview skeleton */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
          {/* Last message preview skeleton */}
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>

      {/* Booking details skeleton (optional) */}
      <div className="mt-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
        <div className="h-3 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="h-6 bg-gray-200 rounded w-20"></div>
          <div className="h-6 bg-gray-200 rounded w-16"></div>
          <div className="h-6 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </div>
  );
});

ConversationCardSkeleton.displayName = 'ConversationCardSkeleton';

export default ConversationCardSkeleton;

