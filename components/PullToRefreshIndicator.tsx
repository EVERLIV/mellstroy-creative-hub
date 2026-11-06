import React from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  pullProgress: number;
}

const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = ({
  pullDistance,
  isRefreshing,
  pullProgress
}) => {
  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <div 
      className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200"
      style={{ 
        height: `${Math.min(pullDistance, 80)}px`,
        opacity: pullProgress 
      }}
    >
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground shadow-sm"
      >
        <RefreshCw
          className={cn('h-4 w-4 text-primary', isRefreshing && 'animate-spin')}
          style={{ 
            transform: !isRefreshing ? `rotate(${pullProgress * 360}deg)` : undefined 
          }}
        />
        <span className="text-sm font-medium">
          {isRefreshing ? 'Refreshing...' : pullProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
        </span>
      </div>
    </div>
  );
};

export default PullToRefreshIndicator;
