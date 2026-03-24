import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { RetrievePasswordResponse } from '@passwordpal/shared';
import { Card } from '../components/common/Card';
import { CopyButton } from '../components/password/CopyButton';
import toast from 'react-hot-toast';

const ErrorIcon = () => (
  <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const EyeSmallIcon = () => (
  <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export const RetrievePage: React.FC = () => {
  const { guid } = useParams<{ guid: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [passwordData, setPasswordData] = useState<RetrievePasswordResponse | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (guid) {
      fetchPassword();
    }
  }, [guid]);

  const fetchPassword = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.retrievePassword(guid!);
      setPasswordData(data);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to retrieve password';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 transition-colors">
        <Card className="w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading password...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 transition-colors">
        <Card className="w-full max-w-md text-center">
          <div className="flex justify-center mb-4">
            <ErrorIcon />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Unable to Retrieve Password
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <Link
            to="/"
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
          >
            Go to Homepage
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 transition-colors">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/tyme-global.png" alt="Tyme Global" className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Tyme Global Password Manager
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Secure password retrieval</p>
        </div>

        {/* Password Card */}
        <Card>
          {passwordData?.title && (
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {passwordData.title}
              </h2>
            </div>
          )}

          {/* Password Display */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <div className="flex items-start space-x-2">
              {showPassword ? (
                <textarea
                  value={passwordData?.password || ''}
                  readOnly
                  rows={Math.max(2, (passwordData?.password || '').split('\n').length)}
                  className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-lg text-gray-900 dark:text-gray-100 focus:outline-none resize-none"
                />
              ) : (
                <input
                  type="password"
                  value={passwordData?.password || ''}
                  readOnly
                  className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-lg text-gray-900 dark:text-gray-100 focus:outline-none"
                />
              )}
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-xl transition-colors text-gray-600 dark:text-gray-300 flex-shrink-0"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
              <CopyButton text={passwordData?.password || ''} />
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-3 text-sm">
            {passwordData?.expires_at && (
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <ClockIcon />
                <div>
                  <strong>Expires:</strong>{' '}
                  {new Date(passwordData.expires_at).toLocaleString()}
                </div>
              </div>
            )}

            {passwordData?.max_access_count && (
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <EyeSmallIcon />
                <div>
                  <strong>Accesses:</strong> {passwordData.current_access_count} /{' '}
                  {passwordData.max_access_count}
                  {passwordData.remaining_accesses !== undefined && (
                    <span className="ml-2 text-orange-600 dark:text-orange-400">
                      ({passwordData.remaining_accesses} remaining)
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <CalendarIcon />
              <div>
                <strong>Created:</strong>{' '}
                {new Date(passwordData?.created_at || '').toLocaleString()}
              </div>
            </div>
          </div>

          {/* Warning if limited */}
          {(passwordData?.remaining_accesses !== undefined &&
            passwordData.remaining_accesses <= 3) && (
            <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <strong>Warning:</strong> This password can only be accessed{' '}
                {passwordData.remaining_accesses} more time(s) before it becomes
                unavailable.
              </p>
            </div>
          )}
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
          >
            Create your own secure password
          </Link>
        </div>
      </div>
    </div>
  );
};
