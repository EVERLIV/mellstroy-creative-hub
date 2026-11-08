import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../src/integrations/supabase/client';
import TrainerDetailPage from '../components/TrainerDetailPage';
import { Trainer, Class, UserRole } from '../types';
import { UserX } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Page, PageContent } from '@/src/components/layout/page';
import { PageLoader, EmptyState } from '@/src/components/layout/states';

interface TrainerProfileViewPageProps {
  userRole?: UserRole;
  currentUserId?: string;
  favoriteTrainerIds?: string[];
  onToggleFavorite?: (trainerId: string) => void;
  onInitiateBooking?: (target: { trainer: Trainer; cls: Class }) => void;
  onOpenReviewsModal?: (trainer: Trainer) => void;
  onOpenChat?: (trainer: Trainer) => void;
}

const TrainerProfileViewPage: React.FC<TrainerProfileViewPageProps> = ({
  userRole = 'student',
  currentUserId = '',
  favoriteTrainerIds = [],
  onToggleFavorite,
  onInitiateBooking,
  onOpenReviewsModal,
  onOpenChat,
}) => {
  const { trainerId } = useParams<{ trainerId: string }>();
  const navigate = useNavigate();
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!trainerId) {
      navigate('/explore');
      return;
    }

    const loadTrainer = async () => {
      try {
        setLoading(true);

        // Fetch trainer profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', trainerId)
          .single();

        if (profileError) throw profileError;

        // Fetch trainer's classes
        const { data: classes, error: classesError } = await supabase
          .from('classes')
          .select('*')
          .eq('trainer_id', trainerId);

        if (classesError) throw classesError;

        // Fetch trainer's reviews
        const { data: reviews, error: reviewsError } = await supabase
          .from('reviews')
          .select(`
            *,
            client:profiles!reviews_client_id_fkey(username)`)
          .eq('trainer_id', trainerId);

        if (reviewsError) throw reviewsError;

        // Transform data to Trainer type
        const trainerData: Trainer = {
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
          shortDescription: profile.short_description || '',
          experienceYears: profile.experience_years || undefined,
          lastSeen: profile.last_seen ?? null,
          reviewsData: (reviews || []).map(r => ({
            reviewerName: (r.client as any)?.username || 'Anonymous',
            rating: r.rating,
            comment: r.comment || '',
          })),
          classes: (classes || []).map(c => ({
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
            bookings: [],
          })),
          chatHistory: [],
        };

        setTrainer(trainerData);
      } catch (error) {
        console.error('Error loading trainer:', error);
        navigate('/explore');
      } finally {
        setLoading(false);
      }
    };

    loadTrainer();
  }, [trainerId, navigate]);

  if (loading) {
    return (
      <Page>
        <PageLoader title="Loading trainer profile…" />
      </Page>
    );
  }

  if (!trainer) {
    return (
      <Page>
        <PageContent>
          <EmptyState
            icon={UserX}
            title="Trainer not found"
            action={<Button variant="outline" onClick={() => navigate('/explore')}>Back to Explore</Button>}
          />
        </PageContent>
      </Page>
    );
  }

  return (
    <TrainerDetailPage
      trainer={trainer}
      onBack={() => navigate('/explore')}
      onInitiateBooking={onInitiateBooking ?? (() => undefined)}
      userRole={userRole}
      currentUserId={currentUserId}
      isFavorite={favoriteTrainerIds.includes(trainer.id)}
      onToggleFavorite={onToggleFavorite ?? (() => undefined)}
      onOpenReviewsModal={onOpenReviewsModal ?? (() => undefined)}
      onOpenChat={onOpenChat}
    />
  );
};

export default TrainerProfileViewPage;
