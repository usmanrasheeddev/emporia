import React from 'react';
import styles from './Badge.module.css';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
}: BadgeProps) {
  const classNames = [
    styles.badge,
    styles[variant],
    styles[size],
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return <span className={classNames}>{children}</span>;
}
