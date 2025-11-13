import React from 'react';

interface MessageBubbleSkeletonProps {
  isOwn?: boolean;
}

const MessageBubbleSkeleton: React.FC<MessageBubbleSkeletonProps> = React.memo(({ isOwn = false }) => {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3 animate-pulse`}>
      <div className={`flex gap-2 max-w-[75%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar skeleton (only for other person's messages) */}
        {!isOwn && (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"></div>
        )}
        
        {/* Message bubble skeleton */}
        <div className={`rounded-lg p-3 ${
          isOwn 
            ? 'bg-[#FF6B35] rounded-tr-none' 
            : 'bg-white border border-gray-200 rounded-tl-none'
        }`}>
          <div className="space-y-2">
            <div className={`h-3 rounded w-32 ${isOwn ? 'bg-white/30' : 'bg-gray-200'}`}></div>
            <div className={`h-3 rounded w-24 ${isOwn ? 'bg-white/30' : 'bg-gray-200'}`}></div>
          </div>
        </div>
      </div>
    </div>
  );
});

MessageBubbleSkeleton.displayName = 'MessageBubbleSkeleton';

export default MessageBubbleSkeleton;

