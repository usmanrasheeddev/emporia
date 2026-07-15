import React, { useId } from 'react';
import styles from './Textarea.module.css';

interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  id?: string;
}

export function Textarea({
  label,
  error,
  hint,
  required,
  disabled,
  rows = 4,
  id: externalId,
  className,
  ...rest
}: TextareaProps) {
  const generatedId = useId();
  const textareaId = externalId ?? generatedId;
  const errorId = error ? `${textareaId}-error` : undefined;
  const hintId = hint && !error ? `${textareaId}-hint` : undefined;

  const textareaClassNames = [
    styles.textarea,
    error ? styles.textareaError : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={textareaId} className={styles.label}>
          {label}
          {required && <span className={styles.required} aria-hidden="true">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        className={textareaClassNames}
        disabled={disabled}
        required={required}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId ?? hintId}
        {...rest}
      />
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
