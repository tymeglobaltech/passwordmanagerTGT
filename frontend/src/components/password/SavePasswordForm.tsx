import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { CopyButton } from './CopyButton';
import toast from 'react-hot-toast';

interface AvailableUser {
  id: string;
  username: string;
  email: string;
  full_name?: string;
}

interface SavePasswordFormProps {
  password: string;
  onSaved?: () => void;
}

const LockIcon = () => (
  <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

export const SavePasswordForm: React.FC<SavePasswordFormProps> = ({
  password,
  onSaved,
}) => {
  const [loading, setLoading] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [shareableLink, setShareableLink] = useState('');
  const [isSecured, setIsSecured] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [savedIsSecured, setSavedIsSecured] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    expires_at: '',
    max_access_count: '',
  });

  useEffect(() => {
    if (isSecured && availableUsers.length === 0) {
      setLoadingUsers(true);
      api.getAvailableUsers()
        .then(setAvailableUsers)
        .catch(() => toast.error('Failed to load users'))
        .finally(() => setLoadingUsers(false));
    }
    if (!isSecured) {
      setSelectedUserIds([]);
      setUserSearch('');
    }
  }, [isSecured]);

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSecured && selectedUserIds.length === 0) {
      toast.error('Please select at least one user to secure this password for');
      return;
    }

    setLoading(true);

    try {
      const data = {
        password,
        title: formData.title || undefined,
        expires_at: formData.expires_at ? new Date(formData.expires_at) : undefined,
        max_access_count: formData.max_access_count ? parseInt(formData.max_access_count) : undefined,
        secured_user_ids: isSecured ? selectedUserIds : undefined,
      };

      const result = await api.savePassword(data);
      setShareableLink(result.shareable_link);
      setSavedIsSecured(isSecured);
      setShowLinkModal(true);
      toast.success('Password saved successfully!');

      if (onSaved) {
        onSaved();
      }

      // Reset form
      setFormData({ title: '', expires_at: '', max_access_count: '' });
      setIsSecured(false);
      setSelectedUserIds([]);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save password');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title (Optional)"
          placeholder="e.g., My Netflix Password"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
        />

        <Input
          label="Expiration Date (Optional)"
          type="datetime-local"
          value={formData.expires_at}
          onChange={(e) => handleChange('expires_at', e.target.value)}
          helperText="Password will become inaccessible after this date"
        />

        <Input
          label="Max Access Count (Optional)"
          type="number"
          min="1"
          placeholder="e.g., 5"
          value={formData.max_access_count}
          onChange={(e) => handleChange('max_access_count', e.target.value)}
          helperText="Password will become inaccessible after this many views"
        />

        {/* Secure my password toggle */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsSecured((v) => !v)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <LockIcon />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Secure my password</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Restrict access to specific users only</p>
              </div>
            </div>
            <div
              className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                isSecured ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${
                  isSecured ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
          </button>

          {isSecured && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wide">
                Select who can view this password
              </p>
              {loadingUsers ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-amber-500 border-t-transparent"></div>
                </div>
              ) : availableUsers.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-3 text-center">No other users available</p>
              ) : (
                <>
                  <div className="relative mb-2">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search users…"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  {(() => {
                    const q = userSearch.trim().toLowerCase();
                    const filtered = q
                      ? availableUsers.filter(
                          (u) =>
                            u.username.toLowerCase().includes(q) ||
                            (u.full_name || '').toLowerCase().includes(q) ||
                            u.email.toLowerCase().includes(q)
                        )
                      : availableUsers;
                    return filtered.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 py-3 text-center">No users match your search</p>
                    ) : (
                      <div className="max-h-48 overflow-y-auto space-y-1 -mx-1">
                        {filtered.map((user) => {
                          const selected = selectedUserIds.includes(user.id);
                          return (
                            <label
                              key={user.id}
                              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                                selected
                                  ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => toggleUser(user.id)}
                                className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {user.full_name || user.username}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    );
                  })()}
                </>
              )}
              {selectedUserIds.length > 0 && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                  {selectedUserIds.length} user{selectedUserIds.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          )}
        </div>

        <Button
          type="submit"
          fullWidth
          loading={loading}
          disabled={!password}
        >
          Save Password & Get Link
        </Button>
      </form>

      {/* Shareable Link Modal */}
      <Modal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        title="Password Saved!"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {savedIsSecured
              ? 'Your password has been saved and secured. Only the selected users can access it via this link.'
              : 'Your password has been saved. Share this link with anyone who needs access:'}
          </p>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={shareableLink}
              readOnly
              className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono text-gray-700 dark:text-gray-300 focus:outline-none"
            />
            <CopyButton text={shareableLink} />
          </div>

          {savedIsSecured ? (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3 flex items-start space-x-2">
              <LockIcon />
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <strong>Secured:</strong> Only the users you selected can view this password. Others will be denied access.
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <strong>Important:</strong> Anyone with this link can access the password.
                Share it securely!
              </p>
            </div>
          )}

          <Button onClick={() => setShowLinkModal(false)} fullWidth>
            Done
          </Button>
        </div>
      </Modal>
    </>
  );
};
