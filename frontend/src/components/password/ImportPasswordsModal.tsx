import React, { useRef, useState } from 'react';
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

function parseCSV(text: string): ParsedEntry[] {
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
  const titleCol = findCol('title', 'name', 'label', 'description', 'account');
  const passwordCol = findCol('password', 'pass', 'pwd', 'secret');

  if (passwordCol === -1) return [];

  const entries: ParsedEntry[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = splitLine(line);
    const password = cols[passwordCol]?.replace(/^"|"$/g, '') ?? '';
    if (!password) continue;
    const title = titleCol !== -1 ? (cols[titleCol]?.replace(/^"|"$/g, '') ?? '') : '';
    entries.push({ title, password });
  }
  return entries;
}

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

  const handleClose = () => { reset(); onClose(); };

  const parseFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        toast.error('No valid rows found. Make sure your CSV has "Title" and "Password" columns.');
        return;
      }
      setEntries(parsed);
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
            Upload a <strong>CSV file</strong> with a <strong>Title</strong> column and a{' '}
            <strong>Password</strong> column. Links are generated in the same row order with no
            expiry or access limit.
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
            <Button variant="secondary" fullWidth onClick={reset}>
              Back
            </Button>
          </div>
        </div>
      )}

      {step === 'results' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {results.filter((r) => r.success).length} of {results.length} imported. Links are in
              the same order as your spreadsheet.
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
