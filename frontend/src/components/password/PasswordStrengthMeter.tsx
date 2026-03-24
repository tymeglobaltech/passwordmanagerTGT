import React from 'react';
import { PasswordStrength } from '@passwordpal/shared';
import { getStrengthBgColor, getStrengthWidth, getStrengthColor } from '../../utils/passwordGenerator';

interface PasswordStrengthMeterProps {
  strength: PasswordStrength;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ strength }) => {
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-500 dark:text-gray-400">Strength:</span>
        <span className={`text-sm font-semibold capitalize ${getStrengthColor(strength)}`}>
          {strength}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${getStrengthBgColor(strength)} ${getStrengthWidth(strength)}`}
        />
      </div>
    </div>
  );
};
