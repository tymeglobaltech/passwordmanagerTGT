import { PasswordGeneratorOptions, PasswordStrength } from '@passwordpal/shared';

export const generatePassword = (options: PasswordGeneratorOptions): string => {
  let charset = '';

  if (options.lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (options.uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (options.numbers) charset += '0123456789';
  if (options.symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (charset.length === 0) {
    throw new Error('At least one character type must be selected');
  }

  let password = '';
  const randomValues = new Uint32Array(options.length);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < options.length; i++) {
    password += charset[randomValues[i] % charset.length];
  }

  return password;
};

export const calculatePasswordStrength = (
  password: string,
  options: PasswordGeneratorOptions
): PasswordStrength => {
  const length = password.length;
  let charsetSize = 0;

  if (options.lowercase) charsetSize += 26;
  if (options.uppercase) charsetSize += 26;
  if (options.numbers) charsetSize += 10;
  if (options.symbols) charsetSize += 32;

  // Calculate entropy bits
  const entropy = length * Math.log2(charsetSize);

  if (entropy >= 80) return 'strong';
  if (entropy >= 60) return 'good';
  if (entropy >= 40) return 'fair';
  return 'weak';
};

export const getStrengthColor = (strength: PasswordStrength): string => {
  switch (strength) {
    case 'weak':
      return 'text-red-600';
    case 'fair':
      return 'text-orange-600';
    case 'good':
      return 'text-yellow-600';
    case 'strong':
      return 'text-green-600';
  }
};

export const getStrengthBgColor = (strength: PasswordStrength): string => {
  switch (strength) {
    case 'weak':
      return 'bg-red-600';
    case 'fair':
      return 'bg-orange-600';
    case 'good':
      return 'bg-yellow-600';
    case 'strong':
      return 'bg-green-600';
  }
};

export const getStrengthWidth = (strength: PasswordStrength): string => {
  switch (strength) {
    case 'weak':
      return 'w-1/4';
    case 'fair':
      return 'w-2/4';
    case 'good':
      return 'w-3/4';
    case 'strong':
      return 'w-full';
  }
};
