import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../src/hooks/useAuth';
import { supabase } from '../src/integrations/supabase/client';
import { Trainer, Class } from '../types';
import OnboardingPage from './OnboardingPage';
import { useToast } from '../src/hooks/use-toast';

const OnboardingPageContainer: React.FC = () => {
  const { user, checkOnboardingStatus } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<Trainer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check if already onboarded
      const isOnboarded = await checkOnboardingStatus(user.id);
      if (isOnboarded) {
        navigate('/');
        return;
      }

      // Load existing profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        setCurrentUser({
          id: profile.id,
          name: profile.username || '',
          specialty: profile.specialty || [],
          rating: profile.rating || 0,
          reviews: profile.reviews_count || 0,
          location: profile.location || '',
          price: profile.price_per_hour || 0,
          imageUrl: profile.avatar_url || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400',
          verificationStatus: profile.is_verified ? 'verified' : 'unverified',
          isPremium: profile.is_premium || false,
          bio: profile.bio || '',
          reviewsData: [],
          classes: [],
          chatHistory: [],
          age: profile.age,
          height: profile.height,
          weight: profile.weight,
          goals: profile.goals || [],
          interests: profile.interests || [],
          onboardingCompleted: false,
        });
      }
      setIsLoading(false);
    };

    loadUserProfile();
  }, [user, navigate, checkOnboardingStatus]);

  const handleComplete = async (updatedUser: Trainer) => {
    if (!user) return;

    try {
      // Save to user_roles table
      if (updatedUser.role) {
        await supabase.from('user_roles').insert({
          user_id: user.id,
          role: updatedUser.role === 'student' ? 'client' : 'trainer',
        });
      }

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username: updatedUser.name,
          bio: updatedUser.bio,
          location: updatedUser.location,
          specialty: updatedUser.specialty,
          age: updatedUser.age,
          height: updatedUser.height,
          weight: updatedUser.weight,
          goals: updatedUser.goals,
          interests: updatedUser.interests,
          onboarding_completed: true,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // If trainer with classes, save the first class
      if (updatedUser.role === 'trainer' && updatedUser.classes && updatedUser.classes.length > 0) {
        const firstClass = updatedUser.classes[0];
        await supabase.from('classes').insert({
          trainer_id: user.id,
          name: firstClass.name,
          description: firstClass.description,
          duration_minutes: firstClass.duration,
          price: firstClass.price,
          capacity: firstClass.capacity,
          class_type: firstClass.classType,
          schedule_days: firstClass.schedule?.days,
          schedule_time: firstClass.schedule?.time,
        });
      }

      toast({
        title: "Profile completed!",
        description: "Welcome to RhinoFit!",
      });

      navigate('/');
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save profile. Please try again.",
      });
    }
  };

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return <OnboardingPage currentUser={currentUser} onComplete={handleComplete} />;
};

export default OnboardingPageContainer;
