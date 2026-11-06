import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileActionMenu from './ProfileActionMenu';
import { useAuth } from '../src/hooks/useAuth';
import { supabase } from '../src/integrations/supabase/client';
import type { Trainer, UserRole } from '../types';

/** Loads the signed-in profile and renders ProfileActionMenu (desktop SideNav, etc.). */
const ConnectedProfileActionMenu: React.FC<{ className?: string }> = ({ className }) => {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Trainer | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user?.id) {
        setProfile(null);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, is_premium, is_verified')
        .eq('id', user.id)
        .maybeSingle();

      if (cancelled) return;

      setProfile({
        id: user.id,
        name: data?.username || user.user_metadata?.username || user.email?.split('@')[0] || 'User',
        imageUrl: data?.avatar_url || '',
        isPremium: !!data?.is_premium,
        verificationStatus: data?.is_verified ? 'verified' : 'unverified',
        specialty: [],
        rating: 0,
        reviews: 0,
        location: '',
        price: 0,
        bio: '',
        classes: [],
        chatHistory: [],
      });
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user || !profile) return null;

  const role: UserRole = userRole === 'trainer' ? 'trainer' : 'student';

  return (
    <ProfileActionMenu
      className={className}
      user={profile}
      userRole={role}
      onEditProfile={() => navigate('/profile')}
      onLogout={async () => {
        await signOut();
        navigate('/auth');
      }}
      onOpenDocuments={role === 'trainer' ? () => navigate('/profile') : undefined}
    />
  );
};

export default ConnectedProfileActionMenu;
