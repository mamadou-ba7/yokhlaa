import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  accent?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  sm: 'p-5',
  md: 'p-7',
  lg: 'p-9',
};

export function Card({
  children,
  accent = false,
  padding = 'md',
  className = '',
  ...rest
}: CardProps) {
  return (
    <div
      className={`
        relative rounded-2xl bg-card border transition-colors duration-300
        ${accent ? 'border-accent/30' : 'border-line hover:border-white/15'}
        ${paddingClasses[padding]}
        ${className}
      `}
      {...rest}
    >
      {children}
    </div>
  );
}
