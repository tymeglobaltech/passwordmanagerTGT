import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card } from '../components/common/Card';
import toast from 'react-hot-toast';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const SunIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MoonIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const ChevronIcon: React.FC<{ open: boolean }> = ({ open }) => (
  <svg
    className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showLocalLogin, setShowLocalLogin] = useState(true);
  const [passwordExpired, setPasswordExpired] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { login, loginWithGoogle, changeExpiredPassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleGoogleCallback = useCallback(async (response: any) => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle(response.credential);
      toast.success('Login successful!');
      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  }, [loginWithGoogle, navigate, from]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google && googleButtonRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
        });
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: theme === 'dark' ? 'filled_black' : 'outline',
          size: 'large',
          width: googleButtonRef.current.offsetWidth,
          text: 'signin_with',
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [handleGoogleCallback, theme]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Login successful!');
      navigate(from, { replace: true });
    } catch (error: any) {
      if (error.response?.data?.code === 'PASSWORD_EXPIRED') {
        setPasswordExpired(true);
      } else {
        toast.error(error.response?.data?.error || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangeExpiredPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await changeExpiredPassword(email, password, newPassword);
      toast.success('Password changed. You are now signed in.');
      navigate(from, { replace: true });
    } catch (error: any) {
      const details = error.response?.data?.details;
      toast.error(details?.[0]?.msg || error.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const cancelPasswordChange = () => {
    setPasswordExpired(false);
    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 transition-colors duration-200">
      {/* Theme toggle in corner */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 p-2.5 rounded-full text-gray-500 hover:bg-white dark:hover:bg-gray-800 dark:text-gray-400 transition-colors shadow-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur"
        title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      >
        {theme === 'light' ? <MoonIcon /> : <SunIcon />}
      </button>

      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/tyme-global.png" alt="Tyme Global" className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Tyme Global Password Manager
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Secure password management made simple
          </p>
        </div>

        {/* Google Sign-In (primary) */}
        {GOOGLE_CLIENT_ID && (
          <div ref={googleButtonRef} className="flex justify-center">
            {googleLoading && (
              <div className="flex items-center justify-center py-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent"></div>
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Signing in...</span>
              </div>
            )}
          </div>
        )}

        {/* Divider + collapsible local login */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowLocalLogin(!showLocalLogin)}
            className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
            <span className="flex items-center gap-1 px-2 whitespace-nowrap">
              Sign in with username & password
              <ChevronIcon open={showLocalLogin} />
            </span>
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
          </button>

          {showLocalLogin && passwordExpired && (
            <form onSubmit={handleChangeExpiredPassword} className="space-y-4 mt-4">
              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-200">
                Your password has expired. Choose a new password to continue.
              </div>

              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                helperText="Min 8 chars, must include uppercase, lowercase, number, and symbol"
                required
                autoFocus
              />

              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <Button
                type="submit"
                fullWidth
                loading={loading}
                disabled={!newPassword || !confirmPassword}
              >
                Change Password & Sign In
              </Button>

              <button
                type="button"
                onClick={cancelPasswordChange}
                className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Back to sign in
              </button>
            </form>
          )}

          {showLocalLogin && !passwordExpired && (
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <Input
                label="Email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />

              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Button
                type="submit"
                fullWidth
                loading={loading}
                disabled={!email || !password}
              >
                Sign In
              </Button>
            </form>
          )}
        </div>

      </Card>
    </div>
  );
};
