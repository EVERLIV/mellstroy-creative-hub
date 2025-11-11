import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Loader, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/src/hooks/use-toast';

const AuthPage = () => {
  const [view, setView] = useState<'welcome' | 'login' | 'signup'>('welcome');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

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

  if (view === 'welcome') {
    return (
      <div className="relative h-screen w-full bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-400">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex flex-col h-full p-6 text-white">
          <header className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <span className="text-2xl">🦏</span>
            </div>
            <span className="text-xl font-bold">RhinoFit</span>
          </header>

          <main className="flex-1 flex flex-col justify-end pb-12">
            <h1 className="text-5xl font-bold leading-tight">Becoming Fit</h1>
            <p className="mt-4 text-lg opacity-90">Make your first step towards becoming fit</p>
          </main>

          <footer className="flex flex-col gap-4">
            <button
              onClick={() => switchView('login')}
              className="w-full bg-white text-orange-500 font-bold py-4 rounded-xl transition-transform transform active:scale-95 shadow-lg"
            >
              Login
            </button>
            <button
              onClick={() => switchView('signup')}
              className="w-full bg-transparent border-2 border-white text-white font-bold py-4 rounded-xl transition-transform transform active:scale-95"
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
    <div className="relative h-screen w-full bg-gradient-to-br from-orange-500 to-orange-600 p-6 flex flex-col justify-between text-white overflow-y-auto">
      <header className="pt-8">
        <h1 className="text-3xl font-bold">{isLogin ? "Welcome," : "Create Account"}</h1>
        <p className="opacity-90 mt-1">{isLogin ? "Let's become fit!" : "To get started!"}</p>
      </header>

      <main className="flex-1 mt-8 pb-8">
        <form onSubmit={isLogin ? handleLoginSubmit : handleSignUpSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white placeholder:text-white/70 transition text-white"
              placeholder="Name"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white placeholder:text-white/70 transition text-white"
            placeholder="Email"
          />
          <div className="relative">
            <input
              type={isPasswordVisible ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={isLogin ? "current-password" : "new-password"}
              className="w-full px-4 pr-12 py-3 bg-white/20 border-2 border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white placeholder:text-white/70 transition text-white"
              placeholder="Password"
            />
            <button
              type="button"
              onClick={() => setIsPasswordVisible(!isPasswordVisible)}
              className="absolute inset-y-0 right-0 flex items-center px-4 text-white/70 hover:text-white"
              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            >
              {isPasswordVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {!isLogin && (
            <div className="relative">
              <input
                type={isConfirmPasswordVisible ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full px-4 pr-12 py-3 bg-white/20 border-2 border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white placeholder:text-white/70 transition text-white"
                placeholder="Confirm Password"
              />
              <button
                type="button"
                onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                className="absolute inset-y-0 right-0 flex items-center px-4 text-white/70 hover:text-white"
                aria-label={isConfirmPasswordVisible ? "Hide password" : "Show password"}
              >
                {isConfirmPasswordVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-orange-500 font-bold py-4 rounded-xl transition-transform transform active:scale-95 flex items-center justify-center disabled:opacity-70 shadow-lg mt-6"
          >
            {isLoading ? <Loader className="w-6 h-6 animate-spin text-orange-500" /> : (isLogin ? 'Login' : 'Create Account')}
          </button>
        </form>
      </main>

      <footer className="pb-4">
        <p className="text-center text-sm font-semibold opacity-90 mt-6">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button onClick={() => switchView(isLogin ? 'signup' : 'login')} className="font-bold underline">
            {isLogin ? 'Sign Up Now' : 'Login'}
          </button>
        </p>
      </footer>
    </div>
  );
};

export default AuthPage;
