// ═══════════════════════════════════════════════════════════════
// Checkout Success Page
// Displays final order confirmation, order identifier, and tracking CTA
// ═══════════════════════════════════════════════════════════════

'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import styles from './success.module.css';

function SuccessView() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id') || '';

  return (
    <Card padding="lg" className={styles.successCard}>
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
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>

      <h1 className={styles.title}>Order Placed Successfully!</h1>
      <p className={styles.subtitle}>
        Thank you for your purchase. We have received your order and are processing it.
      </p>

      {orderId && (
        <div className={styles.orderInfo}>
          <span className={styles.orderLabel}>Order ID:</span>
          <code className={styles.orderCode}>{orderId}</code>
        </div>
      )}

      <div className={styles.actions}>
        <Link href={`/dashboard/orders`}>
          <Button variant="primary">Track Order</Button>
        </Link>
        <Link href="/products">
          <Button variant="outline">Continue Shopping</Button>
        </Link>
      </div>
    </Card>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className={styles.pageWrapper}>
      <Suspense fallback={<div>Loading confirmation details...</div>}>
        <SuccessView />
      </Suspense>
    </div>
  );
}
