import React from 'react';
import styles from './Table.module.css';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> & {
  Head: React.FC<{ children: React.ReactNode; className?: string }>;
  Body: React.FC<{ children: React.ReactNode; className?: string }>;
  Row: React.FC<{ children?: React.ReactNode; className?: string; onClick?: () => void }>;
  HeaderCell: React.FC<{ children?: React.ReactNode; className?: string; align?: 'left' | 'center' | 'right' }>;
  Cell: React.FC<{ children?: React.ReactNode; className?: string; align?: 'left' | 'center' | 'right' }>;
} = ({ children, className = '' }) => {
  return (
    <div className={styles.tableWrapper}>
      <table className={`${styles.table} ${className}`}>{children}</table>
    </div>
  );
};

Table.Head = ({ children, className = '' }) => <thead className={`${styles.thead} ${className}`}>{children}</thead>;
Table.Body = ({ children, className = '' }) => <tbody className={className}>{children}</tbody>;
Table.Row = ({ children, className = '', onClick }) => (
  <tr className={`${styles.row} ${onClick ? styles.clickable : ''} ${className}`} onClick={onClick}>
    {children}
  </tr>
);
Table.HeaderCell = ({ children, className = '', align = 'left' }) => (
  <th className={`${styles.th} ${styles[align]} ${className}`}>{children}</th>
);
Table.Cell = ({ children, className = '', align = 'left' }) => (
  <td className={`${styles.td} ${styles[align]} ${className}`}>{children}</td>
);
