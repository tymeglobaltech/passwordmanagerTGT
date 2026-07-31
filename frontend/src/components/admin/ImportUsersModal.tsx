import React, { useRef, useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { api } from '../../services/api';
import { BulkCreateUserRow, BulkCreateUserResult, UserRole, AuthProvider } from '@passwordpal/shared';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
}

type Step = 'upload' | 'preview' | 'results';

const ROLES: UserRole[] = ['admin', 'user', 'external'];
const PROVIDERS: AuthProvider[] = ['local', 'google', 'both'];

function parseCSV(text: string): BulkCreateUserRow[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length < 2) return [];

  // Detect delimiter: comma or semicolon or tab
  const firstLine = lines[0];
  const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';

  const splitLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = splitLine(lines[0]).map((h) => h.toLowerCase().replace(/^"|"$/g, ''));

  const findCol = (...names: string[]) => headers.findIndex((h) => names.includes(h));
  const usernameCol = findCol('username', 'user');
  const emailCol = findCol('email', 'e-mail', 'email address');
  const nameCol = findCol('full_name', 'fullname', 'full name', 'name', 'display name');
  const roleCol = findCol('role');
  const authCol = findCol('auth_provider', 'auth', 'provider', 'auth provider');
  const passwordCol = findCol('password', 'pass', 'pwd');

  if (usernameCol === -1 || emailCol === -1) return [];

  const clean = (v: string | undefined) => (v ?? '').replace(/^"|"$/g, '').trim();

  const rows: BulkCreateUserRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = splitLine(line);
    const username = clean(cols[usernameCol]);
    const email = clean(cols[emailCol]);
    if (!username || !email) continue;

    const full_name = nameCol !== -1 ? clean(cols[nameCol]) : '';
    const roleRaw = roleCol !== -1 ? clean(cols[roleCol]).toLowerCase() : '';
    const role = (ROLES as string[]).includes(roleRaw) ? (roleRaw as UserRole) : 'user';
    const authRaw = authCol !== -1 ? clean(cols[authCol]).toLowerCase() : '';
    const auth_provider = (PROVIDERS as string[]).includes(authRaw) ? (authRaw as AuthProvider) : 'local';
    const password = passwordCol !== -1 ? clean(cols[passwordCol]) : '';

    rows.push({
      username,
      email,
      full_name: full_name || undefined,
      role,
      auth_provider,
      password: password || undefined,
    });
  }
  return rows;
}

export const ImportUsersModal: React.FC<Props> = ({ isOpen, onClose, onImported }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [rows, setRows] = useState<BulkCreateUserRow[]>([]);
  const [results, setResults] = useState<BulkCreateUserResult[]>([]);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const reset = () => {
    setStep('upload');
    setRows([]);
    setResults([]);
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => { reset(); onClose(); };

  const parseFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        toast.error('No valid rows found. Make sure your CSV has "Username" and "Email" columns.');
        return;
      }
      setRows(parsed);
      setStep('preview');
    } catch {
      toast.error('Could not read the file.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const { results: importResults } = await api.bulkCreateUsers(rows);
      setResults(importResults);
      setStep('results');
      onImported();
      const succeeded = importResults.filter((r) => r.success).length;
      toast.success(`${succeeded} user${succeeded !== 1 ? 's' : ''} imported successfully`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const title =
    step === 'upload' ? 'Import Users' :
    step === 'preview' ? `Preview — ${rows.length} row${rows.length !== 1 ? 's' : ''}` :
    'Import Complete';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      {step === 'upload' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload a <strong>CSV file</strong> with <strong>Username</strong> and <strong>Email</strong>{' '}
            columns. Optional columns: <strong>Full Name</strong>, <strong>Role</strong>{' '}
            (admin/user/external), <strong>Auth Provider</strong> (local/google/both), and{' '}
            <strong>Password</strong> (required for internal local-auth users; external users get a
            setup email instead).
          </p>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-300 space-y-0.5">
            <p><strong>Google Sheets:</strong> File → Download → Comma Separated Values (.csv)</p>
            <p><strong>Excel:</strong> File → Save As → CSV (Comma delimited)</p>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-10 cursor-pointer transition-colors ${
              dragOver
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
            }`}
          >
            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Drag & drop or click to choose a file
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">.csv</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Review the rows below, then click <strong>Import</strong> to create these users.
          </p>
          <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-8">#</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Username</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Auth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="px-4 py-2 text-gray-400 dark:text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2 text-gray-900 dark:text-gray-100 max-w-[140px] truncate">{r.username}</td>
                    <td className="px-4 py-2 text-gray-500 dark:text-gray-400 max-w-[180px] truncate">{r.email}</td>
                    <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{r.role || 'user'}</td>
                    <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{r.auth_provider || 'local'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex space-x-2">
            <Button fullWidth loading={importing} onClick={handleImport}>
              Import {rows.length} user{rows.length !== 1 ? 's' : ''}
            </Button>
            <Button variant="secondary" fullWidth onClick={reset}>
              Back
            </Button>
          </div>
        </div>
      )}

      {step === 'results' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {results.filter((r) => r.success).length} of {results.length} users created.
          </p>
          <div className="max-h-80 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-8">#</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Username</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {results.map((r, i) => (
                  <tr key={i} className={r.success ? 'hover:bg-gray-50 dark:hover:bg-gray-900/30' : 'bg-red-50 dark:bg-red-900/10'}>
                    <td className="px-4 py-2 text-gray-400 dark:text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2 text-gray-900 dark:text-gray-100 max-w-[160px] truncate">{r.username || '—'}</td>
                    <td className="px-4 py-2">
                      {r.success ? (
                        <span className="text-xs text-green-600 dark:text-green-400">Created</span>
                      ) : (
                        <span className="text-xs text-red-500">{r.error || 'Failed'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button variant="secondary" fullWidth onClick={handleClose}>
            Close
          </Button>
        </div>
      )}
    </Modal>
  );
};
