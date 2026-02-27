
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { CloseIcon, GoogleIcon, AppleIcon } from '../../components/Icons';
import { validateEmail, validatePassword } from '../../lib/validators';
import { Link } from 'react-router-dom';
import { ModalShell } from '../../components/ui/ModalShell';

const LocalMailIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
);

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthStep = 'options' | 'email-form';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, signUp } = useAuth();
  const [step, setStep] = useState<AuthStep>('options');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  // const [error, setError] = useState(''); // Managed by useAsyncAction
  // const [loading, setLoading] = useState(false); // Managed by useAsyncAction

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      setStep('options');
      // setError(''); // reset automatically/managed
      // setLoading(false);
    }
  }, [isOpen]);

  const { execute: submitAuth, isLoading, error: authError } = useAsyncAction(async () => {
    if (!validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    if (!isLogin) {
      if (username.length < 3) {
        throw new Error('Username must be at least 3 characters');
      }
      if (!validatePassword(password)) {
        throw new Error('Password must be 8+ characters, include 1 uppercase and 1 number');
      }
    }

    if (isLogin) {
      await login(email, password);
    } else {
      await signUp(email, password, username);
    }
    onClose();
  }, {
    errorMessage: "Authentication failed"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitAuth();
  };

  const handleOAuthClick = (provider: 'google' | 'apple') => {
    alert(`OAuth will be enabled once Supabase is connected. Signing in with ${provider} (mocking successful auth)...`);
    // Placeholder as configured Supabase OAuth requires dashboard setup
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={step === 'options' ? 'Join FULLD' : (isLogin ? 'Sign in' : 'Create account')}
      subtitle="Explore your city"
      size="sm"
    >
      {step === 'options' ? (
        <div className="space-y-4">
          <button
            onClick={() => handleOAuthClick('google')}
            className="w-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-[var(--text-secondary)] transition-all active:scale-[0.98]"
          >
            <GoogleIcon className="w-5 h-5" />
            Continue with Google
          </button>

          <button
            onClick={() => handleOAuthClick('apple')}
            className="w-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-[var(--text-secondary)] transition-all active:scale-[0.98]"
          >
            <AppleIcon className="w-5 h-5" />
            Continue with Apple
          </button>

          <div className="flex items-center gap-4 py-2">
            <div className="h-px flex-grow bg-[var(--border)]" />
            <span className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">or</span>
            <div className="h-px flex-grow bg-[var(--border)]" />
          </div>

          <button
            onClick={() => setStep('email-form')}
            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-[var(--bg-secondary)] transition-all active:scale-[0.98]"
          >
            <LocalMailIcon className="w-5 h-5" />
            Continue with Email
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 animate-in slide-in-from-right-4 duration-300">
          {authError && (
            <div className="p-4 text-sm bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl">
              {authError.message}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Email</label>
              <input
                type="email"
                required
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-xl px-4 py-3.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border)] transition-all"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {!isLogin && (
              <div className="space-y-1.5 animate-in fade-in duration-300">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Username</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-xl px-4 py-3.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border)] transition-all"
                  placeholder="StreetVibe_01"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Password</label>
              <input
                type="password"
                required
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-xl px-4 py-3.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border)] transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-black py-4 rounded-2xl hover:bg-[var(--text-secondary)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              disabled={isLoading}
              className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
            <button
              type="button"
              onClick={() => setStep('options')}
              disabled={isLoading}
              className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-muted)] transition-colors mt-2"
            >
              ← Other options
            </button>
          </div>

          <div className="pt-6 border-t border-[var(--border)]">
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest leading-relaxed text-center">
              By continuing, you agree to FULLD's{' '}
              <Link to="/terms" onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors underline underline-offset-2">Terms of Service</Link>{' '}
              and{' '}
              <Link to="/privacy" onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors underline underline-offset-2">Privacy Policy</Link>.
            </p>
          </div>
        </form>
      )}
    </ModalShell>
  );
};
