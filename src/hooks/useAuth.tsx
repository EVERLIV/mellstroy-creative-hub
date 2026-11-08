import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/src/lib/firebase';
import { ensureSeeded, listCollection, upsertRow } from '@/src/lib/firebase-store';
import { useToast } from '@/src/hooks/use-toast';
import { UserRole } from '@/types';
import { SEED_IDS } from '@/src/data/seed/mockBackendData';

/** App user shape — keeps `id` so existing pages using user.id keep working. */
export type AppUser = {
  id: string;
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
};

type Session = { user: AppUser; access_token: string };

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  userRole: UserRole | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  /** Demo helpers — instant local roles without Firebase console. */
  signInAsDemo: (role: 'student' | 'trainer') => Promise<void>;
  checkOnboardingStatus: (userId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function toAppUser(u: FirebaseUser): AppUser {
  return {
    id: u.uid,
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    photoURL: u.photoURL,
  };
}

function mapDbRole(role: string | null | undefined): { userRole: UserRole | null; isAdmin: boolean } {
  if (!role) return { userRole: null, isAdmin: false };
  if (role === 'admin') return { userRole: null, isAdmin: true };
  if (role === 'client' || role === 'student') return { userRole: 'student', isAdmin: false };
  if (role === 'trainer') return { userRole: 'trainer', isAdmin: false };
  return { userRole: null, isAdmin: false };
}

async function ensureProfile(user: AppUser, username?: string, role: UserRole = 'student') {
  ensureSeeded();
  upsertRow('profiles', {
    id: user.id,
    username: username || user.displayName || user.email?.split('@')[0] || 'Athlete',
    email: user.email,
    role,
    onboarding_completed: true,
    created_at: new Date().toISOString(),
    last_seen: new Date().toISOString(),
  });
  upsertRow('user_roles', {
    id: `${user.id}-role`,
    user_id: user.id,
    role,
  });

  try {
    await setDoc(
      doc(db, 'profiles', user.id),
      {
        id: user.id,
        username: username || user.displayName || user.email?.split('@')[0] || 'Athlete',
        email: user.email,
        role,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    );
    await setDoc(doc(db, 'user_roles', user.id), { user_id: user.id, role }, { merge: true });
  } catch {
    /* offline / rules — local seed still works */
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserRole = async (userId: string) => {
    ensureSeeded();
    try {
      const local = listCollection('user_roles').find((r) => r.user_id === userId) as
        | { role?: string }
        | undefined;
      if (local?.role) {
        const mapped = mapDbRole(local.role);
        setUserRole(mapped.userRole);
        setIsAdmin(mapped.isAdmin);
        return;
      }
      const snap = await getDoc(doc(db, 'user_roles', userId));
      const role = snap.exists() ? (snap.data().role as string) : 'student';
      const mapped = mapDbRole(role);
      setUserRole(mapped.userRole);
      setIsAdmin(mapped.isAdmin);
    } catch {
      setUserRole('student');
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    ensureSeeded();
    const demo = localStorage.getItem('rhinofit.demoUser');
    if (demo) {
      try {
        const parsed = JSON.parse(demo) as { user: AppUser; role: UserRole };
        setUser(parsed.user);
        setSession({ user: parsed.user, access_token: 'demo' });
        setUserRole(parsed.role);
        setLoading(false);
      } catch {
        localStorage.removeItem('rhinofit.demoUser');
      }
    }

    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (localStorage.getItem('rhinofit.demoUser')) {
        setLoading(false);
        return;
      }
      if (fbUser) {
        const appUser = toAppUser(fbUser);
        setUser(appUser);
        setSession({ user: appUser, access_token: 'firebase' });
        void fetchUserRole(appUser.id);
      } else {
        setUser(null);
        setSession(null);
        setUserRole(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await ensureProfile(toAppUser(cred.user));
      toast({ title: 'Welcome back!', description: 'Signed in with Firebase.' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Sign in failed';
      toast({ title: 'Error signing in', description: message, variant: 'destructive' });
      throw error;
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: username });
      await ensureProfile(toAppUser(cred.user), username, 'student');
      toast({ title: 'Account created!', description: 'Welcome to RhinoFit.' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Sign up failed';
      toast({ title: 'Error signing up', description: message, variant: 'destructive' });
      throw error;
    }
  };

  const signOut = async () => {
    localStorage.removeItem('rhinofit.demoUser');
    try {
      await fbSignOut(auth);
    } catch {
      /* demo-only session */
    }
    setUser(null);
    setSession(null);
    setUserRole(null);
    toast({ title: 'Signed out' });
  };

  const signInWithGoogle = async () => {
    try {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider());
      await ensureProfile(toAppUser(cred.user));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Google sign-in failed';
      toast({ title: 'Google Sign-in failed', description: message, variant: 'destructive' });
      throw error;
    }
  };

  const signInWithFacebook = async () => {
    try {
      const cred = await signInWithPopup(auth, new FacebookAuthProvider());
      await ensureProfile(toAppUser(cred.user));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Facebook sign-in failed';
      toast({ title: 'Facebook Sign-in failed', description: message, variant: 'destructive' });
      throw error;
    }
  };

  const signInAsDemo = async (role: 'student' | 'trainer') => {
    ensureSeeded();
    const id = role === 'student' ? SEED_IDS.student : SEED_IDS.trainerA;
    const profile = listCollection('profiles').find((p) => p.id === id) as {
      username?: string;
      email?: string;
    };
    const appUser: AppUser = {
      id,
      uid: id,
      email: profile?.email || `${role}@rhinofit.demo`,
      displayName: profile?.username || role,
    };
    localStorage.setItem('rhinofit.demoUser', JSON.stringify({ user: appUser, role }));
    setUser(appUser);
    setSession({ user: appUser, access_token: 'demo' });
    setUserRole(role);
    setIsAdmin(false);
    toast({
      title: `Demo ${role}`,
      description: role === 'trainer' ? 'View waitlists & coach tools' : 'Browse, book, join waitlists',
    });
  };

  const checkOnboardingStatus = async (userId: string): Promise<boolean> => {
    ensureSeeded();
    const local = listCollection('profiles').find((p) => p.id === userId) as
      | { onboarding_completed?: boolean }
      | undefined;
    if (local) return Boolean(local.onboarding_completed);
    try {
      const snap = await getDoc(doc(db, 'profiles', userId));
      return Boolean(snap.data()?.onboarding_completed);
    } catch {
      return true;
    }
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
        signInAsDemo,
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
