import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useToast } from '@/src/hooks/use-toast';
import rhinoLogo from '@/src/assets/rhino-logo.png';
import authBackground from '@/src/assets/auth-background.jpg';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/src/components/ui/field';
import AttractButton from '@/src/components/kokonutui/attract-button';
import ParticleButton from '@/src/components/kokonutui/particle-button';
import { consumeAuthReturnTo } from '@/src/lib/require-auth';

const MIN_PASSWORD_LENGTH = 6;

type AuthView = 'welcome' | 'login' | 'signup';

const AuthPage = () => {
  const [view, setView] = useState<AuthView>('welcome');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const {
    signIn,
    signUp,
    signInWithGoogle,
    signInWithFacebook,
    signInAsDemo,
    user,
    checkOnboardingStatus,
  } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAndRedirect = async () => {
      if (user) {
        const isOnboarded = await checkOnboardingStatus(user.id);
        if (!isOnboarded) {
          navigate('/onboarding');
          return;
        }
        const returnTo = consumeAuthReturnTo();
        navigate(returnTo || '/');
      }
    };
    checkAndRedirect();
  }, [user, navigate, checkOnboardingStatus]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "Invalid email or password. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
      });
      return;
    }
    setIsLoading(true);
    try {
      await signUp(email, password, name);
      toast({
        title: "Account created!",
        description: "Welcome to RhinoFit!",
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: error.message || "Could not create account. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setIsPasswordVisible(false);
    setIsConfirmPasswordVisible(false);
  };

  const switchView = (newView: 'login' | 'signup') => {
    resetForm();
    setView(newView);
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Google Sign-in failed",
        description: error.message || "Could not sign in with Google. Please try again.",
      });
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      await signInWithFacebook();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Facebook Sign-in failed",
        description: error.message || "Could not sign in with Facebook. Please try again.",
      });
    }
  };

  /* ---------------------------------------------------------------- */
  /* Entry choice                                                      */
  /* ---------------------------------------------------------------- */

  if (view === 'welcome') {
    return (
      <div className="flex min-h-svh flex-col bg-background lg:grid lg:grid-cols-2">
        <BrandPanel className="min-h-[60svh] flex-1 lg:min-h-svh" />

        {/* Mobile: bottom sheet over the photo. Desktop: right half. */}
        <section className="relative z-10 -mt-8 flex flex-col justify-center rounded-t-3xl bg-background px-6 pb-10 pt-8 animate-fade-in lg:mt-0 lg:rounded-none lg:p-16">
          <div className="mx-auto flex w-full max-w-md flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Get started</h2>
              <p className="text-muted-foreground">
                Log in to your account or create a new one to book trainers.
              </p>
            </div>
            <div className="flex flex-col gap-6 px-1 py-2">
              <AttractButton
                containerClassName="w-full"
                className="h-12 w-full text-base font-semibold"
                onClick={() => switchView('login')}
              >
                Login
              </AttractButton>
              <AttractButton
                containerClassName="w-full"
                className="h-12 w-full border border-border bg-card text-base font-semibold text-foreground hover:bg-muted active:bg-muted"
                onClick={() => switchView('signup')}
              >
                Create an account
              </AttractButton>
              <div className="space-y-2 border-t border-border pt-4">
                <p className="text-center text-xs text-muted-foreground">
                  Firebase demo (mock data — no console setup needed)
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => void signInAsDemo('student')}
                  >
                    Demo student
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => void signInAsDemo('trainer')}
                  >
                    Demo trainer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Login / sign up                                                   */
  /* ---------------------------------------------------------------- */

  const isLogin = view === 'login';

  return (
    <div className="flex min-h-svh flex-col bg-background lg:grid lg:grid-cols-2">
      <BrandPanel className="hidden lg:flex lg:min-h-svh" compact />

      <div className="flex min-h-svh flex-col overflow-y-auto">
        <div className="flex items-center justify-between px-4 pt-4 md:px-8 md:pt-6">
          <img src={rhinoLogo} alt="RhinoFit" className="size-14 object-contain lg:invisible" />
          <Button variant="ghost" onClick={() => setView('welcome')} className="text-muted-foreground">
            <ArrowLeft />
            Back
          </Button>
        </div>

        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-4 py-8 animate-fade-in md:px-0">
          <header className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-muted-foreground">
              {isLogin ? "Let's continue your fitness journey" : 'Start your fitness journey today'}
            </p>
          </header>

          <form onSubmit={isLogin ? handleLoginSubmit : handleSignUpSubmit} className="flex flex-col gap-6">
            <FieldGroup className="gap-5">
              {!isLogin && (
                <Field>
                  <FieldLabel htmlFor="auth-name">Full name</FieldLabel>
                  <Input
                    id="auth-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                    placeholder="Enter your name"
                    className="h-11"
                  />
                </Field>
              )}

              <Field>
                <FieldLabel htmlFor="auth-email">Email address</FieldLabel>
                <Input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="Enter your email"
                  className="h-11"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="auth-password">Password</FieldLabel>
                <PasswordInput
                  id="auth-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  isVisible={isPasswordVisible}
                  onToggleVisible={() => setIsPasswordVisible(!isPasswordVisible)}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  placeholder="Enter your password"
                />
                {!isLogin && <FieldDescription>At least {MIN_PASSWORD_LENGTH} characters</FieldDescription>}
              </Field>

              {!isLogin && (
                <Field>
                  <FieldLabel htmlFor="auth-confirm-password">Confirm password</FieldLabel>
                  <PasswordInput
                    id="auth-confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    isVisible={isConfirmPasswordVisible}
                    onToggleVisible={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                    autoComplete="new-password"
                    placeholder="Confirm your password"
                  />
                </Field>
              )}

              <ParticleButton
                type="submit"
                size="lg"
                status={isLoading ? 'pending' : 'idle'}
                pendingLabel={isLogin ? 'Logging in…' : 'Creating account…'}
                disabled={isLoading}
                className="h-11 w-full text-base font-semibold"
              >
                {isLogin ? 'Login to RhinoFit' : 'Create account'}
              </ParticleButton>

              <FieldSeparator>Or continue with</FieldSeparator>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button type="button" size="lg" variant="outline" onClick={handleGoogleSignIn} className="w-full">
                  <GoogleIcon />
                  Google
                </Button>
                <Button type="button" size="lg" variant="outline" onClick={handleFacebookSignIn} className="w-full">
                  <FacebookIcon />
                  Facebook
                </Button>
              </div>
            </FieldGroup>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => switchView(isLogin ? 'signup' : 'login')}
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              {isLogin ? 'Sign up' : 'Login'}
            </button>
          </p>
        </main>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */

interface BrandPanelProps {
  className?: string;
  /** Hide the tagline copy size on the form views. */
  compact?: boolean;
  children?: React.ReactNode;
}

/** Photo + brand scrim. Mobile entry screen, desktop left half of every auth view. */
function BrandPanel({ className, compact, children }: BrandPanelProps) {
  return (
    <div className={cn('relative flex flex-col overflow-hidden text-primary-foreground', className)}>
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${authBackground})` }} />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-primary/90" />

      <div className="relative z-10 flex flex-1 flex-col p-6 animate-fade-in md:p-10">
        <header className="pt-4">
          <img src={rhinoLogo} alt="RhinoFit" className="size-20 object-contain drop-shadow-lg" />
        </header>

        <div className={cn('flex flex-1 flex-col justify-end gap-4 pb-12', compact ? 'lg:pb-12' : 'lg:pb-16')}>
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight drop-shadow-lg md:text-6xl">
            Becoming
            <br />
            Fit
          </h1>
          <p className="max-w-sm text-lg leading-relaxed drop-shadow md:text-xl">
            Make your first step towards becoming fit with Vietnam's top trainers
          </p>
          {children}
        </div>
      </div>
    </div>
  );
}

interface PasswordInputProps extends Omit<React.ComponentProps<typeof Input>, 'type'> {
  isVisible: boolean;
  onToggleVisible: () => void;
}

/** Input + show/hide toggle. */
function PasswordInput({ isVisible, onToggleVisible, className, ...inputProps }: PasswordInputProps) {
  return (
    <div className="relative">
      <Input
        {...inputProps}
        type={isVisible ? 'text' : 'password'}
        required
        minLength={MIN_PASSWORD_LENGTH}
        className={cn('h-11 pr-11', className)}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onToggleVisible}
        aria-label={isVisible ? 'Hide password' : 'Show password'}
        className="absolute right-0.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:bg-transparent hover:text-foreground"
      >
        {isVisible ? <EyeOff /> : <Eye />}
      </Button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export default AuthPage;
