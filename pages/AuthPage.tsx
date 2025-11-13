import React, { useState } from 'react';
import { Loader, Eye, EyeOff } from 'lucide-react';
import rhinoLogo from '../src/assets/rhino-logo.png';
import { AUTH_BACKGROUND_IMAGE_URL } from '../config/assets';

interface AuthPageProps {
    onLogin: (email: string, password: string) => Promise<void>;
    onSignUp: (email: string, password: string, name: string) => Promise<void>;
    onGoogleSignIn: () => Promise<void>;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin, onSignUp, onGoogleSignIn }) => {
    const [view, setView] = useState<'welcome' | 'login' | 'signup'>('welcome');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

    const handleAction = async (action: () => Promise<void>) => {
        setIsLoading(true);
        setError(null);
        try {
            await action();
        } catch (err: any) {
             const errorCode = err.code;
            let friendlyMessage = "An unexpected error occurred.";
            if (errorCode === 'auth/email-already-in-use') {
                friendlyMessage = "This email is already in use. Please log in.";
            } else if (errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found' || errorCode === 'auth/invalid-credential') {
                friendlyMessage = "Invalid email or password. Please try again.";
            } else if (errorCode === 'auth/weak-password') {
                friendlyMessage = "Password should be at least 6 characters.";
            }
            setError(friendlyMessage);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleAction(() => onLogin(email, password));
    };
    
    const handleSignUpSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        handleAction(() => onSignUp(email, password, name));
    };

    const handleGoogleClick = () => {
        handleAction(onGoogleSignIn);
    }
    
    const resetForm = () => {
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setError(null);
        setIsPasswordVisible(false);
        setIsConfirmPasswordVisible(false);
    }

    const switchView = (newView: 'login' | 'signup') => {
        resetForm();
        setView(newView);
    };

    if (view === 'welcome') {
        return (
            <div className="relative h-screen w-full bg-cover bg-center" style={{ backgroundImage: `url('${AUTH_BACKGROUND_IMAGE_URL}')` }}>
                <div className="absolute inset-0 bg-black/30"></div>
                <div className="relative z-10 flex flex-col h-full p-6 text-white">
                    <header className="flex items-center gap-3">
                        <img src={rhinoLogo} alt="RhinoFit Logo" className="w-20 h-20 object-contain" />
                        <span className="text-2xl font-bold">RhinoFit</span>
                    </header>

                    <main className="flex-1 flex flex-col justify-end pb-12">
                         <h1 className="text-4xl font-bold leading-tight">Becoming Fit</h1>
                         <p className="mt-4 text-base opacity-90">Make your first step towards becoming fit</p>
                    </main>

                    <footer className="flex flex-col gap-4">
                        <button onClick={() => switchView('login')} className="w-full bg-white text-orange-500 font-bold py-3.5 rounded-xl transition-transform transform hover:scale-105">
                            Login
                        </button>
                        <button onClick={() => switchView('signup')} className="w-full bg-transparent border-2 border-white text-white font-bold py-3.5 rounded-xl transition-transform transform hover:scale-105">
                            Sign Up
                        </button>
                    </footer>
                </div>
            </div>
        );
    }

    // Login or Signup View
    const isLogin = view === 'login';
    return (
        <div className="relative h-screen w-full bg-gradient-to-br from-[#FF8C42] to-[#FF6B35] p-6 flex flex-col justify-between text-white">
            <header>
                <h1 className="text-3xl font-bold mt-12">{isLogin ? "Welcome," : "Create Account"}</h1>
                <p className="opacity-90 mt-1">{isLogin ? "Let's become fit!" : "To get started!"}</p>
            </header>

            <main className="flex-1 mt-8">
                 <form onSubmit={isLogin ? handleLoginSubmit : handleSignUpSubmit} className="space-y-4">
                     {!isLogin && (
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            autoComplete="name"
                            className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white placeholder:text-white/70 transition"
                            placeholder="Name"
                        />
                     )}
                     <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white placeholder:text-white/70 transition"
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
                            className="w-full px-4 pr-12 py-3 bg-white/20 border-2 border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white placeholder:text-white/70 transition"
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
                                className="w-full px-4 pr-12 py-3 bg-white/20 border-2 border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white placeholder:text-white/70 transition"
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

                    {isLogin && (
                        <div className="text-right">
                             <button type="button" className="text-sm font-semibold opacity-90 hover:opacity-100">Forgot Password?</button>
                        </div>
                    )}

                    {error && <p className="text-sm text-center text-white bg-red-500/50 p-2 rounded-lg">{error}</p>}
                    
                    <button type="submit" disabled={isLoading} className="w-full bg-white text-orange-500 font-bold py-3.5 rounded-xl transition-transform transform hover:scale-105 flex items-center justify-center disabled:opacity-70">
                        {isLoading ? <Loader className="w-6 h-6 animate-spin text-orange-500" /> : (isLogin ? 'Login' : 'Create Account')}
                    </button>
                </form>
            </main>

            <footer>
                <div className="flex items-center my-6">
                    <div className="flex-grow border-t border-white/30"></div>
                    <span className="flex-shrink mx-4 text-sm opacity-80">or Login with</span>
                    <div className="flex-grow border-t border-white/30"></div>
                </div>

                <div className="flex justify-center gap-4">
                    <button onClick={handleGoogleClick} disabled={isLoading} className="w-16 h-14 bg-white rounded-lg flex items-center justify-center text-black text-2xl font-bold shadow-sm transition-transform transform hover:scale-105">
                         <svg className="w-6 h-6" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
                    </button>
                    <button disabled className="w-16 h-14 bg-white rounded-lg flex items-center justify-center text-blue-800 text-2xl font-bold shadow-sm transition-transform transform hover:scale-105 opacity-50 cursor-not-allowed">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.323-1.325z"></path></svg>
                    </button>
                </div>

                <p className="text-center text-sm font-semibold opacity-90 mt-6">
                    {isLogin ? "Don't have account?" : "Already have an account?"}{' '}
                    <button onClick={() => switchView(isLogin ? 'signup' : 'login')} className="font-bold underline">
                         {isLogin ? 'Sign Up Now' : 'Login'}
                    </button>
                </p>
            </footer>
        </div>
    );
};

export default AuthPage;
