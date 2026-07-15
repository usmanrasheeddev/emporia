import React from 'react';
import styles from './Avatar.module.css';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  fallback: string;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'User avatar',
  size = 'md',
  fallback,
  className = '',
}) => {
  const [hasError, setHasError] = React.useState(false);

  return (
    <div className={`${styles.avatar} ${styles[size]} ${className}`}>
      {src && !hasError ? (
        <img
          src={src}
          alt={alt}
          className={styles.image}
          onError={() => setHasError(true)}
        />
      ) : (
        <div className={styles.fallback} aria-label={alt}>
          {fallback.toUpperCase()}
        </div>
      )}
    </div>
  );
};
