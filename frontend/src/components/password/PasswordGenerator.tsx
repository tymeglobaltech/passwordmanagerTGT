import React, { useState, useEffect } from 'react';
import { PasswordGeneratorOptions, PasswordStrength } from '@passwordpal/shared';
import { generatePassword, calculatePasswordStrength } from '../../utils/passwordGenerator';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { CopyButton } from './CopyButton';

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

interface PasswordGeneratorProps {
  onPasswordGenerated?: (password: string) => void;
}

export const PasswordGenerator: React.FC<PasswordGeneratorProps> = ({
  onPasswordGenerated,
}) => {
  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState<PasswordStrength>('weak');
  const [options, setOptions] = useState<PasswordGeneratorOptions>({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });

  const handleGenerate = () => {
    try {
      const newPassword = generatePassword(options);
      const newStrength = calculatePasswordStrength(newPassword, options);

      setPassword(newPassword);
      setStrength(newStrength);

      if (onPasswordGenerated) {
        onPasswordGenerated(newPassword);
      }
    } catch (error) {
      console.error('Failed to generate password:', error);
    }
  };

  useEffect(() => {
    handleGenerate();
  }, [options]);

  const handleOptionChange = (key: keyof PasswordGeneratorOptions, value: any) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const atLeastOneOptionSelected =
    options.uppercase || options.lowercase || options.numbers || options.symbols;

  return (
    <div className="space-y-6">
      {/* Generated Password Display */}
      <div className="space-y-2">
        <input
          type="text"
          value={password}
          readOnly
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <div className="flex items-center space-x-2">
          <CopyButton text={password} />
          <button
            onClick={handleGenerate}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-sm font-medium rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:active:bg-gray-500 dark:text-gray-200 transition-colors"
          >
            <RefreshIcon />
            <span>Regenerate</span>
          </button>
        </div>
        <PasswordStrengthMeter strength={strength} />
      </div>

      {/* Options */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Options</h3>

        {/* Length Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Length
            </label>
            <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
              {options.length}
            </span>
          </div>
          <input
            type="range"
            min="8"
            max="128"
            value={options.length}
            onChange={(e) => handleOptionChange('length', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>8</span>
            <span>128</span>
          </div>
        </div>

        {/* Character Type Checkboxes */}
        <div className="space-y-2">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.uppercase}
              onChange={(e) => handleOptionChange('uppercase', e.target.checked)}
              disabled={options.uppercase && !options.lowercase && !options.numbers && !options.symbols}
              className="w-5 h-5 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 dark:bg-gray-800"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Uppercase Letters (A-Z)
            </span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.lowercase}
              onChange={(e) => handleOptionChange('lowercase', e.target.checked)}
              disabled={!options.uppercase && options.lowercase && !options.numbers && !options.symbols}
              className="w-5 h-5 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 dark:bg-gray-800"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Lowercase Letters (a-z)
            </span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.numbers}
              onChange={(e) => handleOptionChange('numbers', e.target.checked)}
              disabled={!options.uppercase && !options.lowercase && options.numbers && !options.symbols}
              className="w-5 h-5 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 dark:bg-gray-800"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Numbers (0-9)
            </span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.symbols}
              onChange={(e) => handleOptionChange('symbols', e.target.checked)}
              disabled={!options.uppercase && !options.lowercase && !options.numbers && options.symbols}
              className="w-5 h-5 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 dark:bg-gray-800"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Symbols (!@#$%^&*)
            </span>
          </label>
        </div>

        {!atLeastOneOptionSelected && (
          <p className="text-sm text-red-600 dark:text-red-400">
            At least one character type must be selected
          </p>
        )}
      </div>
    </div>
  );
};
