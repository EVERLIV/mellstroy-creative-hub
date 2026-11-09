import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '@/src/hooks/useAuth';
import { useToast } from '@/src/hooks/use-toast';
import { consumeAuthReturnTo } from '@/src/lib/require-auth';
import { cn } from '@/src/lib/utils';
import rhinoLogo from '@/src/assets/rhino-logo.png';
import authBackground from '@/src/assets/auth-background.jpg';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Spinner } from '@/src/components/ui/spinner';
import { Separator } from '@/src/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/src/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/src/components/ui/input-group';

const MIN_PASSWORD_LENGTH = 6;

type AuthView = 'welcome' | 'login' | 'signup';

/**
 * Intent: athlete arrives to book a coach — clear path in, no gimmicks.
 * Hierarchy: brand photo wins left; action card wins right.
 * Depth: soft card border + quiet separators. No kokonut motion buttons.
 */
const AuthPage = () => {
  const [view, setView] = useState<AuthView>('welcome');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const { signIn, signUp, signInWithGoogle, signInWithFacebook, user, checkOnboardingStatus } =
    useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAndRedirect = async () => {
      if (!user) return;
      const isOnboarded = await checkOnboardingStatus(user.id);
      if (!isOnboarded) {
        navigate('/onboarding');
        return;
      }
      navigate(consumeAuthReturnTo() || '/');
    };
    void checkAndRedirect();
  }, [user, navigate, checkOnboardingStatus]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
      toast({
        title: 'Welcome back',
        description: 'You’re signed in to RhinoFit.',
      });
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Invalid email or password.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: "Passwords don't match",
        description: 'Re-enter the same password in both fields.',
      });
      return;
    }
    setIsLoading(true);
    try {
      await signUp(email, password, name);
      toast({
        title: 'Account created',
        description: 'Welcome to RhinoFit.',
      });
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Signup failed',
        description: error instanceof Error ? error.message : 'Could not create account.',
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

  const switchView = (next: 'login' | 'signup') => {
    resetForm();
    setView(next);
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Google sign-in failed',
        description: error instanceof Error ? error.message : 'Try again.',
      });
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      await signInWithFacebook();
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Facebook sign-in failed',
        description: error instanceof Error ? error.message : 'Try again.',
      });
    }
  };

  if (view === 'welcome') {
    return (
      <div className="flex min-h-svh flex-col bg-background lg:grid lg:grid-cols-2">
        <BrandPanel className="min-h-[52svh] flex-1 lg:min-h-svh" />

        <section className="relative z-10 -mt-6 flex flex-col justify-center rounded-t-3xl bg-background px-6 pb-10 pt-8 lg:mt-0 lg:rounded-none lg:px-16 lg:py-16">
          <Card className="mx-auto w-full max-w-md border-border/80 shadow-sm">
            <CardHeader className="gap-2">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                RhinoFit
              </p>
              <CardTitle className="text-balance text-2xl tracking-tight md:text-3xl">
                Get started
              </CardTitle>
              <CardDescription className="text-pretty text-base">
                Log in or create an account to book coaches across Saigon.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button
                type="button"
                size="lg"
                className="h-11 w-full"
                onClick={() => switchView('login')}
              >
                <LogIn data-icon="inline-start" />
                Log in
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="h-11 w-full"
                onClick={() => switchView('signup')}
              >
                <UserPlus data-icon="inline-start" />
                Create an account
              </Button>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 border-t border-border/70 pt-4">
              <p className="w-full text-center text-xs text-muted-foreground">
                Demo login · <span className="font-medium text-foreground">alex@rhinofit.app</span> ·
                RhinoFit123!
              </p>
            </CardFooter>
          </Card>
        </section>
      </div>
    );
  }

  const isLogin = view === 'login';

  return (
    <div className="flex min-h-svh flex-col bg-background lg:grid lg:grid-cols-2">
      <BrandPanel className="hidden lg:flex lg:min-h-svh" compact />

      <div className="flex min-h-svh flex-col overflow-y-auto">
        <div className="flex items-center justify-between px-4 pt-4 md:px-8 md:pt-6">
          <img src={rhinoLogo} alt="RhinoFit" className="size-12 object-contain lg:invisible" />
          <Button
            type="button"
            variant="ghost"
            onClick={() => setView('welcome')}
            className="text-muted-foreground"
          >
            <ArrowLeft data-icon="inline-start" />
            Back
          </Button>
        </div>

        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-4 py-8 md:px-0">
          <header className="flex flex-col gap-2">
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-pretty text-muted-foreground">
              {isLogin
                ? 'Continue booking sessions with your coaches.'
                : 'Join RhinoFit and reserve your first session.'}
            </p>
          </header>

          <form
            onSubmit={isLogin ? handleLoginSubmit : handleSignUpSubmit}
            className="flex flex-col gap-6"
          >
            <FieldGroup className="gap-5">
              {!isLogin ? (
                <Field>
                  <FieldLabel htmlFor="auth-name">Full name</FieldLabel>
                  <Input
                    id="auth-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                    placeholder="Alex Athlete"
                  />
                </Field>
              ) : null}

              <Field>
                <FieldLabel htmlFor="auth-email">Email</FieldLabel>
                <Input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@email.com"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="auth-password">Password</FieldLabel>
                <PasswordInput
                  id="auth-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  isVisible={isPasswordVisible}
                  onToggleVisible={() => setIsPasswordVisible((v) => !v)}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  placeholder="Enter password"
                />
                {!isLogin ? (
                  <FieldDescription>At least {MIN_PASSWORD_LENGTH} characters</FieldDescription>
                ) : null}
              </Field>

              {!isLogin ? (
                <Field>
                  <FieldLabel htmlFor="auth-confirm-password">Confirm password</FieldLabel>
                  <PasswordInput
                    id="auth-confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    isVisible={isConfirmPasswordVisible}
                    onToggleVisible={() => setIsConfirmPasswordVisible((v) => !v)}
                    autoComplete="new-password"
                    placeholder="Repeat password"
                  />
                </Field>
              ) : null}

              <Button
                type="submit"
                size="lg"
                className="h-11 w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner data-icon="inline-start" />
                    {isLogin ? 'Signing in…' : 'Creating account…'}
                  </>
                ) : (
                  <>
                    {isLogin ? 'Sign in' : 'Create account'}
                    <ArrowRight data-icon="inline-end" />
                  </>
                )}
              </Button>

              <FieldSeparator>Or continue with</FieldSeparator>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="w-full"
                  onClick={() => void handleGoogleSignIn()}
                >
                  <GoogleIcon />
                  Google
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="w-full"
                  onClick={() => void handleFacebookSignIn()}
                >
                  <FacebookIcon />
                  Facebook
                </Button>
              </div>
            </FieldGroup>
          </form>

          <Separator />

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => switchView(isLogin ? 'signup' : 'login')}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </main>
      </div>
    </div>
  );
};

function BrandPanel({
  className,
  compact,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn('relative flex flex-col overflow-hidden text-primary-foreground', className)}>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${authBackground})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-primary/90" />

      <div className="relative z-10 flex flex-1 flex-col p-6 md:p-10">
        <header className="pt-2">
          <img
            src={rhinoLogo}
            alt="RhinoFit"
            className="size-16 object-contain drop-shadow-md md:size-20"
          />
        </header>

        <div
          className={cn(
            'mt-auto flex flex-col gap-3 pb-10',
            compact ? 'lg:pb-12' : 'lg:pb-16'
          )}
        >
          <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
            Train with
            <br />
            intent
          </h1>
          <p className="max-w-sm text-pretty text-base text-primary-foreground/90 md:text-lg">
            Book Vietnam’s top coaches — strength, yoga, boxing — in a few taps.
          </p>
        </div>
      </div>
    </div>
  );
}

function PasswordInput({
  isVisible,
  onToggleVisible,
  id,
  ...inputProps
}: Omit<React.ComponentProps<typeof InputGroupInput>, 'type'> & {
  isVisible: boolean;
  onToggleVisible: () => void;
}) {
  return (
    <InputGroup className="h-10">
      <InputGroupInput
        id={id}
        {...inputProps}
        type={isVisible ? 'text' : 'password'}
        required
        minLength={MIN_PASSWORD_LENGTH}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          type="button"
          size="icon-xs"
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          onClick={onToggleVisible}
        >
          {isVisible ? <EyeOff /> : <Eye />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
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
