import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface ParsedEntry {
  title: string;
  password: string;
}

interface ImportResult {
  index: number;
  title: string;
  success: boolean;
  shareable_link?: string;
  error?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
}

type Step = 'upload' | 'preview' | 'results';

export const ImportPasswordsModal: React.FC<Props> = ({ isOpen, onClose, onImported }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [entries, setEntries] = useState<ParsedEntry[]>([]);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const reset = () => {
    setStep('upload');
    setEntries([]);
    setResults([]);
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const parseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (rows.length === 0) {
          toast.error('The spreadsheet appears to be empty.');
          return;
        }

        // Normalise column names (case-insensitive, trim whitespace)
        const normalise = (obj: any): ParsedEntry => {
          const find = (...keys: string[]) => {
            for (const key of Object.keys(obj)) {
              if (keys.includes(key.toLowerCase().trim())) return String(obj[key] ?? '').trim();
            }
            return '';
          };
          return {
            title: find('title', 'name', 'label', 'description'),
            password: find('password', 'pass', 'pwd', 'secret'),
          };
        };

        const parsed = rows.map(normalise).filter((e) => e.password !== '');

        if (parsed.length === 0) {
          toast.error('No valid rows found. Make sure your sheet has "Title" and "Password" columns.');
          return;
        }

        setEntries(parsed);
        setStep('preview');
      } catch {
        toast.error('Could not read the file. Please use .xlsx or .csv format.');
      }
    };
    reader.readAsArrayBuffer(file);
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
      const { results: importResults } = await api.bulkSavePasswords(entries);
      setResults(importResults);
      setStep('results');
      onImported();
      const succeeded = importResults.filter((r) => r.success).length;
      toast.success(`${succeeded} password${succeeded !== 1 ? 's' : ''} imported successfully`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleCopyAllLinks = () => {
    const links = results
      .filter((r) => r.success && r.shareable_link)
      .map((r) => r.shareable_link!)
      .join('\n');
    navigator.clipboard.writeText(links);
    toast.success('All links copied to clipboard');
  };

  const title =
    step === 'upload' ? 'Import Passwords' :
    step === 'preview' ? `Preview — ${entries.length} row${entries.length !== 1 ? 's' : ''}` :
    'Import Complete';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      {step === 'upload' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload an Excel (<code>.xlsx</code>) or CSV file. The sheet must have a{' '}
            <strong>Title</strong> column and a <strong>Password</strong> column. Links will be
            generated in the same order as your rows — no expiry, no access limit.
          </p>

          {/* Drop zone */}
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
            <p className="text-xs text-gray-400 dark:text-gray-500">.xlsx or .csv</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Review the rows below, then click <strong>Import</strong> to generate links.
          </p>
          <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-8">#</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Title</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Password</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {entries.map((e, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="px-4 py-2 text-gray-400 dark:text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2 text-gray-900 dark:text-gray-100 max-w-[180px] truncate">{e.title || <span className="text-gray-400 italic">—</span>}</td>
                    <td className="px-4 py-2 font-mono text-gray-500 dark:text-gray-400">{'•'.repeat(Math.min(e.password.length, 10))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex space-x-2">
            <Button fullWidth loading={importing} onClick={handleImport}>
              Import {entries.length} password{entries.length !== 1 ? 's' : ''}
            </Button>
            <Button variant="secondary" fullWidth onClick={() => { reset(); }}>
              Back
            </Button>
          </div>
        </div>
      )}

      {step === 'results' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {results.filter((r) => r.success).length} of {results.length} imported successfully.
              Links are in the same order as your spreadsheet.
            </p>
            <Button size="sm" onClick={handleCopyAllLinks}>
              Copy all links
            </Button>
          </div>
          <div className="max-h-80 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-8">#</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Title</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {results.map((r, i) => (
                  <tr key={i} className={r.success ? 'hover:bg-gray-50 dark:hover:bg-gray-900/30' : 'bg-red-50 dark:bg-red-900/10'}>
                    <td className="px-4 py-2 text-gray-400 dark:text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2 text-gray-900 dark:text-gray-100 max-w-[140px] truncate">{r.title || <span className="text-gray-400 italic">—</span>}</td>
                    <td className="px-4 py-2">
                      {r.success && r.shareable_link ? (
                        <span className="font-mono text-xs text-gray-600 dark:text-gray-400 break-all">{r.shareable_link}</span>
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
