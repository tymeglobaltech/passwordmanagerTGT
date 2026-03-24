import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/common/Card';
import { PasswordGenerator } from '../components/password/PasswordGenerator';
import { SavePasswordForm } from '../components/password/SavePasswordForm';
import { useNavigate } from 'react-router-dom';

const ShieldCheckIcon = () => (
  <svg className="w-7 h-7 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-7 h-7 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="w-7 h-7 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

export const GeneratePage: React.FC = () => {
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [mode, setMode] = useState<'generate' | 'custom'>('custom');
  const navigate = useNavigate();

  const handlePasswordSaved = () => {
    navigate('/dashboard');
  };

  const activePassword = mode === 'generate' ? generatedPassword : customPassword;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Create Shareable Password
        </h1>

        {/* Mode Toggle */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-full p-1 mb-6 max-w-md">
          <button
            onClick={() => setMode('generate')}
            className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-full transition-all duration-200 ${
              mode === 'generate'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Generate Password
          </button>
          <button
            onClick={() => setMode('custom')}
            className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-full transition-all duration-200 ${
              mode === 'custom'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Enter My Own
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Generator or Custom Input */}
          <Card>
            {mode === 'generate' ? (
              <>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Password Generator
                </h2>
                <PasswordGenerator onPasswordGenerated={setGeneratedPassword} />
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Enter Your Password
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Enter the password or secret you want to share securely. You can use multiple lines — for example, a username on one line and the password on another.
                </p>
                <textarea
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  placeholder={"Enter your password or secret text...\n\ne.g.\nUsername: john@example.com\nPassword: mypassword123"}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-colors"
                />
              </>
            )}
          </Card>

          {/* Save Password */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Save & Share
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Save this password to get a shareable link. You can set expiration
              and access limits.
            </p>
            <SavePasswordForm
              password={activePassword}
              onSaved={handlePasswordSaved}
            />
          </Card>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Card>
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <ShieldCheckIcon />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Secure Encryption</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Passwords are encrypted with AES-256-CBC
              </p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <ClockIcon />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Time-Limited</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Set expiration dates for automatic cleanup
              </p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <EyeOffIcon />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Access Control</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Limit how many times a password can be viewed
              </p>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};
