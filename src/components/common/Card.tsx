import type { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'outlined' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  clickable?: boolean;
}

export default function Card({
  children,
  variant = 'default',
  padding = 'md',
  clickable = false,
  className = '',
  ...props
}: CardProps) {
  const baseStyles = 'rounded-card transition-all duration-200';

  const variantStyles = {
    default: 'bg-white border border-border',
    outlined: 'bg-white border-2 border-border',
    flat: 'bg-surface',
  };

  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  };

  const clickableStyles = clickable
    ? 'cursor-pointer hover:border-primary hover:shadow-sm active:scale-[0.99]'
    : '';

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${clickableStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
