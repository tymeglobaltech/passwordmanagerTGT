import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { CopyButton } from '../components/password/CopyButton';
import { api } from '../services/api';
import { PasswordListItem } from '@passwordpal/shared';
import toast from 'react-hot-toast';

const CalendarIcon = () => (
  <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const KeyEmptyIcon = () => (
  <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const LinkIcon = () => (
  <svg className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

export const DashboardPage: React.FC = () => {
  const [passwords, setPasswords] = useState<PasswordListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPasswords();
  }, [page]);

  const fetchPasswords = async () => {
    try {
      setLoading(true);
      const response = await api.listPasswords(page, 20);
      setPasswords(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      toast.error('Failed to load passwords');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (guid: string) => {
    if (!confirm('Are you sure you want to delete this password?')) {
      return;
    }

    try {
      await api.deletePassword(guid);
      toast.success('Password deleted successfully');
      fetchPasswords();
    } catch (error) {
      toast.error('Failed to delete password');
    }
  };

  const isExpired = (expiresAt?: Date) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const isAccessLimitReached = (password: PasswordListItem) => {
    if (!password.max_access_count) return false;
    return password.current_access_count >= password.max_access_count;
  };

  if (loading && passwords.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-600 border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Passwords</h1>
          <Link to="/generate">
            <Button>
              <span className="flex items-center">
                <PlusIcon />
                New Password
              </span>
            </Button>
          </Link>
        </div>

        {passwords.length === 0 ? (
          <Card className="text-center py-16">
            <div className="flex justify-center mb-4">
              <KeyEmptyIcon />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No passwords yet
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Generate and save your first secure password
            </p>
            <Link to="/generate">
              <Button>Generate Password</Button>
            </Link>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {passwords.map((password) => (
                <Card key={password.id} padding={false} className="group">
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1.5">
                          {password.title || 'Untitled Password'}
                        </h3>
                        <div className="space-y-1.5 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center flex-wrap gap-x-4 gap-y-1">
                            <span className="flex items-center space-x-1.5">
                              <CalendarIcon />
                              <span>Created: {new Date(password.created_at).toLocaleDateString()}</span>
                            </span>
                            {password.expires_at && (
                              <span className={`flex items-center space-x-1.5 ${isExpired(password.expires_at) ? 'text-red-500 dark:text-red-400' : ''}`}>
                                <ClockIcon />
                                <span>
                                  Expires: {new Date(password.expires_at).toLocaleDateString()}
                                  {isExpired(password.expires_at) && ' (Expired)'}
                                </span>
                              </span>
                            )}
                          </div>
                          {password.max_access_count && (
                            <div className="flex items-center space-x-1.5">
                              <EyeIcon />
                              <span>
                                Accesses: {password.current_access_count} / {password.max_access_count}
                                {isAccessLimitReached(password) && (
                                  <span className="ml-2 text-red-500 dark:text-red-400">(Limit reached)</span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <CopyButton text={password.shareable_link} />
                        <Link to={`/retrieve/${password.guid}`} target="_blank">
                          <Button variant="secondary" size="sm">
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(password.guid)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>

                    {/* Shareable Link */}
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                      <div className="flex items-center space-x-2">
                        <LinkIcon />
                        <input
                          type="text"
                          value={password.shareable_link}
                          readOnly
                          className="flex-1 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 font-mono text-gray-600 dark:text-gray-400"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-3 mt-8">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};
