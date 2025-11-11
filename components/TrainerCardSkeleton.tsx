import React from 'react';

const TrainerCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="animate-pulse">
        <div className="bg-slate-200 h-52 w-full"></div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-x-2 mb-2">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-6 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            </div>
            <div className="flex-shrink-0 w-1/4">
              <div className="h-6 bg-slate-200 rounded"></div>
              <div className="h-4 bg-slate-200 rounded mt-1"></div>
            </div>
          </div>
          <div className="border-t pt-3 mt-3">
             <div className="h-4 bg-slate-200 rounded w-full"></div>
          </div>
          <div className="mt-4 h-12 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
};

export default TrainerCardSkeleton;