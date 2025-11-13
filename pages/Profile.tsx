import React from 'react';
import { useAuth } from '../src/hooks/useAuth';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background p-6">
      <h1 className="text-3xl font-bold text-foreground mb-6">My Profile</h1>
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Welcome, {user?.email}
        </p>
        <p className="text-sm text-muted-foreground">
          Manage your trainer profile, classes, and bookings here.
        </p>
      </div>
    </div>
  );
};

export default Profile;
