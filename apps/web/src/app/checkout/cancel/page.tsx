// ═══════════════════════════════════════════════════════════════
// Checkout Cancel Page
// Displays cancel alert notification, return hooks, and error messaging
// ═══════════════════════════════════════════════════════════════

'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import styles from './cancel.module.css';

function CancelView() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id') || '';

  return (
    <Card padding="lg" className={styles.cancelCard}>
      <div className={styles.iconWrapper}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="48"
          height="48"
          className={styles.icon}
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      </div>

      <h1 className={styles.title}>Payment Cancelled</h1>
      <p className={styles.subtitle}>
        The transaction was cancelled or failed to complete. Don&apos;t worry, no funds were deducted.
      </p>

      {orderId && (
        <div className={styles.orderInfo}>
          <span className={styles.orderLabel}>Order ID:</span>
          <code className={styles.orderCode}>{orderId}</code>
        </div>
      )}

      <div className={styles.actions}>
        <Link href={`/checkout`}>
          <Button variant="primary">Retry Checkout</Button>
        </Link>
        <Link href="/cart">
          <Button variant="outline">Back to Cart</Button>
        </Link>
      </div>
    </Card>
  );
}

export default function CheckoutCancelPage() {
  return (
    <div className={styles.pageWrapper}>
      <Suspense fallback={<div>Loading cancellation summary...</div>}>
        <CancelView />
      </Suspense>
    </div>
  );
}
