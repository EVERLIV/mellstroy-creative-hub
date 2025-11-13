import { useEffect, useRef, useState } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  resistance?: number;
}

export const usePullToRefresh = ({ 
  onRefresh, 
  threshold = 80, 
  resistance = 2.5 
}: UsePullToRefreshOptions) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isDragging = false;

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if at the top of the scroll container
      if (container.scrollTop === 0 && !isRefreshing) {
        startY.current = e.touches[0].clientY;
        isDragging = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const distance = currentY - startY.current;

      if (distance > 0) {
        // Prevent default scrolling when pulling down
        e.preventDefault();
        // Apply resistance to make it feel more natural
        setPullDistance(distance / resistance);
      }
    };

    const handleTouchEnd = async () => {
      if (!isDragging) return;
      isDragging = false;

      if (pullDistance > threshold) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, threshold, resistance, onRefresh, isRefreshing]);

  const pullProgress = Math.min(pullDistance / threshold, 1);

  return {
    containerRef,
    pullDistance,
    isRefreshing,
    pullProgress
  };
};
