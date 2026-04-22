import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { api } from '../services/api';
import { User, CreateUserDto, UpdateUserDto, AdminStats, AccessLog, AuthProvider } from '@passwordpal/shared';
import toast from 'react-hot-toast';

const UsersIcon = () => (
  <svg className="w-7 h-7 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const KeyIcon = () => (
  <svg className="w-7 h-7 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-7 h-7 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-7 h-7 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'stats'>('stats');

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Admin Panel</h1>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-full p-1 mb-8 max-w-md">
          {(['stats', 'users', 'logs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-full transition-all duration-200 capitalize ${
                activeTab === tab
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab === 'stats' ? 'Statistics' : tab === 'users' ? 'Users' : 'Logs'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'stats' && <StatsTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'logs' && <LogsTab />}
      </div>
    </Layout>
  );
};

const StatsTab: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await api.getStatistics();
      setStats(data);
    } catch (error) {
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <UsersIcon />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.total_users}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Users</div>
          <div className="text-xs text-green-600 dark:text-green-400 mt-1">
            {stats?.active_users} active
          </div>
        </div>
      </Card>

      <Card>
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <KeyIcon />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.total_passwords}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Passwords</div>
          <div className="text-xs text-green-600 dark:text-green-400 mt-1">
            {stats?.active_passwords} active
          </div>
        </div>
      </Card>

      <Card>
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <EyeIcon />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.total_accesses}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Accesses</div>
          <div className="text-xs text-primary-600 dark:text-primary-400 mt-1">
            {stats?.accesses_today} today
          </div>
        </div>
      </Card>

      <Card>
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <ChartIcon />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.accesses_this_week}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">This Week</div>
          <div className="text-xs text-primary-600 dark:text-primary-400 mt-1">
            {stats?.accesses_this_month} this month
          </div>
        </div>
      </Card>
    </div>
  );
};

const UsersTab: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editFormData, setEditFormData] = useState<UpdateUserDto>({});
  const [formData, setFormData] = useState<CreateUserDto>({
    username: '',
    full_name: '',
    email: '',
    password: '',
    role: 'user',
    auth_provider: 'google',
  });

  const filteredUsers = searchQuery.trim()
    ? users.filter((u) => {
        const q = searchQuery.toLowerCase();
        return (
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.full_name?.toLowerCase().includes(q) ?? false)
        );
      })
    : users;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.getUsers(1, 1000);
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      const payload = { ...formData };
      if (!payload.password) delete payload.password;
      await api.createUser(payload);
      toast.success('User created successfully');
      setShowCreateModal(false);
      setFormData({ username: '', full_name: '', email: '', password: '', role: 'user', auth_provider: 'local' });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create user');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditFormData({ username: user.username, full_name: user.full_name || '', email: user.email, role: user.role, is_active: user.is_active });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditLoading(true);
    try {
      await api.updateUser(editingUser.id, editFormData);
      toast.success('User updated successfully');
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update user');
    } finally {
      setEditLoading(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await api.updateUser(user.id, { is_active: !user.is_active });
      toast.success(`User ${user.is_active ? 'deactivated' : 'activated'} successfully`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      return;
    }

    try {
      await api.deleteUser(user.id);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <Button onClick={() => setShowCreateModal(true)}>
          + Create User
        </Button>
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by username, email, or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-9 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {searchQuery.trim() ? `${filteredUsers.length} of ${users.length}` : `${users.length}`} user{users.length !== 1 ? 's' : ''}
        </span>
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Auth
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No users match your search.
                  </td>
                </tr>
              )}
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {user.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                          : user.role === 'external'
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                          : 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.auth_provider === 'google'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : user.auth_provider === 'both'
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {user.auth_provider || 'local'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.is_active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.last_login
                      ? new Date(user.last_login).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleToggleActive(user)}
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteUser(user)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit User Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`Edit User: ${editingUser?.username}`}
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <Input
            label="Full Name"
            value={editFormData.full_name || ''}
            onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
          />
          <Input
            label="Username"
            value={editFormData.username || ''}
            onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={editFormData.email || ''}
            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Role
            </label>
            <select
              value={editFormData.role || 'user'}
              onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as any })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm transition-colors"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="external">External</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Status
            </label>
            <select
              value={editFormData.is_active ? 'active' : 'inactive'}
              onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.value === 'active' })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm transition-colors"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <Button type="submit" fullWidth loading={editLoading}>
              Save Changes
            </Button>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setEditingUser(null)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New User"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {(() => {
            const isExternal =
              formData.email.length > 0 &&
              !formData.email.toLowerCase().endsWith('@tymeglobal.com') &&
              formData.auth_provider !== 'google';
            return (
              <>
                <Input
                  label="Full Name"
                  value={formData.full_name || ''}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
                <Input
                  label="Username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Auth Method
                  </label>
                  <select
                    value={formData.auth_provider || 'local'}
                    onChange={(e) => setFormData({ ...formData, auth_provider: e.target.value as AuthProvider, password: e.target.value === 'google' ? '' : formData.password })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm transition-colors"
                  >
                    <option value="local">Local (Username & Password)</option>
                    <option value="google">Google SSO Only</option>
                  </select>
                </div>
                {formData.auth_provider !== 'google' && isExternal && (
                  <div className="flex items-start space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-700 dark:text-blue-300">
                    <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>A password setup email will be sent to this user. No password is required now.</span>
                  </div>
                )}
                {formData.auth_provider !== 'google' && !isExternal && (
                  <Input
                    label="Password"
                    type="password"
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    helperText="Min 8 chars, must include uppercase, lowercase, number, and symbol"
                    required
                  />
                )}
              </>
            );
          })()}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm transition-colors"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="external">External</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <Button type="submit" fullWidth loading={createLoading}>
              Create User
            </Button>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

const LogsTab: React.FC = () => {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    try {
      const response = await api.getAccessLogs({ page, limit: 50 });
      setLogs(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      toast.error('Failed to load access logs');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Password
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        log.access_type === 'view'
                          ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                          : log.access_type === 'create'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      }`}
                    >
                      {log.access_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {log.username || 'Anonymous'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {log.password_title || 'Untitled'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                    {log.ip_address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {log.success ? <CheckIcon /> : <XIcon />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-3 mt-6">
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
  );
};
