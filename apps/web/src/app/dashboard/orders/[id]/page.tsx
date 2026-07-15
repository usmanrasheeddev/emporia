// ═══════════════════════════════════════════════════════════════
// Order Details Page
// Displays items, delivery status history, payment summary, and cancellation
// ═══════════════════════════════════════════════════════════════

'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Badge } from '@/components/ui/Badge/Badge';
import { Alert } from '@/components/ui/Alert/Alert';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { Table } from '@/components/ui/Table/Table';
import styles from './order-details.module.css';

export default function OrderDetailsPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Fetch order details
  const { data: response, isLoading } = useQuery({
    queryKey: ['order-details', id],
    queryFn: () => api.get<any>(`/orders/${id}`),
    enabled: !!id,
  });

  const order = response?.data;

  // Order cancellation mutation
  const cancelMutation = useMutation({
    mutationFn: () =>
      api.patch(`/orders/${id}/status`, {
        status: 'CANCELLED',
        note: 'Cancelled by customer from account dashboard',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-details', id] });
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to cancel order. Please contact support.');
    },
  });

  if (isLoading) {
    return (
      <div className={styles.loaderWrapper}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <Alert variant="error" title="Order Not Found">
        The requested order could not be located in your account profile.
      </Alert>
    );
  }

  const items = order.items || [];
  const history = order.statusHistory || [];
  const address = order.address || {};
  const isCancellable = order.status === 'PENDING';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Order #{order.orderNumber}</h1>
          <p className={styles.subtitle}>
            Placed on {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        {isCancellable && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (window.confirm('Are you sure you want to cancel this order?')) {
                cancelMutation.mutate();
              }
            }}
            loading={cancelMutation.isPending}
          >
            Cancel Order
          </Button>
        )}
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className={styles.detailsGrid}>
        {/* Order Details Column */}
        <div className={styles.leftColumn}>
          {/* Order Items Card */}
          <Card padding="md" className={styles.card}>
            <h2 className={styles.cardTitle}>Items Ordered</h2>
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.HeaderCell>Product</Table.HeaderCell>
                  <Table.HeaderCell>SKU</Table.HeaderCell>
                  <Table.HeaderCell align="center">Qty</Table.HeaderCell>
                  <Table.HeaderCell align="right">Price</Table.HeaderCell>
                  <Table.HeaderCell align="right">Total</Table.HeaderCell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {items.map((item: any) => (
                  <Table.Row key={item.id}>
                    <Table.Cell>
                      <span className={styles.itemName}>{item.name}</span>
                      {item.variant?.name && (
                        <span className={styles.itemVariant}>{item.variant.name}</span>
                      )}
                    </Table.Cell>
                    <Table.Cell>{item.sku}</Table.Cell>
                    <Table.Cell align="center">{item.quantity}</Table.Cell>
                    <Table.Cell align="right">${Number(item.price).toFixed(2)}</Table.Cell>
                    <Table.Cell align="right">${Number(item.total).toFixed(2)}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </Card>

          {/* Delivery tracking status history log */}
          <Card padding="md" className={styles.card}>
            <h2 className={styles.cardTitle}>Status History Log</h2>
            <div className={styles.timeline}>
              {history.map((step: any) => (
                <div key={step.id} className={styles.timelineItem}>
                  <div className={styles.timelineHeader}>
                    <Badge variant="primary">{step.toStatus}</Badge>
                    <span className={styles.timelineDate}>
                      {new Date(step.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {step.note && <p className={styles.timelineNote}>{step.note}</p>}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Shipping address & payment summary details Column */}
        <div className={styles.rightColumn}>
          {/* Status badge summary */}
          <Card padding="md" className={`${styles.card} ${styles.statusCard}`}>
            <div className={styles.statusRow}>
              <span>Order Status:</span>
              <Badge variant="primary">{order.status}</Badge>
            </div>
            <div className={styles.statusRow}>
              <span>Payment Status:</span>
              <Badge variant={order.paymentStatus === 'COMPLETED' ? 'success' : 'warning'}>
                {order.paymentStatus}
              </Badge>
            </div>
            {order.trackingNumber && (
              <div className={styles.statusRow}>
                <span>Tracking ID:</span>
                <code>{order.trackingNumber}</code>
              </div>
            )}
          </Card>

          {/* Shipping Address Summary */}
          <Card padding="md" className={styles.card}>
            <h2 className={styles.cardTitle}>Shipping Destination</h2>
            <div className={styles.addressBlock}>
              <strong>{address.fullName}</strong>
              <div>{address.addressLine1}</div>
              {address.addressLine2 && <div>{address.addressLine2}</div>}
              <div>
                {address.city}, {address.state} {address.zipCode}
              </div>
              <div>{address.country}</div>
              {address.phone && <div className={styles.addressPhone}>Phone: {address.phone}</div>}
            </div>
          </Card>

          {/* Checkout Payment Calculations */}
          <Card padding="md" className={styles.card}>
            <h2 className={styles.cardTitle}>Payment Breakdown</h2>
            <div className={styles.breakdownRow}>
              <span>Subtotal</span>
              <span>${Number(order.subtotal).toFixed(2)}</span>
            </div>
            {Number(order.discountAmount) > 0 && (
              <div className={`${styles.breakdownRow} ${styles.discountText}`}>
                <span>Discount</span>
                <span>-${Number(order.discountAmount).toFixed(2)}</span>
              </div>
            )}
            <div className={styles.breakdownRow}>
              <span>Delivery Shipping</span>
              <span>${Number(order.shippingAmount).toFixed(2)}</span>
            </div>
            <div className={styles.breakdownRow}>
              <span>Estimated Tax</span>
              <span>${Number(order.taxAmount).toFixed(2)}</span>
            </div>
            <div className={styles.divider}></div>
            <div className={`${styles.breakdownRow} ${styles.totalText}`}>
              <span>Grand Total</span>
              <span>${Number(order.totalAmount).toFixed(2)}</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
