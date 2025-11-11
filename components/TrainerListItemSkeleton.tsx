import React from 'react';

const TrainerListItemSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-md shadow-slate-200/60 p-3 flex space-x-4 items-start">
      <div className="animate-pulse flex-1 flex space-x-4">
        <div className="w-24 h-24 bg-slate-200 rounded-lg flex-shrink-0"></div>
        <div className="flex-1 space-y-3 py-1">
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="h-3 bg-slate-200 rounded w-1/2"></div>
          <div className="h-3 bg-slate-200 rounded w-5/6"></div>
          <div className="h-8 bg-slate-200 rounded-lg mt-2"></div>
        </div>
      </div>
    </div>
  );
};

export default TrainerListItemSkeleton;