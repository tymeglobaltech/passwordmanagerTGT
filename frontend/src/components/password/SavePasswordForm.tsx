import React, { useState } from 'react';
import { api } from '../../services/api';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { CopyButton } from './CopyButton';
import toast from 'react-hot-toast';

interface SavePasswordFormProps {
  password: string;
  onSaved?: () => void;
}

export const SavePasswordForm: React.FC<SavePasswordFormProps> = ({
  password,
  onSaved,
}) => {
  const [loading, setLoading] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [shareableLink, setShareableLink] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    expires_at: '',
    max_access_count: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        password,
        title: formData.title || undefined,
        expires_at: formData.expires_at ? new Date(formData.expires_at) : undefined,
        max_access_count: formData.max_access_count ? parseInt(formData.max_access_count) : undefined,
      };

      const result = await api.savePassword(data);
      setShareableLink(result.shareable_link);
      setShowLinkModal(true);
      toast.success('Password saved successfully!');

      if (onSaved) {
        onSaved();
      }

      // Reset form
      setFormData({
        title: '',
        expires_at: '',
        max_access_count: '',
      });
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
            Your password has been saved. Share this link with anyone who needs access:
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

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              <strong>Important:</strong> Anyone with this link can access the password.
              Share it securely!
            </p>
          </div>

          <Button onClick={() => setShowLinkModal(false)} fullWidth>
            Done
          </Button>
        </div>
      </Modal>
    </>
  );
};
