import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Loader, Eye, EyeOff, Dumbbell, Activity, Heart } from 'lucide-react';
import { useToast } from '@/src/hooks/use-toast';
import rhinoLogo from '@/src/assets/rhino-logo.png';

const AuthPage = () => {
  const [view, setView] = useState<'welcome' | 'login' | 'signup'>('welcome');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const { signIn, signUp, signInWithGoogle, signInWithFacebook, user, checkOnboardingStatus } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAndRedirect = async () => {
      if (user) {
        const isOnboarded = await checkOnboardingStatus(user.id);
        navigate(isOnboarded ? '/' : '/onboarding');
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

  if (view === 'welcome') {
    return (
      <div className="relative h-screen w-full bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-400 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-40 -left-20 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        {/* Floating Icons */}
        <div className="absolute inset-0 pointer-events-none">
          <Dumbbell className="absolute top-32 right-12 w-8 h-8 text-white/20 animate-bounce" style={{ animationDuration: '3s' }} />
          <Activity className="absolute top-1/3 left-8 w-10 h-10 text-white/20 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }} />
          <Heart className="absolute bottom-1/3 right-16 w-6 h-6 text-white/20 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }} />
        </div>

        <div className="relative z-10 flex flex-col h-full p-6 text-white animate-fade-in">
          <header className="flex items-center gap-3 pt-4">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center transform transition-transform hover:scale-110 p-2">
              <img src={rhinoLogo} alt="RhinoFit" className="w-full h-full object-contain" />
            </div>
            <span className="text-2xl font-bold tracking-tight">RhinoFit</span>
          </header>

          <main className="flex-1 flex flex-col justify-end pb-16">
            <div className="space-y-4 animate-slide-up">
              <h1 className="text-6xl font-extrabold leading-tight tracking-tight">
                Becoming<br />Fit
              </h1>
              <p className="mt-6 text-xl opacity-95 max-w-sm leading-relaxed">
                Make your first step towards becoming fit with Vietnam's top trainers
              </p>
            </div>
          </main>

          <footer className="flex flex-col gap-4 pb-8">
            <button
              onClick={() => switchView('login')}
              className="w-full bg-white text-orange-500 font-bold py-4 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-95"
            >
              Login
            </button>
            <button
              onClick={() => switchView('signup')}
              className="w-full bg-white/10 backdrop-blur-sm border-2 border-white text-white font-bold py-4 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-95 hover:bg-white/20"
            >
              Sign Up
            </button>
          </footer>
        </div>
      </div>
    );
  }

  const isLogin = view === 'login';
  return (
    <div className="relative h-screen w-full bg-gradient-to-br from-orange-500 via-orange-400 to-orange-600 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-32 w-80 h-80 bg-yellow-300/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 h-full p-6 flex flex-col text-white animate-fade-in overflow-y-auto">
        {/* Back Button & Logo */}
        <div className="flex items-center justify-between pt-4 pb-8">
          <button 
            onClick={() => setView('welcome')}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center p-1.5">
              <img src={rhinoLogo} alt="RhinoFit Logo" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>

        {/* Header */}
        <header className="space-y-2 animate-slide-up">
          <h1 className="text-4xl font-extrabold tracking-tight">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-lg opacity-90">
            {isLogin ? "Let's continue your fitness journey" : "Start your fitness journey today"}
          </p>
        </header>

        {/* Form */}
        <main className="flex-1 mt-10">
          <form onSubmit={isLogin ? handleLoginSubmit : handleSignUpSubmit} className="space-y-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium opacity-90">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border-2 border-white/40 rounded-xl focus:outline-none focus:border-white focus:bg-white/30 placeholder:text-white/60 transition-all text-white text-lg"
                  placeholder="Enter your name"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium opacity-90">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border-2 border-white/40 rounded-xl focus:outline-none focus:border-white focus:bg-white/30 placeholder:text-white/60 transition-all text-white text-lg"
                placeholder="Enter your email"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium opacity-90">Password</label>
              <div className="relative">
                <input
                  type={isPasswordVisible ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  className="w-full px-5 py-4 pr-14 bg-white/20 backdrop-blur-sm border-2 border-white/40 rounded-xl focus:outline-none focus:border-white focus:bg-white/30 placeholder:text-white/60 transition-all text-white text-lg"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  className="absolute inset-y-0 right-0 flex items-center px-5 text-white/70 hover:text-white transition-colors"
                  aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                >
                  {isPasswordVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium opacity-90">Confirm Password</label>
                <div className="relative">
                  <input
                    type={isConfirmPasswordVisible ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full px-5 py-4 pr-14 bg-white/20 backdrop-blur-sm border-2 border-white/40 rounded-xl focus:outline-none focus:border-white focus:bg-white/30 placeholder:text-white/60 transition-all text-white text-lg"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                    className="absolute inset-y-0 right-0 flex items-center px-5 text-white/70 hover:text-white transition-colors"
                    aria-label={isConfirmPasswordVisible ? "Hide password" : "Show password"}
                  >
                    {isConfirmPasswordVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-orange-500 font-bold py-5 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center disabled:opacity-70 mt-8 text-lg"
            >
              {isLoading ? (
                <Loader className="w-6 h-6 animate-spin text-orange-500" />
              ) : (
                <span>{isLogin ? 'Login to RhinoFit' : 'Create Account'}</span>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-white/80">Or continue with</span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full bg-white/20 backdrop-blur-sm border-2 border-white/40 text-white font-semibold py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 hover:bg-white/30"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <button
                type="button"
                onClick={handleFacebookSignIn}
                className="w-full bg-white/20 backdrop-blur-sm border-2 border-white/40 text-white font-semibold py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 hover:bg-white/30"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Continue with Facebook
              </button>
            </div>
          </form>
        </main>

        {/* Footer */}
        <footer className="pb-6 pt-8">
          <p className="text-center text-base opacity-90">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button 
              onClick={() => switchView(isLogin ? 'signup' : 'login')} 
              className="font-bold underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default AuthPage;
