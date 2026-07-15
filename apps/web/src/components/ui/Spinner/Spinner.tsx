import React from 'react';
import styles from './Spinner.module.css';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className = '',
}) => {
  return (
    <div
      className={`${styles.spinner} ${styles[size]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className={styles.srOnly}>Loading...</span>
    </div>
  );
};
