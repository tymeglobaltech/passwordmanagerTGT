import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { CopyButton } from '../components/password/CopyButton';
import { ImportPasswordsModal } from '../components/password/ImportPasswordsModal';
import { api } from '../services/api';
import { PasswordListItem } from '@passwordpal/shared';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const LockIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const EditSmallIcon = () => (
  <svg className="w-4 h-4 text-blue-400 dark:text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

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

const EyeOffIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
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

const PencilIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

interface AvailableUser {
  id: string;
  username: string;
  email: string;
  full_name?: string;
}

interface EditModalProps {
  password: PasswordListItem;
  onClose: () => void;
  onSaved: (updated: PasswordListItem) => void;
}

const EditModal: React.FC<EditModalProps> = ({ password, onClose, onSaved }) => {
  const [title, setTitle] = useState(password.title || '');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const [isSecured, setIsSecured] = useState(password.is_secured);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // On open, load current viewers if already secured
  useEffect(() => {
    if (password.is_secured) {
      setLoadingUsers(true);
      Promise.all([
        api.getPasswordViewers(password.guid),
        api.getAvailableUsers(),
      ]).then(([viewers, users]) => {
        setSelectedUserIds(viewers.map((v) => v.id));
        setAvailableUsers(users);
      }).catch(() => toast.error('Failed to load viewers')).finally(() => setLoadingUsers(false));
    }
  }, []);

  const handleSecureToggle = async () => {
    const next = !isSecured;
    setIsSecured(next);
    if (next && availableUsers.length === 0) {
      setLoadingUsers(true);
      api.getAvailableUsers()
        .then(setAvailableUsers)
        .catch(() => toast.error('Failed to load users'))
        .finally(() => setLoadingUsers(false));
    }
    if (!next) {
      setSelectedUserIds([]);
      setUserSearch('');
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSave = async () => {
    if (isSecured && selectedUserIds.length === 0) {
      toast.error('Select at least one user, or turn off Secure my password');
      return;
    }
    setSaving(true);
    try {
      const payload: { title?: string; password?: string; is_secured: boolean; secured_user_ids: string[] } = {
        title: title || undefined,
        is_secured: isSecured,
        secured_user_ids: isSecured ? selectedUserIds : [],
      };
      if (newPassword) payload.password = newPassword;
      const updated = await api.updatePassword(password.guid, payload);
      toast.success('Password updated');
      onSaved(updated);
    } catch {
      toast.error('Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = (() => {
    const q = userSearch.trim().toLowerCase();
    return q
      ? availableUsers.filter(
          (u) => (u.full_name || u.username).toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
        )
      : availableUsers;
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Password</h2>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled Password"
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            New Password
            <span className="ml-1 text-xs font-normal text-gray-400 dark:text-gray-500">(leave blank to keep current)</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password value…"
              className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        {/* Security settings */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            type="button"
            onClick={handleSecureToggle}
            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <LockIcon />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Secure my password</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Restrict access to specific users only</p>
              </div>
            </div>
            <div className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${isSecured ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${isSecured ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </button>

          {isSecured && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wide">
                Who can view this password
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
                  {filteredUsers.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-3 text-center">No users match your search</p>
                  ) : (
                    <div className="max-h-44 overflow-y-auto space-y-1 -mx-1">
                      {filteredUsers.map((u) => {
                        const selected = selectedUserIds.includes(u.id);
                        return (
                          <label
                            key={u.id}
                            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                              selected
                                ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleUser(u.id)}
                              className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {u.full_name || u.username}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                  {selectedUserIds.length > 0 && (
                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                      {selectedUserIds.length} user{selectedUserIds.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          The shareable link will not change.
        </p>

        <div className="flex items-center justify-end space-x-3 pt-1">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};

const isModified = (password: PasswordListItem) => {
  const created = new Date(password.created_at).getTime();
  const updated = new Date(password.updated_at).getTime();
  return updated - created > 2000;
};

export const DashboardPage: React.FC = () => {
  const { isExternal, user } = useAuth();
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState<PasswordListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [retrieveUrl, setRetrieveUrl] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPassword, setEditingPassword] = useState<PasswordListItem | null>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchPasswords();
  }, [page, searchTerm]);

  const fetchPasswords = async () => {
    try {
      setLoading(true);
      const response = await api.listPasswords(page, 20, searchTerm);
      setPasswords(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      toast.error('Failed to load passwords');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setPage(1);
      setSearchTerm(value);
    }, 300);
  };

  const handleDelete = async (guid: string) => {
    if (!confirm('Are you sure you want to delete this password?')) return;
    try {
      await api.deletePassword(guid);
      toast.success('Password deleted successfully');
      fetchPasswords();
    } catch (error) {
      toast.error('Failed to delete password');
    }
  };

  const handleEditSaved = (updated: PasswordListItem) => {
    setPasswords((prev) => prev.map((p) => (p.guid === updated.guid ? { ...p, ...updated } : p)));
    setEditingPassword(null);
  };

  const isExpired = (expiresAt?: Date) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const isAccessLimitReached = (password: PasswordListItem) => {
    if (!password.max_access_count) return false;
    return password.current_access_count >= password.max_access_count;
  };

  const handleRetrieveUrl = () => {
    const trimmed = retrieveUrl.trim();
    const match = trimmed.match(/retrieve\/([0-9a-f-]{36})/i) || trimmed.match(/^([0-9a-f-]{36})$/i);
    if (!match) {
      toast.error('Please enter a valid password link or GUID');
      return;
    }
    navigate(`/retrieve/${match[1]}`);
  };

  if (isExternal) {
    return (
      <Layout>
        <div className="max-w-xl mx-auto mt-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Retrieve a Password</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Paste a password link shared with you to view its contents.
          </p>
          <Card>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Paste password link or GUID here..."
                value={retrieveUrl}
                onChange={(e) => setRetrieveUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRetrieveUrl()}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm transition-colors"
              />
              <Button fullWidth onClick={handleRetrieveUrl}>
                Retrieve Password
              </Button>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Passwords</h1>
          <div className="flex items-center space-x-2">
            <Button variant="secondary" onClick={() => setShowImport(true)}>
              Import
            </Button>
            <Link to="/generate">
              <Button>
                <span className="flex items-center">
                  <PlusIcon />
                  New Password
                </span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-6 relative">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search by title…"
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm transition-colors"
          />
        </div>

        <ImportPasswordsModal
          isOpen={showImport}
          onClose={() => setShowImport(false)}
          onImported={fetchPasswords}
        />

        {editingPassword && (
          <EditModal
            password={editingPassword}
            onClose={() => setEditingPassword(null)}
            onSaved={handleEditSaved}
          />
        )}

        {passwords.length === 0 ? (
          <Card className="text-center py-16">
            <div className="flex justify-center mb-4">
              <KeyEmptyIcon />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No passwords match your search' : 'No passwords yet'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm ? 'Try a different search term' : 'Generate and save your first secure password'}
            </p>
            {!searchTerm && (
              <Link to="/generate">
                <Button>Generate Password</Button>
              </Link>
            )}
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {passwords.map((password) => {
                const isOwner = password.created_by === user?.id;
                return (
                <Card key={password.id} padding={false} className="group">
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1.5">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {password.title || 'Untitled Password'}
                          </h3>
                          {password.is_secured && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                              <LockIcon />
                              <span>Secured</span>
                            </span>
                          )}
                          {!isOwner && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
                              Shared with you
                            </span>
                          )}
                        </div>
                        <div className="space-y-1.5 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center flex-wrap gap-x-4 gap-y-1">
                            <span className="flex items-center space-x-1.5">
                              <CalendarIcon />
                              <span>Created: {new Date(password.created_at).toLocaleDateString()}</span>
                            </span>
                            {isModified(password) && (
                              <span className="flex items-center space-x-1.5 text-blue-500 dark:text-blue-400">
                                <EditSmallIcon />
                                <span>Modified: {new Date(password.updated_at).toLocaleDateString()}</span>
                              </span>
                            )}
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
                        {isOwner && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setEditingPassword(password)}
                            title="Edit"
                          >
                            <PencilIcon />
                          </Button>
                        )}
                        <Link to={`/retrieve/${password.guid}`} target="_blank">
                          <Button variant="secondary" size="sm">
                            View
                          </Button>
                        </Link>
                        {isOwner && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(password.guid)}
                          >
                            Delete
                          </Button>
                        )}
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
                );
              })}
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
