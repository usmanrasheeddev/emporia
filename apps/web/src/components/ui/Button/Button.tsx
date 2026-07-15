import React from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  type = 'button',
  icon,
  className,
  ...rest
}: ButtonProps) {
  const classNames = [
    styles.button,
    styles[variant],
    styles[size],
    disabled ? styles.disabled : '',
    fullWidth ? styles.fullWidth : '',
    loading ? styles.loading : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classNames}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      {...rest}
    >
      {loading && (
        <span className={styles.spinnerWrapper} aria-hidden="true">
          <span className={styles.spinner} />
        </span>
      )}
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </button>
  );
}
