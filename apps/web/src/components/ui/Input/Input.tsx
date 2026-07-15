import React, { useId } from 'react';
import styles from './Input.module.css';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  icon?: React.ReactNode;
  id?: string;
}

export function Input({
  label,
  error,
  hint,
  required,
  disabled,
  icon,
  id: externalId,
  className,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const inputId = externalId ?? generatedId;
  const errorId = error ? `${inputId}-error` : undefined;
  const hintId = hint && !error ? `${inputId}-hint` : undefined;

  const inputClassNames = [
    styles.input,
    icon ? styles.hasIcon : '',
    error ? styles.inputError : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {required && <span className={styles.required} aria-hidden="true">*</span>}
        </label>
      )}
      <div className={styles.inputWrapper}>
        {icon && <span className={styles.iconWrapper} aria-hidden="true">{icon}</span>}
        <input
          id={inputId}
          className={inputClassNames}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId ?? hintId}
          {...rest}
        />
      </div>
      {error && (
        <span id={errorId} className={styles.error} role="alert">
          {error}
        </span>
      )}
      {hint && !error && (
        <span id={hintId} className={styles.hint}>
          {hint}
        </span>
      )}
    </div>
  );
}
