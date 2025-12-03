import React from 'react';

const ProfilePageSkeleton: React.FC = () => {
  return (
    <div className="bg-background min-h-screen pb-24 animate-pulse">
      {/* Header skeleton */}
      <div className="bg-gradient-to-br from-primary/50 to-accent/50 pt-6 pb-20 px-4">
        <div className="flex justify-between items-start mb-4">
          <div className="h-5 w-20 bg-primary-foreground/20 rounded" />
          <div className="h-8 w-8 bg-primary-foreground/20 rounded-lg" />
        </div>
      </div>

      {/* Profile card skeleton */}
      <div className="px-4 -mt-16">
        <div className="bg-card rounded-2xl shadow-lg p-4">
          <div className="flex flex-col items-center">
            {/* Avatar */}
            <div className="w-24 h-24 bg-muted rounded-full mb-3" />
            {/* Name */}
            <div className="h-6 w-32 bg-muted rounded mb-2" />
            {/* Role badge */}
            <div className="h-5 w-20 bg-muted rounded-full mb-3" />
            {/* Stats row */}
            <div className="flex gap-6 mb-4">
              <div className="text-center">
                <div className="h-5 w-8 bg-muted rounded mb-1 mx-auto" />
                <div className="h-3 w-12 bg-muted rounded" />
              </div>
              <div className="text-center">
                <div className="h-5 w-8 bg-muted rounded mb-1 mx-auto" />
                <div className="h-3 w-12 bg-muted rounded" />
              </div>
              <div className="text-center">
                <div className="h-5 w-8 bg-muted rounded mb-1 mx-auto" />
                <div className="h-3 w-12 bg-muted rounded" />
              </div>
            </div>
            {/* Edit button */}
            <div className="h-10 w-full bg-muted rounded-lg" />
          </div>
        </div>
      </div>

      {/* Menu items skeleton */}
      <div className="px-4 mt-6 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-card rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-muted rounded-lg" />
            <div className="flex-1">
              <div className="h-4 w-24 bg-muted rounded mb-1" />
              <div className="h-3 w-36 bg-muted rounded" />
            </div>
            <div className="w-5 h-5 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Premium banner skeleton */}
      <div className="px-4 mt-6">
        <div className="bg-muted/50 rounded-2xl p-4 h-24" />
      </div>
    </div>
  );
};

export default ProfilePageSkeleton;
