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
import { clearLegacyMockData } from '@/src/lib/firebase-store';
import { useToast } from '@/src/hooks/use-toast';
import { UserRole } from '@/types';

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
  const profile = {
    id: user.id,
    username: username || user.displayName || user.email?.split('@')[0] || 'Athlete',
    email: user.email,
    role,
    onboarding_completed: true,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    last_seen: new Date().toISOString(),
  };
  await setDoc(doc(db, 'profiles', user.id), profile, { merge: true });
  await setDoc(doc(db, 'user_roles', user.id), { id: user.id, user_id: user.id, role }, { merge: true });
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserRole = async (userId: string) => {
    try {
      const roleSnap = await getDoc(doc(db, 'user_roles', userId));
      if (roleSnap.exists()) {
        const mapped = mapDbRole(String(roleSnap.data()?.role || ''));
        setUserRole(mapped.userRole);
        setIsAdmin(mapped.isAdmin);
        return;
      }
      const profileSnap = await getDoc(doc(db, 'profiles', userId));
      const mapped = mapDbRole(String(profileSnap.data()?.role || 'student'));
      setUserRole(mapped.userRole || 'student');
      setIsAdmin(mapped.isAdmin);
    } catch {
      setUserRole('student');
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    clearLegacyMockData();
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const appUser = toAppUser(fbUser);
        setUser(appUser);
        setSession({ user: appUser, access_token: await fbUser.getIdToken() });
        await fetchUserRole(appUser.id);
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
    clearLegacyMockData();
    try {
      await fbSignOut(auth);
    } catch {
      /* ignore */
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

  const checkOnboardingStatus = async (userId: string): Promise<boolean> => {
    try {
      const snap = await getDoc(doc(db, 'profiles', userId));
      if (!snap.exists()) return true;
      return Boolean(snap.data()?.onboarding_completed ?? true);
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
        checkOnboardingStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
