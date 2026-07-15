import React from 'react';
import styles from './Alert.module.css';

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  className = '',
}) => {
  return (
    <div className={`${styles.alert} ${styles[variant]} ${className}`} role="alert">
      <div className={styles.content}>
        {title && <h4 className={styles.title}>{title}</h4>}
        <div className={styles.body}>{children}</div>
      </div>
      {dismissible && onDismiss && (
        <button className={styles.closeButton} onClick={onDismiss} aria-label="Dismiss alert">
          &times;
        </button>
      )}
    </div>
  );
};
