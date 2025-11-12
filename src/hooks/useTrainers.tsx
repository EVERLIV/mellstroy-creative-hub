import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Trainer } from '../../types';
import { useToast } from './use-toast';

export const useTrainers = () => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadTrainers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch trainers with trainer role
      const { data: trainerRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'trainer');

      if (rolesError) {
        console.error('Error fetching trainer roles:', rolesError);
        setTrainers([]);
        setLoading(false);
        return;
      }

      const trainerIds = trainerRoles?.map(r => r.user_id) || [];

      if (trainerIds.length === 0) {
        setTrainers([]);
        setLoading(false);
        return;
      }

      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', trainerIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        setTrainers([]);
        setLoading(false);
        return;
      }

      // Fetch classes
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .in('trainer_id', trainerIds);

      if (classesError) {
        console.error('Error fetching classes:', classesError);
        // Continue without classes
      }

      // Fetch reviews with client profiles
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          client:profiles!reviews_client_id_fkey(username)
        `)
        .in('trainer_id', trainerIds);

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
        // Continue without reviews
      }

      // Transform data
      const trainersData: Trainer[] = (profiles || []).map(profile => {
        const lastSeenValue = (profile as any).last_seen;
        
        // Debug: Log first trainer's last_seen value
        if (profiles && profiles.length > 0 && profile.id === profiles[0].id) {
          console.log('[useTrainers] First trainer last_seen:', {
            raw: lastSeenValue,
            type: typeof lastSeenValue,
            isNull: lastSeenValue === null,
            isUndefined: lastSeenValue === undefined,
            afterNullishCoalescing: lastSeenValue ?? null
          });
        }
        
        return {
        id: profile.id,
        name: profile.username,
        specialty: profile.specialty || [],
        rating: Number(profile.rating) || 0,
        reviews: profile.reviews_count || 0,
        location: profile.location || '',
        price: Number(profile.price_per_hour) || 0,
        imageUrl: profile.avatar_url || '',
        verificationStatus: profile.is_verified ? 'verified' : 'unverified',
        isPremium: profile.is_premium || false,
        bio: profile.bio || '',
        shortDescription: (profile as any).short_description || '',
        experienceYears: (profile as any).experience_years || undefined,
        lastSeen: lastSeenValue ?? null,
        reviewsData: (reviews || [])
          .filter(r => r.trainer_id === profile.id)
          .map(r => ({
            reviewerName: (r.client as any)?.username || 'Anonymous',
            rating: r.rating,
            comment: r.comment || '',
          })),
        classes: (classes || [])
          .filter(c => c.trainer_id === profile.id)
          .map(c => ({
            id: c.id as any,
            name: c.name,
            language: (c as any).language || [],
            level: (c as any).level || '',
            description: c.description || '',
            duration: c.duration_minutes,
            price: Number(c.price),
            imageUrl: c.image_url || '',
            imageUrls: c.image_urls || [],
            capacity: c.capacity,
            classType: c.class_type as 'Indoor' | 'Outdoor' | 'Home',
            schedule: c.schedule_days && c.schedule_time ? {
              days: c.schedule_days,
              time: c.schedule_time
            } : undefined,
          })),
        chatHistory: [],
      };
      });

      setTrainers(trainersData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load trainers';
      console.error('Error loading trainers:', err);
      setError(errorMessage);
      setTrainers([]);
      // Don't show toast on initial load to avoid spam
      // Only show toast if we had trainers before and lost them
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTrainers();

    // Subscribe to real-time changes in classes table
    const classesChannel = supabase
      .channel('classes-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'classes'
        },
        (payload) => {
          console.log('Classes table changed:', payload);
          // Reload trainers when any class changes
          loadTrainers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(classesChannel);
    };
  }, [loadTrainers]);

  return { trainers, loading, error, refetch: loadTrainers };
};

