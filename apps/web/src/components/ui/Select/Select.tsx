import React, { useId } from 'react';
import styles from './Select.module.css';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  options: SelectOption[];
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export function Select({
  label,
  error,
  hint,
  required,
  options,
  placeholder,
  value,
  onChange,
  disabled,
  className,
  ...rest
}: SelectProps) {
  const generatedId = useId();
  const selectId = rest.id ?? generatedId;
  const errorId = error ? `${selectId}-error` : undefined;
  const hintId = hint && !error ? `${selectId}-hint` : undefined;

  const selectClassNames = [
    styles.select,
    error ? styles.selectError : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={selectId} className={styles.label}>
          {label}
          {required && <span className={styles.required} aria-hidden="true">*</span>}
        </label>
      )}
      <div className={styles.selectWrapper}>
        <select
          id={selectId}
          className={selectClassNames}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId ?? hintId}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className={styles.arrow} aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
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
