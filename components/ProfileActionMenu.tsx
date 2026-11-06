import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  CreditCard,
  FileText,
  Pencil,
  Shield,
  User,
} from 'lucide-react';
import ProfileDropdown, {
  type Account,
  type ProfileMenuItem,
} from '../src/components/kokonutui/profile-dropdown';
import { useAuth } from '../src/hooks/useAuth';
import { supabase } from '../src/integrations/supabase/client';
import { cn } from '../src/lib/utils';
import type { Trainer, UserRole } from '../types';

interface ProfileActionMenuProps {
  user: Trainer;
  userRole: UserRole;
  onEditProfile: () => void;
  onLogout: () => void;
  onOpenDocuments?: () => void;
  /** Extra role-specific entries. */
  extraItems?: ProfileMenuItem[];
  className?: string;
}

/**
 * Kokonut profile dropdown wired for every RhinoFit role.
 * Hold Sign out to log out; theme toggle is shown but currently forced light by ThemeProvider.
 */
const ProfileActionMenu: React.FC<ProfileActionMenuProps> = ({
  user,
  userRole,
  onEditProfile,
  onLogout,
  onOpenDocuments,
  extraItems = [],
  className,
}) => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const checkAdmin = async () => {
      if (!authUser?.id) return;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUser.id)
        .eq('role', 'admin')
        .maybeSingle();
      if (!cancelled) setIsAdmin(!!data);
    };
    checkAdmin();
    return () => {
      cancelled = true;
    };
  }, [authUser?.id]);

  const accounts = useMemo<Account[]>(() => {
    const name = user.name || authUser?.user_metadata?.username || 'User';
    const email = authUser?.email || `${userRole}@rhinofit.app`;
    const initials = name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'RF';

    return [
      {
        id: user.id || authUser?.id || 'me',
        name,
        email,
        initials,
        plan: user.isPremium ? 'Premium' : userRole === 'trainer' ? 'Trainer' : 'Basic',
      },
    ];
  }, [user, authUser, userRole]);

  const items = useMemo<ProfileMenuItem[]>(() => {
    const base: ProfileMenuItem[] = [
      {
        label: 'Edit profile',
        icon: <Pencil className="size-4" />,
        onSelect: onEditProfile,
      },
      {
        label: 'My bookings',
        icon: <Calendar className="size-4" />,
        onSelect: () => navigate('/bookings'),
      },
      {
        label: 'Subscription',
        icon: <CreditCard className="size-4" />,
        value: user.isPremium ? 'Premium' : 'Basic',
        onSelect: () => navigate('/subscription'),
      },
      {
        label: userRole === 'trainer' ? 'Trainer profile' : 'About me',
        icon: <User className="size-4" />,
        onSelect: onEditProfile,
      },
    ];

    if (userRole === 'trainer' && onOpenDocuments) {
      base.push({
        label: 'Documents',
        icon: <FileText className="size-4" />,
        onSelect: onOpenDocuments,
      });
    }

    if (isAdmin) {
      base.push({
        label: 'Admin dashboard',
        icon: <Shield className="size-4" />,
        onSelect: () => navigate('/admin'),
      });
    }

    return [...base, ...extraItems];
  }, [extraItems, isAdmin, navigate, onEditProfile, onOpenDocuments, user.isPremium, userRole]);

  return (
    <ProfileDropdown
      className={cn('z-40', className)}
      accounts={accounts}
      defaultAccountId={accounts[0]?.id}
      items={items}
      theme="light"
      defaultStatus="online"
      onSignOut={onLogout}
      holdDuration={1000}
    />
  );
};

export default ProfileActionMenu;
