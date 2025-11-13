import React from 'react';
import { RefreshCw } from 'lucide-react';

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
      <div className="flex items-center gap-2 text-muted-foreground">
        <RefreshCw 
          className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
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
