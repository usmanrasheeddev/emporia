import React from 'react';
import styles from './Card.module.css';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: CardPadding;
}

const paddingMap: Record<CardPadding, string> = {
  none: styles.paddingNone || '',
  sm: styles.paddingSm || '',
  md: styles.paddingMd || '',
  lg: styles.paddingLg || '',
};

function CardRoot({ children, className, padding = 'none' }: CardProps) {
  const classNames = [styles.card, paddingMap[padding], className ?? '']
    .filter(Boolean)
    .join(' ');

  return <div className={classNames}>{children}</div>;
}

interface CardSectionProps {
  children: React.ReactNode;
  className?: string;
}

function CardHeader({ children, className }: CardSectionProps) {
  return (
    <div className={[styles.header, className ?? ''].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}

function CardBody({ children, className }: CardSectionProps) {
  return (
    <div className={[styles.body, className ?? ''].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}

function CardFooter({ children, className }: CardSectionProps) {
  return (
    <div className={[styles.footer, className ?? ''].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
});
