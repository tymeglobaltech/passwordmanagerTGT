import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = true,
}) => {
  return (
    <div
      className={`
        bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md
        dark:border dark:border-gray-700/50
        transition-shadow duration-200
        ${padding ? 'p-6' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
