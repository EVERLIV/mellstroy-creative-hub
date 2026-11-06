import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/src/integrations/supabase/client';
import { useToast } from '@/src/hooks/use-toast';
import { UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  /** Account UI role: student | trainer. Null when admin or unset. */
  userRole: UserRole | null;
  /** True when user_roles.role === 'admin'. */
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  checkOnboardingStatus: (userId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapDbRole(role: string | null | undefined): { userRole: UserRole | null; isAdmin: boolean } {
  if (!role) return { userRole: null, isAdmin: false };
  if (role === 'admin') return { userRole: null, isAdmin: true };
  if (role === 'client' || role === 'student') return { userRole: 'student', isAdmin: false };
  if (role === 'trainer') return { userRole: 'trainer', isAdmin: false };
  return { userRole: null, isAdmin: false };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
        setIsAdmin(false);
        return;
      }

      const mapped = mapDbRole(data?.role);
      setUserRole(mapped.userRole);
      setIsAdmin(mapped.isAdmin);
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole(null);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!mounted) return;

        setSession(nextSession);
        setUser(nextSession?.user ?? null);

        if (nextSession?.user) {
          setTimeout(() => {
            if (mounted) fetchUserRole(nextSession.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setIsAdmin(false);
        }

        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      if (!mounted) return;

      setSession(existing);
      setUser(existing?.user ?? null);

      if (existing?.user) {
        setTimeout(() => {
          if (mounted) fetchUserRole(existing.user.id);
        }, 0);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: 'Error signing in',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }

    toast({
      title: 'Welcome back!',
      description: 'You have successfully signed in.',
    });
  };

  const signUp = async (email: string, password: string, username: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username,
        },
      },
    });

    if (error) {
      toast({
        title: 'Error signing up',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }

    toast({
      title: 'Account created!',
      description: 'Welcome to Mellstroy Challenge!',
    });
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast({
        title: 'Error signing out',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }

    toast({
      title: 'Signed out',
      description: 'You have been signed out successfully.',
    });
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      toast({
        title: 'Error signing in with Google',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signInWithFacebook = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      toast({
        title: 'Error signing in with Facebook',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const checkOnboardingStatus = async (userId: string): Promise<boolean> => {
    const { data } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', userId)
      .maybeSingle();

    return data?.onboarding_completed ?? false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userRole,
        isAdmin,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        signInWithFacebook,
        checkOnboardingStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
